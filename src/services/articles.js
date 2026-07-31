// src/services/articles.js
import api from './api';

export const articlesService = {
  /**
   * Lấy danh sách bài viết / dashboard / search
   * @param {Object} params - { q, source_id, source_type, only_my_keywords, date_from, date_to, sort, page, size }
   */
  async getArticles(params = {}) {
    const { data } = await api.get('/articles', { params });
    return data; // ArticlePage: { items, total, page, size }
  },

  /** Lấy chi tiết 1 bài viết theo ID */
  async getArticle(articleId) {
    const { data } = await api.get(`/articles/${articleId}`);
    return data; // ArticleCard
  },

  /** Lấy danh sách bookmark của user */
  async getBookmarks() {
    const { data } = await api.get('/articles/bookmarks');
    return data; // BookmarkOut[]
  },

  /** Thêm bookmark */
  async addBookmark(articleId, folder = 'default') {
    const { data } = await api.post('/articles/bookmarks', { article_id: articleId, folder });
    return data; // BookmarkOut
  },

  /** Xóa bookmark */
  async removeBookmark(articleId) {
    await api.delete(`/articles/bookmarks/${articleId}`);
  },

  /** Đánh dấu đã đọc */
  async markRead(articleId) {
    await api.post(`/articles/${articleId}/read`);
  },
};
