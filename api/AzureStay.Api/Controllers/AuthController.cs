using System.Net.Mail;
using System.Security.Claims;
using AzureStay.Api.Data;
using AzureStay.Api.Models;
using AzureStay.Api.Models.Dtos;
using AzureStay.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AzureStay.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    public const int MinPasswordLength = 8;
    private const string RefreshCookieName = "refreshToken";

    private readonly AppDbContext _db;
    private readonly JwtTokenService _jwt;

    public AuthController(AppDbContext db, JwtTokenService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    // POST /api/auth/register — đăng ký tài khoản Customer mới (không trả token).
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest input)
    {
        var email = input.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        var password = input.Password ?? string.Empty;
        var fullName = input.FullName?.Trim() ?? string.Empty;
        var phone = string.IsNullOrWhiteSpace(input.Phone) ? null : input.Phone.Trim();

        var errors = ValidateRegister(email, password, fullName, phone);
        if (errors.Count > 0)
            return BadRequest(new { message = errors[0], errors });

        if (await _db.Users.AnyAsync(u => u.Email == email))
            return Conflict(new { message = "Email này đã được đăng ký." });

        // Vai trò mặc định luôn là Customer; chỉ Admin mới có quyền nâng lên Owner/Admin.
        var user = new User
        {
            Email = email,
            PasswordHash = PasswordHasher.Hash(password),
            FullName = fullName,
            Phone = phone,
            Role = UserRoles.Customer,
            Status = UserStatuses.Active,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, ToDto(user));
    }

    // POST /api/auth/login — xác thực email/mật khẩu, trả accessToken + set refresh cookie httpOnly.
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest input)
    {
        var email = input.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        var password = input.Password ?? string.Empty;

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrEmpty(password))
            return Unauthorized(new { message = "Email hoặc mật khẩu không đúng." });

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

        // Dùng chung một thông báo 401 cho sai email và sai mật khẩu để không lộ tài khoản tồn tại.
        if (user is null || !PasswordHasher.Verify(password, user.PasswordHash))
            return Unauthorized(new { message = "Email hoặc mật khẩu không đúng." });

        // Chỉ kiểm tra trạng thái khoá sau khi mật khẩu đúng để tránh rò rỉ trạng thái tài khoản.
        if (user.Status == UserStatuses.Locked)
            return StatusCode(StatusCodes.Status403Forbidden,
                new { message = "Tài khoản của bạn đã bị khoá. Vui lòng liên hệ quản trị viên." });

        var accessToken = _jwt.CreateAccessToken(user);
        var refreshToken = _jwt.CreateRefreshToken(user.Id);

        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync();

        SetRefreshCookie(refreshToken.Token, refreshToken.ExpiresAt);

        return Ok(new LoginResponse(accessToken, ToDto(user)));
    }

    // POST /api/auth/refresh — đọc refresh cookie, xoay vòng token và cấp accessToken mới.
    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh()
    {
        if (!Request.Cookies.TryGetValue(RefreshCookieName, out var rawToken) || string.IsNullOrWhiteSpace(rawToken))
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });

        var existing = await _db.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == rawToken);

        // Từ chối nếu token không tồn tại, đã bị thu hồi hoặc đã quá hạn.
        if (existing is null || existing.RevokedAt is not null || existing.ExpiresAt <= DateTime.UtcNow)
            return Unauthorized(new { message = "Refresh token không hợp lệ hoặc đã hết hạn." });

        if (existing.User.Status == UserStatuses.Locked)
            return StatusCode(StatusCodes.Status403Forbidden,
                new { message = "Tài khoản của bạn đã bị khoá. Vui lòng liên hệ quản trị viên." });

        // Xoay vòng refresh token: thu hồi token cũ và phát hành token mới.
        existing.RevokedAt = DateTime.UtcNow;
        var rotated = _jwt.CreateRefreshToken(existing.UserId);
        _db.RefreshTokens.Add(rotated);
        await _db.SaveChangesAsync();

        SetRefreshCookie(rotated.Token, rotated.ExpiresAt);

        var accessToken = _jwt.CreateAccessToken(existing.User);
        return Ok(new RefreshResponse(accessToken));
    }

    // POST /api/auth/logout — thu hồi refresh token hiện tại và xoá cookie.
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        if (Request.Cookies.TryGetValue(RefreshCookieName, out var rawToken) && !string.IsNullOrWhiteSpace(rawToken))
        {
            var tokenEntity = await _db.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == rawToken && rt.UserId == userId.Value && rt.RevokedAt == null);

            if (tokenEntity is not null)
            {
                tokenEntity.RevokedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
        }

        DeleteRefreshCookie();
        return Ok(new { message = "Đăng xuất thành công." });
    }

    // GET /api/auth/me — trả thông tin người dùng hiện tại.
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe()
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId.Value);
        if (user is null)
            return Unauthorized(new { message = "Tài khoản không tồn tại." });

        if (user.Status == UserStatuses.Locked)
            return StatusCode(StatusCodes.Status403Forbidden,
                new { message = "Tài khoản của bạn đã bị khoá. Vui lòng liên hệ quản trị viên." });

        return Ok(ToDto(user));
    }

    // PUT /api/auth/me — cập nhật họ tên và số điện thoại.
    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest input)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        var fullName = input.FullName?.Trim() ?? string.Empty;
        var phone = string.IsNullOrWhiteSpace(input.Phone) ? null : input.Phone.Trim();

        var errors = new List<string>();
        ValidateFullName(fullName, errors);
        ValidatePhone(phone, errors);
        if (errors.Count > 0)
            return BadRequest(new { message = errors[0], errors });

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
        if (user is null)
            return Unauthorized(new { message = "Tài khoản không tồn tại." });

        if (user.Status == UserStatuses.Locked)
            return StatusCode(StatusCodes.Status403Forbidden,
                new { message = "Tài khoản của bạn đã bị khoá. Vui lòng liên hệ quản trị viên." });

        user.FullName = fullName;
        user.Phone = phone;
        await _db.SaveChangesAsync();

        return Ok(ToDto(user));
    }

    // POST /api/auth/change-password — kiểm tra mật khẩu cũ, cập nhật mật khẩu mới (>= 8 ký tự).
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest input)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        var currentPassword = input.CurrentPassword ?? string.Empty;
        var newPassword = input.NewPassword ?? string.Empty;

        var errors = new List<string>();
        if (string.IsNullOrEmpty(currentPassword))
            errors.Add("Mật khẩu hiện tại không được để trống.");
        if (string.IsNullOrEmpty(newPassword))
            errors.Add("Mật khẩu mới không được để trống.");
        else if (newPassword.Length < MinPasswordLength)
            errors.Add($"Mật khẩu mới phải có ít nhất {MinPasswordLength} ký tự.");

        if (errors.Count > 0)
            return BadRequest(new { message = errors[0], errors });

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
        if (user is null)
            return Unauthorized(new { message = "Tài khoản không tồn tại." });

        if (!PasswordHasher.Verify(currentPassword, user.PasswordHash))
            return BadRequest(new { message = "Mật khẩu hiện tại không đúng." });

        user.PasswordHash = PasswordHasher.Hash(newPassword);

        // Thu hồi toàn bộ refresh token đang hoạt động sau khi đổi mật khẩu để đảm bảo an toàn.
        var now = DateTime.UtcNow;
        var activeTokens = await _db.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
            .ToListAsync();
        foreach (var token in activeTokens)
            token.RevokedAt = now;

        await _db.SaveChangesAsync();
        DeleteRefreshCookie();

        return Ok(new { message = "Đổi mật khẩu thành công." });
    }

    private int? GetCurrentUserId()
    {
        var sub = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(sub, out var id) ? id : null;
    }

    private void SetRefreshCookie(string token, DateTime expiresAt)
    {
        Response.Cookies.Append(RefreshCookieName, token, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = Request.IsHttps,
            Expires = expiresAt,
            Path = "/"
        });
    }

    private void DeleteRefreshCookie()
    {
        Response.Cookies.Delete(RefreshCookieName, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = Request.IsHttps,
            Path = "/"
        });
    }

    private static UserDto ToDto(User user) =>
        new(user.Id, user.Email, user.FullName, user.Phone, user.Role, user.Status, user.CreatedAt);

    private static List<string> ValidateRegister(string email, string password, string fullName, string? phone)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(email))
            errors.Add("Email không được để trống.");
        else if (email.Length > 160 || !MailAddress.TryCreate(email, out _))
            errors.Add("Email không hợp lệ.");

        if (string.IsNullOrEmpty(password))
            errors.Add("Mật khẩu không được để trống.");
        else if (password.Length < MinPasswordLength)
            errors.Add($"Mật khẩu phải có ít nhất {MinPasswordLength} ký tự.");

        ValidateFullName(fullName, errors);
        ValidatePhone(phone, errors);

        return errors;
    }

    private static void ValidateFullName(string fullName, List<string> errors)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            errors.Add("Họ tên không được để trống.");
        else if (fullName.Length < 2 || fullName.Length > 120)
            errors.Add("Họ tên phải từ 2 đến 120 ký tự.");
    }

    private static void ValidatePhone(string? phone, List<string> errors)
    {
        if (phone is not null && phone.Length > 20)
            errors.Add("Số điện thoại không được vượt quá 20 ký tự.");
    }
}
