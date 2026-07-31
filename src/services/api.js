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

// ── Response: Retry tự động cho GET + 401 logout ──────────────────
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config;

    // Retry tự động tối đa 2 lần với phương thức GET khi gặp 502/503/504 hoặc lỗi mạng
    if (
      config &&
      config.method === 'get' &&
      (!err.response || [502, 503, 504].includes(err.response.status)) &&
      (!config._retryCount || config._retryCount < 2) &&
      !axios.isCancel(err)
    ) {
      config._retryCount = (config._retryCount || 0) + 1;
      const delay = config._retryCount * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(config);
    }

    if (err.response?.status === 401) {
      localStorage.removeItem('bis_token');
      localStorage.removeItem('bis_user');
      // Tránh vòng lặp redirect khi đã ở login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

