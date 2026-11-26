using AzureStay.Api.Data;
using AzureStay.Api.Models;
using AzureStay.Api.Models.Dtos;
using AzureStay.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AzureStay.Api.Controllers.Owner;

[ApiController]
[Route("api/owner")]
[Authorize(Roles = UserRoles.Owner)]
public class OwnerStatsController : ControllerBase
{
    private const int MaxCalendarDays = 60;
    private const int MaxStatsDays = 366;

    private static readonly string[] AllBookingStatuses =
    [
        BookingStatuses.Pending,
        BookingStatuses.Confirmed,
        BookingStatuses.CheckedIn,
        BookingStatuses.Completed,
        BookingStatuses.Cancelled
    ];

    private static readonly HashSet<string> RevenueStatuses = new(StringComparer.Ordinal)
    {
        BookingStatuses.Confirmed,
        BookingStatuses.CheckedIn,
        BookingStatuses.Completed
    };

    private readonly AppDbContext _db;
    private readonly AvailabilityService _availability;

    public OwnerStatsController(AppDbContext db, AvailabilityService availability)
    {
        _db = db;
        _availability = availability;
    }

    // GET /api/owner/stats?from&to&hotelId — doanh thu, số đơn, số đêm bán và công suất phòng của owner.
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(
        [FromQuery] DateOnly? from = null,
        [FromQuery] DateOnly? to = null,
        [FromQuery] int? hotelId = null,
        CancellationToken ct = default)
    {
        var ownerId = ControllerHelpers.GetCurrentUserId(User);
        if (ownerId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        var today = BookingService.GetVietnamToday();
        var fromDate = from ?? (to.HasValue ? to.Value.AddDays(-30) : today.AddDays(-29));
        var toDate = to ?? (from.HasValue ? from.Value.AddDays(30) : today.AddDays(1));

        if (toDate <= fromDate)
            return BadRequest(new { message = "Ngày kết thúc (to) phải sau ngày bắt đầu (from)." });

        var rangeNights = toDate.DayNumber - fromDate.DayNumber;
        if (rangeNights > MaxStatsDays)
            return BadRequest(new { message = $"Khoảng thời gian thống kê tối đa là {MaxStatsDays} ngày." });

        if (hotelId.HasValue)
        {
            var ownsHotel = await _db.Hotels
                .AsNoTracking()
                .AnyAsync(h => h.Id == hotelId.Value && h.OwnerId == ownerId.Value, ct);
            if (!ownsHotel)
                return NotFound(new { message = "Không tìm thấy khách sạn." });
        }

        // Lọc theo OwnerId ngay trong câu truy vấn SQL.
        var roomTypesQuery = _db.RoomTypes
            .AsNoTracking()
            .Where(rt => rt.Hotel.OwnerId == ownerId.Value && rt.IsActive);

        var bookingsQuery = _db.Bookings
            .AsNoTracking()
            .Where(b => b.Hotel.OwnerId == ownerId.Value
                        && b.CheckIn < toDate
                        && b.CheckOut > fromDate);

        if (hotelId.HasValue)
        {
            roomTypesQuery = roomTypesQuery.Where(rt => rt.HotelId == hotelId.Value);
            bookingsQuery = bookingsQuery.Where(b => b.HotelId == hotelId.Value);
        }

        var roomTypes = await roomTypesQuery
            .Select(rt => new
            {
                rt.Id,
                rt.HotelId,
                HotelName = rt.Hotel.Name,
                rt.Name,
                rt.TotalRooms
            })
            .ToListAsync(ct);

        var bookings = await bookingsQuery
            .Select(b => new
            {
                b.RoomTypeId,
                b.CheckIn,
                b.CheckOut,
                b.Rooms,
                b.PricePerNight,
                b.Status
            })
            .ToListAsync(ct);

        var bookingsByStatus = AllBookingStatuses.ToDictionary(s => s, _ => 0, StringComparer.Ordinal);
        var soldByRoomType = new Dictionary<int, int>();
        var revenueByRoomType = new Dictionary<int, decimal>();

        var totalRevenue = 0m;
        var totalSoldRoomNights = 0;

        foreach (var b in bookings)
        {
            bookingsByStatus[b.Status] = bookingsByStatus.GetValueOrDefault(b.Status) + 1;

            if (!RevenueStatuses.Contains(b.Status))
                continue;

            var overlapStart = b.CheckIn > fromDate ? b.CheckIn : fromDate;
            var overlapEnd = b.CheckOut < toDate ? b.CheckOut : toDate;
            var overlapNights = Math.Max(0, overlapEnd.DayNumber - overlapStart.DayNumber);
            if (overlapNights == 0)
                continue;

            var roomNights = overlapNights * b.Rooms;
            var revenue = roomNights * b.PricePerNight;

            totalSoldRoomNights += roomNights;
            totalRevenue += revenue;

            soldByRoomType[b.RoomTypeId] = soldByRoomType.GetValueOrDefault(b.RoomTypeId) + roomNights;
            revenueByRoomType[b.RoomTypeId] = revenueByRoomType.GetValueOrDefault(b.RoomTypeId) + revenue;
        }

        var occupancyList = roomTypes
            .Select(rt =>
            {
                var soldNights = soldByRoomType.GetValueOrDefault(rt.Id);
                var capacityNights = rt.TotalRooms * rangeNights;
                var occupancyRate = capacityNights > 0
                    ? Math.Round((double)soldNights / capacityNights, 4)
                    : 0.0;
                var revenue = revenueByRoomType.GetValueOrDefault(rt.Id);

                return new RoomTypeOccupancyDto(
                    rt.Id,
                    rt.HotelId,
                    rt.HotelName,
                    rt.Name,
                    rt.TotalRooms,
                    soldNights,
                    capacityNights,
                    occupancyRate,
                    revenue);
            })
            .OrderByDescending(x => x.Revenue)
            .ThenByDescending(x => x.SoldNights)
            .ThenBy(x => x.RoomTypeId)
            .ToList();

        var topRoomTypes = occupancyList.Take(5).ToList();

        return Ok(new OwnerStatsDto(
            fromDate,
            toDate,
            rangeNights,
            totalRevenue,
            bookings.Count,
            totalSoldRoomNights,
            bookingsByStatus,
            occupancyList,
            topRoomTypes));
    }

    // GET /api/owner/hotels/{id}/calendar?from&to — lịch tồn kho theo ngày tối đa 60 ngày của khách sạn thuộc owner.
    [HttpGet("hotels/{id:int}/calendar")]
    public async Task<IActionResult> GetHotelCalendar(
        int id,
        [FromQuery] DateOnly? from = null,
        [FromQuery] DateOnly? to = null,
        CancellationToken ct = default)
    {
        var ownerId = ControllerHelpers.GetCurrentUserId(User);
        if (ownerId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        if (from.HasValue != to.HasValue)
            return BadRequest(new { message = "Vui lòng truyền đầy đủ ngày bắt đầu (from) và ngày kết thúc (to)." });

        var today = BookingService.GetVietnamToday();
        var fromDate = from ?? today;
        var toDate = to ?? today.AddDays(14);

        if (toDate <= fromDate)
            return BadRequest(new { message = "Ngày kết thúc (to) phải sau ngày bắt đầu (from)." });

        if (toDate.DayNumber - fromDate.DayNumber > MaxCalendarDays)
            return BadRequest(new { message = $"Khoảng thời gian xem lịch trống tối đa là {MaxCalendarDays} ngày." });

        var ownsHotel = await _db.Hotels
            .AsNoTracking()
            .AnyAsync(h => h.Id == id && h.OwnerId == ownerId.Value, ct);

        if (!ownsHotel)
            return NotFound(new { message = "Không tìm thấy khách sạn." });

        var availability = await _availability.GetHotelAvailabilityAsync(id, fromDate, toDate, ct);
        var calendar = availability
            .Select(d => new CalendarDayDto(d.Date, d.RoomTypes))
            .ToList();

        return Ok(calendar);
    }
}
