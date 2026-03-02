using System.Security.Claims;
using System.Text.Json;
using Api.DTOs;
using Api.Services;
using DataAccess;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mqtt.Controllers;
using StateleSSE.AspNetCore;

namespace Api.Controllers;

[ApiController]
[Route("api/farms")]
public sealed class WindmillWebController(
    IMqttClientService mqtt,
    ICommandValidationService validator,
    MyDbContext db,
    ISseBackplane backplane
) : RealtimeControllerBase(backplane)
{
    [HttpGet("{farmId}/windmills")]
    public async Task<ActionResult<List<Windmill>>> GetWindmills(string farmId)
        => Ok(await db.Windmills.AsNoTracking()
            .Where(x => x.FarmId == farmId)
            .OrderBy(x => x.Id)
            .ToListAsync());

    [HttpGet("{farmId}/windmills/{turbineId}/telemetry")]
    public async Task<ActionResult<List<WindmillTelemetry>>> GetTelemetryHistory(
        string farmId,
        string turbineId,
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        [FromQuery] int take = 2000)
    {
        var q = db.Telemetry.AsNoTracking()
            .Where(x => x.FarmId == farmId && x.WindmillId == turbineId);

        if (from is not null) q = q.Where(x => x.Timestamp >= from);
        if (to is not null) q = q.Where(x => x.Timestamp <= to);

        var data = await q.OrderByDescending(x => x.Timestamp)
            .Take(Math.Clamp(take, 1, 10000))
            .ToListAsync();

        data.Reverse();
        return Ok(data);
    }

    [HttpGet("{farmId}/windmills/{turbineId}/alerts")]
    public async Task<ActionResult<List<Alert>>> GetAlerts(
        string farmId,
        string turbineId,
        [FromQuery] int take = 200)
        => Ok(await db.Alerts.AsNoTracking()
            .Where(x => x.FarmId == farmId && x.WindmillId == turbineId)
            .OrderByDescending(x => x.Timestamp)
            .Take(Math.Clamp(take, 1, 1000))
            .ToListAsync());

    [Authorize]
    [HttpPost("{farmId}/windmills/{turbineId}/command")]
    public async Task<IActionResult> SendCommand(string farmId, string turbineId, [FromBody] CommandRequest req)
    {
        validator.Validate(req.Action, req.Payload);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown";

        var action = new OperatorAction
        {
            FarmId = farmId,
            WindmillId = turbineId,
            Timestamp = DateTimeOffset.UtcNow,
            OperatorUserId = userId,
            CommandType = req.Action,
            PayloadJson = req.Payload.GetRawText()
        };

        db.OperatorActions.Add(action);
        await db.SaveChangesAsync();

        var topic = $"farm/{farmId}/windmill/{turbineId}/command";
        var message = MergeFlatJson(req.Action, req.Payload);
        await mqtt.PublishAsync(topic, message);

        return Accepted(new { action.Id, action.Timestamp });
    }

    private static string MergeFlatJson(string action, JsonElement payload)
    {
        if (payload.ValueKind != JsonValueKind.Object)
            throw new ArgumentException("payload must be an object");

        var dict = new Dictionary<string, object?> { ["action"] = action };

        foreach (var prop in payload.EnumerateObject())
            dict[prop.Name] = JsonElementToObject(prop.Value);

        return JsonSerializer.Serialize(dict);

        static object? JsonElementToObject(JsonElement e) =>
            e.ValueKind switch
            {
                JsonValueKind.String => e.GetString(),
                JsonValueKind.Number => e.TryGetInt64(out var i) ? i : e.GetDouble(),
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                JsonValueKind.Object => JsonSerializer.Deserialize<Dictionary<string, object?>>(e.GetRawText()),
                JsonValueKind.Array => JsonSerializer.Deserialize<List<object?>>(e.GetRawText()),
                _ => null
            };
    }
    
    
}
