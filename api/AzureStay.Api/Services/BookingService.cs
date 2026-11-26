using System.Data;
using System.Net.Mail;
using System.Security.Cryptography;
using AzureStay.Api.Data;
using AzureStay.Api.Models;
using AzureStay.Api.Models.Dtos;
using Microsoft.EntityFrameworkCore;

namespace AzureStay.Api.Services;

public sealed record ServiceResult<T>(
    bool Succeeded,
    int StatusCode,
    T? Data,
    string? ErrorMessage = null,
    IReadOnlyList<string>? Errors = null)
{
    public static ServiceResult<T> Ok(T data, int statusCode = StatusCodes.Status200OK) =>
        new(true, statusCode, data);

    public static ServiceResult<T> Fail(int statusCode, string message, IReadOnlyList<string>? errors = null) =>
        new(false, statusCode, default, message, errors);
}

// Dịch vụ xử lý toàn bộ nghiệp vụ đặt phòng, tra cứu và chuyển trạng thái đơn.
public class BookingService
{
    public const int MaxNightsPerBooking = 30;
    private const string CodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Tránh ký tự dễ nhầm lẫn nhưng vẫn thuộc A-Z0-9.
    private const int BookingCodeLength = 8;

    private static readonly TimeZoneInfo VietnamTimeZone = ResolveVietnamTimeZone();
    private static readonly HashSet<string> ValidStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        BookingStatuses.Pending,
        BookingStatuses.Confirmed,
        BookingStatuses.CheckedIn,
        BookingStatuses.Completed,
        BookingStatuses.Cancelled
    };

    private readonly AppDbContext _db;
    private readonly AvailabilityService _availability;

    public BookingService(AppDbContext db, AvailabilityService availability)
    {
        _db = db;
        _availability = availability;
    }

    public static DateOnly GetVietnamToday()
    {
        var vnNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VietnamTimeZone);
        return DateOnly.FromDateTime(vnNow);
    }

    // Tạo đơn đặt phòng mới ở trạng thái Pending theo đủ 5 quy tắc ở SPEC mục 3.
    public async Task<ServiceResult<BookingDto>> CreateBookingAsync(
        int userId,
        CreateBookingRequest request,
        CancellationToken ct = default)
    {
        var guestName = request.GuestName?.Trim() ?? string.Empty;
        var guestPhone = request.GuestPhone?.Trim() ?? string.Empty;
        var guestEmail = request.GuestEmail?.Trim().ToLowerInvariant() ?? string.Empty;
        var note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();

        var errors = ValidateCreateRequest(request, guestName, guestPhone, guestEmail, note);
        if (errors.Count > 0)
            return ServiceResult<BookingDto>.Fail(StatusCodes.Status400BadRequest, errors[0], errors);

        var roomTypeId = request.RoomTypeId!.Value;
        var checkIn = request.CheckIn!.Value;
        var checkOut = request.CheckOut!.Value;
        var rooms = request.Rooms!.Value;
        var adults = request.Adults!.Value;
        var children = request.Children;
        var nights = checkOut.DayNumber - checkIn.DayNumber;

        var roomType = await _db.RoomTypes
            .AsNoTracking()
            .Include(rt => rt.Hotel)
            .FirstOrDefaultAsync(rt => rt.Id == roomTypeId, ct);

        if (roomType is null || !roomType.IsActive || roomType.Hotel.Status != HotelStatuses.Active)
            return ServiceResult<BookingDto>.Fail(
                StatusCodes.Status400BadRequest,
                "Loại phòng không tồn tại hoặc khách sạn hiện không nhận đặt phòng.");

        var maxCapacity = (roomType.MaxAdults + roomType.MaxChildren) * rooms;
        if (adults + children > maxCapacity)
        {
            return ServiceResult<BookingDto>.Fail(
                StatusCodes.Status400BadRequest,
                $"Tổng số khách ({adults + children}) vượt quá sức chứa tối đa {maxCapacity} khách cho {rooms} phòng.");
        }

        // Mở transaction Serializable để kiểm tra tồn kho ngay trước khi ghi, tránh overbooking đồng thời.
        await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);

        var available = await _availability.CountAvailableAsync(roomType.Id, checkIn, checkOut, null, ct);
        if (available < rooms)
        {
            await transaction.RollbackAsync(ct);
            return ServiceResult<BookingDto>.Fail(
                StatusCodes.Status400BadRequest,
                available == 0
                    ? "Loại phòng này đã hết phòng trong khoảng ngày bạn chọn."
                    : $"Chỉ còn {available} phòng trống trong khoảng ngày bạn chọn.");
        }

        var code = await GenerateUniqueCodeAsync(ct);
        var nowUtc = DateTime.UtcNow;

        var booking = new Booking
        {
            Code = code,
            UserId = userId,
            HotelId = roomType.HotelId,
            RoomTypeId = roomType.Id,
            GuestName = guestName,
            GuestPhone = guestPhone,
            GuestEmail = guestEmail,
            CheckIn = checkIn,
            CheckOut = checkOut,
            Rooms = rooms,
            Adults = adults,
            Children = children,
            PricePerNight = roomType.PricePerNight,
            TotalAmount = nights * rooms * roomType.PricePerNight,
            Status = BookingStatuses.Pending,
            Note = note,
            CreatedAt = nowUtc,
            UpdatedAt = nowUtc
        };

        _db.Bookings.Add(booking);
        await _db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        var dto = ToDto(booking, roomType.Hotel.Name, roomType.Hotel.Slug, roomType.Name);
        return ServiceResult<BookingDto>.Ok(dto, StatusCodes.Status201Created);
    }

    // Danh sách đơn đặt phòng của chính người dùng hiện tại, mới nhất trước.
    public async Task<ServiceResult<PagedResult<BookingDto>>> GetMyBookingsAsync(
        int userId,
        string? status,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = _db.Bookings
            .AsNoTracking()
            .Where(b => b.UserId == userId);

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalized = status.Trim();
            var matched = ValidStatuses.FirstOrDefault(s => s.Equals(normalized, StringComparison.OrdinalIgnoreCase));
            if (matched is null)
            {
                return ServiceResult<PagedResult<BookingDto>>.Fail(
                    StatusCodes.Status400BadRequest,
                    "Trạng thái lọc đơn đặt phòng không hợp lệ.");
            }

            query = query.Where(b => b.Status == matched);
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(b => b.CreatedAt)
            .ThenByDescending(b => b.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new BookingDto(
                b.Id,
                b.Code,
                b.HotelId,
                b.Hotel.Name,
                b.Hotel.Slug,
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

        return ServiceResult<PagedResult<BookingDto>>.Ok(new PagedResult<BookingDto>(total, page, pageSize, items));
    }

    // Xem chi tiết đơn theo mã; trả 404 nếu không phải chủ đơn và không phải Admin để không lộ mã đơn.
    public async Task<ServiceResult<BookingDto>> GetBookingByCodeAsync(
        string code,
        int currentUserId,
        bool isAdmin,
        CancellationToken ct = default)
    {
        var normalizedCode = code.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(normalizedCode))
            return ServiceResult<BookingDto>.Fail(StatusCodes.Status404NotFound, "Không tìm thấy đơn đặt phòng.");

        var booking = await _db.Bookings
            .AsNoTracking()
            .Include(b => b.Hotel)
            .Include(b => b.RoomType)
            .FirstOrDefaultAsync(b => b.Code == normalizedCode, ct);

        if (booking is null || (!isAdmin && booking.UserId != currentUserId))
            return ServiceResult<BookingDto>.Fail(StatusCodes.Status404NotFound, "Không tìm thấy đơn đặt phòng.");

        return ServiceResult<BookingDto>.Ok(ToDto(booking, booking.Hotel.Name, booking.Hotel.Slug, booking.RoomType.Name));
    }

    // Huỷ đơn đặt phòng của chính khách; chỉ hợp lệ khi đơn đang Pending hoặc Confirmed.
    public async Task<ServiceResult<BookingDto>> CancelBookingAsync(
        int bookingId,
        int currentUserId,
        string? reason,
        CancellationToken ct = default)
    {
        var booking = await _db.Bookings
            .Include(b => b.Hotel)
            .Include(b => b.RoomType)
            .FirstOrDefaultAsync(b => b.Id == bookingId, ct);

        if (booking is null || booking.UserId != currentUserId)
            return ServiceResult<BookingDto>.Fail(StatusCodes.Status404NotFound, "Không tìm thấy đơn đặt phòng.");

        // Chỉ Pending và Confirmed mới được phép huỷ theo vòng đời trạng thái ở SPEC mục 3.
        if (booking.Status == BookingStatuses.Cancelled)
            return ServiceResult<BookingDto>.Fail(StatusCodes.Status400BadRequest, "Đơn đặt phòng này đã được huỷ trước đó.");

        if (booking.Status == BookingStatuses.CheckedIn)
            return ServiceResult<BookingDto>.Fail(StatusCodes.Status400BadRequest, "Không thể huỷ đơn đặt phòng đã nhận phòng.");

        if (booking.Status == BookingStatuses.Completed)
            return ServiceResult<BookingDto>.Fail(StatusCodes.Status400BadRequest, "Không thể huỷ đơn đặt phòng đã hoàn tất.");

        if (booking.Status != BookingStatuses.Pending && booking.Status != BookingStatuses.Confirmed)
            return ServiceResult<BookingDto>.Fail(StatusCodes.Status400BadRequest, "Trạng thái đơn hiện tại không thể huỷ.");

        booking.Status = BookingStatuses.Cancelled;
        booking.UpdatedAt = DateTime.UtcNow;

        var trimmedReason = reason?.Trim();
        if (!string.IsNullOrWhiteSpace(trimmedReason))
        {
            var cancelNote = $"Lý do huỷ: {trimmedReason}";
            var combined = string.IsNullOrWhiteSpace(booking.Note)
                ? cancelNote
                : $"{booking.Note} | {cancelNote}";
            booking.Note = combined.Length <= 500 ? combined : combined[..500];
        }

        await _db.SaveChangesAsync(ct);

        return ServiceResult<BookingDto>.Ok(ToDto(booking, booking.Hotel.Name, booking.Hotel.Slug, booking.RoomType.Name));
    }

    private static List<string> ValidateCreateRequest(
        CreateBookingRequest request,
        string guestName,
        string guestPhone,
        string guestEmail,
        string? note)
    {
        var errors = new List<string>();
        var today = GetVietnamToday();

        if (!request.RoomTypeId.HasValue || request.RoomTypeId.Value <= 0)
            errors.Add("Mã loại phòng không hợp lệ.");

        if (!request.CheckIn.HasValue || !request.CheckOut.HasValue)
        {
            errors.Add("Vui lòng chọn đầy đủ ngày nhận phòng và ngày trả phòng.");
        }
        else
        {
            var checkIn = request.CheckIn.Value;
            var checkOut = request.CheckOut.Value;

            if (checkIn < today)
                errors.Add("Ngày nhận phòng phải từ hôm nay trở đi.");
            if (checkOut <= checkIn)
                errors.Add("Ngày trả phòng phải sau ngày nhận phòng.");
            else if (checkOut.DayNumber - checkIn.DayNumber > MaxNightsPerBooking)
                errors.Add($"Số đêm lưu trú tối đa là {MaxNightsPerBooking} đêm.");
        }

        if (!request.Rooms.HasValue || request.Rooms.Value < 1)
            errors.Add("Số lượng phòng phải ít nhất là 1.");

        if (!request.Adults.HasValue || request.Adults.Value < 1)
            errors.Add("Số người lớn phải ít nhất là 1.");

        if (request.Children < 0)
            errors.Add("Số trẻ em không được âm.");

        if (guestName.Length < 2 || guestName.Length > 120)
            errors.Add("Họ tên khách phải từ 2 đến 120 ký tự.");

        if (guestPhone.Length < 6 || guestPhone.Length > 20)
            errors.Add("Số điện thoại liên hệ không hợp lệ.");

        if (string.IsNullOrWhiteSpace(guestEmail) || guestEmail.Length > 160 || !MailAddress.TryCreate(guestEmail, out _))
            errors.Add("Email liên hệ không hợp lệ.");

        if (note is not null && note.Length > 500)
            errors.Add("Ghi chú không được vượt quá 500 ký tự.");

        return errors;
    }

    private async Task<string> GenerateUniqueCodeAsync(CancellationToken ct)
    {
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var chars = new char[BookingCodeLength];
            for (var i = 0; i < chars.Length; i++)
                chars[i] = CodeAlphabet[RandomNumberGenerator.GetInt32(CodeAlphabet.Length)];

            var candidate = new string(chars);
            var exists = await _db.Bookings.AnyAsync(b => b.Code == candidate, ct);
            if (!exists)
                return candidate;
        }

        throw new InvalidOperationException("Không thể sinh mã đặt phòng duy nhất.");
    }

    private static BookingDto ToDto(Booking b, string hotelName, string hotelSlug, string roomTypeName) =>
        new(
            b.Id,
            b.Code,
            b.HotelId,
            hotelName,
            hotelSlug,
            b.RoomTypeId,
            roomTypeName,
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
            b.UpdatedAt);

    private static TimeZoneInfo ResolveVietnamTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
        }
    }
}
