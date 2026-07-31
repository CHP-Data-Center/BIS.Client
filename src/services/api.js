// src/services/api.js
// Axios instance trung tâm — JWT interceptor + 401 logout + Retry + Cancel token helper
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
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
      err.userMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.';
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
      // Tránh vòng lặp redirect khi đang ở login hoặc khi gọi API login
      const isLoginRequest = config?.url?.includes('/auth/login');
      const isAlreadyOnLoginPage = window.location.pathname.includes('/login');
      if (!isLoginRequest && !isAlreadyOnLoginPage) {
        window.location.href = '/login?session_expired=1';
      }
    }

    return Promise.reject(err);
  }
);

export default api;


