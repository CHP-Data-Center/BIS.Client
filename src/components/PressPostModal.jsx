// src/components/PressPostModal.jsx
// Quản lý riêng chức năng ĐĂNG BÀI BÁO CHÍ với Tên người dùng & Quyền riêng tư (Only me, Organization, Public)
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X, AlertCircle, Upload, Sparkles, MapPin, Calendar, Clock,
  Tag, Shield, Lock, Building2, Globe2, CheckCircle2, Loader2,
  Paperclip, Newspaper, Send, FileText
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { projectDocumentsService } from '../services/projectDocuments';

function fmtDate(iso) {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Cấu hình quyền riêng tư
const PRIVACY_OPTIONS = [
  {
    id: 'only_me',
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
  initialData = null,
  onPostCreated = () => {},
}) {
  const { t } = useLang();
  const { user } = useAuth();
  const authorName = user?.name || user?.full_name || user?.username || user?.email || 'Người dùng BIS';

  // Thông tin bài đăng báo chí
  const [title, setTitle] = useState(initialData?.title || initialData?.projectName || '');
  const [province, setProvince] = useState(initialData?.province || '');
  const [sector, setSector] = useState(initialData?.sector || 'Hạ tầng & Xây dựng');
  const [summary, setSummary] = useState(initialData?.summary || '');
  const [date, setDate] = useState(initialData?.date || (() => new Date().toISOString().split('T')[0]));
  const [summaryDate, setSummaryDate] = useState(initialData?.summaryDate || (() => new Date().toISOString().split('T')[0]));
  const [privacy, setPrivacy] = useState(initialData?.privacy || 'organization');

  // File tài liệu/ảnh đính kèm
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [extractionMsg, setExtractionMsg] = useState(null);

  // Phê duyệt trước khi đăng bài
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const fileInputRef = useRef(null);

  // Upload file DOCX, PDF hoặc hình ảnh
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const valid = files.filter((f) => {
      const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
      return ['.docx', '.pdf', '.doc', '.png', '.jpg', '.jpeg', '.webp'].includes(ext);
    });

    if (valid.length < files.length) {
      setErrorMsg('Hỗ trợ đính kèm tài liệu (.DOCX, .PDF) và hình ảnh (.PNG, .JPG)');
      setTimeout(() => setErrorMsg(null), 4000);
    }

    setAttachedFiles((prev) => [...prev, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (idx) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Trích xuất thông tin tự động từ file
  const handleExtract = async () => {
    if (attachedFiles.length === 0) {
      setErrorMsg('Vui lòng đính kèm ít nhất 1 file tài liệu (.DOCX hoặc .PDF) để trích xuất');
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    setExtracting(true);
    setExtractionMsg(null);
    setErrorMsg(null);

    try {
      const primaryFile = attachedFiles[0];
      const extracted = await projectDocumentsService.extractFromFile(primaryFile);

      if (extracted.projectName) setTitle(extracted.projectName);
      if (extracted.province) setProvince(extracted.province);
      if (extracted.summary) setSummary(extracted.summary);
      if (extracted.date) setDate(extracted.date);
      if (extracted.summaryDate) setSummaryDate(extracted.summaryDate);

      setExtractionMsg({
        type: 'success',
        text: `Đã trích xuất thông tin từ "${primaryFile.name}" thành công!`,
      });
      setTimeout(() => setExtractionMsg(null), 5000);
    } catch (err) {
      setErrorMsg(err.message || 'Không thể trích xuất thông tin từ file này.');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setExtracting(false);
    }
  };

  // Mở modal duyệt bài trước khi xuất bản
  const handleRequestApproval = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Tiêu đề bài báo chí / Tên dự án không được để trống');
      setTimeout(() => setErrorMsg(null), 3500);
      return;
    }
    if (!summary.trim()) {
      setErrorMsg('Vui lòng nhập tóm tắt nội dung bài báo chí');
      setTimeout(() => setErrorMsg(null), 3500);
      return;
    }
    setShowApprovalModal(true);
  };

  // Xác nhận phê duyệt & Đăng bài báo chí
  const handleConfirmPublish = async () => {
    setPublishing(true);
    setErrorMsg(null);
    try {
      const postPayload = {
        title: title.trim(),
        projectName: title.trim(),
        province: province.trim() || 'Toàn quốc',
        sector: sector.trim() || 'Hạ tầng & Xây dựng',
        summary: summary.trim(),
        date: date,
        summaryDate: summaryDate,
        privacy: privacy,
        authorName: authorName,
        files: attachedFiles.map((f) => ({
          name: f.name,
          size: f.size,
          type: f.name.endsWith('.docx') ? 'docx' : f.name.endsWith('.pdf') ? 'pdf' : 'image',
        })),
        stage: 'Đã xuất bản',
      };

      const createdPost = projectDocumentsService.createPost(postPayload);
      setShowApprovalModal(false);
      onPostCreated(createdPost);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi đăng bài.');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setPublishing(false);
    }
  };

  if (!open) return null;

  const currentPrivacy = PRIVACY_OPTIONS.find((p) => p.id === privacy) || PRIVACY_OPTIONS[1];

  const modalContent = (
    <div className="potential-modal-backdrop" onClick={onClose}>
      <div
        className="potential-modal-content card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 760,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 28px',
          gap: 20,
          overflowY: 'auto',
          borderRadius: 20,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header Modal */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {PRIVACY_OPTIONS.map((opt) => {
              const active = privacy === opt.id;
              const OptIcon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPrivacy(opt.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '12px 14px',
                    borderRadius: 12,
                    cursor: 'pointer',
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
                    {opt.desc}
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
              <span>Đính kèm tài liệu (.DOCX, .PDF) hoặc trích xuất</span>
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
              accept=".docx,.pdf,.doc,.png,.jpg,.jpeg,.webp"
              multiple
              style={{ display: 'none' }}
            />
            <Upload size={20} style={{ color: 'var(--brand-500)', margin: '0 auto 4px' }} />
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
              Nhấp để tải lên tài liệu báo chí / hình ảnh liên quan
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Hỗ trợ định dạng .DOCX, .PDF, .PNG, .JPG (tối đa trích xuất thông tin tự động)
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
                    onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
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
                onChange={(e) => setProvince(e.target.value)}
                placeholder="VD: Hà Nội, TP.HCM, Vĩnh Long..."
                style={{ fontSize: 12.5 }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 11.5 }}>Lĩnh vực</label>
              <input
                type="text"
                className="form-input"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="VD: Giao thông vận tải, Cấp thoát nước..."
                style={{ fontSize: 12.5 }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 11.5 }}>Ngày sự kiện / bài báo</label>
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
              <label className="form-label" style={{ fontSize: 11.5 }}>
                Tóm tắt nội dung bài báo chí *
              </label>
              <textarea
                className="form-input"
                rows={4}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Nội dung truyền thông, tóm tắt diễn biến, thông số kỹ thuật hoặc biên bản cuộc họp..."
                style={{ fontSize: 12.5, resize: 'vertical' }}
                required
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
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
          onClick={() => setShowApprovalModal(false)}
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
                <span>📍 <strong>Vị trí:</strong> {province || 'Toàn quốc'}</span>
                <span>🏷️ <strong>Lĩnh vực:</strong> {sector}</span>
                <span>📅 <strong>Ngày bài báo:</strong> {fmtDate(date)}</span>
                <span>⏱️ <strong>Ngày tóm tắt:</strong> {fmtDate(summaryDate)}</span>
              </div>

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
                    {privacy === 'only_me' ? '🔒 Chỉ mình tôi' : privacy === 'organization' ? '🏢 Nội bộ tổ chức' : '🌐 Công khai'}
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
