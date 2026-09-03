// src/pages/PotentialProjectsPage.jsx
// Dự án tiềm năng theo lĩnh vực + cấu hình lĩnh vực người dùng theo dõi.
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Target, Settings2, Loader2, ExternalLink, Plus, Check, X,
  Building2, Calendar, Coins, MapPin, Filter, RefreshCw, AlertCircle,
  ShoppingBag, Globe, Newspaper, Search, ArrowRight, BookmarkCheck,
  CheckCircle2, Sparkles, SlidersHorizontal, Trash2, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { potentialService, itemKey } from '../services/potential';
import { projectsService } from '../services/projects';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 8;

// Màu & icon theo loại nguồn
const KIND_CONFIG = {
  procurement: {
    bg: 'rgba(59, 130, 246, 0.1)',
    fg: '#2563eb',
    border: 'rgba(59, 130, 246, 0.25)',
    icon: ShoppingBag,
    labelKey: 'potential.kindProcurement',
  },
  oda: {
    bg: 'rgba(16, 185, 129, 0.1)',
    fg: '#059669',
    border: 'rgba(16, 185, 129, 0.25)',
    icon: Globe,
    labelKey: 'potential.kindOda',
  },
  article: {
    bg: 'rgba(245, 158, 11, 0.1)',
    fg: '#d97706',
    border: 'rgba(245, 158, 11, 0.25)',
    icon: Newspaper,
    labelKey: 'potential.kindArticle',
  },
};

const AMOUNT_PRESETS = [
  { label: '> 10 Tỷ', value: 10000000000 },
  { label: '> 50 Tỷ', value: 50000000000 },
  { label: '> 100 Tỷ', value: 100000000000 },
  { label: '> 500 Tỷ', value: 500000000000 },
];

/** Chuẩn hóa chuỗi tiếng Việt không dấu để so khớp dự án đã theo dõi */
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
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Chip lĩnh vực — bấm để bật/tắt bộ lọc. */
function SectorChip({ sector, active, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(sector.slug)}
      aria-pressed={active}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '7px 14px', borderRadius: 999, cursor: 'pointer',
        fontSize: 12.5, fontWeight: 700, transition: 'all .2s cubic-bezier(0.4, 0, 0.2, 1)',
        background: active ? 'linear-gradient(135deg, var(--brand-500), var(--brand-600))' : 'var(--bg-surface-2)',
        color: active ? '#fff' : 'var(--text-secondary)',
        border: `1.5px solid ${active ? 'transparent' : 'var(--border)'}`,
        boxShadow: active ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
        transform: active ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {sector.name}
      <span style={{
        fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 999,
        background: active ? 'rgba(255,255,255,.24)' : 'var(--bg-surface)',
        color: active ? '#fff' : 'var(--text-muted)',
        border: active ? 'none' : '1px solid var(--border-subtle)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {sector.total}
      </span>
    </button>
  );
}

/** Skeleton Card hiển thị trạng thái đang tải mượt mà */
function PotentialSkeletonCard() {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 18,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Badges row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="skeleton" style={{ width: 88, height: 24, borderRadius: 999 }} />
        <div className="skeleton" style={{ width: 72, height: 24, borderRadius: 999 }} />
        <div className="skeleton" style={{ width: 64, height: 16, borderRadius: 4, marginLeft: 'auto' }} />
      </div>

      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '4px 0' }}>
        <div className="skeleton" style={{ width: '100%', height: 18, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: '85%', height: 18, borderRadius: 6 }} />
      </div>

      {/* Meta rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ width: '70%', height: 15, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: '55%', height: 15, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: '40%', height: 15, borderRadius: 4 }} />
      </div>

      {/* Sector tags */}
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <div className="skeleton" style={{ width: 60, height: 20, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 75, height: 20, borderRadius: 6 }} />
      </div>

      {/* Action buttons */}
      <div style={{
        display: 'flex', gap: 10, paddingTop: 14,
        borderTop: '1px solid var(--border-subtle)', marginTop: 'auto',
      }}>
        <div className="skeleton" style={{ width: 130, height: 36, borderRadius: 10 }} />
        <div className="skeleton" style={{ width: 110, height: 36, borderRadius: 10 }} />
      </div>
    </div>
  );
}

