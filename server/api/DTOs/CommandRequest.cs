using System.Text.Json;

namespace Api.DTOs;

public sealed record CommandRequest(string Action, JsonElement Payload);