using AzureStay.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AzureStay.Api.Data;

// Dữ liệu mẫu cố định đưa vào migration để chạy idempotent từ database trống.
public static class SeedData
{
    private static readonly DateTime SeedTime = new(2026, 11, 1, 8, 0, 0, DateTimeKind.Utc);

    public static void Apply(ModelBuilder modelBuilder)
    {
        // 5 tài khoản: 1 Admin, 2 Owner, 2 Customer (PBKDF2-SHA256 100.000 vòng).
        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = 1,
                Email = "admin@azurestay.vn",
                PasswordHash = "100000.jGl25bVBBBW96Qi9Te4V3w==.hCzl0+YP1ldDwvaWlQUXUvekDsbzFQQJAeRzHQGDqe8=", // Admin@12345
                FullName = "Quản trị viên AzureStay",
                Phone = "0901000001",
                Role = UserRoles.Admin,
                Status = UserStatuses.Active,
                CreatedAt = SeedTime
            },
            new User
            {
                Id = 2,
                Email = "owner@azurestay.vn",
                PasswordHash = "100000.FVf5SesHTuHegT01mLOU6g==.5weGOdNITz5lDTBJW87DbqIvdjBzQHVp2IBoOKytnjA=", // Owner@12345
                FullName = "Nguyễn Minh Tuấn",
                Phone = "0902000002",
                Role = UserRoles.Owner,
                Status = UserStatuses.Active,
                CreatedAt = SeedTime
            },
            new User
            {
                Id = 3,
                Email = "owner2@azurestay.vn",
                PasswordHash = "100000.cTo0o8MTvkJtFbXGLKnBFQ==.EzhXnHIeUz7ijD0KBm8GaOoUR0HWrP62GToxvReo0Ek=", // Owner@12345
                FullName = "Trần Thị Lan Anh",
                Phone = "0902000003",
                Role = UserRoles.Owner,
                Status = UserStatuses.Active,
                CreatedAt = SeedTime
            },
            new User
            {
                Id = 4,
                Email = "demo@azurestay.vn",
                PasswordHash = "100000.KpdRbDVLaISM29j1SiJqCg==.KdZ3+Rr24pXIk40HZ18Co4ALMB6vUYLacb5GcKcvRTs=", // Demo@12345
                FullName = "Lê Hoàng Nam",
                Phone = "0903000004",
                Role = UserRoles.Customer,
                Status = UserStatuses.Active,
                CreatedAt = SeedTime
            },
            new User
            {
                Id = 5,
                Email = "khach2@azurestay.vn",
                PasswordHash = "100000.j/X6TWaYX9cMwLz6xnCYTA==.9T0lYm8jStVwNqUoh42tgqgMoynYSkbTytzXMgUkKrY=", // Demo@12345
                FullName = "Phạm Thảo Vy",
                Phone = "0903000005",
                Role = UserRoles.Customer,
                Status = UserStatuses.Active,
                CreatedAt = SeedTime
            }
        );

        // 8 khách sạn ở Đà Nẵng, Hà Nội, TP.HCM, Đà Lạt, Nha Trang, Phú Quốc.
        modelBuilder.Entity<Hotel>().HasData(
            new Hotel
            {
                Id = 1,
                OwnerId = 2,
                Name = "Azure Bay Resort Đà Nẵng",
                Slug = "azure-bay-resort-da-nang",
                City = "Đà Nẵng",
                District = "Sơn Trà",
                Address = "128 Võ Nguyên Giáp, Phường Phước Mỹ, Quận Sơn Trà, Đà Nẵng",
                Description = "Khu nghỉ dưỡng ven biển Mỹ Khê với hồ bơi vô cực hướng biển, spa trị liệu và nhà hàng hải sản tươi sống.",
                StarRating = 5,
                Amenities = "wifi,pool,spa,breakfast,parking,gym,sea-view",
                Status = HotelStatuses.Active,
                Featured = true,
                CreatedAt = SeedTime,
                UpdatedAt = SeedTime
            },
            new Hotel
            {
                Id = 2,
                OwnerId = 2,
                Name = "Sông Hàn Boutique Hotel",
                Slug = "song-han-boutique-hotel",
                City = "Đà Nẵng",
                District = "Hải Châu",
                Address = "45 Bạch Đằng, Phường Hải Châu I, Quận Hải Châu, Đà Nẵng",
                Description = "Khách sạn boutique ngay trung tâm bờ Tây sông Hàn, thuận tiện dạo bộ cầu Rồng và chợ đêm.",
                StarRating = 4,
                Amenities = "wifi,breakfast,parking,airport-shuttle",
                Status = HotelStatuses.Active,
                Featured = false,
                CreatedAt = SeedTime,
                UpdatedAt = SeedTime
            },
            new Hotel
            {
                Id = 3,
                OwnerId = 2,
                Name = "Hoàn Kiếm Heritage Hotel",
                Slug = "hoan-kiem-heritage-hotel",
                City = "Hà Nội",
                District = "Hoàn Kiếm",
                Address = "22 Hàng Trống, Phường Hàng Trống, Quận Hoàn Kiếm, Hà Nội",
                Description = "Kiến trúc Đông Dương thanh lịch cách hồ Hoàn Kiếm 2 phút đi bộ, phòng cách âm yên tĩnh giữa phố cổ.",
                StarRating = 4,
                Amenities = "wifi,breakfast,airport-shuttle,spa",
                Status = HotelStatuses.Active,
                Featured = true,
                CreatedAt = SeedTime,
                UpdatedAt = SeedTime
            },
            new Hotel
            {
                Id = 4,
                OwnerId = 2,
                Name = "Saigon Skyline Luxury",
                Slug = "saigon-skyline-luxury",
                City = "TP.HCM",
                District = "Quận 1",
                Address = "88 Đồng Khởi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
                Description = "Khách sạn 5 sao tại trung tâm Quận 1 với sky bar nhìn toàn cảnh sông Sài Gòn và phòng gym mở cửa 24/7.",
                StarRating = 5,
                Amenities = "wifi,pool,gym,spa,breakfast,parking,airport-shuttle",
                Status = HotelStatuses.Active,
                Featured = true,
                CreatedAt = SeedTime,
                UpdatedAt = SeedTime
            },
            new Hotel
            {
                Id = 5,
                OwnerId = 3,
                Name = "Bến Thành Urban Stay",
                Slug = "ben-thanh-urban-stay",
                City = "TP.HCM",
                District = "Quận 1",
                Address = "112 Lê Thánh Tôn, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
                Description = "Lựa chọn tối ưu cho chuyến công tác và khám phá ẩm thực Sài Gòn, thiết kế tối giản hiện đại.",
                StarRating = 3,
                Amenities = "wifi,breakfast,parking",
                Status = HotelStatuses.Active,
                Featured = false,
                CreatedAt = SeedTime,
                UpdatedAt = SeedTime
            },
            new Hotel
            {
                Id = 6,
                OwnerId = 3,
                Name = "Thông Reo Hill Resort Đà Lạt",
                Slug = "thong-reo-hill-resort-da-lat",
                City = "Đà Lạt",
                District = "Phường 3",
                Address = "19 Đống Đa, Phường 3, Thành phố Đà Lạt",
                Description = "Nằm giữa rừng thông mát lành nhìn xuống thung lũng, mỗi phòng đều có ban công đón sương sớm và lò sưởi ấm áp.",
                StarRating = 4,
                Amenities = "wifi,breakfast,parking,spa",
                Status = HotelStatuses.Active,
                Featured = true,
                CreatedAt = SeedTime,
                UpdatedAt = SeedTime
            },
            new Hotel
            {
                Id = 7,
                OwnerId = 3,
                Name = "Trần Phú Oceanfront Hotel",
                Slug = "tran-phu-oceanfront-hotel",
                City = "Nha Trang",
                District = "Lộc Thọ",
                Address = "64 Trần Phú, Phường Lộc Thọ, Thành phố Nha Trang",
                Description = "Đối diện bãi biển Nha Trang xanh trong, sở hữu hồ bơi tầng thượng và dịch vụ tour đảo trọn gói.",
                StarRating = 4,
                Amenities = "wifi,pool,breakfast,parking,sea-view,gym",
                Status = HotelStatuses.Active,
                Featured = false,
                CreatedAt = SeedTime,
                UpdatedAt = SeedTime
            },
            new Hotel
            {
                Id = 8,
                OwnerId = 3,
                Name = "Ngọc Đảo Villas Phú Quốc",
                Slug = "ngoc-dao-villas-phu-quoc",
                City = "Phú Quốc",
                District = "Dương Đông",
                Address = "105 Trần Hưng Đạo, Phường Dương Đông, Thành phố Phú Quốc",
                Description = "Biệt thự và phòng nghỉ sát bãi Trường ngắm hoàng hôn tuyệt đẹp, đưa đón sân bay miễn phí.",
                StarRating = 5,
                Amenities = "wifi,pool,spa,breakfast,parking,sea-view,airport-shuttle",
                Status = HotelStatuses.Active,
                Featured = true,
                CreatedAt = SeedTime,
                UpdatedAt = SeedTime
            }
        );

        // 16 ảnh khách sạn (mỗi khách sạn 2 ảnh Unsplash, SortOrder = 0 là ảnh đại diện).
        modelBuilder.Entity<HotelImage>().HasData(
            new HotelImage { Id = 1, HotelId = 1, Url = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", SortOrder = 0 },
            new HotelImage { Id = 2, HotelId = 1, Url = "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80", SortOrder = 1 },
            new HotelImage { Id = 3, HotelId = 2, Url = "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80", SortOrder = 0 },
            new HotelImage { Id = 4, HotelId = 2, Url = "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80", SortOrder = 1 },
            new HotelImage { Id = 5, HotelId = 3, Url = "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80", SortOrder = 0 },
            new HotelImage { Id = 6, HotelId = 3, Url = "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80", SortOrder = 1 },
            new HotelImage { Id = 7, HotelId = 4, Url = "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80", SortOrder = 0 },
            new HotelImage { Id = 8, HotelId = 4, Url = "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80", SortOrder = 1 },
            new HotelImage { Id = 9, HotelId = 5, Url = "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80", SortOrder = 0 },
            new HotelImage { Id = 10, HotelId = 5, Url = "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1200&q=80", SortOrder = 1 },
            new HotelImage { Id = 11, HotelId = 6, Url = "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80", SortOrder = 0 },
            new HotelImage { Id = 12, HotelId = 6, Url = "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80", SortOrder = 1 },
            new HotelImage { Id = 13, HotelId = 7, Url = "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80", SortOrder = 0 },
            new HotelImage { Id = 14, HotelId = 7, Url = "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80", SortOrder = 1 },
            new HotelImage { Id = 15, HotelId = 8, Url = "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1200&q=80", SortOrder = 0 },
            new HotelImage { Id = 16, HotelId = 8, Url = "https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&w=1200&q=80", SortOrder = 1 }
        );

        // 24 loại phòng (3 loại phòng cho mỗi khách sạn).
        modelBuilder.Entity<RoomType>().HasData(
            // Hotel 1: Azure Bay Resort Đà Nẵng
            new RoomType { Id = 1, HotelId = 1, Name = "Deluxe Hướng Vườn", BedType = "1 Giường King", ViewType = "Hướng vườn", HasBathtub = true, MaxAdults = 2, MaxChildren = 1, SizeM2 = 38, PricePerNight = 1850000m, TotalRooms = 10, Description = "Phòng rộng rãi có ban công riêng nhìn ra khu vườn nhiệt đới.", Amenities = "wifi,tv,minibar,balcony,bathtub", IsActive = true },
            new RoomType { Id = 2, HotelId = 1, Name = "Premier Hướng Biển", BedType = "2 Giường Đơn", ViewType = "Hướng biển", HasBathtub = true, MaxAdults = 2, MaxChildren = 2, SizeM2 = 45, PricePerNight = 2650000m, TotalRooms = 8, Description = "Tầm nhìn trực diện bãi biển Mỹ Khê cùng bồn tắm thư giãn.", Amenities = "wifi,tv,minibar,balcony,bathtub,coffee-maker", IsActive = true },
            new RoomType { Id = 3, HotelId = 1, Name = "Ocean Suite Gia Đình", BedType = "2 Giường King", ViewType = "Toàn cảnh biển", HasBathtub = true, MaxAdults = 4, MaxChildren = 2, SizeM2 = 76, PricePerNight = 4500000m, TotalRooms = 4, Description = "Suite 2 phòng ngủ kết hợp phòng khách riêng cho gia đình.", Amenities = "wifi,tv,minibar,balcony,bathtub,living-room", IsActive = true },

            // Hotel 2: Sông Hàn Boutique Hotel
            new RoomType { Id = 4, HotelId = 2, Name = "Superior Phố", BedType = "1 Giường Queen", ViewType = "Hướng phố", HasBathtub = false, MaxAdults = 2, MaxChildren = 1, SizeM2 = 28, PricePerNight = 980000m, TotalRooms = 12, Description = "Phòng gọn gàng ấm cúng, phù hợp cặp đôi hoặc khách công tác.", Amenities = "wifi,tv,work-desk,minibar", IsActive = true },
            new RoomType { Id = 5, HotelId = 2, Name = "Deluxe Hướng Sông Hàn", BedType = "1 Giường King", ViewType = "Hướng sông", HasBathtub = true, MaxAdults = 2, MaxChildren = 1, SizeM2 = 35, PricePerNight = 1450000m, TotalRooms = 8, Description = "Cửa kính lớn ngắm cầu Rồng và sông Hàn lung linh về đêm.", Amenities = "wifi,tv,minibar,bathtub,coffee-maker", IsActive = true },
            new RoomType { Id = 6, HotelId = 2, Name = "Boutique Studio", BedType = "1 Giường King + Sofa", ViewType = "Hướng sông", HasBathtub = true, MaxAdults = 3, MaxChildren = 1, SizeM2 = 46, PricePerNight = 1950000m, TotalRooms = 5, Description = "Không gian mở tích hợp khu vực tiếp khách và bếp nhỏ.", Amenities = "wifi,tv,minibar,bathtub,kitchenette", IsActive = true },

            // Hotel 3: Hoàn Kiếm Heritage Hotel
            new RoomType { Id = 7, HotelId = 3, Name = "Classic Phố Cổ", BedType = "1 Giường Queen", ViewType = "Hướng phố", HasBathtub = false, MaxAdults = 2, MaxChildren = 1, SizeM2 = 26, PricePerNight = 1350000m, TotalRooms = 10, Description = "Nội thất gỗ tự nhiên mang nét duyên phố cổ Hà Nội.", Amenities = "wifi,tv,work-desk,minibar", IsActive = true },
            new RoomType { Id = 8, HotelId = 3, Name = "Heritage Ban Công", BedType = "1 Giường King", ViewType = "Hướng hồ", HasBathtub = true, MaxAdults = 2, MaxChildren = 1, SizeM2 = 36, PricePerNight = 2100000m, TotalRooms = 6, Description = "Ban công Pháp cổ nhìn về phía hàng cây xanh hồ Hoàn Kiếm.", Amenities = "wifi,tv,balcony,bathtub,coffee-maker", IsActive = true },
            new RoomType { Id = 9, HotelId = 3, Name = "Indochine Suite", BedType = "1 Giường King", ViewType = "Hướng hồ", HasBathtub = true, MaxAdults = 3, MaxChildren = 2, SizeM2 = 55, PricePerNight = 3200000m, TotalRooms = 4, Description = "Suite sang trọng với bồn tắm chân sư tử và phòng trà riêng.", Amenities = "wifi,tv,balcony,bathtub,living-room", IsActive = true },

            // Hotel 4: Saigon Skyline Luxury
            new RoomType { Id = 10, HotelId = 4, Name = "Executive Thành Phố", BedType = "1 Giường King", ViewType = "Hướng thành phố", HasBathtub = true, MaxAdults = 2, MaxChildren = 1, SizeM2 = 40, PricePerNight = 2800000m, TotalRooms = 12, Description = "Phòng tầng cao cách âm tuyệt đối ngay trung tâm Quận 1.", Amenities = "wifi,tv,work-desk,bathtub,minibar", IsActive = true },
            new RoomType { Id = 11, HotelId = 4, Name = "Skyline River View", BedType = "2 Giường Queen", ViewType = "Hướng sông", HasBathtub = true, MaxAdults = 3, MaxChildren = 2, SizeM2 = 50, PricePerNight = 3600000m, TotalRooms = 8, Description = "Ngắm toàn cảnh sông Sài Gòn và bến Bạch Đằng từ tầng 22.", Amenities = "wifi,tv,bathtub,coffee-maker,lounge-access", IsActive = true },
            new RoomType { Id = 12, HotelId = 4, Name = "Presidential Suite", BedType = "2 Giường King", ViewType = "Toàn cảnh 360", HasBathtub = true, MaxAdults = 4, MaxChildren = 2, SizeM2 = 95, PricePerNight = 6500000m, TotalRooms = 2, Description = "Căn hộ tổng thống với phòng ăn riêng và quyền sử dụng Executive Lounge.", Amenities = "wifi,tv,bathtub,living-room,lounge-access", IsActive = true },

            // Hotel 5: Bến Thành Urban Stay
            new RoomType { Id = 13, HotelId = 5, Name = "Standard Đô Thị", BedType = "1 Giường Queen", ViewType = "Không cửa sổ", HasBathtub = false, MaxAdults = 2, MaxChildren = 0, SizeM2 = 22, PricePerNight = 750000m, TotalRooms = 14, Description = "Tiết kiệm và sạch sẽ ngay sát chợ Bến Thành.", Amenities = "wifi,tv,air-conditioning", IsActive = true },
            new RoomType { Id = 14, HotelId = 5, Name = "Superior Cửa Sổ Lớn", BedType = "2 Giường Đơn", ViewType = "Hướng phố", HasBathtub = false, MaxAdults = 2, MaxChildren = 1, SizeM2 = 28, PricePerNight = 1050000m, TotalRooms = 10, Description = "Nhiều ánh sáng tự nhiên, thích hợp cho bạn bè đi du lịch.", Amenities = "wifi,tv,work-desk,minibar", IsActive = true },
            new RoomType { Id = 15, HotelId = 5, Name = "Family Kết Nối", BedType = "2 Giường Queen", ViewType = "Hướng phố", HasBathtub = false, MaxAdults = 4, MaxChildren = 2, SizeM2 = 42, PricePerNight = 1650000m, TotalRooms = 5, Description = "Không gian rộng cho gia đình 4 người ngay trung tâm.", Amenities = "wifi,tv,minibar,sofa", IsActive = true },

            // Hotel 6: Thông Reo Hill Resort Đà Lạt
            new RoomType { Id = 16, HotelId = 6, Name = "Pine View Cabin", BedType = "1 Giường King", ViewType = "Hướng rừng thông", HasBathtub = true, MaxAdults = 2, MaxChildren = 1, SizeM2 = 34, PricePerNight = 1600000m, TotalRooms = 9, Description = "Phòng gỗ thông ấm cúng, bồn tắm gỗ ngâm thảo mộc.", Amenities = "wifi,balcony,bathtub,heater", IsActive = true },
            new RoomType { Id = 17, HotelId = 6, Name = "Valley Panorama", BedType = "1 Giường King", ViewType = "Hướng thung lũng", HasBathtub = true, MaxAdults = 2, MaxChildren = 2, SizeM2 = 44, PricePerNight = 2250000m, TotalRooms = 6, Description = "Ban công rộng đón bình minh trên biển mây Đà Lạt.", Amenities = "wifi,balcony,bathtub,fireplace,coffee-maker", IsActive = true },
            new RoomType { Id = 18, HotelId = 6, Name = "Biệt Thự Rừng Thông", BedType = "2 Giường King", ViewType = "Hướng rừng thông", HasBathtub = true, MaxAdults = 4, MaxChildren = 2, SizeM2 = 85, PricePerNight = 4100000m, TotalRooms = 3, Description = "Villa biệt lập có sân BBQ và lò sưởi củi riêng.", Amenities = "wifi,balcony,bathtub,fireplace,kitchenette", IsActive = true },

            // Hotel 7: Trần Phú Oceanfront Hotel
            new RoomType { Id = 19, HotelId = 7, Name = "Superior Thành Phố", BedType = "1 Giường Queen", ViewType = "Hướng phố", HasBathtub = false, MaxAdults = 2, MaxChildren = 1, SizeM2 = 30, PricePerNight = 1150000m, TotalRooms = 12, Description = "Cách bãi biển Nha Trang chỉ 1 phút qua đường Trần Phú.", Amenities = "wifi,tv,minibar,work-desk", IsActive = true },
            new RoomType { Id = 20, HotelId = 7, Name = "Deluxe Trực Diện Biển", BedType = "1 Giường King", ViewType = "Hướng biển", HasBathtub = true, MaxAdults = 2, MaxChildren = 1, SizeM2 = 38, PricePerNight = 1890000m, TotalRooms = 10, Description = "Ban công hướng vịnh Nha Trang đón gió biển mát rượi.", Amenities = "wifi,tv,balcony,bathtub,minibar", IsActive = true },
            new RoomType { Id = 21, HotelId = 7, Name = "Ocean Family Suite", BedType = "2 Giường Queen", ViewType = "Hướng biển", HasBathtub = true, MaxAdults = 4, MaxChildren = 2, SizeM2 = 62, PricePerNight = 2950000m, TotalRooms = 5, Description = "Phòng gia đình rộng rãi với hai mặt thoáng nhìn ra vịnh.", Amenities = "wifi,tv,balcony,bathtub,living-room", IsActive = true },

            // Hotel 8: Ngọc Đảo Villas Phú Quốc
            new RoomType { Id = 22, HotelId = 8, Name = "Garden Bungalow", BedType = "1 Giường King", ViewType = "Hướng vườn", HasBathtub = true, MaxAdults = 2, MaxChildren = 1, SizeM2 = 48, PricePerNight = 2400000m, TotalRooms = 8, Description = "Bungalow mái lá nhiệt đới tách biệt giữa vườn dừa xanh.", Amenities = "wifi,balcony,bathtub,coffee-maker", IsActive = true },
            new RoomType { Id = 23, HotelId = 8, Name = "Beachfront Pool Villa", BedType = "1 Giường King", ViewType = "Sát biển", HasBathtub = true, MaxAdults = 2, MaxChildren = 2, SizeM2 = 75, PricePerNight = 4800000m, TotalRooms = 5, Description = "Villa có hồ bơi riêng bước thẳng ra bãi cát trắng.", Amenities = "wifi,private-pool,bathtub,balcony,minibar", IsActive = true },
            new RoomType { Id = 24, HotelId = 8, Name = "Grand Sunset Villa", BedType = "2 Giường King", ViewType = "Sát biển", HasBathtub = true, MaxAdults = 4, MaxChildren = 2, SizeM2 = 120, PricePerNight = 6200000m, TotalRooms = 3, Description = "Biệt thự 2 phòng ngủ ngắm hoàng hôn Bãi Trường đẳng cấp.", Amenities = "wifi,private-pool,bathtub,living-room,kitchenette", IsActive = true }
        );

        // 24 ảnh đại diện loại phòng.
        modelBuilder.Entity<RoomTypeImage>().HasData(
            new RoomTypeImage { Id = 1, RoomTypeId = 1, Url = "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 2, RoomTypeId = 2, Url = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 3, RoomTypeId = 3, Url = "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 4, RoomTypeId = 4, Url = "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 5, RoomTypeId = 5, Url = "https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 6, RoomTypeId = 6, Url = "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 7, RoomTypeId = 7, Url = "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 8, RoomTypeId = 8, Url = "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 9, RoomTypeId = 9, Url = "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 10, RoomTypeId = 10, Url = "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 11, RoomTypeId = 11, Url = "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 12, RoomTypeId = 12, Url = "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 13, RoomTypeId = 13, Url = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 14, RoomTypeId = 14, Url = "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 15, RoomTypeId = 15, Url = "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 16, RoomTypeId = 16, Url = "https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 17, RoomTypeId = 17, Url = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 18, RoomTypeId = 18, Url = "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 19, RoomTypeId = 19, Url = "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 20, RoomTypeId = 20, Url = "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 21, RoomTypeId = 21, Url = "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 22, RoomTypeId = 22, Url = "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 23, RoomTypeId = 23, Url = "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 },
            new RoomTypeImage { Id = 24, RoomTypeId = 24, Url = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80", SortOrder = 0 }
        );

        // 20 booking rải ngày từ tháng 11/2026 đến tháng 12/2026 với đầy đủ 5 trạng thái.
        modelBuilder.Entity<Booking>().HasData(
            new Booking { Id = 1, Code = "AZS10001", UserId = 4, HotelId = 1, RoomTypeId = 2, GuestName = "Lê Hoàng Nam", GuestPhone = "0903000004", GuestEmail = "demo@azurestay.vn", CheckIn = new DateOnly(2026, 11, 5), CheckOut = new DateOnly(2026, 11, 8), Rooms = 1, Adults = 2, Children = 0, PricePerNight = 2650000m, TotalAmount = 7950000m, Status = BookingStatuses.Completed, Note = "Phòng tầng cao", CreatedAt = SeedTime, UpdatedAt = SeedTime },
            new Booking { Id = 2, Code = "AZS10002", UserId = 5, HotelId = 2, RoomTypeId = 5, GuestName = "Phạm Thảo Vy", GuestPhone = "0903000005", GuestEmail = "khach2@azurestay.vn", CheckIn = new DateOnly(2026, 11, 7), CheckOut = new DateOnly(2026, 11, 9), Rooms = 1, Adults = 2, Children = 0, PricePerNight = 1450000m, TotalAmount = 2900000m, Status = BookingStatuses.Completed, Note = null, CreatedAt = SeedTime, UpdatedAt = SeedTime },
            new Booking { Id = 3, Code = "AZS10003", UserId = 4, HotelId = 3, RoomTypeId = 8, GuestName = "Lê Hoàng Nam", GuestPhone = "0903000004", GuestEmail = "demo@azurestay.vn", CheckIn = new DateOnly(2026, 11, 10), CheckOut = new DateOnly(2026, 11, 12), Rooms = 1, Adults = 2, Children = 1, PricePerNight = 2100000m, TotalAmount = 4200000m, Status = BookingStatuses.Completed, Note = "Nhận phòng sau 15h", CreatedAt = SeedTime, UpdatedAt = SeedTime },
            new Booking { Id = 4, Code = "AZS10004", UserId = 5, HotelId = 4, RoomTypeId = 10, GuestName = "Phạm Thảo Vy", GuestPhone = "0903000005", GuestEmail = "khach2@azurestay.vn", CheckIn = new DateOnly(2026, 11, 12), CheckOut = new DateOnly(2026, 11, 15), Rooms = 2, Adults = 4, Children = 0, PricePerNight = 2800000m, TotalAmount = 16800000m, Status = BookingStatuses.Completed, Note = "Xuất hoá đơn công ty", CreatedAt = SeedTime, UpdatedAt = SeedTime },
            new Booking { Id = 5, Code = "AZS10005", UserId = 4, HotelId = 6, RoomTypeId = 17, GuestName = "Lê Hoàng Nam", GuestPhone = "0903000004", GuestEmail = "demo@azurestay.vn", CheckIn = new DateOnly(2026, 11, 16), CheckOut = new DateOnly(2026, 11, 19), Rooms = 1, Adults = 2, Children = 0, PricePerNight = 2250000m, TotalAmount = 6750000m, Status = BookingStatuses.Completed, Note = "Kỷ niệm ngày cưới", CreatedAt = SeedTime, UpdatedAt = SeedTime },
            new Booking { Id = 6, Code = "AZS10006", UserId = 5, HotelId = 8, RoomTypeId = 23, GuestName = "Phạm Thảo Vy", GuestPhone = "0903000005", GuestEmail = "khach2@azurestay.vn", CheckIn = new DateOnly(2026, 11, 18), CheckOut = new DateOnly(2026, 11, 21), Rooms = 1, Adults = 2, Children = 1, PricePerNight = 4800000m, TotalAmount = 14400000m, Status = BookingStatuses.Completed, Note = "Đón sân bay chuyến 14:00", CreatedAt = SeedTime, UpdatedAt = SeedTime },

            new Booking { Id = 7, Code = "AZS10007", UserId = 4, HotelId = 5, RoomTypeId = 14, GuestName = "Lê Hoàng Nam", GuestPhone = "0903000004", GuestEmail = "demo@azurestay.vn", CheckIn = new DateOnly(2026, 11, 20), CheckOut = new DateOnly(2026, 11, 22), Rooms = 1, Adults = 2, Children = 0, PricePerNight = 1050000m, TotalAmount = 2100000m, Status = BookingStatuses.Cancelled, Note = "Thay đổi lịch công tác", CreatedAt = SeedTime, UpdatedAt = SeedTime },
            new Booking { Id = 8, Code = "AZS10008", UserId = 5, HotelId = 7, RoomTypeId = 20, GuestName = "Phạm Thảo Vy", GuestPhone = "0903000005", GuestEmail = "khach2@azurestay.vn", CheckIn = new DateOnly(2026, 11, 22), CheckOut = new DateOnly(2026, 11, 24), Rooms = 2, Adults = 3, Children = 1, PricePerNight = 1890000m, TotalAmount = 7560000m, Status = BookingStatuses.Cancelled, Note = "Đổi điểm đến", CreatedAt = SeedTime, UpdatedAt = SeedTime },

            new Booking { Id = 9, Code = "AZS10009", UserId = 4, HotelId = 1, RoomTypeId = 1, GuestName = "Lê Hoàng Nam", GuestPhone = "0903000004", GuestEmail = "demo@azurestay.vn", CheckIn = new DateOnly(2026, 11, 25), CheckOut = new DateOnly(2026, 11, 28), Rooms = 1, Adults = 2, Children = 0, PricePerNight = 1850000m, TotalAmount = 5550000m, Status = BookingStatuses.CheckedIn, Note = null, CreatedAt = SeedTime, UpdatedAt = SeedTime },
            new Booking { Id = 10, Code = "AZS10010", UserId = 5, HotelId = 4, RoomTypeId = 11, GuestName = "Phạm Thảo Vy", GuestPhone = "0903000005", GuestEmail = "khach2@azurestay.vn", CheckIn = new DateOnly(2026, 11, 25), CheckOut = new DateOnly(2026, 11, 27), Rooms = 1, Adults = 2, Children = 1, PricePerNight = 3600000m, TotalAmount = 7200000m, Status = BookingStatuses.CheckedIn, Note = "Thêm nôi trẻ em", CreatedAt = SeedTime, UpdatedAt = SeedTime },
            new Booking { Id = 11, Code = "AZS10011", UserId = 4, HotelId = 7, RoomTypeId = 20, GuestName = "Lê Hoàng Nam", GuestPhone = "0903000004", GuestEmail = "demo@azurestay.vn", CheckIn = new DateOnly(2026, 11, 26), CheckOut = new DateOnly(2026, 11, 29), Rooms = 1, Adults = 2, Children = 0, PricePerNight = 1890000m, TotalAmount = 5670000m, Status = BookingStatuses.CheckedIn, Note = null, CreatedAt = SeedTime, UpdatedAt = SeedTime },

            new Booking { Id = 12, Code = "AZS10012", UserId = 4, HotelId = 1, RoomTypeId = 2, GuestName = "Lê Hoàng Nam", GuestPhone = "0903000004", GuestEmail = "demo@azurestay.vn", CheckIn = new DateOnly(2026, 12, 1), CheckOut = new DateOnly(2026, 12, 4), Rooms = 2, Adults = 4, Children = 1, PricePerNight = 2650000m, TotalAmount = 15900000m, Status = BookingStatuses.Confirmed, Note = "Hai phòng gần nhau", CreatedAt = SeedTime, UpdatedAt = SeedTime },
            new Booking { Id = 13, Code = "AZS10013", UserId = 5, HotelId = 2, RoomTypeId = 4, GuestName = "Phạm Thảo Vy", GuestPhone = "0903000005", GuestEmail = "khach2@azurestay.vn", CheckIn = new DateOnly(2026, 12, 2), CheckOut = new DateOnly(2026, 12, 4), Rooms = 1, Adults = 1, Children = 0, PricePerNight = 980000m, TotalAmount = 1960000m, Status = BookingStatuses.Confirmed, Note = null, CreatedAt = SeedTime, UpdatedAt = SeedTime },
            new Booking { Id = 14, Code = "AZS10014", UserId = 4, HotelId = 3, RoomTypeId = 9, GuestName = "Lê Hoàng Nam", GuestPhone = "0903000004", GuestEmail = "demo@azurestay.vn", CheckIn = new DateOnly(2026, 12, 5), CheckOut = new DateOnly(2026, 12, 7), Rooms = 1, Adults = 2, Children = 0, PricePerNight = 3200000m, TotalAmount = 6400000m, Status = BookingStatuses.Confirmed, Note = "Phòng yên tĩnh", CreatedAt = SeedTime, UpdatedAt = SeedTime },
            new Booking { Id = 15, Code = "AZS10015", UserId = 5, HotelId = 6, RoomTypeId = 16, GuestName = "Phạm Thảo Vy", GuestPhone = "0903000005", GuestEmail = "khach2@azurestay.vn", CheckIn = new DateOnly(2026, 12, 6), CheckOut = new DateOnly(2026, 12, 9), Rooms = 2, Adults = 4, Children = 0, PricePerNight = 1600000m, TotalAmount = 9600000m, Status = BookingStatuses.Confirmed, Note = null, CreatedAt = SeedTime, UpdatedAt = SeedTime },
            new Booking { Id = 16, Code = "AZS10016", UserId = 4, HotelId = 8, RoomTypeId = 22, GuestName = "Lê Hoàng Nam", GuestPhone = "0903000004", GuestEmail = "demo@azurestay.vn", CheckIn = new DateOnly(2026, 12, 10), CheckOut = new DateOnly(2026, 12, 13), Rooms = 1, Adults = 2, Children = 0, PricePerNight = 2400000m, TotalAmount = 7200000m, Status = BookingStatuses.Confirmed, Note = null, CreatedAt = SeedTime, UpdatedAt = SeedTime },
            new Booking { Id = 17, Code = "AZS10017", UserId = 5, HotelId = 5, RoomTypeId = 15, GuestName = "Phạm Thảo Vy", GuestPhone = "0903000005", GuestEmail = "khach2@azurestay.vn", CheckIn = new DateOnly(2026, 12, 12), CheckOut = new DateOnly(2026, 12, 14), Rooms = 1, Adults = 3, Children = 1, PricePerNight = 1650000m, TotalAmount = 3300000m, Status = BookingStatuses.Confirmed, Note = null, CreatedAt = SeedTime, UpdatedAt = SeedTime },

            new Booking { Id = 18, Code = "AZS10018", UserId = 4, HotelId = 4, RoomTypeId = 12, GuestName = "Lê Hoàng Nam", GuestPhone = "0903000004", GuestEmail = "demo@azurestay.vn", CheckIn = new DateOnly(2026, 12, 15), CheckOut = new DateOnly(2026, 12, 17), Rooms = 1, Adults = 2, Children = 0, PricePerNight = 6500000m, TotalAmount = 13000000m, Status = BookingStatuses.Pending, Note = "Chờ thanh toán", CreatedAt = SeedTime, UpdatedAt = SeedTime },
            new Booking { Id = 19, Code = "AZS10019", UserId = 5, HotelId = 7, RoomTypeId = 21, GuestName = "Phạm Thảo Vy", GuestPhone = "0903000005", GuestEmail = "khach2@azurestay.vn", CheckIn = new DateOnly(2026, 12, 18), CheckOut = new DateOnly(2026, 12, 20), Rooms = 1, Adults = 4, Children = 1, PricePerNight = 2950000m, TotalAmount = 5900000m, Status = BookingStatuses.Pending, Note = null, CreatedAt = SeedTime, UpdatedAt = SeedTime },
            new Booking { Id = 20, Code = "AZS10020", UserId = 4, HotelId = 1, RoomTypeId = 3, GuestName = "Lê Hoàng Nam", GuestPhone = "0903000004", GuestEmail = "demo@azurestay.vn", CheckIn = new DateOnly(2026, 12, 22), CheckOut = new DateOnly(2026, 12, 25), Rooms = 1, Adults = 4, Children = 2, PricePerNight = 4500000m, TotalAmount = 13500000m, Status = BookingStatuses.Pending, Note = "Kỳ nghỉ Giáng sinh", CreatedAt = SeedTime, UpdatedAt = SeedTime }
        );

        // Giao dịch thanh toán mẫu tương ứng với các đơn đã xác nhận/hoàn tất/huỷ.
        modelBuilder.Entity<Payment>().HasData(
            new Payment { Id = 1, BookingId = 1, Provider = "VNPay", Amount = 7950000m, TxnRef = "VNP20261101001", Status = PaymentStatuses.Paid, PaidAt = SeedTime },
            new Payment { Id = 2, BookingId = 2, Provider = "VNPay", Amount = 2900000m, TxnRef = "VNP20261101002", Status = PaymentStatuses.Paid, PaidAt = SeedTime },
            new Payment { Id = 3, BookingId = 3, Provider = "VNPay", Amount = 4200000m, TxnRef = "VNP20261101003", Status = PaymentStatuses.Paid, PaidAt = SeedTime },
            new Payment { Id = 4, BookingId = 4, Provider = "VNPay", Amount = 16800000m, TxnRef = "VNP20261101004", Status = PaymentStatuses.Paid, PaidAt = SeedTime },
            new Payment { Id = 5, BookingId = 5, Provider = "VNPay", Amount = 6750000m, TxnRef = "VNP20261101005", Status = PaymentStatuses.Paid, PaidAt = SeedTime },
            new Payment { Id = 6, BookingId = 6, Provider = "VNPay", Amount = 14400000m, TxnRef = "VNP20261101006", Status = PaymentStatuses.Paid, PaidAt = SeedTime },
            new Payment { Id = 7, BookingId = 8, Provider = "VNPay", Amount = 7560000m, TxnRef = "VNP20261101008", Status = PaymentStatuses.Refunded, PaidAt = SeedTime },
            new Payment { Id = 8, BookingId = 9, Provider = "VNPay", Amount = 5550000m, TxnRef = "VNP20261101009", Status = PaymentStatuses.Paid, PaidAt = SeedTime },
            new Payment { Id = 9, BookingId = 10, Provider = "VNPay", Amount = 7200000m, TxnRef = "VNP20261101010", Status = PaymentStatuses.Paid, PaidAt = SeedTime },
            new Payment { Id = 10, BookingId = 11, Provider = "VNPay", Amount = 5670000m, TxnRef = "VNP20261101011", Status = PaymentStatuses.Paid, PaidAt = SeedTime },
            new Payment { Id = 11, BookingId = 12, Provider = "VNPay", Amount = 15900000m, TxnRef = "VNP20261101012", Status = PaymentStatuses.Paid, PaidAt = SeedTime },
            new Payment { Id = 12, BookingId = 13, Provider = "VNPay", Amount = 1960000m, TxnRef = "VNP20261101013", Status = PaymentStatuses.Paid, PaidAt = SeedTime },
            new Payment { Id = 13, BookingId = 14, Provider = "VNPay", Amount = 6400000m, TxnRef = "VNP20261101014", Status = PaymentStatuses.Paid, PaidAt = SeedTime },
            new Payment { Id = 14, BookingId = 15, Provider = "VNPay", Amount = 9600000m, TxnRef = "VNP20261101015", Status = PaymentStatuses.Paid, PaidAt = SeedTime },
            new Payment { Id = 15, BookingId = 16, Provider = "VNPay", Amount = 7200000m, TxnRef = "VNP20261101016", Status = PaymentStatuses.Paid, PaidAt = SeedTime }
        );

        // 6 đánh giá mẫu gắn với 6 đơn đã hoàn tất (Completed).
        modelBuilder.Entity<Review>().HasData(
            new Review { Id = 1, BookingId = 1, HotelId = 1, UserId = 4, Rating = 5, Comment = "Hồ bơi vô cực rất đẹp, nhân viên nhiệt tình và bữa sáng phong phú.", CreatedAt = SeedTime },
            new Review { Id = 2, BookingId = 2, HotelId = 2, UserId = 5, Rating = 4, Comment = "Vị trí ngay trung tâm sông Hàn, đi bộ ra cầu Rồng rất tiện.", CreatedAt = SeedTime },
            new Review { Id = 3, BookingId = 3, HotelId = 3, UserId = 4, Rating = 5, Comment = "Phòng sạch sẽ, yên tĩnh dù nằm giữa phố cổ Hà Nội.", CreatedAt = SeedTime },
            new Review { Id = 4, BookingId = 4, HotelId = 4, UserId = 5, Rating = 5, Comment = "View sông Sài Gòn xuất sắc, phù hợp tiếp khách và công tác.", CreatedAt = SeedTime },
            new Review { Id = 5, BookingId = 5, HotelId = 6, UserId = 4, Rating = 5, Comment = "Không khí Đà Lạt trong lành, bồn tắm gỗ ngâm thảo mộc cực thích.", CreatedAt = SeedTime },
            new Review { Id = 6, BookingId = 6, HotelId = 8, UserId = 5, Rating = 5, Comment = "Biệt thự sát biển ngắm hoàng hôn tuyệt vời, xe đưa đón đúng giờ.", CreatedAt = SeedTime }
        );
    }
}
