using Api.Security;
using DataAccess;
using DataAccess.Entities;
using Microsoft.EntityFrameworkCore;

namespace Api;

public sealed class Seeder(MyDbContext db)
{
    public void Seed()
    {
        db.Database.Migrate();

        if (!db.Users.Any())
        {
            var (salt, hash) = PasswordHasher.HashPassword("admin");
            db.Users.Add(new User { Id = "u-admin", Nickname = "admin", Salt = salt, Hash = hash });
        }

        if (!db.Farms.Any())
        {
            db.Farms.Add(new Farm { Id = "ab9b807d-0bec-4ab3-a847-53ca17589a6d", Name = "North Sea Farm", CreatedBy = "u-admin" });
        }

        if (!db.Windmills.Any())
        {
            db.Windmills.AddRange(
                new Windmill { Id = "turbine-alpha", FarmId = "ab9b807d-0bec-4ab3-a847-53ca17589a6d", Name = "Alpha", Location = "North Platform" },
                new Windmill { Id = "turbine-beta", FarmId = "ab9b807d-0bec-4ab3-a847-53ca17589a6d", Name = "Beta", Location = "North Platform" },
                new Windmill { Id = "turbine-gamma", FarmId = "ab9b807d-0bec-4ab3-a847-53ca17589a6d", Name = "Gamma", Location = "South Platform" },
                new Windmill { Id = "turbine-delta", FarmId = "ab9b807d-0bec-4ab3-a847-53ca17589a6d", Name = "Delta", Location = "East Platform" }
            );
        }

        db.SaveChanges();
    }
}