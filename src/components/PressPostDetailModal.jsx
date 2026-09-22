// src/components/PressPostDetailModal.jsx
// Xem chi tiết một tài liệu / bài đăng đã lưu ở máy chủ (/project-documents) và tải FILE GỐC.
import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Calendar, FileText, Download, Building2, Globe2, Lock, Paperclip, Trash2, Loader2,
  AlertCircle,
} from 'lucide-react';
import { projectDocumentsService, apiErrorMessage } from '../services/projectDocuments';

function fmtDate(iso) {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Khóa trùng giá trị `visibility` của máy chủ.
const PRIVACY_CONFIG = {
  private: {
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

/**
 * @param post     tài liệu đã qua `documentToItem` (services/projectDocuments.js)
 * @param variant  'document' (trang Dự án tiềm năng) | 'press' (trang Báo chí)
 * @param onDeleted gọi sau khi người đăng xóa tài liệu
 */
export default function PressPostDetailModal({ post, onClose, variant = 'document', onDeleted }) {
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  if (!post) return null;

  const isDoc = variant !== 'press';
  const privCfg = PRIVACY_CONFIG[post.privacy] || PRIVACY_CONFIG.private;
  const PrivIcon = privCfg.icon;
  const isDocx = (post.filename || '').toLowerCase().endsWith('.docx');

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      await projectDocumentsService.download(post);
    } catch (err) {
      setError(apiErrorMessage(err, 'Không tải được file. Vui lòng thử lại.'));
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Xóa tài liệu "${post.title}"? Thông tin và file gốc sẽ bị xóa khỏi hệ thống.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await projectDocumentsService.remove(post.id);
      if (typeof onDeleted === 'function') onDeleted(post);
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Không xóa được tài liệu.'));
      setDeleting(false);
    }
  };

  const modalContent = (
    <div className="potential-modal-backdrop" onClick={onClose}>
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 20,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header với Người đăng & Quyền riêng tư */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14,
          padding: '20px 26px 16px', borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
          flexShrink: 0,
        }}>
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

              {/* Người đăng */}
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
                👤 {isDoc ? 'Người lưu' : 'Tác giả'}: {post.is_owner ? 'Bạn' : (post.authorName || 'Người dùng BIS')}
              </span>

              {/* Quyền riêng tư */}
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

              <span style={{ fontSize: 12, color: 'var(--text-muted)' }} title="Ngày đăng">
                <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                {fmtDate(post.createdAt)}
              </span>
            </div>

            <h2 style={{ margin: '10px 0 0', fontSize: 19, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {post.title}
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

        {/* Scrollable Body */}
        <div
          className="custom-modal-scroll"
          style={{
            padding: '20px 26px',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            minHeight: 0,
          }}
        >
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)', color: '#dc2626',
              fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600,
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Thông tin dự án đi kèm */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px 20px',
            padding: '12px 16px', borderRadius: 12,
            background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
            fontSize: 12.5,
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>📍 Vị trí: </span>
              <strong style={{ color: 'var(--text-primary)' }}>{post.province || '—'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>📅 Ngày văn bản: </span>
              <strong style={{ color: 'var(--text-primary)' }}>{fmtDate(post.date)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>🗓️ Ngày tóm tắt: </span>
              <strong style={{ color: 'var(--text-primary)' }}>{fmtDate(post.summaryDate)}</strong>
            </div>
            {/* Máy chủ chỉ trả tên dự án theo dõi cho chính chủ dự án. */}
            {post.tracked_project_name && (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>📌 Dự án theo dõi: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{post.tracked_project_name}</strong>
              </div>
            )}
          </div>

          {/* Nội dung tóm tắt */}
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
              {post.summary || '—'}
            </div>
          </div>

          {/* File gốc đính kèm */}
          {post.filename && (
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Paperclip size={15} style={{ color: '#059669' }} />
                <span>Tài liệu đính kèm</span>
              </h4>
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  padding: '10px 14px', borderRadius: 10,
                  background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span style={{
                    padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                    background: isDocx ? 'rgba(37, 99, 235, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                    color: isDocx ? '#2563eb' : '#dc2626', flexShrink: 0,
                  }}>
                    {isDocx ? 'DOCX' : 'PDF'}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>{post.filename}</div>
                    {post.size_bytes > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(post.size_bytes / 1024).toFixed(1)} KB</div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="btn"
                  style={{
                    fontSize: 12, padding: '5px 12px', borderRadius: 8, flexShrink: 0,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    color: 'var(--brand-600)', fontWeight: 700,
                  }}
                >
                  {downloading ? <Loader2 size={13} className="spin" /> : <Download size={13} />}
                  <span>{downloading ? 'Đang tải...' : 'Tải về'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pinned Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
          padding: '14px 26px', borderTop: '1px solid var(--border-subtle, #f1f5f9)',
          background: 'var(--bg-surface-2)', flexShrink: 0,
        }}>
          {post.is_owner ? (
            <button
              type="button"
              className="btn"
              onClick={handleDelete}
              disabled={deleting}
              style={{
                fontSize: 12.5, padding: '8px 14px', borderRadius: 10, color: '#dc2626',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--bg-surface)', border: '1px solid rgba(220, 38, 38, 0.35)',
              }}
            >
              {deleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
              <span>Xóa tài liệu</span>
            </button>
          ) : <span />}
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
