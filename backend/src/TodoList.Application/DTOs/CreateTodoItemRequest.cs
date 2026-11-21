using System.ComponentModel.DataAnnotations;
using TodoList.Domain.Enums;

namespace TodoList.Application.DTOs;

public class CreateTodoItemRequest
{
    [Required(ErrorMessage = "任務標題為必填欄位。")]
    [StringLength(100, ErrorMessage = "任務標題不得超過 100 個字元。")]
    public string Title { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "詳細備註不得超過 500 個字元。")]
    public string? Description { get; set; }

    [Range(1, 3, ErrorMessage = "優先級必須為 1（低）、2（中）或 3（高）。")]
    public TodoPriority Priority { get; set; } = TodoPriority.Medium;

    public DateTime? DueDate { get; set; }
}
