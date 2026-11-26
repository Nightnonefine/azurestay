using System.ComponentModel.DataAnnotations;

namespace AzureStay.Api.Models;

public class HotelImage
{
    public int Id { get; set; }

    public int HotelId { get; set; }

    [MaxLength(500)]
    public string Url { get; set; } = string.Empty;

    // Ảnh chính của khách sạn có SortOrder = 0.
    public int SortOrder { get; set; }

    public Hotel Hotel { get; set; } = null!;
}
