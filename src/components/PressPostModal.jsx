// src/components/PressPostModal.jsx
// Đăng bài báo chí kèm tài liệu (.DOCX/.PDF), tên người đăng và quyền riêng tư
// (Only me / Organization / Public). Lưu ở máy chủ (/project-documents) — cùng kho với tài
// liệu dự án nên bài đăng ở trang Báo chí và trang Dự án tiềm năng là một.
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X, AlertCircle, Upload, Sparkles, MapPin, Calendar, Clock,
  Tag, Shield, Lock, Building2, Globe2, CheckCircle2, Loader2,
  Paperclip, Newspaper, Send, FileText
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  projectDocumentsService, documentFileProblem, todayVN, apiErrorMessage, DOCUMENT_ACCEPT,
} from '../services/projectDocuments';

function fmtDate(iso) {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Cấu hình quyền riêng tư — `id` trùng giá trị `visibility` của máy chủ.
const PRIVACY_OPTIONS = [
  {
    id: 'private',
    label: 'Only me (Chỉ mình tôi)',
    desc: 'Chỉ tài khoản của bạn mới nhìn thấy bài báo chí này',
    icon: Lock,
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(139, 92, 246, 0.35)',
  },
  {
    id: 'organization',
    label: 'Organization (Nội bộ tổ chức)',
    desc: 'Tất cả các thành viên trong tổ chức / doanh nghiệp của bạn có thể xem',
    icon: Building2,
    color: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.1)',
    border: 'rgba(37, 99, 235, 0.35)',
  },
  {
    id: 'public',
    label: 'Public (Công khai)',
    desc: 'Công khai trên bảng tin dự án cho toàn bộ người dùng hệ thống',
    icon: Globe2,
    color: '#059669',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.35)',
  },
];

