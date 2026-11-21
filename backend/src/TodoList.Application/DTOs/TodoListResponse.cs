namespace TodoList.Application.DTOs;

public record TodoListResponse(IReadOnlyList<TodoItemDto> Items, TodoCountsDto Counts);
