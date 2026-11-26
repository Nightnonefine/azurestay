using System.ComponentModel.DataAnnotations;

namespace AzureStay.Api.Models;

public class User
{
    public int Id { get; set; }

    [MaxLength(160)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(256)]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(120)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(20)]
    public string Role { get; set; } = UserRoles.Customer;

    [MaxLength(20)]
    public string Status { get; set; } = UserStatuses.Active;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
    public ICollection<Hotel> Hotels { get; set; } = [];
    public ICollection<Booking> Bookings { get; set; } = [];
    public ICollection<Review> Reviews { get; set; } = [];
}
