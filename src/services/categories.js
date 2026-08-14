// src/services/categories.js
import api from './api';
import { apiCache } from '../utils/apiCache';
import { currentLang } from './articles';

export const categoriesService = {
  /** Danh sách categories dùng cho dropdown gán từ khóa */
  async getCategories(force = false) {
    const lang0 = currentLang();
    const cacheKey = `categories:all:${lang0}`;
    if (!force) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }
    const lang = currentLang();
    const { data } = await api.get('/categories', { params: lang === 'vi' ? {} : { lang } });
    apiCache.set(cacheKey, data, 60000); // cache 60s
    return data; // CategoryOut[]
  },
};

