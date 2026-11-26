# Phase 1C — Owner + Admin API, upload ảnh, thống kê

Đã xong 1A (schema + JWT + seed) và 1B (tìm kiếm khách sạn, loại phòng, tồn kho theo ngày, đặt phòng).
`api/tests/smoke_test.py` hiện có 38 case PASS. Phase này làm phần **quản trị**: chủ khách sạn, admin, upload ảnh, thống kê.
Vẫn **không** làm frontend, không làm VNPay.

Đọc `docs/SPEC.md` mục 4 (Owner, Admin, Uploads) trước khi code.

## Việc phải làm

### 1. DTO (Models/Dtos)
- `OwnerDtos.cs`: `OwnerHotelDto`, `HotelUpsertRequest` (name, city, district, address, description, starRating, amenities CSV), `RoomTypeUpsertRequest`, `RoomTypeOwnerDto`, `OwnerBookingDto`, `OwnerBookingStatusRequest` (status, note?), `OwnerStatsDto`, `AddImageRequest` (url, sortOrder), `CalendarDayDto`.
- `AdminDtos.cs`: `AdminUserDto`, `AdminUserUpdateRequest` (fullName, phone, status), `AdminRoleRequest` (role), `AdminHotelDto`, `AdminHotelStatusRequest` (status, note?), `AdminStatsDto`.
- `UploadDtos.cs` (hoặc để trong CommonDtos): `UploadResultDto` (url, size, contentType).

### 2. `Controllers/Owner/` — tất cả `[Authorize(Roles = "Owner")]`
Quy tắc chung: mọi truy vấn lọc theo `Hotel.OwnerId == user hiện tại`; bản ghi không thuộc mình trả **404** (không lộ là có tồn tại).

- `OwnerHotelsController` (`/api/owner/hotels`)
  - `GET` danh sách khách sạn của mình + số loại phòng + trạng thái, phân trang & lọc `status`, `q`, sort theo name/createdAt.
  - `POST` tạo mới: `Status = Pending`, sinh `Slug` duy nhất (dùng `SlugService`), `Featured = false`.
  - `PUT /{id}`: sửa thông tin; **không** cho đổi `Status`, `Featured`, `OwnerId` (bỏ qua nếu client gửi lên).
  - `POST /{id}/images` thêm ảnh (url phải bắt đầu bằng `/uploads/` hoặc `http`), `DELETE /{id}/images/{imageId}`.
- `OwnerRoomTypesController`
  - `GET /api/owner/hotels/{hotelId}/room-types` (kèm `bookedToday` và `available` cho hôm nay).
  - `POST /api/owner/hotels/{hotelId}/room-types`, `PUT /api/owner/room-types/{id}`.
  - `DELETE /api/owner/room-types/{id}`: nếu đã có booking không huỷ → `IsActive = false` (xoá mềm) và trả 200 kèm thông báo; nếu chưa có booking → xoá hẳn.
  - Ảnh loại phòng: `POST /api/owner/room-types/{id}/images`, `DELETE .../images/{imageId}`.
- `OwnerBookingsController`
  - `GET /api/owner/bookings?hotelId&status&from&to&page&pageSize&sort`: chỉ đơn thuộc khách sạn của mình; lọc theo khoảng ngày **giao nhau** với `CheckIn/CheckOut`.
  - `PUT /api/owner/bookings/{id}/status`: chỉ cho các chuyển trạng thái hợp lệ của SPEC mục 3
    (`Pending→Confirmed|Cancelled`, `Confirmed→CheckedIn|Cancelled`, `CheckedIn→Completed`); sai → 400 tiếng Việt.
- `OwnerStatsController`
  - `GET /api/owner/stats?from&to&hotelId`: doanh thu (đơn `Confirmed/CheckedIn/Completed`), số đơn theo trạng thái,
    số đêm bán, công suất từng loại phòng (`đêm bán / (TotalRooms × số đêm)`), top 5 loại phòng theo doanh thu.
  - `GET /api/owner/hotels/{id}/calendar?from&to`: lưới tồn kho theo ngày của mọi loại phòng (dùng `AvailabilityService`), chặn khoảng > 60 ngày.

