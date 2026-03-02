using System.Security.Cryptography;
using System.Text;

namespace Api.Security;

public static class PasswordHasher
{
    public static (string salt, string hash) HashPassword(string password)
    {
        var saltBytes = RandomNumberGenerator.GetBytes(16);
        var salt = Convert.ToBase64String(saltBytes);
        var hash = ComputeHash(password, salt);
        return (salt, hash);
    }

    public static bool Verify(string password, string salt, string expectedHash)
        => ComputeHash(password, salt) == expectedHash;

    private static string ComputeHash(string password, string salt)
    {
        using var sha = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes($"{salt}:{password}");
        return Convert.ToBase64String(sha.ComputeHash(bytes));
    }
}