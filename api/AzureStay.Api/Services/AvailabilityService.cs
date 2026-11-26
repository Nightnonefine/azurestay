using AzureStay.Api.Data;
using AzureStay.Api.Models;
using AzureStay.Api.Models.Dtos;
using Microsoft.EntityFrameworkCore;

namespace AzureStay.Api.Services;

// Dịch vụ tính tồn kho phòng theo công thức SPEC mục 3 (không lưu bảng tồn kho theo ngày).
public class AvailabilityService
{
    public const int PendingHoldMinutes = 30;

    private readonly AppDbContext _db;

    public AvailabilityService(AppDbContext db) => _db = db;

    // Tính số phòng còn trống của một loại phòng trong khoảng [from, to).
    public async Task<int> CountAvailableAsync(
        int roomTypeId,
        DateOnly from,
        DateOnly to,
        int? ignoreBookingId = null,
        CancellationToken ct = default)
    {
        if (to <= from)
            return 0;

        var roomType = await _db.RoomTypes
            .AsNoTracking()
            .Where(rt => rt.Id == roomTypeId && rt.IsActive)
            .Select(rt => new { rt.Id, rt.TotalRooms })
            .FirstOrDefaultAsync(ct);

        if (roomType is null)
            return 0;

        var bookings = await QueryOverlappingActiveBookings(
            [roomTypeId], from, to, ignoreBookingId, ct);

        return ComputeMinAvailableAcrossDays(roomType.TotalRooms, bookings, from, to);
    }

    // Tính tồn kho hàng loạt cho nhiều loại phòng trong cùng một truy vấn để tránh N+1.
    public async Task<Dictionary<int, int>> CountAvailableByRoomTypesAsync(
        IReadOnlyCollection<int> roomTypeIds,
        DateOnly from,
        DateOnly to,
        CancellationToken ct = default)
    {
        var result = new Dictionary<int, int>();
        if (roomTypeIds.Count == 0 || to <= from)
            return result;

        var roomTypes = await _db.RoomTypes
            .AsNoTracking()
            .Where(rt => roomTypeIds.Contains(rt.Id) && rt.IsActive)
            .Select(rt => new { rt.Id, rt.TotalRooms })
            .ToListAsync(ct);

        var activeIds = roomTypes.Select(rt => rt.Id).ToList();
        var bookings = await QueryOverlappingActiveBookings(activeIds, from, to, null, ct);
        var byRoomType = bookings.GroupBy(b => b.RoomTypeId)
            .ToDictionary(g => g.Key, g => g.ToList());

        foreach (var rt in roomTypes)
        {
            var rtBookings = byRoomType.TryGetValue(rt.Id, out var list) ? list : [];
            result[rt.Id] = ComputeMinAvailableAcrossDays(rt.TotalRooms, rtBookings, from, to);
        }

        return result;
    }

    // Đếm tổng số phòng đang giữ/đã đặt trong một ngày cụ thể theo từng loại phòng (dùng cho màn Owner).
    public async Task<Dictionary<int, int>> CountBookedOnDateAsync(
        IReadOnlyCollection<int> roomTypeIds,
        DateOnly date,
        CancellationToken ct = default)
    {
        var result = new Dictionary<int, int>();
        if (roomTypeIds.Count == 0)
            return result;

        var bookings = await QueryOverlappingActiveBookings(
            roomTypeIds, date, date.AddDays(1), null, ct);

        foreach (var b in bookings)
            result[b.RoomTypeId] = result.GetValueOrDefault(b.RoomTypeId) + b.Rooms;

        return result;
    }

    // Dựng lưới tồn kho theo từng ngày trong khoảng [from, to) cho một khách sạn.
    public async Task<List<DailyAvailabilityDto>> GetHotelAvailabilityAsync(
        int hotelId,
        DateOnly from,
        DateOnly to,
        CancellationToken ct = default)
    {
        var roomTypes = await _db.RoomTypes
            .AsNoTracking()
            .Where(rt => rt.HotelId == hotelId && rt.IsActive)
            .OrderBy(rt => rt.PricePerNight)
            .ThenBy(rt => rt.Id)
            .Select(rt => new { rt.Id, rt.Name, rt.TotalRooms })
            .ToListAsync(ct);

        var roomTypeIds = roomTypes.Select(rt => rt.Id).ToList();
        var bookings = roomTypeIds.Count > 0
            ? await QueryOverlappingActiveBookings(roomTypeIds, from, to, null, ct)
            : [];

        var byRoomType = bookings.GroupBy(b => b.RoomTypeId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var days = new List<DailyAvailabilityDto>();
        for (var day = from; day < to; day = day.AddDays(1))
        {
            var items = new List<RoomTypeAvailabilityDto>(roomTypes.Count);
            foreach (var rt in roomTypes)
            {
                var booked = 0;
                if (byRoomType.TryGetValue(rt.Id, out var rtBookings))
                {
                    foreach (var b in rtBookings)
                    {
                        if (b.CheckIn <= day && b.CheckOut > day)
                            booked += b.Rooms;
                    }
                }

                var available = Math.Max(0, rt.TotalRooms - booked);
                items.Add(new RoomTypeAvailabilityDto(rt.Id, rt.Name, rt.TotalRooms, booked, available));
            }

            days.Add(new DailyAvailabilityDto(day, items));
        }

        return days;
    }

    private async Task<List<BookingSlot>> QueryOverlappingActiveBookings(
        IReadOnlyCollection<int> roomTypeIds,
        DateOnly from,
        DateOnly to,
        int? ignoreBookingId,
        CancellationToken ct)
    {
        if (roomTypeIds.Count == 0)
            return [];

        // Đơn Pending quá 30 phút chưa thanh toán được coi là hết hạn giữ chỗ.
        var pendingThreshold = DateTime.UtcNow.AddMinutes(-PendingHoldMinutes);

        var query = _db.Bookings
            .AsNoTracking()
            .Where(b => roomTypeIds.Contains(b.RoomTypeId)
                        && b.CheckIn < to
                        && b.CheckOut > from
                        && (b.Status == BookingStatuses.Confirmed
                            || b.Status == BookingStatuses.CheckedIn
                            || (b.Status == BookingStatuses.Pending && b.CreatedAt >= pendingThreshold)));

        if (ignoreBookingId.HasValue)
            query = query.Where(b => b.Id != ignoreBookingId.Value);

        return await query
            .Select(b => new BookingSlot(b.RoomTypeId, b.CheckIn, b.CheckOut, b.Rooms))
            .ToListAsync(ct);
    }

    // Lấy số phòng trống nhỏ nhất trên từng đêm trong khoảng [from, to) để vừa khớp công thức SPEC vừa không đếm trùng khách nối tiếp.
    private static int ComputeMinAvailableAcrossDays(
        int totalRooms,
        IReadOnlyList<BookingSlot> bookings,
        DateOnly from,
        DateOnly to)
    {
        if (bookings.Count == 0)
            return Math.Max(0, totalRooms);

        var maxBooked = 0;
        for (var day = from; day < to; day = day.AddDays(1))
        {
            var bookedOnDay = 0;
            foreach (var b in bookings)
            {
                if (b.CheckIn <= day && b.CheckOut > day)
                    bookedOnDay += b.Rooms;
            }

            if (bookedOnDay > maxBooked)
                maxBooked = bookedOnDay;
        }

        return Math.Max(0, totalRooms - maxBooked);
    }

    private sealed record BookingSlot(int RoomTypeId, DateOnly CheckIn, DateOnly CheckOut, int Rooms);
}
