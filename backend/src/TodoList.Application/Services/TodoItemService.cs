using TodoList.Application.Common;
using TodoList.Application.DTOs;
using TodoList.Application.Mapping;
using TodoList.Domain.Entities;
using TodoList.Domain.Enums;
using TodoList.Domain.Repositories;

namespace TodoList.Application.Services;

public sealed class TodoItemService : ITodoItemService
{
    private const string TitleRequiredMessage = "任務標題為必填欄位。";
    private const string PriorityRangeMessage = "優先級必須為 1（低）、2（中）或 3（高）。";

    private readonly ITodoItemRepository _repository;

    public TodoItemService(ITodoItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<TodoListResponse> GetListAsync(TodoFilter filter, TodoSort sort, CancellationToken ct = default)
    {
        var items = await _repository.GetAllAsync(filter, sort, ct);
        var counts = await _repository.GetCountsAsync(ct);

        return new TodoListResponse(
            items.Select(x => x.ToDto()).ToList(),
            counts.ToCountsDto());
    }

    public async Task<TodoItemDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var item = await _repository.GetByIdAsync(id, ct);
        if (item is null)
        {
            throw new NotFoundException($"找不到 Id 為 {id} 的任務。");
        }

        return item.ToDto();
    }

    public async Task<TodoItemDto> CreateAsync(CreateTodoItemRequest request, CancellationToken ct = default)
    {
        var title = NormalizeTitle(request.Title);
        var description = NormalizeDescription(request.Description);
        var priority = ValidatePriority(request.Priority);
        var dueDate = NormalizeDueDate(request.DueDate);

        var item = new TodoItem
        {
            Title = title,
            Description = description,
            IsCompleted = false,
            Priority = priority,
            DueDate = dueDate,
            CreatedAt = DateTime.UtcNow
        };

        var added = await _repository.AddAsync(item, ct);
        return added.ToDto();
    }

    public async Task<TodoItemDto> UpdateAsync(int id, UpdateTodoItemRequest request, CancellationToken ct = default)
    {
        var item = await _repository.GetByIdAsync(id, ct);
        if (item is null)
        {
            throw new NotFoundException($"找不到 Id 為 {id} 的任務。");
        }

        item.Title = NormalizeTitle(request.Title);
        item.Description = NormalizeDescription(request.Description);
        item.Priority = ValidatePriority(request.Priority);
        item.DueDate = NormalizeDueDate(request.DueDate);

        await _repository.UpdateAsync(item, ct);
        return item.ToDto();
    }

    public async Task<TodoItemDto> SetCompletionAsync(int id, bool isCompleted, CancellationToken ct = default)
    {
        var item = await _repository.GetByIdAsync(id, ct);
        if (item is null)
        {
            throw new NotFoundException($"找不到 Id 為 {id} 的任務。");
        }

        item.IsCompleted = isCompleted;
        await _repository.UpdateAsync(item, ct);
        return item.ToDto();
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var deleted = await _repository.DeleteAsync(id, ct);
        if (!deleted)
        {
            throw new NotFoundException($"找不到 Id 為 {id} 的任務。");
        }
    }

    public async Task<int> ClearCompletedAsync(CancellationToken ct = default)
    {
        return await _repository.DeleteCompletedAsync(ct);
    }

    private static string NormalizeTitle(string? title)
    {
        var trimmed = title?.Trim();
        if (string.IsNullOrEmpty(trimmed))
        {
            throw new ValidationException(TitleRequiredMessage);
        }

        return trimmed;
    }

    private static string? NormalizeDescription(string? description)
    {
        var trimmed = description?.Trim();
        return string.IsNullOrEmpty(trimmed) ? null : trimmed;
    }

    private static TodoPriority ValidatePriority(TodoPriority priority)
    {
        if (priority is not (TodoPriority.Low or TodoPriority.Medium or TodoPriority.High))
        {
            throw new ValidationException(PriorityRangeMessage);
        }

        return priority;
    }

    private static DateTime? NormalizeDueDate(DateTime? dueDate)
    {
        if (dueDate.HasValue && dueDate.Value.Kind != DateTimeKind.Utc)
        {
            return dueDate.Value.ToUniversalTime();
        }

        return dueDate;
    }
}
