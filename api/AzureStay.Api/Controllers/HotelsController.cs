using AzureStay.Api.Data;
using AzureStay.Api.Models;
using AzureStay.Api.Models.Dtos;
using AzureStay.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AzureStay.Api.Controllers;

[ApiController]
[Route("api/hotels")]
[AllowAnonymous]
public class HotelsController : ControllerBase
{
    public const int MaxAvailabilityRangeDays = 60;

    private readonly AppDbContext _db;
    private readonly AvailabilityService _availability;

    public HotelsController(AppDbContext db, AvailabilityService availability)
    {
        _db = db;
        _availability = availability;
    }

    // GET /api/hotels — tìm kiếm, lọc, sắp xếp và phân trang khách sạn đang Active.
    [HttpGet]
    public async Task<IActionResult> GetHotels(
        [FromQuery] string? city = null,
        [FromQuery] string? q = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] string? stars = null,
        [FromQuery] string? amenities = null,
        [FromQuery] DateOnly? checkIn = null,
        [FromQuery] DateOnly? checkOut = null,
        [FromQuery] int? guests = null,
        [FromQuery] string? sort = "popular",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        if (checkIn.HasValue != checkOut.HasValue)
            return BadRequest(new { message = "Vui lòng truyền đầy đủ cả ngày nhận phòng (checkIn) và ngày trả phòng (checkOut)." });

        if (checkIn.HasValue && checkOut.HasValue && checkOut.Value <= checkIn.Value)
            return BadRequest(new { message = "Ngày trả phòng phải sau ngày nhận phòng." });

        if (guests.HasValue && guests.Value < 1)
            return BadRequest(new { message = "Số khách phải ít nhất là 1." });

        if (minPrice.HasValue && maxPrice.HasValue && maxPrice.Value < minPrice.Value)
            return BadRequest(new { message = "Giá tối đa không được nhỏ hơn giá tối thiểu." });

