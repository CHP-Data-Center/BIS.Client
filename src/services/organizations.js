// src/services/organizations.js
// Đa tổ chức + phân quyền (ADR-005). Super admin quản tổ chức; org admin quản phạm vi + user.
import api from './api';

export const orgService = {
  // ── Super admin: tổ chức ─────────────────────────────────────────
  async listOrganizations() {
    const { data } = await api.get('/admin/organizations');
    return data; // OrganizationOut[]
  },
  async createOrganization(payload) {
    const { data } = await api.post('/admin/organizations', payload); // { name, slug? }
    return data;
  },
  async updateOrganization(orgId, payload) {
    const { data } = await api.put(`/admin/organizations/${orgId}`, payload); // { name?, is_active? }
    return data;
  },
  async deleteOrganization(orgId) {
    await api.delete(`/admin/organizations/${orgId}`);
  },
  async createOrgAdmin(orgId, payload) {
    const { data } = await api.post(`/admin/organizations/${orgId}/admins`, payload);
    return data; // UserOut (role=admin)
  },
  async assignOrgAdmin(orgId, userId) {
    const { data } = await api.post(`/admin/organizations/${orgId}/assign-admin/${userId}`);
    return data;
  },
  async listOrgUsers(orgId) {
    const { data } = await api.get(`/admin/organizations/${orgId}/users`);
    return data; // UserOut[]
  },
  async getOrgScopeSuper(orgId) {
    const { data } = await api.get(`/admin/organizations/${orgId}/scope`);
    return data; // { organization_id, sources, countries, keywords }
  },
  async setOrgScopeSuper(orgId, payload) {
    const { data } = await api.put(`/admin/organizations/${orgId}/scope`, payload);
    return data;
  },

  // ── Org admin: tổ chức MÌNH ───────────────────────────────────────
  async getMyScope() {
    const { data } = await api.get('/org/scope');
    return data;
  },
  async setMyScope(payload) {
    const { data } = await api.put('/org/scope', payload); // { sources[], countries[], keywords[] }
    return data;
  },
  async listMyUsers() {
    const { data } = await api.get('/org/users');
    return data;
  },
  async createMyUser(payload) {
    const { data } = await api.post('/org/users', payload); // { email, password, display_name?, role }
    return data;
  },
  async updateMyUser(userId, payload) {
    const { data } = await api.put(`/org/users/${userId}`, payload);
    return data;
  },
  async deleteMyUser(userId) {
    await api.delete(`/org/users/${userId}`);
  },
};
