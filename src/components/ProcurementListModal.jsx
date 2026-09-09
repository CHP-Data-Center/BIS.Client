// src/components/ProcurementListModal.jsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  X, ShoppingBag, Search, ExternalLink, Copy, Check,
  Building2, Calendar, ArrowRight, ShieldCheck, FileText
} from 'lucide-react';

export default function ProcurementListModal({
  open,
  onClose,
  projectName,
  investorName,
  tenders = [],
}) {
  const nav = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  React.useEffect(() => {
    if (open) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const handleCopy = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const norm = (s) => (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

  const filteredTenders = tenders.filter((t) => {
    if (!searchTerm.trim()) return true;
    const q = norm(searchTerm.trim());
    return (
      norm(t.id).includes(q) ||
      norm(t.title).includes(q) ||
      norm(t.procuring_entity).includes(q)
    );
  });

  return createPortal(
    <div
      onClick={onClose}
      onWheel={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1000000,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        overscrollBehavior: 'contain',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Danh sách toàn bộ gói thầu khớp chủ đầu tư"
        style={{
          width: 'min(1000px, 95vw)',
          maxHeight: '88vh',
          overscrollBehavior: 'contain',
          background: 'var(--bg-surface, #ffffff)',
          borderRadius: 24,
          border: '1px solid var(--border, #e2e8f0)',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
          margin: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '22px 28px',
            borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            background: 'linear-gradient(to bottom, var(--bg-surface-2, #f8fafc), var(--bg-surface, #ffffff))',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(37, 99, 235, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb',
                  flexShrink: 0,
                }}
              >
                <ShoppingBag size={20} />
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 900,
                  color: 'var(--text-primary, #0f172a)',
                  lineHeight: 1.3,
                }}
              >
                Toàn bộ gói thầu khớp ({tenders.length})
              </h2>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 20,
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                }}
              >
                Đấu thầu Quốc gia (e-GP)
              </span>
            </div>
            {investorName && (
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--text-secondary, #64748b)',
                  marginTop: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Building2 size={13} style={{ flexShrink: 0, color: '#2563eb' }} />
                <span>Chủ đầu tư / Bên mời thầu: <strong>{investorName}</strong></span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng popup"
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              border: '1px solid var(--border, #e2e8f0)',
              background: 'var(--bg-surface, #ffffff)',
              color: 'var(--text-muted, #94a3b8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary, #0f172a)';
              e.currentTarget.style.background = 'var(--bg-surface-2, #f8fafc)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted, #94a3b8)';
              e.currentTarget.style.background = 'var(--bg-surface, #ffffff)';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar: Search filter */}
        <div
          style={{
            padding: '14px 28px',
            background: 'var(--bg-surface-2, #f8fafc)',
            borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 460 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted, #94a3b8)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="search"
              placeholder="Tìm theo mã gói thầu, tên gói thầu, đơn vị..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                height: 38,
                padding: '6px 12px 6px 36px',
                borderRadius: 10,
                fontSize: 13,
                border: '1px solid var(--border, #e2e8f0)',
                background: 'var(--bg-surface, #ffffff)',
                color: 'var(--text-primary, #0f172a)',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--brand-500, #3b82f6)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border, #e2e8f0)'}
            />
          </div>

          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>
            Hiển thị <span style={{ color: '#2563eb' }}>{filteredTenders.length}</span> / {tenders.length} gói thầu
          </div>
        </div>

        {/* Tender List Body */}
        <div
          style={{
            padding: '20px 28px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {filteredTenders.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                Không tìm thấy gói thầu nào khớp từ khóa
              </div>
              <p style={{ fontSize: 13, marginTop: 4 }}>
                Thử nhập mã số TBMT, KHLCNT hoặc rút ngắn từ khóa tìm kiếm.
              </p>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    marginTop: 8,
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border, #e2e8f0)',
                    background: 'var(--bg-surface, #ffffff)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: '#2563eb',
                  }}
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : (
            filteredTenders.map((t, idx) => {
              const isPlan = t.id?.startsWith('PL') || t.title?.toLowerCase().includes('kế hoạch');
              return (
                <div
                  key={t.id || idx}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 16,
                    background: 'var(--bg-surface, #ffffff)',
                    border: '1px solid var(--border, #e2e8f0)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--brand-400, #60a5fa)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.08)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border, #e2e8f0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.02)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  {/* Row 1: Badges & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: isPlan ? '#fef3c7' : '#eff6ff',
                          color: isPlan ? '#b45309' : '#1d4ed8',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {isPlan ? <FileText size={12} /> : <ShieldCheck size={12} />}
                        {isPlan ? 'KHLCNT' : 'TBMT'}
                      </span>

                      {/* Mã gói thầu + nút copy */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: 'var(--bg-surface-2, #f8fafc)',
                          border: '1px solid var(--border, #e2e8f0)',
                          borderRadius: 6,
                          padding: '2px 8px',
                          fontSize: 12,
                          fontWeight: 800,
                          color: '#1e40af',
                          fontFamily: 'monospace',
                        }}
                      >
                        <span>{t.id}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(e, t.id)}
                          title="Sao chép mã gói thầu"
                          style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            color: copiedId === t.id ? '#10b981' : 'var(--text-muted, #94a3b8)',
                          }}
                        >
                          {copiedId === t.id ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      </div>

                      {t.publish_date && (
                        <span
                          style={{
                            fontSize: 11.5,
                            color: 'var(--text-muted, #94a3b8)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Calendar size={12} />
                          {t.publish_date}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {t.url && (
                        <a
                          href={t.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11.5,
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: 8,
                            color: 'var(--text-secondary, #64748b)',
                            background: 'var(--bg-surface-2, #f8fafc)',
                            border: '1px solid var(--border, #e2e8f0)',
                            textDecoration: 'none',
                          }}
                        >
                          e-GP <ExternalLink size={11} />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          nav(`/procurement/${encodeURIComponent(t.id)}`);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: 12,
                          fontWeight: 800,
                          padding: '5px 12px',
                          borderRadius: 8,
                          color: '#ffffff',
                          background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                        }}
                      >
                        Chi tiết <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Title */}
                  <h3
                    onClick={() => {
                      onClose();
                      nav(`/procurement/${encodeURIComponent(t.id)}`);
                    }}
                    style={{
                      margin: 0,
                      fontSize: 14.5,
                      fontWeight: 800,
                      color: 'var(--text-primary, #0f172a)',
                      lineHeight: 1.45,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#2563eb'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary, #0f172a)'}
                  >
                    {t.title}
                  </h3>

                  {/* Row 3: Procuring Entity */}
                  {t.procuring_entity && (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-muted, #64748b)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'var(--bg-surface-2, #f8fafc)',
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--border-subtle, #f1f5f9)',
                      }}
                    >
                      <Building2 size={13} style={{ flexShrink: 0, color: '#3b82f6' }} />
                      <span style={{ fontWeight: 600 }}>Bên mời thầu:</span>
                      <span style={{ color: 'var(--text-secondary, #334155)', fontWeight: 700 }}>
                        {t.procuring_entity}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 28px',
            borderTop: '1px solid var(--border-subtle, #f1f5f9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-2, #f8fafc)',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)' }}>
            Dữ liệu đối sánh trực tiếp từ Hệ thống Mạng Đấu thầu Quốc gia (e-GP)
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid var(--border, #e2e8f0)',
              background: 'var(--bg-surface, #ffffff)',
              color: 'var(--text-primary, #0f172a)',
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
