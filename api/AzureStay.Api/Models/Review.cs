using System.ComponentModel.DataAnnotations;

namespace AzureStay.Api.Models;

public class Review
{
    public int Id { get; set; }

    public int BookingId { get; set; }

    public int HotelId { get; set; }

    public int UserId { get; set; }

    public int Rating { get; set; }

    [MaxLength(2000)]
    public string Comment { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Booking Booking { get; set; } = null!;
    public Hotel Hotel { get; set; } = null!;
    public User User { get; set; } = null!;
}
