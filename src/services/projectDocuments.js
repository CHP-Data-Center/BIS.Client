// src/services/projectDocuments.js
// Tài liệu dự án / biên bản (.DOCX, .PDF) và bài đăng kèm quyền riêng tư (MoM 15/09/2026).
//
// MỌI thứ lưu ở máy chủ (/project-documents): thông tin, file gốc và quyền riêng tư. Không
// dùng localStorage — ở đó "Tổ chức"/"Công khai" không tới được máy của đồng nghiệp, còn
// "Chỉ mình tôi" lại hiện cho tài khoản khác đăng nhập trên cùng trình duyệt. Quyền xem do
// máy chủ lọc (của mình / cùng tổ chức đang hoạt động / công khai).
import api from './api';

// multipart: để trình duyệt tự đặt Content-Type kèm boundary (xem services/projects.js).
const UPLOAD_CONFIG = {
  headers: { 'Content-Type': undefined },
  // Đọc PDF/DOCX và tóm tắt bằng AI lâu hơn request thường.
  timeout: 120000,
};

/** Định dạng máy chủ nhận (app/services/project_document_service.py: ALLOWED_TYPES). */
export const DOCUMENT_EXTENSIONS = ['.docx', '.pdf'];
export const DOCUMENT_ACCEPT = DOCUMENT_EXTENSIONS.join(',');
/** Giới hạn dung lượng của máy chủ (MAX_DOCUMENT_BYTES) — kiểm trước để khỏi tải lên vô ích. */
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;

/** Lý do file không đăng được, hoặc null nếu hợp lệ. */
export function documentFileProblem(file) {
  if (!file) return 'Vui lòng chọn file tài liệu (.DOCX hoặc .PDF).';
  const name = (file.name || '').toLowerCase();
  if (!DOCUMENT_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return `"${file.name}" không đúng định dạng. Hệ thống nhận .DOCX và .PDF (không nhận .DOC — hãy lưu lại dưới dạng .DOCX).`;
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return `"${file.name}" quá lớn (${(file.size / 1024 / 1024).toFixed(1)} MB). Giới hạn 15 MB.`;
  }
  return null;
}

/** Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD. `toISOString()` là giờ UTC nên trước
 *  07:00 sáng sẽ ra ngày hôm trước. */
export function todayVN() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
}

/** Thông điệp lỗi đọc được từ phản hồi API. */
export function apiErrorMessage(err, fallback) {
  // 413 do proxy (nginx) trả kèm trang HTML, không có `detail`.
  if (err?.response?.status === 413) return 'File quá lớn, máy chủ từ chối nhận. Giới hạn 15 MB.';
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string' && detail) return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return fallback;
}

/** Chuẩn hóa tài liệu máy chủ trả về thành một mục hiển thị trên thẻ / danh sách. */
export function documentToItem(doc) {
  return {
    ...doc,
    kind: 'project_document',
    ref: String(doc.id),
    is_project_document: true,
    title: doc.project_name,
    province: doc.location,
    date: doc.doc_date,
    summaryDate: doc.summary_date,
    createdAt: doc.created_at,
    privacy: doc.visibility, // private | organization | public
    authorName: doc.owner_name,
  };
}

export const projectDocumentsService = {
  /** Trích tên dự án, vị trí, tóm tắt, ngày từ file. KHÔNG lưu gì. */
  async extract(file, { ai = true } = {}) {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post(
      `/project-documents/extractions?ai=${ai ? 'true' : 'false'}`, form, UPLOAD_CONFIG
    );
    return data; // ProjectDocumentExtraction
  },

  /** Đăng SAU KHI người dùng đã duyệt: lưu thông tin + file gốc. */
  async create(file, fields) {
    const form = new FormData();
    form.append('file', file);
    Object.entries(fields).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') form.append(k, String(v));
    });
    const { data } = await api.post('/project-documents', form, UPLOAD_CONFIG);
    return data; // ProjectDocumentOut
  },

  /** Tài liệu được xem. params: q, location, visibility, mine, tracked_project_id, page, size */
  async list(params = {}) {
    const query = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '' && v !== false) query[k] = v;
    });
    const { data } = await api.get('/project-documents', { params: query });
    return data; // { items, total, page, size }
  },

  async update(id, patch) {
    const { data } = await api.patch(`/project-documents/${id}`, patch);
    return data;
  },

  async remove(id) {
    await api.delete(`/project-documents/${id}`);
  },

  /** Tải file gốc về máy (cần token nên không mở link trực tiếp được). */
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
