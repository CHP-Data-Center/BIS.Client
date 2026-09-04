import api from './api';
import { apiCache } from '../utils/apiCache';

// Tải file: KHÔNG tự đặt Content-Type. Instance axios mặc định application/json, mà
// multipart bắt buộc phải kèm `boundary` do trình duyệt sinh — đặt tay là hỏng request.
// Gán undefined để axios xóa header mặc định rồi tự tính lại theo FormData.
const UPLOAD_CONFIG = {
  headers: { 'Content-Type': undefined },
  // Trích chữ từ PDF/DOCX vài chục trang lâu hơn hẳn một request thường (mặc định 15s).
  timeout: 120000,
};

export const projectsService = {
  /** Danh sách dự án đang theo dõi (mảng phẳng) có cache */
  async getProjects(force = false) {
    const cacheKey = 'user_tracked_projects';
    if (!force) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }
    const { data } = await api.get('/projects');
    apiCache.set(cacheKey, data, 300000); // 5 phút
    return data; // TrackedProjectOut[]
  },

  /** Lấy nhanh từ cache nếu có */
  getCachedProjects() {
    return apiCache.get('user_tracked_projects');
  },

  /** Danh sách có lọc + phân trang */
  async searchProjects({ status, sector, origin, q, page = 1, size = 50 } = {}) {
    const params = { page, size };
    if (status) params.status = status;
    if (sector) params.sector = sector;
    if (origin) params.origin = origin;
    if (q) params.q = q;
    const { data } = await api.get('/projects/search', { params });
    return data; // { items, total, page, size }
  },

  /** Tổng hợp cho Dashboard: mỗi dự án + nhịp tin gần đây */
  async getSummary(days = 7, limit = 50) {
    const { data } = await api.get('/projects/summary', { params: { days, limit } });
    return data; // { days, items, total }
  },

  /** Xóa cache dự án theo dõi để buộc tải mới */
  invalidateCache() {
    apiCache.clear('user_tracked_projects');
  },

  /**
   * Thêm dự án theo dõi.
   * @param {{name, keyword_filter, investor?, sector?, province?, status?, note?}} payload
   */
  async createProject(payload) {
    const { data } = await api.post('/projects', payload);
    const cached = apiCache.get('user_tracked_projects');
    if (Array.isArray(cached)) {
      apiCache.set('user_tracked_projects', [data, ...cached], 300000);
    } else {
      apiCache.clear('user_tracked_projects');
    }
    return data; // TrackedProjectOut (201)
  },

  /** Sửa dự án — CHỈ gửi trường thật sự đổi, không gửi null để "xóa" */
  async updateProject(id, patch) {
    const { data } = await api.patch(`/projects/${id}`, patch);
    const cached = apiCache.get('user_tracked_projects');
    if (Array.isArray(cached)) {
      apiCache.set(
        'user_tracked_projects',
        cached.map((p) => (p.id === id ? data : p)),
        300000
      );
    } else {
      apiCache.clear('user_tracked_projects');
    }
    return data;
  },

  /** Xóa dự án theo dõi */
  async deleteProject(id) {
    await api.delete(`/projects/${id}`);
    const cached = apiCache.get('user_tracked_projects');
    if (Array.isArray(cached)) {
      apiCache.set(
        'user_tracked_projects',
        cached.filter((p) => p.id !== id),
        300000
      );
    } else {
      apiCache.clear('user_tracked_projects');
    }
  },

  /** Timeline bài viết của dự án */
  async getTimeline(id, limit = 100) {
    const { data } = await api.get(`/projects/${id}/timeline`, { params: { limit } });
    return data; // ProjectTimeline
  },

  /** Mô tả các cột file Excel cần chuẩn bị */
  async getImportTemplate() {
    const { data } = await api.get('/projects/import-template');
    return data; // ImportTemplate
  },

  /** Nhập danh sách dự án từ .xlsx — TẠO THẲNG dự án theo dõi */
  async importExcel(file) {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/projects/imports', form, UPLOAD_CONFIG);
    apiCache.clear('user_tracked_projects');
    return data; // { row_total, row_created, row_skipped, row_failed, errors[] }
  },

  /**
   * Trích tên dự án từ hồ sơ năng lực (.pdf/.docx/.txt).
   * CHỈ GỢI Ý — người dùng chọn rồi mới gọi createProject cho từng mục.
   */
  async extractFromProfile(file) {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/projects/extractions', form, UPLOAD_CONFIG);
    return data; // { filename, char_count, candidates[], note }
  },

  /**
   * Rút vài từ khóa ngắn từ tên dự án (AI chọn nếu có, luật nếu không — server quyết).
   * Trả { keywords[], keyword_filter, source: 'ai'|'rules' }.
   */
  async extractKeywords(title) {
    const { data } = await api.post('/projects/extract-keywords', { title });
    return data;
  },
};
