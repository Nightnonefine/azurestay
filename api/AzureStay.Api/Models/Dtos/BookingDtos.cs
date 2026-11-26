using System.ComponentModel.DataAnnotations;

namespace AzureStay.Api.Models.Dtos;

public class CreateBookingRequest
{
    [Required(ErrorMessage = "Vui lòng chọn loại phòng.")]
    [Range(1, int.MaxValue, ErrorMessage = "Mã loại phòng không hợp lệ.")]
    public int? RoomTypeId { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn ngày nhận phòng.")]
    public DateOnly? CheckIn { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn ngày trả phòng.")]
    public DateOnly? CheckOut { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập số lượng phòng.")]
    [Range(1, 50, ErrorMessage = "Số phòng phải từ 1 đến 50.")]
    public int? Rooms { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập số người lớn.")]
    [Range(1, 200, ErrorMessage = "Số người lớn phải ít nhất là 1.")]
    public int? Adults { get; set; }

    [Range(0, 200, ErrorMessage = "Số trẻ em không được âm.")]
    public int Children { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập họ tên khách.")]
    [MaxLength(120, ErrorMessage = "Họ tên khách không được vượt quá 120 ký tự.")]
    public string? GuestName { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập số điện thoại liên hệ.")]
    [MaxLength(20, ErrorMessage = "Số điện thoại không được vượt quá 20 ký tự.")]
    public string? GuestPhone { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập email liên hệ.")]
    [MaxLength(160, ErrorMessage = "Email không được vượt quá 160 ký tự.")]
    [EmailAddress(ErrorMessage = "Email liên hệ không hợp lệ.")]
    public string? GuestEmail { get; set; }

    [MaxLength(500, ErrorMessage = "Ghi chú không được vượt quá 500 ký tự.")]
    public string? Note { get; set; }
}

public class CancelBookingRequest
{
    [MaxLength(400, ErrorMessage = "Lý do huỷ không được vượt quá 400 ký tự.")]
    public string? Reason { get; set; }
}

public record BookingDto(
    int Id,
    string Code,
    int HotelId,
    string HotelName,
    string HotelSlug,
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
