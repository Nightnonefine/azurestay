# AzureStay — website booking khách sạn

Đồ án Lập trình Web (PTIT HCM, đề tài số 2) — bản **website dùng thật**, không phải demo.

- Frontend: React 19 + Vite + react-router (CSS thuần) — giao diện khách, chủ khách sạn và quản trị
- Backend: ASP.NET Core 8 Web API + EF Core 8 + SQL Server
- Ba vai trò: Khách (`Customer`) — Chủ khách sạn (`Owner`) — Quản trị (`Admin`)
- Đặc tả đầy đủ: [docs/SPEC.md](docs/SPEC.md) — đọc trước khi sửa bất cứ thứ gì.

## Cấu trúc

```
api/AzureStay.sln            solution
api/AzureStay.Api/           project API (Controllers, Data, Models, Security, Migrations)
api/tests/smoke_test.py      test API bằng HTTP
docs/SPEC.md                 đặc tả nghiệp vụ
docs/prompts/                prompt giao việc từng phase
```

## Chạy ở máy dev

```powershell
# lần đầu
cd api\AzureStay.Api
dotnet tool restore
dotnet ef database update      # tạo AzureStayDb + seed dữ liệu

# chạy API
cd api\AzureStay.Api
dotnet run                     # http://localhost:5080/swagger
```

Chạy giao diện web (cửa sổ khác, ở thư mục gốc repo):

```powershell
npm install
npm run dev -- --port 3000   # http://localhost:3000
```

Test API khi server đang chạy:

```powershell
python api\tests\smoke_test.py
```

Tài khoản seed: `admin@azurestay.vn / Admin@12345`, `owner@azurestay.vn / Owner@12345`,
`demo@azurestay.vn / Demo@12345`.

Biến môi trường cần khi deploy: `ConnectionStrings__Default`, `Jwt__Key`, `Vnpay__TMNCode`, `Vnpay__HashSecret`.
`Jwt:Key` trong `appsettings.json` chỉ là khoá dev — **phải đổi khi deploy**.

## API hiện có

| Nhóm | Endpoint |
|---|---|
| Auth | `POST /api/auth/register\|login\|refresh\|logout\|change-password`, `GET/PUT /api/auth/me` |
| Meta | `GET /api/meta/cities`, `GET /api/meta/amenities` |
| Khách sạn | `GET /api/hotels?city&q&minPrice&maxPrice&stars&amenities&checkIn&checkOut&guests&sort&page&pageSize`, `GET /api/hotels/{slug}`, `GET /api/hotels/{slug}/availability?from&to`, `GET /api/hotels/{slug}/reviews` |
| Đặt phòng | `POST /api/bookings`, `GET /api/bookings/my`, `GET /api/bookings/{code}`, `POST /api/bookings/{id}/cancel` |
| Hạ tầng | `GET /api/health` |

## Tiến độ

| Phase | Nội dung | Trạng thái |
|---|---|---|
| 1A | Schema + JWT auth + seed | XONG — 17/17 smoke test PASS |
| 1B | Hotels / RoomTypes / availability / bookings | XONG — 38/38 smoke test + 24/24 kiểm tra độc lập PASS |
| 1C | Owner + Admin API, upload, thống kê | XONG — 64/64 smoke test + 38/38 kiểm tra độc lập PASS |
| 2A | Frontend công khai + tài khoản khách | XONG — build + lint sạch, kiểm tra bằng ảnh chụp headless |
| 2B | Frontend owner + admin | XONG — build + lint sạch, 8 màn hình chụp headless có đăng nhập |
| 3a | Docker (compose: SQL Server + API + nginx) | XONG — stack chạy, `/api/health` → ok, 8 khách sạn seed |
| 3b | VNPay sandbox + hosting công khai | chờ khoá VNPay + chốt máy chủ |

## Ghi chú kỹ thuật đã chốt

- JWT HS256 60 phút (claim `sub`, `email`, `role`), refresh token 64 byte lưu bảng `RefreshTokens`, xoay vòng mỗi lần refresh, cookie httpOnly.
- Mật khẩu: PBKDF2-SHA256 100.000 vòng, salt riêng, so sánh `FixedTimeEquals`.
- Sai email và sai mật khẩu trả cùng một 401; tài khoản `Locked` trả 403.
- Tồn kho **tính từ booking** (`Services/AvailabilityService.cs`):
  `available = TotalRooms − Σ bookings chồng lấn ngày`, chỉ tính đơn `Pending` (giữ chỗ 30 phút) / `Confirmed` / `CheckedIn`.
- Đặt phòng đi qua `Services/BookingService.cs`: kiểm tra ngày, sức chứa, tồn kho; chụp giá; mã đơn 8 ký tự; mọi chuyển trạng thái ở một chỗ.
- Người khác đọc đơn của mình → 404 (không phải 403) để không lộ mã đơn có tồn tại.
- Seed dữ liệu ở `Data/SeedData.cs` (idempotent); hằng số trạng thái ở `Models/Constants.cs`.
