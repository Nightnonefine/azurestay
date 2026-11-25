# Phase 1A — Backend nền: schema + JWT auth + seed (giao cho Antigravity)

## Bối cảnh
Repo `azurestay` (ASP.NET Core 8 + React 19) là bản website booking khách sạn "dùng thật" của đồ án Lập trình Web.
Đặc tả đầy đủ nằm ở `docs/SPEC.md` — **đọc hết file đó trước khi viết code**, đây là nguồn sự thật duy nhất.
Bản demo cũ (để tham khảo cách viết code, KHÔNG copy nguyên): `D:\Hoc tap\Dai hoc\4_The _Forth _Year\Web_dev\hotel-booking`.

## Mục tiêu phase này (chỉ backend, chưa làm frontend)
1. Tạo solution `api/AzureStay.Api` (Controllers + EF Core 8 + SQL Server, chạy cổng 5080, Swagger ở Development).
2. Cài đủ entity + cấu hình EF theo mục 2 của SPEC: `User, RefreshToken, Hotel, HotelImage, RoomType, RoomTypeImage, Booking, Payment, Review` (toàn bộ, kể cả bảng chưa dùng ở phase này, để migration chỉ sinh một lần).
3. `AppDbContext` với: index unique `Users.Email`, `Hotels.Slug`, `Bookings.Code`, `Payments.TxnRef`, `Reviews.BookingId`; `HasPrecision(18,2)` cho mọi cột tiền; quan hệ xoá đúng SPEC (Hotel→RoomType/Booking = Restrict, Booking→Payment/Review = Cascade); index `Hotels.City`, `Bookings.CheckIn`.
4. Migration `InitialCreate` + `dotnet ef database update` chạy được từ database trống.
5. Seed theo mục 7 của SPEC: 5 user (1 admin, 2 owner, 2 customer — mật khẩu băm bằng PBKDF2 như bản cũ), 8 khách sạn (Status Active, đủ City/StarRating/Amenities/ảnh Unsplash), mỗi khách sạn 2–4 RoomType, ~20 Booking rải ngày đủ trạng thái, vài Review. Seed phải idempotent (`HasData` hoặc kiểm tra tồn tại trước khi thêm).
6. Auth đầy đủ theo mục 4 của SPEC:
   - `POST /api/auth/register|login|refresh|logout`, `GET/PUT /api/auth/me`, `POST /api/auth/change-password`.
   - JWT HS256 60 phút (claim sub/email/role), refresh token 7 ngày lưu DB + cookie httpOnly + xoay vòng.
   - Mật khẩu: PBKDF2-SHA256 100.000 vòng, salt riêng, `CryptographicOperations.FixedTimeEquals` (tham khảo `hotel-booking/api/Security/PasswordHasher.cs`).
   - Sai email và sai mật khẩu trả cùng một 401. User `Status=Locked` thì login bị 403 với thông báo riêng.
   - Khoá ký JWT đọc từ `appsettings.json` → `Jwt:Key` (giá trị dev, ghi rõ trong README là phải đổi khi deploy).
7. `GET /api/health` → `{ status: "ok", db: true }` (kiểm tra `Database.CanConnectAsync`).
8. `api/tests/smoke_test.py` (python3, chỉ dùng `requests`): chạy chuỗi register → login → me → refresh → change-password → login lại → logout, cộng các case lỗi: email trùng (409), sai mật khẩu (401), refresh token đã revoke (401), chưa có token gọi /me (401). In PASS/FAIL từng case, exit code 1 nếu có FAIL.

## Ràng buộc
- Cổng API 5080 (`Properties/launchSettings.json`); CORS cho `http://localhost:3000` và `http://localhost:5173` (cả `127.0.0.1`).
- Chuỗi kết nối: `Server=.\SQLEXPRESS;Database=AzureStayDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true`. **Không** đụng tới các DB khác trên máy (`HotelBookingDb`, `HotelReservationDB`, `QLBongDa`, `QuanLyVeXeBuytNoiDo`, `SouvenirSale_Lab_20261010`).
- Không trả entity có navigation property ra JSON (dùng DTO ở `Models/Dtos`).
- Toàn bộ thông báo lỗi trả về cho người dùng bằng tiếng Việt; comment nghiệp vụ bằng tiếng Việt.
- Không commit `.env`, `bin/`, `obj/`, `*.db`; `.gitignore` phải có ở `api/`.

## KHÔNG làm trong phase này
- Không viết frontend/React, không sửa thư mục `src/`.
- Không làm endpoint hotels/bookings/owner/admin (phase 1B, 1C), không VNPay, không upload file.
- Không sửa repo `hotel-booking`.

## Xong khi
- `dotnet build` 0 warning mới, `dotnet ef database update` chạy từ DB trống không lỗi.
- `python api/tests/smoke_test.py` in toàn PASS (dán nguyên output vào báo cáo).
- `sqlcmd -S .\SQLEXPRESS -d AzureStayDb -Q "select count(*) from Users; select count(*) from Hotels; select count(*) from RoomTypes; select count(*) from Bookings"` ra đúng số seed.
- Báo cáo lại: danh sách file đã tạo, lệnh đã chạy, output test, và bất cứ chỗ nào phải lệch SPEC (kèm lý do).
