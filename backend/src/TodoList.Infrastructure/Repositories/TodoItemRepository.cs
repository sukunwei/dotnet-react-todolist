using Microsoft.EntityFrameworkCore;
using TodoList.Domain.Entities;
using TodoList.Domain.Enums;
using TodoList.Domain.Queries;
using TodoList.Domain.Repositories;
using TodoList.Infrastructure.Persistence;

namespace TodoList.Infrastructure.Repositories;

public class TodoItemRepository(AppDbContext dbContext) : ITodoItemRepository
{
    private readonly AppDbContext _dbContext = dbContext;

    public async Task<IReadOnlyList<TodoItem>> GetAllAsync(
        TodoFilter filter,
        TodoSort sort,
        CancellationToken ct = default)
    {
        IQueryable<TodoItem> query = _dbContext.TodoItems.AsNoTracking();

        query = filter switch
        {
            TodoFilter.Active => query.Where(x => !x.IsCompleted),
            TodoFilter.Completed => query.Where(x => x.IsCompleted),
            _ => query
        };

        query = sort switch
        {
            // 有截止日期者在前並依日期升冪，無日期者一律排在最後
            // （MySQL 在 ASC 排序時會把 NULL 排在最前，故以第一個排序鍵明確排除：
            //   有截止日期 → 0（排在前面）、無截止日期 → 1（排在最後））
            TodoSort.DueDate => query
                .OrderBy(x => x.DueDate.HasValue ? 0 : 1)
                .ThenBy(x => x.DueDate)
                .ThenBy(x => x.Id),
            _ => query
                .OrderByDescending(x => x.CreatedAt)
                .ThenByDescending(x => x.Id)
        };

        return await query.ToListAsync(ct);
    }

    public async Task<TodoItem?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _dbContext.TodoItems
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);
    }

    public async Task<TodoItem> AddAsync(TodoItem item, CancellationToken ct = default)
    {
        await _dbContext.TodoItems.AddAsync(item, ct);
        await _dbContext.SaveChangesAsync(ct);
        return item;
    }

    public async Task UpdateAsync(TodoItem item, CancellationToken ct = default)
    {
        _dbContext.TodoItems.Attach(item);

        _dbContext.Entry(item).Property(x => x.Title).IsModified = true;
        _dbContext.Entry(item).Property(x => x.Description).IsModified = true;
        _dbContext.Entry(item).Property(x => x.IsCompleted).IsModified = true;
        _dbContext.Entry(item).Property(x => x.Priority).IsModified = true;
        _dbContext.Entry(item).Property(x => x.DueDate).IsModified = true;
        _dbContext.Entry(item).Property(x => x.CreatedAt).IsModified = true;

        await _dbContext.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var item = await _dbContext.TodoItems
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        if (item is null)
        {
            return false;
        }

        _dbContext.TodoItems.Remove(item);
        await _dbContext.SaveChangesAsync(ct);
        return true;
    }

    public async Task<int> DeleteCompletedAsync(CancellationToken ct = default)
    {
        return await _dbContext.TodoItems
            .Where(x => x.IsCompleted)
            .ExecuteDeleteAsync(ct);
    }

    public async Task<TodoCounts> GetCountsAsync(CancellationToken ct = default)
    {
        // 單一 GroupBy 查詢取得分組數量，避免三次 COUNT 往返
        var groups = await _dbContext.TodoItems
            .AsNoTracking()
            .GroupBy(x => x.IsCompleted)
            .Select(g => new { IsCompleted = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var total = groups.Sum(g => g.Count);
        var completed = groups.Where(g => g.IsCompleted).Sum(g => g.Count);
        var active = total - completed;

        return new TodoCounts(total, active, completed);
    }
}
