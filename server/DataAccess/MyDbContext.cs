using DataAccess.Entities;
using Microsoft.EntityFrameworkCore;

namespace DataAccess;

public sealed class MyDbContext(DbContextOptions<MyDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Farm> Farms => Set<Farm>();
    public DbSet<Windmill> Windmills => Set<Windmill>();
    public DbSet<WindmillTelemetry> Telemetry => Set<WindmillTelemetry>();
    public DbSet<Alert> Alerts => Set<Alert>();
    public DbSet<OperatorAction> OperatorActions => Set<OperatorAction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {

        modelBuilder.Entity<WindmillTelemetry>()
            .HasIndex(x => new { x.FarmId, x.WindmillId, x.Timestamp });

        modelBuilder.Entity<Alert>()
            .HasIndex(x => new { x.FarmId, x.WindmillId, x.Timestamp });

        modelBuilder.Entity<OperatorAction>()
            .HasIndex(x => new { x.FarmId, x.WindmillId, x.Timestamp });
    }
}