        var starSet = ParseStars(stars, out var starsError);
        if (starsError is not null)
            return BadRequest(new { message = starsError });

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = _db.Hotels
            .AsNoTracking()
            .Where(h => h.Status == HotelStatuses.Active);

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
                || EF.Functions.Like(h.Address, pattern));
        }

        if (starSet.Count > 0)
            query = query.Where(h => starSet.Contains(h.StarRating));

        var rawHotels = await query
            .Select(h => new
            {
                h.Id,
                h.Name,
                h.Slug,
                h.City,
                h.District,
                h.StarRating,
                h.Featured,
                h.Amenities,
                CoverImage = h.Images
                    .OrderBy(i => i.SortOrder)
                    .Select(i => i.Url)
                    .FirstOrDefault(),
                ActiveRoomTypes = h.RoomTypes
                    .Where(rt => rt.IsActive)
                    .Select(rt => new
                    {
                        rt.Id,
                        rt.PricePerNight,
                        rt.MaxAdults,
                        rt.MaxChildren
                    })
                    .ToList(),
                ReviewCount = h.Reviews.Count,
                RatingSum = h.Reviews.Sum(r => (double?)r.Rating) ?? 0.0
            })
            .ToListAsync(ct);

        var requiredAmenities = ParseCsvTokens(amenities);
        var hasDateRange = checkIn.HasValue && checkOut.HasValue;
        var effectiveGuests = guests ?? 1;

        Dictionary<int, int>? availabilityByRoomType = null;
        if (hasDateRange)
        {
            // Chỉ tính tồn kho cho các loại phòng đáp ứng sức chứa tối thiểu.
            var candidateRoomTypeIds = rawHotels
                .SelectMany(h => h.ActiveRoomTypes)
                .Where(rt => rt.MaxAdults + rt.MaxChildren >= effectiveGuests)
                .Select(rt => rt.Id)
                .Distinct()
                .ToList();

            availabilityByRoomType = await _availability.CountAvailableByRoomTypesAsync(
                candidateRoomTypeIds,
                checkIn!.Value,
                checkOut!.Value,
                ct);
        }

        var filtered = new List<HotelListItemDto>();
        foreach (var h in rawHotels)
        {
            var hotelAmenities = ParseCsvTokens(h.Amenities);
            if (requiredAmenities.Count > 0 && !requiredAmenities.All(a => hotelAmenities.Contains(a)))
                continue;

            var hasActiveRooms = h.ActiveRoomTypes.Count > 0;
            var priceFrom = hasActiveRooms ? h.ActiveRoomTypes.Min(rt => rt.PricePerNight) : 0m;

            if (minPrice.HasValue && (!hasActiveRooms || priceFrom < minPrice.Value))
                continue;

            if (maxPrice.HasValue && (!hasActiveRooms || priceFrom > maxPrice.Value))
                continue;

            if (hasDateRange)
            {
                var hasAvailableRoom = h.ActiveRoomTypes.Any(rt =>
                    rt.MaxAdults + rt.MaxChildren >= effectiveGuests
                    && availabilityByRoomType!.TryGetValue(rt.Id, out var available)
                    && available > 0);

                if (!hasAvailableRoom)
                    continue;
            }
            else if (guests.HasValue)
            {
                var hasCapacity = h.ActiveRoomTypes.Any(rt => rt.MaxAdults + rt.MaxChildren >= effectiveGuests);
                if (!hasCapacity)
                    continue;
            }

            var ratingAvg = h.ReviewCount > 0 ? Math.Round(h.RatingSum / h.ReviewCount, 1) : 0.0;
            filtered.Add(new HotelListItemDto(
                h.Id,
                h.Name,
                h.Slug,
                h.City,
                h.District,
                h.StarRating,
                h.Featured,
                priceFrom,
                ratingAvg,
                h.ReviewCount,
                h.CoverImage,
                hotelAmenities));
        }

        var sorted = ApplySort(filtered, sort);
        var total = sorted.Count;
        var items = sorted
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return Ok(new PagedResult<HotelListItemDto>(total, page, pageSize, items));
    }

    // GET /api/hotels/{slug} — chi tiết khách sạn cùng danh sách loại phòng đang hoạt động.
    [HttpGet("{slug}")]
    public async Task<IActionResult> GetHotelBySlug(
        string slug,
        [FromQuery] DateOnly? checkIn = null,
        [FromQuery] DateOnly? checkOut = null,
        CancellationToken ct = default)
    {
        if (checkIn.HasValue != checkOut.HasValue)
            return BadRequest(new { message = "Vui lòng truyền đầy đủ cả ngày nhận phòng (checkIn) và ngày trả phòng (checkOut)." });

        if (checkIn.HasValue && checkOut.HasValue && checkOut.Value <= checkIn.Value)
            return BadRequest(new { message = "Ngày trả phòng phải sau ngày nhận phòng." });

        var normalizedSlug = slug.Trim().ToLowerInvariant();
        var hotel = await _db.Hotels
            .AsNoTracking()
            .Where(h => h.Slug == normalizedSlug && h.Status == HotelStatuses.Active)
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
                h.Featured,
                h.Amenities,
                Images = h.Images
                    .OrderBy(i => i.SortOrder)
                    .Select(i => i.Url)
                    .ToList(),
                RoomTypes = h.RoomTypes
                    .Where(rt => rt.IsActive)
                    .OrderBy(rt => rt.PricePerNight)
                    .ThenBy(rt => rt.Id)
                    .Select(rt => new
                    {
                        rt.Id,
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
                        Images = rt.Images
                            .OrderBy(i => i.SortOrder)
                            .Select(i => i.Url)
                            .ToList()
                    })
                    .ToList(),
                ReviewCount = h.Reviews.Count,
                RatingSum = h.Reviews.Sum(r => (double?)r.Rating) ?? 0.0
            })
            .FirstOrDefaultAsync(ct);

        if (hotel is null)
            return NotFound(new { message = "Không tìm thấy khách sạn." });

        Dictionary<int, int>? availabilityByRoomType = null;
        if (checkIn.HasValue && checkOut.HasValue && hotel.RoomTypes.Count > 0)
        {
            var roomTypeIds = hotel.RoomTypes.Select(rt => rt.Id).ToList();
            availabilityByRoomType = await _availability.CountAvailableByRoomTypesAsync(
                roomTypeIds,
                checkIn.Value,
                checkOut.Value,
                ct);
        }

        var roomTypeDtos = hotel.RoomTypes
            .Select(rt =>
            {
                int? available = availabilityByRoomType is not null && availabilityByRoomType.TryGetValue(rt.Id, out var count)
                    ? count
                    : null;

                return new RoomTypeDto(
                    rt.Id,
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
                    ParseCsvTokens(rt.Amenities),
                    rt.Images,
                    available);
            })
            .ToList();

        var priceFrom = roomTypeDtos.Count > 0 ? roomTypeDtos.Min(rt => rt.PricePerNight) : 0m;
        var ratingAvg = hotel.ReviewCount > 0 ? Math.Round(hotel.RatingSum / hotel.ReviewCount, 1) : 0.0;

        var dto = new HotelDetailDto(
            hotel.Id,
            hotel.Name,
            hotel.Slug,
            hotel.City,
            hotel.District,
            hotel.Address,
            hotel.Description,
            hotel.StarRating,
            hotel.Featured,
            priceFrom,
            ratingAvg,
            hotel.ReviewCount,
            hotel.Images.FirstOrDefault(),
            ParseCsvTokens(hotel.Amenities),
            hotel.Images,
            roomTypeDtos);

        return Ok(dto);
    }

    // GET /api/hotels/{slug}/availability?from&to — lịch tồn kho theo từng ngày (tối đa 60 ngày).
    [HttpGet("{slug}/availability")]
    public async Task<IActionResult> GetAvailability(
        string slug,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken ct = default)
    {
        if (!from.HasValue || !to.HasValue)
            return BadRequest(new { message = "Vui lòng truyền đầy đủ ngày bắt đầu (from) và ngày kết thúc (to)." });

        if (to.Value <= from.Value)
            return BadRequest(new { message = "Ngày kết thúc (to) phải sau ngày bắt đầu (from)." });

        if (to.Value.DayNumber - from.Value.DayNumber > MaxAvailabilityRangeDays)
            return BadRequest(new { message = $"Khoảng thời gian tra cứu tồn kho tối đa là {MaxAvailabilityRangeDays} ngày." });

        var normalizedSlug = slug.Trim().ToLowerInvariant();
        var hotelId = await _db.Hotels
            .AsNoTracking()
            .Where(h => h.Slug == normalizedSlug && h.Status == HotelStatuses.Active)
            .Select(h => (int?)h.Id)
            .FirstOrDefaultAsync(ct);

        if (!hotelId.HasValue)
            return NotFound(new { message = "Không tìm thấy khách sạn." });

        var days = await _availability.GetHotelAvailabilityAsync(hotelId.Value, from.Value, to.Value, ct);
        return Ok(days);
    }

    // GET /api/hotels/{slug}/reviews — danh sách đánh giá khách sạn có phân trang, mới nhất trước.
    [HttpGet("{slug}/reviews")]
    public async Task<IActionResult> GetReviews(
        string slug,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var normalizedSlug = slug.Trim().ToLowerInvariant();
        var hotelId = await _db.Hotels
            .AsNoTracking()
            .Where(h => h.Slug == normalizedSlug && h.Status == HotelStatuses.Active)
            .Select(h => (int?)h.Id)
            .FirstOrDefaultAsync(ct);

        if (!hotelId.HasValue)
            return NotFound(new { message = "Không tìm thấy khách sạn." });

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = _db.Reviews
            .AsNoTracking()
            .Where(r => r.HotelId == hotelId.Value);

        var total = await query.CountAsync(ct);
        var rawItems = await query
            .OrderByDescending(r => r.CreatedAt)
            .ThenByDescending(r => r.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new
            {
                r.Id,
                GuestName = r.User.FullName,
                r.Rating,
                r.Comment,
                r.CreatedAt
            })
            .ToListAsync(ct);

        var items = rawItems
            .Select(r => new HotelReviewDto(
                r.Id,
                MaskGuestName(r.GuestName),
                r.Rating,
                r.Comment,
                r.CreatedAt))
            .ToList();

        return Ok(new PagedResult<HotelReviewDto>(total, page, pageSize, items));
    }

    private static List<HotelListItemDto> ApplySort(List<HotelListItemDto> items, string? sort)
    {
        var key = sort?.Trim().ToLowerInvariant();
        return key switch
        {
            "price-asc" => items
                .OrderBy(h => h.PriceFrom)
                .ThenBy(h => h.Id)
                .ToList(),
            "price-desc" => items
                .OrderByDescending(h => h.PriceFrom)
                .ThenBy(h => h.Id)
                .ToList(),
            "rating" => items
                .OrderByDescending(h => h.RatingAverage)
                .ThenByDescending(h => h.ReviewCount)
                .ThenByDescending(h => h.StarRating)
                .ThenBy(h => h.Id)
                .ToList(),
            _ => items
                .OrderByDescending(h => h.Featured)
                .ThenByDescending(h => h.StarRating)
                .ThenByDescending(h => h.RatingAverage)
                .ThenBy(h => h.Id)
                .ToList()
        };
    }

    private static HashSet<int> ParseStars(string? stars, out string? error)
    {
        error = null;
        var result = new HashSet<int>();
        if (string.IsNullOrWhiteSpace(stars))
            return result;

        foreach (var token in stars.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (!int.TryParse(token, out var star) || star < 1 || star > 5)
            {
                error = "Tham số hạng sao (stars) chỉ nhận các giá trị từ 1 đến 5.";
                return [];
            }

            result.Add(star);
        }

        return result;
    }

    private static IReadOnlyList<string> ParseCsvTokens(string? csv)
    {
        if (string.IsNullOrWhiteSpace(csv))
            return [];

        return csv
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(t => t.ToLowerInvariant())
            .Distinct()
            .ToList();
    }

    // Che một phần tên khách đánh giá để bảo vệ riêng tư, ví dụ "Lê Hoàng Nam" -> "Lê Hoàng N***".
    private static string MaskGuestName(string fullName)
    {
        var trimmed = fullName.Trim();
        if (string.IsNullOrEmpty(trimmed))
            return "Khách";

        var parts = trimmed.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var last = parts[^1];
        var maskedLast = $"{last[0]}***";
        if (parts.Length == 1)
            return maskedLast;

        return $"{string.Join(' ', parts[..^1])} {maskedLast}";
    }
}
