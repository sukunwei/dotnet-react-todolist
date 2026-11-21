using TodoList.Domain.Entities;
using TodoList.Domain.Enums;
using TodoList.Domain.Queries;

namespace TodoList.Domain.Repositories;

public interface ITodoItemRepository
{
    Task<IReadOnlyList<TodoItem>> GetAllAsync(TodoFilter filter, TodoSort sort, CancellationToken ct = default);
    Task<TodoItem?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<TodoItem> AddAsync(TodoItem item, CancellationToken ct = default);
    Task UpdateAsync(TodoItem item, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<int> DeleteCompletedAsync(CancellationToken ct = default);
    Task<TodoCounts> GetCountsAsync(CancellationToken ct = default);
}
