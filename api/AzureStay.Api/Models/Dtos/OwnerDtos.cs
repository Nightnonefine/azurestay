using System.ComponentModel.DataAnnotations;

namespace AzureStay.Api.Models.Dtos;

public class HotelUpsertRequest
{
    [Required(ErrorMessage = "Vui lòng nhập tên khách sạn.")]
    [MaxLength(200, ErrorMessage = "Tên khách sạn không được vượt quá 200 ký tự.")]
    public string? Name { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập thành phố.")]
    [MaxLength(100, ErrorMessage = "Tên thành phố không được vượt quá 100 ký tự.")]
    public string? City { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập quận/huyện.")]
    [MaxLength(100, ErrorMessage = "Tên quận/huyện không được vượt quá 100 ký tự.")]
    public string? District { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập địa chỉ khách sạn.")]
    [MaxLength(300, ErrorMessage = "Địa chỉ không được vượt quá 300 ký tự.")]
    public string? Address { get; set; }

    [MaxLength(4000, ErrorMessage = "Mô tả không được vượt quá 4000 ký tự.")]
    public string? Description { get; set; }

    [Range(1, 5, ErrorMessage = "Hạng sao phải từ 1 đến 5.")]
    public int StarRating { get; set; } = 4;

    [MaxLength(500, ErrorMessage = "Chuỗi tiện ích không được vượt quá 500 ký tự.")]
    public string? Amenities { get; set; }
}

public record OwnerImageDto(
    int Id,
    string Url,
    int SortOrder);

public record OwnerHotelDto(
    int Id,
    string Name,
    string Slug,
    string City,
    string District,
    string Address,
    string Description,
    int StarRating,
    IReadOnlyList<string> Amenities,
    string Status,
    bool Featured,
    int RoomTypeCount,
    IReadOnlyList<OwnerImageDto> Images,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public class AddImageRequest
{
    [Required(ErrorMessage = "Vui lòng nhập đường dẫn ảnh.")]
    [MaxLength(500, ErrorMessage = "Đường dẫn ảnh không được vượt quá 500 ký tự.")]
    public string? Url { get; set; }

    [Range(0, 1000, ErrorMessage = "Thứ tự hiển thị phải từ 0 đến 1000.")]
    public int SortOrder { get; set; }
}

public class RoomTypeUpsertRequest
{
    [Required(ErrorMessage = "Vui lòng nhập tên loại phòng.")]
    [MaxLength(150, ErrorMessage = "Tên loại phòng không được vượt quá 150 ký tự.")]
    public string? Name { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập loại giường.")]
    [MaxLength(80, ErrorMessage = "Loại giường không được vượt quá 80 ký tự.")]
    public string? BedType { get; set; }

    [MaxLength(80, ErrorMessage = "Hướng nhìn không được vượt quá 80 ký tự.")]
    public string? ViewType { get; set; }

    public bool HasBathtub { get; set; }

    [Range(1, 20, ErrorMessage = "Số người lớn tối đa phải từ 1 đến 20.")]
    public int MaxAdults { get; set; } = 2;

    [Range(0, 20, ErrorMessage = "Số trẻ em tối đa phải từ 0 đến 20.")]
    public int MaxChildren { get; set; } = 1;

    [Range(5, 1000, ErrorMessage = "Diện tích phòng phải từ 5 đến 1000 m².")]
    public int SizeM2 { get; set; } = 25;

    [Range(1000, 1000000000, ErrorMessage = "Giá mỗi đêm phải lớn hơn hoặc bằng 1.000 VNĐ.")]
    public decimal PricePerNight { get; set; }

    [Range(1, 1000, ErrorMessage = "Tổng số phòng phải từ 1 đến 1000.")]
    public int TotalRooms { get; set; } = 1;

    [MaxLength(2000, ErrorMessage = "Mô tả loại phòng không được vượt quá 2000 ký tự.")]
    public string? Description { get; set; }

    [MaxLength(500, ErrorMessage = "Chuỗi tiện ích không được vượt quá 500 ký tự.")]
    public string? Amenities { get; set; }

    public bool? IsActive { get; set; }
}

public record RoomTypeOwnerDto(
    int Id,
    int HotelId,
    string Name,
    string BedType,
    string ViewType,
    bool HasBathtub,
    int MaxAdults,
    int MaxChildren,
    int SizeM2,
    decimal PricePerNight,
    int TotalRooms,
    string Description,
    IReadOnlyList<string> Amenities,
    bool IsActive,
    int BookedToday,
    int Available,
    IReadOnlyList<OwnerImageDto> Images);

public record OwnerBookingDto(
    int Id,
    string Code,
    int HotelId,
    string HotelName,
    int RoomTypeId,
    string RoomTypeName,
    string GuestName,
    string GuestPhone,
    string GuestEmail,
    DateOnly CheckIn,
    DateOnly CheckOut,
    int Nights,
    int Rooms,
    int Adults,
    int Children,
    decimal PricePerNight,
    decimal TotalAmount,
    string Status,
    string? Note,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public class OwnerBookingStatusRequest
{
    [Required(ErrorMessage = "Vui lòng chọn trạng thái mới.")]
    [MaxLength(20, ErrorMessage = "Trạng thái không hợp lệ.")]
    public string? Status { get; set; }

    [MaxLength(500, ErrorMessage = "Ghi chú không được vượt quá 500 ký tự.")]
    public string? Note { get; set; }
}

public record CalendarDayDto(
    DateOnly Date,
    IReadOnlyList<RoomTypeAvailabilityDto> RoomTypes);

public record RoomTypeOccupancyDto(
    int RoomTypeId,
    int HotelId,
    string HotelName,
    string RoomTypeName,
    int TotalRooms,
    int SoldNights,
    int CapacityNights,
    double OccupancyRate,
    decimal Revenue);

public record OwnerStatsDto(
    DateOnly From,
    DateOnly To,
    int RangeNights,
    decimal TotalRevenue,
    int TotalBookings,
    int SoldRoomNights,
    IReadOnlyDictionary<string, int> BookingsByStatus,
    IReadOnlyList<RoomTypeOccupancyDto> RoomTypeOccupancy,
    IReadOnlyList<RoomTypeOccupancyDto> TopRoomTypes);
