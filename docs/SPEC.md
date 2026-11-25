# AzureStay — đặc tả bản website booking khách sạn dùng thật

Tài liệu này là **nguồn sự thật duy nhất** cho mọi phiên code (kể cả khi giao cho agent khác).
Không tự ý đổi schema / route / tên trạng thái nếu không sửa file này trước.

- Đồ án: Lập trình Web — PTIT HCM, đề tài số 2 (website booking khách sạn).
- Repo: `github.com/Nightnonefine/azurestay` (bản thật). Repo `hotel-booking` giữ nguyên cho bài weekly.
- Stack: React 19 + Vite + react-router 7 + CSS thuần (có file `.css`) / ASP.NET Core 8 Web API + EF Core 8 + SQL Server.
- Ngôn ngữ giao diện: tiếng Việt. Múi giờ nghiệp vụ: Asia/Ho_Chi_Minh; mọi `CreatedAt` lưu UTC.

## 1. Ba vai trò

| Vai trò | Ai | Làm được gì |
|---|---|---|
| `Customer` | khách du lịch | tìm kiếm, xem khách sạn, đặt phòng, thanh toán, huỷ đơn của mình, sửa profile |
| `Owner` | chủ khách sạn | quản lý khách sạn / loại phòng / ảnh / lịch trống / đơn đặt phòng / thống kê **của mình** |
| `Admin` | quản trị | duyệt hoặc tạm ngưng khách sạn, quản lý user (sửa, khoá, đổi role), xem thống kê toàn hệ thống |

Không có màn hình đăng ký Owner công khai: user đăng ký mặc định `Customer`; Admin nâng role
(`PUT /api/admin/users/{id}/role`) khi khách sạn của họ được duyệt. Như vậy role luôn do Admin kiểm soát.

Quy tắc quyền (kiểm tra ở **server**, không phải chỉ ẩn nút ở client):
- Owner chỉ đọc/sửa được bản ghi có `Hotel.OwnerId == user.Id`.
- Customer chỉ xem/huỷ được booking có `Booking.UserId == user.Id`.
- Endpoint trong `/api/admin/*` yêu cầu role `Admin`.

## 2. Mô hình dữ liệu

Tất cả bảng dùng `Id int identity`. Tiền: `decimal(18,2)` (VND, không phần lẻ), khai báo `HasPrecision(18,2)`.

### Users
`Id, Email (unique, đã Trim+lower), PasswordHash, FullName, Phone, Role (Customer|Owner|Admin), Status (Active|Locked), CreatedAt`

### RefreshTokens
`Id, UserId FK, Token (unique, 64 byte base64), ExpiresAt, RevokedAt?, CreatedAt`
- Access token: JWT HS256, 60 phút, claim `sub`, `email`, `role`.
- Refresh token: 7 ngày, xoay vòng mỗi lần refresh (token cũ bị revoke).

### Hotels
`Id, OwnerId FK Users, Name, Slug (unique, sinh từ Name + id nếu trùng), City, District, Address, Description, StarRating (1–5), Amenities (chuỗi CSV đã chuẩn hoá, ví dụ "wifi,pool,parking"), Status (Pending|Active|Suspended|Rejected), Featured bool (gói Premium), CreatedAt, UpdatedAt`

### HotelImages
`Id, HotelId FK, Url, SortOrder` — ảnh chính là ảnh có `SortOrder = 0`.

### RoomTypes
`Id, HotelId FK, Name, BedType, ViewType, HasBathtub bool, MaxAdults, MaxChildren, SizeM2, PricePerNight, TotalRooms, Description, Amenities (CSV), IsActive bool`

### RoomTypeImages
`Id, RoomTypeId FK, Url, SortOrder`

### Bookings
`Id, Code (unique, 8 ký tự A–Z0–9), UserId FK, HotelId FK, RoomTypeId FK, GuestName, GuestPhone, GuestEmail,
CheckIn date, CheckOut date, Rooms, Adults, Children, PricePerNight (chụp lại lúc đặt), TotalAmount,
Status (Pending|Confirmed|CheckedIn|Completed|Cancelled), Note, CreatedAt, UpdatedAt`

