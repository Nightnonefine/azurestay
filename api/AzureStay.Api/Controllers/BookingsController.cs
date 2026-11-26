using System.Security.Claims;
using AzureStay.Api.Models;
using AzureStay.Api.Models.Dtos;
using AzureStay.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AzureStay.Api.Controllers;

[ApiController]
[Route("api/bookings")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly BookingService _bookingService;

    public BookingsController(BookingService bookingService) => _bookingService = bookingService;

    // POST /api/bookings — tạo đơn đặt phòng mới (chỉ vai trò Customer).
    [HttpPost]
    [Authorize(Roles = UserRoles.Customer)]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        var result = await _bookingService.CreateBookingAsync(userId.Value, request, ct);
        return ToActionResult(result);
    }

    // GET /api/bookings/my — danh sách đơn đặt phòng của người dùng hiện tại.
    [HttpGet("my")]
    public async Task<IActionResult> GetMyBookings(
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        var result = await _bookingService.GetMyBookingsAsync(userId.Value, status, page, pageSize, ct);
        return ToActionResult(result);
    }

    // GET /api/bookings/{code} — xem chi tiết đơn theo mã (chỉ chủ đơn hoặc Admin).
    [HttpGet("{code}")]
    public async Task<IActionResult> GetBookingByCode(string code, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        var role = User.FindFirstValue("role") ?? User.FindFirstValue(ClaimTypes.Role);
        var isAdmin = string.Equals(role, UserRoles.Admin, StringComparison.OrdinalIgnoreCase);

        var result = await _bookingService.GetBookingByCodeAsync(code, userId.Value, isAdmin, ct);
        return ToActionResult(result);
    }

    // POST /api/bookings/{id}/cancel — khách huỷ đơn đặt phòng của chính mình.
    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> CancelBooking(
        int id,
        [FromBody] CancelBookingRequest? request = null,
        CancellationToken ct = default)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ." });

        var result = await _bookingService.CancelBookingAsync(id, userId.Value, request?.Reason, ct);
        return ToActionResult(result);
    }

    private int? GetCurrentUserId()
    {
        var sub = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(sub, out var id) ? id : null;
    }

    private IActionResult ToActionResult<T>(ServiceResult<T> result)
    {
        if (result.Succeeded)
            return StatusCode(result.StatusCode, result.Data);

        if (result.Errors is { Count: > 0 })
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage, errors = result.Errors });

        return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
    }
}
