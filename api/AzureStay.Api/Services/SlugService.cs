using System.Globalization;
using System.Text;
using AzureStay.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace AzureStay.Api.Services;

// Dịch vụ sinh slug không dấu từ tên khách sạn và đảm bảo tính duy nhất trong DB.
public class SlugService
{
    private const int MaxBaseSlugLength = 200;

    private readonly AppDbContext _db;

    public SlugService(AppDbContext db) => _db = db;

    public async Task<string> GenerateUniqueHotelSlugAsync(
        string name,
        int? excludeHotelId = null,
        CancellationToken ct = default)
    {
        var baseSlug = ToSlug(name);
        if (baseSlug.Length > MaxBaseSlugLength)
            baseSlug = baseSlug[..MaxBaseSlugLength].TrimEnd('-');

        if (string.IsNullOrEmpty(baseSlug))
            baseSlug = "khach-san";

        var candidate = baseSlug;
        var suffix = 2;

        // Thử lần lượt baseSlug, baseSlug-2, baseSlug-3... cho đến khi không trùng.
        while (await _db.Hotels.AsNoTracking()
            .AnyAsync(h => h.Slug == candidate && (!excludeHotelId.HasValue || h.Id != excludeHotelId.Value), ct))
        {
            candidate = $"{baseSlug}-{suffix}";
            suffix++;
        }

        return candidate;
    }

    public static string ToSlug(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        // Thay thế chữ đ/Đ trước khi tách dấu Unicode vì đ không phải ký tự tổ hợp.
        var replaced = input.Trim()
            .Replace('đ', 'd')
            .Replace('Đ', 'D');

        var decomposed = replaced.Normalize(NormalizationForm.FormD);
        var asciiBuilder = new StringBuilder(decomposed.Length);

        foreach (var ch in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
                asciiBuilder.Append(ch);
        }

        var plain = asciiBuilder.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();
        var slugBuilder = new StringBuilder(plain.Length);
        var previousHyphen = false;

        foreach (var ch in plain)
        {
            if (ch is >= 'a' and <= 'z' or >= '0' and <= '9')
            {
                slugBuilder.Append(ch);
                previousHyphen = false;
            }
            else if (!previousHyphen && slugBuilder.Length > 0)
            {
                slugBuilder.Append('-');
                previousHyphen = true;
            }
        }

        return slugBuilder.ToString().Trim('-');
    }
}
