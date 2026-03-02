using System.Text.Json;

namespace Api.Services;

public interface ICommandValidationService
{
    void Validate(string action, JsonElement payload);
}

public sealed class CommandValidationService : ICommandValidationService
{
    public void Validate(string action, JsonElement payload)
    {
        if (string.IsNullOrWhiteSpace(action))
            throw new ArgumentException("action is required");

        if (payload.ValueKind != JsonValueKind.Object)
            throw new ArgumentException("payload must be an object");

        switch (action)
        {
            case "setInterval":
            {
                var value = ReadInt(payload, "value");
                if (value is < 1 or > 60) throw new ArgumentException("value must be 1-60 seconds");
                break;
            }
            case "stop":
                break;
            case "start":
                break;
            case "setPitch":
            {
                var angle = ReadDouble(payload, "angle");
                if (angle is < 0 or > 30) throw new ArgumentException("angle must be 0-30 degrees");
                break;
            }
            default:
                throw new ArgumentException("Unknown action");
        }
    }

    private static int ReadInt(JsonElement payload, string name)
    {
        if (payload.TryGetProperty(name, out var prop) &&
            prop.ValueKind == JsonValueKind.Number &&
            prop.TryGetInt32(out var value))
            return value;

        throw new ArgumentException($"{name} is required and must be an int");
    }

    private static double ReadDouble(JsonElement payload, string name)
    {
        if (payload.TryGetProperty(name, out var prop) &&
            prop.ValueKind == JsonValueKind.Number &&
            prop.TryGetDouble(out var value))
            return value;

        throw new ArgumentException($"{name} is required and must be a number");
    }
}