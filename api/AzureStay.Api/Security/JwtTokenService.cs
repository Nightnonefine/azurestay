using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AzureStay.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace AzureStay.Api.Security;

// Dịch vụ phát hành JWT access token (HS256, 60 phút) và refresh token ngẫu nhiên (64 byte base64, 7 ngày).
public class JwtTokenService
{
    private readonly IConfiguration _config;

    public JwtTokenService(IConfiguration config) => _config = config;

    public int AccessTokenMinutes => _config.GetValue("Jwt:AccessTokenMinutes", 60);
    public int RefreshTokenDays => _config.GetValue("Jwt:RefreshTokenDays", 7);

    public string CreateAccessToken(User user)
    {
        var keyText = _config["Jwt:Key"]
            ?? throw new InvalidOperationException("Chưa cấu hình Jwt:Key.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyText));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("role", user.Role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "AzureStay.Api",
            audience: _config["Jwt:Audience"] ?? "AzureStay.Web",
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddMinutes(AccessTokenMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public RefreshToken CreateRefreshToken(int userId)
    {
        var now = DateTime.UtcNow;
        var rawBytes = RandomNumberGenerator.GetBytes(64);
        return new RefreshToken
        {
            UserId = userId,
            Token = Convert.ToBase64String(rawBytes),
            CreatedAt = now,
            ExpiresAt = now.AddDays(RefreshTokenDays)
        };
    }
}
