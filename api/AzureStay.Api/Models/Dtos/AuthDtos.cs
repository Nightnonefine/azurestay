namespace AzureStay.Api.Models.Dtos;

public record RegisterRequest(string? Email, string? Password, string? FullName, string? Phone = null);

public record LoginRequest(string? Email, string? Password);

public record UpdateProfileRequest(string? FullName, string? Phone);

public record ChangePasswordRequest(string? CurrentPassword, string? NewPassword);

public record UserDto(
    int Id,
    string Email,
    string FullName,
    string? Phone,
    string Role,
    string Status,
    DateTime CreatedAt);

public record LoginResponse(string AccessToken, UserDto User);

public record RefreshResponse(string AccessToken);
