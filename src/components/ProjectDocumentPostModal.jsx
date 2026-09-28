// src/components/ProjectDocumentPostModal.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Search, Check, AlertCircle, FileText, Upload, Sparkles,
  MapPin, Calendar, Clock, Tag, Building2, Shield, Eye, Lock,
  Globe2, CheckCircle2, ArrowRight, Loader2, Edit3, Save,
  ChevronRight, RefreshCw, FileCheck, HelpCircle, Layers, Paperclip,
  Trash2
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { projectsService } from '../services/projects';
import {
  projectDocumentsService, documentFileProblem, todayVN, apiErrorMessage, DOCUMENT_ACCEPT,
} from '../services/projectDocuments';

// Chuẩn hóa chuỗi tiếng Việt không dấu
function normalizeText(text) {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fmtDate(iso) {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Cấu hình nhãn trạng thái dự án
const STATUS_CONFIG = {
  watching: { label: 'Đang theo dõi', bg: 'rgba(59, 130, 246, 0.12)', fg: '#2563eb', border: 'rgba(59, 130, 246, 0.3)' },
  active: { label: 'Đang thực hiện', bg: 'rgba(16, 185, 129, 0.12)', fg: '#059669', border: 'rgba(16, 185, 129, 0.3)' },
  completed: { label: 'Đã hoàn thành', bg: 'rgba(139, 92, 246, 0.12)', fg: '#7c3aed', border: 'rgba(139, 92, 246, 0.3)' },
  closed: { label: 'Đã đóng / Tạm dừng', bg: 'rgba(100, 116, 139, 0.12)', fg: '#475569', border: 'rgba(100, 116, 139, 0.3)' },
};

// Cấu hình quyền riêng tư — khóa trùng giá trị `visibility` của máy chủ.
const PRIVACY_CONFIG = {
  private: {
    id: 'private',
    label: 'Only me (Chỉ mình tôi)',
    desc: 'Chỉ tài khoản của bạn mới nhìn thấy bài đăng và tài liệu này',
    icon: Lock,
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.35)',
  },
  organization: {
    id: 'organization',
    label: 'Organization (Tổ chức)',
    desc: 'Các thành viên trong tổ chức / doanh nghiệp của bạn có thể xem',
    icon: Building2,
    color: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.12)',
    border: 'rgba(37, 99, 235, 0.35)',
  },
  public: {
    id: 'public',
    label: 'Public (Công khai)',
    desc: 'Công khai trên hệ thống thông tin dự án cho mọi người dùng',
    icon: Globe2,
    color: '#059669',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.35)',
  },
};

// Giá trị gốc của dự án đang theo dõi, cùng dạng với form chỉnh sửa (lĩnh vực là SLUG — máy
// chủ chỉ nhận slug, gửi tên hiển thị là bị trả 400 "Lĩnh vực không hợp lệ").
function thongTinGoc(p) {
  return {
    name: p?.name || '',
    province: p?.province || '',
    sector: p?.sector || '',
    startDate: p?.start_date || '',
    endDate: p?.end_date || '',
    status: p?.status || 'watching',
  };
}

