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

// Kiểm tra dữ liệu biểu mẫu tạo/sửa khách sạn phía client.
export function validateHotel({ name, city, district, address, starRating, description }) {
  const errors = {};
  const cleanName = String(name || '').trim();
  const cleanCity = String(city || '').trim();
  const cleanDistrict = String(district || '').trim();
  const cleanAddress = String(address || '').trim();
  const cleanDesc = String(description || '').trim();
  const stars = Number(starRating);

  if (cleanName.length < 2 || cleanName.length > 200) {
    errors.name = 'Tên khách sạn phải từ 2 đến 200 ký tự.';
  }
  if (cleanCity.length < 2 || cleanCity.length > 100) {
    errors.city = 'Vui lòng chọn thành phố.';
  }
  if (!cleanDistrict || cleanDistrict.length > 100) {
    errors.district = 'Vui lòng nhập quận/huyện (tối đa 100 ký tự).';
  }
  if (cleanAddress.length < 2 || cleanAddress.length > 300) {
    errors.address = 'Địa chỉ khách sạn phải từ 2 đến 300 ký tự.';
  }
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    errors.starRating = 'Hạng sao phải từ 1 đến 5.';
  }
  if (cleanDesc.length > 4000) {
    errors.description = 'Mô tả không được vượt quá 4000 ký tự.';
  }

  return errors;
}

// Kiểm tra dữ liệu biểu mẫu tạo/sửa loại phòng phía client.
export function validateRoomType({
  name,
  bedType,
  maxAdults,
  maxChildren,
  sizeM2,
  pricePerNight,
  totalRooms,
}) {
  const errors = {};
  const cleanName = String(name || '').trim();
  const cleanBed = String(bedType || '').trim();

  if (cleanName.length < 2 || cleanName.length > 150) {
    errors.name = 'Tên loại phòng phải từ 2 đến 150 ký tự.';
  }
  if (!cleanBed || cleanBed.length > 80) {
    errors.bedType = 'Vui lòng nhập loại giường (tối đa 80 ký tự).';
  }

  const adults = Number(maxAdults);
  if (!Number.isInteger(adults) || adults < 1 || adults > 20) {
    errors.maxAdults = 'Số người lớn tối đa phải từ 1 đến 20.';
  }

  const children = Number(maxChildren);
  if (!Number.isInteger(children) || children < 0 || children > 20) {
    errors.maxChildren = 'Số trẻ em tối đa phải từ 0 đến 20.';
  }

  const size = Number(sizeM2);
  if (!Number.isInteger(size) || size < 5 || size > 1000) {
    errors.sizeM2 = 'Diện tích phòng phải từ 5 đến 1000 m².';
  }

  const price = Number(pricePerNight);
  if (!Number.isFinite(price) || price < 1000 || price > 1000000000) {
    errors.pricePerNight = 'Giá mỗi đêm phải từ 1.000 ₫ trở lên.';
  }

  const rooms = Number(totalRooms);
  if (!Number.isInteger(rooms) || rooms < 1 || rooms > 1000) {
    errors.totalRooms = 'Tổng số phòng phải từ 1 đến 1000.';
  }

  return errors;
}
