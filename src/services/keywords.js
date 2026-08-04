// src/services/keywords.js
import api from './api';
import { apiCache } from '../utils/apiCache';

export const keywordsService = {
  /** Danh sách từ khóa của user */
  async getKeywords(force = false) {
    const cacheKey = 'keywords:all';
    if (!force) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }
    const { data } = await api.get('/keywords');
    apiCache.set(cacheKey, data, 10000); // cache 10s
    return data; // KeywordOut[]
  },

  /**
   * Thêm từ khóa mới (tối đa 50)
   * @param {{ term, category_id?, lang?, is_primary? }} payload
   */
  async createKeyword(payload) {
    apiCache.clear('keywords:all');
    const { data } = await api.post('/keywords', payload);
    return data; // KeywordOut (201)
  },

  /**
   * Cập nhật từ khóa
   * @param {number} id
   * @param {{ term?, category_id?, lang?, is_primary? }} payload
   */
  async updateKeyword(id, payload) {
    apiCache.clear('keywords:all');
    const { data } = await api.put(`/keywords/${id}`, payload);
    return data; // KeywordOut
  },

  /** Xóa từ khóa */
  async deleteKeyword(id) {
    apiCache.clear('keywords:all');
    await api.delete(`/keywords/${id}`);
  },
};

