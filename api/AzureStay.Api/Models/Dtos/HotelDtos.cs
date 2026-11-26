namespace AzureStay.Api.Models.Dtos;

public record HotelListItemDto(
    int Id,
    string Name,
    string Slug,
    string City,
    string District,
    int StarRating,
    bool Featured,
    decimal PriceFrom,
    double RatingAverage,
    int ReviewCount,
    string? CoverImage,
    IReadOnlyList<string> Amenities);

public record RoomTypeDto(
    int Id,
    string Name,
    string BedType,
    string ViewType,
    bool HasBathtub,
    int MaxAdults,
    int MaxChildren,
    int SizeM2,
    decimal PricePerNight,
    int TotalRooms,
    string Description,
    IReadOnlyList<string> Amenities,
    IReadOnlyList<string> Images,
    int? Available);

public record HotelDetailDto(
    int Id,
    string Name,
    string Slug,
    string City,
    string District,
    string Address,
    string Description,
    int StarRating,
    bool Featured,
    decimal PriceFrom,
    double RatingAverage,
    int ReviewCount,
    string? CoverImage,
    IReadOnlyList<string> Amenities,
    IReadOnlyList<string> Images,
    IReadOnlyList<RoomTypeDto> RoomTypes);

public record RoomTypeAvailabilityDto(
    int Id,
    string Name,
    int Total,
    int Booked,
    int Available);

public record DailyAvailabilityDto(
    DateOnly Date,
    IReadOnlyList<RoomTypeAvailabilityDto> RoomTypes);

public record HotelReviewDto(
    int Id,
    string GuestName,
    int Rating,
    string Comment,
    DateTime CreatedAt);

public record CityMetaDto(
    string City,
    int HotelCount);

public record AmenityMetaDto(
    string Code,
    string Label);
