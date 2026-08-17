// src/services/auth.js
import api from './api';

export const authService = {
  /** Đăng nhập → trả { access_token, token_type, expires_in_minutes } */
  async login(email, password, rememberMe = true) {
    const { data } = await api.post('/auth/login', {
      email,
      password,
      remember_me: Boolean(rememberMe),
    });
    return data;
  },

  /** Đăng nhập bằng Google (credential hoặc access_token) */
  async googleLogin(credential, accessToken = null, userInfo = null) {
    const { data } = await api.post('/auth/google', {
      credential: credential || null,
      access_token: accessToken || null,
      email: userInfo?.email || null,
      name: userInfo?.name || null,
    });
    return data;
  },

  /** Lấy thông tin user hiện tại (cần token) */
  async getMe(tokenOverride = null) {
    const config = tokenOverride ? { headers: { Authorization: `Bearer ${tokenOverride}` } } : {};
    const { data } = await api.get('/auth/me', config);
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
