namespace DataAccess.Entities;

public sealed class Farm
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string CreatedBy { get; set; }
}