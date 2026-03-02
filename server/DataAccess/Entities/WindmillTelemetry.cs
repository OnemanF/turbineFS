namespace DataAccess.Entities;

public sealed class WindmillTelemetry
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public required string FarmId { get; set; }
    public required string WindmillId { get; set; } 

    public DateTimeOffset Timestamp { get; set; }

    // Matches screenshot payload
    public double WindSpeed { get; set; }
    public double WindDirection { get; set; }
    public double AmbientTemperature { get; set; }
    public double RotorSpeed { get; set; }
    public double PowerOutput { get; set; }
    public double NacelleDirection { get; set; }
    public double BladePitch { get; set; }
    public double GeneratorTemp { get; set; }
    public double GearboxTemp { get; set; }
    public double Vibration { get; set; }

    public required string Status { get; set; } 
}