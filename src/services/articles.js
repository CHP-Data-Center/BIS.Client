// src/services/articles.js
import api from './api';
import { apiCache } from '../utils/apiCache';

export const articlesService = {
  /**
   * Lấy danh sách bài viết / dashboard / search (có deduplication cache 5s chống spam request trùng)
   * @param {Object} params - { q, source_id, source_type, only_my_keywords, date_from, date_to, sort, page, size }
   * @param {boolean} force - Bỏ qua cache khi bấm nút Làm mới
   */
  async getArticles(params = {}, force = false) {
    const cacheKey = `articles:${JSON.stringify(params)}`;
    if (!force) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }
    const { data } = await api.get('/articles', { params });
    apiCache.set(cacheKey, data, 5000); // cache 5s để chống duplicate GET call liên tiếp
    return data; // ArticlePage: { items, total, page, size }
  },

  /** Lấy chi tiết 1 bài viết theo ID */
  async getArticle(articleId, force = false) {
    const cacheKey = `articles:detail:${articleId}`;
    if (!force) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }
    const { data } = await api.get(`/articles/${articleId}`);
    apiCache.set(cacheKey, data, 30000); // cache 30s
    return data; // ArticleCard
  },

  /** Lấy danh sách bookmark của user */
  async getBookmarks(force = false) {
    const cacheKey = 'articles:bookmarks';
    if (!force) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }
    const { data } = await api.get('/articles/bookmarks');
    apiCache.set(cacheKey, data, 5000); // cache 5s
    return data; // BookmarkOut[]
  },

  /** Thêm bookmark */
  async addBookmark(articleId, folder = 'default') {
    apiCache.clear('articles:bookmarks');
    const { data } = await api.post('/articles/bookmarks', { article_id: articleId, folder });
    return data; // BookmarkOut
  },

  /** Xóa bookmark */
  async removeBookmark(articleId) {
    apiCache.clear('articles:bookmarks');
    await api.delete(`/articles/bookmarks/${articleId}`);
  },

  /** Đánh dấu đã đọc */
  async markRead(articleId) {
    await api.post(`/articles/${articleId}/read`);
  },
};

