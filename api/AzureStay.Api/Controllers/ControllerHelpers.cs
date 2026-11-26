using System.Security.Claims;

namespace AzureStay.Api.Controllers;

// Các hàm tiện ích dùng chung cho các controller Owner/Admin/Uploads.
internal static class ControllerHelpers
{
    public static int? GetCurrentUserId(ClaimsPrincipal user)
    {
        var sub = user.FindFirstValue("sub") ?? user.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(sub, out var id) ? id : null;
    }

    public static IReadOnlyList<string> ParseCsvTokens(string? csv)
    {
        if (string.IsNullOrWhiteSpace(csv))
            return [];

        return csv
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(t => t.ToLowerInvariant())
            .Distinct()
            .ToList();
    }

    public static string NormalizeCsv(string? csv)
    {
        var tokens = ParseCsvTokens(csv);
        var joined = string.Join(',', tokens);
        return joined.Length <= 500 ? joined : joined[..500].TrimEnd(',');
    }

    public static bool IsValidImageUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return false;

        var trimmed = url.Trim();
        return trimmed.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase);
    }
}
