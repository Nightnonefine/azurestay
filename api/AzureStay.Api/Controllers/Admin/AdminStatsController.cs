using AzureStay.Api.Data;
using AzureStay.Api.Models;
using AzureStay.Api.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AzureStay.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/stats")]
[Authorize(Roles = UserRoles.Admin)]
public class AdminStatsController : ControllerBase
{
    private static readonly string[] AllUserRoles = [UserRoles.Customer, UserRoles.Owner, UserRoles.Admin];
    private static readonly string[] AllUserStatuses = [UserStatuses.Active, UserStatuses.Locked];
    private static readonly string[] AllHotelStatuses =
    [
        HotelStatuses.Pending,
        HotelStatuses.Active,
        HotelStatuses.Suspended,
        HotelStatuses.Rejected
    ];
    private static readonly string[] AllBookingStatuses =
    [
        BookingStatuses.Pending,
        BookingStatuses.Confirmed,
        BookingStatuses.CheckedIn,
        BookingStatuses.Completed,
        BookingStatuses.Cancelled
    ];

    private readonly AppDbContext _db;

    public AdminStatsController(AppDbContext db) => _db = db;

    // GET /api/admin/stats — thống kê tổng quan toàn hệ thống.
    [HttpGet]
    public async Task<IActionResult> GetStats(CancellationToken ct)
    {
        var userRoleCounts = await _db.Users
            .AsNoTracking()
            .GroupBy(u => u.Role)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var userStatusCounts = await _db.Users
            .AsNoTracking()
            .GroupBy(u => u.Status)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var hotelStatusCounts = await _db.Hotels
            .AsNoTracking()
            .GroupBy(h => h.Status)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var bookingStatusCounts = await _db.Bookings
            .AsNoTracking()
            .GroupBy(b => b.Status)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var totalPaidRevenue = await _db.Payments
            .AsNoTracking()
            .Where(p => p.Status == PaymentStatuses.Paid)
            .SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;

        var topHotelsRaw = await _db.Payments
            .AsNoTracking()
            .Where(p => p.Status == PaymentStatuses.Paid)
            .GroupBy(p => new
            {
                p.Booking.HotelId,
                p.Booking.Hotel.Name,
                p.Booking.Hotel.Slug,
                p.Booking.Hotel.City
            })
            .Select(g => new
            {
                g.Key.HotelId,
                g.Key.Name,
                g.Key.Slug,
                g.Key.City,
                BookingCount = g.Count(),
                Revenue = g.Sum(p => p.Amount)
            })
            .OrderByDescending(x => x.Revenue)
            .ThenByDescending(x => x.BookingCount)
            .ThenBy(x => x.HotelId)
            .Take(5)
            .ToListAsync(ct);

        var topHotels = topHotelsRaw
            .Select(x => new TopHotelRevenueDto(
                x.HotelId,
                x.Name,
                x.Slug,
                x.City,
                x.BookingCount,
                x.Revenue))
            .ToList();

        var usersByRole = BuildCountDictionary(AllUserRoles, userRoleCounts.Select(x => (x.Key, x.Count)));
        var usersByStatus = BuildCountDictionary(AllUserStatuses, userStatusCounts.Select(x => (x.Key, x.Count)));
        var hotelsByStatus = BuildCountDictionary(AllHotelStatuses, hotelStatusCounts.Select(x => (x.Key, x.Count)));
        var bookingsByStatus = BuildCountDictionary(AllBookingStatuses, bookingStatusCounts.Select(x => (x.Key, x.Count)));

        return Ok(new AdminStatsDto(
            usersByRole.Values.Sum(),
            usersByRole,
            usersByStatus,
            hotelsByStatus.Values.Sum(),
            hotelsByStatus,
            totalPaidRevenue,
            bookingsByStatus.Values.Sum(),
            bookingsByStatus,
            topHotels));
    }

    private static Dictionary<string, int> BuildCountDictionary(
        IReadOnlyList<string> keys,
        IEnumerable<(string Key, int Count)> rows)
    {
        var map = keys.ToDictionary(k => k, _ => 0, StringComparer.Ordinal);
        foreach (var (key, count) in rows)
            map[key] = count;
        return map;
    }
}
