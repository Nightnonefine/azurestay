# Phase 1B — Khách sạn, loại phòng, tồn kho theo ngày, đặt phòng

Phase 1A đã xong: schema 9 bảng, migration `InitialCreate`, seed, JWT auth, `/api/health`, `api/tests/smoke_test.py`
(17/17 PASS). Phase này chỉ làm phần **đọc công khai + đặt phòng**, vẫn **không** làm frontend, không thanh toán,
không endpoint owner/admin.

Đọc `docs/SPEC.md` mục 3 (nghiệp vụ tồn kho) và mục 4 (API) trước khi code.

## Việc phải làm

### 1. DTO (Models/Dtos)
- `HotelDtos.cs`: `HotelListItemDto` (id, name, slug, city, district, starRating, priceFrom, ratingAverage, reviewCount, coverImage, amenities), `HotelDetailDto` (+ description, address, images, roomTypes), `RoomTypeDto` (id, name, bedType, viewType, hasBathtub, maxAdults, maxChildren, sizeM2, pricePerNight, totalRooms, amenities, images, available?).
- `BookingDtos.cs`: `CreateBookingRequest`, `BookingDto` (kèm hotelName, roomTypeName, nights, totalAmount, status...), `CancelBookingRequest` (lý do, tuỳ chọn).
- `CommonDtos.cs`: `PagedResult<T>` → `{ total, page, pageSize, items }`.
- Không trả entity có navigation property.

### 2. `Services/AvailabilityService.cs`
- `Task<int> CountAvailableAsync(int roomTypeId, DateOnly from, DateOnly to, int? ignoreBookingId = null)` theo đúng công thức SPEC mục 3: đếm booking `Pending` (chưa quá 30 phút) / `Confirmed` / `CheckedIn` chồng lấn khoảng ngày, trừ khỏi `TotalRooms`.
- `Task<List<HotelListItemDto>>` không thuộc service này — chỉ tính tồn kho.
- Trả thêm hàm dựng lưới tồn kho theo từng ngày cho một khách sạn (dùng cho `/availability`).

### 3. `Controllers/MetaController.cs`
- `GET /api/meta/cities` → danh sách thành phố có khách sạn `Active` (kèm số lượng).
- `GET /api/meta/amenities` → danh sách tiện ích chuẩn hoá (mã + nhãn tiếng Việt).

### 4. `Controllers/HotelsController.cs`
- `GET /api/hotels?city&q&minPrice&maxPrice&stars&amenities&checkIn&checkOut&guests&sort&page&pageSize`
  - chỉ khách sạn `Status = Active`; `pageSize` chặn 1..50;
  - `q` tìm trong Name/City/District/Address (không phân biệt hoa thường, dùng `EF.Functions.Like` hoặc `Contains`);
  - `amenities` nhận CSV, khách sạn phải có **đủ** các tiện ích đó;
  - `stars` nhận CSV (ví dụ `4,5`);
  - `priceFrom` của khách sạn = giá thấp nhất trong các `RoomType.IsActive`;
  - khi có `checkIn` + `checkOut` + `guests`: chỉ trả khách sạn còn ít nhất một loại phòng đủ sức chứa `guests` và `available > 0` trong khoảng ngày (dùng `AvailabilityService`); `guests` mặc định 1;
  - `sort`: `price-asc | price-desc | rating | popular` (mặc định `popular` = `Featured` trước, rồi `StarRating` giảm dần);
  - trả `PagedResult<HotelListItemDto>`.
- `GET /api/hotels/{slug}` → `HotelDetailDto` kèm danh sách loại phòng đang `IsActive`; 404 nếu không có hoặc không `Active`.
- `GET /api/hotels/{slug}/availability?from&to` → mảng theo ngày `[{ date, roomTypes: [{ id, name, total, booked, available }] }]`; chặn khoảng > 60 ngày (400).
- `GET /api/hotels/{slug}/reviews?page&pageSize` → `PagedResult` (id, guestName che một phần, rating, comment, createdAt), mới nhất trước.

### 5. `Services/BookingService.cs` + `Controllers/BookingsController.cs`
- `POST /api/bookings` `[Authorize(Roles = "Customer")]`: áp đủ 5 quy tắc ở SPEC mục 3, sinh `Code` 8 ký tự A–Z0–9 duy nhất
  (retry nếu trùng), chụp `PricePerNight`, tính `TotalAmount`, `Status = Pending`, kiểm tra lại tồn kho **ngay trước khi lưu**.
  Trả 201 kèm `BookingDto`.
- `GET /api/bookings/my?status&page&pageSize` `[Authorize]`: chỉ đơn của chính mình, mới nhất trước.
- `GET /api/bookings/{code}` `[Authorize]`: chủ đơn hoặc `Admin`; người khác nhận 404 (không phải 403 — không lộ là mã đơn tồn tại).
- `POST /api/bookings/{id}/cancel` `[Authorize]`: chỉ chủ đơn, chỉ khi `Pending`/`Confirmed`; ghi `Note` lý do; đơn `CheckedIn/Completed/Cancelled` trả 400 với thông báo tiếng Việt rõ ràng.
- Mọi chuyển trạng thái đi qua `BookingService`, controller không tự gán `Status`.
- Service phải kiểm tra: ngày nhận ≥ hôm nay, `CheckOut > CheckIn`, ≤ 30 đêm, `Rooms ≥ 1`,
  `(Adults + Children) ≤ (MaxAdults + MaxChildren) × Rooms`, loại phòng `IsActive`, khách sạn `Active`.

### 6. Test
Mở rộng `api/tests/smoke_test.py` (giữ nguyên 17 case cũ, thêm nhóm 1B):
- tìm khách sạn không lọc → có items, total > 0;
- lọc theo `city` và theo `checkIn/checkOut/guests` → trả về ít hơn hoặc bằng, mọi item có `priceFrom > 0`;
- `GET /hotels/{slug}` trả `roomTypes` không rỗng; slug sai → 404;
- availability của một loại phòng: `available = total - booked` và số học khớp với dữ liệu seed;
- đặt phòng hợp lệ → 201, đọc lại `GET /bookings/{code}` bằng chính token đó → 200;
- đặt quá số phòng còn trống → 400;
- `checkOut` ≤ `checkIn` → 400; ngày trong quá khứ → 400;
- POST /bookings khi chưa có token → 401;
- user B đọc đơn của user A → 404;
- huỷ đơn `Pending` → 200 và `GET` lại thấy `Cancelled`; huỷ lần 2 → 400;
- sau khi huỷ, `available` của khoảng ngày đó tăng lại đúng số phòng.

## Ràng buộc
- Không sửa `Models/` hiện có ngoài việc thêm DTO; nếu buộc phải thêm cột thì phải tạo migration mới (không sửa migration cũ).
- Không đụng frontend (`src/`), không làm Payments, không làm `/owner/*`, `/admin/*`, upload.
- Không đụng repo `hotel-booking`, không đụng DB khác ngoài `AzureStayDb`.
- Thông báo lỗi và comment bằng tiếng Việt; tiền `decimal`, ngày `DateOnly`, API nhận/trả `yyyy-MM-dd`.
- Mọi list trả `{ total, page, pageSize, items }`.

## Xong khi
- `dotnet build` 0 warning, `python api/tests/smoke_test.py` in toàn PASS (dán output thật).
- Tự kiểm tra bằng `curl`/Swagger ít nhất 3 case ở trên và dán kết quả.
- Báo cáo: file tạo/sửa, lệnh đã chạy, output test, chỗ lệch SPEC kèm lý do.
