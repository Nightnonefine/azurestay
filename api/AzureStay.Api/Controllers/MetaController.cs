using AzureStay.Api.Data;
using AzureStay.Api.Models;
using AzureStay.Api.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AzureStay.Api.Controllers;

[ApiController]
[Route("api/meta")]
[AllowAnonymous]
public class MetaController : ControllerBase
{
    private static readonly IReadOnlyList<AmenityMetaDto> StandardAmenities =
    [
        new("wifi", "Wi-Fi miễn phí"),
        new("pool", "Hồ bơi"),
        new("spa", "Spa & Chăm sóc sức khỏe"),
        new("breakfast", "Bữa sáng miễn phí"),
        new("parking", "Bãi đỗ xe"),
        new("gym", "Phòng tập gym"),
        new("sea-view", "Hướng biển"),
        new("airport-shuttle", "Đưa đón sân bay")
    ];

    private readonly AppDbContext _db;

    public MetaController(AppDbContext db) => _db = db;

    // GET /api/meta/cities — danh sách thành phố có khách sạn đang hoạt động kèm số lượng.
    [HttpGet("cities")]
    public async Task<IActionResult> GetCities(CancellationToken ct)
    {
        var cities = await _db.Hotels
            .AsNoTracking()
            .Where(h => h.Status == HotelStatuses.Active)
            .GroupBy(h => h.City)
            .OrderByDescending(g => g.Count())
            .ThenBy(g => g.Key)
            .Select(g => new CityMetaDto(g.Key, g.Count()))
            .ToListAsync(ct);

        return Ok(cities);
    }

    // GET /api/meta/amenities — danh sách tiện ích chuẩn hoá để lọc tìm kiếm.
    [HttpGet("amenities")]
    public IActionResult GetAmenities() => Ok(StandardAmenities);
}
