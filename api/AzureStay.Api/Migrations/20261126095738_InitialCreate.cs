using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AzureStay.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Hotels",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OwnerId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(220)", maxLength: 220, nullable: false),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    District = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Address = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    StarRating = table.Column<int>(type: "int", nullable: false),
                    Amenities = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Featured = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Hotels", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Hotels_Users_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Token = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefreshTokens_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HotelImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    HotelId = table.Column<int>(type: "int", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HotelImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HotelImages_Hotels_HotelId",
                        column: x => x.HotelId,
                        principalTable: "Hotels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RoomTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    HotelId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    BedType = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    ViewType = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    HasBathtub = table.Column<bool>(type: "bit", nullable: false),
                    MaxAdults = table.Column<int>(type: "int", nullable: false),
                    MaxChildren = table.Column<int>(type: "int", nullable: false),
                    SizeM2 = table.Column<int>(type: "int", nullable: false),
                    PricePerNight = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalRooms = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Amenities = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomTypes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoomTypes_Hotels_HotelId",
                        column: x => x.HotelId,
                        principalTable: "Hotels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Bookings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    HotelId = table.Column<int>(type: "int", nullable: false),
                    RoomTypeId = table.Column<int>(type: "int", nullable: false),
                    GuestName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    GuestPhone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    GuestEmail = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    CheckIn = table.Column<DateOnly>(type: "date", nullable: false),
                    CheckOut = table.Column<DateOnly>(type: "date", nullable: false),
                    Rooms = table.Column<int>(type: "int", nullable: false),
                    Adults = table.Column<int>(type: "int", nullable: false),
                    Children = table.Column<int>(type: "int", nullable: false),
                    PricePerNight = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Note = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bookings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Bookings_Hotels_HotelId",
                        column: x => x.HotelId,
                        principalTable: "Hotels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Bookings_RoomTypes_RoomTypeId",
                        column: x => x.RoomTypeId,
                        principalTable: "RoomTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Bookings_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RoomTypeImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoomTypeId = table.Column<int>(type: "int", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomTypeImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoomTypeImages_RoomTypes_RoomTypeId",
                        column: x => x.RoomTypeId,
                        principalTable: "RoomTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BookingId = table.Column<int>(type: "int", nullable: false),
                    Provider = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TxnRef = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RawResponse = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Payments_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BookingId = table.Column<int>(type: "int", nullable: false),
                    HotelId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reviews_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Reviews_Hotels_HotelId",
                        column: x => x.HotelId,
                        principalTable: "Hotels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reviews_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "FullName", "PasswordHash", "Phone", "Role", "Status" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "admin@azurestay.vn", "Quản trị viên AzureStay", "100000.jGl25bVBBBW96Qi9Te4V3w==.hCzl0+YP1ldDwvaWlQUXUvekDsbzFQQJAeRzHQGDqe8=", "0901000001", "Admin", "Active" },
                    { 2, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "owner@azurestay.vn", "Nguyễn Minh Tuấn", "100000.FVf5SesHTuHegT01mLOU6g==.5weGOdNITz5lDTBJW87DbqIvdjBzQHVp2IBoOKytnjA=", "0902000002", "Owner", "Active" },
                    { 3, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "owner2@azurestay.vn", "Trần Thị Lan Anh", "100000.cTo0o8MTvkJtFbXGLKnBFQ==.EzhXnHIeUz7ijD0KBm8GaOoUR0HWrP62GToxvReo0Ek=", "0902000003", "Owner", "Active" },
                    { 4, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "demo@azurestay.vn", "Lê Hoàng Nam", "100000.KpdRbDVLaISM29j1SiJqCg==.KdZ3+Rr24pXIk40HZ18Co4ALMB6vUYLacb5GcKcvRTs=", "0903000004", "Customer", "Active" },
                    { 5, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "khach2@azurestay.vn", "Phạm Thảo Vy", "100000.j/X6TWaYX9cMwLz6xnCYTA==.9T0lYm8jStVwNqUoh42tgqgMoynYSkbTytzXMgUkKrY=", "0903000005", "Customer", "Active" }
                });

            migrationBuilder.InsertData(
                table: "Hotels",
                columns: new[] { "Id", "Address", "Amenities", "City", "CreatedAt", "Description", "District", "Featured", "Name", "OwnerId", "Slug", "StarRating", "Status", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, "128 Võ Nguyên Giáp, Phường Phước Mỹ, Quận Sơn Trà, Đà Nẵng", "wifi,pool,spa,breakfast,parking,gym,sea-view", "Đà Nẵng", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "Khu nghỉ dưỡng ven biển Mỹ Khê với hồ bơi vô cực hướng biển, spa trị liệu và nhà hàng hải sản tươi sống.", "Sơn Trà", true, "Azure Bay Resort Đà Nẵng", 2, "azure-bay-resort-da-nang", 5, "Active", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc) },
                    { 2, "45 Bạch Đằng, Phường Hải Châu I, Quận Hải Châu, Đà Nẵng", "wifi,breakfast,parking,airport-shuttle", "Đà Nẵng", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "Khách sạn boutique ngay trung tâm bờ Tây sông Hàn, thuận tiện dạo bộ cầu Rồng và chợ đêm.", "Hải Châu", false, "Sông Hàn Boutique Hotel", 2, "song-han-boutique-hotel", 4, "Active", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc) },
                    { 3, "22 Hàng Trống, Phường Hàng Trống, Quận Hoàn Kiếm, Hà Nội", "wifi,breakfast,airport-shuttle,spa", "Hà Nội", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "Kiến trúc Đông Dương thanh lịch cách hồ Hoàn Kiếm 2 phút đi bộ, phòng cách âm yên tĩnh giữa phố cổ.", "Hoàn Kiếm", true, "Hoàn Kiếm Heritage Hotel", 2, "hoan-kiem-heritage-hotel", 4, "Active", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc) },
                    { 4, "88 Đồng Khởi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh", "wifi,pool,gym,spa,breakfast,parking,airport-shuttle", "TP.HCM", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "Khách sạn 5 sao tại trung tâm Quận 1 với sky bar nhìn toàn cảnh sông Sài Gòn và phòng gym mở cửa 24/7.", "Quận 1", true, "Saigon Skyline Luxury", 2, "saigon-skyline-luxury", 5, "Active", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc) },
                    { 5, "112 Lê Thánh Tôn, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh", "wifi,breakfast,parking", "TP.HCM", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "Lựa chọn tối ưu cho chuyến công tác và khám phá ẩm thực Sài Gòn, thiết kế tối giản hiện đại.", "Quận 1", false, "Bến Thành Urban Stay", 3, "ben-thanh-urban-stay", 3, "Active", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc) },
                    { 6, "19 Đống Đa, Phường 3, Thành phố Đà Lạt", "wifi,breakfast,parking,spa", "Đà Lạt", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "Nằm giữa rừng thông mát lành nhìn xuống thung lũng, mỗi phòng đều có ban công đón sương sớm và lò sưởi ấm áp.", "Phường 3", true, "Thông Reo Hill Resort Đà Lạt", 3, "thong-reo-hill-resort-da-lat", 4, "Active", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc) },
                    { 7, "64 Trần Phú, Phường Lộc Thọ, Thành phố Nha Trang", "wifi,pool,breakfast,parking,sea-view,gym", "Nha Trang", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "Đối diện bãi biển Nha Trang xanh trong, sở hữu hồ bơi tầng thượng và dịch vụ tour đảo trọn gói.", "Lộc Thọ", false, "Trần Phú Oceanfront Hotel", 3, "tran-phu-oceanfront-hotel", 4, "Active", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc) },
                    { 8, "105 Trần Hưng Đạo, Phường Dương Đông, Thành phố Phú Quốc", "wifi,pool,spa,breakfast,parking,sea-view,airport-shuttle", "Phú Quốc", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "Biệt thự và phòng nghỉ sát bãi Trường ngắm hoàng hôn tuyệt đẹp, đưa đón sân bay miễn phí.", "Dương Đông", true, "Ngọc Đảo Villas Phú Quốc", 3, "ngoc-dao-villas-phu-quoc", 5, "Active", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.InsertData(
                table: "HotelImages",
                columns: new[] { "Id", "HotelId", "SortOrder", "Url" },
                values: new object[,]
                {
                    { 1, 1, 0, "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80" },
                    { 2, 1, 1, "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80" },
                    { 3, 2, 0, "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80" },
                    { 4, 2, 1, "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80" },
                    { 5, 3, 0, "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80" },
                    { 6, 3, 1, "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80" },
                    { 7, 4, 0, "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80" },
                    { 8, 4, 1, "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80" },
                    { 9, 5, 0, "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80" },
                    { 10, 5, 1, "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1200&q=80" },
                    { 11, 6, 0, "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80" },
                    { 12, 6, 1, "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80" },
                    { 13, 7, 0, "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80" },
                    { 14, 7, 1, "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80" },
                    { 15, 8, 0, "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1200&q=80" },
                    { 16, 8, 1, "https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&w=1200&q=80" }
                });

            migrationBuilder.InsertData(
                table: "RoomTypes",
                columns: new[] { "Id", "Amenities", "BedType", "Description", "HasBathtub", "HotelId", "IsActive", "MaxAdults", "MaxChildren", "Name", "PricePerNight", "SizeM2", "TotalRooms", "ViewType" },
                values: new object[,]
                {
                    { 1, "wifi,tv,minibar,balcony,bathtub", "1 Giường King", "Phòng rộng rãi có ban công riêng nhìn ra khu vườn nhiệt đới.", true, 1, true, 2, 1, "Deluxe Hướng Vườn", 1850000m, 38, 10, "Hướng vườn" },
                    { 2, "wifi,tv,minibar,balcony,bathtub,coffee-maker", "2 Giường Đơn", "Tầm nhìn trực diện bãi biển Mỹ Khê cùng bồn tắm thư giãn.", true, 1, true, 2, 2, "Premier Hướng Biển", 2650000m, 45, 8, "Hướng biển" },
                    { 3, "wifi,tv,minibar,balcony,bathtub,living-room", "2 Giường King", "Suite 2 phòng ngủ kết hợp phòng khách riêng cho gia đình.", true, 1, true, 4, 2, "Ocean Suite Gia Đình", 4500000m, 76, 4, "Toàn cảnh biển" },
                    { 4, "wifi,tv,work-desk,minibar", "1 Giường Queen", "Phòng gọn gàng ấm cúng, phù hợp cặp đôi hoặc khách công tác.", false, 2, true, 2, 1, "Superior Phố", 980000m, 28, 12, "Hướng phố" },
                    { 5, "wifi,tv,minibar,bathtub,coffee-maker", "1 Giường King", "Cửa kính lớn ngắm cầu Rồng và sông Hàn lung linh về đêm.", true, 2, true, 2, 1, "Deluxe Hướng Sông Hàn", 1450000m, 35, 8, "Hướng sông" },
                    { 6, "wifi,tv,minibar,bathtub,kitchenette", "1 Giường King + Sofa", "Không gian mở tích hợp khu vực tiếp khách và bếp nhỏ.", true, 2, true, 3, 1, "Boutique Studio", 1950000m, 46, 5, "Hướng sông" },
                    { 7, "wifi,tv,work-desk,minibar", "1 Giường Queen", "Nội thất gỗ tự nhiên mang nét duyên phố cổ Hà Nội.", false, 3, true, 2, 1, "Classic Phố Cổ", 1350000m, 26, 10, "Hướng phố" },
                    { 8, "wifi,tv,balcony,bathtub,coffee-maker", "1 Giường King", "Ban công Pháp cổ nhìn về phía hàng cây xanh hồ Hoàn Kiếm.", true, 3, true, 2, 1, "Heritage Ban Công", 2100000m, 36, 6, "Hướng hồ" },
                    { 9, "wifi,tv,balcony,bathtub,living-room", "1 Giường King", "Suite sang trọng với bồn tắm chân sư tử và phòng trà riêng.", true, 3, true, 3, 2, "Indochine Suite", 3200000m, 55, 4, "Hướng hồ" },
                    { 10, "wifi,tv,work-desk,bathtub,minibar", "1 Giường King", "Phòng tầng cao cách âm tuyệt đối ngay trung tâm Quận 1.", true, 4, true, 2, 1, "Executive Thành Phố", 2800000m, 40, 12, "Hướng thành phố" },
                    { 11, "wifi,tv,bathtub,coffee-maker,lounge-access", "2 Giường Queen", "Ngắm toàn cảnh sông Sài Gòn và bến Bạch Đằng từ tầng 22.", true, 4, true, 3, 2, "Skyline River View", 3600000m, 50, 8, "Hướng sông" },
                    { 12, "wifi,tv,bathtub,living-room,lounge-access", "2 Giường King", "Căn hộ tổng thống với phòng ăn riêng và quyền sử dụng Executive Lounge.", true, 4, true, 4, 2, "Presidential Suite", 6500000m, 95, 2, "Toàn cảnh 360" },
                    { 13, "wifi,tv,air-conditioning", "1 Giường Queen", "Tiết kiệm và sạch sẽ ngay sát chợ Bến Thành.", false, 5, true, 2, 0, "Standard Đô Thị", 750000m, 22, 14, "Không cửa sổ" },
                    { 14, "wifi,tv,work-desk,minibar", "2 Giường Đơn", "Nhiều ánh sáng tự nhiên, thích hợp cho bạn bè đi du lịch.", false, 5, true, 2, 1, "Superior Cửa Sổ Lớn", 1050000m, 28, 10, "Hướng phố" },
                    { 15, "wifi,tv,minibar,sofa", "2 Giường Queen", "Không gian rộng cho gia đình 4 người ngay trung tâm.", false, 5, true, 4, 2, "Family Kết Nối", 1650000m, 42, 5, "Hướng phố" },
                    { 16, "wifi,balcony,bathtub,heater", "1 Giường King", "Phòng gỗ thông ấm cúng, bồn tắm gỗ ngâm thảo mộc.", true, 6, true, 2, 1, "Pine View Cabin", 1600000m, 34, 9, "Hướng rừng thông" },
                    { 17, "wifi,balcony,bathtub,fireplace,coffee-maker", "1 Giường King", "Ban công rộng đón bình minh trên biển mây Đà Lạt.", true, 6, true, 2, 2, "Valley Panorama", 2250000m, 44, 6, "Hướng thung lũng" },
                    { 18, "wifi,balcony,bathtub,fireplace,kitchenette", "2 Giường King", "Villa biệt lập có sân BBQ và lò sưởi củi riêng.", true, 6, true, 4, 2, "Biệt Thự Rừng Thông", 4100000m, 85, 3, "Hướng rừng thông" },
                    { 19, "wifi,tv,minibar,work-desk", "1 Giường Queen", "Cách bãi biển Nha Trang chỉ 1 phút qua đường Trần Phú.", false, 7, true, 2, 1, "Superior Thành Phố", 1150000m, 30, 12, "Hướng phố" },
                    { 20, "wifi,tv,balcony,bathtub,minibar", "1 Giường King", "Ban công hướng vịnh Nha Trang đón gió biển mát rượi.", true, 7, true, 2, 1, "Deluxe Trực Diện Biển", 1890000m, 38, 10, "Hướng biển" },
                    { 21, "wifi,tv,balcony,bathtub,living-room", "2 Giường Queen", "Phòng gia đình rộng rãi với hai mặt thoáng nhìn ra vịnh.", true, 7, true, 4, 2, "Ocean Family Suite", 2950000m, 62, 5, "Hướng biển" },
                    { 22, "wifi,balcony,bathtub,coffee-maker", "1 Giường King", "Bungalow mái lá nhiệt đới tách biệt giữa vườn dừa xanh.", true, 8, true, 2, 1, "Garden Bungalow", 2400000m, 48, 8, "Hướng vườn" },
                    { 23, "wifi,private-pool,bathtub,balcony,minibar", "1 Giường King", "Villa có hồ bơi riêng bước thẳng ra bãi cát trắng.", true, 8, true, 2, 2, "Beachfront Pool Villa", 4800000m, 75, 5, "Sát biển" },
                    { 24, "wifi,private-pool,bathtub,living-room,kitchenette", "2 Giường King", "Biệt thự 2 phòng ngủ ngắm hoàng hôn Bãi Trường đẳng cấp.", true, 8, true, 4, 2, "Grand Sunset Villa", 6200000m, 120, 3, "Sát biển" }
                });

            migrationBuilder.InsertData(
                table: "Bookings",
                columns: new[] { "Id", "Adults", "CheckIn", "CheckOut", "Children", "Code", "CreatedAt", "GuestEmail", "GuestName", "GuestPhone", "HotelId", "Note", "PricePerNight", "RoomTypeId", "Rooms", "Status", "TotalAmount", "UpdatedAt", "UserId" },
                values: new object[,]
                {
                    { 1, 2, new DateOnly(2026, 11, 5), new DateOnly(2026, 11, 8), 0, "AZS10001", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "demo@azurestay.vn", "Lê Hoàng Nam", "0903000004", 1, "Phòng tầng cao", 2650000m, 2, 1, "Completed", 7950000m, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 4 },
                    { 2, 2, new DateOnly(2026, 11, 7), new DateOnly(2026, 11, 9), 0, "AZS10002", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "khach2@azurestay.vn", "Phạm Thảo Vy", "0903000005", 2, null, 1450000m, 5, 1, "Completed", 2900000m, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 5 },
                    { 3, 2, new DateOnly(2026, 11, 10), new DateOnly(2026, 11, 12), 1, "AZS10003", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "demo@azurestay.vn", "Lê Hoàng Nam", "0903000004", 3, "Nhận phòng sau 15h", 2100000m, 8, 1, "Completed", 4200000m, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 4 },
                    { 4, 4, new DateOnly(2026, 11, 12), new DateOnly(2026, 11, 15), 0, "AZS10004", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "khach2@azurestay.vn", "Phạm Thảo Vy", "0903000005", 4, "Xuất hoá đơn công ty", 2800000m, 10, 2, "Completed", 16800000m, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 5 },
                    { 5, 2, new DateOnly(2026, 11, 16), new DateOnly(2026, 11, 19), 0, "AZS10005", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "demo@azurestay.vn", "Lê Hoàng Nam", "0903000004", 6, "Kỷ niệm ngày cưới", 2250000m, 17, 1, "Completed", 6750000m, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 4 },
                    { 6, 2, new DateOnly(2026, 11, 18), new DateOnly(2026, 11, 21), 1, "AZS10006", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "khach2@azurestay.vn", "Phạm Thảo Vy", "0903000005", 8, "Đón sân bay chuyến 14:00", 4800000m, 23, 1, "Completed", 14400000m, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 5 },
                    { 7, 2, new DateOnly(2026, 11, 20), new DateOnly(2026, 11, 22), 0, "AZS10007", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "demo@azurestay.vn", "Lê Hoàng Nam", "0903000004", 5, "Thay đổi lịch công tác", 1050000m, 14, 1, "Cancelled", 2100000m, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 4 },
                    { 8, 3, new DateOnly(2026, 11, 22), new DateOnly(2026, 11, 24), 1, "AZS10008", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "khach2@azurestay.vn", "Phạm Thảo Vy", "0903000005", 7, "Đổi điểm đến", 1890000m, 20, 2, "Cancelled", 7560000m, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 5 },
                    { 9, 2, new DateOnly(2026, 11, 25), new DateOnly(2026, 11, 28), 0, "AZS10009", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "demo@azurestay.vn", "Lê Hoàng Nam", "0903000004", 1, null, 1850000m, 1, 1, "CheckedIn", 5550000m, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 4 },
                    { 10, 2, new DateOnly(2026, 11, 25), new DateOnly(2026, 11, 27), 1, "AZS10010", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "khach2@azurestay.vn", "Phạm Thảo Vy", "0903000005", 4, "Thêm nôi trẻ em", 3600000m, 11, 1, "CheckedIn", 7200000m, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 5 },
                    { 11, 2, new DateOnly(2026, 11, 26), new DateOnly(2026, 11, 29), 0, "AZS10011", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "demo@azurestay.vn", "Lê Hoàng Nam", "0903000004", 7, null, 1890000m, 20, 1, "CheckedIn", 5670000m, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 4 },
                    { 12, 4, new DateOnly(2026, 12, 1), new DateOnly(2026, 12, 4), 1, "AZS10012", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "demo@azurestay.vn", "Lê Hoàng Nam", "0903000004", 1, "Hai phòng gần nhau", 2650000m, 2, 2, "Confirmed", 15900000m, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 4 },
                    { 13, 1, new DateOnly(2026, 12, 2), new DateOnly(2026, 12, 4), 0, "AZS10013", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "khach2@azurestay.vn", "Phạm Thảo Vy", "0903000005", 2, null, 980000m, 4, 1, "Confirmed", 1960000m, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 5 },
                    { 14, 2, new DateOnly(2026, 12, 5), new DateOnly(2026, 12, 7), 0, "AZS10014", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "demo@azurestay.vn", "Lê Hoàng Nam", "0903000004", 3, "Phòng yên tĩnh", 3200000m, 9, 1, "Confirmed", 6400000m, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 4 },
                    { 15, 4, new DateOnly(2026, 12, 6), new DateOnly(2026, 12, 9), 0, "AZS10015", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "khach2@azurestay.vn", "Phạm Thảo Vy", "0903000005", 6, null, 1600000m, 16, 2, "Confirmed", 9600000m, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 5 },
                    { 16, 2, new DateOnly(2026, 12, 10), new DateOnly(2026, 12, 13), 0, "AZS10016", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "demo@azurestay.vn", "Lê Hoàng Nam", "0903000004", 8, null, 2400000m, 22, 1, "Confirmed", 7200000m, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 4 },
                    { 17, 3, new DateOnly(2026, 12, 12), new DateOnly(2026, 12, 14), 1, "AZS10017", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "khach2@azurestay.vn", "Phạm Thảo Vy", "0903000005", 5, null, 1650000m, 15, 1, "Confirmed", 3300000m, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 5 },
                    { 18, 2, new DateOnly(2026, 12, 15), new DateOnly(2026, 12, 17), 0, "AZS10018", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "demo@azurestay.vn", "Lê Hoàng Nam", "0903000004", 4, "Chờ thanh toán", 6500000m, 12, 1, "Pending", 13000000m, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 4 },
                    { 19, 4, new DateOnly(2026, 12, 18), new DateOnly(2026, 12, 20), 1, "AZS10019", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "khach2@azurestay.vn", "Phạm Thảo Vy", "0903000005", 7, null, 2950000m, 21, 1, "Pending", 5900000m, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 5 },
                    { 20, 4, new DateOnly(2026, 12, 22), new DateOnly(2026, 12, 25), 2, "AZS10020", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "demo@azurestay.vn", "Lê Hoàng Nam", "0903000004", 1, "Kỳ nghỉ Giáng sinh", 4500000m, 3, 1, "Pending", 13500000m, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 4 }
                });

            migrationBuilder.InsertData(
                table: "RoomTypeImages",
                columns: new[] { "Id", "RoomTypeId", "SortOrder", "Url" },
                values: new object[,]
                {
                    { 1, 1, 0, "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1000&q=80" },
                    { 2, 2, 0, "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80" },
                    { 3, 3, 0, "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1000&q=80" },
                    { 4, 4, 0, "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1000&q=80" },
                    { 5, 5, 0, "https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&w=1000&q=80" },
                    { 6, 6, 0, "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80" },
                    { 7, 7, 0, "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1000&q=80" },
                    { 8, 8, 0, "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80" },
                    { 9, 9, 0, "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80" },
                    { 10, 10, 0, "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80" },
                    { 11, 11, 0, "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1000&q=80" },
                    { 12, 12, 0, "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80" },
                    { 13, 13, 0, "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80" },
                    { 14, 14, 0, "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1000&q=80" },
                    { 15, 15, 0, "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=1000&q=80" },
                    { 16, 16, 0, "https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f?auto=format&fit=crop&w=1000&q=80" },
                    { 17, 17, 0, "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80" },
                    { 18, 18, 0, "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1000&q=80" },
                    { 19, 19, 0, "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1000&q=80" },
                    { 20, 20, 0, "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=80" },
                    { 21, 21, 0, "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=1000&q=80" },
                    { 22, 22, 0, "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1000&q=80" },
                    { 23, 23, 0, "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1000&q=80" },
                    { 24, 24, 0, "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80" }
                });

            migrationBuilder.InsertData(
                table: "Payments",
                columns: new[] { "Id", "Amount", "BookingId", "PaidAt", "Provider", "RawResponse", "Status", "TxnRef" },
                values: new object[,]
                {
                    { 1, 7950000m, 1, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "VNPay", null, "Paid", "VNP20261101001" },
                    { 2, 2900000m, 2, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "VNPay", null, "Paid", "VNP20261101002" },
                    { 3, 4200000m, 3, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "VNPay", null, "Paid", "VNP20261101003" },
                    { 4, 16800000m, 4, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "VNPay", null, "Paid", "VNP20261101004" },
                    { 5, 6750000m, 5, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "VNPay", null, "Paid", "VNP20261101005" },
                    { 6, 14400000m, 6, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "VNPay", null, "Paid", "VNP20261101006" },
                    { 7, 7560000m, 8, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "VNPay", null, "Refunded", "VNP20261101008" },
                    { 8, 5550000m, 9, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "VNPay", null, "Paid", "VNP20261101009" },
                    { 9, 7200000m, 10, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "VNPay", null, "Paid", "VNP20261101010" },
                    { 10, 5670000m, 11, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "VNPay", null, "Paid", "VNP20261101011" },
                    { 11, 15900000m, 12, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "VNPay", null, "Paid", "VNP20261101012" },
                    { 12, 1960000m, 13, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "VNPay", null, "Paid", "VNP20261101013" },
                    { 13, 6400000m, 14, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "VNPay", null, "Paid", "VNP20261101014" },
                    { 14, 9600000m, 15, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "VNPay", null, "Paid", "VNP20261101015" },
                    { 15, 7200000m, 16, new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), "VNPay", null, "Paid", "VNP20261101016" }
                });

            migrationBuilder.InsertData(
                table: "Reviews",
                columns: new[] { "Id", "BookingId", "Comment", "CreatedAt", "HotelId", "Rating", "UserId" },
                values: new object[,]
                {
                    { 1, 1, "Hồ bơi vô cực rất đẹp, nhân viên nhiệt tình và bữa sáng phong phú.", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 1, 5, 4 },
                    { 2, 2, "Vị trí ngay trung tâm sông Hàn, đi bộ ra cầu Rồng rất tiện.", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 2, 4, 5 },
                    { 3, 3, "Phòng sạch sẽ, yên tĩnh dù nằm giữa phố cổ Hà Nội.", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 3, 5, 4 },
                    { 4, 4, "View sông Sài Gòn xuất sắc, phù hợp tiếp khách và công tác.", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 4, 5, 5 },
                    { 5, 5, "Không khí Đà Lạt trong lành, bồn tắm gỗ ngâm thảo mộc cực thích.", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 6, 5, 4 },
                    { 6, 6, "Biệt thự sát biển ngắm hoàng hôn tuyệt vời, xe đưa đón đúng giờ.", new DateTime(2026, 11, 1, 8, 0, 0, 0, DateTimeKind.Utc), 8, 5, 5 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_CheckIn",
                table: "Bookings",
                column: "CheckIn");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_Code",
                table: "Bookings",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_HotelId",
                table: "Bookings",
                column: "HotelId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_RoomTypeId",
                table: "Bookings",
                column: "RoomTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_UserId",
                table: "Bookings",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_HotelImages_HotelId",
                table: "HotelImages",
                column: "HotelId");

            migrationBuilder.CreateIndex(
                name: "IX_Hotels_City",
                table: "Hotels",
                column: "City");

            migrationBuilder.CreateIndex(
                name: "IX_Hotels_OwnerId",
                table: "Hotels",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Hotels_Slug",
                table: "Hotels",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_BookingId",
                table: "Payments",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_TxnRef",
                table: "Payments",
                column: "TxnRef",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_Token",
                table: "RefreshTokens",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId",
                table: "RefreshTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_BookingId",
                table: "Reviews",
                column: "BookingId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_HotelId",
                table: "Reviews",
                column: "HotelId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_UserId",
                table: "Reviews",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomTypeImages_RoomTypeId",
                table: "RoomTypeImages",
                column: "RoomTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomTypes_HotelId",
                table: "RoomTypes",
                column: "HotelId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HotelImages");

            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "Reviews");

            migrationBuilder.DropTable(
                name: "RoomTypeImages");

            migrationBuilder.DropTable(
                name: "Bookings");

            migrationBuilder.DropTable(
                name: "RoomTypes");

            migrationBuilder.DropTable(
                name: "Hotels");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
