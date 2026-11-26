using System.ComponentModel.DataAnnotations;

namespace AzureStay.Api.Models;

public class RoomTypeImage
{
    public int Id { get; set; }

    public int RoomTypeId { get; set; }

    [MaxLength(500)]
    public string Url { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public RoomType RoomType { get; set; } = null!;
}
