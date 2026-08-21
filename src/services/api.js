// src/services/api.js
// Axios instance trung tâm — JWT interceptor + 401 logout + Retry + Cancel token helper
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Bản deploy chạy HTTPS mà gọi API http:// thì trình duyệt CHẶN (mixed content): request
// không bao giờ rời khỏi máy người dùng, app chỉ thấy "lỗi mạng" chung chung nên rất khó
// đoán. Nhận diện sớm để báo đúng nguyên nhân thay vì để người dùng ngồi thử lại mật khẩu.
export const isApiUnreachableByDesign =
  typeof window !== 'undefined' &&
  window.location.protocol === 'https:' &&
  API_BASE_URL.startsWith('http://');

if (isApiUnreachableByDesign) {
  console.error(
    `[BIS] Trang chạy HTTPS nhưng địa chỉ API là ${API_BASE_URL} — trình duyệt sẽ chặn mọi ` +
      'request. Bản deploy cần build lại với biến VITE_API_BASE_URL trỏ tới backend https.',
  );
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    // Khi backend đi qua ngrok bản miễn phí, ngrok chèn một trang cảnh báo HTML trước mọi
    // request trông giống trình duyệt -> API trả HTML thay vì JSON và app hỏng toàn bộ.
    // Header này tắt trang đó. Vô hại khi không dùng ngrok.
    'ngrok-skip-browser-warning': 'true',
  },
});

// ── Helper: Tạo AbortController cho phép hủy request đang chạy ────
export const createAbortController = () => new AbortController();

// ── Request: gắn Bearer token ────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bis_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: Retry tự động với Exponential Backoff + 429 & 401 handler ──
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config;

    // Chuẩn hóa thông báo lỗi thân thiện cho UI
    if (err.response?.status === 429) {
      err.userMessage = 'Hệ thống đang quá tải hoặc nhận quá nhiều yêu cầu. Vui lòng thử lại sau vài giây.';
    } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      err.userMessage = 'Yêu cầu phản hồi quá lâu (hết thời gian chờ). Vui lòng thử lại.';
    } else if (!err.response) {
      // Cấu hình sai thì nói thẳng là sai cấu hình — bảo người dùng "kiểm tra kết nối mạng"
      // chỉ khiến họ ngồi thử lại mật khẩu trong khi request chưa từng rời khỏi trình duyệt.
      err.userMessage = isApiUnreachableByDesign
        ? 'Bản web này chưa được cấu hình địa chỉ máy chủ (đang trỏ vào localhost). '
          + 'Vui lòng báo quản trị viên build lại với địa chỉ API https.'
        : 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.';
    }

    // Retry tự động tối đa 2 lần với phương thức GET khi gặp 502/503/504 hoặc lỗi mạng/timeout
    const isNetworkOrServerError = !err.response || [502, 503, 504].includes(err.response.status) || err.code === 'ECONNABORTED';
    if (
      config &&
      config.method === 'get' &&
      isNetworkOrServerError &&
      (!config._retryCount || config._retryCount < 2) &&
      !axios.isCancel(err)
    ) {
      config._retryCount = (config._retryCount || 0) + 1;
      const delay = Math.pow(2, config._retryCount) * 500; // Exponential backoff: 1000ms, 2000ms
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(config);
    }

    if (err.response?.status === 401) {
      localStorage.removeItem('bis_token');
      localStorage.removeItem('bis_user');
      // Tránh vòng lặp redirect khi đang ở login hoặc khi gọi API login/google
      const isLoginRequest = config?.url?.includes('/auth/login') || config?.url?.includes('/auth/google');
      const isAlreadyOnLoginPage = window.location.pathname.includes('/login');
      if (!isLoginRequest && !isAlreadyOnLoginPage) {
        window.location.href = `${import.meta.env.BASE_URL}login?session_expired=1`;
      }
    }

    return Promise.reject(err);
  }
);

// ── In-Flight GET Request Deduplication ─────────────────────────────
const pendingGetRequests = new Map();
const originalGet = api.get.bind(api);

api.get = function (url, config = {}) {
  // Chỉ deduplicate các GET request không bị force bypass
  const requestKey = `${url}?${JSON.stringify(config.params || {})}`;
  if (pendingGetRequests.has(requestKey)) {
    return pendingGetRequests.get(requestKey);
  }

  const promise = originalGet(url, config).finally(() => {
    pendingGetRequests.delete(requestKey);
  });

  pendingGetRequests.set(requestKey, promise);
  return promise;
};

export default api;