### 3. `Controllers/Admin/` — tất cả `[Authorize(Roles = "Admin")]`
- `AdminUsersController` (`/api/admin/users`)
  - `GET ?q&role&status&page&pageSize&sort`: tìm theo email/fullName.
  - `PUT /{id}`: sửa `FullName`, `Phone`, `Status` (`Active|Locked`).
  - `PUT /{id}/role`: đổi role; **không** cho tự hạ quyền chính mình (400); role ngoài 3 giá trị → 400.
  - Không bao giờ trả `PasswordHash`.
- `AdminHotelsController` (`/api/admin/hotels`)
  - `GET ?status&city&q&page&pageSize`: mọi khách sạn kèm owner email.
  - `PUT /{id}/status`: `Active | Suspended | Rejected` (duyệt / tạm ngưng / từ chối), ghi `UpdatedAt`.
  - `PUT /{id}/featured`: bật/tắt `Featured` (gói Premium).
- `AdminStatsController`
  - `GET /api/admin/stats`: số user theo role/status, số khách sạn theo status, tổng doanh thu đã thanh toán, tổng đơn theo trạng thái, top 5 khách sạn theo doanh thu.

### 4. `Controllers/UploadsController.cs`
- `POST /api/uploads` `[Authorize(Roles = "Owner,Admin")]`, multipart 1 file field `file`.
- Chỉ nhận `image/jpeg`, `image/png`, `image/webp`; ≤ 5 MB; kiểm tra cả content-type lẫn phần mở rộng.
- Lưu `wwwroot/uploads/yyyy/MM/<guid>.<ext>`, trả `{ url: "/uploads/yyyy/MM/xxx.jpg", size, contentType }`.
- Bật `app.UseStaticFiles()` trong `Program.cs` để URL mở được.
- File sai loại/quá lớn → 400 kèm thông báo tiếng Việt; không ghi file rác.

### 5. `Services/SlugService.cs`
- Sinh slug từ tên khách sạn (bỏ dấu tiếng Việt, chữ thường, gạch nối), thêm hậu tố `-2`, `-3`… nếu trùng.

### 6. Test — mở rộng `api/tests/smoke_test.py`
Giữ nguyên 38 case cũ, thêm:
- Customer gọi `/api/owner/hotels` → 403; Owner gọi `/api/admin/users` → 403; không token → 401.
- Owner A tạo khách sạn → 201, `status = Pending`; Owner B `PUT` khách sạn đó → 404; Owner B `GET` danh sách không thấy nó.
- Owner A gửi `status: "Active"` trong body `PUT` → trạng thái **vẫn** `Pending`.
- Admin duyệt (`PUT /admin/hotels/{id}/status` `Active`) → khách sạn xuất hiện trong `GET /api/hotels` công khai.
- Admin tạm ngưng → khách sạn biến mất khỏi danh sách công khai; `GET /api/hotels/{slug}` → 404.
- Admin tự hạ quyền mình → 400.
- Admin khoá một customer → user đó login → 403; mở lại → login 200.
- Owner đổi trạng thái đơn `Pending → CheckedIn` → 400; `Pending → Confirmed` → 200.
- Upload: file `.txt` → 400; file `.png` thật (tạo bằng PIL hoặc bytes PNG tối thiểu) → 201 và `GET` URL trả 200.
- `GET /api/owner/stats` và `/api/admin/stats` trả 200 với các trường số không âm.

## Ràng buộc
- Không sửa migration cũ; chỉ thêm migration nếu thật sự cần cột mới.
- Không đụng `src/`, không làm Payments/VNPay, không đụng repo `hotel-booking`, không đụng DB khác ngoài `AzureStayDb`.
- Mọi truy vấn owner phải có điều kiện chủ sở hữu ở **câu query**, không lọc sau khi lấy dữ liệu.
- Thông báo lỗi và comment tiếng Việt; mọi list trả `{ total, page, pageSize, items }`.

## Xong khi
- `dotnet build` 0 warning; `python api/tests/smoke_test.py` toàn PASS (dán output thật).
- Dán thêm kết quả 3 lời gọi curl: owner tạo khách sạn, admin duyệt, upload ảnh.
- Báo cáo: file tạo/sửa, lệnh đã chạy, output test, chỗ lệch SPEC kèm lý do.
