using Microsoft.AspNetCore.Mvc;
using TodoList.Application.DTOs;
using TodoList.Application.Services;
using TodoList.Domain.Enums;

namespace TodoList.Api.Controllers;

/// <summary>
/// 待辦事項 API。所有端點的路由前綴為 <c>/api/todos</c>。
/// </summary>
[ApiController]
[Route("api/todos")]
public class TodoItemsController(ITodoItemService service) : ControllerBase
{
    /// <summary>
    /// 取得待辦事項清單。
    /// </summary>
    /// <param name="filter">
    /// 篩選條件，允許值：<c>all</c>、<c>active</c>、<c>completed</c>。缺漏時預設為 <c>all</c>；
    /// 值無效時回傳 400。
    /// </param>
    /// <param name="sort">
    /// 排序依據，允許值：<c>createdAt</c>、<c>dueDate</c>。缺漏時預設為 <c>createdAt</c>；
    /// 值無效時回傳 400。
    /// </param>
    /// <param name="ct">取消權杖。</param>
    /// <response code="200">回傳待辦事項清單與統計數量。</response>
    /// <response code="400"><c>filter</c> 或 <c>sort</c> 參數無效。</response>
    [HttpGet]
    [ProducesResponseType(typeof(TodoListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TodoListResponse>> GetList(
        [FromQuery] string? filter,
        [FromQuery] string? sort,
        CancellationToken ct)
    {
        if (!TryParseFilter(filter, out var parsedFilter))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Bad Request",
                Status = StatusCodes.Status400BadRequest,
                Detail = "filter 參數無效，允許值：all、active、completed"
            });
        }

        if (!TryParseSort(sort, out var parsedSort))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Bad Request",
                Status = StatusCodes.Status400BadRequest,
                Detail = "sort 參數無效，允許值：createdAt、dueDate"
            });
        }

        var response = await service.GetListAsync(parsedFilter, parsedSort, ct);
        return Ok(response);
    }

    /// <summary>
    /// 取得單一待辦事項。
    /// </summary>
    /// <param name="id">待辦事項的識別碼。</param>
    /// <param name="ct">取消權杖。</param>
    /// <response code="200">回傳指定的待辦事項。</response>
    /// <response code="404">找不到指定的待辦事項。</response>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(TodoItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TodoItemDto>> GetById(int id, CancellationToken ct)
    {
        var dto = await service.GetByIdAsync(id, ct);
        return Ok(dto);
    }

    /// <summary>
    /// 建立新的待辦事項。
    /// </summary>
    /// <param name="request">
    /// 建立請求。當中 <c>dueDate</c> 必須為帶有位移量（offset）或 <c>Z</c> 的 ISO-8601 時間，
    /// 例如 <c>2026-11-25T10:00:00+08:00</c> 或 <c>2026-11-25T02:00:00Z</c>；
    /// 若省略位移量，該值會被視為 <see cref="DateTimeKind.Unspecified"/> 並依伺服器所在時區位移，
    /// 導致儲存的到期時間偏移。
    /// </param>
    /// <param name="ct">取消權杖。</param>
    /// <response code="201">建立成功，並於 <c>Location</c> 標頭回傳新資源的網址。</response>
    /// <response code="400">請求內容未通過驗證。</response>
    [HttpPost]
    [ProducesResponseType(typeof(TodoItemDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TodoItemDto>> Create([FromBody] CreateTodoItemRequest request, CancellationToken ct)
    {
        var dto = await service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    /// <summary>
    /// 更新指定的待辦事項（全量更新語義，標題仍為必填）。
    /// </summary>
    /// <param name="id">待辦事項的識別碼。</param>
    /// <param name="request">
    /// 更新請求。當中 <c>dueDate</c> 必須為帶有位移量（offset）或 <c>Z</c> 的 ISO-8601 時間，
    /// 例如 <c>2026-11-25T10:00:00+08:00</c> 或 <c>2026-11-25T02:00:00Z</c>；
    /// 若省略位移量，該值會被視為 <see cref="DateTimeKind.Unspecified"/> 並依伺服器所在時區位移，
    /// 導致儲存的到期時間偏移。
    /// </param>
    /// <param name="ct">取消權杖。</param>
    /// <response code="200">更新成功並回傳更新後的待辦事項。</response>
    /// <response code="400">請求內容未通過驗證。</response>
    /// <response code="404">找不到指定的待辦事項。</response>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(TodoItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TodoItemDto>> Update(int id, [FromBody] UpdateTodoItemRequest request, CancellationToken ct)
    {
        var dto = await service.UpdateAsync(id, request, ct);
        return Ok(dto);
    }

    /// <summary>
    /// 設定指定待辦事項的完成狀態。
    /// </summary>
    /// <param name="id">待辦事項的識別碼。</param>
    /// <param name="request">完成狀態請求，<c>isCompleted</c> 為 <c>true</c> 表示已完成。</param>
    /// <param name="ct">取消權杖。</param>
    /// <response code="200">更新成功並回傳更新後的待辦事項。</response>
    /// <response code="404">找不到指定的待辦事項。</response>
    [HttpPatch("{id:int}/status")]
    [ProducesResponseType(typeof(TodoItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TodoItemDto>> SetCompletion(int id, [FromBody] SetCompletionRequest request, CancellationToken ct)
    {
        var dto = await service.SetCompletionAsync(id, request.IsCompleted, ct);
        return Ok(dto);
    }

    /// <summary>
    /// 刪除指定的待辦事項。
    /// </summary>
    /// <param name="id">待辦事項的識別碼。</param>
    /// <param name="ct">取消權杖。</param>
    /// <response code="204">刪除成功，無回應內容。</response>
    /// <response code="404">找不到指定的待辦事項。</response>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await service.DeleteAsync(id, ct);
        return NoContent();
    }

    /// <summary>
    /// 清除所有已完成的待辦事項。
    /// </summary>
    /// <param name="ct">取消權杖。</param>
    /// <response code="204">清除成功，無回應內容。</response>
    [HttpDelete("completed")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ClearCompleted(CancellationToken ct)
    {
        await service.ClearCompletedAsync(ct);
        return NoContent();
    }

    /// <summary>
    /// 解析篩選參數。缺漏時使用預設值 <see cref="TodoFilter.All"/>；
    /// 無法解析或不是已定義的列舉值時回傳 <c>false</c>。
    /// </summary>
    private static bool TryParseFilter(string? value, out TodoFilter filter)
    {
        filter = TodoFilter.All;

        if (string.IsNullOrWhiteSpace(value))
        {
            return true;
        }

        if (!Enum.TryParse(value, ignoreCase: true, out TodoFilter parsed) || !Enum.IsDefined(parsed))
        {
            return false;
        }

        filter = parsed;
        return true;
    }

    /// <summary>
    /// 解析排序參數。缺漏時使用預設值 <see cref="TodoSort.CreatedAt"/>；
    /// 無法解析或不是已定義的列舉值時回傳 <c>false</c>。
    /// </summary>
    private static bool TryParseSort(string? value, out TodoSort sort)
    {
        sort = TodoSort.CreatedAt;

        if (string.IsNullOrWhiteSpace(value))
        {
            return true;
        }

        if (!Enum.TryParse(value, ignoreCase: true, out TodoSort parsed) || !Enum.IsDefined(parsed))
        {
            return false;
        }

        sort = parsed;
        return true;
    }
}
