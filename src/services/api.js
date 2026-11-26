import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5080/api';
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export const STORAGE_TOKEN_KEY = 'azurestay.token';
export const STORAGE_USER_KEY = 'azurestay.user';
export const AUTH_LOGOUT_EVENT = 'azurestay:logout';
export const AUTH_TOKEN_REFRESHED_EVENT = 'azurestay:token-refreshed';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
});

// Gắn accessToken từ localStorage vào mỗi request gửi lên API.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Dùng chung một promise khi nhiều request cùng gặp 401 để chỉ gọi /auth/refresh đúng 1 lần.
let refreshPromise = null;

function clearStoredSession() {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
  localStorage.removeItem(STORAGE_USER_KEY);
  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
}

// Xử lý 401: tự động xoay vòng refresh token qua cookie httpOnly, thất bại thì đăng xuất.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url || '';

    const isAuthEndpoint =
      url.includes('/auth/refresh') || url.includes('/auth/login');

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = api
            .post('/auth/refresh')
            .then((res) => {
              const newToken = res.data?.accessToken;
              if (!newToken) {
                throw new Error('Không nhận được access token mới.');
              }
              localStorage.setItem(STORAGE_TOKEN_KEY, newToken);
              window.dispatchEvent(
                new CustomEvent(AUTH_TOKEN_REFRESHED_EVENT, { detail: newToken }),
              );
              return newToken;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const freshToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${freshToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearStoredSession();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// Loại bỏ các tham số rỗng trước khi gửi query lên backend.
function cleanParams(params = {}) {
  const cleaned = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      cleaned[key] = value;
    }
  });
  return cleaned;
}

// Chuẩn hoá thông báo lỗi từ server hoặc lỗi mất kết nối mạng.
export function getApiErrorMessage(err, fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.') {
  if (!err) return fallback;
  if (!err.response) {
    return 'Không kết nối được máy chủ';
  }
  return err.response?.data?.message || fallback;
}

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  refresh: () => api.post('/auth/refresh').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  updateMe: (payload) => api.put('/auth/me', payload).then((r) => r.data),
  changePassword: (payload) => api.post('/auth/change-password', payload).then((r) => r.data),
};

export const hotelApi = {
  search: (params) => api.get('/hotels', { params: cleanParams(params) }).then((r) => r.data),
  detail: (slug, params) =>
    api.get(`/hotels/${encodeURIComponent(slug)}`, { params: cleanParams(params) }).then((r) => r.data),
  availability: (slug, params) =>
    api
      .get(`/hotels/${encodeURIComponent(slug)}/availability`, { params: cleanParams(params) })
      .then((r) => r.data),
  reviews: (slug, params) =>
    api
      .get(`/hotels/${encodeURIComponent(slug)}/reviews`, { params: cleanParams(params) })
      .then((r) => r.data),
};

export const metaApi = {
  cities: () => api.get('/meta/cities').then((r) => r.data),
  amenities: () => api.get('/meta/amenities').then((r) => r.data),
};

export const bookingApi = {
  create: (payload) => api.post('/bookings', payload).then((r) => r.data),
  mine: (params) => api.get('/bookings/my', { params: cleanParams(params) }).then((r) => r.data),
  detail: (code) => api.get(`/bookings/${encodeURIComponent(code)}`).then((r) => r.data),
  cancel: (id, payload = {}) => api.post(`/bookings/${id}/cancel`, payload).then((r) => r.data),
};

export default api;
