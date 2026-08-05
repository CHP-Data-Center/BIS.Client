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
    // AI (RAG + gemini-2.5-flash) chậm ~13-16s → timeout riêng 25s (global api = 15s).
    const { data } = await api.post('/ai/ask', { question }, { timeout: 25000 });
    return data; // AiAnswer
  },

  /** Trạng thái trợ lý AI: { configured: boolean }. */
  async status() {
    const { data } = await api.get('/ai/status');
    return data;
  },
};
