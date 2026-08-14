// src/services/keywordSuggestions.js
// Từ khóa do AI trích từ tin đã crawl — admin duyệt mới thành từ khóa thật.
import api from './api';

export const keywordSuggestionsService = {
  /** Danh sách gợi ý theo trạng thái: pending | approved | rejected | all */
  async list(status = 'pending', limit = 100) {
    const { data } = await api.get('/admin/keyword-suggestions', { params: { status, limit } });
    return data; // KeywordSuggestionOut[]
  },

  /** Cho AI đọc tin mới nhất và đề xuất từ khóa mới (chỉ tạo gợi ý). */
  async generate(sampleSize = 40) {
    const { data } = await api.post('/admin/keyword-suggestions/generate', null, {
      params: { sample_size: sampleSize },
      timeout: 240000, // AI đọc hàng chục tiêu đề — chậm hơn request thường nhiều
    });
    return data; // { created, pending }
  },

  /** Duyệt → tạo từ khóa thật cho admin. */
  async approve(id) {
    const { data } = await api.post(`/admin/keyword-suggestions/${id}/approve`);
    return data;
  },

  /** Bỏ qua → AI không gợi ý lại từ khóa này. */
  async reject(id) {
    const { data } = await api.post(`/admin/keyword-suggestions/${id}/reject`);
    return data;
  },
};
