using System.Text;
using System.Text.Json.Serialization;
using Api;
using Api.Services;
using DataAccess;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Mqtt.Controllers;
using NSwag;
using NSwag.Generation.Processors.Security;
using StackExchange.Redis;
using StateleSSE.AspNetCore;
using StateleSSE.AspNetCore.Extensions;
using StateleSSE.AspNetCore.EfRealtime;
using StateleSSE.AspNetCore.GroupRealtime;

var builder = WebApplication.CreateBuilder(args);

var cs = new ConnectionStrings();
builder.Configuration.GetSection(nameof(ConnectionStrings)).Bind(cs);
builder.Services.AddSingleton(cs);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cs.Secret)),
            ClockSkew = TimeSpan.FromSeconds(10)
        };
    });
builder.Services.AddAuthorization();

builder.Services.Configure<HostOptions>(opts => opts.ShutdownTimeout = TimeSpan.FromSeconds(0));

// Redis backplane
builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
{
    var cfg = ConfigurationOptions.Parse(cs.Redis);
    cfg.AbortOnConnectFail = false;
    return ConnectionMultiplexer.Connect(cfg);
});
builder.Services.AddRedisSseBackplane();

// EF realtime + group realtime
builder.Services.AddEfRealtime();
builder.Services.AddGroupRealtime();

// DbContext + interceptor
builder.Services.AddDbContext<MyDbContext>((sp, conf) =>
{
    conf.AddEfRealtimeInterceptor(sp);
    conf.UseNpgsql(cs.DbConnectionString);
});

builder.Services.AddOpenApiDocument(config =>
{
    config.AddSecurity("Bearer", new OpenApiSecurityScheme
    {
        Type = OpenApiSecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Enter your JWT token"
    });
    config.OperationProcessors.Add(new AspNetCoreOperationSecurityScopeProcessor("Bearer"));
});

builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = ctx =>
    {
        var ex = ctx.HttpContext.Features.Get<IExceptionHandlerFeature>()?.Error;
        if (ex != null) ctx.ProblemDetails.Detail = ex.Message;
    };
});

builder.Services.AddSingleton<JwtService>();
builder.Services.AddSingleton<ICommandValidationService, CommandValidationService>();
builder.Services.AddScoped<Seeder>();
builder.Services.AddHostedService<Api.Services.MqttConnectorHostedService>(); 

builder.Services.AddMqttControllers();

builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    o.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddCors();

var app = builder.Build();

app.UseExceptionHandler();
app.UseOpenApi();
app.UseSwaggerUi();

app.UseCors(c => c.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin().SetIsOriginAllowed(_ => true));

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<Seeder>().Seed();
}

app.Run();