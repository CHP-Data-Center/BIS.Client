// src/services/ai.js
import api from './api';

export const aiService = {
  /**
   * Hỏi trợ lý AI
   * @param {string} question
   * @returns {Promise<{ answer, agent, sources[] }>}
   * @throws 503 nếu server chưa cấu hình Gemini
   */
  async ask(question) {
    // AI (RAG) chậm: flash ~13-16s, pro ~15-24s → timeout riêng 60s (global api = 15s).
    // Server để gemini_timeout_seconds=50 (< 60s này) nên server luôn kịp báo lỗi rõ ràng.
    const { data } = await api.post('/ai/ask', { question }, { timeout: 60000 });
    return data; // AiAnswer
  },

  /** Trạng thái trợ lý AI: { configured: boolean }. */
  async status() {
    const { data } = await api.get('/ai/status');
    return data;
  },
};