/** Một dự án tiềm năng với hỗ trợ bật/tắt theo dõi (Follow/Unfollow). */
function PotentialCard({ item, onToggleTrack, tracking, tracked }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const [isHoveredTrack, setIsHoveredTrack] = useState(false);

  // Badge nguồn chuẩn xác cho từng loại (World Bank, ADB, Đấu thầu công, Báo chí)
  const getBadgeConfig = () => {
    if (item.kind === 'procurement') {
      return {
        bg: 'rgba(59, 130, 246, 0.1)',
        fg: '#2563eb',
        border: 'rgba(59, 130, 246, 0.25)',
        icon: ShoppingBag,
        label: t('potential.kindProcurement') || 'Đấu thầu công',
      };
    }
    if (item.source_name === 'World Bank' || item.source_org === 'worldbank' || item.kind === 'worldbank') {
      return {
        bg: 'rgba(16, 185, 129, 0.1)',
        fg: '#059669',
        border: 'rgba(16, 185, 129, 0.25)',
        icon: Globe,
        label: 'World Bank',
      };
    }
    if (item.source_name === 'ADB' || item.source_org === 'adb' || item.kind === 'adb') {
      return {
        bg: 'rgba(245, 158, 11, 0.1)',
        fg: '#d97706',
        border: 'rgba(245, 158, 11, 0.25)',
        icon: Building2,
        label: 'Dự án ADB',
      };
    }
    if (item.kind === 'oda') {
      return {
        bg: 'rgba(16, 185, 129, 0.1)',
        fg: '#059669',
        border: 'rgba(16, 185, 129, 0.25)',
        icon: Globe,
        label: 'Dự án ODA',
      };
    }
    return {
      bg: 'rgba(245, 158, 11, 0.1)',
      fg: '#d97706',
      border: 'rgba(245, 158, 11, 0.25)',
      icon: Newspaper,
      label: t('potential.kindArticle') || 'Tin báo chí',
    };
  };

  const badgeCfg = getBadgeConfig();
  const BadgeIcon = badgeCfg.icon;

  const openInApp =
    item.kind === 'procurement' ? `/procurement/${encodeURIComponent(item.ref)}` : null;

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: `1px solid ${tracked ? 'rgba(16, 185, 129, 0.4)' : 'var(--border)'}`,
      borderRadius: 18,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      position: 'relative',
      transition: 'all .25s ease',
      boxShadow: tracked ? '0 4px 18px rgba(16, 185, 129, 0.09)' : 'var(--shadow-sm)',
    }}>
      {/* Header tags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 11.5, fontWeight: 800, padding: '4px 10px', borderRadius: 999,
          background: badgeCfg.bg, color: badgeCfg.fg, border: `1px solid ${badgeCfg.border}`,
          flex: 'none',
        }}>
          <BadgeIcon size={13} />
          {badgeCfg.label}
        </span>

        {item.stage && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
            background: 'var(--bg-surface-2)', color: 'var(--text-muted)',
            border: '1px solid var(--border)', flex: 'none',
          }}>
            {item.stage}
          </span>
        )}

        {tracked && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
            background: 'rgba(16, 185, 129, 0.12)', color: '#059669',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}>
            <CheckCircle2 size={12} /> {t('potential.tracked')}
          </span>
        )}

        {item.published_at && (
          <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--text-muted)', flex: 'none' }}>
            {fmtDate(item.published_at)}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 style={{
        margin: 0, fontSize: 15, fontWeight: 800, lineHeight: 1.5,
        color: 'var(--text-primary)',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {item.title}
      </h3>

      {/* Chi tiết dữ liệu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13 }}>
        {item.investor && (
          <div style={{ display: 'flex', gap: 8, color: 'var(--text-secondary)', alignItems: 'flex-start' }}>
            <Building2 size={15} style={{ flex: 'none', marginTop: 2, color: 'var(--text-muted)' }} />
            <span>
              <strong style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t('potential.investor')}:</strong>{' '}
              {item.investor}
            </span>
          </div>
        )}
        {item.amount && (
          <div style={{ display: 'flex', gap: 8, color: 'var(--text-secondary)', alignItems: 'center' }}>
            <Coins size={15} style={{ flex: 'none', color: '#10b981' }} />
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              <strong style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t('potential.value')}:</strong>{' '}
              <span style={{
                color: '#059669', fontWeight: 800, background: 'rgba(16, 185, 129, 0.08)',
                padding: '2px 7px', borderRadius: 6,
              }}>
                {item.amount}
              </span>
            </span>
          </div>
        )}
        {item.province && (
          <div style={{ display: 'flex', gap: 8, color: 'var(--text-secondary)', alignItems: 'center' }}>
            <MapPin size={15} style={{ flex: 'none', color: 'var(--text-muted)' }} />
            <span>{item.province}</span>
          </div>
        )}
        {item.expected_date && (
          <div style={{ display: 'flex', gap: 8, color: 'var(--text-secondary)', alignItems: 'center' }}>
            <Calendar size={15} style={{ flex: 'none', color: 'var(--brand-500)' }} />
            <span>
              <strong style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t('potential.expectedDate')}:</strong> {item.expected_date}
            </span>
          </div>
        )}
        {item.close_date && (
          <div style={{ display: 'flex', gap: 8, color: 'var(--text-secondary)', alignItems: 'center' }}>
            <Calendar size={15} style={{ flex: 'none', color: '#ef4444' }} />
            <span>
              <strong style={{ fontWeight: 700, color: '#ef4444' }}>{t('potential.closeDate')}:</strong> {item.close_date}
            </span>
          </div>
        )}
      </div>

      {/* Sector pills */}
      {item.sector_names?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          {item.sector_names.map((s) => (
            <span key={s} style={{
              fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6,
              background: 'var(--bg-surface-2)', color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
            }}>
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Footer buttons - Căn thẳng hàng 1 dòng duy nhất, tên nguồn dài tự động có dấu ... */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: (openInApp || item.url) ? 'minmax(0, auto) minmax(0, 1fr)' : 'auto',
        alignItems: 'center',
        gap: 8,
        paddingTop: 12,
        borderTop: '1px solid var(--border-subtle)',
        marginTop: 'auto',
      }}>
        {tracked ? (
          <button
            type="button"
            onClick={() => onToggleTrack(item, true)}
            onMouseEnter={() => setIsHoveredTrack(true)}
            onMouseLeave={() => setIsHoveredTrack(false)}
            disabled={tracking}
            title="Bấm để hủy theo dõi dự án này"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
              border: `1px solid ${isHoveredTrack ? '#fca5a5' : 'rgba(16, 185, 129, 0.4)'}`,
              background: isHoveredTrack ? '#fef2f2' : 'rgba(16, 185, 129, 0.1)',
              color: isHoveredTrack ? '#dc2626' : '#059669',
              cursor: tracking ? 'default' : 'pointer',
              whiteSpace: 'nowrap',
              flex: 'none',
              transition: 'all .2s ease',
            }}
          >
            {tracking ? (
              <Loader2 size={14} className="spin" />
            ) : isHoveredTrack ? (
              <Trash2 size={14} />
            ) : (
              <BookmarkCheck size={14} />
            )}
            <span>{isHoveredTrack ? 'Hủy theo dõi' : t('potential.tracked')}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onToggleTrack(item, false)}
            disabled={tracking}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
              border: 'none',
              background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))',
              color: '#fff',
              cursor: tracking ? 'default' : 'pointer',
              opacity: tracking ? 0.7 : 1,
              boxShadow: '0 3px 10px rgba(37, 99, 235, 0.25)',
              whiteSpace: 'nowrap',
              flex: 'none',
              transition: 'all .2s ease',
            }}
          >
            {tracking ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
            <span>{t('potential.track')}</span>
          </button>
        )}

        {openInApp ? (
          <button
            type="button"
            onClick={() => navigate(openInApp)}
            title={t('potential.viewSource')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700,
              border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
              color: 'var(--text-secondary)', cursor: 'pointer',
              transition: 'all .15s ease',
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <ExternalLink size={13} style={{ flex: 'none' }} />
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
            }}>
              {t('potential.viewSource')}
            </span>
          </button>
        ) : item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            title={item.source_name || t('potential.viewSource')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700,
              border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
              color: 'var(--text-secondary)', textDecoration: 'none',
              transition: 'all .15s ease',
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <ExternalLink size={13} style={{ flex: 'none' }} />
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
            }}>
              {item.source_name || t('potential.viewSource')}
            </span>
          </a>
        ) : null}
      </div>
    </div>
  );
}

