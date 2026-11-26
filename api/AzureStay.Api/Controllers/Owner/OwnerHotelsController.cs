using AzureStay.Api.Data;
using AzureStay.Api.Models;
using AzureStay.Api.Models.Dtos;
using AzureStay.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AzureStay.Api.Controllers.Owner;

[ApiController]
[Route("api/owner/hotels")]
[Authorize(Roles = UserRoles.Owner)]
public class OwnerHotelsController : ControllerBase
{
    private static readonly HashSet<string> ValidStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        HotelStatuses.Pending,
        HotelStatuses.Active,
        HotelStatuses.Suspended,
        HotelStatuses.Rejected
    };

    private readonly AppDbContext _db;
    private readonly SlugService _slugService;

    public OwnerHotelsController(AppDbContext db, SlugService slugService)
    {
        _db = db;
        _slugService = slugService;
    }

    // GET /api/owner/hotels — danh sách khách sạn thuộc chủ sở hữu hiện tại.
    [HttpGet]
    public async Task<IActionResult> GetMyHotels(
        [FromQuery] string? status = null,
        [FromQuery] string? q = null,
        [FromQuery] string? sort = "newest",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var ownerId = ControllerHelpers.GetCurrentUserId(User);
        if (ownerId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        // Luôn lọc theo OwnerId ngay trong câu truy vấn SQL.
        var query = _db.Hotels
            .AsNoTracking()
            .Where(h => h.OwnerId == ownerId.Value);

        if (!string.IsNullOrWhiteSpace(status))
        {
            var matchedStatus = ValidStatuses.FirstOrDefault(s => s.Equals(status.Trim(), StringComparison.OrdinalIgnoreCase));
            if (matchedStatus is null)
                return BadRequest(new { message = "Trạng thái lọc khách sạn không hợp lệ." });

            query = query.Where(h => h.Status == matchedStatus);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var pattern = $"%{q.Trim()}%";
            query = query.Where(h =>
                EF.Functions.Like(h.Name, pattern)
                || EF.Functions.Like(h.City, pattern)
                || EF.Functions.Like(h.District, pattern));
        }

        query = sort?.Trim().ToLowerInvariant() switch
        {
            "name" => query.OrderBy(h => h.Name).ThenBy(h => h.Id),
            "name-desc" => query.OrderByDescending(h => h.Name).ThenByDescending(h => h.Id),
            "oldest" => query.OrderBy(h => h.CreatedAt).ThenBy(h => h.Id),
            _ => query.OrderByDescending(h => h.CreatedAt).ThenByDescending(h => h.Id)
        };

        var total = await query.CountAsync(ct);
        var rows = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(h => new
            {
                h.Id,
                h.Name,
                h.Slug,
                h.City,
                h.District,
                h.Address,
                h.Description,
                h.StarRating,
                h.Amenities,
                h.Status,
                h.Featured,
                RoomTypeCount = h.RoomTypes.Count,
                Images = h.Images
                    .OrderBy(i => i.SortOrder)
                    .ThenBy(i => i.Id)
                    .Select(i => new OwnerImageDto(i.Id, i.Url, i.SortOrder))
                    .ToList(),
                h.CreatedAt,
                h.UpdatedAt
            })
            .ToListAsync(ct);

        var items = rows.Select(h => new OwnerHotelDto(
            h.Id,
            h.Name,
            h.Slug,
            h.City,
            h.District,
            h.Address,
            h.Description,
            h.StarRating,
            ControllerHelpers.ParseCsvTokens(h.Amenities),
            h.Status,
            h.Featured,
            h.RoomTypeCount,
            h.Images,
            h.CreatedAt,
            h.UpdatedAt)).ToList();

        return Ok(new PagedResult<OwnerHotelDto>(total, page, pageSize, items));
    }

    // POST /api/owner/hotels — tạo khách sạn mới ở trạng thái Pending chờ Admin duyệt.
    [HttpPost]
    public async Task<IActionResult> CreateHotel([FromBody] HotelUpsertRequest request, CancellationToken ct)
    {
        var ownerId = ControllerHelpers.GetCurrentUserId(User);
        if (ownerId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        var name = request.Name?.Trim() ?? string.Empty;
        var city = request.City?.Trim() ?? string.Empty;
        var district = request.District?.Trim() ?? string.Empty;
        var address = request.Address?.Trim() ?? string.Empty;
        var description = request.Description?.Trim() ?? string.Empty;

        var errors = ValidateHotelFields(name, city, district, address);
        if (errors.Count > 0)
            return BadRequest(new { message = errors[0], errors });

        var slug = await _slugService.GenerateUniqueHotelSlugAsync(name, null, ct);
        var now = DateTime.UtcNow;

        var hotel = new Hotel
        {
            OwnerId = ownerId.Value,
            Name = name,
            Slug = slug,
            City = city,
            District = district,
            Address = address,
            Description = description,
            StarRating = request.StarRating,
            Amenities = ControllerHelpers.NormalizeCsv(request.Amenities),
            Status = HotelStatuses.Pending,
            Featured = false,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.Hotels.Add(hotel);
        await _db.SaveChangesAsync(ct);

        return StatusCode(StatusCodes.Status201Created, ToDto(hotel, 0, []));
    }

    // PUT /api/owner/hotels/{id} — cập nhật thông tin khách sạn của mình (không cho tự đổi Status/Featured/OwnerId).
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateHotel(int id, [FromBody] HotelUpsertRequest request, CancellationToken ct)
    {
        var ownerId = ControllerHelpers.GetCurrentUserId(User);
        if (ownerId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        var name = request.Name?.Trim() ?? string.Empty;
        var city = request.City?.Trim() ?? string.Empty;
        var district = request.District?.Trim() ?? string.Empty;
        var address = request.Address?.Trim() ?? string.Empty;
        var description = request.Description?.Trim() ?? string.Empty;

        var errors = ValidateHotelFields(name, city, district, address);
        if (errors.Count > 0)
            return BadRequest(new { message = errors[0], errors });

        // Không thuộc owner hiện tại -> trả 404 để tránh lộ bản ghi tồn tại.
        var hotel = await _db.Hotels
            .Include(h => h.Images)
            .FirstOrDefaultAsync(h => h.Id == id && h.OwnerId == ownerId.Value, ct);

        if (hotel is null)
            return NotFound(new { message = "Không tìm thấy khách sạn." });

        hotel.Name = name;
        hotel.City = city;
        hotel.District = district;
        hotel.Address = address;
        hotel.Description = description;
        hotel.StarRating = request.StarRating;
        hotel.Amenities = ControllerHelpers.NormalizeCsv(request.Amenities);
        hotel.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        var roomTypeCount = await _db.RoomTypes
            .AsNoTracking()
            .CountAsync(rt => rt.HotelId == hotel.Id && rt.Hotel.OwnerId == ownerId.Value, ct);

        var images = hotel.Images
            .OrderBy(i => i.SortOrder)
            .ThenBy(i => i.Id)
            .Select(i => new OwnerImageDto(i.Id, i.Url, i.SortOrder))
            .ToList();

        return Ok(ToDto(hotel, roomTypeCount, images));
    }

    // POST /api/owner/hotels/{id}/images — gắn URL ảnh đã upload vào khách sạn.
    [HttpPost("{id:int}/images")]
    public async Task<IActionResult> AddHotelImage(int id, [FromBody] AddImageRequest request, CancellationToken ct)
    {
        var ownerId = ControllerHelpers.GetCurrentUserId(User);
        if (ownerId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        var url = request.Url?.Trim() ?? string.Empty;
        if (!ControllerHelpers.IsValidImageUrl(url))
            return BadRequest(new { message = "Đường dẫn ảnh phải bắt đầu bằng /uploads/ hoặc http(s)://." });

        var ownsHotel = await _db.Hotels
            .AsNoTracking()
            .AnyAsync(h => h.Id == id && h.OwnerId == ownerId.Value, ct);

        if (!ownsHotel)
            return NotFound(new { message = "Không tìm thấy khách sạn." });

        var image = new HotelImage
        {
            HotelId = id,
            Url = url,
            SortOrder = request.SortOrder
        };

        _db.HotelImages.Add(image);
        await _db.SaveChangesAsync(ct);

        return StatusCode(StatusCodes.Status201Created, new OwnerImageDto(image.Id, image.Url, image.SortOrder));
    }

    // DELETE /api/owner/hotels/{id}/images/{imageId} — xoá ảnh khách sạn thuộc quyền sở hữu.
    [HttpDelete("{id:int}/images/{imageId:int}")]
    public async Task<IActionResult> DeleteHotelImage(int id, int imageId, CancellationToken ct)
    {
        var ownerId = ControllerHelpers.GetCurrentUserId(User);
        if (ownerId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        var image = await _db.HotelImages
            .FirstOrDefaultAsync(hi => hi.Id == imageId && hi.HotelId == id && hi.Hotel.OwnerId == ownerId.Value, ct);

        if (image is null)
            return NotFound(new { message = "Không tìm thấy ảnh khách sạn." });

        _db.HotelImages.Remove(image);
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Đã xoá ảnh khách sạn." });
    }

    private static List<string> ValidateHotelFields(string name, string city, string district, string address)
    {
        var errors = new List<string>();
        if (name.Length < 2)
            errors.Add("Tên khách sạn phải có ít nhất 2 ký tự.");
        if (city.Length < 2)
            errors.Add("Tên thành phố phải có ít nhất 2 ký tự.");
        if (string.IsNullOrWhiteSpace(district))
            errors.Add("Vui lòng nhập quận/huyện.");
        if (address.Length < 2)
            errors.Add("Địa chỉ khách sạn phải có ít nhất 2 ký tự.");
        return errors;
    }

    private static OwnerHotelDto ToDto(Hotel hotel, int roomTypeCount, IReadOnlyList<OwnerImageDto> images) =>
        new(
            hotel.Id,
            hotel.Name,
            hotel.Slug,
            hotel.City,
            hotel.District,
            hotel.Address,
            hotel.Description,
            hotel.StarRating,
            ControllerHelpers.ParseCsvTokens(hotel.Amenities),
            hotel.Status,
            hotel.Featured,
            roomTypeCount,
            images,
            hotel.CreatedAt,
            hotel.UpdatedAt);
}
