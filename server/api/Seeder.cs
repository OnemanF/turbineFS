using Api.Security;
using DataAccess;
using DataAccess.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Api;

public sealed class Seeder(MyDbContext db, IConfiguration cfg)
{
    private const string DefaultFarmId = "FeikesWIND";

    public void Seed()
    {
        db.Database.Migrate();

        var adminId = cfg["SeedAdmin:Id"] ?? "u-admin";
        var adminNick = cfg["SeedAdmin:Nickname"] ?? "admin";
        var adminPass = cfg["SeedAdmin:Password"] ?? "adminadmin";
        var adminRole = cfg["SeedAdmin:Role"] ?? "Admin";
        var resetAdmin = bool.TryParse(cfg["SeedAdmin:ResetOnBoot"], out var b) && b;

        UpsertAdmin(adminId, adminNick, adminPass, adminRole, resetAdmin);
        UpsertFarm(DefaultFarmId, "FeikesWIND Farm", adminId);
        UpsertWindmills(DefaultFarmId);

        db.SaveChanges();
    }

    private void UpsertAdmin(string adminId, string adminNick, string adminPass, string adminRole, bool resetAdmin)
    {
        var admin = db.Users.SingleOrDefault(x => x.Id == adminId) ??
                    db.Users.SingleOrDefault(x => x.Nickname == adminNick);

        if (admin is null)
        {
            var (salt, hash) = PasswordHasher.HashPassword(adminPass);
            db.Users.Add(new User
            {
                Id = adminId,
                Nickname = adminNick,
                Salt = salt,
                Hash = hash,
                Role = adminRole
            });
            return;
        }

        admin.Role = adminRole;

        if (!resetAdmin) return;

        var (newSalt, newHash) = PasswordHasher.HashPassword(adminPass);
        admin.Nickname = adminNick;
        admin.Salt = newSalt;
        admin.Hash = newHash;
    }

    private void UpsertFarm(string farmId, string name, string createdBy)
    {
        var farm = db.Farms.SingleOrDefault(x => x.Id == farmId);
        if (farm is null)
        {
            db.Farms.Add(new Farm { Id = farmId, Name = name, CreatedBy = createdBy });
            return;
        }

        farm.Name = name;
        farm.CreatedBy = createdBy;
    }

    private void UpsertWindmills(string farmId)
    {
        UpsertWindmill("turbine-alpha", farmId, "Alpha", "North Platform");
        UpsertWindmill("turbine-beta", farmId, "Beta", "North Platform");
        UpsertWindmill("turbine-gamma", farmId, "Gamma", "South Platform");
        UpsertWindmill("turbine-delta", farmId, "Delta", "East Platform");
    }

    private void UpsertWindmill(string id, string farmId, string name, string location)
    {
        var w = db.Windmills.SingleOrDefault(x => x.Id == id);
        if (w is null)
        {
            db.Windmills.Add(new Windmill
            {
                Id = id,
                FarmId = farmId,
                Name = name,
                Location = location
            });
            return;
        }

        w.FarmId = farmId;
        w.Name = name;
        w.Location = location;
    }
}