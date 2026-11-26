using AzureStay.Api.Data;
using AzureStay.Api.Models;
using AzureStay.Api.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AzureStay.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/hotels")]
[Authorize(Roles = UserRoles.Admin)]
public class AdminHotelsController : ControllerBase
{
    private static readonly HashSet<string> ValidFilterStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        HotelStatuses.Pending,
        HotelStatuses.Active,
        HotelStatuses.Suspended,
        HotelStatuses.Rejected
    };

    private static readonly HashSet<string> ValidDecisionStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        HotelStatuses.Active,
        HotelStatuses.Suspended,
        HotelStatuses.Rejected
    };

    private readonly AppDbContext _db;

    public AdminHotelsController(AppDbContext db) => _db = db;

    // GET /api/admin/hotels — danh sách mọi khách sạn kèm email chủ sở hữu.
    [HttpGet]
    public async Task<IActionResult> GetHotels(
        [FromQuery] string? status = null,
        [FromQuery] string? city = null,
        [FromQuery] string? q = null,
        [FromQuery] string? sort = "newest",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = _db.Hotels.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(status))
        {
            var matchedStatus = ValidFilterStatuses.FirstOrDefault(s => s.Equals(status.Trim(), StringComparison.OrdinalIgnoreCase));
            if (matchedStatus is null)
                return BadRequest(new { message = "Trạng thái lọc khách sạn không hợp lệ." });

            query = query.Where(h => h.Status == matchedStatus);
        }

        if (!string.IsNullOrWhiteSpace(city))
        {
            var normalizedCity = city.Trim();
            query = query.Where(h => h.City == normalizedCity);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var pattern = $"%{q.Trim()}%";
            query = query.Where(h =>
                EF.Functions.Like(h.Name, pattern)
                || EF.Functions.Like(h.City, pattern)
                || EF.Functions.Like(h.District, pattern)
                || EF.Functions.Like(h.Owner.Email, pattern));
        }

        query = sort?.Trim().ToLowerInvariant() switch
        {
            "oldest" => query.OrderBy(h => h.CreatedAt).ThenBy(h => h.Id),
            "name" => query.OrderBy(h => h.Name).ThenBy(h => h.Id),
            "rating" => query.OrderByDescending(h => h.StarRating).ThenBy(h => h.Id),
            _ => query.OrderByDescending(h => h.CreatedAt).ThenByDescending(h => h.Id)
        };

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(h => new AdminHotelDto(
                h.Id,
                h.OwnerId,
                h.Owner.Email,
                h.Owner.FullName,
                h.Name,
                h.Slug,
                h.City,
                h.District,
                h.Address,
                h.StarRating,
                h.Status,
                h.Featured,
                h.RoomTypes.Count,
                h.CreatedAt,
                h.UpdatedAt))
            .ToListAsync(ct);

        return Ok(new PagedResult<AdminHotelDto>(total, page, pageSize, items));
    }

    // PUT /api/admin/hotels/{id}/status — duyệt (Active), tạm ngưng (Suspended) hoặc từ chối (Rejected).
    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateHotelStatus(
        int id,
        [FromBody] AdminHotelStatusRequest request,
        CancellationToken ct)
    {
        var matchedStatus = ValidDecisionStatuses.FirstOrDefault(s => s.Equals(request.Status?.Trim(), StringComparison.OrdinalIgnoreCase));
        if (matchedStatus is null)
            return BadRequest(new { message = "Trạng thái duyệt chỉ nhận Active, Suspended hoặc Rejected." });

        var hotel = await _db.Hotels
            .Include(h => h.Owner)
            .FirstOrDefaultAsync(h => h.Id == id, ct);

        if (hotel is null)
            return NotFound(new { message = "Không tìm thấy khách sạn." });

        hotel.Status = matchedStatus;
        hotel.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        var roomTypeCount = await _db.RoomTypes.AsNoTracking().CountAsync(rt => rt.HotelId == hotel.Id, ct);
        return Ok(ToDto(hotel, roomTypeCount));
    }

    // PUT /api/admin/hotels/{id}/featured — bật/tắt gói nổi bật (Featured) cho khách sạn.
    [HttpPut("{id:int}/featured")]
    public async Task<IActionResult> ToggleFeatured(
        int id,
        [FromBody] AdminFeaturedRequest? request = null,
        CancellationToken ct = default)
    {
        var hotel = await _db.Hotels
            .Include(h => h.Owner)
            .FirstOrDefaultAsync(h => h.Id == id, ct);

        if (hotel is null)
            return NotFound(new { message = "Không tìm thấy khách sạn." });

        hotel.Featured = request?.Featured ?? !hotel.Featured;
        hotel.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        var roomTypeCount = await _db.RoomTypes.AsNoTracking().CountAsync(rt => rt.HotelId == hotel.Id, ct);
        return Ok(ToDto(hotel, roomTypeCount));
    }

    private static AdminHotelDto ToDto(Hotel h, int roomTypeCount) =>
        new(
            h.Id,
            h.OwnerId,
            h.Owner.Email,
            h.Owner.FullName,
            h.Name,
            h.Slug,
            h.City,
            h.District,
            h.Address,
            h.StarRating,
            h.Status,
            h.Featured,
            roomTypeCount,
            h.CreatedAt,
            h.UpdatedAt);
}
