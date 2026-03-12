using DataAccess;
using DataAccess.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StateleSSE.AspNetCore;
using StateleSSE.AspNetCore.EfRealtime;
using StateleSSE.AspNetCore.GroupRealtime;

namespace Api.Controllers;

public sealed record FarmRealtimePayload(
    IReadOnlyList<WindmillTelemetry> Telemetry,
    IReadOnlyList<Alert> Alerts
);

[ApiController]
[Route("api/realtime")]
public sealed class RealtimeSubscriptionsController(
    ISseBackplane backplane,
    IRealtimeManager realtimeManager,
    IGroupRealtimeManager groupRealtimeManager,
    MyDbContext db
) : ControllerBase
{
    private static readonly TimeSpan TelemetryWindow = TimeSpan.FromMinutes(30);

    [HttpGet("farm/{farmId}/listen")]
    public async Task<RealtimeListenResponse<FarmRealtimePayload>> ListenFarm(
        string farmId,
        [FromQuery] string connectionId)
    {
        var group = $"farm:{farmId}";
        await backplane.Groups.AddToGroupAsync(connectionId, group);

        realtimeManager.Subscribe<MyDbContext>(
            connectionId,
            group,
            criteria: snapshot => snapshot.HasChanges<WindmillTelemetry>() || snapshot.HasChanges<Alert>(),
            query: async ctx => await QueryFarmAsync(ctx, farmId));

        var initial = await QueryFarmAsync(db, farmId);
        
        await backplane.Clients.SendToClientAsync(connectionId, initial);

        return new RealtimeListenResponse<FarmRealtimePayload>(group, initial);
    }

    [HttpGet("farm/{farmId}/turbine/{turbineId}/listen")]
    public async Task<RealtimeListenResponse<FarmRealtimePayload>> ListenTurbine(
        string farmId,
        string turbineId,
        [FromQuery] string connectionId)
    {
        var group = $"farm:{farmId}:turbine:{turbineId}";
        await backplane.Groups.AddToGroupAsync(connectionId, group);

        realtimeManager.Subscribe<MyDbContext>(
            connectionId,
            group,
            criteria: snapshot => snapshot.HasChanges<WindmillTelemetry>() || snapshot.HasChanges<Alert>(),
            query: async ctx => await QueryTurbineAsync(ctx, farmId, turbineId));

        var initial = await QueryTurbineAsync(db, farmId, turbineId);

        await backplane.Clients.SendToClientAsync(connectionId, initial);

        return new RealtimeListenResponse<FarmRealtimePayload>(group, initial);
    }

    private static async Task<FarmRealtimePayload> QueryFarmAsync(MyDbContext ctx, string farmId)
    {
        var cutoff = DateTimeOffset.UtcNow.Subtract(TelemetryWindow);

        var telemetry = await ctx.Telemetry.AsNoTracking()
            .Where(x => x.FarmId == farmId && x.Timestamp >= cutoff)
            .OrderByDescending(x => x.Timestamp)
            .Take(200)
            .ToListAsync();

        var alerts = await ctx.Alerts.AsNoTracking()
            .Where(x => x.FarmId == farmId)
            .OrderByDescending(x => x.Timestamp)
            .Take(50)
            .ToListAsync();

        telemetry.Reverse();
        alerts.Reverse();

        return new FarmRealtimePayload(telemetry, alerts);
    }

    private static async Task<FarmRealtimePayload> QueryTurbineAsync(MyDbContext ctx, string farmId, string turbineId)
    {
        var cutoff = DateTimeOffset.UtcNow.Subtract(TelemetryWindow);

        var telemetry = await ctx.Telemetry.AsNoTracking()
            .Where(x => x.FarmId == farmId && x.WindmillId == turbineId && x.Timestamp >= cutoff)
            .OrderByDescending(x => x.Timestamp)
            .Take(200)
            .ToListAsync();

        var alerts = await ctx.Alerts.AsNoTracking()
            .Where(x => x.FarmId == farmId && x.WindmillId == turbineId)
            .OrderByDescending(x => x.Timestamp)
            .Take(50)
            .ToListAsync();

        telemetry.Reverse();
        alerts.Reverse();

        return new FarmRealtimePayload(telemetry, alerts);
    }
}