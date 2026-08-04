// src/services/admin.js
import api from './api';
import { apiCache } from '../utils/apiCache';

export const adminService = {
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
};
