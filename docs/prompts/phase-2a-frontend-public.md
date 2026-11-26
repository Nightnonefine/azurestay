# Phase 2A — Frontend công khai + tài khoản khách

Backend đã xong: 1A (auth), 1B (khách sạn/loại phòng/tồn kho/đặt phòng), 1C (owner/admin/upload/thống kê).
`/api/...` chạy ở `http://localhost:5080`. Phase này dựng **toàn bộ frontend cho khách** bằng React + Vite + CSS thuần.
Không làm trang owner/admin (phase 2B). Không sửa backend.

## 0. Nền dự án
- `package.json`: react 19, react-dom 19, react-router-dom 7, axios 1.21; devDependencies vite 8, @vitejs/plugin-react, oxlint. Scripts: `dev`, `build`, `lint`, `preview`.
- `vite.config.js`: React plugin, `server.port = 3000`, `strictPort: true`.
- `index.html`: `<div id="root">`, title "AzureStay — Đặt phòng khách sạn", lang="vi", meta description.
- Không Tailwind, không UI kit. Toàn bộ CSS nằm trong file `.css` (yêu cầu của đề).
- Bộ màu giữ nguyên bản demo cũ: `--navy:#0f2b46; --navy-700:#16405f; --teal:#0d9488; --teal-dark:#0b7a70; --gold:#e0a83b; --sand:#f7f4ee; --text:#1f2933; --muted:#64748b; --line:#e2e8f0; --radius:16px; --container:1160px; --font:'Segoe UI',system-ui,...`. Font tiếng Việt, không dùng font ngoài.

## 1. Cấu trúc file phải tạo
```
src/
├─ main.jsx, App.jsx, index.css
├─ styles/{components.css, pages.css, account.css}
├─ services/api.js
├─ context/AuthContext.jsx
├─ hooks/{useList.js, useHotelSearch.js, useDebounce.js}
├─ components/{Layout,Navbar,Footer,HotelCard,RoomTypeCard,SearchBar,DateRangeInput,
│              FilterPanel,SortSelect,Pagination,StatusBadge,EmptyState,Spinner,
│              ReviewList,ConfirmDialog,RequireAuth,RequireRole}.jsx
├─ pages/{Home,HotelList,HotelDetail,BookingForm,Login,Register,About,Contact,NotFound}.jsx
├─ pages/account/{Profile,MyBookings,BookingDetail}.jsx
└─ utils/{format.js, dates.js, validate.js}
```

## 2. Tầng gọi API — `services/api.js`
- `API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5080/api'`.
- axios instance `withCredentials: true` (để nhận cookie refresh).
- Request interceptor: gắn `Authorization: Bearer <accessToken>` lấy từ `localStorage`.
- Response interceptor: gặp 401 (và không phải request `/auth/refresh`) thì gọi `POST /auth/refresh` một lần,
  lưu token mới, chạy lại request cũ; nếu refresh cũng 401 thì xoá token + phát sự kiện logout.
- Nhóm hàm: `authApi{register,login,logout,me,updateMe,changePassword,refresh}`, `hotelApi{search,detail,availability,reviews}`,
  `metaApi{cities,amenities}`, `bookingApi{create,mine,detail,cancel}`. Không gọi axios trực tiếp trong page/component.

## 3. Auth — `context/AuthContext.jsx`
- `user` (id, email, fullName, role, phone), `accessToken`; `login`, `register`, `logout`, `loadMe`.
- Lưu user + token vào `localStorage` (khoá `azurestay.user`, `azurestay.token`), đọc lại khi F5; logout gọi API rồi xoá.
- `RequireAuth` (chưa đăng nhập → `/login?next=…`), `RequireRole roles={['Admin']}` (sai role → trang 403 trong `NotFound`-style).
- Không tự suy ra role ở client — role lấy từ `/auth/me`.

## 4. Trang và hành vi
- **Home** (`/`): hero + ô tìm kiếm nhanh (thành phố, ngày nhận/trả, số khách) đẩy sang `/hotels?...`; 6 khách sạn nổi bật
  (gọi `hotelApi.search({sort:'popular',pageSize:6})`); 3 khối giới thiệu dịch vụ; CTA đăng ký.
