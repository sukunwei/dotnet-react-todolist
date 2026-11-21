using TodoList.Application.DTOs;
using TodoList.Domain.Entities;
using TodoList.Domain.Queries;

namespace TodoList.Application.Mapping;

public static class TodoItemMapping
{
    public static TodoItemDto ToDto(this TodoItem item) => new(
        item.Id,
        item.Title,
        item.Description,
        item.IsCompleted,
        item.Priority,
        item.DueDate,
        item.CreatedAt);

    public static TodoCountsDto ToCountsDto(this TodoCounts counts) =>
        new(counts.All, counts.Active, counts.Completed);
}