export default function ProjectDocumentPostModal({
  open,
  onClose,
  initialProject = null,
  sectors = [],
  onPostCreated = () => {},
  onProjectUpdated = () => {},
}) {
  const { t } = useLang();
  const { user } = useAuth();

  const authorName = user?.display_name || user?.name || user?.email || 'Người dùng BIS';
  // Máy chủ từ chối quyền "Tổ chức" với tài khoản chưa thuộc tổ chức nào.
  const hasOrg = Boolean(user?.organization_id);

  // --- Danh sách dự án theo dõi và bộ lọc ---
  const [userProjects, setUserProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState(initialProject);

  // --- Chỉnh sửa thông tin dự án ---
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState(() => thongTinGoc(null));
  const [savingEdit, setSavingEdit] = useState(false);
  const [showEditApprovalModal, setShowEditApprovalModal] = useState(false);

  // --- Form Tài liệu DOCX/PDF & Trích xuất ---
  // Một file cho mỗi tài liệu: máy chủ lưu đúng một file gốc để tải lại.
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [extractionMsg, setExtractionMsg] = useState(null);

  // Các trường quản lý tài liệu / bài đăng
  const [docProjectName, setDocProjectName] = useState('');
  const [docProvince, setDocProvince] = useState('');
  const [docSummary, setDocSummary] = useState('');
  // Bài tin soạn từ tài liệu: tiêu đề kiểu báo chí + nội dung theo đoạn. `articleSource` cho
  // người đọc biết chữ này ở đâu ra (ai | rules | manual) — sửa tay thì thành manual.
  const [articleTitle, setArticleTitle] = useState('');
  const [articleBody, setArticleBody] = useState('');
  const [articleSource, setArticleSource] = useState(null);
  // Ngày ghi trong văn bản: để trống cho tới khi trích được hoặc người dùng tự nhập — điền
  // sẵn "hôm nay" là khai sai ngày của biên bản.
  const [docDate, setDocDate] = useState('');
  const [docSummaryDate, setDocSummaryDate] = useState(() => todayVN());

  // --- Đăng bài & Quyền riêng tư ---
  const [privacy, setPrivacy] = useState(hasOrg ? 'organization' : 'private');
  const [showPublishApprovalModal, setShowPublishApprovalModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const fileInputRef = useRef(null);

  const showError = (text, ms = 6000) => {
    setErrorMsg(text);
    setTimeout(() => setErrorMsg(null), ms);
  };

  const tenLinhVuc = (slug) => sectors.find((s) => s.slug === slug)?.name || slug || '';

  // Tải danh sách dự án người dùng đang theo dõi
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingProjects(true);
      try {
        const list = await projectsService.getProjects();
        if (alive) {
          setUserProjects(list || []);
          if (initialProject) setSelectedProject(initialProject);
        }
      } catch (err) {
        console.warn('Lỗi lấy danh sách dự án theo dõi:', err);
      } finally {
        if (alive) setLoadingProjects(false);
      }
    })();
    return () => { alive = false; };
  }, [initialProject]);

  // Tên / vị trí đã TỰ ĐIỀN từ dự án chọn trước: đổi sang dự án khác (hoặc vừa sửa tên dự án)
  // thì điền lại, trừ khi người dùng đã tự gõ hoặc đã trích từ file giá trị khác.
  const tuDienRef = useRef({ name: '', province: '' });

  // Đồng bộ form chỉnh sửa khi chọn dự án
  useEffect(() => {
    if (selectedProject) {
      setEditForm(thongTinGoc(selectedProject));
      const truoc = tuDienRef.current;
      const ten = selectedProject.name || '';
      const tinh = selectedProject.province || '';
      setDocProjectName((cur) => (!cur || cur === truoc.name ? ten : cur));
      setDocProvince((cur) => (!cur || cur === truoc.province ? tinh : cur));
      tuDienRef.current = { name: ten, province: tinh };
    }
  }, [selectedProject]);

  // Danh sách dự án lọc theo từ khóa tìm kiếm
  const filteredProjects = useMemo(() => {
    if (!projectSearch.trim()) return userProjects;
    const q = normalizeText(projectSearch);
    return userProjects.filter((p) => {
      const n = normalizeText(p.name);
      const pr = normalizeText(p.province);
      const s = normalizeText(p.sector_name || p.sector);
      return n.includes(q) || pr.includes(q) || s.includes(q);
    });
  }, [userProjects, projectSearch]);

  // Nhận file từ ô chọn hoặc kéo thả: kiểm định dạng/dung lượng TRƯỚC khi tải lên.
  const chonFile = (files) => {
    const list = Array.from(files || []);
    if (list.length === 0) return;
    const file = list[0];
    const loi = documentFileProblem(file);
    if (loi) {
      showError(loi);
      return;
    }
    if (list.length > 1) {
      showError(`Mỗi tài liệu đăng kèm một file — đã giữ "${file.name}".`);
    }
    setAttachedFiles([file]);
  };

  const handleFileChange = (e) => {
    chonFile(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = () => {
    setAttachedFiles([]);
  };

  // Trích xuất thông tin từ nội dung file (máy chủ đọc DOCX/PDF, tóm tắt bằng AI nếu có)
  const handleExtract = async () => {
    const file = attachedFiles[0];
    const loi = documentFileProblem(file);
    if (loi) {
      showError(loi);
      return;
    }

    setExtracting(true);
    setExtractionMsg(null);
    setErrorMsg(null);

    try {
      const res = await projectDocumentsService.extract(file);
      if (!res.char_count) {
        // PDF scan ảnh: không có chữ để trích — nói thẳng thay vì điền đoán.
        showError(res.note || 'Không đọc được chữ trong file. Vui lòng nhập thông tin thủ công.', 8000);
        return;
      }
      if (res.project_name) setDocProjectName(res.project_name);
      if (res.location) setDocProvince(res.location);
      if (res.summary) setDocSummary(res.summary);
      if (res.doc_date) setDocDate(res.doc_date);
      if (res.summary_date) setDocSummaryDate(res.summary_date);
      if (res.article_title) setArticleTitle(res.article_title);
      if (res.article_body) {
        setArticleBody(res.article_body);
        setArticleSource(res.source === 'ai' ? 'ai' : 'rules');
      }

      setExtractionMsg({
        type: 'success',
        text: `Đã trích xuất thông tin từ "${file.name}"${res.source === 'ai' ? ' (tóm tắt bằng AI)' : ''}. ${res.note || ''}`.trim(),
      });
      setTimeout(() => setExtractionMsg(null), 8000);
    } catch (err) {
      showError(apiErrorMessage(err, 'Không thể trích xuất thông tin từ tài liệu này.'));
    } finally {
      setExtracting(false);
    }
  };

  // Mở modal phê duyệt chỉnh sửa thông tin dự án
  const handleRequestEditApproval = (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      showError('Tên dự án không được để trống');
      return;
    }
    if (editForm.startDate && editForm.endDate && editForm.endDate < editForm.startDate) {
      showError('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.');
      return;
    }
    setShowEditApprovalModal(true);
  };

  // Mỗi dòng bảng duyệt chỉnh sửa: [nhãn, giá trị hiện tại, giá trị sau chỉnh sửa, đã đổi?]
  const gocDuAn = thongTinGoc(selectedProject);
  const nhanTrangThai = (st) => STATUS_CONFIG[st]?.label || st || '—';
  const dongDuyetSua = [
    ['Tên dự án', gocDuAn.name || '—', editForm.name.trim() || '—', editForm.name.trim() !== gocDuAn.name],
    ['Vị trí', gocDuAn.province || '—', editForm.province.trim() || '—', editForm.province.trim() !== gocDuAn.province],
    ['Lĩnh vực', selectedProject?.sector_name || tenLinhVuc(gocDuAn.sector) || '—', tenLinhVuc(editForm.sector) || '—', editForm.sector !== gocDuAn.sector],
    ['Ngày bắt đầu', fmtDate(gocDuAn.startDate), fmtDate(editForm.startDate), editForm.startDate !== gocDuAn.startDate],
    ['Ngày kết thúc', fmtDate(gocDuAn.endDate), fmtDate(editForm.endDate), editForm.endDate !== gocDuAn.endDate],
    ['Trạng thái', nhanTrangThai(gocDuAn.status), nhanTrangThai(editForm.status), editForm.status !== gocDuAn.status],
  ];

  // Xác nhận phê duyệt chỉnh sửa thông tin
  const handleConfirmEdit = async () => {
    if (!selectedProject?.id) return;
    // Chỉ gửi trường THẬT SỰ đổi; ô để trống = xóa giá trị (null). Gửi `undefined` như
    // trước thì người dùng không bao giờ xóa được vị trí hay ngày.
    const patch = {};
    const ten = editForm.name.trim();
    const tinh = editForm.province.trim();
    if (ten !== gocDuAn.name) patch.name = ten;
    if (tinh !== gocDuAn.province) patch.province = tinh || null;
    if (editForm.sector !== gocDuAn.sector) patch.sector = editForm.sector || null;
    if (editForm.startDate !== gocDuAn.startDate) patch.start_date = editForm.startDate || null;
    if (editForm.endDate !== gocDuAn.endDate) patch.end_date = editForm.endDate || null;
    if (editForm.status !== gocDuAn.status) patch.status = editForm.status;
    if (Object.keys(patch).length === 0) {
      setShowEditApprovalModal(false);
      setIsEditingInfo(false);
      return;
    }

    setSavingEdit(true);
    try {
      const updated = await projectsService.updateProject(selectedProject.id, patch);

      setSelectedProject(updated);
      setUserProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      onProjectUpdated(updated);

      setIsEditingInfo(false);
      setShowEditApprovalModal(false);
      setExtractionMsg({ type: 'success', text: 'Nội dung chỉnh sửa đã được phê duyệt và lưu chính thức!' });
      setTimeout(() => setExtractionMsg(null), 4000);
    } catch (err) {
      // Đóng bảng duyệt để thông báo lỗi (nằm trong khung chính) không bị che.
      setShowEditApprovalModal(false);
      showError(apiErrorMessage(err, 'Không thể lưu thay đổi.'));
    } finally {
      setSavingEdit(false);
    }
  };

  const finalTitle = docProjectName.trim() || selectedProject?.name || '';

  // Mở modal duyệt bài trước khi đăng
  const handleRequestPublishApproval = () => {
    const loiFile = documentFileProblem(attachedFiles[0]);
    if (loiFile) {
      showError(loiFile);
      return;
    }
    if (!finalTitle) {
      showError('Vui lòng nhập Tên dự án hoặc chọn một dự án theo dõi trước khi đăng bài');
      return;
    }
    if (!docSummary.trim()) {
      showError('Vui lòng nhập hoặc trích xuất tóm tắt nội dung tài liệu trước khi đăng bài');
      return;
    }
    if (privacy === 'organization' && !hasOrg) {
      showError('Tài khoản chưa thuộc tổ chức nào — chọn "Chỉ mình tôi" hoặc "Công khai".');
      return;
    }
    setShowPublishApprovalModal(true);
  };

  // Xác nhận phê duyệt: máy chủ lưu thông tin + file gốc + quyền riêng tư
  const handleConfirmPublish = async () => {
    setPublishing(true);
    setErrorMsg(null);
    try {
      const doc = await projectDocumentsService.create(attachedFiles[0], {
        project_name: finalTitle,
        location: docProvince.trim() || null,
        summary: docSummary.trim(),
        article_title: articleTitle.trim() || null,
        article_body: articleBody.trim() || null,
        article_source: articleBody.trim() ? articleSource || 'manual' : null,
        doc_date: docDate || null,
        summary_date: docSummaryDate || null,
        visibility: privacy,
        tracked_project_id: selectedProject?.id || null,
      });

      setShowPublishApprovalModal(false);
      onPostCreated(doc);
      onClose();
    } catch (err) {
      setShowPublishApprovalModal(false);
      showError(apiErrorMessage(err, 'Không đăng được tài liệu. Vui lòng thử lại.'), 8000);
    } finally {
      setPublishing(false);
    }
  };

  if (!open) return null;

  const currentStatusCfg = STATUS_CONFIG[selectedProject?.status] || STATUS_CONFIG.watching;

  const modalContent = (
    // Đang trích xuất / lưu / đăng thì không đóng khi bấm ra ngoài: request vẫn chạy tiếp.
    <div className="potential-modal-backdrop" onClick={extracting || savingEdit || publishing ? undefined : onClose}>
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        style={{
          width: '100%',
          maxWidth: 780,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 20,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header Modal */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14,
          padding: '20px 28px 16px', borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'rgba(37, 99, 235, 0.1)',
                  color: 'var(--brand-600)',
                  fontSize: 11.5,
                  fontWeight: 800,
                  border: '1px solid rgba(37, 99, 235, 0.25)',
                }}
              >
                <FileText size={13} />
                <span>Hồ sơ tài liệu & Đăng bài báo chí</span>
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11.5,
                  color: 'var(--text-muted)',
                }}
              >
                <Shield size={12} />
                <span>Quy trình có phê duyệt</span>
              </span>
            </div>
            <h2 style={{ margin: '8px 0 0', fontSize: 19, fontWeight: 900, color: 'var(--text-primary)' }}>
              Quản lý Dự án, Biên bản Tài liệu & Đăng báo chí
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Liên kết dự án theo dõi, trích xuất biên bản DOCX/PDF và xuất bản bài đăng báo chí với tên người dùng.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="potential-modal-close-btn"
            style={{ padding: 6, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 10 }}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          className="custom-modal-scroll"
          style={{
            padding: '20px 28px',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            minHeight: 0,
          }}
        >
        {/* Thông báo lỗi / thành công */}
        {errorMsg && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)', color: '#dc2626',
            fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600,
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {extractionMsg && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)', color: '#059669',
            fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600,
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{extractionMsg.text}</span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            PHẦN 1: LỌC & CHỌN TÊN DỰ ÁN ĐANG THEO DÕI (KÈM THÔNG TIN ĐI KÈM)
           ═══════════════════════════════════════════════════════════════════ */}
        <div style={{
          background: 'var(--bg-surface-2)',
          borderRadius: 14,
          padding: 16,
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Building2 size={16} style={{ color: 'var(--brand-500)' }} />
              <span>1. Lọc và chọn tên dự án đang theo dõi</span>
            </span>
            {selectedProject && (
              <button
                type="button"
                onClick={() => setIsEditingInfo(!isEditingInfo)}
                className="btn"
                style={{
                  padding: '4px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 8,
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: isEditingInfo ? 'var(--brand-50)' : 'var(--bg-surface)',
                  color: isEditingInfo ? 'var(--brand-600)' : 'var(--text-secondary)',
                  border: isEditingInfo ? '1px solid var(--brand-300)' : '1px solid var(--border)',
                }}
              >
                <Edit3 size={13} />
                <span>{isEditingInfo ? 'Hủy sửa thông tin' : 'Chỉnh sửa thông tin'}</span>
              </button>
            )}
          </div>

          {/* Ô lọc và chọn tên dự án */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              placeholder="Gõ tìm kiếm tên dự án đang theo dõi..."
              className="form-input"
              style={{ width: '100%', paddingLeft: 34, fontSize: 12.5, borderRadius: 10 }}
            />
          </div>

          {/* Danh sách kết quả lọc nếu đang tìm kiếm hoặc chưa chọn */}
          {projectSearch.trim() && (
            <div style={{
              maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4,
              background: 'var(--bg-surface)', padding: 6, borderRadius: 10, border: '1px solid var(--border)',
            }}>
              {filteredProjects.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 8, textAlign: 'center' }}>
                  Không tìm thấy dự án nào khớp với từ khóa "{projectSearch}".
                </div>
              ) : (
                filteredProjects.map((p) => {
                  const isCur = selectedProject?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProject(p);
                        setProjectSearch('');
                        setIsEditingInfo(false);
                      }}
                      style={{
                        textAlign: 'left', padding: '8px 10px', borderRadius: 8,
                        background: isCur ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                        border: isCur ? '1px solid var(--brand-400)' : '1px solid transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 10, marginTop: 2 }}>
                          <span>📍 {p.province || 'Toàn quốc'}</span>
                          <span>🏷️ {p.sector_name || p.sector || 'Hạ tầng'}</span>
                        </div>
                      </div>
                      {isCur && <Check size={14} style={{ color: 'var(--brand-600)' }} />}
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* THẺ THÔNG TIN ĐI KÈM DỰ ÁN ĐÃ CHỌN */}
          {selectedProject ? (
            !isEditingInfo ? (
              <div style={{
                background: 'var(--bg-surface)',
                borderRadius: 12,
                padding: '12px 16px',
                border: '1px solid var(--border)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 12,
              }}>
                {/* 1. Tên dự án */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>TÊN DỰ ÁN:</span>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedProject.name}
                  </span>
                </div>

                {/* 2. Vị trí */}
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                    <MapPin size={12} style={{ color: '#10b981' }} /> Vị trí
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedProject.province || 'Toàn quốc / Chưa rõ'}
                  </span>
                </div>

                {/* 3. Lĩnh vực */}
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                    <Tag size={12} style={{ color: '#f59e0b' }} /> Lĩnh vực
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedProject.sector_name || selectedProject.sector || 'Hạ tầng chung'}
                  </span>
                </div>

                {/* 4. Thời gian */}
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                    <Calendar size={12} style={{ color: 'var(--brand-500)' }} /> Thời gian
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedProject.start_date || selectedProject.end_date
                      ? `${fmtDate(selectedProject.start_date)} → ${fmtDate(selectedProject.end_date)}`
                      : fmtDate(selectedProject.created_at)}
                  </span>
                </div>

                {/* 5. Trạng thái */}
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                    <Clock size={12} /> Trạng thái
                  </span>
                  <span
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 800,
                      background: currentStatusCfg.bg, color: currentStatusCfg.fg, border: `1px solid ${currentStatusCfg.border}`,
                      marginTop: 2,
                    }}
                  >
                    {currentStatusCfg.label}
                  </span>
                </div>
              </div>
            ) : (
              /* FORM CHỈNH SỬA THÔNG TIN DỰ ÁN */
              <form onSubmit={handleRequestEditApproval} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" style={{ fontSize: 11.5 }}>Tên dự án *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      style={{ fontSize: 12.5 }}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 11.5 }}>Vị trí / Địa phương</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.province}
                      onChange={(e) => setEditForm({ ...editForm, province: e.target.value })}
                      placeholder="VD: Hà Nội, TP.HCM, Vĩnh Long..."
                      style={{ fontSize: 12.5 }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 11.5 }}>Lĩnh vực</label>
                    <select
                      className="form-select"
                      value={editForm.sector}
                      onChange={(e) => setEditForm({ ...editForm, sector: e.target.value })}
                      style={{ fontSize: 12.5 }}
                    >
                      <option value="">— Chưa xác định —</option>
                      {editForm.sector && !sectors.some((s) => s.slug === editForm.sector) && (
                        <option value={editForm.sector}>
                          {selectedProject?.sector_name || editForm.sector}
                        </option>
                      )}
                      {sectors.map((s) => (
                        <option key={s.slug} value={s.slug}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 11.5 }}>Ngày bắt đầu</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editForm.startDate}
                      onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                      style={{ fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 11.5 }}>Ngày kết thúc</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editForm.endDate}
                      min={editForm.startDate || undefined}
                      onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                      style={{ fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 11.5 }}>Trạng thái</label>
                    <select
                      className="form-select"
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      style={{ fontSize: 12.5 }}
                    >
                      <option value="watching">Đang theo dõi</option>
                      <option value="active">Đang thực hiện</option>
                      <option value="completed">Đã hoàn thành</option>
                      <option value="closed">Đã đóng / Tạm dừng</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setIsEditingInfo(false)}
                    className="btn"
                    style={{ fontSize: 12, padding: '6px 12px' }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ fontSize: 12, padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Save size={13} />
                    <span>Lưu (Yêu cầu phê duyệt)</span>
                  </button>
                </div>
              </form>
            )
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              💡 Chọn một dự án đang theo dõi ở ô tìm kiếm trên, hoặc điền trực tiếp thông tin tài liệu bên dưới.
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            PHẦN 2: FORM TÀI LIỆU (DOCX, PDF) & TRÍCH XUẤT THÔNG TIN
           ═══════════════════════════════════════════════════════════════════ */}
        <div style={{
          background: 'var(--bg-surface-2)',
          borderRadius: 14,
          padding: 16,
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileCheck size={16} style={{ color: '#059669' }} />
              <span>2. Form tài liệu dự án, biên bản (.DOCX, .PDF) & Trích xuất</span>
            </span>

            {attachedFiles.length > 0 && (
              <button
                type="button"
                onClick={handleExtract}
                disabled={extracting}
                className="btn btn-primary"
                style={{
                  padding: '5px 12px', fontSize: 12, fontWeight: 800, borderRadius: 8,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                }}
              >
                {extracting ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />}
                <span>{extracting ? 'Đang trích xuất...' : 'Trích xuất thông tin từ tài liệu'}</span>
              </button>
            )}
          </div>

          {/* Vùng Dropzone Upload File */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 12,
              padding: '16px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'var(--bg-surface)',
              transition: 'all 0.2s ease',
            }}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--brand-500)'; }}
            onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = 'var(--border)';
              if (e.dataTransfer.files?.length) chonFile(e.dataTransfer.files);
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={DOCUMENT_ACCEPT}
              style={{ display: 'none' }}
            />
            <Upload size={22} style={{ color: 'var(--brand-500)', margin: '0 auto 6px' }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Nhấp để chọn hoặc kéo thả tài liệu dự án, biên bản vào đây
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
              Hỗ trợ định dạng <strong>.DOCX</strong>, <strong>.PDF</strong> (Biên bản họp, quyết định phê duyệt, hồ sơ thiết kế...) — một file, tối đa 15 MB
            </div>
          </div>

          {/* Danh sách file đính kèm */}
          {attachedFiles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)' }}>
                Tài liệu đã đính kèm ({attachedFiles.length}):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {attachedFiles.map((file, idx) => {
                  const isDocx = file.name.toLowerCase().endsWith('.docx');
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '6px 10px', borderRadius: 8,
                        background: 'var(--bg-surface)', border: '1px solid var(--border)',
                        fontSize: 12, color: 'var(--text-primary)',
                      }}
                    >
                      <Paperclip size={13} style={{ color: isDocx ? '#2563eb' : '#dc2626' }} />
                      <span style={{ fontWeight: 600, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        ({(file.size / 1024).toFixed(0)} KB)
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(); }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
                        title="Xóa file này"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Các trường quản lý thông tin tài liệu & trích xuất */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 4 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ fontSize: 11.5 }}>
                Tên dự án liên quan *
              </label>
              <input
                type="text"
                className="form-input"
                value={docProjectName}
                maxLength={255}
                onChange={(e) => setDocProjectName(e.target.value)}
                placeholder="Tên dự án theo tài liệu trích xuất..."
                style={{ fontSize: 12.5 }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 11.5 }}>Vị trí địa bàn</label>
              <input
                type="text"
                className="form-input"
                value={docProvince}
                maxLength={255}
                onChange={(e) => setDocProvince(e.target.value)}
                placeholder="Địa phương thực hiện..."
                style={{ fontSize: 12.5 }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 11.5 }}>Ngày văn bản / biên bản</label>
              <input
                type="date"
                className="form-input"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
                style={{ fontSize: 12.5 }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 11.5 }}>Ngày tóm tắt</label>
              <input
                type="date"
                className="form-input"
                value={docSummaryDate}
                onChange={(e) => setDocSummaryDate(e.target.value)}
                style={{ fontSize: 12.5 }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ fontSize: 11.5 }}>
                Nội dung / Tóm tắt văn bản & biên bản dự án *
              </label>
              <textarea
                className="form-input"
                rows={3}
                value={docSummary}
                maxLength={5000}
                onChange={(e) => setDocSummary(e.target.value)}
                placeholder="Nội dung chính hoặc thông tin tóm tắt sau khi phân tích tài liệu..."
                style={{ fontSize: 12.5, resize: 'vertical' }}
              />
            </div>

            {/* Bài tin: tài liệu được trình bày dưới dạng bài báo để người khác đọc nhanh */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ fontSize: 11.5 }}>Tiêu đề bài viết</label>
              <input
                type="text"
                className="form-input"
                value={articleTitle}
                maxLength={255}
                onChange={(e) => { setArticleTitle(e.target.value); setArticleSource('manual'); }}
                placeholder="Tiêu đề kiểu báo chí; để trống thì lấy tên dự án"
                style={{ fontSize: 12.5 }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span>Nội dung bài viết (hiển thị dạng bài tin)</span>
                {articleSource === 'ai' && (
                  <span style={{
                    fontSize: 10.5, fontWeight: 800, padding: '2px 7px', borderRadius: 999,
                    background: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed',
                  }}>
                    ✨ AI soạn từ tài liệu — đọc lại trước khi đăng
                  </span>
                )}
                {articleSource === 'rules' && (
                  <span style={{
                    fontSize: 10.5, fontWeight: 800, padding: '2px 7px', borderRadius: 999,
                    background: 'rgba(100, 116, 139, 0.14)', color: '#475569',
                  }}>
                    Trích nguyên văn từ tài liệu
                  </span>
                )}
              </label>
              <textarea
                className="form-input"
                rows={8}
                value={articleBody}
                maxLength={20000}
                onChange={(e) => { setArticleBody(e.target.value); setArticleSource('manual'); }}
                placeholder="Bấm 'Trích xuất thông tin từ tài liệu' để máy soạn bài, rồi sửa lại. Cách đoạn bằng một dòng trống."
                style={{ fontSize: 12.5, resize: 'vertical', lineHeight: 1.6 }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Bài hiển thị ở trang Báo chí và Dự án tiềm năng theo đúng quyền riêng tư bên dưới;
                file gốc luôn đính kèm để đối chiếu.
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            PHẦN 3: ĐĂNG BÀI DƯỚI DẠNG BÁO CHÍ & QUYỀN RIÊNG TƯ
           ═══════════════════════════════════════════════════════════════════ */}
        <div style={{
          background: 'var(--bg-surface-2)',
          borderRadius: 14,
          padding: 16,
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe2 size={16} style={{ color: 'var(--brand-600)' }} />
            <span>3. Đăng bài dưới dạng báo chí & Lựa chọn quyền riêng tư</span>
          </span>

          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
            Bài đăng sẽ được định dạng theo cấu trúc <strong>Báo chí</strong> trong hệ thống. Thẻ bài viết sẽ hiển thị <strong>tên người dùng ({authorName})</strong> thay cho nhãn liên kết ngoài.
          </p>

          {/* Lựa chọn 3 cấp độ quyền riêng tư */}
          <div role="radiogroup" aria-label="Quyền riêng tư" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {Object.values(PRIVACY_CONFIG).map((p) => {
              const active = privacy === p.id;
              // Máy chủ từ chối "Tổ chức" khi tài khoản chưa thuộc tổ chức nào.
              const disabled = p.id === 'organization' && !hasOrg;
              const Icon = p.icon;
              const chon = () => { if (!disabled) setPrivacy(p.id); };
              return (
                <div
                  key={p.id}
                  role="radio"
                  aria-checked={active}
                  aria-disabled={disabled}
                  tabIndex={disabled ? -1 : 0}
                  onClick={chon}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chon(); } }}
                  title={disabled ? 'Tài khoản chưa thuộc tổ chức nào' : undefined}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: `1.5px solid ${active ? p.color : 'var(--border)'}`,
                    background: active ? p.bg : 'var(--bg-surface)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 13, color: active ? p.color : 'var(--text-primary)' }}>
                      <Icon size={15} />
                      <span>{p.label.split(' ')[0]}</span>
                    </div>
                    {active && <CheckCircle2 size={15} style={{ color: p.color }} />}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {disabled ? 'Tài khoản của bạn chưa thuộc tổ chức nào.' : p.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        </div>

        {/* Footer actions */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 28px', borderTop: '1px solid var(--border-subtle, #f1f5f9)',
          background: 'var(--bg-surface-2)', flexShrink: 0,
        }}>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            style={{ fontSize: 13, padding: '8px 16px' }}
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleRequestPublishApproval}
            className="btn btn-primary"
            style={{
              padding: '9px 20px',
              fontSize: 13.5,
              fontWeight: 800,
              borderRadius: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, var(--brand-600), #1d4ed8)',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            }}
          >
            <span>Duyệt & Đăng bài báo chí</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          MODAL 1: BẢNG PHÊ DUYỆT CHỈNH SỬA THÔNG TIN DỰ ÁN (APPROVAL MODAL)
         ───────────────────────────────────────────────────────────────── */}
      {showEditApprovalModal && (
        <div
          // stopPropagation: lớp phủ nằm TRONG backdrop của form — để sự kiện nổi lên là đóng luôn
          // cả form, mất file và mọi thứ đã nhập.
          onClick={(e) => { e.stopPropagation(); if (!savingEdit) setShowEditApprovalModal(false); }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{
              width: '100%', maxWidth: 520, background: 'var(--bg-surface)',
              borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 14,
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={20} style={{ color: 'var(--brand-600)' }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>
                Phê duyệt nội dung chỉnh sửa thông tin dự án
              </h3>
            </div>

            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Vui lòng kiểm tra và phê duyệt các thông tin thay đổi trước khi hệ thống lưu chính thức:
            </p>

            {/* Bảng so sánh trước và sau — dòng tô màu là dòng có thay đổi */}
            <div style={{
              background: 'var(--bg-surface-2)', borderRadius: 10, padding: 12,
              border: '1px solid var(--border)', fontSize: 12, overflowX: 'auto',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '4px 6px', fontWeight: 700 }}>Thông tin</th>
                    <th style={{ padding: '4px 6px', fontWeight: 700 }}>Hiện tại</th>
                    <th style={{ padding: '4px 6px', fontWeight: 700 }}>Sau chỉnh sửa</th>
                  </tr>
                </thead>
                <tbody>
                  {dongDuyetSua.map(([nhan, truoc, sau, doi]) => (
                    <tr key={nhan} style={{ background: doi ? 'rgba(234, 179, 8, 0.14)' : 'transparent' }}>
                      <td style={{ padding: '5px 6px', fontWeight: 700, borderTop: '1px solid var(--border)' }}>{nhan}</td>
                      <td style={{ padding: '5px 6px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)' }}>{truoc}</td>
                      <td style={{ padding: '5px 6px', fontWeight: doi ? 800 : 400, borderTop: '1px solid var(--border)' }}>{sau}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                Người phê duyệt: <strong>{authorName}</strong> | Ngày: {fmtDate(todayVN())}
                {!dongDuyetSua.some((d) => d[3]) && ' | Không có thay đổi nào.'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                className="btn"
                onClick={() => setShowEditApprovalModal(false)}
                disabled={savingEdit}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmEdit}
                disabled={savingEdit}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {savingEdit ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />}
                <span>Xác nhận phê duyệt & Lưu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          MODAL 2: BẢNG DUYỆT THÔNG TIN TRƯỚC KHI ĐĂNG BÁO CHÍ (PRE-PUBLISH)
         ───────────────────────────────────────────────────────────────── */}
      {showPublishApprovalModal && (
        <div
          onClick={(e) => { e.stopPropagation(); if (!publishing) setShowPublishApprovalModal(false); }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 16,
            backdropFilter: 'blur(5px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{
              width: '100%', maxWidth: 620, background: 'var(--bg-surface)',
              borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ padding: 6, borderRadius: 10, background: 'rgba(37, 99, 235, 0.1)', color: 'var(--brand-600)' }}>
                  <FileText size={20} />
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: 'var(--text-primary)' }}>
                    Bảng duyệt thông tin trước khi đăng bài báo chí
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Kiểm duyệt lần cuối thông tin bài đăng báo chí và quyền riêng tư
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPublishApprovalModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Khung xem trước thông tin bài đăng */}
            <div style={{
              background: 'var(--bg-surface-2)', borderRadius: 14, padding: 16,
              border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              {/* Badge Tác giả & Quyền riêng tư */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11.5, fontWeight: 800, padding: '3px 9px', borderRadius: 999,
                  background: 'rgba(37, 99, 235, 0.12)', color: 'var(--brand-600)',
                  border: '1px solid rgba(37, 99, 235, 0.25)',
                }}>
                  👤 Tác giả: {authorName}
                </span>

                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11.5, fontWeight: 800, padding: '3px 9px', borderRadius: 999,
                  background: PRIVACY_CONFIG[privacy].bg, color: PRIVACY_CONFIG[privacy].color,
                  border: `1px solid ${PRIVACY_CONFIG[privacy].border}`,
                }}>
                  {PRIVACY_CONFIG[privacy].label}
                </span>

              </div>

              {/* Tên dự án */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>TÊN DỰ ÁN:</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', marginTop: 2 }}>
                  {finalTitle}
                </div>
              </div>

              {/* Vị trí, ngày văn bản, ngày tóm tắt, dự án theo dõi */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                <span>📍 <strong>Vị trí:</strong> {docProvince.trim() || '—'}</span>
                <span>📅 <strong>Ngày văn bản:</strong> {fmtDate(docDate)}</span>
                <span>🗓️ <strong>Ngày tóm tắt:</strong> {fmtDate(docSummaryDate)}</span>
                {selectedProject && (
                  <span>📌 <strong>Dự án theo dõi:</strong> {selectedProject.name}</span>
                )}
              </div>

              {articleTitle.trim() && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>TIÊU ĐỀ BÀI VIẾT:</div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                    {articleTitle.trim()}
                  </div>
                </div>
              )}

              {/* Tóm tắt nội dung */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>NỘI DUNG TÓM TẮT:</div>
                <div style={{
                  fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.5, marginTop: 4,
                  background: 'var(--bg-surface)', padding: 10, borderRadius: 8, border: '1px solid var(--border)',
                  whiteSpace: 'pre-line', maxHeight: 120, overflowY: 'auto',
                }}>
                  {docSummary}
                </div>
              </div>

              {articleBody.trim() && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                    BÀI VIẾT ({articleBody.trim().split(/\n\s*\n/).filter(Boolean).length} đoạn):
                  </div>
                  <div style={{
                    fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.6, marginTop: 4,
                    background: 'var(--bg-surface)', padding: 10, borderRadius: 8, border: '1px solid var(--border)',
                    whiteSpace: 'pre-line', maxHeight: 160, overflowY: 'auto',
                  }}>
                    {articleBody.trim()}
                  </div>
                </div>
              )}

              {/* File đính kèm */}
              {attachedFiles.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>FILE ĐÍNH KÈM ({attachedFiles.length}):</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {attachedFiles.map((f, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11, padding: '3px 8px', borderRadius: 6,
                          background: 'var(--bg-surface)', border: '1px solid var(--border)',
                          fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}
                      >
                        📎 {f.name} ({(f.size / 1024).toFixed(0)} KB)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn"
                onClick={() => setShowPublishApprovalModal(false)}
                disabled={publishing}
              >
                Chỉnh sửa lại
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmPublish}
                disabled={publishing}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '9px 20px', fontWeight: 800,
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                }}
              >
                {publishing ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />}
                <span>Xác nhận phê duyệt & Đăng bài</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}
