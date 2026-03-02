namespace DataAccess.Entities;

public sealed class Windmill
{
    public required string Id { get; set; }        
    public required string FarmId { get; set; }    
    public required string Name { get; set; }       
    public required string Location { get; set; } 
}