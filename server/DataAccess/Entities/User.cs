namespace DataAccess.Entities;

public sealed class User
{
    public required string Id { get; set; }
    public required string Nickname { get; set; }
    public required string Salt { get; set; }
    public required string Hash { get; set; }
}