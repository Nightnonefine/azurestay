using System.ComponentModel.DataAnnotations;

namespace AzureStay.Api.Models.Dtos;

public record AdminUserDto(
    int Id,
    string Email,
    string FullName,
    string? Phone,
    string Role,
    string Status,
    DateTime CreatedAt);

public class AdminUserUpdateRequest
{
    [Required(ErrorMessage = "Vui lòng nhập họ tên.")]
    [MaxLength(120, ErrorMessage = "Họ tên không được vượt quá 120 ký tự.")]
    public string? FullName { get; set; }

    [MaxLength(20, ErrorMessage = "Số điện thoại không được vượt quá 20 ký tự.")]
    public string? Phone { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn trạng thái tài khoản.")]
    [MaxLength(20, ErrorMessage = "Trạng thái tài khoản không hợp lệ.")]
    public string? Status { get; set; }
}

public class AdminRoleRequest
{
    [Required(ErrorMessage = "Vui lòng chọn vai trò mới.")]
    [MaxLength(20, ErrorMessage = "Vai trò không hợp lệ.")]
    public string? Role { get; set; }
}

public record AdminHotelDto(
    int Id,
    int OwnerId,
    string OwnerEmail,
    string OwnerName,
    string Name,
    string Slug,
    string City,
    string District,
    string Address,
    int StarRating,
    string Status,
    bool Featured,
    int RoomTypeCount,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public class AdminHotelStatusRequest
{
    [Required(ErrorMessage = "Vui lòng chọn trạng thái duyệt khách sạn.")]
    [MaxLength(20, ErrorMessage = "Trạng thái khách sạn không hợp lệ.")]
    public string? Status { get; set; }

    [MaxLength(500, ErrorMessage = "Ghi chú không được vượt quá 500 ký tự.")]
    public string? Note { get; set; }
}

public class AdminFeaturedRequest
{
    public bool? Featured { get; set; }
}

public record TopHotelRevenueDto(
    int HotelId,
    string HotelName,
    string Slug,
    string City,
    int BookingCount,
    decimal Revenue);

public record AdminStatsDto(
    int TotalUsers,
    IReadOnlyDictionary<string, int> UsersByRole,
    IReadOnlyDictionary<string, int> UsersByStatus,
    int TotalHotels,
    IReadOnlyDictionary<string, int> HotelsByStatus,
    decimal TotalPaidRevenue,
    int TotalBookings,
    IReadOnlyDictionary<string, int> BookingsByStatus,
    IReadOnlyList<TopHotelRevenueDto> TopHotels);
