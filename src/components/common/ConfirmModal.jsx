import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, HelpCircle, Loader2, X, AlertCircle } from 'lucide-react';
import { useLang } from '../../context/LanguageContext';

export default function ConfirmModal({
  isOpen,
  title,
  message,
  itemName = '',
  itemSub = '',
  confirmText,
  cancelText,
  type = 'danger', // 'danger' | 'warning' | 'info'
  loading = false,
  onConfirm,
  onClose,
}) {
  const { t } = useLang();
  const modalTitle = title || t('common.confirm');
  const modalMsg = message || t('common.deleteWarning');
  const modalConfirm = confirmText || (type === 'danger' ? t('common.delete') : t('common.confirm'));
  const modalCancel = cancelText || t('common.cancel');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && !loading) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const isWarning = type === 'warning';

  // Theme config
  const theme = {
    danger: {
      color: '#ef4444',
      bgGrad: 'linear-gradient(135deg, #ef4444, #dc2626)',
      glow: 'rgba(239, 68, 68, 0.35)',
      badgeBg: '#fef2f2',
      badgeBorder: '#fecdd3',
      iconColor: '#e11d48',
    },
    warning: {
      color: '#f59e0b',
      bgGrad: 'linear-gradient(135deg, #f59e0b, #d97706)',
      glow: 'rgba(245, 158, 11, 0.35)',
      badgeBg: '#fffbeb',
      badgeBorder: '#fde68a',
      iconColor: '#d97706',
    },
    info: {
      color: '#3b82f6',
      bgGrad: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      glow: 'rgba(59, 130, 246, 0.35)',
      badgeBg: '#eff6ff',
      badgeBorder: '#bfdbfe',
      iconColor: '#2563eb',
    }
  }[type] || {
    color: '#ef4444',
    bgGrad: 'linear-gradient(135deg, #ef4444, #dc2626)',
    glow: 'rgba(239, 68, 68, 0.35)',
    badgeBg: '#fef2f2',
    badgeBorder: '#fecdd3',
    iconColor: '#e11d48',
  };

  return createPortal(
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(10px) saturate(180%)',
        WebkitBackdropFilter: 'blur(10px) saturate(180%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 99999,
        padding: 20,
        animation: 'modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose?.();
      }}
    >
      <div
        style={{
          background: 'var(--bg-surface, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: 24,
          padding: '30px 28px 26px',
          width: '100%',
          maxWidth: 460,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          animation: 'modalScaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 32, height: 32, borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--border-subtle, #f1f5f9)',
            background: 'var(--bg-surface-2, #f8fafc)',
            color: 'var(--text-muted, #94a3b8)', cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary, #0f172a)';
            e.currentTarget.style.background = 'var(--border, #e2e8f0)';
            e.currentTarget.style.transform = 'rotate(90deg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted, #94a3b8)';
            e.currentTarget.style.background = 'var(--bg-surface-2, #f8fafc)';
            e.currentTarget.style.transform = 'rotate(0deg)';
          }}
        >
          <X size={16} />
        </button>

        {/* Centered Glowing Icon Badge */}
        <div
          style={{
            width: 64, height: 64, borderRadius: 22,
            background: theme.badgeBg,
            border: `1px solid ${theme.badgeBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 18,
            boxShadow: `0 10px 25px ${theme.glow}`,
            position: 'relative'
          }}
        >
          {isDanger ? (
            <Trash2 size={28} style={{ color: theme.iconColor }} />
          ) : isWarning ? (
            <AlertTriangle size={28} style={{ color: theme.iconColor }} />
          ) : (
            <HelpCircle size={28} style={{ color: theme.iconColor }} />
          )}
        </div>

        {/* Modal Title */}
        <h3 style={{
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--text-primary, #0f172a)',
          margin: '0 0 8px 0',
          letterSpacing: '-0.4px',
          lineHeight: 1.3
        }}>
          {modalTitle}
        </h3>

        {/* Message / Description */}
        <p style={{
          fontSize: 13.5,
          color: 'var(--text-secondary, #475569)',
          margin: 0,
          lineHeight: 1.55,
          padding: '0 8px'
        }}>
          {modalMsg}
        </p>

        {/* Item Preview Callout Card (If itemName provided) */}
        {itemName && (
          <div style={{
            width: '100%',
            background: 'var(--bg-surface-2, #f8fafc)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: 14,
            padding: '12px 16px',
            margin: '14px 0 0',
            textAlign: 'left',
            boxSizing: 'border-box'
          }}>
            <div style={{
              fontSize: 13.5,
              fontWeight: 800,
              color: 'var(--text-primary, #0f172a)',
              wordBreak: 'break-word',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.color, flexShrink: 0 }} />
              {itemName}
            </div>
            {itemSub && (
              <div style={{
                fontSize: 12,
                color: 'var(--text-muted, #94a3b8)',
                marginTop: 4,
                wordBreak: 'break-word',
                lineHeight: 1.45,
              }}>
                {itemSub}
              </div>
            )}
          </div>
        )}

        {/* Irreversible Warning Tag */}
        {isDanger && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11.5,
            fontWeight: 700,
            color: '#ef4444',
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            padding: '3px 10px',
            borderRadius: 20,
            marginTop: 14
          }}>
            <AlertCircle size={12} /> {t('common.deleteWarning')}
          </div>
        )}

        {/* Action Buttons Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          width: '100%',
          marginTop: 24
        }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={loading}
            style={{
              height: 42,
              borderRadius: 12,
              fontSize: 13.5,
              fontWeight: 700,
              color: 'var(--text-secondary, #475569)',
              border: '1px solid var(--border, #e2e8f0)',
              background: 'var(--bg-surface, #ffffff)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: '100%',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-surface-2, #f8fafc)';
              e.currentTarget.style.borderColor = 'var(--text-muted, #94a3b8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-surface, #ffffff)';
              e.currentTarget.style.borderColor = 'var(--border, #e2e8f0)';
            }}
          >
            {modalCancel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              height: 42,
              borderRadius: 12,
              fontSize: 13.5,
              fontWeight: 700,
              color: '#ffffff',
              background: theme.bgGrad,
              border: 'none',
              boxShadow: `0 8px 20px ${theme.glow}`,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
              opacity: loading ? 0.75 : 1,
              width: '100%'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = `0 12px 26px ${theme.glow}`;
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 8px 20px ${theme.glow}`;
              }
            }}
          >
            {loading && <Loader2 size={16} style={{ animation: 'spin 0.6s linear infinite' }} />}
            {modalConfirm}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalScaleUp {
          from { opacity: 0; transform: scale(0.9) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}
