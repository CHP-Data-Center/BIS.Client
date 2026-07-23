// src/services/projects.js
import api from './api';

export const projectsService = {
  /** Danh sách dự án đang theo dõi */
  async getProjects() {
    const { data } = await api.get('/projects');
    return data; // TrackedProjectOut[]
  },

  /**
   * Thêm dự án theo dõi
   * @param {{ name, keyword_filter }} payload
   */
  async createProject(payload) {
    const { data } = await api.post('/projects', payload);
    return data; // TrackedProjectOut (201)
  },

  /** Xóa dự án theo dõi */
  async deleteProject(id) {
    await api.delete(`/projects/${id}`);
  },

  /** Timeline bài viết của dự án */
  async getTimeline(id, limit = 100) {
    const { data } = await api.get(`/projects/${id}/timeline`, { params: { limit } });
    return data; // ProjectTimeline
  },
};
