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
public class OwnerRoomTypesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AvailabilityService _availability;

    public OwnerRoomTypesController(AppDbContext db, AvailabilityService availability)
    {
        _db = db;
        _availability = availability;
    }

    // GET /api/owner/hotels/{hotelId}/room-types — danh sách loại phòng kèm số phòng đã đặt và còn trống hôm nay.
    [HttpGet("hotels/{hotelId:int}/room-types")]
    public async Task<IActionResult> GetRoomTypes(int hotelId, CancellationToken ct)
    {
        var ownerId = ControllerHelpers.GetCurrentUserId(User);
        if (ownerId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        var ownsHotel = await _db.Hotels
            .AsNoTracking()
            .AnyAsync(h => h.Id == hotelId && h.OwnerId == ownerId.Value, ct);

        if (!ownsHotel)
            return NotFound(new { message = "Không tìm thấy khách sạn." });

        var roomTypes = await _db.RoomTypes
            .AsNoTracking()
            .Where(rt => rt.HotelId == hotelId && rt.Hotel.OwnerId == ownerId.Value)
            .OrderBy(rt => rt.PricePerNight)
            .ThenBy(rt => rt.Id)
            .Select(rt => new
            {
                rt.Id,
                rt.HotelId,
                rt.Name,
                rt.BedType,
                rt.ViewType,
                rt.HasBathtub,
                rt.MaxAdults,
                rt.MaxChildren,
                rt.SizeM2,
                rt.PricePerNight,
                rt.TotalRooms,
                rt.Description,
                rt.Amenities,
                rt.IsActive,
                Images = rt.Images
                    .OrderBy(i => i.SortOrder)
                    .ThenBy(i => i.Id)
                    .Select(i => new OwnerImageDto(i.Id, i.Url, i.SortOrder))
                    .ToList()
            })
            .ToListAsync(ct);

        var today = BookingService.GetVietnamToday();
        var ids = roomTypes.Select(rt => rt.Id).ToList();
        var bookedByRoomType = await _availability.CountBookedOnDateAsync(ids, today, ct);

        var items = roomTypes.Select(rt =>
        {
            var bookedToday = bookedByRoomType.GetValueOrDefault(rt.Id);
            var available = Math.Max(0, rt.TotalRooms - bookedToday);
            return new RoomTypeOwnerDto(
                rt.Id,
                rt.HotelId,
                rt.Name,
                rt.BedType,
                rt.ViewType,
                rt.HasBathtub,
                rt.MaxAdults,
                rt.MaxChildren,
                rt.SizeM2,
                rt.PricePerNight,
                rt.TotalRooms,
                rt.Description,
                ControllerHelpers.ParseCsvTokens(rt.Amenities),
                rt.IsActive,
                bookedToday,
                available,
                rt.Images);
        }).ToList();

        return Ok(items);
    }

    // POST /api/owner/hotels/{hotelId}/room-types — tạo loại phòng mới cho khách sạn thuộc quyền sở hữu.
    [HttpPost("hotels/{hotelId:int}/room-types")]
    public async Task<IActionResult> CreateRoomType(
        int hotelId,
        [FromBody] RoomTypeUpsertRequest request,
        CancellationToken ct)
    {
        var ownerId = ControllerHelpers.GetCurrentUserId(User);
        if (ownerId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        var name = request.Name?.Trim() ?? string.Empty;
        var bedType = request.BedType?.Trim() ?? string.Empty;
        if (name.Length < 2)
            return BadRequest(new { message = "Tên loại phòng phải có ít nhất 2 ký tự." });
        if (string.IsNullOrWhiteSpace(bedType))
            return BadRequest(new { message = "Vui lòng nhập loại giường." });

        var ownsHotel = await _db.Hotels
            .AsNoTracking()
            .AnyAsync(h => h.Id == hotelId && h.OwnerId == ownerId.Value, ct);

        if (!ownsHotel)
            return NotFound(new { message = "Không tìm thấy khách sạn." });

        var roomType = new RoomType
        {
            HotelId = hotelId,
            Name = name,
            BedType = bedType,
            ViewType = request.ViewType?.Trim() ?? string.Empty,
            HasBathtub = request.HasBathtub,
            MaxAdults = request.MaxAdults,
            MaxChildren = request.MaxChildren,
            SizeM2 = request.SizeM2,
            PricePerNight = request.PricePerNight,
            TotalRooms = request.TotalRooms,
            Description = request.Description?.Trim() ?? string.Empty,
            Amenities = ControllerHelpers.NormalizeCsv(request.Amenities),
            IsActive = request.IsActive ?? true
        };

        _db.RoomTypes.Add(roomType);
        await _db.SaveChangesAsync(ct);

        return StatusCode(
            StatusCodes.Status201Created,
            ToDto(roomType, 0, roomType.TotalRooms, []));
    }

    // PUT /api/owner/room-types/{id} — cập nhật thông tin loại phòng thuộc khách sạn của mình.
    [HttpPut("room-types/{id:int}")]
    public async Task<IActionResult> UpdateRoomType(
        int id,
        [FromBody] RoomTypeUpsertRequest request,
        CancellationToken ct)
    {
        var ownerId = ControllerHelpers.GetCurrentUserId(User);
        if (ownerId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        var name = request.Name?.Trim() ?? string.Empty;
        var bedType = request.BedType?.Trim() ?? string.Empty;
        if (name.Length < 2)
            return BadRequest(new { message = "Tên loại phòng phải có ít nhất 2 ký tự." });
        if (string.IsNullOrWhiteSpace(bedType))
            return BadRequest(new { message = "Vui lòng nhập loại giường." });

        var roomType = await _db.RoomTypes
            .Include(rt => rt.Images)
            .FirstOrDefaultAsync(rt => rt.Id == id && rt.Hotel.OwnerId == ownerId.Value, ct);

        if (roomType is null)
            return NotFound(new { message = "Không tìm thấy loại phòng." });

        roomType.Name = name;
        roomType.BedType = bedType;
        roomType.ViewType = request.ViewType?.Trim() ?? string.Empty;
        roomType.HasBathtub = request.HasBathtub;
        roomType.MaxAdults = request.MaxAdults;
        roomType.MaxChildren = request.MaxChildren;
        roomType.SizeM2 = request.SizeM2;
        roomType.PricePerNight = request.PricePerNight;
        roomType.TotalRooms = request.TotalRooms;
        roomType.Description = request.Description?.Trim() ?? string.Empty;
        roomType.Amenities = ControllerHelpers.NormalizeCsv(request.Amenities);
        if (request.IsActive.HasValue)
            roomType.IsActive = request.IsActive.Value;

        await _db.SaveChangesAsync(ct);

        var today = BookingService.GetVietnamToday();
        var bookedMap = await _availability.CountBookedOnDateAsync([roomType.Id], today, ct);
        var bookedToday = bookedMap.GetValueOrDefault(roomType.Id);
        var available = Math.Max(0, roomType.TotalRooms - bookedToday);

        var images = roomType.Images
            .OrderBy(i => i.SortOrder)
            .ThenBy(i => i.Id)
            .Select(i => new OwnerImageDto(i.Id, i.Url, i.SortOrder))
            .ToList();

        return Ok(ToDto(roomType, bookedToday, available, images));
    }

    // DELETE /api/owner/room-types/{id} — xoá mềm (IsActive = false) nếu đã có booking, ngược lại xoá hẳn.
    [HttpDelete("room-types/{id:int}")]
    public async Task<IActionResult> DeleteRoomType(int id, CancellationToken ct)
    {
        var ownerId = ControllerHelpers.GetCurrentUserId(User);
        if (ownerId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        var roomType = await _db.RoomTypes
            .FirstOrDefaultAsync(rt => rt.Id == id && rt.Hotel.OwnerId == ownerId.Value, ct);

        if (roomType is null)
            return NotFound(new { message = "Không tìm thấy loại phòng." });

        // Kiểm tra booking gắn với loại phòng (ràng buộc FK Restrict trong DB cũng không cho xoá cứng khi đã có booking).
        var hasActiveOrHistoryBookings = await _db.Bookings
            .AsNoTracking()
            .AnyAsync(b => b.RoomTypeId == id && b.Hotel.OwnerId == ownerId.Value, ct);

        if (hasActiveOrHistoryBookings)
        {
            roomType.IsActive = false;
            await _db.SaveChangesAsync(ct);
            return Ok(new
            {
                message = "Loại phòng đã phát sinh đơn đặt nên được chuyển sang trạng thái ngừng hoạt động.",
                softDeleted = true
            });
        }

        _db.RoomTypes.Remove(roomType);
        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            message = "Đã xoá loại phòng.",
            softDeleted = false
        });
    }

    // POST /api/owner/room-types/{id}/images — gắn ảnh cho loại phòng.
    [HttpPost("room-types/{id:int}/images")]
    public async Task<IActionResult> AddRoomTypeImage(int id, [FromBody] AddImageRequest request, CancellationToken ct)
    {
        var ownerId = ControllerHelpers.GetCurrentUserId(User);
        if (ownerId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        var url = request.Url?.Trim() ?? string.Empty;
        if (!ControllerHelpers.IsValidImageUrl(url))
            return BadRequest(new { message = "Đường dẫn ảnh phải bắt đầu bằng /uploads/ hoặc http(s)://." });

        var ownsRoomType = await _db.RoomTypes
            .AsNoTracking()
            .AnyAsync(rt => rt.Id == id && rt.Hotel.OwnerId == ownerId.Value, ct);

        if (!ownsRoomType)
            return NotFound(new { message = "Không tìm thấy loại phòng." });

        var image = new RoomTypeImage
        {
            RoomTypeId = id,
            Url = url,
            SortOrder = request.SortOrder
        };

        _db.RoomTypeImages.Add(image);
        await _db.SaveChangesAsync(ct);

        return StatusCode(StatusCodes.Status201Created, new OwnerImageDto(image.Id, image.Url, image.SortOrder));
    }

    // DELETE /api/owner/room-types/{id}/images/{imageId} — xoá ảnh loại phòng.
    [HttpDelete("room-types/{id:int}/images/{imageId:int}")]
    public async Task<IActionResult> DeleteRoomTypeImage(int id, int imageId, CancellationToken ct)
    {
        var ownerId = ControllerHelpers.GetCurrentUserId(User);
        if (ownerId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        var image = await _db.RoomTypeImages
            .FirstOrDefaultAsync(i => i.Id == imageId && i.RoomTypeId == id && i.RoomType.Hotel.OwnerId == ownerId.Value, ct);

        if (image is null)
            return NotFound(new { message = "Không tìm thấy ảnh loại phòng." });

        _db.RoomTypeImages.Remove(image);
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Đã xoá ảnh loại phòng." });
    }

    private static RoomTypeOwnerDto ToDto(
        RoomType rt,
        int bookedToday,
        int available,
        IReadOnlyList<OwnerImageDto> images) =>
        new(
            rt.Id,
            rt.HotelId,
            rt.Name,
            rt.BedType,
            rt.ViewType,
            rt.HasBathtub,
            rt.MaxAdults,
            rt.MaxChildren,
            rt.SizeM2,
            rt.PricePerNight,
            rt.TotalRooms,
            rt.Description,
            ControllerHelpers.ParseCsvTokens(rt.Amenities),
            rt.IsActive,
            bookedToday,
            available,
            images);
}