### Payments
`Id, BookingId FK, Provider ("VNPay"), Amount, TxnRef (unique), Status (Pending|Paid|Failed|Refunded), PaidAt?, RawResponse (nvarchar max)`

### Reviews
`Id, BookingId FK unique, HotelId FK, UserId FK, Rating 1–5, Comment, CreatedAt`
- Chỉ được review khi booking `Completed`.

Quan hệ xoá: `Hotel → RoomType/Booking` là `Restrict` (không xoá khách sạn còn dữ liệu); `Booking → Payment/Review` là `Cascade`.

## 3. Nghiệp vụ tồn kho (phần quan trọng nhất)

Không lưu "phòng trống theo ngày" thành bảng — **tính từ booking**:

```
available(roomTypeId, from, to) =
    TotalRooms
  − Σ bookings.Rooms  với  Status in (Pending, Confirmed, CheckedIn)
                        and CheckIn < to and CheckOut > from
```

Quy tắc đặt phòng (kiểm tra ở server, trả 400 với `message` tiếng Việt):
1. `CheckIn >= today`, `CheckOut > CheckIn`, số đêm ≤ 30.
2. `Rooms >= 1`, `Adults + Children <= RoomType.MaxAdults + MaxChildren` (theo số phòng).
3. `available(roomType, CheckIn, CheckOut) >= Rooms` tại thời điểm đặt.
4. `TotalAmount = số đêm × Rooms × RoomType.PricePerNight` (giá chụp lại vào booking).
5. Đơn tạo ra ở trạng thái `Pending`; hết 30 phút chưa thanh toán thì coi như hết hạn (khi tính tồn kho, đơn
   `Pending` quá 30 phút bị loại; Admin thấy nhãn "quá hạn").

Vòng đời trạng thái:
```
Pending --(thanh toán VNPay OK)--> Confirmed --(owner: khách đến)--> CheckedIn --(owner: trả phòng)--> Completed
Pending --(khách huỷ)--> Cancelled        Confirmed --(khách/owner huỷ)--> Cancelled
```
Chỉ `Pending` và `Confirmed` mới huỷ được; `CheckedIn/Completed` thì không.

## 4. API (base `/api`)

Hình dạng lỗi thống nhất: `{ "message": "..." }` (+ `errors: []` khi validate nhiều field).
Danh sách phân trang trả `{ total, page, pageSize, items }`.

### Auth
| Method | Route | Quyền | Ghi chú |
|---|---|---|---|
| POST | `/auth/register` | ẩn danh | email + password + fullName; trả user (không trả token) |
| POST | `/auth/login` | ẩn danh | trả `{ accessToken, user }` + set refresh cookie httpOnly |
| POST | `/auth/refresh` | cookie | xoay token, trả accessToken mới |
| POST | `/auth/logout` | đăng nhập | revoke refresh token, xoá cookie |
| GET | `/auth/me` | đăng nhập | thông tin user hiện tại |
| PUT | `/auth/me` | đăng nhập | sửa FullName, Phone |
| POST | `/auth/change-password` | đăng nhập | mật khẩu cũ + mới (≥ 8 ký tự) |

### Công khai
| Method | Route | Ghi chú |
|---|---|---|
| GET | `/hotels` | lọc `city, q, minPrice, maxPrice, stars, amenities, checkIn, checkOut, guests, sort, page, pageSize`; chỉ trả `Status=Active`; nếu có `checkIn/checkOut/guests` thì chỉ trả khách sạn còn loại phòng trống |
| GET | `/hotels/{slug}` | chi tiết + danh sách loại phòng (kèm giá, ảnh, tiện ích) + điểm review trung bình + số review |
| GET | `/hotels/{slug}/availability?from&to` | mảng theo từng ngày: `[{ date, roomTypes: [{ id, name, total, booked, available }] }]` |
| GET | `/hotels/{slug}/reviews` | phân trang |
| GET | `/meta/cities` `/meta/amenities` | dữ liệu cho bộ lọc |

