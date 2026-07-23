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
    const { data } = await api.post('/ai/ask', { question });
    return data; // AiAnswer
  },
};
