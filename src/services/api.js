// src/services/api.js
// Axios instance trung tâm — JWT interceptor + 401 logout
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: gắn Bearer token ────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bis_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: 401 → logout + redirect ────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
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
