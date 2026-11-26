using AzureStay.Api.Data;
using Microsoft.AspNetCore.Mvc;

namespace AzureStay.Api.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _db;

    public HealthController(AppDbContext db) => _db = db;

    // GET /api/health — kiểm tra trạng thái API và kết nối SQL Server.
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        try
        {
            var dbOk = await _db.Database.CanConnectAsync(ct);
            if (!dbOk)
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new { status = "error", db = false });

            return Ok(new { status = "ok", db = true });
        }
        catch
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { status = "error", db = false });
        }
    }
}
