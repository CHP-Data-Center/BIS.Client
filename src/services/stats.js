// src/services/stats.js
import api from './api';
import { apiCache } from '../utils/apiCache';

function getUserStatsKey(base) {
  try {
    const raw = localStorage.getItem('bis_user');
    const u = raw ? JSON.parse(raw) : null;
    return `${base}:${u?.id || 'anon'}`;
  } catch {
    return base;
  }
}

export const statsService = {
  /** Tổng quan dashboard (scoped theo user để không nhảy số giữa các tài khoản) */
  async getOverview(force = false) {
    const cacheKey = getUserStatsKey('stats:overview');
    if (!force) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }
    const { data } = await api.get('/stats/overview');
    apiCache.set(cacheKey, data, 30000); // cache 30s
    return data; // StatsOverview
  },

  /** Từ khóa nổi bật theo số bài khớp */
  async getTrending(limit = 10, force = false) {
    const cacheKey = getUserStatsKey(`stats:trending:${limit}`);
    if (!force) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }
    const { data } = await api.get('/stats/trending', { params: { limit } });
    apiCache.set(cacheKey, data, 30000); // cache 30s
    return data; // TrendingTerm[]
  },
};
