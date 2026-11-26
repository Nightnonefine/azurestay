using System.ComponentModel.DataAnnotations;

namespace AzureStay.Api.Models;

public class Booking
{
    public int Id { get; set; }

    // Mã đơn 8 ký tự A-Z0-9 duy nhất để khách tra cứu.
    [MaxLength(16)]
    public string Code { get; set; } = string.Empty;

    public int UserId { get; set; }

    public int HotelId { get; set; }

    public int RoomTypeId { get; set; }

    [MaxLength(120)]
    public string GuestName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string GuestPhone { get; set; } = string.Empty;

    [MaxLength(160)]
    public string GuestEmail { get; set; } = string.Empty;

    public DateOnly CheckIn { get; set; }

    public DateOnly CheckOut { get; set; }

    public int Rooms { get; set; }

    public int Adults { get; set; }

    public int Children { get; set; }

    // Chụp lại giá tại thời điểm đặt để tránh bị ảnh hưởng khi chủ khách sạn đổi giá sau này.
    public decimal PricePerNight { get; set; }

    public decimal TotalAmount { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = BookingStatuses.Pending;

    [MaxLength(500)]
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Hotel Hotel { get; set; } = null!;
    public RoomType RoomType { get; set; } = null!;
    public ICollection<Payment> Payments { get; set; } = [];
    public Review? Review { get; set; }
}
