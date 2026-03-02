namespace DataAccess.Entities;

public sealed class OperatorAction
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public required string FarmId { get; set; }
    public required string WindmillId { get; set; }

    public DateTimeOffset Timestamp { get; set; }

    public required string OperatorUserId { get; set; }
    public required string CommandType { get; set; }
    public required string PayloadJson { get; set; }
}