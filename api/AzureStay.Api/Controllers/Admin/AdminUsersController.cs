using AzureStay.Api.Data;
using AzureStay.Api.Models;
using AzureStay.Api.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AzureStay.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = UserRoles.Admin)]
public class AdminUsersController : ControllerBase
{
    private static readonly HashSet<string> ValidRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        UserRoles.Customer,
        UserRoles.Owner,
        UserRoles.Admin
    };

    private static readonly HashSet<string> ValidStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        UserStatuses.Active,
        UserStatuses.Locked
    };

    private readonly AppDbContext _db;

    public AdminUsersController(AppDbContext db) => _db = db;

    // GET /api/admin/users — danh sách người dùng có lọc q, role, status, sắp xếp và phân trang.
    [HttpGet]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? q = null,
        [FromQuery] string? role = null,
        [FromQuery] string? status = null,
        [FromQuery] string? sort = "newest",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = _db.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var pattern = $"%{q.Trim()}%";
            query = query.Where(u =>
                EF.Functions.Like(u.Email, pattern)
                || EF.Functions.Like(u.FullName, pattern)
                || (u.Phone != null && EF.Functions.Like(u.Phone, pattern)));
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            var matchedRole = ValidRoles.FirstOrDefault(r => r.Equals(role.Trim(), StringComparison.OrdinalIgnoreCase));
            if (matchedRole is null)
                return BadRequest(new { message = "Vai trò lọc người dùng không hợp lệ." });

            query = query.Where(u => u.Role == matchedRole);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var matchedStatus = ValidStatuses.FirstOrDefault(s => s.Equals(status.Trim(), StringComparison.OrdinalIgnoreCase));
            if (matchedStatus is null)
                return BadRequest(new { message = "Trạng thái lọc người dùng không hợp lệ." });

            query = query.Where(u => u.Status == matchedStatus);
        }

        query = sort?.Trim().ToLowerInvariant() switch
        {
            "oldest" => query.OrderBy(u => u.CreatedAt).ThenBy(u => u.Id),
            "name" => query.OrderBy(u => u.FullName).ThenBy(u => u.Id),
            "email" => query.OrderBy(u => u.Email).ThenBy(u => u.Id),
            _ => query.OrderByDescending(u => u.CreatedAt).ThenByDescending(u => u.Id)
        };

        var total = await query.CountAsync(ct);

        // Chỉ select các trường công khai, tuyệt đối không lấy PasswordHash.
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserDto(
                u.Id,
                u.Email,
                u.FullName,
                u.Phone,
                u.Role,
                u.Status,
                u.CreatedAt))
            .ToListAsync(ct);

        return Ok(new PagedResult<AdminUserDto>(total, page, pageSize, items));
    }

    // PUT /api/admin/users/{id} — cập nhật họ tên, số điện thoại và trạng thái khoá/mở tài khoản.
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateUser(
        int id,
        [FromBody] AdminUserUpdateRequest request,
        CancellationToken ct)
    {
        var fullName = request.FullName?.Trim() ?? string.Empty;
        var phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        var matchedStatus = ValidStatuses.FirstOrDefault(s => s.Equals(request.Status?.Trim(), StringComparison.OrdinalIgnoreCase));

        if (fullName.Length < 2)
            return BadRequest(new { message = "Họ tên phải có ít nhất 2 ký tự." });

        if (matchedStatus is null)
            return BadRequest(new { message = "Trạng thái tài khoản chỉ nhận Active hoặc Locked." });

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null)
            return NotFound(new { message = "Không tìm thấy người dùng." });

        user.FullName = fullName;
        user.Phone = phone;
        user.Status = matchedStatus;

        await _db.SaveChangesAsync(ct);

        return Ok(ToDto(user));
    }

    // PUT /api/admin/users/{id}/role — đổi vai trò người dùng; chặn tự hạ quyền chính mình.
    [HttpPut("{id:int}/role")]
    public async Task<IActionResult> UpdateUserRole(
        int id,
        [FromBody] AdminRoleRequest request,
        CancellationToken ct)
    {
        var currentUserId = ControllerHelpers.GetCurrentUserId(User);
        if (currentUserId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        var matchedRole = ValidRoles.FirstOrDefault(r => r.Equals(request.Role?.Trim(), StringComparison.OrdinalIgnoreCase));
        if (matchedRole is null)
            return BadRequest(new { message = "Vai trò chỉ nhận Customer, Owner hoặc Admin." });

        if (id == currentUserId.Value && !string.Equals(matchedRole, UserRoles.Admin, StringComparison.Ordinal))
            return BadRequest(new { message = "Không thể tự hạ quyền của chính mình." });

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null)
            return NotFound(new { message = "Không tìm thấy người dùng." });

        user.Role = matchedRole;
        await _db.SaveChangesAsync(ct);

        return Ok(ToDto(user));
    }

    private static AdminUserDto ToDto(User u) =>
        new(u.Id, u.Email, u.FullName, u.Phone, u.Role, u.Status, u.CreatedAt);
}
