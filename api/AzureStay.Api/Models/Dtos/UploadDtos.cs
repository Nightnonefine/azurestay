namespace AzureStay.Api.Models.Dtos;

public record UploadResultDto(
    string Url,
    long Size,
    string ContentType);
