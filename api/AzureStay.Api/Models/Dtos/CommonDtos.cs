namespace AzureStay.Api.Models.Dtos;

// Cấu trúc phân trang thống nhất cho mọi endpoint danh sách theo SPEC mục 4.
public record PagedResult<T>(
    int Total,
    int Page,
    int PageSize,
    IReadOnlyList<T> Items);
