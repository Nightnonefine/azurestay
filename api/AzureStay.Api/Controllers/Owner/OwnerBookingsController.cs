using AzureStay.Api.Data;
using AzureStay.Api.Models;
using AzureStay.Api.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AzureStay.Api.Controllers.Owner;

[ApiController]
[Route("api/owner/bookings")]
[Authorize(Roles = UserRoles.Owner)]
public class OwnerBookingsController : ControllerBase
{
    private static readonly HashSet<string> ValidStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        BookingStatuses.Pending,
        BookingStatuses.Confirmed,
        BookingStatuses.CheckedIn,
        BookingStatuses.Completed,
        BookingStatuses.Cancelled
    };

    // Bảng chuyển trạng thái hợp lệ theo vòng đời SPEC mục 3.
    private static readonly Dictionary<string, string[]> AllowedTransitions = new(StringComparer.Ordinal)
    {
        [BookingStatuses.Pending] = [BookingStatuses.Confirmed, BookingStatuses.Cancelled],
        [BookingStatuses.Confirmed] = [BookingStatuses.CheckedIn, BookingStatuses.Cancelled],
        [BookingStatuses.CheckedIn] = [BookingStatuses.Completed]
    };

    private readonly AppDbContext _db;

    public OwnerBookingsController(AppDbContext db) => _db = db;

    // GET /api/owner/bookings — danh sách đơn đặt phòng thuộc các khách sạn của owner.
    [HttpGet]
    public async Task<IActionResult> GetBookings(
        [FromQuery] int? hotelId = null,
        [FromQuery] string? status = null,
        [FromQuery] DateOnly? from = null,
        [FromQuery] DateOnly? to = null,
        [FromQuery] string? sort = "newest",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var ownerId = ControllerHelpers.GetCurrentUserId(User);
        if (ownerId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        if (from.HasValue && to.HasValue && to.Value < from.Value)
            return BadRequest(new { message = "Ngày kết thúc (to) không được nhỏ hơn ngày bắt đầu (from)." });

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        // Luôn lọc theo OwnerId ở mức SQL.
        var query = _db.Bookings
            .AsNoTracking()
            .Where(b => b.Hotel.OwnerId == ownerId.Value);

        if (hotelId.HasValue)
            query = query.Where(b => b.HotelId == hotelId.Value);

        if (!string.IsNullOrWhiteSpace(status))
        {
            var matchedStatus = ValidStatuses.FirstOrDefault(s => s.Equals(status.Trim(), StringComparison.OrdinalIgnoreCase));
            if (matchedStatus is null)
                return BadRequest(new { message = "Trạng thái lọc đơn đặt phòng không hợp lệ." });

            query = query.Where(b => b.Status == matchedStatus);
        }

        // Lọc theo khoảng ngày giao nhau với CheckIn / CheckOut.
        if (from.HasValue && to.HasValue && to.Value == from.Value)
        {
            query = query.Where(b => b.CheckIn <= to.Value && b.CheckOut > from.Value);
        }
        else
        {
            if (from.HasValue)
                query = query.Where(b => b.CheckOut > from.Value);
            if (to.HasValue)
                query = query.Where(b => b.CheckIn < to.Value);
        }

        query = sort?.Trim().ToLowerInvariant() switch
        {
            "oldest" => query.OrderBy(b => b.CreatedAt).ThenBy(b => b.Id),
            "checkin-asc" => query.OrderBy(b => b.CheckIn).ThenBy(b => b.Id),
            "checkin-desc" => query.OrderByDescending(b => b.CheckIn).ThenByDescending(b => b.Id),
            "amount-desc" => query.OrderByDescending(b => b.TotalAmount).ThenByDescending(b => b.Id),
            _ => query.OrderByDescending(b => b.CreatedAt).ThenByDescending(b => b.Id)
        };

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new OwnerBookingDto(
                b.Id,
                b.Code,
                b.HotelId,
                b.Hotel.Name,
                b.RoomTypeId,
                b.RoomType.Name,
                b.GuestName,
                b.GuestPhone,
                b.GuestEmail,
                b.CheckIn,
                b.CheckOut,
                b.CheckOut.DayNumber - b.CheckIn.DayNumber,
                b.Rooms,
                b.Adults,
                b.Children,
                b.PricePerNight,
                b.TotalAmount,
                b.Status,
                b.Note,
                b.CreatedAt,
                b.UpdatedAt))
            .ToListAsync(ct);

        return Ok(new PagedResult<OwnerBookingDto>(total, page, pageSize, items));
    }

    // PUT /api/owner/bookings/{id}/status — chuyển trạng thái đơn theo vòng đời hợp lệ ở SPEC mục 3.
    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateBookingStatus(
        int id,
        [FromBody] OwnerBookingStatusRequest request,
        CancellationToken ct)
    {
        var ownerId = ControllerHelpers.GetCurrentUserId(User);
        if (ownerId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        var requestedStatus = request.Status?.Trim() ?? string.Empty;
        var targetStatus = ValidStatuses.FirstOrDefault(s => s.Equals(requestedStatus, StringComparison.OrdinalIgnoreCase));
        if (targetStatus is null)
            return BadRequest(new { message = "Trạng thái đơn đặt phòng không hợp lệ." });

        var booking = await _db.Bookings
            .Include(b => b.Hotel)
            .Include(b => b.RoomType)
            .FirstOrDefaultAsync(b => b.Id == id && b.Hotel.OwnerId == ownerId.Value, ct);

        if (booking is null)
            return NotFound(new { message = "Không tìm thấy đơn đặt phòng." });

        if (!AllowedTransitions.TryGetValue(booking.Status, out var nextAllowed) || !nextAllowed.Contains(targetStatus))
        {
            return BadRequest(new
            {
                message = $"Không thể chuyển trạng thái đơn từ {booking.Status} sang {targetStatus}."
            });
        }

        booking.Status = targetStatus;
        booking.UpdatedAt = DateTime.UtcNow;

        var trimmedNote = request.Note?.Trim();
        if (!string.IsNullOrWhiteSpace(trimmedNote))
        {
            var combined = string.IsNullOrWhiteSpace(booking.Note)
                ? trimmedNote
                : $"{booking.Note} | {trimmedNote}";
            booking.Note = combined.Length <= 500 ? combined : combined[..500];
        }

        await _db.SaveChangesAsync(ct);

        return Ok(new OwnerBookingDto(
            booking.Id,
            booking.Code,
            booking.HotelId,
            booking.Hotel.Name,
            booking.RoomTypeId,
            booking.RoomType.Name,
            booking.GuestName,
            booking.GuestPhone,
            booking.GuestEmail,
            booking.CheckIn,
            booking.CheckOut,
            booking.CheckOut.DayNumber - booking.CheckIn.DayNumber,
            booking.Rooms,
            booking.Adults,
            booking.Children,
            booking.PricePerNight,
            booking.TotalAmount,
            booking.Status,
            booking.Note,
            booking.CreatedAt,
            booking.UpdatedAt));
    }
}
