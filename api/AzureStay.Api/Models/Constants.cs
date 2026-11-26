namespace AzureStay.Api.Models;

// Các hằng số trạng thái và vai trò dùng chung toàn hệ thống.
public static class UserRoles
{
    public const string Customer = "Customer";
    public const string Owner = "Owner";
    public const string Admin = "Admin";
}

public static class UserStatuses
{
    public const string Active = "Active";
    public const string Locked = "Locked";
}

public static class HotelStatuses
{
    public const string Pending = "Pending";
    public const string Active = "Active";
    public const string Suspended = "Suspended";
    public const string Rejected = "Rejected";
}

public static class BookingStatuses
{
    public const string Pending = "Pending";
    public const string Confirmed = "Confirmed";
    public const string CheckedIn = "CheckedIn";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
}

public static class PaymentStatuses
{
    public const string Pending = "Pending";
    public const string Paid = "Paid";
    public const string Failed = "Failed";
    public const string Refunded = "Refunded";
}
