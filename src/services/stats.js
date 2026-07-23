// src/services/stats.js
import api from './api';

export const statsService = {
  /** Tổng quan dashboard */
  async getOverview() {
    const { data } = await api.get('/stats/overview');
    return data; // StatsOverview
  },

  /** Từ khóa nổi bật theo số bài khớp */
  async getTrending(limit = 10) {
    const { data } = await api.get('/stats/trending', { params: { limit } });
    return data; // TrendingTerm[]
  },
};