export default function PressPostModal({
  open,
  onClose,
  onPostCreated = () => {},
}) {
  const { t } = useLang();
  const { user } = useAuth();
  const authorName = user?.display_name || user?.name || user?.email || 'Người dùng BIS';
  // Máy chủ từ chối quyền "Tổ chức" với tài khoản chưa thuộc tổ chức nào.
  const hasOrg = Boolean(user?.organization_id);

  // Thông tin bài đăng báo chí
  const [title, setTitle] = useState('');
  const [province, setProvince] = useState('');
  const [summary, setSummary] = useState('');
  // Bài tin soạn từ tài liệu (xem ProjectDocumentPostModal): nội dung theo đoạn + nhãn nguồn.
  const [articleBody, setArticleBody] = useState('');
  const [articleSource, setArticleSource] = useState(null);
  // Thẻ từ khóa máy chủ khớp được từ văn bản file — chỉ để xem trước.
  const [matchedKeywords, setMatchedKeywords] = useState([]);
  // Ngày ghi trong văn bản: chỉ điền khi trích được hoặc người dùng tự nhập.
  const [date, setDate] = useState('');
  const [summaryDate, setSummaryDate] = useState(() => todayVN());
  const [privacy, setPrivacy] = useState(hasOrg ? 'organization' : 'private');

  // Tài liệu đính kèm: đúng một file .DOCX/.PDF (máy chủ lưu file gốc để tải lại)
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [extractionMsg, setExtractionMsg] = useState(null);

  // Phê duyệt trước khi đăng bài
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const fileInputRef = useRef(null);

  const showError = (text, ms = 6000) => {
    setErrorMsg(text);
    setTimeout(() => setErrorMsg(null), ms);
  };

  const handleFileChange = (e) => {
    const list = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (list.length === 0) return;
    const loi = documentFileProblem(list[0]);
    if (loi) {
      showError(loi);
      return;
    }
    setAttachedFiles([list[0]]);
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
        showError(res.note || 'Không đọc được chữ trong file. Vui lòng nhập thông tin thủ công.', 8000);
        return;
      }
      if (res.article_title || res.project_name) setTitle(res.article_title || res.project_name);
      if (res.location) setProvince(res.location);
      if (res.summary) setSummary(res.summary);
      if (res.doc_date) setDate(res.doc_date);
      if (res.summary_date) setSummaryDate(res.summary_date);
      if (res.matched_keywords?.length) setMatchedKeywords(res.matched_keywords);
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
      showError(apiErrorMessage(err, 'Không thể trích xuất thông tin từ file này.'));
    } finally {
      setExtracting(false);
    }
  };

  // Mở modal duyệt bài trước khi xuất bản
  const handleRequestApproval = (e) => {
    e.preventDefault();
    const loiFile = documentFileProblem(attachedFiles[0]);
    if (loiFile) {
      showError(loiFile);
      return;
    }
    if (!title.trim()) {
      showError('Tiêu đề bài báo chí / Tên dự án không được để trống');
      return;
    }
    if (!summary.trim()) {
      showError('Vui lòng nhập tóm tắt nội dung bài báo chí');
      return;
    }
    if (privacy === 'organization' && !hasOrg) {
      showError('Tài khoản chưa thuộc tổ chức nào — chọn "Chỉ mình tôi" hoặc "Công khai".');
      return;
    }
    setShowApprovalModal(true);
  };

  // Xác nhận phê duyệt: máy chủ lưu thông tin + file gốc + quyền riêng tư
  const handleConfirmPublish = async () => {
    setPublishing(true);
    setErrorMsg(null);
    try {
      const doc = await projectDocumentsService.create(attachedFiles[0], {
        project_name: title.trim(),
        location: province.trim() || null,
        summary: summary.trim(),
        article_title: title.trim(),
        article_body: articleBody.trim() || null,
        article_source: articleBody.trim() ? articleSource || 'manual' : null,
        doc_date: date || null,
        summary_date: summaryDate || null,
        visibility: privacy,
      });
      setShowApprovalModal(false);
      onPostCreated(doc);
      onClose();
    } catch (err) {
      // Đóng bảng duyệt để thông báo lỗi (nằm trong khung chính) không bị che.
      setShowApprovalModal(false);
      showError(apiErrorMessage(err, 'Không đăng được bài. Vui lòng thử lại.'), 8000);
    } finally {
      setPublishing(false);
    }
  };

  if (!open) return null;

  const currentPrivacy = PRIVACY_OPTIONS.find((p) => p.id === privacy) || PRIVACY_OPTIONS[0];

  const modalContent = (
    // Đang trích xuất / đăng thì không đóng khi bấm ra ngoài: request vẫn chạy tiếp.
    <div className="potential-modal-backdrop" onClick={extracting || publishing ? undefined : onClose}>
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        style={{
          width: '100%',
          maxWidth: 760,
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
                <Newspaper size={13} />
                <span>Đăng Bài Báo Chí Dự Án</span>
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                Tác giả: <strong>{authorName}</strong>
              </span>
            </div>
            <h2 style={{ margin: '8px 0 0', fontSize: 19, fontWeight: 900, color: 'var(--text-primary)' }}>
              Biên tập & Đăng bài dưới dạng Báo chí
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Đăng tin tức truyền thông, bài viết dự án mang tên tác giả với cấu hình quyền riêng tư và phê duyệt nội dung.
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
            MỤC 1: LỰA CHỌN QUYỀN RIÊNG TƯ (PRIVACY)
           ═══════════════════════════════════════════════════════════════════ */}
        <div style={{
          background: 'var(--bg-surface-2)',
          borderRadius: 14,
          padding: 16,
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={15} style={{ color: 'var(--brand-600)' }} />
            <span>Quyền riêng tư bài viết (Privacy) *</span>
          </span>

          <div role="radiogroup" aria-label="Quyền riêng tư" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {PRIVACY_OPTIONS.map((opt) => {
              const active = privacy === opt.id;
              // Máy chủ từ chối "Tổ chức" khi tài khoản chưa thuộc tổ chức nào.
              const disabled = opt.id === 'organization' && !hasOrg;
              const OptIcon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={disabled}
                  title={disabled ? 'Tài khoản chưa thuộc tổ chức nào' : undefined}
                  onClick={() => setPrivacy(opt.id)}
                  style={{
                    opacity: disabled ? 0.5 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '12px 14px',
                    borderRadius: 12,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    background: active ? opt.bg : 'var(--bg-surface)',
                    border: active ? `2px solid ${opt.color}` : '1px solid var(--border)',
                    boxShadow: active ? `0 4px 14px ${opt.border}` : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                    <div style={{
                      padding: 5, borderRadius: 8,
                      background: active ? opt.color : 'var(--bg-surface-2)',
                      color: active ? '#ffffff' : opt.color,
                    }}>
                      <OptIcon size={14} />
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {opt.label}
                    </span>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {disabled ? 'Tài khoản của bạn chưa thuộc tổ chức nào.' : opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            MỤC 2: NỘI DUNG BÀI BÁO CHÍ & TÀI LIỆU ĐÍNH KÈM
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
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Paperclip size={15} style={{ color: 'var(--brand-500)' }} />
              <span>Tài liệu đính kèm (.DOCX, .PDF) * & trích xuất</span>
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
                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                }}
              >
                {extracting ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />}
                <span>{extracting ? 'Đang trích xuất...' : 'Trích xuất vào bài báo'}</span>
              </button>
            )}
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 12,
              padding: '14px 18px',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'var(--bg-surface)',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={DOCUMENT_ACCEPT}
              style={{ display: 'none' }}
            />
            <Upload size={20} style={{ color: 'var(--brand-500)', margin: '0 auto 4px' }} />
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
              Nhấp để tải lên tài liệu dự án, biên bản liên quan
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Hỗ trợ định dạng .DOCX, .PDF — một file, tối đa 15 MB. File gốc được lưu kèm bài đăng.
            </div>
          </div>

          {attachedFiles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {attachedFiles.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '5px 10px', borderRadius: 8,
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    fontSize: 12, color: 'var(--text-primary)',
                  }}
                >
                  <Paperclip size={13} style={{ color: 'var(--brand-500)' }} />
                  <span style={{ fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(); }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Form biên tập bài báo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 4 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ fontSize: 11.5 }}>
                Tiêu đề bài báo chí / Tên dự án *
              </label>
              <input
                type="text"
                className="form-input"
                value={title}
                maxLength={255}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Khởi công xây dựng tuyến cao tốc kết nối vùng kinh tế trọng điểm..."
                style={{ fontSize: 12.5 }}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 11.5 }}>Vị trí / Địa phương</label>
              <input
                type="text"
                className="form-input"
                value={province}
                maxLength={255}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="VD: Hà Nội, TP.HCM, Vĩnh Long..."
                style={{ fontSize: 12.5 }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 11.5 }}>Ngày văn bản / bài báo</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ fontSize: 12.5 }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 11.5 }}>Ngày tóm tắt</label>
              <input
                type="date"
                className="form-input"
                value={summaryDate}
                onChange={(e) => setSummaryDate(e.target.value)}
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
              </label>
              <textarea
                className="form-input"
                rows={8}
                value={articleBody}
                maxLength={20000}
                onChange={(e) => { setArticleBody(e.target.value); setArticleSource('manual'); }}
                placeholder="Bấm 'Trích xuất vào bài báo' để máy soạn bài từ tài liệu, rồi sửa lại. Cách đoạn bằng một dòng trống."
                style={{ fontSize: 12.5, resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ fontSize: 11.5 }}>
                Tóm tắt nội dung bài báo chí *
              </label>
              <textarea
                className="form-input"
                rows={4}
                value={summary}
                maxLength={5000}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Nội dung truyền thông, tóm tắt diễn biến, thông số kỹ thuật hoặc biên bản cuộc họp..."
                style={{ fontSize: 12.5, resize: 'vertical' }}
                required
              />
            </div>
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
            Hủy
          </button>

          <button
            type="button"
            onClick={handleRequestApproval}
            className="btn btn-primary"
            style={{
              padding: '9px 20px',
              fontSize: 13.5,
              fontWeight: 800,
              borderRadius: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            }}
          >
            <Send size={15} />
            <span>Phê duyệt & Đăng bài</span>
          </button>
        </div>
      </div>

      {/* MODAL PHÊ DUYỆT BÀI ĐĂNG TRƯỚC KHI XUẤT BẢN */}
      {showApprovalModal && (
        <div
          // stopPropagation: lớp phủ nằm TRONG backdrop của form — để sự kiện nổi lên là đóng luôn
          // cả form, mất file và mọi thứ đã nhập.
          onClick={(e) => { e.stopPropagation(); if (!publishing) setShowApprovalModal(false); }}
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
              width: '100%', maxWidth: 560, background: 'var(--bg-surface)',
              borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ padding: 6, borderRadius: 10, background: 'rgba(37, 99, 235, 0.1)', color: 'var(--brand-600)' }}>
                  <Shield size={20} />
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: 'var(--text-primary)' }}>
                    Bảng phê duyệt xuất bản bài báo chí
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Kiểm duyệt nội dung và quyền riêng tư trước khi công bố
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowApprovalModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              background: 'var(--bg-surface-2)', borderRadius: 14, padding: 16,
              border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>TIÊU ĐỀ BÀI BÁO:</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', marginTop: 2 }}>
                  {title}
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                <span>📍 <strong>Vị trí:</strong> {province.trim() || '—'}</span>
                <span>📅 <strong>Ngày văn bản:</strong> {fmtDate(date)}</span>
                <span>⏱️ <strong>Ngày tóm tắt:</strong> {fmtDate(summaryDate)}</span>
              </div>


              {matchedKeywords.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>TỪ KHÓA MÁY GẮN:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 5 }}>
                    {matchedKeywords.map((kw) => (
                      <span key={kw} style={{
                        fontSize: 11.5, fontWeight: 700, padding: '2px 9px', borderRadius: 999,
                        background: 'rgba(21, 155, 76, 0.1)', color: '#0E7A39',
                        border: '1px solid rgba(21, 155, 76, 0.25)',
                      }}>
                        #{kw}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>
                    Khớp với bộ từ khóa của hệ thống, giống cách gắn thẻ cho tin tức. Thẻ được
                    gắn lại theo nội dung cuối cùng khi đăng.
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>QUYỀN RIÊNG TƯ:</div>
                <div style={{ marginTop: 4 }}>
                  <span
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 8, fontSize: 11.5, fontWeight: 800,
                      background: currentPrivacy.bg, color: currentPrivacy.color, border: `1px solid ${currentPrivacy.border}`,
                    }}
                  >
                    {privacy === 'private' ? '🔒 Chỉ mình tôi' : privacy === 'organization' ? '🏢 Nội bộ tổ chức' : '🌐 Công khai'}
                  </span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>TÓM TẮT NỘI DUNG:</div>
                <div style={{
                  fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.5, marginTop: 4,
                  background: 'var(--bg-surface)', padding: 10, borderRadius: 8, border: '1px solid var(--border)',
                  whiteSpace: 'pre-line', maxHeight: 120, overflowY: 'auto',
                }}>
                  {summary}
                </div>
              </div>

              {attachedFiles.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>TÀI LIỆU ĐÍNH KÈM ({attachedFiles.length}):</div>
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

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                Tác giả bài viết: <strong>{authorName}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn"
                onClick={() => setShowApprovalModal(false)}
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
                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
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
