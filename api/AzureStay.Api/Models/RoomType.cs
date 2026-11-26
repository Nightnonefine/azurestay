using System.ComponentModel.DataAnnotations;

namespace AzureStay.Api.Models;

public class RoomType
{
    public int Id { get; set; }

    public int HotelId { get; set; }

    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(80)]
    public string BedType { get; set; } = string.Empty;

    [MaxLength(80)]
    public string ViewType { get; set; } = string.Empty;

    public bool HasBathtub { get; set; }

    public int MaxAdults { get; set; } = 2;

    public int MaxChildren { get; set; } = 1;

    public int SizeM2 { get; set; }

    public decimal PricePerNight { get; set; }

    public int TotalRooms { get; set; }

    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Amenities { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public Hotel Hotel { get; set; } = null!;
    public ICollection<RoomTypeImage> Images { get; set; } = [];
    public ICollection<Booking> Bookings { get; set; } = [];
}
