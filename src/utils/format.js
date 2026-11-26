import { API_ORIGIN } from '../services/api';

// Định dạng tiền tệ VND theo chuẩn Việt Nam (ví dụ: 1.850.000 ₫).
export function formatMoney(amount) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    return '0 ₫';
  }
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(numeric))} ₫`;
}

// Định dạng chuỗi ngày yyyy-MM-dd hoặc ISO datetime sang dd/MM/yyyy.
export function formatDate(value) {
  if (!value) return '';
  const text = String(value);
  const datePart = text.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
}

// Định dạng ngày giờ theo múi giờ Việt Nam.
export function formatDateTime(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_LABELS = {
  Pending: 'Chờ xác nhận',
  Confirmed: 'Đã xác nhận',
  CheckedIn: 'Đã nhận phòng',
  Completed: 'Hoàn thành',
  Cancelled: 'Đã huỷ',
  Active: 'Đang hoạt động',
  Suspended: 'Tạm ngưng',
  Rejected: 'Từ chối',
  Locked: 'Đã khoá',
};

const HOTEL_STATUS_LABELS = {
  Pending: 'Chờ duyệt',
  Active: 'Đang hoạt động',
  Suspended: 'Tạm ngưng',
  Rejected: 'Từ chối',
};

const USER_STATUS_LABELS = {
  Active: 'Hoạt động',
  Locked: 'Đã khoá',
};

const ROLE_LABELS = {
  Customer: 'Khách hàng',
  Owner: 'Chủ khách sạn',
  Admin: 'Quản trị viên',
};

const STATUS_VARIANTS = {
  Pending: 'pending',
  Confirmed: 'confirmed',
  CheckedIn: 'checked-in',
  Completed: 'completed',
  Cancelled: 'cancelled',
  Active: 'active',
  Suspended: 'suspended',
  Rejected: 'rejected',
  Locked: 'locked',
};

// Chuyển mã trạng thái booking/chung sang nhãn tiếng Việt.
export function statusLabel(status) {
  return STATUS_LABELS[status] || status || 'Không xác định';
}

// Chuyển mã trạng thái khách sạn sang nhãn tiếng Việt.
export function hotelStatusLabel(status) {
  return HOTEL_STATUS_LABELS[status] || statusLabel(status);
}

// Chuyển mã trạng thái tài khoản sang nhãn tiếng Việt.
export function userStatusLabel(status) {
  return USER_STATUS_LABELS[status] || statusLabel(status);
}

// Chuyển mã vai trò người dùng sang nhãn tiếng Việt.
export function roleLabel(role) {
  return ROLE_LABELS[role] || role || 'Không xác định';
}

// Trả về class CSS tương ứng với trạng thái.
export function statusVariant(status) {
  return STATUS_VARIANTS[status] || 'pending';
}

// Tính số đêm giữa checkIn và checkOut (định dạng yyyy-MM-dd).
export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

const FALLBACK_AMENITIES = {
  wifi: 'Wi-Fi miễn phí',
  pool: 'Hồ bơi',
  spa: 'Spa & Chăm sóc sức khỏe',
  breakfast: 'Bữa sáng miễn phí',
  parking: 'Bãi đỗ xe',
  gym: 'Phòng tập gym',
  'sea-view': 'Hướng biển',
  'airport-shuttle': 'Đưa đón sân bay',
};

// Ánh xạ mã tiện ích sang tên hiển thị tiếng Việt.
export function amenityLabel(code, customMap = null) {
  if (!code) return '';
  const key = String(code).trim().toLowerCase();
  if (customMap && customMap[key]) return customMap[key];
  return FALLBACK_AMENITIES[key] || code;
}

// Chuẩn hoá đường dẫn ảnh tương đối (/uploads/...) sang URL đầy đủ của backend.
export function resolveImageUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
  return url;
}
