// src/services/ai.js
import api from './api';

export const aiService = {
  /**
   * Hỏi trợ lý AI
   * @param {string} question
   * @param {number|null} conversationId — hỏi tiếp trong hội thoại cũ; bỏ trống = mở hội thoại mới
   * @returns {Promise<{ answer, agent, sources[], conversation_id }>}
   * @throws 503 nếu server chưa cấu hình Gemini
   */
  async ask(question, conversationId = null) {
    // AI (RAG) chậm: flash ~13-16s, pro ~15-24s → timeout riêng 60s (global api = 15s).
    // Server để gemini_timeout_seconds=50 (< 60s này) nên server luôn kịp báo lỗi rõ ràng.
    const { data } = await api.post(
      '/ai/ask',
      { question, conversation_id: conversationId ?? null },
      { timeout: 60000 },
    );
    return data; // AiAnswer
  },

  /** Trạng thái trợ lý AI: { configured: boolean }. */
  async status() {
    const { data } = await api.get('/ai/status');
    return data;
  },

  // ── Lịch sử chat (server chỉ trả hội thoại của chính người đang đăng nhập) ──

  /** Danh sách hội thoại: [{ id, title, message_count, created_at, updated_at }]. */
  async conversations() {
    const { data } = await api.get('/ai/conversations');
    return data;
  },

  /** Chi tiết 1 hội thoại kèm các lượt trao đổi. 404 nếu không phải của mình. */
  async conversation(id) {
    const { data } = await api.get(`/ai/conversations/${id}`);
    return data;
  },

  /** Đổi tên hội thoại. */
  async renameConversation(id, title) {
    const { data } = await api.patch(`/ai/conversations/${id}`, { title });
    return data;
  },

  /** Xóa 1 hội thoại (xóa luôn tin nhắn bên trong). */
  async deleteConversation(id) {
    await api.delete(`/ai/conversations/${id}`);
  },

  /** Xóa toàn bộ lịch sử của chính mình → { deleted: number }. */
  async clearConversations() {
    const { data } = await api.delete('/ai/conversations');
    return data;
  },
};
