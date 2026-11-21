using Microsoft.Extensions.DependencyInjection;
using TodoList.Application.Services;

namespace TodoList.Application;

public static class ApplicationServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ITodoItemService, TodoItemService>();
        return services;
    }
}
