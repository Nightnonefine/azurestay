import { ownerApi, adminApi } from '../services/api';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Tải toàn bộ danh sách phân trang (tối đa 50 dòng/trang theo giới hạn backend) để tra cứu theo ID hoặc tổng hợp.
async function fetchAllPaged(fetcher) {
  const first = await fetcher({ page: 1, pageSize: 50 });
  const items = [...(first?.items || [])];
  const total = first?.total || items.length;
  const totalPages = Math.ceil(total / 50);

  for (let p = 2; p <= totalPages; p += 1) {
    const next = await fetcher({ page: p, pageSize: 50 });
    if (Array.isArray(next?.items)) {
      items.push(...next.items);
    }
  }
  return items;
}

export function fetchAllOwnerHotels() {
  return fetchAllPaged((params) => ownerApi.hotels(params));
}

export function fetchAllAdminHotels() {
  return fetchAllPaged((params) => adminApi.hotels(params));
}

// Tính công suất phòng trung bình (%) từ tổng số đêm bán / tổng công suất phòng của các loại phòng.
export function calculateAverageOccupancy(roomTypeOccupancy = []) {
  if (!Array.isArray(roomTypeOccupancy) || roomTypeOccupancy.length === 0) return 0;

  let sold = 0;
  let capacity = 0;
  roomTypeOccupancy.forEach((item) => {
    sold += Number(item.soldNights || 0);
    capacity += Number(item.capacityNights || 0);
  });

  if (capacity <= 0) return 0;
  return Math.round((sold / capacity) * 1000) / 10;
}

// Kiểm tra tệp ảnh hợp lệ trước khi tải lên POST /api/uploads (JPG/PNG/WebP, <= 5 MB).
export function validateImageFile(file) {
  if (!file) return 'Vui lòng chọn tệp ảnh.';
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WebP.';
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'Kích thước ảnh không được vượt quá 5 MB.';
  }
  return '';
}

// Trả về thông báo dễ hiểu nếu tài khoản Admin mở khu vực API chỉ dành cho Owner.
export function formatOwnerApiError(err, fallback) {
  if (err?.response?.status === 403) {
    return 'Máy chủ yêu cầu tài khoản vai trò Owner để truy cập dữ liệu chủ khách sạn (tài khoản Admin chỉ quản trị ở mục /admin).';
  }
  return err?.response?.data?.message || (!err?.response ? 'Không kết nối được máy chủ' : fallback);
}
