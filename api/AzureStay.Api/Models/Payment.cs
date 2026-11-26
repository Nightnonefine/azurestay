using System.ComponentModel.DataAnnotations;

namespace AzureStay.Api.Models;

public class Payment
{
    public int Id { get; set; }

    public int BookingId { get; set; }

    [MaxLength(30)]
    public string Provider { get; set; } = "VNPay";

    public decimal Amount { get; set; }

    [MaxLength(64)]
    public string TxnRef { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Status { get; set; } = PaymentStatuses.Pending;

    public DateTime? PaidAt { get; set; }

    public string? RawResponse { get; set; }

    public Booking Booking { get; set; } = null!;
}
