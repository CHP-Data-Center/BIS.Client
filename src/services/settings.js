// src/services/settings.js
import api from './api';

export const settingsService = {
  /**
   * Cập nhật cài đặt digest
   * @param {{ email_digest_enabled?, digest_hour?, timezone? }} payload
   */
  async updateSettings(payload) {
    const { data } = await api.patch('/me/settings', payload);
    return data; // UserOut
  },

  /** Gửi thử digest ngay cho chính mình */
  async runDigestNow() {
    const { data } = await api.post('/me/digest/run-now');
    return data; // DigestRunResult
  },
};
