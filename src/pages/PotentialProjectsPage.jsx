// src/pages/PotentialProjectsPage.jsx
// Dự án tiềm năng theo lĩnh vực + cấu hình lĩnh vực người dùng theo dõi.
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Target, Settings2, Loader2, ExternalLink, Plus, X,
  Building2, Calendar, Coins, MapPin, Filter, RefreshCw, AlertCircle,
  ShoppingBag, Globe, Newspaper, Search, ArrowRight, BookmarkCheck,
  CheckCircle2, Sparkles, SlidersHorizontal, Trash2, Lock, RotateCcw,
  ChevronDown, Check, Link2, Unlink, FolderKanban, FileText, FileCheck, Send,
  User, Globe2, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { potentialService, itemKey } from '../services/potential';
import { projectsService } from '../services/projects';
import { projectDocumentsService } from '../services/projectDocuments';
import ProjectDocumentPostModal from '../components/ProjectDocumentPostModal';
import PressPostDetailModal from '../components/PressPostDetailModal';
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
/** Một dự án tiềm năng hoặc bài đăng báo chí dự án với hỗ trợ bật/tắt theo dõi và xem tài liệu. */
function PotentialCard({ item, onToggleTrack, tracking, tracked, link, onLink, onUnlink, linking, onOpenPressPost }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const [isHoveredTrack, setIsHoveredTrack] = useState(false);

  // Badge nguồn chuẩn xác cho từng loại (Tài liệu dự án, Báo chí nội bộ, World Bank, ADB, Đấu thầu công, Tin tức ngoài)
  const getBadgeConfig = () => {
    if (item.is_project_document || item.kind === 'project_document') {
      return {
        bg: 'rgba(5, 150, 105, 0.12)',
        fg: '#059669',
        border: 'rgba(5, 150, 105, 0.3)',
        icon: FileCheck,
        label: `📁 Tài liệu: ${item.creatorName || 'Người dùng'}`,
      };
    }
    if (item.is_user_post || item.kind === 'user_article') {
      return {
        bg: 'rgba(37, 99, 235, 0.12)',
        fg: '#2563eb',
        border: 'rgba(37, 99, 235, 0.28)',
        icon: Newspaper,
        label: `📰 Báo chí: ${item.authorName || 'Tác giả'}`,
      };
    }
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

        {item.privacy && (
          <span
            className="potential-stage-tag"
            style={{
              background: item.privacy === 'only_me' ? 'rgba(139, 92, 246, 0.1)' : item.privacy === 'organization' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              color: item.privacy === 'only_me' ? '#7c3aed' : item.privacy === 'organization' ? '#2563eb' : '#059669',
              borderColor: item.privacy === 'only_me' ? 'rgba(139, 92, 246, 0.25)' : item.privacy === 'organization' ? 'rgba(37, 99, 235, 0.25)' : 'rgba(16, 185, 129, 0.25)',
              fontWeight: 800,
            }}
          >
            {item.privacy === 'only_me' ? '🔒 Chỉ mình tôi' : item.privacy === 'organization' ? '🏢 Tổ chức' : '🌐 Công khai'}
          </span>
        )}

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

        {link && (
          <span className="potential-tracked-tag" title={t('potential.linkedTo')}>
            <FolderKanban size={12} /> {link.project_name || link.display_name}
          </span>
        )}

        {(item.published_at || item.summaryDate || item.date) && (
          <span className="potential-date-tag">
            {fmtDate(item.published_at || item.summaryDate || item.date)}
          </span>
        )}
      </div>

      {/* Title — đã gắn vào dự án theo dõi thì hiện TÊN DỰ ÁN, giữ tiêu đề gốc ngay dưới để
          người dùng vẫn đối chiếu được với nguồn. */}
      <h3 className="potential-card-title" title={item.title || item.projectName}>
        {link?.display_name || item.title || item.projectName}
      </h3>
      {link?.display_name && link.display_name !== item.title && (
        <div
          title={item.title}
          style={{
            fontSize: 11.5, color: 'var(--text-muted)', marginTop: -2, marginBottom: 6,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {t('potential.originalTitle')}: {item.title}
        </div>
      )}

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

      {/* Tóm tắt văn bản / bài báo chí nếu có */}
      {item.summary && (
        <div
          style={{
            fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5,
            background: 'var(--bg-surface-2)', padding: '8px 12px', borderRadius: 8,
            border: '1px solid var(--border)', marginTop: 4, marginBottom: 6,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
        >
          {item.summary}
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

      {/* Danh sách file đính kèm nếu có */}
      {item.files?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
            background: 'rgba(5, 150, 105, 0.1)', color: '#059669', border: '1px solid rgba(5, 150, 105, 0.25)',
          }}>
            📎 {item.files.length} tài liệu đính kèm ({item.files.map((f) => f.type?.toUpperCase() || 'DOC').join(', ')})
          </span>
        </div>
      )}

      {/* Sector pills */}
      {(item.sector_names?.length > 0 || item.sector) && (
        <div className="potential-sector-tags">
          {(item.sector_names || [item.sector]).filter(Boolean).map((s) => (
            <span key={s} className="potential-tag-pill">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Footer buttons - Căn thẳng hàng 1 dòng duy nhất */}
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

        {link ? (
          <button
            type="button"
            onClick={() => onUnlink(link)}
            disabled={linking}
            title={t('potential.unlink')}
            className="potential-action-btn view-source"
          >
            {linking ? (
              <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite', flex: 'none' }} />
            ) : (
              <Unlink size={13} style={{ flex: 'none' }} />
            )}
            <span>{t('potential.unlink')}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onLink(item)}
            disabled={linking}
            title="Liên kết dự án theo dõi, trích xuất tài liệu & đăng bài"
            className="potential-action-btn view-source"
          >
            <Link2 size={13} style={{ flex: 'none' }} />
            <span>{t('potential.linkProject')}</span>
          </button>
        )}

        {/* Nút Xem bài viết / Hồ sơ tài liệu / Xem nguồn */}
        {item.is_project_document || item.kind === 'project_document' ? (
          <button
            type="button"
            onClick={() => onOpenPressPost(item)}
            className="potential-action-btn view-source"
            style={{
              background: 'rgba(5, 150, 105, 0.08)',
              borderColor: 'rgba(5, 150, 105, 0.4)',
              color: '#059669',
              fontWeight: 800,
            }}
          >
            <FileCheck size={13} style={{ flex: 'none' }} />
            <span>Xem hồ sơ tài liệu (.DOCX, .PDF)</span>
          </button>
        ) : (item.is_user_post || item.kind === 'user_article') ? (
          <button
            type="button"
            onClick={() => onOpenPressPost(item)}
            className="potential-action-btn view-source"
            style={{
              background: 'rgba(37, 99, 235, 0.08)',
              borderColor: 'var(--brand-400)',
              color: 'var(--brand-600)',
              fontWeight: 800,
            }}
          >
            <Newspaper size={13} style={{ flex: 'none' }} />
            <span>Đọc bài báo chí</span>
          </button>
        ) : openInApp ? (
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

/** "2026-10-01" → "01/10/2026" (cột DATE, không giờ — không dựng Date để khỏi lệch múi giờ). */
function fmtNgay(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '—';
}

/**
 * Gắn một mục tiềm năng vào dự án ĐANG THEO DÕI (yêu cầu khách hàng 16/09, MoM 15/09/2026).
 *
 * Ba bước: (1) lọc & chọn tên dự án — `/projects/lookup` lọc không dấu, mỗi dòng hiện vị trí /
 * lĩnh vực / thời gian / trạng thái; (2) chỉnh sửa thông tin; (3) bảng duyệt thay đổi — chỉ khi
 * người dùng bấm "Phê duyệt & lưu" mới ghi dự án theo dõi và tạo liên kết.
 */
const TRANG_THAI_DU_AN = ['watching', 'active', 'completed', 'closed'];
const NHAN_TRANG_THAI = {
  watching: 'projects.statusWatching',
  active: 'projects.statusActive',
  completed: 'projects.statusCompleted',
  closed: 'projects.statusClosed',
};

// Số dòng tối đa ô chọn dự án hiển thị một lần.
const LOOKUP_LIMIT = 20;

function thongTinDuAn(p) {
  return {
    display_name: p?.name || '',
    province: p?.province || '',
    sector: p?.sector || '',
    start_date: p?.start_date || '',
    end_date: p?.end_date || '',
    status: p?.status || 'watching',
  };
}


// Cấu hình các tùy chọn lọc phạm vi tài liệu dự án
const DOC_SCOPE_OPTIONS = [
  {
    id: 'all',
    label: 'Tất cả tài liệu được xem',
    icon: Globe,
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.1)',
  },
  {
    id: 'mine',
    label: 'Tài liệu của tôi',
    icon: User,
    color: '#0284c7',
    bg: 'rgba(2, 132, 199, 0.1)',
  },
  {
    id: 'only_me',
    label: 'Chỉ mình tôi (Riêng tư)',
    icon: Lock,
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.1)',
  },
  {
    id: 'organization',
    label: 'Nội bộ tổ chức',
    icon: Building2,
    color: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.1)',
  },
  {
    id: 'public',
    label: 'Công khai trên hệ thống',
    icon: Globe2,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
  },
];

function DocScopeDropdown({ value = 'all', onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const current = DOC_SCOPE_OPTIONS.find((opt) => opt.id === value) || DOC_SCOPE_OPTIONS[0];
  const CurrentIcon = current.icon;
  const isFiltered = value !== 'all';

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          height: 34,
          padding: '0 12px 0 10px',
          borderRadius: 999,
          fontSize: 12.5,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          border: isFiltered ? `1.5px solid ${current.color}` : '1px solid var(--border)',
          background: isFiltered ? current.bg : 'var(--bg-surface-2)',
          color: isFiltered ? current.color : 'var(--text-secondary)',
          boxShadow: isFiltered ? `0 2px 8px ${current.bg}` : 'none',
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isFiltered ? 'rgba(255,255,255,0.85)' : 'var(--bg-surface)',
            color: current.color,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <CurrentIcon size={12} />
        </span>
        <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {current.label}
        </span>
        <ChevronDown
          size={13}
          style={{
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(180deg)' : 'none',
            opacity: 0.7,
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 100,
            minWidth: 230,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '6px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div
            style={{
              padding: '6px 10px 4px',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
            }}
          >
            Phạm vi tài liệu
          </div>
          {DOC_SCOPE_OPTIONS.map((opt) => {
            const isSelected = opt.id === value;
            const OptIcon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: 'none',
                  background: isSelected ? opt.bg : 'transparent',
                  color: isSelected ? opt.color : 'var(--text-primary)',
                  fontSize: 12.5,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--bg-surface-2)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: opt.bg,
                    color: opt.color,
                  }}
                >
                  <OptIcon size={13} />
                </span>
                <span style={{ flex: 1 }}>{opt.label}</span>
                {isSelected && <Check size={14} style={{ color: opt.color, strokeWidth: 2.5 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProjectLinkModal({ item, sectors = [], onClose, onLinked }) {
  const { t } = useLang();
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chon, setChon] = useState(null);
  const [buoc, setBuoc] = useState('pick'); // pick | edit | review
  const [form, setForm] = useState(thongTinDuAn(null));
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const hen = setTimeout(async () => {
      try {
        const ds = await projectsService.lookupProjects(q, LOOKUP_LIMIT);
        if (alive) setItems(ds || []);
      } catch {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    }, 250); // chờ người dùng ngừng gõ, không bắn request mỗi phím
    return () => {
      alive = false;
      clearTimeout(hen);
    };
  }, [q]);

  const tenLinhVuc = (slug) => sectors.find((s) => s.slug === slug)?.name || slug || '—';
  const nhanTrangThai = (st) => (NHAN_TRANG_THAI[st] ? t(NHAN_TRANG_THAI[st]) : st || '—');

  const goc = thongTinDuAn(chon);
  // Mỗi dòng bảng duyệt: [nhãn, giá trị hiện tại, giá trị sau chỉnh sửa, đã đổi?]
  const dongDuyet = [
    // Dòng này so với TÊN MẶC ĐỊNH sẽ gắn (tên dự án theo dõi), không so với tiêu đề gốc
    // của mục tiềm năng — so kiểu cũ thì dòng luôn bị tô "đã đổi" dù người dùng không gõ gì.
    ['potential.reviewDisplayName', item.title || '—', form.display_name || goc.display_name,
      (form.display_name || '').trim() !== '' && (form.display_name || '').trim() !== goc.display_name],
    ['potential.fieldLocation', goc.province || '—', form.province || '—', form.province !== goc.province],
    ['potential.fieldSector', tenLinhVuc(goc.sector), tenLinhVuc(form.sector), form.sector !== goc.sector],
    ['potential.fieldStart', fmtNgay(goc.start_date), fmtNgay(form.start_date), form.start_date !== goc.start_date],
    ['potential.fieldEnd', fmtNgay(goc.end_date), fmtNgay(form.end_date), form.end_date !== goc.end_date],
    ['projects.status', nhanTrangThai(goc.status), nhanTrangThai(form.status), form.status !== goc.status],
  ];

  const moChinhSua = () => {
    if (!chon) return;
    setForm(thongTinDuAn(chon));
    setError(null);
    setBuoc('edit');
  };

  const sangDuyet = () => {
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      setError(t('potential.dateRangeInvalid'));
      return;
    }
    setError(null);
    setBuoc('review');
  };

  const pheDuyet = async () => {
    if (!chon) return;
    setSaving(true);
    setError(null);
    try {
      // Chỉ gửi trường THẬT SỰ đổi; ô ngày để trống = xóa ngày (null).
      const patch = {};
      if (form.province !== goc.province) patch.province = form.province || null;
      if (form.sector !== goc.sector) patch.sector = form.sector || null;
      if (form.start_date !== goc.start_date) patch.start_date = form.start_date || null;
      if (form.end_date !== goc.end_date) patch.end_date = form.end_date || null;
      if (form.status !== goc.status) patch.status = form.status;
      const ten = (form.display_name || '').trim();
      const link = await projectsService.addPotentialLink(chon.id, {
        kind: item.kind,
        ref: String(item.ref),
        display_name: ten && ten !== chon.name ? ten : null,
        // Link + tiêu đề gốc: mã của ODA/bài báo là id tuần tự, nạp lại nguồn là đổi.
        source_url: item.url || null,
        title_snapshot: item.title || null,
        // Gửi KÈM thay vì PATCH riêng trước đó: tách làm hai lệnh thì lệnh gắn hỏng (mục đã
        // gắn, ngoài gói dịch vụ, rớt mạng) là dự án đã bị sửa xong rồi, trong khi bảng
        // duyệt vừa hứa "chưa phê duyệt thì không có thay đổi nào được ghi".
        project_update: Object.keys(patch).length > 0 ? patch : null,
      });
      onLinked({ ...link, project_name: link.project_name || chon.name });
    } catch (e) {
      setError(e.response?.data?.detail || t('potential.linkFailed'));
      setSaving(false);
    }
  };

  const nhan = { fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' };
  const o = { width: '100%', padding: '7px 9px', fontSize: 12.5, boxSizing: 'border-box' };
  const nutPhu = { background: 'var(--bg-surface-2)', border: '1px solid var(--border)' };
  const tieuDe = {
    pick: ['potential.pickProjectTitle', 'potential.pickProjectDesc'],
    edit: ['potential.editLinkTitle', 'potential.editLinkDesc'],
    review: ['potential.reviewTitle', 'potential.reviewDesc'],
  }[buoc];

  return createPortal(
    <div
      onClick={saving ? undefined : onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%', maxWidth: 600, maxHeight: '88vh', display: 'flex', flexDirection: 'column',
          background: 'var(--bg-surface)', borderRadius: 14, padding: 18, gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2 }}>
              {t('potential.linkStep', { n: { pick: 1, edit: 2, review: 3 }[buoc] })}
            </div>
            <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: 'var(--text-primary)' }}>
              {t(tieuDe[0])}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
              {t(tieuDe[1])}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="btn" style={{ padding: 6, background: 'transparent', border: 'none' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', borderLeft: '3px solid var(--border)', paddingLeft: 8 }}>
          {item.title}
        </div>

        {buoc === 'pick' && (
          <>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('potential.searchProject')}
                className="form-input"
                style={{ width: '100%', padding: '8px 10px 8px 32px', fontSize: 12.5, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 120 }}>
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12.5, padding: 8 }}>
                  <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> {t('common.loading')}
                </div>
              )}
              {!loading && items.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 12.5, padding: 8 }}>
                  {t('potential.noProjectFound')}
                </div>
              )}
              {!loading && items.map((p) => {
                const dangChon = chon?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setChon(p)}
                    onDoubleClick={() => { setChon(p); setForm(thongTinDuAn(p)); setBuoc('edit'); }}
                    style={{
                      textAlign: 'left', padding: '9px 11px', borderRadius: 9, cursor: 'pointer',
                      border: `1px solid ${dangChon ? 'var(--brand-600, #2563eb)' : 'var(--border)'}`,
                      background: dangChon ? 'rgba(37, 99, 235, 0.07)' : 'var(--bg-surface-2, transparent)',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 14px', marginTop: 4, fontSize: 11.5, color: 'var(--text-secondary)' }}>
                      <span><MapPin size={11} /> {p.province || '—'}</span>
                      <span>{t('potential.fieldSector')}: {p.sector_name || p.sector || '—'}</span>
                      <span><Calendar size={11} /> {fmtNgay(p.start_date)} → {fmtNgay(p.end_date)}</span>
                      <span>{t('projects.status')}: {nhanTrangThai(p.status)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {/* Danh sách bị cắt ở LOOKUP_LIMIT dòng. Không nói ra thì người dùng gõ một từ
                phổ biến ("cầu") sẽ tưởng hệ thống chỉ có bấy nhiêu dự án. */}
            {items.length >= LOOKUP_LIMIT && (
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>
                {t('potential.lookupMore', { count: LOOKUP_LIMIT })}
              </div>
            )}
          </>
        )}

        {buoc === 'edit' && chon && (
          <div style={{ overflowY: 'auto', minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            <label style={{ gridColumn: '1 / -1' }}>
              <span style={nhan}>{t('potential.reviewDisplayName')}</span>
              <input
                autoFocus
                className="form-input"
                style={o}
                maxLength={255}
                value={form.display_name}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              />
            </label>
            <label>
              <span style={nhan}>{t('potential.fieldLocation')}</span>
              <input
                className="form-input"
                style={o}
                maxLength={255}
                value={form.province}
                onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
              />
            </label>
            <label>
              <span style={nhan}>{t('potential.fieldSector')}</span>
              <select
                className="form-input"
                style={o}
                value={form.sector}
                onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
              >
                <option value="">—</option>
                {form.sector && !sectors.some((s) => s.slug === form.sector) && (
                  <option value={form.sector}>{form.sector}</option>
                )}
                {sectors.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span style={nhan}>{t('potential.fieldStart')}</span>
              <input
                type="date"
                className="form-input"
                style={o}
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
              />
            </label>
            <label>
              <span style={nhan}>{t('potential.fieldEnd')}</span>
              <input
                type="date"
                className="form-input"
                style={o}
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              />
            </label>
            <label>
              <span style={nhan}>{t('projects.status')}</span>
              <select
                className="form-input"
                style={o}
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                {TRANG_THAI_DU_AN.map((st) => (
                  <option key={st} value={st}>{nhanTrangThai(st)}</option>
                ))}
              </select>
            </label>
            <p style={{ gridColumn: '1 / -1', margin: 0, fontSize: 11.5, color: 'var(--text-muted)' }}>
              {t('potential.editLinkNote')}
            </p>
          </div>
        )}

        {buoc === 'review' && chon && (
          <div style={{ overflowY: 'auto', minHeight: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{t('potential.reviewField')}</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{t('potential.reviewBefore')}</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{t('potential.reviewAfter')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 8px', fontWeight: 700 }}>{t('potential.reviewProject')}</td>
                  <td colSpan={2} style={{ padding: '6px 8px' }}>{chon.name}</td>
                </tr>
                {dongDuyet.map(([k, truoc, sau, doi]) => (
                  <tr key={k} style={{ background: doi ? 'rgba(234, 179, 8, 0.12)' : 'transparent' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 700, borderTop: '1px solid var(--border)' }}>{t(k)}</td>
                    <td style={{ padding: '6px 8px', borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{truoc}</td>
                    <td style={{ padding: '6px 8px', borderTop: '1px solid var(--border)', fontWeight: doi ? 700 : 400 }}>{sau}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ margin: '8px 0 0', fontSize: 11.5, color: 'var(--text-muted)' }}>
              {t('potential.reviewNote')}
            </p>
          </div>
        )}

        {error && (
          <div style={{ fontSize: 12, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
          {buoc === 'pick' && (
            <>
              <button type="button" className="btn" onClick={onClose} style={nutPhu}>
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!chon}
                onClick={moChinhSua}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowRight size={14} /> {t('potential.nextEdit')}
              </button>
            </>
          )}
          {buoc === 'edit' && (
            <>
              <button type="button" className="btn" onClick={() => { setError(null); setBuoc('pick'); }} style={nutPhu}>
                {t('potential.backToPick')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={sangDuyet}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Check size={14} /> {t('common.save')}
              </button>
            </>
          )}
          {buoc === 'review' && (
            <>
              <button type="button" className="btn" disabled={saving} onClick={() => setBuoc('edit')} style={nutPhu}>
                {t('potential.backToEdit')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={pheDuyet}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {saving ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <CheckCircle2 size={14} />}
                {t('potential.approveSave')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function PotentialProjectsPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { hasSourceAccess, user } = useAuth();

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
  const [userDocs, setUserDocs] = useState(() => {
    try {
      const d = projectDocumentsService.getDocuments() || [];
      const p = projectDocumentsService.getPosts() || [];
      return [...(Array.isArray(d) ? d : []), ...(Array.isArray(p) ? p : [])];
    } catch {
      return [];
    }
  });
  const [showDocModal, setShowDocModal] = useState(false);
  const [readingItem, setReadingItem] = useState(null);
  const [docScope, setDocScope] = useState('all');
  const [msg, setMsg] = useState(null);

  // Tải danh sách hồ sơ tài liệu dự án tiềm năng
  const loadUserDocs = useCallback(() => {
    try {
      const docs = projectDocumentsService.getDocuments() || [];
      const posts = projectDocumentsService.getPosts() || [];
      setUserDocs([...(Array.isArray(docs) ? docs : []), ...(Array.isArray(posts) ? posts : [])]);
    } catch {
      setUserDocs([]);
    }
  }, []);

  useEffect(() => {
    loadUserDocs();
  }, [loadUserDocs]);

  // Liên kết "mục tiềm năng ↔ dự án đang theo dõi": nạp MỘT lượt cho cả trang.
  const [links, setLinks] = useState([]);
  const [linkingItem, setLinkingItem] = useState(null);
  const [linkBusyKey, setLinkBusyKey] = useState(null);

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

  const loadLinks = useCallback(async () => {
    try {
      setLinks((await projectsService.getPotentialLinks()) || []);
    } catch {
      // Lỗi phụ (chưa đăng nhập / mạng chập chờn) không được chặn cả trang.
    }
  }, []);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  const linkTheoMuc = useMemo(() => {
    const bang = new Map();
    for (const lk of links) bang.set(`${lk.kind}:${lk.ref}`, lk);
    return bang;
  }, [links]);

  const handleUnlink = useCallback(async (link) => {
    setLinkBusyKey(`${link.kind}:${link.ref}`);
    try {
      await projectsService.removePotentialLink(link.tracked_project_id, link.id);
      setLinks((cur) => cur.filter((x) => x.id !== link.id));
      setMsg({ type: 'success', text: t('potential.unlinked') });
      setTimeout(() => setMsg(null), 4000);
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.detail || t('potential.linkFailed') });
      setTimeout(() => setMsg(null), 4000);
    } finally {
      setLinkBusyKey(null);
    }
  }, [t]);

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
      originRef: p.origin_ref || '',
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
      // 1. So khớp chính xác qua mã mục gốc. `origin_ref` là cột riêng; dự án tạo theo lối
      //    cũ mang mã trong ghi chú dạng "[ref:...]" — vẫn nhận để không mất trạng thái.
      if (key && p.originRef === key) return true;
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

    // MỘT chỗ dọn dẹp cho CẢ HAI nhánh. Trước đây chỉ nhánh "thêm theo dõi" mới xóa khóa
    // khỏi ref, nên hủy theo dõi một mục rồi đổi ý là nút im lặng vĩnh viễn — không toast,
    // không spinner, không lỗi — cho tới khi rời trang và quay lại.
    try {
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
          }
        } else {
          setTrackedKeys((cur) => {
            const next = new Set(cur);
            next.delete(key);
            return next;
          });
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
            // Gói thầu KHLCNT không có trường địa phương: để trống thì máy chủ tự suy tỉnh từ
            // tiêu đề + chủ đầu tư ("..., tỉnh Vĩnh Long").
            province: item.province || undefined,
            // Link về gói thầu / dự án ODA / bài báo gốc — hiện ở thẻ dự án.
            source_url: item.url || undefined,
            // KHÔNG nhét mã vào ghi chú như trước: chuỗi "[ref:procurement:...]" hiện nguyên
            // văn ở mục "Ghi chú" trên thẻ dự án.
            origin_ref: key,
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
        }
      }
    } finally {
      trackingKeysRef.current.delete(key);
      setTrackingKey(null);
    }
  };

  // Dữ liệu đã được server phân loại và lọc theo lĩnh vực, nguồn, giá trị, tên, vị trí, chủ đầu tư, kèm hồ sơ tài liệu & bài đăng báo chí
  const displayItems = useMemo(() => {
    const cleanName = normalizeText(filterName);
    const cleanLoc = normalizeText(filterLocation);
    const cleanInv = normalizeText(filterInvestor);

    // Lọc hồ sơ tài liệu dự án tiềm năng (.DOCX, .PDF)
    const filteredUserDocs = (Array.isArray(userDocs) ? userDocs : []).filter((d) => {
      if (kind && kind !== 'project_document') return false;

      if (filterSectors.length > 0) {
        const secNorm = normalizeText(d.sector);
        const match = filterSectors.some((s) => secNorm.includes(normalizeText(s)));
        if (!match) return false;
      }

      if (cleanName) {
        const titleNorm = normalizeText(d.title || d.projectName);
        if (!titleNorm.includes(cleanName)) return false;
      }

      if (cleanLoc) {
        const provNorm = normalizeText(d.province);
        if (!provNorm.includes(cleanLoc)) return false;
      }

      if (cleanInv) {
        const creatorNorm = normalizeText(d.creatorName);
        if (!creatorNorm.includes(cleanInv)) return false;
      }

      return true;
    });

    if (kind === 'project_document') {
      return filteredUserDocs;
    }

    return [...filteredUserDocs, ...(data.items || [])];
  }, [data.items, userDocs, kind, filterSectors, filterName, filterLocation, filterInvestor]);

  // Đếm số lượng tiêu chí lọc đang được áp dụng
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterSectors.length > 0) count++;
    if (kind) count++;
    if (docScope && docScope !== 'all') count++;
    if (minAmount) count++;
    if (filterName.trim()) count++;
    if (filterLocation.trim()) count++;
    if (filterInvestor.trim()) count++;
    if (relatedOnly) count++;
    return count;
  }, [filterSectors.length, kind, docScope, minAmount, filterName, filterLocation, filterInvestor, relatedOnly]);

  // Đặt lại toàn bộ bộ lọc về trạng thái ban đầu
  const resetAllFilters = useCallback(() => {
    setFilterSectors([]);
    setKind('');
    setDocScope('all');
    setMinAmount('');
    setFilterName('');
    setFilterLocation('');
    setFilterInvestor('');
    setRelatedOnly(false);
    setPage(1);
  }, []);

  const applied = data.sectors_applied || [];
  const totalPages = Math.max(1, Math.ceil((kind === 'project_document' ? displayItems.length : (data.total || 0)) / PAGE_SIZE));

  const paginatedItems = useMemo(() => {
    if (kind === 'project_document') {
      const start = (page - 1) * PAGE_SIZE;
      return displayItems.slice(start, start + PAGE_SIZE);
    }
    return displayItems;
  }, [displayItems, kind, page]);

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
          {/* Nút 1: Form Tài liệu & Biên bản dự án tiềm năng (.DOCX, .PDF) */}
          <button
            type="button"
            onClick={() => setShowDocModal(true)}
            className="potential-banner-btn-primary"
            style={{
              background: 'linear-gradient(135deg, #059669, #10b981)',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <FileCheck size={17} />
            <span>📁 Tài liệu & Biên bản (.DOCX, .PDF)</span>
          </button>

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
                { id: 'project_document', label: 'Tài liệu & Biên bản', icon: FileCheck, allowed: true },
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

          {/* Cụm công cụ lọc bổ trợ bên phải */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Dropdown Lọc tài liệu theo quyền riêng tư cao cấp */}
            <DocScopeDropdown
              value={docScope}
              onChange={(val) => {
                setDocScope(val);
                if (val !== 'all' && kind !== 'project_document') {
                  setKind('project_document');
                }
                setPage(1);
              }}
            />

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
                height: 34, padding: '0 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.15s ease',
                border: relatedOnly ? '1.5px solid #6366f1' : '1px solid var(--border)',
                background: relatedOnly ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-surface-2)',
                color: relatedOnly ? '#4f46e5' : 'var(--text-secondary)',
                boxShadow: relatedOnly ? '0 2px 8px rgba(99, 102, 241, 0.2)' : 'none',
              }}
            >
              <Sparkles size={13} style={{ color: relatedOnly ? '#4f46e5' : 'var(--text-muted)' }} />
              <span>{t('potential.relatedOnly')}</span>
              {relatedOnly && <Check size={13} style={{ strokeWidth: 3 }} />}
            </button>
          </div>

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
            {paginatedItems.map((item) => {
              const key = itemKey(item);
              const tracked = isItemTracked(item);
              return (
                <PotentialCard
                  key={key}
                  item={item}
                  onToggleTrack={handleToggleTrack}
                  tracking={trackingKey === key}
                  tracked={tracked}
                  link={linkTheoMuc.get(key)}
                  linking={linkBusyKey === key}
                  onLink={setLinkingItem}
                  onUnlink={handleUnlink}
                  onOpenPressPost={setReadingItem}
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
                    <span key={`ellipsis-${idx}`} className="potential-page-ellipsis">
                      ...
                    </span>
                  );
                }
                const isActive = page === pNum;
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

      {/* 1. Modal Form Tài liệu, Biên bản & Đăng bài dự án tiềm năng (.DOCX, .PDF) */}
      {(showDocModal || linkingItem) && (
        <ProjectDocumentPostModal
          open={Boolean(showDocModal || linkingItem)}
          onClose={() => {
            setShowDocModal(false);
            setLinkingItem(null);
          }}
          potentialItem={linkingItem}
          onPostCreated={(newPost) => {
            setUserDocs((prev) => [newPost, ...prev.filter((d) => d.id !== newPost.id)]);
            toast('success', `Đã phê duyệt và đăng bài "${newPost.title || newPost.projectName}" thành công!`);
          }}
          onDocumentSaved={(newDoc) => {
            setUserDocs((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);
            toast('success', `Đã lưu hồ sơ tài liệu "${newDoc.projectName || newDoc.title}" thành công!`);
          }}
          onProjectUpdated={(updatedProject) => {
            loadUserProjects(true);
            toast('success', `Đã cập nhật dự án theo dõi "${updatedProject.name}"!`);
          }}
        />
      )}

      {/* 2. Modal Xem chi tiết hồ sơ tài liệu dự án */}
      {readingItem && (
        <PressPostDetailModal
          post={readingItem}
          onClose={() => setReadingItem(null)}
        />
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
