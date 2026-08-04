// src/services/categories.js
import api from './api';
import { apiCache } from '../utils/apiCache';

export const categoriesService = {
  /** Danh sách categories dùng cho dropdown gán từ khóa */
  async getCategories(force = false) {
    const cacheKey = 'categories:all';
    if (!force) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }
    const { data } = await api.get('/categories');
    apiCache.set(cacheKey, data, 60000); // cache 60s
    return data; // CategoryOut[]
  },
};

