// src/pages/PotentialProjectsPage.jsx
// Dự án tiềm năng theo lĩnh vực + cấu hình lĩnh vực người dùng theo dõi.
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Target, Settings2, Loader2, ExternalLink, Plus, X,
  Building2, Calendar, Coins, MapPin, Filter, RefreshCw, AlertCircle,
  ShoppingBag, Globe, Newspaper, Search, ArrowRight, BookmarkCheck,
  CheckCircle2, Sparkles, SlidersHorizontal, Trash2, Lock, RotateCcw,
  ChevronDown, Check
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
      className={`potential-sector-chip ${active ? 'active' : ''}`}
    >
      <span>{sector.name}</span>
      <span className="potential-sector-count">
        {sector.total}
      </span>
    </button>
  );
}

/** Skeleton Card hiển thị trạng thái đang tải mượt mà */
function PotentialSkeletonCard() {
  return (
    <div className="potential-project-card card skeleton-card">
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
        bg: 'rgba(59, 130, 246, 0.12)',
        fg: '#2563eb',
        border: 'rgba(59, 130, 246, 0.28)',
        icon: ShoppingBag,
        label: t('potential.kindProcurement') || 'Đấu thầu công',
      };
    }
    if (item.source_name === 'World Bank' || item.source_org === 'worldbank' || item.kind === 'worldbank') {
      return {
        bg: 'rgba(16, 185, 129, 0.12)',
        fg: '#059669',
        border: 'rgba(16, 185, 129, 0.28)',
        icon: Globe,
        label: 'World Bank',
      };
    }
    if (item.source_name === 'ADB' || item.source_org === 'adb' || item.kind === 'adb') {
      return {
        bg: 'rgba(245, 158, 11, 0.12)',
        fg: '#d97706',
        border: 'rgba(245, 158, 11, 0.28)',
        icon: Building2,
        label: 'Dự án ADB',
      };
    }
    if (item.kind === 'oda') {
      return {
        bg: 'rgba(16, 185, 129, 0.12)',
        fg: '#059669',
        border: 'rgba(16, 185, 129, 0.28)',
        icon: Globe,
        label: 'Dự án ODA',
      };
    }
    return {
      bg: 'rgba(245, 158, 11, 0.12)',
      fg: '#d97706',
      border: 'rgba(245, 158, 11, 0.28)',
      icon: Newspaper,
      label: t('potential.kindArticle') || 'Tin báo chí',
    };
  };

  const badgeCfg = getBadgeConfig();
  const BadgeIcon = badgeCfg.icon;

  const openInApp =
    item.kind === 'procurement' ? `/procurement/${encodeURIComponent(item.ref)}` : null;

  return (
    <div className={`potential-project-card card ${tracked ? 'is-tracked' : ''}`}>
      {/* Header tags */}
      <div className="potential-card-header">
        <span
          className="potential-badge-tag"
          style={{ background: badgeCfg.bg, color: badgeCfg.fg, borderColor: badgeCfg.border }}
        >
          <BadgeIcon size={13} />
          {badgeCfg.label}
        </span>

        {item.stage && (
          <span className="potential-stage-tag">
            {item.stage}
          </span>
        )}

        {tracked && (
          <span className="potential-tracked-tag">
            <CheckCircle2 size={12} /> {t('potential.tracked')}
          </span>
        )}

        {item.published_at && (
          <span className="potential-date-tag">
            {fmtDate(item.published_at)}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="potential-card-title" title={item.title}>
        {item.title}
      </h3>

      {/* Related Projects tag */}
      {item.related_projects?.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4, marginBottom: 6 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
            background: 'rgba(99, 102, 241, 0.12)', color: '#4f46e5',
            border: '1px solid rgba(99, 102, 241, 0.25)',
          }}>
            <Sparkles size={11} />
            <span>{t('potential.relatedProject')}: {item.related_projects.join(', ')}</span>
          </span>
        </div>
      )}

      {/* Chi tiết dữ liệu */}
      <div className="potential-data-rows">
        {item.investor && (
          <div className="potential-meta-row">
            <Building2 size={15} className="potential-meta-icon" />
            <span>
              <strong>{t('potential.investor')}:</strong>{' '}
              {item.investor}
            </span>
          </div>
        )}
        {item.amount && (
          <div className="potential-meta-row">
            <Coins size={15} className="potential-meta-icon text-success" />
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              <strong>{t('potential.value')}:</strong>{' '}
              <span className="potential-amount-highlight">
                {item.amount}
              </span>
            </span>
          </div>
        )}
        {item.province && (
          <div className="potential-meta-row">
            <MapPin size={15} className="potential-meta-icon" />
            <span>{item.province}</span>
          </div>
        )}
        {item.expected_date && (
          <div className="potential-meta-row">
            <Calendar size={15} className="potential-meta-icon text-brand" />
            <span>
              <strong>{t('potential.expectedDate')}:</strong> {item.expected_date}
            </span>
          </div>
        )}
        {item.close_date && (
          <div className="potential-meta-row text-danger">
            <Calendar size={15} className="potential-meta-icon text-danger" />
            <span>
              <strong>{t('potential.closeDate')}:</strong> {item.close_date}
            </span>
          </div>
        )}
      </div>

      {/* Sector pills */}
      {item.sector_names?.length > 0 && (
        <div className="potential-sector-tags">
          {item.sector_names.map((s) => (
            <span key={s} className="potential-tag-pill">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Footer buttons - Căn thẳng hàng 1 dòng duy nhất, tên nguồn dài tự động có dấu ... */}
      <div className="potential-card-actions">
        {tracked ? (
          <button
            type="button"
            onClick={() => onToggleTrack(item, true)}
            onMouseEnter={() => setIsHoveredTrack(true)}
            onMouseLeave={() => setIsHoveredTrack(false)}
            disabled={tracking}
            title="Bấm để hủy theo dõi dự án này"
            className={`potential-action-btn tracked ${isHoveredTrack ? 'danger-hover' : ''}`}
          >
            {tracking ? (
              <Loader2 size={14} className="spin" style={{ animation: 'spin 0.8s linear infinite' }} />
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
            className="potential-action-btn track"
          >
            {tracking ? <Loader2 size={14} className="spin" style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={14} />}
            <span>{t('potential.track')}</span>
          </button>
        )}

        {openInApp ? (
          <button
            type="button"
            onClick={() => navigate(openInApp)}
            title={t('potential.viewSource')}
            className="potential-action-btn view-source"
          >
            <ExternalLink size={13} style={{ flex: 'none' }} />
            <span>
              {t('potential.viewSource')}
            </span>
          </button>
        ) : item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            title={item.source_name || t('potential.viewSource')}
            className="potential-action-btn view-source"
          >
            <ExternalLink size={13} style={{ flex: 'none' }} />
            <span>
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
    <div className="potential-modal-backdrop" onClick={onClose}>
      <div
        className="potential-modal-content card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t('potential.configTitle')}
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
            className="potential-modal-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={selectAll}
            className="potential-modal-link-btn"
          >
            {t('projects.selectAll') || 'Chọn tất cả'}
          </button>
          <span style={{ color: 'var(--border)' }}>|</span>
          <button
            type="button"
            onClick={deselectAll}
            className="potential-modal-link-btn text-muted"
          >
            {t('projects.deselectAll') || 'Bỏ chọn tất cả'}
          </button>
        </div>

        <div className="potential-modal-sectors-list">
          {sectors.map((s) => {
            const on = picked.includes(s.slug);
            return (
              <label
                key={s.slug}
                className={`potential-modal-sector-item ${on ? 'active' : ''}`}
              >
                <input
                  type="checkbox" checked={on} onChange={() => toggle(s.slug)}
                  style={{ width: 18, height: 18, accentColor: 'var(--brand-500)', cursor: 'pointer' }}
                />
                <span className="potential-modal-sector-name">
                  {s.name}
                </span>
                <span className="potential-modal-sector-count">
                  {t('potential.sectorCount', { count: s.total })}
                </span>
              </label>
            );
          })}
        </div>

        <button
          type="button" onClick={() => onSave(picked)} disabled={saving}
          className="potential-modal-save-btn"
        >
          {saving && <Loader2 size={16} className="spin" />}
          {t('potential.save')}
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// Danh sách các tỉnh/thành và khu vực phổ biến
const PROVINCES_LIST = [
  'Toàn quốc / Việt Nam',
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
  'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
  'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
  'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
  'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
  'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
  'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
  'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
  'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
  'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
  'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
  'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái',
  'Philippines', 'Indonesia', 'Thailand', 'Lào', 'Campuchia',
];

// Danh sách chủ đầu tư / bên mời thầu lớn thường gặp
const POPULAR_INVESTORS = [
  'Ban QLDA Đường sắt',
  'Ban QLDA Thăng Long',
  'Ban QLDA Mỹ Thuận',
  'Ban QLDA Giao thông',
  'Ban QLDA 2',
  'Ban QLDA 6',
  'Ban QLDA 7',
  'Ban QLDA 85',
  'Tập đoàn Điện lực Việt Nam (EVN)',
  'Tập đoàn Dầu khí Việt Nam (PVN)',
  'Tổng công ty Cảng hàng không (ACV)',
  'Tổng công ty Đầu tư phát triển đường cao tốc (VEC)',
  'Tập đoàn Bưu chính Viễn thông (VNPT)',
  'Tập đoàn Công nghiệp - Viễn thông Quân đội (Viettel)',
  'Ngân hàng Phát triển Châu Á (ADB)',
  'Ngân hàng Thế giới (World Bank)',
  'Sở Giao thông Vận tải',
  'Sở Xây dựng',
  'Sở Nông nghiệp và Phát triển nông thôn',
  'UBND Tỉnh / Thành phố',
];

/** Component Dropdown chọn kèm tìm kiếm nhanh (Combobox) */
function PotentialDropdown({
  icon: Icon,
  placeholder,
  value,
  onChange,
  options = [],
  allLabel = 'Tất cả',
  accentColor = 'var(--brand-500)',
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const s = normalizeText(search);
    return options.filter((opt) => normalizeText(opt).includes(s));
  }, [options, search]);

  const handleSelect = (val) => {
    onChange(val === allLabel ? '' : val);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setOpen(false);
    setSearch('');
  };

  return (
    <div className="potential-dropdown-wrapper" ref={ref}>
      <button
        type="button"
        className={`potential-dropdown-trigger ${value ? 'has-value' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <Icon size={15} className="potential-dropdown-icon" style={{ color: value ? accentColor : 'var(--text-muted)' }} />
        <span className="potential-dropdown-label" style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {value ? <strong>{value}</strong> : placeholder}
        </span>
        {value ? (
          <span
            role="button"
            className="potential-dropdown-clear"
            onClick={handleClear}
            title="Xóa lựa chọn"
          >
            <X size={14} />
          </span>
        ) : (
          <ChevronDown size={14} className={`potential-dropdown-arrow ${open ? 'open' : ''}`} />
        )}
      </button>

      {open && (
        <div className="potential-dropdown-menu card">
          <div className="potential-dropdown-search">
            <Search size={13} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Gõ tìm nhanh trong danh sách..."
              className="potential-dropdown-search-input"
            />
            {search && (
              <button
                type="button"
                className="potential-search-clear"
                onClick={() => setSearch('')}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="potential-dropdown-list">
            <button
              type="button"
              className={`potential-dropdown-item ${!value ? 'selected' : ''}`}
              onClick={() => handleSelect('')}
            >
              <span>{allLabel}</span>
              {!value && <Check size={14} className="potential-dropdown-check" />}
            </button>

            {filtered.map((opt) => {
              const isSelected = value && value.toLowerCase() === opt.toLowerCase();
              return (
                <button
                  key={opt}
                  type="button"
                  className={`potential-dropdown-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt)}
                >
                  <span className="truncate">{opt}</span>
                  {isSelected && <Check size={14} className="potential-dropdown-check" />}
                </button>
              );
            })}

            {search.trim() && !filtered.some((o) => o.toLowerCase() === search.trim().toLowerCase()) && (
              <button
                type="button"
                className="potential-dropdown-item custom-search-item"
                onClick={() => handleSelect(search.trim())}
              >
                <span>🔍 Chọn tìm theo "{search.trim()}"</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
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
  const [filterName, setFilterName] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterInvestor, setFilterInvestor] = useState('');

  const [data, setData] = useState(() => initialCachedList || { items: [], total: 0, sectors_applied: [] });

  // Danh sách các địa phương gồm tỉnh thành cố định + các địa phương có trong dữ liệu
  const availableProvinces = useMemo(() => {
    const fromItems = (data.items || [])
      .map((i) => i.province)
      .filter(Boolean);
    const set = new Set([...PROVINCES_LIST, ...fromItems]);
    return Array.from(set);
  }, [data.items]);

  // Danh sách các chủ đầu tư / bên mời thầu gồm danh sách phổ biến + thực tế từ dữ liệu
  const availableInvestors = useMemo(() => {
    const fromItems = (data.items || [])
      .map((i) => i.investor)
      .filter(Boolean);
    const set = new Set([...POPULAR_INVESTORS, ...fromItems]);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [data.items]);

  const [page, setPage] = useState(1);
  const [relatedOnly, setRelatedOnly] = useState(false);

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
  const [initialLoading, setInitialLoading] = useState(() => !initialCachedList);
  const [isPageFetching, setIsPageFetching] = useState(false);
  const [err, setErr] = useState(null);

  const [showConfig, setShowConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [trackingKey, setTrackingKey] = useState(null);
  const [trackedKeys, setTrackedKeys] = useState(() => new Set());
  const [userProjects, setUserProjects] = useState(() => projectsService.getCachedProjects() || []);
  const [msg, setMsg] = useState(null);

  // Chống Race Condition khi bấm filter liên tục và Debounce
  const reqIdRef = useRef(0);
  const debounceTimerRef = useRef(null);
  const trackingKeysRef = useRef(new Set());

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
    const currentReqId = ++reqIdRef.current;

    // Kiểm tra cache trước
    const cached = potentialService.getCachedList({
      sectors: filterSectors,
      kinds: kind ? [kind] : undefined,
      minAmount: minAmount ? Number(minAmount) : undefined,
      title: filterName,
      province: filterLocation,
      investor: filterInvestor,
      relatedOnly,
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
        title: filterName,
        province: filterLocation,
        investor: filterInvestor,
        relatedOnly,
        page,
        size: PAGE_SIZE,
        forceFresh,
      });

      // RACE CONDITION GUARD: Chỉ nhận kết quả nếu request này là request mới nhất!
      // Bỏ qua hoàn toàn các request cũ để không bị giật / nhảy dữ liệu liên tục sau khi bấm nhanh.
      if (currentReqId !== reqIdRef.current) {
        return;
      }

      setData(res);
    } catch (e) {
      if (currentReqId !== reqIdRef.current) return;
      setErr(e.response?.data?.detail || 'Không tải được danh sách dự án tiềm năng.');
    } finally {
      if (currentReqId === reqIdRef.current) {
        setInitialLoading(false);
        setIsPageFetching(false);
      }
    }
  }, [filterSectors, kind, minAmount, filterName, filterLocation, filterInvestor, relatedOnly, page, data.items?.length]);

  useEffect(() => {
    // 1. Nếu có sẵn trong cache -> cập nhật ngay tức thì 0ms, không cần debounce
    const cached = potentialService.getCachedList({
      sectors: filterSectors,
      kinds: kind ? [kind] : undefined,
      minAmount: minAmount ? Number(minAmount) : undefined,
      title: filterName,
      province: filterLocation,
      investor: filterInvestor,
      relatedOnly,
      page,
      size: PAGE_SIZE,
    });
    if (cached) {
      setData(cached);
      setInitialLoading(false);
      setIsPageFetching(false);
      return;
    }

    // 2. Nếu chưa có cache -> bật ngay trạng thái loading mờ để phản hồi lập tức cho người dùng
    if (data.items?.length) {
      setIsPageFetching(true);
    }

    // 3. Debounce nhẹ 250ms để gộp các lượt click / gõ phím liên tiếp thành 1 request duy nhất
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      load();
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [load, filterSectors, kind, minAmount, filterName, filterLocation, filterInvestor, page]);


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
    if (!key || trackingKeysRef.current.has(key)) return;
    trackingKeysRef.current.add(key);
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
          // KHÔNG gửi keyword_filter: backend tự rút vài từ khóa ngắn từ tên (AI nếu có,
          // luật nếu không). Gửi nguyên tiêu đề như trước thì trang dự án tách theo dấu
          // phẩy thành các thẻ dài dòng vô nghĩa.
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
        trackingKeysRef.current.delete(key);
        setTrackingKey(null);
      }
    }
  };

  // Dữ liệu đã được server phân loại và lọc theo lĩnh vực, nguồn, giá trị, tên, vị trí, chủ đầu tư
  const displayItems = useMemo(() => {
    return data.items || [];
  }, [data.items]);

  // Đếm số lượng tiêu chí lọc đang được áp dụng
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterSectors.length > 0) count++;
    if (kind) count++;
    if (minAmount) count++;
    if (filterName.trim()) count++;
    if (filterLocation.trim()) count++;
    if (filterInvestor.trim()) count++;
    if (relatedOnly) count++;
    return count;
  }, [filterSectors.length, kind, minAmount, filterName, filterLocation, filterInvestor, relatedOnly]);

  // Đặt lại toàn bộ bộ lọc về trạng thái ban đầu
  const resetAllFilters = useCallback(() => {
    setFilterSectors([]);
    setKind('');
    setMinAmount('');
    setFilterName('');
    setFilterLocation('');
    setFilterInvestor('');
    setRelatedOnly(false);
    setPage(1);
  }, []);

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
    !canProc && !canOda && !kind &&
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

      {/* Hero Banner với thiết kế chuẩn Theme & nút điều hướng rõ ràng */}
      <div className="potential-hero-banner card">
        {/* Ánh sáng điểm nhấn */}
        <div className="potential-hero-glow" />

        <div className="potential-hero-content">
          <div className="potential-hero-icon-box">
            <Target size={32} />
          </div>
          <div>
            <div className="potential-hero-heading-row">
              <h1 className="potential-hero-title">
                {t('potential.title')}
              </h1>
              <span className="potential-hero-badge">
                <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
                Realtime Intelligence
              </span>
            </div>
            <p className="potential-hero-subtitle">
              {t('potential.subtitle')}
            </p>
          </div>
        </div>

        {/* Cụm nút hành động trên Header */}
        <div className="potential-hero-actions">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="potential-banner-btn-secondary"
          >
            <BookmarkCheck size={16} />
            <span>Dự án theo dõi ({userProjects.length})</span>
            <ArrowRight size={14} style={{ opacity: 0.8 }} />
          </button>

          <button
            type="button"
            onClick={() => setShowConfig(true)}
            className="potential-banner-btn-primary"
          >
            <Settings2 size={17} />
            <span>{t('potential.configSectors')}</span>
          </button>
        </div>
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <div className="potential-filter-card card">
        {/* Hàng 1: Tiêu đề bộ lọc + Nút đặt lại */}
        <div className="potential-filter-header">
          <div className="potential-filter-title-group">
            <Filter size={16} className="potential-filter-icon" />
            <span className="potential-filter-title">
              {t('projects.sector')}
            </span>
            <span className="potential-filter-count">
              {applied.length > 0
                ? `${t('potential.filteringBy')}: ${applied.length}`
                : t('potential.noFilter')}
            </span>
            {filterSectors.length > 0 && (
              <button
                type="button"
                onClick={() => { setFilterSectors([]); setPage(1); }}
                className="potential-reset-sectors-btn"
              >
                <RefreshCw size={12} /> {t('potential.allSectors')}
              </button>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="potential-clear-all-btn"
              title={t('potential.clearFilters') || 'Đặt lại bộ lọc'}
            >
              <RotateCcw size={13} />
              <span>{t('potential.clearFilters') || 'Đặt lại bộ lọc'} ({activeFiltersCount})</span>
            </button>
          )}
        </div>

        {/* Danh sách Sector Chips */}
        <div className="potential-sector-chips-grid">
          {sectors.map((s) => (
            <SectorChip
              key={s.slug}
              sector={s}
              active={filterSectors.includes(s.slug)}
              onToggle={toggleSector}
            />
          ))}
        </div>

        {/* Hàng 2: 3 Ô Lọc Tìm kiếm: Tên dự án, Vị trí, Chủ đầu tư */}
        <div className="potential-filter-inputs-row">
          {/* 1. Lọc theo Tên dự án */}
          <div className={`potential-filter-input-box ${filterName ? 'has-value' : ''}`}>
            <Search size={15} className="potential-filter-input-icon" style={{ color: filterName ? 'var(--brand-500)' : 'var(--text-muted)' }} />
            <input
              type="text"
              value={filterName}
              onChange={(e) => { setFilterName(e.target.value); setPage(1); }}
              placeholder={t('potential.filterNamePlaceholder') || 'Tìm theo tên dự án, gói thầu...'}
              className="potential-search-input"
            />
            {filterName && (
              <button
                type="button"
                onClick={() => { setFilterName(''); setPage(1); }}
                className="potential-search-clear"
                title="Xóa tìm kiếm tên dự án"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* 2. Lọc theo Vị trí / Địa phương (Dropdown) */}
          <PotentialDropdown
            icon={MapPin}
            placeholder={t('potential.filterLocationPlaceholder') || 'Chọn vị trí, địa phương...'}
            value={filterLocation}
            onChange={(val) => { setFilterLocation(val); setPage(1); }}
            options={availableProvinces}
            allLabel="Tất cả vị trí"
            accentColor="#10b981"
          />

          {/* 3. Lọc theo Chủ đầu tư (Dropdown) */}
          <PotentialDropdown
            icon={Building2}
            placeholder={t('potential.filterInvestorPlaceholder') || 'Chọn chủ đầu tư, bên mời thầu...'}
            value={filterInvestor}
            onChange={(val) => { setFilterInvestor(val); setPage(1); }}
            options={availableInvestors}
            allLabel="Tất cả chủ đầu tư"
            accentColor="#f59e0b"
          />
        </div>

        {/* Hàng 3: Loại nguồn + Lọc liên quan + Giá trị tối thiểu */}
        <div className="potential-filter-subrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {/* Nút lọc nguồn */}
          <div className="potential-kind-group">
            <span className="potential-subrow-label">
              Nguồn dữ liệu:
            </span>
            <div className="potential-kind-pills">
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
                    className={`potential-kind-tab ${active ? 'active' : ''} ${!isAllowed ? 'disabled' : ''}`}
                  >
                    <Icon size={13} />
                    <span>{k.label}</span>
                    {!isAllowed && <Lock size={11} style={{ marginLeft: 2, opacity: 0.8 }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nút bật/tắt Lọc liên quan dự án đang theo dõi */}
          <button
            type="button"
            onClick={() => {
              setRelatedOnly((prev) => !prev);
              setPage(1);
            }}
            title={relatedOnly ? 'Đang chỉ hiện tin liên quan dự án của bạn (Bấm để xem tất cả)' : 'Bấm để chỉ lọc tin liên quan dự án của bạn'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.15s ease',
              border: relatedOnly ? '1px solid #6366f1' : '1px solid var(--border)',
              background: relatedOnly ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface-2)',
              color: relatedOnly ? '#4f46e5' : 'var(--text-secondary)',
              boxShadow: relatedOnly ? '0 2px 8px rgba(99, 102, 241, 0.25)' : 'none',
            }}
          >
            <Sparkles size={13} style={{ color: relatedOnly ? '#4f46e5' : 'var(--text-muted)' }} />
            <span>{t('potential.relatedOnly')}</span>
            {relatedOnly && <Check size={13} style={{ strokeWidth: 3 }} />}
          </button>

          {/* Lọc giá tối thiểu & Presets (Chỉ hiện khi có quyền xem Đấu thầu công) */}
          {canProc && (
            <div className="potential-amount-group">
              <span className="potential-subrow-label">
                {t('potential.minAmount')}:
              </span>
              <div className="potential-preset-buttons">
                {AMOUNT_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => { setMinAmount(String(p.value)); setPage(1); }}
                    className={`potential-preset-chip ${String(minAmount) === String(p.value) ? 'active' : ''}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <input
                type="number" min="0" step="1000000000" value={minAmount}
                onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
                placeholder="0 VND"
                className="potential-amount-input"
              />
              {minAmount && (
                <button
                  type="button"
                  onClick={() => { setMinAmount(''); setPage(1); }}
                  className="potential-amount-clear"
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
          <div className="empty-icon">{relatedOnly ? '🔍' : '🎯'}</div>
          <div className="empty-title">
            {relatedOnly ? (t('potential.emptyRelated') || 'Không tìm thấy tin liên quan đến các dự án bạn đang theo dõi') : t('potential.empty')}
          </div>
          <div className="empty-sub">
            {relatedOnly ? (t('potential.emptyRelatedSub') || 'Hệ thống đối chiếu theo Tên, Chủ đầu tư, Lĩnh vực và Địa phương của các dự án bạn đã khai báo.') : t('potential.emptySub')}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            {relatedOnly && (
              <button
                type="button"
                onClick={() => { setRelatedOnly(false); setPage(1); }}
                style={{
                  padding: '9px 18px', borderRadius: 10, border: 'none',
                  background: 'var(--brand-500)', color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                }}
              >
                <span>Xem tất cả tin tiềm năng</span>
              </button>
            )}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetAllFilters}
                style={{
                  padding: '9px 18px', borderRadius: 10, border: '1px solid var(--border)',
                  background: 'var(--bg-surface-2)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
              >
                <RotateCcw size={14} />
                <span>{t('potential.clearFilters') || 'Đặt lại tất cả bộ lọc'}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {isPageFetching && (
            <div style={{
              position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)',
              zIndex: 10, display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg-surface)', border: '1px solid var(--brand-500)',
              padding: '9px 20px', borderRadius: 999,
              boxShadow: '0 10px 28px rgba(37, 99, 235, 0.22)',
              fontSize: 13, color: 'var(--brand-600)', fontWeight: 800,
              backdropFilter: 'blur(10px)', animation: 'fadeIn .15s ease-out',
            }}>
              <Loader2 size={16} className="spin" style={{ color: 'var(--brand-500)' }} />
              <span>Đang lọc dữ liệu...</span>
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
              {(filterName || filterLocation || filterInvestor) && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  (Khớp {data.total} kết quả)
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
            opacity: isPageFetching ? 0.38 : 1,
            filter: isPageFetching ? 'grayscale(0.2)' : 'none',
            pointerEvents: isPageFetching ? 'none' : 'auto',
            transition: 'all .15s ease',
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
            <div className="potential-pagination">
              <button
                type="button" disabled={page <= 1}
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 350, behavior: 'smooth' });
                }}
                className="potential-page-arrow-btn"
                title="Trang trước"
              >
                ←
              </button>

              {pageNumbers.map((pNum, idx) => {
                if (pNum === '...') {
                  return (
                    <span key={`dots-${idx}`} className="potential-page-dots">
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
                    className={`potential-page-btn ${isActive ? 'active' : ''}`}
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
                className="potential-page-arrow-btn"
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
