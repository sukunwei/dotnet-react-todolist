using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi;
using TodoList.Application;
using TodoList.Infrastructure;

namespace TodoList.Api.Extensions;

/// <summary>
/// API 層的相依性注入註冊入口，統一註冊 Controllers、CORS、Swagger 與各層的服務。
/// </summary>
public static class ApiServiceCollectionExtensions
{
    public static IServiceCollection AddApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddControllers();

        services.AddCors(options => options.AddDefaultPolicy(policy => policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()));

        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c => c.SwaggerDoc("v1", new OpenApiInfo { Title = "TodoList API", Version = "v1" }));

        services.AddApplication();
        services.AddInfrastructure(configuration);

        return services;
    }
}
