// FILE: server/api/Controllers/WindmillMqttController.cs
using Api.DTOs;
using DataAccess;
using DataAccess.Entities;
using Microsoft.Extensions.DependencyInjection;
using Mqtt.Controllers;

namespace Api.Controllers;

public sealed class WindmillMqttController(
    ILogger<WindmillMqttController> logger,
    IServiceScopeFactory scopeFactory
) : MqttController
{
    [MqttRoute("farm/{farmId}/windmill/{turbineId}/telemetry")]
    public async Task HandleTelemetry(string farmId, string turbineId, WindmillTelemetryDto data)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<MyDbContext>();

            var row = new WindmillTelemetry
            {
                Id = Guid.NewGuid(),
                FarmId = farmId,
                WindmillId = turbineId,
                Timestamp = data.Timestamp == default ? DateTimeOffset.UtcNow : data.Timestamp,
                WindSpeed = data.WindSpeed,
                WindDirection = data.WindDirection,
                AmbientTemperature = data.AmbientTemperature,
                RotorSpeed = data.RotorSpeed,
                PowerOutput = data.PowerOutput,
                NacelleDirection = data.NacelleDirection,
                BladePitch = data.BladePitch,
                GeneratorTemp = data.GeneratorTemp,
                GearboxTemp = data.GearboxTemp,
                Vibration = data.Vibration,
                Status = string.IsNullOrWhiteSpace(data.Status) ? "unknown" : data.Status
            };

            db.Telemetry.Add(row);

            if (row.Vibration > 5.0)
            {
                db.Alerts.Add(new Alert
                {
                    Id = Guid.NewGuid(),
                    FarmId = farmId,
                    WindmillId = turbineId,
                    Timestamp = row.Timestamp,
                    Severity = "warning",
                    Code = "VIBRATION_HIGH",
                    Message = $"Vibration high: {row.Vibration}"
                });
            }

            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Telemetry insert failed farm={FarmId} turbine={TurbineId}", farmId, turbineId);
        }
    }
}