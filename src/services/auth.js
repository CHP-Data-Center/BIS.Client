// src/services/auth.js
import api from './api';

export const authService = {
  /** Đăng nhập → trả { access_token, token_type, expires_in_minutes } */
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  /** Lấy thông tin user hiện tại (cần token) */
  async getMe() {
    const { data } = await api.get('/auth/me');
    return data;
  },

  /** Đổi mật khẩu */
  async changePassword(oldPassword, newPassword) {
    await api.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },

  /** Quên mật khẩu — luôn 204, không lộ email tồn tại */
  async forgotPassword(email) {
    await api.post('/auth/forgot-password', { email });
  },

  /** Đặt lại mật khẩu bằng token email */
  async resetPassword(token, newPassword) {
    await api.post('/auth/reset-password', { token, new_password: newPassword });
  },
};
