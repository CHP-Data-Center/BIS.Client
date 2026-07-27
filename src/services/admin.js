// src/services/admin.js
import api from './api';

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
  async getSources() {
    const { data } = await api.get('/admin/sources');
    return data;
  },
  async getPendingSources() {
    const { data } = await api.get('/admin/sources/pending');
    return data;
  },
  async approveSource(sourceId) {
    const { data } = await api.post(`/admin/sources/${sourceId}/approve`);
    return data;
  },
  async rejectSource(sourceId) {
    await api.post(`/admin/sources/${sourceId}/reject`);
  },
  async createSource(payload) {
    const { data } = await api.post('/admin/sources', payload);
    return data;
  },
  async updateSource(sourceId, payload) {
    const { data } = await api.put(`/admin/sources/${sourceId}`, payload);
    return data;
  },
  async deleteSource(sourceId) {
    await api.delete(`/admin/sources/${sourceId}`);
  },
  async crawlNow() {
    const { data } = await api.post('/admin/sources/crawl-now');
    return data; // { total_items, total_saved }
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
