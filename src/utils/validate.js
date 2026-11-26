import { validateDateRange } from './dates';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VN_PHONE_REGEX = /^0\d{9}$/;

export function isValidEmail(email) {
  return Boolean(email && EMAIL_REGEX.test(String(email).trim()));
}

export function isValidPhone(phone) {
  return Boolean(phone && VN_PHONE_REGEX.test(String(phone).trim()));
}

export function isValidPassword(password) {
  return Boolean(password && String(password).length >= 8);
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!isValidEmail(email)) {
    errors.email = 'Vui lòng nhập email đúng định dạng.';
  }
  if (!isValidPassword(password)) {
    errors.password = 'Mật khẩu phải có ít nhất 8 ký tự.';
  }
  return errors;
}

export function validateRegister({ fullName, email, phone, password, confirmPassword }) {
  const errors = {};
  const name = String(fullName || '').trim();
  if (name.length < 2 || name.length > 120) {
    errors.fullName = 'Họ tên phải từ 2 đến 120 ký tự.';
  }
  if (!isValidEmail(email)) {
    errors.email = 'Vui lòng nhập email đúng định dạng.';
  }
  if (phone && String(phone).trim() !== '' && !isValidPhone(phone)) {
    errors.phone = 'Số điện thoại Việt Nam phải gồm 10 chữ số và bắt đầu bằng số 0.';
  }
  if (!isValidPassword(password)) {
    errors.password = 'Mật khẩu phải có ít nhất 8 ký tự.';
  }
  if (confirmPassword !== undefined && confirmPassword !== password) {
    errors.confirmPassword = 'Xác nhận mật khẩu không khớp.';
  }
  return errors;
}

export function validateProfile({ fullName, phone }) {
  const errors = {};
  const name = String(fullName || '').trim();
  if (name.length < 2 || name.length > 120) {
    errors.fullName = 'Họ tên phải từ 2 đến 120 ký tự.';
  }
  if (phone && String(phone).trim() !== '' && !isValidPhone(phone)) {
    errors.phone = 'Số điện thoại Việt Nam phải gồm 10 chữ số và bắt đầu bằng số 0.';
  }
  return errors;
}

export function validatePasswordChange({ currentPassword, newPassword, confirmPassword }) {
  const errors = {};
  if (!currentPassword) {
    errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.';
  }
  if (!isValidPassword(newPassword)) {
    errors.newPassword = 'Mật khẩu mới phải có ít nhất 8 ký tự.';
  }
  if (confirmPassword !== newPassword) {
    errors.confirmPassword = 'Xác nhận mật khẩu mới không khớp.';
  }
  return errors;
}

export function validateBooking({
  guestName,
  guestPhone,
  guestEmail,
  rooms,
  adults,
  children,
  checkIn,
  checkOut,
  available,
  maxCapacityPerRoom,
}) {
  const errors = {};

  const name = String(guestName || '').trim();
  if (name.length < 2 || name.length > 120) {
    errors.guestName = 'Vui lòng nhập họ tên người nhận phòng (2 - 120 ký tự).';
  }
  if (!isValidPhone(guestPhone)) {
    errors.guestPhone = 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.';
  }
  if (!isValidEmail(guestEmail)) {
    errors.guestEmail = 'Email liên hệ không đúng định dạng.';
  }

  const dateCheck = validateDateRange(checkIn, checkOut);
  if (!dateCheck.valid) {
    errors.dates = dateCheck.error;
  }

  const roomCount = Number(rooms);
  if (!Number.isInteger(roomCount) || roomCount < 1) {
    errors.rooms = 'Số phòng phải từ 1 trở lên.';
  } else if (typeof available === 'number' && roomCount > available) {
    errors.rooms = available <= 0
      ? 'Loại phòng này đã hết phòng trong khoảng ngày bạn chọn.'
      : `Chỉ còn ${available} phòng trống trong khoảng ngày bạn chọn.`;
  }

  const adultCount = Number(adults);
  const childCount = Number(children || 0);
  if (!Number.isInteger(adultCount) || adultCount < 1) {
    errors.adults = 'Cần ít nhất 1 người lớn.';
  }
  if (!Number.isInteger(childCount) || childCount < 0) {
    errors.children = 'Số trẻ em không hợp lệ.';
  }
  if (maxCapacityPerRoom && roomCount >= 1 && adultCount + childCount > maxCapacityPerRoom * roomCount) {
    errors.adults = `Tổng số khách vượt quá sức chứa tối đa (${maxCapacityPerRoom * roomCount} khách cho ${roomCount} phòng).`;
  }

  return errors;
}
