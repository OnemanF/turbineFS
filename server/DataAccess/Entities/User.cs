namespace DataAccess.Entities;

public sealed class User
{
    public string Id { get; set; } = default!;
    public string Nickname { get; set; } = default!;
    public string Salt { get; set; } = default!;
    public string Hash { get; set; } = default!;
    public string Role { get; set; } = "Operator"; 
}