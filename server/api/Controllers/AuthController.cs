using Api.Security;
using Api.Services;
using DataAccess;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(MyDbContext db, JwtService jwt) : ControllerBase
{
    public sealed record LoginRequest(string Nickname, string Password);
    public sealed record LoginResponse(string Token, string UserId, string Nickname, string Role);

    public sealed record RegisterRequest(string Nickname, string Password, string Role);
    public sealed record RegisterResponse(string UserId, string Nickname, string Role);

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest req)
    {
        var user = await db.Users.SingleOrDefaultAsync(x => x.Nickname == req.Nickname);
        if (user is null) return Unauthorized("Invalid credentials");

        if (!PasswordHasher.Verify(req.Password, user.Salt, user.Hash))
            return Unauthorized("Invalid credentials");

        var token = jwt.IssueToken(user.Id, user.Nickname, user.Role);
        return Ok(new LoginResponse(token, user.Id, user.Nickname, user.Role));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("register")]
    public async Task<ActionResult<RegisterResponse>> Register([FromBody] RegisterRequest req)
    {
        var nickname = req.Nickname.Trim();
        if (string.IsNullOrWhiteSpace(nickname)) return BadRequest("Nickname is required");
        if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 8) return BadRequest("Password must be at least 8 chars");

        var role = (req.Role ?? "").Trim();
        if (role is not ("Admin" or "Operator" or "Inspector")) return BadRequest("Role must be Admin, Operator, or Inspector");

        if (await db.Users.AnyAsync(x => x.Nickname == nickname)) return Conflict("Nickname already exists");

        var (salt, hash) = PasswordHasher.HashPassword(req.Password);
        var user = new User { Id = $"u-{Guid.NewGuid():N}", Nickname = nickname, Salt = salt, Hash = hash, Role = role };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return Ok(new RegisterResponse(user.Id, user.Nickname, user.Role));
    }
}