# Phase 2B — Frontend cho chủ khách sạn (Owner) và quản trị viên (Admin)

Phase 2A đã xong: toàn bộ giao diện khách (trang chủ, tìm kiếm, chi tiết, đặt phòng, tài khoản) chạy được với API thật.
Phase này bổ sung **khu vực quản trị** trong cùng dự án React. Không sửa backend (`api/`).

Đọc lại `docs/prompts/phase-2a-frontend-public.md` (quy ước CSS, palette, cấu trúc) và `docs/SPEC.md` mục 4 (Owner, Admin) trước khi code.

## 1. Dùng lại những gì đã có
- `services/api.js`: thêm nhóm `ownerApi` và `adminApi`, cùng cơ chế token/refresh đã có.
- `AuthContext`, `RequireAuth`, `RequireRole`, `Pagination`, `StatusBadge`, `EmptyState`, `Spinner`, `ConfirmDialog`, `useList`, `utils/format`.
- CSS mới: `src/styles/owner.css` và `src/styles/admin.css`, import trong các trang; biến màu ở `index.css`.

## 2. Route mới (khai báo trong `App.jsx`)
Owner (bọc `<RequireRole roles={['Owner','Admin']}>`):
```
/owner                         Dashboard
/owner/hotels                  danh sách khách sạn của tôi
/owner/hotels/new              form tạo khách sạn
/owner/hotels/:id              chi tiết: thông tin + ảnh + loại phòng
/owner/hotels/:id/calendar     lịch trống theo ngày
/owner/bookings                đơn đặt phòng
/owner/stats                   thống kê
```
Admin (bọc `<RequireRole roles={['Admin']}>`):
```
/admin                         Dashboard
/admin/users                   quản lý người dùng
/admin/hotels                  duyệt / tạm ngưng khách sạn
/admin/stats                   thống kê hệ thống
```
Navbar: khi role `Owner` hiện menu "Kênh chủ khách sạn", khi `Admin` hiện "Quản trị" (đồng thời có link sang khu owner). Sai role vào route → trang 403 (dùng lại component sẵn có, không màn hình trắng).

## 3. Trang Owner
- **Dashboard**: 4 thẻ số liệu (khách sạn, đơn hôm nay, doanh thu 30 ngày, công suất trung bình) lấy từ `/owner/stats`; danh sách 5 đơn mới nhất; cảnh báo khách sạn đang `Pending` chờ duyệt.
- **Danh sách khách sạn**: bảng có tìm kiếm, lọc theo trạng thái, sắp xếp, phân trang; cột tên/ thành phố / hạng sao / trạng thái duyệt (badge màu: Pending vàng, Active xanh, Suspended/Rejected đỏ) / số loại phòng / ngày tạo; nút Sửa, Xem lịch, Thêm loại phòng.
- **Form khách sạn** (`new` và sửa): name, city (select từ `/meta/cities`), district, address, starRating (1–5), amenities (checkbox từ `/meta/amenities`), description (textarea). Validate client; hiện lỗi server theo `message`. Sau khi tạo hiện thông báo "Đã gửi duyệt".
- **Chi tiết khách sạn**: 2 tab — "Thông tin & ảnh" và "Loại phòng".
  - Tab ảnh: lưới ảnh, nút "Tải ảnh lên" (input file) → `POST /uploads` → `POST /owner/hotels/{id}/images`; xoá ảnh có xác nhận; đặt ảnh chính (sortOrder 0).
  - Tab loại phòng: bảng loại phòng (tên, giường, hướng, sức chứa, diện tích, giá, tổng phòng, đang bán), nút Thêm/Sửa/Xoá (xoá mềm), form modal với đủ trường + bồn tắm + tiện ích + ảnh.
- **Lịch trống** (`calendar`): bảng theo ngày 30 ngày tới (cuộn ngang), mỗi hàng một loại phòng, ô hiển thị `còn/tổng`; ô hết phòng tô đỏ, còn ít tô vàng; chọn khoảng ngày để tải lại; chú thích màu.
- **Đơn đặt phòng**: bảng có lọc khách sạn, trạng thái, khoảng ngày; phân trang; cột mã đơn / khách / SĐT / khách sạn / loại phòng / ngày / số phòng / tổng tiền / trạng thái; nút hành động **chỉ hiện khi hợp lệ** (Pending→Xác nhận/Huỷ, Confirmed→Đã nhận phòng/Huỷ, CheckedIn→Trả phòng) và gọi `PUT /owner/bookings/{id}/status`, có xác nhận trước khi đổi.
- **Thống kê**: chọn khoảng ngày (mặc định 30 ngày) + khách sạn; hiện tổng doanh thu, số đơn theo trạng thái, số đêm bán; bảng công suất theo loại phòng có thanh tiến trình; top 5 loại phòng doanh thu cao nhất.

## 4. Trang Admin
- **Dashboard**: số user theo role, số khách sạn theo trạng thái, tổng doanh thu, tổng đơn; danh sách khách sạn `Pending` cần duyệt với nút Duyệt / Từ chối.
- **Người dùng**: bảng tìm kiếm theo email/tên, lọc role + trạng thái, phân trang; sửa họ tên/SĐT (modal), đổi role (select, chặn đổi chính mình ở client + hiện lỗi server), nút Khoá/Mở (khoá có xác nhận).
- **Khách sạn**: bảng mọi khách sạn + email chủ, lọc trạng thái/thành phố, tìm kiếm; nút Duyệt (`Active`), Tạm ngưng (`Suspended`), Từ chối (`Rejected`), bật/tắt "Nổi bật" (Featured) — tất cả có xác nhận và cập nhật lại bảng sau khi thành công.
- **Thống kê**: như dashboard nhưng chi tiết hơn — top 5 khách sạn theo doanh thu, số đơn theo trạng thái, số khách sạn theo thành phố.

## 5. Quy ước UI (giữ đồng bộ với 2A)
- Bảng: header dính, sọc xen kẽ, hover; trên mobile chuyển thành danh sách thẻ (không tràn ngang).
- Mọi thao tác có phản hồi: nút loading khi đang gửi, toast/thông báo xanh khi thành công, đỏ khi lỗi; disable nút khi đang xử lý.
- Không dùng `alert()`; dùng `ConfirmDialog` sẵn có.
- Số tiền format `vi-VN`, ngày `dd/MM/yyyy`, trạng thái dịch tiếng Việt qua `utils/format.js` (bổ sung nhãn cho các trạng thái mới nếu thiếu).
- Không hardcode dữ liệu; mọi bảng đọc từ API và có phân trang + tìm + lọc + sort.

## 6. Ràng buộc
- Không sửa `api/`, không đụng repo `hotel-booking`.
- Không thêm thư viện UI/state/chart ngoài (được dùng axios, react-router). Biểu đồ nếu cần thì vẽ bằng CSS (thanh tiến trình/ cột đơn giản).
- Comment tiếng Việt ở chỗ có logic (tính công suất, chuyển trạng thái, kiểm tra quyền).

## 7. Xong khi
- `npm run build` và `npm run lint` sạch (dán output).
- Với API đang chạy ở `http://localhost:5080`, dùng `curl`/`Invoke-WebRequest` xác nhận: `/owner` và `/admin` trả 200 khi dev server chạy (SPA fallback), và bạn đã đăng nhập thử bằng token seed để gọi ít nhất 3 endpoint owner/admin mà UI dùng.
- Báo cáo: file tạo/sửa, output build/lint, và danh sách những gì **chưa** kiểm tra được (phần cần bấm chuột).
