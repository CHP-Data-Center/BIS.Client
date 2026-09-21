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
   * @param {{name, keyword_filter, investor?, investor_url?, sector?, province?, status?, note?}} payload
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

  /** Tải file Excel mẫu chuẩn (.xlsx) */
  async downloadSampleExcel() {
    const response = await api.get('/projects/import-template/download', {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Mau_theo_doi_du_an_BIS.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  /** Xuất danh sách dự án đang theo dõi ra file .xlsx */
  async exportProjectsExcel() {
    const response = await api.get('/projects/export', {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Danh_sach_du_an_theo_doi_BIS.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  /** Nhập danh sách dự án từ .xlsx — TẠO THẲNG dự án theo dõi */
  async importExcel(file) {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/projects/imports', form, UPLOAD_CONFIG);
    apiCache.clear('user_tracked_projects');
    return data; // { row_total, row_created, row_skipped, row_failed, errors[] }
  },

  /** Xem trước file Excel trước khi nhập */
  async previewImportExcel(file) {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/projects/imports/preview', form, UPLOAD_CONFIG);
    return data; // ExcelPreviewResult: { filename, total_rows, valid_rows, duplicate_rows, error_rows, rows }
  },

  /** Xác nhận nhập các dòng đã xem trước và chỉnh sửa */
  async confirmImportExcel(items, filename) {
    const { data } = await api.post('/projects/imports/confirm', { items, filename });
    apiCache.clear('user_tracked_projects');
    return data; // ProjectImportResult
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

  /** Chi tiết một dự án theo dõi */
  async getProject(id) {
    const { data } = await api.get(`/projects/${id}`);
    return data; // TrackedProjectOut
  },

  /**
   * Ô chọn dự án đang theo dõi: bản gọn (id, tên, vị trí, lĩnh vực, thời gian, trạng thái).
   * Lọc KHÔNG DẤU ở máy chủ — có fallback tự lọc nếu server chưa hỗ trợ.
   */
  async lookupProjects(q, limit = 10) {
    try {
      const { data } = await api.get('/projects/lookup', { params: { q: q || undefined, limit } });
      return data;
    } catch {
      // Fallback: lấy từ danh sách dự án và tự lọc không dấu
      const list = (await this.getProjects()) || [];
      if (!q || !q.trim()) return list.slice(0, limit);
      const clean = q
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .toLowerCase()
        .trim();
      const matched = list.filter((p) => {
        const n = (p.name || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[đĐ]/g, 'd')
          .toLowerCase();
        const prov = (p.province || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[đĐ]/g, 'd')
          .toLowerCase();
        return n.includes(clean) || prov.includes(clean);
      });
      return matched.slice(0, limit);
    }
  },

  /** Mọi liên kết "mục tiềm năng ↔ dự án theo dõi" của tài khoản (một lượt cho cả trang) */
  async getPotentialLinks() {
    let localLinks = [];
    try {
      const raw = localStorage.getItem('bis_potential_links');
      localLinks = raw ? JSON.parse(raw) : [];
    } catch {
      localLinks = [];
    }

    try {
      const { data } = await api.get('/projects/potential-links');
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      return localLinks;
    } catch {
      return localLinks;
    }
  },

  /** Gắn một mục tiềm năng vào dự án theo dõi; bỏ trống display_name = lấy tên dự án */
  async addPotentialLink(projectId, payload) {
    try {
      const { data } = await api.post(`/projects/${projectId}/potential-links`, payload);
      return data; // PotentialLinkOut
    } catch {
      const links = (await this.getPotentialLinks()) || [];
      const newLink = {
        id: Date.now(),
        tracked_project_id: projectId,
        kind: payload.kind,
        ref: payload.ref,
        display_name: payload.title_snapshot || null,
        source_url: payload.source_url || null,
        created_at: new Date().toISOString(),
      };
      const updated = [newLink, ...links.filter((l) => !(l.kind === payload.kind && l.ref === payload.ref))];
      localStorage.setItem('bis_potential_links', JSON.stringify(updated));
      return newLink;
    }
  },

  /** Gỡ liên kết */
  async removePotentialLink(projectId, linkId) {
    try {
      await api.delete(`/projects/${projectId}/potential-links/${linkId}`);
    } catch {
      const links = (await this.getPotentialLinks()) || [];
      const updated = links.filter((l) => l.id !== linkId);
      localStorage.setItem('bis_potential_links', JSON.stringify(updated));
    }
  },
};