`sort`: `price-asc | price-desc | rating | popular` (mặc định `popular` = Featured trước, rồi rating).

### Khách đã đăng nhập
| Method | Route | Ghi chú |
|---|---|---|
| POST | `/bookings` | body: roomTypeId, checkIn, checkOut, rooms, adults, children, guestName, guestPhone, guestEmail, note |
| GET | `/bookings/my` | phân trang + lọc `status` |
| GET | `/bookings/{code}` | chỉ chủ đơn hoặc Admin |
| POST | `/bookings/{id}/cancel` | chỉ `Pending/Confirmed` |

### Thanh toán VNPay (sandbox)
| Method | Route | Ghi chú |
|---|---|---|
| POST | `/payments/vnpay/create-url` | body `{ bookingId }` → `{ paymentUrl }`; tạo `Payments` Pending với `TxnRef` riêng |
| GET | `/payments/vnpay/return` | trình duyệt quay về; verify `vnp_SecureHash` rồi redirect về `/account/bookings/{code}?payment=success|failed` |
| GET | `/payments/vnpay/ipn` | webhook server-to-server; idempotent theo `TxnRef`; Paid → booking `Confirmed` |
- Khoá: `Vnpay:TMNCode`, `Vnpay:HashSecret`, `Vnpay:BaseUrl` trong `appsettings`/biến môi trường. Không hardcode.
- Không cấu hình khoá thì endpoint trả 503 "Cổng thanh toán chưa cấu hình" (để dev vẫn chạy được).

### Owner (`/owner/*`, yêu cầu role Owner)
| Method | Route | Ghi chú |
|---|---|---|
| GET | `/owner/hotels` | danh sách khách sạn của mình (mọi status) |
| POST | `/owner/hotels` | tạo mới → `Status=Pending` chờ Admin duyệt |
| PUT | `/owner/hotels/{id}` | sửa thông tin, không tự đổi `Status` |
| POST | `/owner/hotels/{id}/images` | gắn URL ảnh đã upload + SortOrder |
| DELETE | `/owner/hotels/{id}/images/{imageId}` | |
| GET/POST | `/owner/hotels/{id}/room-types` | danh sách + tạo loại phòng |
| PUT/DELETE | `/owner/room-types/{id}` | sửa/xoá (xoá mềm: `IsActive=false` nếu đã có booking) |
| GET | `/owner/hotels/{id}/calendar?from&to` | lịch trống theo ngày của mọi loại phòng |
| GET | `/owner/bookings` | lọc `hotelId, status, from, to`, phân trang |
| PUT | `/owner/bookings/{id}/status` | chỉ các chuyển trạng thái hợp lệ ở mục 3 |
| GET | `/owner/stats?from&to` | doanh thu, số đơn, công suất theo loại phòng |

### Admin (`/admin/*`, yêu cầu role Admin)
| Method | Route | Ghi chú |
|---|---|---|
| GET | `/admin/users` | lọc `q, role, status`, phân trang |
| PUT | `/admin/users/{id}` | sửa FullName/Phone; khoá/mở (`Status`) |
| PUT | `/admin/users/{id}/role` | đổi role (không tự hạ quyền chính mình) |
| GET | `/admin/hotels` | mọi khách sạn, lọc `status, city` |
| PUT | `/admin/hotels/{id}/status` | `Active / Suspended / Rejected` (duyệt hoặc tạm ngưng) |
| GET | `/admin/stats` | số user, số khách sạn theo status, doanh thu Paid, top khách sạn |
| POST | `/uploads` | multipart 1 ảnh ≤ 5 MB (jpg/png/webp) → `{ url }`; lưu `wwwroot/uploads/yyyy/MM/` |

Mọi danh sách đều phải có phân trang + tìm kiếm + sắp xếp + lọc — đây là yêu cầu cứng của đề.

## 5. Màn hình (React)

