// src/services/stats.js
import api from './api';
import { apiCache } from '../utils/apiCache';

export const statsService = {
  /** Tổng quan dashboard */
  async getOverview(force = false) {
    const cacheKey = 'stats:overview';
    if (!force) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }
    const { data } = await api.get('/stats/overview');
    apiCache.set(cacheKey, data, 30000); // cache 30 giây
    return data; // StatsOverview
  },

  /** Từ khóa nổi bật theo số bài khớp */
  async getTrending(limit = 10, force = false) {
    const cacheKey = `stats:trending:${limit}`;
    if (!force) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }
    const { data } = await api.get('/stats/trending', { params: { limit } });
    apiCache.set(cacheKey, data, 30000); // cache 30 giây
    return data; // TrendingTerm[]
  },
};

