using TodoList.Domain.Enums;

namespace TodoList.Application.DTOs;

public record TodoItemDto(
    int Id,
    string Title,
    string? Description,
    bool IsCompleted,
    TodoPriority Priority,
    DateTime? DueDate,
    DateTime CreatedAt);
