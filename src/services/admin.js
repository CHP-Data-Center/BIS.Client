// src/services/admin.js
import api from './api';
import { apiCache } from '../utils/apiCache';

export const adminService = {
  /**
   * Toàn bộ dự án theo dõi của MỌI tài khoản (chỉ super admin).
   * Người dùng thêm/sửa là hiện ngay — không có bước phê duyệt; tab này để quản trị xem lại.
   */
  async getAllProjects({ q, status, sector, ownerId, page = 1, size = 20 } = {}) {
    const params = { page, size };
    if (q) params.q = q;
    if (status) params.status = status;
    if (sector) params.sector = sector;
    if (ownerId) params.owner_id = ownerId;
    const { data } = await api.get('/admin/projects', { params });
    return data; // { items, total, page, size }
  },

  /** Sửa dự án của bất kỳ tài khoản nào */
  async updateAnyProject(projectId, patch) {
    const { data } = await api.patch(`/admin/projects/${projectId}`, patch);
    return data;
  },

  /** Xóa dự án của bất kỳ tài khoản nào (xóa kèm liên kết mục tiềm năng) */
  async deleteAnyProject(projectId) {
    await api.delete(`/admin/projects/${projectId}`);
  },

  // ── Users ──────────────────────────────────────────────────────
  async getUsers() {
    const { data } = await api.get('/admin/users');
    return data;
  },
  async createUser(payload) {
    const { data } = await api.post('/admin/users', payload);
    return data;
  },
  async updateUser(userId, payload) {
    const { data } = await api.put(`/admin/users/${userId}`, payload);
    return data;
  },
  async deleteUser(userId) {
    await api.delete(`/admin/users/${userId}`);
  },

  // ── Sources ─────────────────────────────────────────────────────
  async getSources(force = false) {
    const cacheKey = 'admin:sources';
    if (!force) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }
    const { data } = await api.get('/admin/sources');
    apiCache.set(cacheKey, data, 5000);
    return data;
  },
  async getPendingSources(force = false) {
    const cacheKey = 'admin:sources:pending';
    if (!force) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }
    const { data } = await api.get('/admin/sources/pending');
    apiCache.set(cacheKey, data, 5000);
    return data;
  },
  async approveSource(sourceId) {
    apiCache.clear('admin:sources:pending');
    apiCache.clear('admin:sources');
    const { data } = await api.post(`/admin/sources/${sourceId}/approve`);
    return data;
  },
  async rejectSource(sourceId) {
    apiCache.clear('admin:sources:pending');
    apiCache.clear('admin:sources');
    await api.post(`/admin/sources/${sourceId}/reject`);
  },
  async createSource(payload) {
    apiCache.clear('admin:sources');
    const { data } = await api.post('/admin/sources', payload);
    return data;
  },
  async updateSource(sourceId, payload) {
    apiCache.clear('admin:sources');
    const { data } = await api.put(`/admin/sources/${sourceId}`, payload);
    return data;
  },
  async deleteSource(sourceId) {
    apiCache.clear('admin:sources');
    await api.delete(`/admin/sources/${sourceId}`);
  },
  async crawlNow() {
    const { data } = await api.post('/admin/sources/crawl-now');
    return data; // { status, message }
  },
  async getCrawlStatus(force = false) {
    const cacheKey = 'admin:sources:status';
    if (!force) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }
    const { data } = await api.get('/admin/sources/status');
    apiCache.set(cacheKey, data, 3000);
    return data; // { is_crawling: boolean }
  },
  async getCrawlLogs() {
    const { data } = await api.get('/admin/sources/logs');
    return data;
  },


  // ── Blacklist ───────────────────────────────────────────────────
  async getBlacklist() {
    const { data } = await api.get('/admin/blacklist');
    return data;
  },
  async addBlacklist(term) {
    const { data } = await api.post('/admin/blacklist', { term });
    return data;
  },
  async deleteBlacklist(id) {
    await api.delete(`/admin/blacklist/${id}`);
  },

  // ── Whitelist ───────────────────────────────────────────────────
  async getWhitelist() {
    const { data } = await api.get('/admin/whitelist');
    return data;
  },
  async addWhitelist(term) {
    const { data } = await api.post('/admin/whitelist', { term });
    return data;
  },
  async deleteWhitelist(id) {
    await api.delete(`/admin/whitelist/${id}`);
  },

  // ── Digest ──────────────────────────────────────────────────────
  async runDigestAll() {
    const { data } = await api.post('/admin/digest/run-now');
    return data;
  },

  // ── ODA & Procurement Crawlers ──────────────────────────────────
  async crawlWorldBank(rows = 100) {
    const { data } = await api.post('/admin/oda/crawl-worldbank', null, { params: { rows } });
    return data;
  },

  async crawlAdb() {
    const { data } = await api.post('/admin/oda/crawl-adb');
    return data;
  },

  async crawlDauthau(kind = 'all', q = '', pages = 1) {
    const { data } = await api.post('/admin/oda/crawl-dauthau', null, { params: { kind, q, pages } });
    return data;
  },

  async crawlMuasamcong() {
    const { data } = await api.post('/admin/oda/crawl-muasamcong');
    return data;
  },

  async resolveMuasamcongUrls(kind = 'notice', limit = 50) {
    const { data } = await api.post('/admin/oda/resolve-muasamcong-urls', null, { params: { kind, limit } });
    return data;
  },

  async enrichProcurementDetails(limit = 20) {
    const { data } = await api.post('/admin/oda/enrich-procurement-details', null, { params: { limit } });
    return data;
  },

  async enrichAdbDetails(limit = 20) {
    const { data } = await api.post('/admin/oda/enrich-adb-details', null, { params: { limit } });
    return data;
  },
};

