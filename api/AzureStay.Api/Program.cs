using System.Text;
using System.Text.Json;
using AzureStay.Api.Data;
using AzureStay.Api.Security;
using AzureStay.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        // Chuẩn hoá lỗi model binding / validation về cùng cấu trúc { message, errors }.
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage) ? "Dữ liệu gửi lên không hợp lệ." : e.ErrorMessage)
                .ToList();

            var first = errors.FirstOrDefault() ?? "Dữ liệu gửi lên không hợp lệ.";
            return new BadRequestObjectResult(new { message = first, errors });
        };
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "AzureStay API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập JWT access token (không cần tiền tố Bearer)."
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// Kết nối SQL Server qua appsettings.json -> ConnectionStrings:Default.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<AvailabilityService>();
builder.Services.AddScoped<BookingService>();

// Cấu hình xác thực JWT HS256, giữ nguyên tên claim sub / email / role theo SPEC.
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Chưa cấu hình Jwt:Key trong appsettings.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "AzureStay.Api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "AzureStay.Web";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            NameClaimType = "sub",
            RoleClaimType = "role"
        };

        options.Events = new JwtBearerEvents
        {
            OnChallenge = async context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json; charset=utf-8";
                var payload = JsonSerializer.Serialize(new { message = "Bạn cần đăng nhập để thực hiện thao tác này." });
                await context.Response.WriteAsync(payload);
            },
            OnForbidden = async context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json; charset=utf-8";
                var payload = JsonSerializer.Serialize(new { message = "Bạn không có quyền truy cập tài nguyên này." });
                await context.Response.WriteAsync(payload);
            }
        };
    });

builder.Services.AddAuthorization();

// Cho phép CORS từ React/Vite ở localhost và 127.0.0.1 kèm cookie httpOnly.
builder.Services.AddCors(options => options.AddPolicy("spa", policy =>
    policy.WithOrigins(
              "http://localhost:3000", "http://127.0.0.1:3000",
              "http://localhost:5173", "http://127.0.0.1:5173")
          .AllowAnyHeader()
          .AllowAnyMethod()
          .AllowCredentials()));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("spa");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