/** Modal chọn lĩnh vực theo dõi — Dùng React Portal để căn chính giữa 100% màn hình */
function SectorConfigModal({ open, onClose, sectors, watched, onSave, saving }) {
  const { t } = useLang();
  const [picked, setPicked] = useState(watched);

  useEffect(() => { setPicked(watched); }, [watched, open]);

  if (!open) return null;

  const toggle = (slug) =>
    setPicked((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));

  const selectAll = () => setPicked(sectors.map((s) => s.slug));
  const deselectAll = () => setPicked([]);

  const modalContent = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        boxSizing: 'border-box',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t('potential.configTitle')}
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 22,
          padding: '28px 30px',
          width: '100%',
          maxWidth: 540,
          maxHeight: '85vh',
          overflowY: 'auto',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
          animation: 'fadeIn .2s ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: 'var(--text-primary)' }}>
              {t('potential.configTitle')}
            </h2>
            <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {t('potential.configDesc')}
            </p>
          </div>
          <button
            type="button" onClick={onClose} aria-label="Đóng"
            style={{
              marginLeft: 'auto', border: 'none', background: 'var(--bg-surface-2)',
              borderRadius: 10, width: 34, height: 34, cursor: 'pointer', flex: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
              transition: 'all .15s ease',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={selectAll}
            style={{
              fontSize: 12.5, fontWeight: 700, color: 'var(--brand-600)', background: 'none',
              border: 'none', cursor: 'pointer', padding: '3px 8px', borderRadius: 6,
            }}
          >
            {t('projects.selectAll') || 'Chọn tất cả'}
          </button>
          <span style={{ color: 'var(--border)' }}>|</span>
          <button
            type="button"
            onClick={deselectAll}
            style={{
              fontSize: 12.5, fontWeight: 700, color: 'var(--text-muted)', background: 'none',
              border: 'none', cursor: 'pointer', padding: '3px 8px', borderRadius: 6,
            }}
          >
            {t('projects.deselectAll') || 'Bỏ chọn tất cả'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
          {sectors.map((s) => {
            const on = picked.includes(s.slug);
            return (
              <label
                key={s.slug}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                  padding: '12px 16px', borderRadius: 14,
                  background: on ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-surface-2)',
                  border: `1.5px solid ${on ? 'var(--brand-400)' : 'transparent'}`,
                  transition: 'all .15s ease',
                }}
              >
                <input
                  type="checkbox" checked={on} onChange={() => toggle(s.slug)}
                  style={{ width: 18, height: 18, accentColor: 'var(--brand-500)', cursor: 'pointer' }}
                />
                <span style={{
                  fontSize: 14, fontWeight: 700,
                  color: on ? 'var(--brand-700)' : 'var(--text-primary)',
                }}>
                  {s.name}
                </span>
                <span style={{
                  marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {t('potential.sectorCount', { count: s.total })}
                </span>
              </label>
            );
          })}
        </div>

        <button
          type="button" onClick={() => onSave(picked)} disabled={saving}
          style={{
            padding: '13px 22px', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))',
            color: '#fff', fontSize: 14, fontWeight: 800,
            cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 6px 18px rgba(37, 99, 235, 0.3)',
            marginTop: 6,
          }}
        >
          {saving && <Loader2 size={16} className="spin" />}
          {t('potential.save')}
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default function PotentialProjectsPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { hasSourceAccess } = useAuth();

  const canProc = hasSourceAccess('gov');
  const canAdb = hasSourceAccess('adb');
  const canWb = hasSourceAccess('worldbank');
  const canOda = canAdb || canWb;

  // Khởi tạo ngay từ cache để khi chuyển tab khác rồi quay lại không bị chớp hay load lại
  const initialCachedWatched = potentialService.getCachedWatchedSectors();
  const initialCachedList = potentialService.getCachedList({ page: 1, size: PAGE_SIZE });

  const [sectors, setSectors] = useState(() => initialCachedWatched?.available || []);
  const [watched, setWatched] = useState(() => initialCachedWatched?.sectors || []);
  const [filterSectors, setFilterSectors] = useState([]);
  const [kind, setKind] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Tự động hoàn lại bộ lọc về '' nếu loại nguồn được chọn không thuộc gói đã mua
  useEffect(() => {
    if (kind === 'procurement' && !canProc) {
      setKind('');
      setPage(1);
    }
    if (kind === 'adb' && !canAdb) {
      setKind('');
      setPage(1);
    }
    if (kind === 'worldbank' && !canWb) {
      setKind('');
      setPage(1);
    }
    if (kind === 'oda' && !canOda) {
      setKind('');
      setPage(1);
    }
  }, [kind, canProc, canAdb, canWb, canOda]);

  const [data, setData] = useState(() => initialCachedList || { items: [], total: 0, sectors_applied: [] });
  const [page, setPage] = useState(1);
  const [initialLoading, setInitialLoading] = useState(() => !initialCachedList);
  const [isPageFetching, setIsPageFetching] = useState(false);
  const [err, setErr] = useState(null);

  const [showConfig, setShowConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [trackingKey, setTrackingKey] = useState(null);
  const [trackedKeys, setTrackedKeys] = useState(() => new Set());
  const [userProjects, setUserProjects] = useState(() => projectsService.getCachedProjects() || []);
  const [msg, setMsg] = useState(null);

  const toast = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  // Tải danh sách dự án user đang theo dõi
  const loadUserProjects = useCallback(async (forceFresh = false) => {
    try {
      const list = await projectsService.getProjects(forceFresh);
      setUserProjects(list || []);
    } catch {
      // Bỏ qua lỗi phụ nếu chưa đăng nhập / lỗi mạng tạm thời
    }
  }, []);

  useEffect(() => {
    loadUserProjects(true);
  }, [loadUserProjects]);

  // Danh mục lĩnh vực + lựa chọn của người dùng
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await potentialService.getWatchedSectors();
        if (!alive) return;
        setWatched(res.sectors || []);
        setSectors(res.available || []);
      } catch {
        if (alive && sectors.length === 0) setSectors([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  const load = useCallback(async (forceFresh = false) => {
    // Kiểm tra cache trước
    const cached = potentialService.getCachedList({
      sectors: filterSectors,
      kinds: kind ? [kind] : undefined,
      minAmount: minAmount ? Number(minAmount) : undefined,
      page,
      size: PAGE_SIZE,
    });

    if (cached && !forceFresh) {
      setData(cached);
      setInitialLoading(false);
      setIsPageFetching(false);
      return;
    }

    // Nếu chưa có dữ liệu nào mới bật initialLoading (tránh giật màn hình khi lọc / chuyển trang)
    if (!data.items?.length) {
      setInitialLoading(true);
    } else {
      setIsPageFetching(true);
    }
    setErr(null);

    try {
      const res = await potentialService.list({
        sectors: filterSectors,
        kinds: kind ? [kind] : undefined,
        minAmount: minAmount ? Number(minAmount) : undefined,
        page,
        size: PAGE_SIZE,
        forceFresh,
      });
      setData(res);
    } catch (e) {
      setErr(e.response?.data?.detail || 'Không tải được danh sách dự án tiềm năng.');
    } finally {
      setInitialLoading(false);
      setIsPageFetching(false);
    }
  }, [filterSectors, kind, minAmount, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Danh sách các dự án chuẩn hóa từ DB của user để tra cứu tức thời
  const normalizedUserProjects = useMemo(() => {
    return userProjects.map((p) => ({
      id: p.id,
      name: p.name,
      note: p.note || '',
      normName: normalizeText(p.name),
      normKw: normalizeText(p.keyword_filter),
    }));
  }, [userProjects]);

  // Tìm dự án đã theo dõi tương ứng
  const findMatchingProject = useCallback((item) => {
    const key = itemKey(item);
    const itemNorm = normalizeText(item.title);
    if (!itemNorm && !key) return null;

    return normalizedUserProjects.find((p) => {
      // 1. So khớp chính xác qua mã ref đã lưu trong note
      if (key && p.note && p.note.includes(`[ref:${key}]`)) return true;
      // 2. So khớp theo tên / từ khóa dự án
      if (!itemNorm) return false;
      if (p.normName === itemNorm || p.normKw === itemNorm) return true;
      if (p.normName.length >= 10 && itemNorm.includes(p.normName)) return true;
      if (itemNorm.length >= 10 && p.normName.includes(itemNorm)) return true;
      return false;
    });
  }, [normalizedUserProjects]);

  // Kiểm tra xem 1 potential item đã được theo dõi chưa
  const isItemTracked = useCallback((item) => {
    const key = itemKey(item);
    if (trackedKeys.has(key)) return true;
    return !!findMatchingProject(item);
  }, [trackedKeys, findMatchingProject]);

  const toggleSector = (slug) => {
    setPage(1);
    setFilterSectors((cur) =>
      cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]
    );
  };

  const saveSectors = async (slugs) => {
    setSaving(true);
    try {
      const res = await potentialService.setWatchedSectors(slugs);
      setWatched(res.sectors || []);
      setSectors(res.available || []);
      setShowConfig(false);
      setPage(1);
      toast('success', t('potential.saved'));
      load(true);
    } catch (e) {
      toast('error', e.response?.data?.detail || 'Không lưu được lĩnh vực theo dõi.');
    } finally {
      setSaving(false);
    }
  };

  // Thêm hoặc Hủy theo dõi dự án (Toggle Follow)
  const handleToggleTrack = async (item, currentlyTracked) => {
    const key = itemKey(item);
    setTrackingKey(key);

    if (currentlyTracked) {
      // HỦY THEO DÕI
      const matched = findMatchingProject(item);
      if (matched?.id) {
        try {
          await projectsService.deleteProject(matched.id);
          setTrackedKeys((cur) => {
            const next = new Set(cur);
            next.delete(key);
            return next;
          });
          setUserProjects((cur) => cur.filter((p) => p.id !== matched.id));
          toast('success', `Đã hủy theo dõi dự án "${item.title.slice(0, 36)}…"`);
        } catch (e) {
          toast('error', e.response?.data?.detail || 'Không hủy được theo dõi.');
        } finally {
          setTrackingKey(null);
        }
      } else {
        setTrackedKeys((cur) => {
          const next = new Set(cur);
          next.delete(key);
          return next;
        });
        setTrackingKey(null);
      }
    } else {
      // THÊM THEO DÕI
      try {
        const created = await projectsService.createProject({
          name: item.title.slice(0, 255),
          keyword_filter: item.title.slice(0, 512),
          investor: item.investor || undefined,
          sector: item.sectors?.[0] || undefined,
          province: item.province || undefined,
          note: `[ref:${key}]`,
        });
        setTrackedKeys((cur) => new Set(cur).add(key));
        setUserProjects((cur) => [created, ...cur]);
        toast('success', `Đã thêm "${item.title.slice(0, 36)}…" vào danh sách theo dõi.`);
      } catch (e) {
        if (e.response?.status === 409) {
          setTrackedKeys((cur) => new Set(cur).add(key));
          await loadUserProjects(true);
          toast('success', 'Dự án này đã có trong danh sách theo dõi của bạn.');
        } else {
          toast('error', e.response?.data?.detail || 'Không thêm được vào danh sách theo dõi.');
        }
      } finally {
        setTrackingKey(null);
      }
    }
  };

  // Lọc trực tiếp theo ô tìm kiếm trên trang (dữ liệu nguồn đã được server phân loại theo kinds)
  const displayItems = useMemo(() => {
    let items = data.items || [];

    if (!searchQuery.trim()) return items;
    const qNorm = normalizeText(searchQuery);
    return items.filter((item) => {
      const titleNorm = normalizeText(item.title);
      const invNorm = normalizeText(item.investor);
      const provNorm = normalizeText(item.province);
      return titleNorm.includes(qNorm) || invNorm.includes(qNorm) || provNorm.includes(qNorm);
    });
  }, [data.items, searchQuery]);

  const applied = data.sectors_applied || [];
  const totalPages = Math.max(1, Math.ceil((data.total || 0) / PAGE_SIZE));

  // Tạo danh sách trang hiển thị dạng số đẹp mắt
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  }, [page, totalPages]);
  const lockedToArticles =
    !initialLoading && !err && data.items.length > 0 && data.items.every((i) => i.kind === 'article');

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 100px)' }}>
      {msg && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          padding: '13px 22px', borderRadius: 14, fontSize: 13.5, fontWeight: 700,
          background: msg.type === 'success' ? '#059669' : '#dc2626', color: '#fff',
          boxShadow: '0 10px 30px rgba(0,0,0,.22)', maxWidth: 440,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Hero Banner với thiết kế sang trọng & nút điều hướng rõ ràng */}
      <div style={{
        background: 'linear-gradient(135deg, #091e2f 0%, #064e3b 50%, #0b1f33 100%)',
        borderRadius: 24, padding: '30px 34px', color: '#fff', marginBottom: 24,
        border: '1px solid rgba(255,255,255,.12)', boxShadow: '0 16px 40px rgba(6, 78, 59, 0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 24, position: 'relative', overflow: 'hidden',
      }}>
        {/* Ánh sáng điểm nhấn */}
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 220, height: 220,
          background: 'radial-gradient(circle, rgba(16,185,129,0.35) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, zIndex: 1 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, flex: 'none',
            background: 'linear-gradient(135deg, #10b981, #0284c7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.45)',
          }}>
            <Target size={32} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 23, fontWeight: 900, margin: 0, color: '#fff', letterSpacing: '-0.02em' }}>
                {t('potential.title')}
              </h1>
              <span style={{
                fontSize: 11.5, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
                background: 'rgba(255,255,255,0.15)', color: '#6ee7b7',
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
                <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
                Realtime Intelligence
              </span>
            </div>
            <p style={{ fontSize: 13.5, color: '#cbd5e1', margin: '6px 0 0', maxWidth: '64ch', lineHeight: 1.5 }}>
              {t('potential.subtitle')}
            </p>
          </div>
        </div>

        {/* Cụm nút hành động trên Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, zIndex: 1, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate('/projects')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px',
              borderRadius: 14, border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer',
              background: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 800, fontSize: 13,
              backdropFilter: 'blur(10px)', transition: 'all .2s ease',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            }}
          >
            <BookmarkCheck size={16} />
            Dự án theo dõi ({userProjects.length})
            <ArrowRight size={14} style={{ opacity: 0.8 }} />
          </button>

          <button
            type="button"
            onClick={() => setShowConfig(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px',
              borderRadius: 14, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #10b981, #0d9488)',
              color: '#fff', fontWeight: 800, fontSize: 13.5,
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.45)',
              transition: 'all .2s ease',
            }}
          >
            <Settings2 size={17} /> {t('potential.configSectors')}
          </button>
        </div>
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 20, padding: 20, marginBottom: 24,
        display: 'flex', flexDirection: 'column', gap: 16,
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Hàng 1: Tiêu đề bộ lọc + Tìm kiếm nhanh */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} style={{ color: 'var(--brand-500)' }} />
            <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>
              {t('projects.sector')}
            </span>
            <span style={{
              fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-surface-2)',
              padding: '2px 8px', borderRadius: 999,
            }}>
              {applied.length > 0
                ? `${t('potential.filteringBy')}: ${applied.length}`
                : t('potential.noFilter')}
            </span>
            {filterSectors.length > 0 && (
              <button
                type="button"
                onClick={() => { setFilterSectors([]); setPage(1); }}
                style={{
                  marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 4,
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, color: 'var(--brand-600)',
                }}
              >
                <RefreshCw size={12} /> {t('potential.allSectors')}
              </button>
            )}
          </div>

          {/* Ô tìm kiếm nhanh */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '7px 12px', minWidth: 280,
          }}>
            <Search size={15} style={{ color: 'var(--text-muted)', flex: 'none' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm nhanh tiêu đề, chủ đầu tư..."
              style={{
                border: 'none', background: 'transparent', outline: 'none',
                fontSize: 12.5, color: 'var(--text-primary)', width: '100%',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Danh sách Sector Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {sectors.map((s) => (
            <SectorChip
              key={s.slug}
              sector={s}
              active={filterSectors.includes(s.slug)}
              onToggle={toggleSector}
            />
          ))}
        </div>

        {/* Hàng 3: Loại nguồn + Giá trị tối thiểu + Preset buttons */}
        <div style={{
          display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
          paddingTop: 12, borderTop: '1px solid var(--border-subtle)',
        }}>
          {/* Nút lọc nguồn */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
              Nguồn dữ liệu:
            </span>
            <div style={{
              display: 'inline-flex', background: 'var(--bg-surface-2)',
              padding: 3, borderRadius: 12, border: '1px solid var(--border)',
              flexWrap: 'wrap', gap: 2,
            }}>
              {[
                { id: '', label: t('potential.kindAll'), icon: SlidersHorizontal, allowed: true },
                { id: 'procurement', label: t('potential.kindProcurement'), icon: ShoppingBag, allowed: canProc, pkgName: 'Đấu Thầu Công' },
                { id: 'adb', label: 'Dự án ADB', icon: Building2, allowed: canAdb, pkgName: 'Dự Án ADB' },
                { id: 'worldbank', label: 'World Bank', icon: Globe, allowed: canWb, pkgName: 'World Bank' },
                { id: 'article', label: t('potential.kindArticle'), icon: Newspaper, allowed: true },
              ].map((k) => {
                const active = kind === k.id;
                const Icon = k.icon;
                const isAllowed = k.allowed;
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => {
                      if (!isAllowed) {
                        toast('error', `Bạn cần nâng cấp gói ${k.pkgName} để sử dụng bộ lọc này.`);
                        return;
                      }
                      setKind(k.id);
                      setPage(1);
                    }}
                    title={!isAllowed ? `Yêu cầu gói ${k.pkgName} để lọc nguồn này` : ''}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '6px 12px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                      border: 'none',
                      cursor: isAllowed ? 'pointer' : 'not-allowed',
                      opacity: isAllowed ? 1 : 0.5,
                      transition: 'all .15s ease',
                      background: active ? 'var(--bg-surface)' : 'transparent',
                      color: active ? 'var(--brand-600)' : isAllowed ? 'var(--text-secondary)' : 'var(--text-muted)',
                      boxShadow: active ? 'var(--shadow-sm)' : 'none',
                    }}
                  >
                    <Icon size={13} />
                    {k.label}
                    {!isAllowed && <Lock size={11} style={{ marginLeft: 2, opacity: 0.8 }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lọc giá tối thiểu & Presets (Chỉ hiện khi có quyền xem Đấu thầu công) */}
          {canProc && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                {t('potential.minAmount')}:
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                {AMOUNT_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => { setMinAmount(String(p.value)); setPage(1); }}
                    style={{
                      padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                      border: '1px solid var(--border)',
                      background: String(minAmount) === String(p.value) ? 'var(--brand-50)' : 'var(--bg-surface-2)',
                      color: String(minAmount) === String(p.value) ? 'var(--brand-700)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <input
                type="number" min="0" step="1000000000" value={minAmount}
                onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
                placeholder="0 VND"
                style={{
                  padding: '6px 10px', borderRadius: 10, fontSize: 12.5, width: 130,
                  border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
                  color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums',
                }}
              />
              {minAmount && (
                <button
                  type="button"
                  onClick={() => { setMinAmount(''); setPage(1); }}
                  style={{
                    border: 'none', background: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  }}
                >
                  Xóa
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Danh sách kết quả & Skeleton loading */}
      {initialLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--brand-600)', fontSize: 13.5, fontWeight: 700 }}>
            <Loader2 size={16} className="spin" style={{ color: 'var(--brand-500)' }} />
            <span>Đang lọc và cập nhật danh sách dự án tiềm năng...</span>
          </div>
          <div style={{
            display: 'grid', gap: 18,
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <PotentialSkeletonCard key={i} />
            ))}
          </div>
        </div>
      ) : err ? (
        <div className="empty-state" style={{ minHeight: 280, background: 'var(--bg-surface)', borderRadius: 20, border: '1px solid var(--border)' }}>
          <div className="empty-icon">⚠️</div>
          <div className="empty-title">{err}</div>
          <button
            type="button"
            onClick={() => load(true)}
            style={{
              marginTop: 14, padding: '9px 18px', borderRadius: 10, border: 'none',
              background: 'var(--brand-500)', color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Thử lại
          </button>
        </div>
      ) : displayItems.length === 0 ? (
        <div className="empty-state" style={{ minHeight: 320, background: 'var(--bg-surface)', borderRadius: 20, border: '1px solid var(--border)' }}>
          <div className="empty-icon">🎯</div>
          <div className="empty-title">{t('potential.empty')}</div>
          <div className="empty-sub">{t('potential.emptySub')}</div>
          {(filterSectors.length > 0 || kind || minAmount || searchQuery) && (
            <button
              type="button"
              onClick={() => { setFilterSectors([]); setKind(''); setMinAmount(''); setSearchQuery(''); setPage(1); }}
              style={{
                marginTop: 14, padding: '9px 18px', borderRadius: 10, border: '1px solid var(--border)',
                background: 'var(--bg-surface-2)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Đặt lại tất cả bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {isPageFetching && (
            <div style={{
              position: 'absolute', top: -8, right: 0,
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, color: 'var(--brand-600)', fontWeight: 700,
            }}>
              <Loader2 size={13} className="spin" /> Đang cập nhật...
            </div>
          )}

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16, flexWrap: 'wrap', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                {t('potential.total', { count: data.total })}
              </span>
              {searchQuery && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  (Lọc hiển thị {displayItems.length} kết quả)
                </span>
              )}
            </div>

            {lockedToArticles && (
              <span style={{
                fontSize: 12, fontWeight: 700, color: '#b45309', background: '#fffbeb',
                border: '1px solid #fde68a', padding: '4px 12px', borderRadius: 999,
              }}>
                {t('potential.emptyLocked')}
              </span>
            )}
          </div>

          <div style={{
            display: 'grid', gap: 18,
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            opacity: isPageFetching ? 0.75 : 1,
            transition: 'opacity .15s ease',
          }}>
            {displayItems.map((item) => {
              const key = itemKey(item);
              const tracked = isItemTracked(item);
              return (
                <PotentialCard
                  key={key}
                  item={item}
                  onToggleTrack={handleToggleTrack}
                  tracking={trackingKey === key}
                  tracked={tracked}
                />
              );
            })}
          </div>

          {totalPages > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              gap: 6, marginTop: 32, flexWrap: 'wrap',
            }}>
              <button
                type="button" disabled={page <= 1}
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 350, behavior: 'smooth' });
                }}
                style={{
                  minWidth: 38, height: 38, padding: '0 12px', borderRadius: 10,
                  fontSize: 13, fontWeight: 700,
                  border: '1px solid var(--border)', background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.35 : 1,
                  boxShadow: 'var(--shadow-sm)', transition: 'all .15s ease',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}
                title="Trang trước"
              >
                ←
              </button>

              {pageNumbers.map((pNum, idx) => {
                if (pNum === '...') {
                  return (
                    <span key={`dots-${idx}`} style={{ padding: '0 6px', color: 'var(--text-muted)', fontSize: 13, fontWeight: 700 }}>
                      …
                    </span>
                  );
                }
                const isActive = pNum === page;
                return (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => {
                      setPage(pNum);
                      window.scrollTo({ top: 350, behavior: 'smooth' });
                    }}
                    style={{
                      minWidth: 38, height: 38, padding: '0 8px', borderRadius: 10,
                      fontSize: 13, fontWeight: 800,
                      border: isActive ? 'none' : '1px solid var(--border)',
                      background: isActive ? 'linear-gradient(135deg, var(--brand-500), var(--brand-600))' : 'var(--bg-surface)',
                      color: isActive ? '#fff' : 'var(--text-primary)',
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'var(--shadow-sm)',
                      transition: 'all .15s ease',
                    }}
                  >
                    {pNum}
                  </button>
                );
              })}

              <button
                type="button" disabled={page >= totalPages}
                onClick={() => {
                  setPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 350, behavior: 'smooth' });
                }}
                style={{
                  minWidth: 38, height: 38, padding: '0 12px', borderRadius: 10,
                  fontSize: 13, fontWeight: 700,
                  border: '1px solid var(--border)', background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.35 : 1,
                  boxShadow: 'var(--shadow-sm)', transition: 'all .15s ease',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}
                title="Trang sau"
              >
                →
              </button>
            </div>
          )}
        </div>
      )}

      <SectorConfigModal
        open={showConfig}
        onClose={() => setShowConfig(false)}
        sectors={sectors}
        watched={watched}
        onSave={saveSectors}
        saving={saving}
      />
    </div>
  );
}
