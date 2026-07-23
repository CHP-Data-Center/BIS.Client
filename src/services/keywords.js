// src/services/keywords.js
import api from './api';

export const keywordsService = {
  /** Danh sách từ khóa của user */
  async getKeywords() {
    const { data } = await api.get('/keywords');
    return data; // KeywordOut[]
  },

  /**
   * Thêm từ khóa mới (tối đa 50)
   * @param {{ term, category_id?, lang?, is_primary? }} payload
   */
  async createKeyword(payload) {
    const { data } = await api.post('/keywords', payload);
    return data; // KeywordOut (201)
  },

  /**
   * Cập nhật từ khóa
   * @param {number} id
   * @param {{ term?, category_id?, lang?, is_primary? }} payload
   */
  async updateKeyword(id, payload) {
    const { data } = await api.put(`/keywords/${id}`, payload);
    return data; // KeywordOut
  },

  /** Xóa từ khóa */
  async deleteKeyword(id) {
    await api.delete(`/keywords/${id}`);
  },
};