Công khai: `/` (trang chủ), `/hotels` (tìm kiếm + lọc + sort + phân trang, đồng bộ điều kiện lên URL),
`/hotels/:slug` (chi tiết + chọn ngày + chọn loại phòng + tồn kho theo ngày), `/hotels/:slug/book` (form đặt phòng),
`/login`, `/register`, `/about-us`, `/contact`.

Khách: `/account` (profile + đổi mật khẩu), `/account/bookings` (danh sách, lọc trạng thái),
`/account/bookings/:code` (chi tiết + nút thanh toán/huỷ + kết quả thanh toán).

Owner: `/owner` (dashboard), `/owner/hotels` (danh sách + trạng thái duyệt), `/owner/hotels/new`,
`/owner/hotels/:id` (thông tin + ảnh + loại phòng), `/owner/hotels/:id/calendar`, `/owner/bookings`, `/owner/stats`.

Admin: `/admin` (dashboard), `/admin/users`, `/admin/hotels`, `/admin/stats`.

Chặn route bằng `RequireAuth` + `RequireRole` ở client; **server vẫn là nơi quyết định**.

## 6. Quy ước code (bắt buộc, để giải trình được với thầy)

- Backend: Controller (không Minimal API), mỗi resource một controller; DTO trong `Models/Dtos/`; **không trả entity thẳng ra ngoài** ở các endpoint có quan hệ; business rule đặt trong service hoặc controller có comment giải thích.
- Frontend: mỗi trang một file trong `src/pages/`; gọi API chỉ qua `src/services/api.js`; state server bằng hook riêng `src/hooks/useList.js` (loading/error/data + phân trang), không dùng thư viện state ngoài.
- CSS: biến màu ở `src/index.css`, mỗi nhóm trang một file trong `src/styles/`. Không Tailwind (đề yêu cầu file CSS).
- Comment tiếng Việt ở các chỗ có nghiệp vụ (tính tồn kho, chuyển trạng thái, kiểm quyền, hash mật khẩu).
- Validate: `DataAnnotations` + kiểm tra nghiệp vụ tay; mọi input từ client coi là không tin cậy.
- Mật khẩu: PBKDF2-SHA256 100k vòng, salt riêng, so sánh `FixedTimeEquals` (giữ nguyên từ bản cũ).
- Ngày gửi/nhận qua API: `yyyy-MM-dd`. Tiền: số nguyên VND ở API, format `vi-VN` ở UI.

## 7. Seed dữ liệu (để trang trông thật)

8 khách sạn ở 5 thành phố (Đà Nẵng, Hà Nội, TP.HCM, Đà Lạt, Nha Trang, Phú Quốc), mỗi khách sạn 2–4 loại phòng,
ảnh lấy từ URL công khai (Unsplash) trong seed; 5 user: 1 admin, 2 owner, 2 customer; ~20 booking rải ngày
(đủ trạng thái) để lịch trống và thống kê có số. Tài khoản demo: `admin@azurestay.vn / Admin@12345`,
`owner@azurestay.vn / Owner@12345`, `demo@azurestay.vn / Demo@12345`.

## 8. Triển khai

- `docker compose up` phải chạy được 3 service: `db` (mssql 2022), `api`, `web` (nginx phục vụ build tĩnh + proxy `/api`).
- Cấu hình qua `.env` (chuỗi kết nối, JWT key, VNPay). Không commit `.env`.
- Ảnh upload nằm trong volume, không mất khi recreate container.
- Healthcheck: `GET /api/health` trả `{ status: "ok", db: true }`.

## 9. Định nghĩa "xong" cho mỗi phase

1. `dotnet build` + `npm run build` sạch, `dotnet ef database update` chạy từ DB trống.
2. `api/tests/smoke_test.py` phủ happy path **và** các lỗi nghiệp vụ (quá số phòng, sai ngày, sai quyền, huỷ đơn
   Completed) — chạy lại phải xanh.
3. Đọc lại dữ liệu bằng `sqlcmd` sau mỗi thao tác ghi để chứng minh đã vào DB.
4. Không có endpoint nào trả entity kèm navigation property gây vòng lặp JSON.
