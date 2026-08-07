// src/services/digest.js
// Cấu hình Email Digest CHUNG (admin): nội dung, người nhận, giờ, lịch.
import api from './api';

export const digestService = {
  /** Lấy cấu hình hiện tại */
  async getConfig() {
    const { data } = await api.get('/admin/digest/config');
    return data; // DigestConfigOut
  },

  /** Lưu cấu hình (đồng thời áp lịch mới vào scheduler) */
  async saveConfig(payload) {
    const { data } = await api.put('/admin/digest/config', payload);
    return data; // DigestConfigOut
  },

  /** Gửi thử tới 1 email */
  async sendTest(email) {
    const { data } = await api.post('/admin/digest/send-test', { email });
    return data; // { ok }
  },

  /** Gửi ngay tới toàn bộ người nhận đã cấu hình */
  async sendNow() {
    const { data } = await api.post('/admin/digest/send-now');
    return data; // DigestSendResult
  },
};
