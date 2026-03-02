namespace DataAccess.Entities;

public sealed class Alert
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public required string FarmId { get; set; }
    public required string WindmillId { get; set; }

    public DateTimeOffset Timestamp { get; set; }

    public required string Severity { get; set; }
    public required string Code { get; set; }
    public required string Message { get; set; }
}