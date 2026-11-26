using System.ComponentModel.DataAnnotations;

namespace AzureStay.Api.Models;

public class Hotel
{
    public int Id { get; set; }

    public int OwnerId { get; set; }

    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(220)]
    public string Slug { get; set; } = string.Empty;

    [MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [MaxLength(100)]
    public string District { get; set; } = string.Empty;

    [MaxLength(300)]
    public string Address { get; set; } = string.Empty;

    [MaxLength(4000)]
    public string Description { get; set; } = string.Empty;

    public int StarRating { get; set; } = 4;

    // Chuỗi CSV đã chuẩn hoá, ví dụ "wifi,pool,parking".
    [MaxLength(500)]
    public string Amenities { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Status { get; set; } = HotelStatuses.Pending;

    public bool Featured { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User Owner { get; set; } = null!;
    public ICollection<HotelImage> Images { get; set; } = [];
    public ICollection<RoomType> RoomTypes { get; set; } = [];
    public ICollection<Booking> Bookings { get; set; } = [];
    public ICollection<Review> Reviews { get; set; } = [];
}
