// src/services/keywords.js
import api from './api';
import { apiCache } from '../utils/apiCache';
import { currentLang } from './articles';

/** Xóa cache từ khóa ở MỌI ngôn ngữ (apiCache.clear khớp chính xác từng key). */
function clearKeywordCache() {
  ['vi', 'en', 'ja'].forEach((l) => apiCache.clear(`keywords:all:${l}`));
}

export const keywordsService = {
  /** Danh sách từ khóa của user (kèm display_term theo ngôn ngữ đang chọn) */
  async getKeywords(force = false) {
    const lang = currentLang();
    const cacheKey = `keywords:all:${lang}`;
    if (!force) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }
    const { data } = await api.get('/keywords', { params: lang === 'vi' ? {} : { lang } });
    apiCache.set(cacheKey, data, 10000); // cache 10s
    return data; // KeywordOut[]
  },

  /**
   * Thêm từ khóa mới (tối đa 50)
   * @param {{ term, category_id?, lang?, is_primary? }} payload
   */
  async createKeyword(payload) {
    clearKeywordCache();
    const { data } = await api.post('/keywords', payload);
    return data; // KeywordOut (201)
  },

  /**
   * Cập nhật từ khóa
   * @param {number} id
   * @param {{ term?, category_id?, lang?, is_primary? }} payload
   */
  async updateKeyword(id, payload) {
    clearKeywordCache();
    const { data } = await api.put(`/keywords/${id}`, payload);
    return data; // KeywordOut
  },

  /** Xóa từ khóa */
  async deleteKeyword(id) {
    clearKeywordCache();
    await api.delete(`/keywords/${id}`);
  },
};

