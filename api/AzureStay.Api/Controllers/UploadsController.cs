using AzureStay.Api.Models;
using AzureStay.Api.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AzureStay.Api.Controllers;

[ApiController]
[Route("api/uploads")]
[Authorize(Roles = $"{UserRoles.Owner},{UserRoles.Admin}")]
public class UploadsController : ControllerBase
{
    public const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

    private static readonly Dictionary<string, string[]> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = [".jpg", ".jpeg"],
        ["image/png"] = [".png"],
        ["image/webp"] = [".webp"]
    };

    private readonly IWebHostEnvironment _env;

    public UploadsController(IWebHostEnvironment env) => _env = env;

    // POST /api/uploads — tải lên 1 ảnh (jpg/png/webp, tối đa 5 MB) vào wwwroot/uploads/yyyy/MM/.
    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadImage(IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Vui lòng chọn tệp ảnh hợp lệ để tải lên." });

        if (file.Length > MaxFileSizeBytes)
            return BadRequest(new { message = "Kích thước ảnh không được vượt quá 5 MB." });

        var contentType = file.ContentType?.Trim() ?? string.Empty;
        var extension = Path.GetExtension(file.FileName)?.Trim().ToLowerInvariant() ?? string.Empty;

        // Kiểm tra cả Content-Type lẫn phần mở rộng khớp nhau để chặn tệp giả mạo.
        if (!AllowedContentTypes.TryGetValue(contentType, out var allowedExtensions)
            || !allowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WebP." });
        }

        var now = DateTime.UtcNow;
        var year = now.ToString("yyyy");
        var month = now.ToString("MM");

        var webRoot = string.IsNullOrWhiteSpace(_env.WebRootPath)
            ? Path.Combine(_env.ContentRootPath, "wwwroot")
            : _env.WebRootPath;

        var targetDir = Path.Combine(webRoot, "uploads", year, month);
        Directory.CreateDirectory(targetDir);

        var fileName = $"{Guid.NewGuid():N}{extension}";
        var fullPath = Path.Combine(targetDir, fileName);

        await using (var stream = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            await file.CopyToAsync(stream, ct);
        }

        var publicUrl = $"/uploads/{year}/{month}/{fileName}";
        return StatusCode(
            StatusCodes.Status201Created,
            new UploadResultDto(publicUrl, file.Length, contentType.ToLowerInvariant()));
    }
}
