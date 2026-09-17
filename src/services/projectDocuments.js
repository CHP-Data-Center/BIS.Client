import api from './api';

// multipart: để trình duyệt tự đặt Content-Type kèm boundary (xem services/projects.js).
const UPLOAD_CONFIG = {
  headers: { 'Content-Type': undefined },
  // Đọc PDF/DOCX và tóm tắt bằng AI lâu hơn request thường.
  timeout: 120000,
};

/** Tài liệu dự án: trích xuất → duyệt → đăng (MoM 15/09/2026). */
export const projectDocumentsService = {
  async extract(file, { ai = true } = {}) {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post(`/project-documents/extractions?ai=${ai ? 'true' : 'false'}`, form, UPLOAD_CONFIG);
    return data;
  },

  async create(file, fields) {
    const form = new FormData();
    form.append('file', file);
    Object.entries(fields).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') form.append(k, String(v));
    });
    const { data } = await api.post('/project-documents', form, UPLOAD_CONFIG);
    return data;
  },

  async list(params = {}) {
    const query = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '' && v !== false) query[k] = v;
    });
    const { data } = await api.get('/project-documents', { params: query });
    return data;
  },

  async update(id, patch) {
    const { data } = await api.patch(`/project-documents/${id}`, patch);
    return data;
  },

  async remove(id) {
    await api.delete(`/project-documents/${id}`);
  },

  /** Tải file về máy (cần token nên không mở link trực tiếp được). */
  async download(doc) {
    const resp = await api.get(`/project-documents/${doc.id}/file`, {
      responseType: 'blob',
      timeout: 120000,
    });
    const url = URL.createObjectURL(resp.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.filename || 'tai-lieu';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  },
};
