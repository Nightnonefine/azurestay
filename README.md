# AzureStay — website booking khách sạn

Đồ án Lập trình Web (PTIT HCM, đề tài số 2) — bản **website dùng thật**, không phải demo.

- Frontend: React 19 + Vite + react-router (CSS thuần)
- Backend: ASP.NET Core 8 Web API + EF Core 8 + SQL Server
- Ba vai trò: Khách (`Customer`) — Chủ khách sạn (`Owner`) — Quản trị (`Admin`)
- Đặc tả đầy đủ: [docs/SPEC.md](docs/SPEC.md) — đọc trước khi sửa bất cứ thứ gì.

## Chạy ở máy dev

```powershell
# lần đầu
cd api
dotnet tool restore
dotnet ef database update      # tạo AzureStayDb + seed
cd ..
npm install

# hằng ngày (2 cửa sổ)
cd api ; dotnet run            # http://localhost:5080/swagger
npm run dev -- --port 3000     # http://localhost:3000
```

Tài khoản seed: `admin@azurestay.vn / Admin@12345`, `owner@azurestay.vn / Owner@12345`, `demo@azurestay.vn / Demo@12345`.

Biến môi trường cần khi deploy: `ConnectionStrings__Default`, `Jwt__Key`, `Vnpay__TMNCode`, `Vnpay__HashSecret`.
`Jwt:Key` trong `appsettings.json` chỉ là khoá dev — **phải đổi khi deploy**.

## Tiến độ

| Phase | Nội dung | Trạng thái |
|---|---|---|
| 1A | Schema + JWT auth + seed | đang làm |
| 1B | Hotels / RoomTypes / availability / bookings | chưa |
| 1C | Owner + Admin API, upload, thống kê | chưa |
| 2A | Frontend công khai + tài khoản khách | chưa |
| 2B | Frontend owner + admin | chưa |
| 3 | VNPay sandbox + Docker + hosting | chưa |
