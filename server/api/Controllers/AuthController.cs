using Api.Security;
using Api.Services;
using DataAccess;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(MyDbContext db, JwtService jwt) : ControllerBase
{
    public sealed record LoginRequest(string Nickname, string Password);
    public sealed record LoginResponse(string Token, string UserId, string Nickname);

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest req)
    {
        var user = await db.Users.SingleOrDefaultAsync(x => x.Nickname == req.Nickname);
        if (user is null) return Unauthorized("Invalid credentials");

        if (!PasswordHasher.Verify(req.Password, user.Salt, user.Hash))
            return Unauthorized("Invalid credentials");

        var token = jwt.IssueToken(user.Id, user.Nickname);
        return Ok(new LoginResponse(token, user.Id, user.Nickname));
    }
}