- **HotelList** (`/hotels`): bộ lọc thành phố / khoảng giá / hạng sao / tiện ích, ô từ khoá (debounce 300ms), chọn sắp xếp,
  phân trang; **mọi điều kiện đồng bộ lên URL** (`?city=&minPrice=&stars=&amenities=&checkIn=&checkOut=&guests=&q=&sort=&page=`)
  để F5 và copy link giữ nguyên; hiển thị "X khách sạn" + trạng thái rỗng đẹp; có skeleton/spinner khi tải.
- **HotelDetail** (`/hotels/:slug`): gallery ảnh, mô tả, tiện ích, điểm đánh giá; bảng loại phòng (giường, hướng, bồn tắm,
  diện tích, sức chứa, giá/đêm, **còn N phòng** trong khoảng ngày đang chọn); chọn ngày ở đầu trang, đổi ngày thì gọi lại
  `/availability`; nút "Đặt phòng" → `/hotels/:slug/book?roomTypeId=…&checkIn=…&checkOut=…`; danh sách review phân trang.
- **BookingForm** (`/hotels/:slug/book`): form họ tên, SĐT, email, số phòng, người lớn, trẻ em, ghi chú; hiển thị tóm tắt
  (số đêm × phòng × giá = tổng, tính ở client để hiển thị); submit gọi `POST /bookings`; 201 → sang
  `/account/bookings/:code?created=1`; 400 → hiện đúng `message` của server. Chưa đăng nhập → chuyển `/login?next=…`.
- **Login / Register**: validate client (email đúng dạng, mật khẩu ≥ 8), hiện lỗi server theo `message`, sau khi đăng nhập
  quay lại `next` hoặc `/account`.
- **Account**: `Profile` (xem/sửa họ tên + SĐT, đổi mật khẩu có nhập lại mật khẩu cũ), `MyBookings` (danh sách + lọc trạng thái
  + phân trang), `BookingDetail` (`/account/bookings/:code`: chi tiết đơn, badge trạng thái, nút huỷ khi `Pending/Confirmed` có
  hộp thoại xác nhận, hiển thị thông báo khi `?created=1`).
- **About** (`/about-us`), **Contact** (`/contact`), **NotFound** (`*`): nội dung tĩnh, không gọi API.
- **Layout**: header sticky (logo, menu Trang chủ / Khách sạn / Giới thiệu / Liên hệ, khu vực tài khoản: đăng nhập-đăng ký hoặc
  tên + menu con "Tài khoản / Đơn của tôi / Đăng xuất"), footer. Mobile: menu đóng/mở được, không vỡ layout ở 360px.

## 5. Tiện ích dùng chung
- `utils/format.js`: `formatMoney` (1.850.000 ₫), `formatDate` (dd/MM/yyyy), `statusLabel` (Pending→"Chờ xác nhận"…), `nightsBetween`.
- `utils/dates.js`: kiểm tra ngày hợp lệ, ngày nhỏ nhất = hôm nay, số đêm.
- `utils/validate.js`: email, SĐT Việt Nam (10 số bắt đầu 0), mật khẩu ≥ 8.
- `hooks/useList.js`: `{ data, items, total, loading, error, page, setPage, reload }` cho mọi danh sách phân trang.
- `hooks/useHotelSearch.js`: đọc/ghi bộ lọc từ `useSearchParams`.
- Mọi trang có: loading, rỗng, lỗi (hiện `message` từ server), và không vỡ khi API tắt (hiện thông báo "Không kết nối được máy chủ").

## 6. Ràng buộc
- Không sửa gì trong `api/` (backend), không đụng repo `hotel-booking`.
- Không dùng `dangerouslySetInnerHTML`, không hardcode dữ liệu khách sạn giả trong `src/data/` — mọi dữ liệu từ API.
- Comment tiếng Việt ở chỗ có logic (interceptor refresh, đồng bộ URL, tính tiền).
- Không thêm thư viện UI/state ngoài (được dùng axios, react-router).

## 7. Xong khi
- `npm install` và `npm run build` chạy sạch (dán output), `npm run lint` không lỗi.
- Chạy `npm run dev -- --port 3000` cùng API (`http://localhost:5080`) rồi tự kiểm tra bằng `curl`/`Invoke-WebRequest`:
  trang `/` trả 200 và HTML có `<div id="root">`; `/hotels` trả 200.
- Liệt kê trong báo cáo: file đã tạo, output build, và những chỗ **chưa** kiểm tra được (những gì cần bấm chuột).
