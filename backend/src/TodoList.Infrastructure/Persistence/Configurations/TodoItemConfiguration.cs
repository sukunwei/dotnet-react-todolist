using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using TodoList.Domain.Entities;
using TodoList.Domain.Enums;

namespace TodoList.Infrastructure.Persistence.Configurations;

public class TodoItemConfiguration : IEntityTypeConfiguration<TodoItem>
{
    private static readonly ValueConverter<DateTime, DateTime> UtcConverter =
        new(v => v.ToUniversalTime(), v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

    private static readonly ValueConverter<DateTime?, DateTime?> NullableUtcConverter =
        new(
            v => v.HasValue ? v.Value.ToUniversalTime() : v,
            v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v);

    public void Configure(EntityTypeBuilder<TodoItem> builder)
    {
        builder.ToTable("todo_items");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();

        builder.Property(x => x.Title).HasColumnName("title").HasMaxLength(100).IsRequired();
        builder.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
        builder.Property(x => x.IsCompleted).HasColumnName("is_completed").IsRequired().HasDefaultValue(false);
        builder.Property(x => x.Priority).HasColumnName("priority").IsRequired().HasDefaultValue(TodoPriority.Medium);
        builder.Property(x => x.DueDate).HasColumnName("due_date").HasConversion(NullableUtcConverter);
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired().HasConversion(UtcConverter);

        builder.HasIndex(x => x.IsCompleted).HasDatabaseName("IX_todo_items_is_completed");
        builder.HasIndex(x => x.CreatedAt).HasDatabaseName("IX_todo_items_created_at");
        builder.HasIndex(x => x.DueDate).HasDatabaseName("IX_todo_items_due_date");
    }
}
