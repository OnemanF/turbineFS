// FILE: server/api/Services/MqttConnectorHostedService.cs
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Mqtt.Controllers;

namespace Api.Services;

public sealed class MqttConnectorHostedService(
    ILogger<MqttConnectorHostedService> logger,
    IMqttClientService mqtt,
    ConnectionStrings cs
) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(cs.MqttBroker) || cs.MqttPort <= 0)
        {
            logger.LogWarning("MQTT disabled (no broker/port configured).");
            return;
        }

        var delay = TimeSpan.FromSeconds(2);

        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                var useTls = cs.MqttPort == 8883;
                await mqtt.ConnectAsync(cs.MqttBroker, cs.MqttPort, "", "", useTls: useTls);
                logger.LogInformation("MQTT connected to {Host}:{Port} (TLS={Tls})", cs.MqttBroker, cs.MqttPort, useTls);
                return;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "MQTT connect failed. Retrying in {Delay}s...", delay.TotalSeconds);
                await Task.Delay(delay, cancellationToken);
                delay = TimeSpan.FromSeconds(Math.Min(delay.TotalSeconds * 2, 30));
            }
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}