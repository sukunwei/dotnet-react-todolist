using TodoList.Application.DTOs;
using TodoList.Domain.Enums;

namespace TodoList.Application.Services;

public interface ITodoItemService
{
    Task<TodoListResponse> GetListAsync(TodoFilter filter, TodoSort sort, CancellationToken ct = default);
    Task<TodoItemDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<TodoItemDto> CreateAsync(CreateTodoItemRequest request, CancellationToken ct = default);
    Task<TodoItemDto> UpdateAsync(int id, UpdateTodoItemRequest request, CancellationToken ct = default);
    Task<TodoItemDto> SetCompletionAsync(int id, bool isCompleted, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
    Task<int> ClearCompletedAsync(CancellationToken ct = default);
}
