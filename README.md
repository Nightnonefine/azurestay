# AzureStay — website booking khách sạn

Đồ án Lập trình Web (PTIT HCM, đề tài số 2) — bản **website dùng thật**, không phải demo.

- Frontend: React 19 + Vite + react-router (CSS thuần) — *chưa làm, phase 2A*
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

Test API khi server đang chạy:

```powershell
python api\tests\smoke_test.py
```

Tài khoản seed: `admin@azurestay.vn / Admin@12345`, `owner@azurestay.vn / Owner@12345`,
`demo@azurestay.vn / Demo@12345`.

Biến môi trường cần khi deploy: `ConnectionStrings__Default`, `Jwt__Key`, `Vnpay__TMNCode`, `Vnpay__HashSecret`.
`Jwt:Key` trong `appsettings.json` chỉ là khoá dev — **phải đổi khi deploy**.

## Tiến độ

| Phase | Nội dung | Trạng thái |
|---|---|---|
| 1A | Schema + JWT auth + seed | XONG — 17/17 smoke test PASS |
| 1B | Hotels / RoomTypes / availability / bookings | đang làm |
| 1C | Owner + Admin API, upload, thống kê | chưa |
| 2A | Frontend công khai + tài khoản khách | chưa |
| 2B | Frontend owner + admin | chưa |
| 3 | VNPay sandbox + Docker + hosting | chưa |

## Ghi chú kỹ thuật đã chốt ở phase 1A

- JWT HS256 60 phút (claim `sub`, `email`, `role`), refresh token 64 byte lưu bảng `RefreshTokens`, xoay vòng mỗi lần refresh, cookie httpOnly.
- Mật khẩu: PBKDF2-SHA256 100.000 vòng, salt riêng, so sánh `FixedTimeEquals`.
- Sai email và sai mật khẩu trả cùng một 401; tài khoản `Locked` trả 403.
- Seed dữ liệu nằm ở `Data/SeedData.cs` (idempotent — chạy lại không nhân đôi dữ liệu).
- Hằng số trạng thái tập trung ở `Models/Constants.cs` (`UserRoles`, `UserStatuses`, `HotelStatuses`, `BookingStatuses`).
