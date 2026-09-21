// src/components/PressPostDetailModal.jsx
import { createPortal } from 'react-dom';
import {
  X, Calendar, MapPin, Tag, Shield, FileText, Download,
  Building2, Globe2, Lock, CheckCircle2, Paperclip, Share2, Printer
} from 'lucide-react';

function fmtDate(iso) {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const PRIVACY_CONFIG = {
  only_me: {
    label: 'Only me (Chỉ mình tôi)',
    icon: Lock,
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.3)',
  },
  organization: {
    label: 'Organization (Nội bộ tổ chức)',
    icon: Building2,
    color: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.12)',
    border: 'rgba(37, 99, 235, 0.3)',
  },
  public: {
    label: 'Public (Công khai)',
    icon: Globe2,
    color: '#059669',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)',
  },
};

export default function PressPostDetailModal({ post, onClose }) {
  if (!post) return null;

  const isDoc = post.is_project_document || post.kind === 'project_document';
  const privCfg = PRIVACY_CONFIG[post.privacy] || PRIVACY_CONFIG.organization;
  const PrivIcon = privCfg.icon;

  const handleDownload = (file) => {
    // Tạo file text/blob giả định để tải về nếu chưa có binary URL
    const blob = new Blob([`Tài liệu dự án: ${post.title || post.projectName}\nFile: ${file.name}\nNội dung: ${post.summary}`], {
      type: file.name.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const modalContent = (
    <div className="potential-modal-backdrop" onClick={onClose}>
      <div
        className="potential-modal-content card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 28px',
          gap: 18,
          overflowY: 'auto',
          borderRadius: 20,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header với Tác giả / Người tạo & Quyền riêng tư */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {isDoc ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: 'rgba(5, 150, 105, 0.1)',
                    color: '#059669',
                    fontSize: 12,
                    fontWeight: 800,
                    border: '1px solid rgba(5, 150, 105, 0.25)',
                  }}
                >
                  📁 Hồ sơ tài liệu dự án
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: 'rgba(37, 99, 235, 0.1)',
                    color: 'var(--brand-600)',
                    fontSize: 12,
                    fontWeight: 800,
                    border: '1px solid rgba(37, 99, 235, 0.25)',
                  }}
                >
                  📰 Bài báo chí dự án
                </span>
              )}

              {/* Tên người dùng / Tác giả / Người lưu */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'var(--bg-surface-2)',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 700,
                  border: '1px solid var(--border)',
                }}
              >
                👤 {isDoc ? `Người lưu: ${post.creatorName || 'Người dùng BIS'}` : `Tác giả: ${post.authorName || 'Người dùng BIS'}`}
              </span>

              {/* Tag quyền riêng tư nếu là bài báo chí */}
              {!isDoc && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: privCfg.bg,
                    color: privCfg.color,
                    fontSize: 12,
                    fontWeight: 800,
                    border: `1px solid ${privCfg.border}`,
                  }}
                >
                  <PrivIcon size={13} />
                  <span>{privCfg.label}</span>
                </span>
              )}

              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                {fmtDate(post.summaryDate || post.date || post.createdAt)}
              </span>
            </div>

            <h2 style={{ margin: '10px 0 0', fontSize: 19, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {post.title || post.projectName}
            </h2>
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

        {/* Thông tin dự án đi kèm */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '8px 20px',
          padding: '12px 16px', borderRadius: 12,
          background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
          fontSize: 12.5,
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>📍 Vị trí: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{post.province || 'Toàn quốc'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>🏷️ Lĩnh vực: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{post.sector || 'Hạ tầng chung'}</strong>
          </div>
          {post.date && (
            <div>
              <span style={{ color: 'var(--text-muted)' }}>📅 Ngày văn bản: </span>
              <strong style={{ color: 'var(--text-primary)' }}>{fmtDate(post.date)}</strong>
            </div>
          )}
        </div>

        {/* Nội dung tóm tắt bài báo chí */}
        <div>
          <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={15} style={{ color: 'var(--brand-600)' }} />
            <span>Nội dung tóm tắt bài viết & biên bản dự án</span>
          </h4>
          <div style={{
            fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.65,
            background: 'var(--bg-surface-2)', padding: 16, borderRadius: 12,
            border: '1px solid var(--border)', whiteSpace: 'pre-line',
          }}>
            {post.summary}
          </div>
        </div>

        {/* Danh sách file tài liệu đính kèm */}
        {post.files && post.files.length > 0 && (
          <div>
            <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Paperclip size={15} style={{ color: '#059669' }} />
              <span>Tài liệu đính kèm ({post.files.length} file)</span>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {post.files.map((f, idx) => {
                const isDocx = f.name.endsWith('.docx') || f.name.endsWith('.doc');
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 10,
                      background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                        background: isDocx ? 'rgba(37, 99, 235, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                        color: isDocx ? '#2563eb' : '#dc2626',
                      }}>
                        {isDocx ? 'DOCX' : 'PDF'}
                      </span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{f.name}</div>
                        {f.size && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(f.size / 1024).toFixed(1)} KB</div>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownload(f)}
                      className="btn"
                      style={{
                        fontSize: 12, padding: '5px 12px', borderRadius: 8,
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: 'var(--bg-surface)', border: '1px solid var(--border)',
                        color: 'var(--brand-600)', fontWeight: 700,
                      }}
                    >
                      <Download size={13} />
                      <span>Tải về</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            style={{ fontSize: 13, padding: '8px 20px', borderRadius: 10 }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
