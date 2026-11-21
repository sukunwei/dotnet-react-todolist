using Microsoft.EntityFrameworkCore;
using TodoList.Api.Extensions;
using TodoList.Api.Middleware;
using TodoList.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApiServices(builder.Configuration);

var app = builder.Build();

// 例外處理中介層必須位於 CORS 之前，才能將例外轉換為 ProblemDetails 回應。
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

// 啟動時自動套用資料庫 Migration；若失敗則讓應用啟動失敗，不予忽略。
await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

await app.RunAsync();
