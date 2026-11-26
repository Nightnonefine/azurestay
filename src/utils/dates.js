import { nightsBetween } from './format';

export const MAX_BOOKING_NIGHTS = 30;

// Lấy ngày hôm nay theo giờ địa phương dạng yyyy-MM-dd.
export function todayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Cộng thêm số ngày vào chuỗi yyyy-MM-dd.
export function addDaysIso(dateStr, days) {
  if (!isValidDateString(dateStr)) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Kiểm tra chuỗi ngày yyyy-MM-dd có tồn tại trên lịch thật hay không.
export function isValidDateString(value) {
  if (!value || typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return false;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

// Kiểm tra khoảng ngày đặt phòng hợp lệ: nhận phòng >= hôm nay, trả phòng > nhận phòng, tối đa 30 đêm.
export function validateDateRange(checkIn, checkOut) {
  const today = todayIso();

  if (!checkIn || !checkOut) {
    return { valid: false, error: 'Vui lòng chọn đầy đủ ngày nhận phòng và ngày trả phòng.', nights: 0 };
  }
  if (!isValidDateString(checkIn) || !isValidDateString(checkOut)) {
    return { valid: false, error: 'Định dạng ngày không hợp lệ.', nights: 0 };
  }
  if (checkIn < today) {
    return { valid: false, error: 'Ngày nhận phòng phải từ hôm nay trở đi.', nights: 0 };
  }
  const nights = nightsBetween(checkIn, checkOut);
  if (nights <= 0) {
    return { valid: false, error: 'Ngày trả phòng phải sau ngày nhận phòng.', nights: 0 };
  }
  if (nights > MAX_BOOKING_NIGHTS) {
    return { valid: false, error: `Mỗi đơn đặt phòng tối đa ${MAX_BOOKING_NIGHTS} đêm.`, nights: 0 };
  }

  return { valid: true, error: '', nights };
}
