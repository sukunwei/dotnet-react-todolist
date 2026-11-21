using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using TodoList.Application.Common;

namespace TodoList.Api.Middleware;

/// <summary>
/// 攔截所有未處理的例外，並轉換為 RFC 7807 的 <see cref="ProblemDetails"/> 回應。
/// <list type="bullet">
/// <item><see cref="NotFoundException"/> → 404</item>
/// <item><see cref="ValidationException"/> → 400</item>
/// <item>其他例外 → 500（回應內容不含任何例外明細，完整內容僅寫入 ILogger）</item>
/// </list>
/// </summary>
public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    /// <summary>
    /// ProblemDetails 的序列化設定，採 Web 慣例（camelCase）以與 MVC 的 ProblemDetails 輸出一致。
    /// </summary>
    private static readonly JsonSerializerOptions ProblemJsonOptions = new(JsonSerializerDefaults.Web);

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            // 回應已開始寫出時無法再改寫 body，直接讓例外往外拋由伺服器層處理。
            if (context.Response.HasStarted)
            {
                logger.LogError(exception, "回應已開始寫出，例外無法轉換為 ProblemDetails。");
                throw;
            }

            await WriteProblemAsync(context, exception);
        }
    }

    private async Task WriteProblemAsync(HttpContext context, Exception exception)
    {
        var (status, title, detail) = exception switch
        {
            NotFoundException => (StatusCodes.Status404NotFound, "Not Found", exception.Message),
            ValidationException => (StatusCodes.Status400BadRequest, "Bad Request", exception.Message),
            _ => (StatusCodes.Status500InternalServerError, "Internal Server Error", (string?)null)
        };

        if (status == StatusCodes.Status500InternalServerError)
        {
            // 500 不對外揭露例外內容，僅記錄於日誌。
            logger.LogError(exception, "處理請求時發生未預期的例外。");
        }
        else
        {
            logger.LogWarning(exception, "處理請求時發生可預期的例外：{Message}", exception.Message);
        }

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title
        };

        if (detail is not null)
        {
            problem.Detail = detail;
        }

        context.Response.Clear();
        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(problem, ProblemJsonOptions, "application/problem+json");
    }
}
