// src/pages/DashboardPage.jsx
import { useState, useEffect, useRef } from 'react';
import logoImg from '../assets/logo.png';
import {
  Newspaper, Globe, Building2, ShoppingBag, Cpu, ExternalLink,
  RefreshCw, ArrowRight, TrendingUp, ChevronLeft, ChevronRight, Zap, Loader2,
  Crown, Trophy, Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import NewsCard from '../components/NewsCard';
import { statsService } from '../services/stats';
import { articlesService } from '../services/articles';
import { odaService } from '../services/oda';
import { buildMapItems, adaptOdaToCard, adaptProcToCard } from '../adapters/oda';
import { mockAdbProjects, mockWbProjects, mockProcurementNotices, mockProcurementPlans } from '../data/mockData';
import { apiCache } from '../utils/apiCache';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const PAGE_SIZE = 6;

// ── Trending marquee strip ───────────────────────────────────
function TrendingStrip({ keywords, onSelectKeyword }) {
  if (!keywords || keywords.length === 0) {
    return (
      <div className="trending-strip" style={{ opacity: 0.75 }}>
        <div className="trending-strip-header">
          <div className="trending-strip-title">
            <Zap size={15} style={{ color: '#f59e0b' }} />
            <span>Từ Khóa Đang Nổi Bật</span>
          </div>
          <span className="hot-badge" style={{ animation: 'pulse 1.5s infinite' }}>⏳ ĐANG TẢI...</span>
        </div>
        <div style={{ height: 32, display: 'flex', gap: 10, alignItems: 'center', overflow: 'hidden' }}>
          <div className="skeleton" style={{ height: 28, width: 110, borderRadius: 20 }} />
          <div className="skeleton" style={{ height: 28, width: 130, borderRadius: 20 }} />
          <div className="skeleton" style={{ height: 28, width: 95, borderRadius: 20 }} />
          <div className="skeleton" style={{ height: 28, width: 140, borderRadius: 20 }} />
        </div>
      </div>
    );
  }

  // Duplicate keywords so each half has at least 15 items for seamless 0% -> -50% infinite looping without blank gaps
  const repeatCount = Math.max(2, Math.ceil(15 / keywords.length));
  const baseList = Array(repeatCount).fill(keywords).flat();
  const items = [...baseList, ...baseList];

  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return '';
  };

  const renderRankIcon = (rank) => {
    if (rank === 1) {
      return (
        <Crown
          size={16}
          style={{
            color: '#d97706',
            fill: '#f59e0b',
            filter: 'drop-shadow(0 2px 5px rgba(245,158,11,0.5))',
            flexShrink: 0,
          }}
        />
      );
    }
    if (rank === 2) {
      return (
        <Trophy
          size={15}
          style={{
            color: '#475569',
            fill: '#94a3b8',
            filter: 'drop-shadow(0 1px 3px rgba(148,163,184,0.4))',
            flexShrink: 0,
          }}
        />
      );
    }
    if (rank === 3) {
      return (
        <Award
          size={15}
          style={{
            color: '#9a3412',
            fill: '#f97316',
            filter: 'drop-shadow(0 1px 3px rgba(249,115,22,0.4))',
            flexShrink: 0,
          }}
        />
      );
    }
    return null;
  };

  return (
    <div className="trending-strip">
      <div className="trending-strip-header">
        <div className="trending-strip-title">
          <Zap size={15} style={{ color: '#f59e0b', animation: 'pulse 1.8s ease-in-out infinite' }} />
          <span>Từ Khóa Đang Nổi Bật</span>
        </div>
        <span className="hot-badge">🔥 LIVE</span>

        {keywords.slice(0, 1).map((kw, i) => (
          <span
            key={i}
            className="top-kw-pill"
            style={{ cursor: onSelectKeyword ? 'pointer' : 'default' }}
            onClick={() => onSelectKeyword && onSelectKeyword(kw.term)}
          >
            <Crown size={14} style={{ color: '#d97706', fill: '#f59e0b', filter: 'drop-shadow(0 2px 4px rgba(245,158,11,0.4))' }} />
            <span>{kw.term}</span>
            <span className="top-kw-count">{kw.count}</span>
          </span>
        ))}

        <span className="trending-hint">
          ↔ Di chuột để dừng · Click từ khóa để tìm bài
        </span>
      </div>

      <div className="trending-marquee-wrapper">
        <div className="trending-marquee-track">
          {items.map((kw, i) => {
            const originalRank = (i % keywords.length) + 1;
            const isTop3 = originalRank <= 3;
            return (
              <span
                key={i}
                className={`trending-keyword-chip ${getRankClass(originalRank)}`}
                onClick={() => onSelectKeyword && onSelectKeyword(kw.term)}
                title={`Hạng ${originalRank}: Bấm để tìm bài viết chứa từ khóa "${kw.term}"`}
              >
                {isTop3 && renderRankIcon(originalRank)}
                <span className="chip-term-text">{kw.term}</span>
                <span className="chip-count-tag">{kw.count}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton card ────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="news-card" style={{ cursor: 'default' }}>
      <div className="skeleton" style={{ height: 180 }} />
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="skeleton" style={{ height: 18, width: 56, borderRadius: 20 }} />
          <div className="skeleton" style={{ height: 18, width: 48, borderRadius: 20 }} />
        </div>
        <div className="skeleton" style={{ height: 17, borderRadius: 5 }} />
        <div className="skeleton" style={{ height: 17, width: '80%', borderRadius: 5 }} />
        <div className="skeleton" style={{ height: 13, borderRadius: 5 }} />
        <div className="skeleton" style={{ height: 13, width: '70%', borderRadius: 5 }} />
      </div>
    </div>
  );
}

// ── Pagination component ─────────────────────────────────────
function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) pages.push(i);
    else if (pages[pages.length - 1] !== '...') pages.push('...');
  }

  return (
    <div className="pagination">
      <button
        className="page-btn"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        id="btn-page-prev"
        title="Trang trước"
      >
        <ChevronLeft size={15} />
      </button>

      {pages.map((p, i) => (
        p === '...'
          ? <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>…</span>
          : <button
              key={p}
              className={`page-btn ${p === page ? 'active' : ''}`}
              onClick={() => onChange(p)}
              id={`btn-page-${p}`}
            >
              {p}
            </button>
      ))}

      <span className="page-info">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total}
      </span>

      <button
        className="page-btn"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        id="btn-page-next"
        title="Trang sau"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

// ── Lat/Lng coords for each project ─────────────────────────────
const MAP_COORDS = {
  'cluster-p-01': [21.0245, 105.8412],
  'cluster-p-02': [21.0245, 105.8412],
  'cluster-p-03': [21.0245, 105.8412],
  'cluster-p-04': [21.0245, 105.8412],
  'cluster-p-05': [21.0245, 105.8412],
  'cluster-p-06': [21.0245, 105.8412],
  'cluster-p-07': [21.0245, 105.8412],
  'cluster-p-08': [21.0245, 105.8412],
  'cluster-p-09': [21.0245, 105.8412],
  'cluster-p-10': [21.0245, 105.8412],
  'cluster-p-11': [21.0245, 105.8412],
  'cluster-p-12': [21.0245, 105.8412],
  'cluster-p-13': [21.0245, 105.8412],
  'cluster-p-14': [21.0245, 105.8412],
  'cluster-p-15': [21.0245, 105.8412],
  'cluster-p-16': [21.0245, 105.8412],
  'cluster-p-17': [21.0245, 105.8412],
  'cluster-p-18': [21.0245, 105.8412],
  'cluster-p-19': [21.0245, 105.8412],
  'cluster-p-20': [21.0245, 105.8412],
  'cluster-p-21': [21.0245, 105.8412],
  'cluster-p-22': [21.0245, 105.8412],
  'cluster-p-23': [21.0245, 105.8412],
  'cluster-p-24': [21.0245, 105.8412],
  'cluster-p-25': [21.0245, 105.8412],
  'cluster-p-26': [21.0245, 105.8412],
  'cluster-p-27': [21.0245, 105.8412],
  'cluster-p-28': [21.0245, 105.8412],
  'cluster-p-29': [21.0245, 105.8412],
  'cluster-p-30': [21.0245, 105.8412],
  'cluster-p-31': [21.0245, 105.8412],
  'cluster-p-32': [21.0245, 105.8412],
  'cluster-p-33': [21.0245, 105.8412],
  'cluster-p-34': [21.0245, 105.8412],
  'cluster-p-35': [21.0245, 105.8412],
  'adb-p-001': [21.0245, 105.8412],
  'adb-p-002': [10.8231, 106.6297],
  'adb-p-003': [11.5564, 104.9282],
  'adb-p-004': [14.0583, 108.2772],
  'adb-p-005': [20.0522, 102.4999],
  'adb-p-006': [14.5995, 120.9842],
  'wb-p-001': [14.5995, 120.9842],
  'wb-p-002': [13.7563, 100.5018],
  'wb-p-003': [10.3157, 123.8854],
  'wb-p-004': [-25.7461, 28.1881],
  'wb-p-005': [14.5995, 120.9842],
  'wb-p-006': [-6.2088, 106.8456],
  'wb-p-007': [-8.3405, 115.0920],
  'wb-p-008': [-5.1477, 119.4327],
  'wb-p-009': [38.5598, 68.7738],
  'wb-p-010': [-2.5, 118.0],
  'wb-p-011': [-3.4653, -62.2159],
  'wb-p-012': [-6.2088, 106.8456],
  'IB2600384477-00': [22.4809, 103.9755],
  'IB2600377917-00': [10.0341, 105.7838],
  'IB2600350334-00': [10.0341, 105.7838],
  'IB2600351150-00': [21.3860, 103.0230],
  'IB2600346536-00': [13.7829, 109.2196],
  'PL2600222922-00': [11.3354, 106.1097],
  'PL2600222852-00': [15.5100, 107.9700],
  'PL2600222858-00': [21.3400, 106.1800],
  'PL2600222808-00': [22.4809, 103.9755],
  'PL2600222691-00': [20.7100, 105.9500],
  'PL2600222664-00': [18.6800, 105.6800],
  'PL2600222559-01': [18.6800, 105.6800],
  'PL2600219946-01': [22.0700, 104.0400],
  'PL2600126771-01': [11.3100, 106.1000],
};

// Toạ độ marker: ưu tiên lat/lng thật từ backend, fallback toạ độ hardcode (mock).
function coordsOf(item) {
  if (item && item.lat != null && item.lng != null) return [item.lat, item.lng];
  return MAP_COORDS[item?.id];
}

function MapFlyTo({ items, source, country, sector, status }) {
  const map = useMap();
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const coords = items.map(i => coordsOf(i)).filter(Boolean);
      if (coords.length === 0) return;

      if (coords.length === 1) {
        map.flyTo(coords[0], 7, { animate: true, duration: 0.5, easeLinearity: 0.5 });
      } else {
        const lats = coords.map(c => c[0]);
        const lngs = coords.map(c => c[1]);
        const bounds = [
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)],
        ];
        map.fitBounds(bounds, {
          padding: [55, 55],
          maxZoom: 8,
          animate: true,
          duration: 0.45,
          easeLinearity: 0.35,
        });
      }
    }, 30);

    return () => clearTimeout(timerRef.current);
  }, [source, country, sector, status, items.length]);

  return null;
}

// ── MultiSelectDropdown ──────────────────────────────────────
function MultiSelectDropdown({ options, selected, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = val => {
    const next = new Set(selected);
    if (next.has(val)) next.delete(val); else next.add(val);
    onChange(next);
  };

  const selCount = selected.size;
  const label = selCount === 0
    ? placeholder
    : selCount === 1
      ? (options.find(o => o.value === [...selected][0])?.label || placeholder)
      : `${selCount} đã chọn`;

  return (
    <div ref={ref} style={{ position: 'relative', zIndex: open ? 2000 : 1 }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 9px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)',
        background: 'rgba(255,255,255,0.85)', color: selCount > 0 ? '#1e293b' : '#64748b',
        fontSize: 11, fontWeight: selCount > 0 ? 700 : 500, cursor: 'pointer',
        boxShadow: open ? '0 0 0 2px rgba(59,130,246,0.25)' : 'none',
        transition: 'all 0.15s',
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 145 }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {selCount > 0 && (
            <span style={{
              background: '#3b82f6', color: 'white', borderRadius: 20,
              padding: '0px 5px', fontSize: 10, fontWeight: 800, lineHeight: '16px',
            }}>{selCount}</span>
          )}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'white', border: '1px solid #e2e8f0',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          maxHeight: 200, overflowY: 'auto', zIndex: 9999,
        }}>
          <div onClick={() => onChange(new Set())} style={{
            padding: '8px 10px', fontSize: 11, fontWeight: 600,
            color: selCount === 0 ? '#3b82f6' : '#94a3b8',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
            borderBottom: '1px solid #f1f5f9',
            background: selCount === 0 ? '#eff6ff' : 'white',
          }}>
            <div style={{
              width: 14, height: 14, borderRadius: 4, border: '1.5px solid',
              borderColor: selCount === 0 ? '#3b82f6' : '#cbd5e1',
              background: selCount === 0 ? '#3b82f6' : 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {selCount === 0 && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>}
            </div>
            Tất cả
          </div>
          {options.map(opt => {
            const isChecked = selected.has(opt.value);
            return (
              <div key={opt.value} onClick={() => toggle(opt.value)} style={{
                padding: '7px 10px', fontSize: 11, fontWeight: isChecked ? 700 : 500,
                color: isChecked ? '#1e293b' : '#475569',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                background: isChecked ? '#f8faff' : 'white',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => { if (!isChecked) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isChecked ? '#f8faff' : 'white'; }}
              >
                <div style={{
                  width: 14, height: 14, borderRadius: 4, border: '1.5px solid',
                  borderColor: isChecked ? '#3b82f6' : '#cbd5e1',
                  background: isChecked ? '#3b82f6' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  transition: 'all 0.15s',
                }}>
                  {isChecked && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>}
                </div>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{opt.icon}</div>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MultiProjectPopupCard({ items, sourceConfig, countryLabel, FlagImg, SECTOR_ICONS, SECTOR_NAMES, STATUS_ICONS }) {
  const [viewMode, setViewMode] = useState('card');
  const [currIdx, setCurrIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  if (!items || items.length === 0) return null;

  const validIdx = currIdx < items.length ? currIdx : 0;
  const activeItem = items[validIdx] || items[0] || {};
  const cfg = sourceConfig[activeItem?.source] || sourceConfig.dauthau;

  const filteredItemsInGroup = searchQuery
    ? items.filter(i => (i.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (i.id || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  const formatCount = (num) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num;
  };

  const handleOpenDetail = (item, e) => {
    if (e) e.stopPropagation();
    if (!item) return;

    if (item.url) {
      window.open(item.url, '_blank');
      return;
    }

    const rawId = item.original_id || String(item.id || '').replace(/^(adb|wb|proc|worldbank)-/, '');

    if (item.source === 'worldbank') {
      window.open(`https://projects.worldbank.org/en/projects-operations/project-detail/${rawId}`, '_blank');
    } else if (item.source === 'adb') {
      window.open(`https://www.adb.org/projects/${rawId}/main`, '_blank');
    } else {
      window.open(`https://dauthau.asia/tim-kiem/?q=${encodeURIComponent(rawId || item.title)}`, '_blank');
    }
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", padding: '2px', maxWidth: 300, minWidth: 270 }}>
      {items.length > 1 && (
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
          border: '1px solid #cbd5e1',
          borderRadius: 10,
          padding: '6px 8px',
          marginBottom: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: viewMode === 'card' ? 6 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <FlagImg country={activeItem?.country} size={15} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {countryLabel(activeItem?.country)}
              </span>
              <span style={{
                background: '#3b82f6', color: 'white',
                fontSize: 10, fontWeight: 800, padding: '1px 6px',
                borderRadius: 20, flexShrink: 0, lineHeight: '14px',
              }}>
                {formatCount(items.length)} dự án
              </span>
            </div>

            <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
              <button
                onClick={(e) => { e.stopPropagation(); setViewMode('card'); }}
                style={{
                  border: 'none', background: viewMode === 'card' ? '#2563eb' : '#e2e8f0',
                  color: viewMode === 'card' ? 'white' : '#475569',
                  borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                title="Xem dạng thẻ"
              >
                🎴 Thẻ
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setViewMode('list'); }}
                style={{
                  border: 'none', background: viewMode === 'list' ? '#2563eb' : '#e2e8f0',
                  color: viewMode === 'list' ? 'white' : '#475569',
                  borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                title="Xem danh sách"
              >
                📜 Danh sách
              </button>
            </div>
          </div>

          {viewMode === 'card' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderRadius: 6, padding: '3px 6px', border: '1px solid #e2e8f0' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrIdx(prev => (prev - 1 + items.length) % items.length); }}
                style={{
                  border: 'none', background: '#3b82f6', color: 'white', borderRadius: 4,
                  width: 20, height: 20, cursor: 'pointer', fontSize: 12, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
                title="Dự án trước"
              >
                ‹
              </button>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#334155' }}>
                {currIdx + 1} / {items.length}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrIdx(prev => (prev + 1) % items.length); }}
                style={{
                  border: 'none', background: '#3b82f6', color: 'white', borderRadius: 4,
                  width: 20, height: 20, cursor: 'pointer', fontSize: 12, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
                title="Dự án tiếp"
              >
                ›
              </button>
            </div>
          )}
        </div>
      )}

      {viewMode === 'card' ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'white', background: cfg.color, padding: '3px 9px', borderRadius: 20 }}>
              {activeItem?.type || 'Dự án'}
            </span>
            <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{String(activeItem?.id || '').slice(0, 12)}</span>
          </div>

          <div
            onClick={(e) => handleOpenDetail(activeItem, e)}
            style={{
              fontSize: 12.5, fontWeight: 700, lineHeight: 1.4, color: '#2563eb',
              marginBottom: 8, minHeight: 34, cursor: 'pointer',
              display: 'flex', alignItems: 'flex-start', gap: 4,
              transition: 'color 0.15s ease',
            }}
            title="Bấm để chuyển hướng tới trang chi tiết dự án"
          >
            <span style={{ flex: 1, textDecoration: 'underline', textDecorationColor: 'transparent' }}>
              {(activeItem.title || '').length > 85 ? (activeItem.title || '').slice(0, 85) + '…' : activeItem.title}
            </span>
            <ExternalLink size={13} style={{ flexShrink: 0, marginTop: 2, color: '#3b82f6' }} />
          </div>

          <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#475569', marginBottom: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FlagImg country={activeItem.country} size={15} /> {countryLabel(activeItem.country)}</span>
            {activeItem.amount && <span style={{ fontWeight: 700, color: cfg.color }}>💰 {activeItem.amount}</span>}
          </div>

          <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#475569', marginBottom: 8, flexWrap: 'wrap' }}>
            {activeItem.sector && <span>{SECTOR_ICONS[activeItem.sector] || '🏷️'} {SECTOR_NAMES[activeItem.sector] || activeItem.sector}</span>}
            {activeItem.status && <span style={{ background: activeItem.status === 'Active' ? '#dcfce7' : '#f1f5f9', color: activeItem.status === 'Active' ? '#16a34a' : '#475569', borderRadius: 20, padding: '1px 8px', fontWeight: 600 }}>{STATUS_ICONS[activeItem.status] || '⚙️'} {activeItem.status}</span>}
          </div>

          <div style={{ background: 'linear-gradient(135deg,rgba(168,85,247,.07),rgba(59,130,246,.07))', border: '1px dashed rgba(168,85,247,.3)', borderRadius: 10, padding: '8px 10px', fontSize: 11, color: '#334155', lineHeight: 1.45 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#a855f7', fontSize: 10, marginBottom: 3 }}>
              <Cpu size={10} /> PHÂN TÍCH AI
            </div>
            {activeItem.aiSummary || 'Dự án thúc đẩy nâng cấp hạ tầng, kết nối vùng và cải thiện an sinh xã hội khu vực.'}
          </div>
        </div>
      ) : (
        <div style={{ maxHeight: 250, overflowY: 'auto' }}>
          {items.length > 3 && (
            <input
              type="text"
              placeholder="🔍 Tìm trong vị trí này..."
              value={searchQuery}
              onClick={(e) => e.stopPropagation()}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1',
                fontSize: 11, marginBottom: 6, outline: 'none', boxSizing: 'border-box'
              }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filteredItemsInGroup.map((it) => {
              const origIdx = items.findIndex(x => x.id === it.id);
              const isSelected = origIdx === currIdx;
              const itCfg = sourceConfig[it.source] || sourceConfig.dauthau;
              return (
                <div
                  key={it.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrIdx(origIdx);
                    setViewMode('card');
                  }}
                  style={{
                    padding: '7px 9px', borderRadius: 8, cursor: 'pointer',
                    background: isSelected ? '#eff6ff' : '#f8fafc',
                    border: '1px solid', borderColor: isSelected ? '#3b82f6' : '#e2e8f0',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 2px 8px rgba(59,130,246,0.15)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', color: 'white', background: itCfg.color, padding: '2px 7px', borderRadius: 10 }}>
                      {it.type}
                    </span>
                    {it.amount && <span style={{ fontSize: 10.5, fontWeight: 800, color: itCfg.color }}>💰 {it.amount}</span>}
                  </div>
                  <div style={{
                    fontSize: 11.5, fontWeight: isSelected ? 700 : 600,
                    color: isSelected ? '#1e40af' : '#0f172a',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {it.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectDistributionMap() {
  const [selSources,   setSelSources]   = useState(new Set());
  const [selCountries, setSelCountries] = useState(new Set());
  const [selStatuses,  setSelStatuses]  = useState(new Set());
  const [selSectors,   setSelSectors]   = useState(new Set());
  const [realItems,    setRealItems]    = useState(() => apiCache.get('oda:map_items'));
  const [mobileFilterOpen, setMobileFilterOpen] = useState(true);

  // Lấy dự án ODA + mua sắm công THẬT từ backend; lỗi/rỗng -> giữ null (fallback mock).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [oda, proc] = await Promise.all([
          odaService.getProjects(),
          odaService.getProcurement(),
        ]);
        const items = buildMapItems(oda?.items || [], proc?.items || []);
        if (alive && items.length > 0) {
          setRealItems(items);
          apiCache.set('oda:map_items', items, 120000);
        }
      } catch (e) {
        console.warn('ODA map data error (dùng mock):', e);
      }
    })();
    return () => { alive = false; };
  }, []);

  const mockItems = [
    ...mockAdbProjects.map(p => ({ ...p, source: 'adb', type: 'Dự án ADB' })),
    ...mockWbProjects.map(p => ({ ...p, source: 'worldbank', type: 'Dự án World Bank' })),
    ...mockProcurementNotices.map(p => ({ ...p, source: 'dauthau', type: 'TB Mời thầu', sector: p.sector || 'Transport' })),
    ...mockProcurementPlans.map(p => ({ ...p, source: 'dauthau', type: 'Kế hoạch thầu', sector: p.sector || 'Transport' }))
  ].filter(item => MAP_COORDS[item.id]);

  const usingReal = realItems != null;
  const allItems = usingReal ? realItems : mockItems;

  const filteredItems = allItems.filter(item => {
    if (selSources.size   > 0 && !selSources.has(item.source))     return false;
    if (selCountries.size > 0 && !selCountries.has(item.country))  return false;
    if (selStatuses.size  > 0 && !selStatuses.has(item.status))    return false;
    if (selSectors.size   > 0 && !selSectors.has(item.sector))     return false;
    return true;
  });

  const countryList  = [...new Set(allItems.map(i => i.country).filter(Boolean))];
  const statusList   = [...new Set(allItems.map(i => i.status).filter(Boolean))];
  const sectorList   = [...new Set(allItems.map(i => i.sector).filter(Boolean))];

  const FLAG_CODES = {
    Vietnam: 'vn', Philippines: 'ph', Indonesia: 'id',
    Thailand: 'th', Cambodia: 'kh', 'South Africa': 'za',
    Tajikistan: 'tj', Brazil: 'br',
  };
  const COUNTRY_NAMES = {
    Vietnam: 'Việt Nam', Philippines: 'Philippines', Indonesia: 'Indonesia',
    Thailand: 'Thái Lan', Cambodia: 'Campuchia', 'South Africa': 'Nam Phi',
    Tajikistan: 'Tajikistan', Brazil: 'Brazil', Regional: 'Khu vực', GMS: 'GMS',
  };
  const FlagImg = ({ country, size = 18 }) => {
    const code = FLAG_CODES[country];
    if (!code) return <span style={{ fontSize: size * 0.85 }}>🌏</span>;
    return (
      <img
        src={`https://flagcdn.com/w20/${code}.webp`}
        alt={country}
        style={{ width: size, height: Math.round(size * 0.67), borderRadius: 2, objectFit: 'cover', flexShrink: 0, verticalAlign: 'middle' }}
      />
    );
  };
  const countryLabel = c => COUNTRY_NAMES[c] || c;

  const SECTOR_ICONS = {
    Energy: '⚡', 'Urban Dev': '🏙️', Finance: '💰', Climate: '🌱',
    Transport: '🛣️', Water: '💧', Nutrition: '🍏', Agriculture: '🌾',
  };
  const SECTOR_NAMES = {
    Energy: 'Năng lượng', 'Urban Dev': 'Đô thị', Finance: 'Tài chính', Climate: 'Khí hậu',
    Transport: 'Giao thông', Water: 'Nước sạch', Nutrition: 'Dinh dưỡng', Agriculture: 'Nông nghiệp',
  };
  const STATUS_ICONS = { Active: '🟢', Planned: '🔵', Completed: '✅', Pipeline: '🟡' };

  const sourceConfig = {
    adb:       { color: '#f59e0b', glow: 'rgba(245,158,11,0.45)',  label: 'ADB',       icon: '🏦' },
    worldbank: { color: '#10b981', glow: 'rgba(16,185,129,0.45)', label: 'World Bank', icon: '🌍' },
    dauthau:   { color: '#8b5cf6', glow: 'rgba(139,92,246,0.45)', label: 'Đấu Thầu',  icon: '📋' },
  };

  const toggleSource = (key) => {
    setSelSources(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const sourceBreakdown = ['adb','worldbank','dauthau'].map(s => ({
    key: s, ...sourceConfig[s],
    count: filteredItems.filter(i => i.source === s).length
  }));

  const totalBudget = filteredItems
    .filter(i => i.amount && i.amount.includes('$'))
    .reduce((acc, i) => { const n = parseInt(i.amount.replace(/[^0-9]/g, ''), 10); return acc + (isNaN(n) ? 0 : n); }, 0);

  const hasFilters = selSources.size > 0 || selCountries.size > 0 || selSectors.size > 0 || selStatuses.size > 0;

  const locationGroupList = Object.values(
    filteredItems.reduce((acc, item) => {
      const rawCoords = coordsOf(item);
      if (!rawCoords) return acc;
      const key = `${rawCoords[0].toFixed(1)},${rawCoords[1].toFixed(1)}`;
      if (!acc[key]) {
        acc[key] = { key, baseCoords: rawCoords, items: [] };
      }
      acc[key].items.push(item);
      return acc;
    }, {})
  );

  return (
    <div style={{ marginBottom: 'var(--space-8)' }}>
      {/* ── Section Header ── */}
      <div className="dashboard-map-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(59,130,246,0.4)',
            flexShrink: 0,
          }}>
            <Globe size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>Bàn Đồ Phân Bố Dự Án ODA &amp; Đấu Thầu</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                background: usingReal ? '#dcfce7' : '#fef3c7',
                color: usingReal ? '#166534' : '#92400e',
                border: `1px solid ${usingReal ? '#bbf7d0' : '#fde68a'}`,
                whiteSpace: 'nowrap',
              }}>
                {usingReal ? '🟢 Dữ liệu thật (Top 400 mới nhất)' : '📌 Dữ liệu mẫu minh họa'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <Cpu size={11} style={{ color: '#a855f7', flexShrink: 0 }} />
              <span>AI Powered · {filteredItems.length} dự án ({locationGroupList.length} điểm cụm)</span>
            </div>
          </div>
        </div>
        <div className="dashboard-map-source-pills">
          {Object.entries(sourceConfig).map(([key, cfg]) => {
            const count = allItems.filter(i => i.source === key).length;
            const unit = key === 'dauthau' ? 'gói thầu' : 'dự án';
            return (
              <div key={key} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 20,
                background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
                fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
                whiteSpace: 'nowrap', flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 6px ${cfg.glow}` }} />
                {cfg.icon} {cfg.label} · <strong style={{ color: cfg.color }}>{count} {unit}</strong>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Map Container with Floating Filter Panel ── */}
      <div style={{
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid var(--border-subtle)',
        position: 'relative',
        overflow: 'visible',
      }}>
        <div style={{ borderRadius: 16, overflow: 'hidden' }}>
          <MapContainer
            center={[15, 107]}
            zoom={4}
            minZoom={3}
            worldCopyJump={true}
            style={{ height: 500, width: '100%', background: '#dbeafe' }}
            scrollWheelZoom={true}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a> &copy; <a href="https://carto.com">CARTO</a>'
              maxZoom={18}
            />
            <MapFlyTo
              items={filteredItems}
              source={[...selSources].join(',')}
              country={[...selCountries].join(',')}
              sector={[...selSectors].join(',')}
              status={[...selStatuses].join(',')}
            />

            {locationGroupList.map(group => {
              const { key, baseCoords, items } = group;
              const isCluster = items.length > 1;
              const mainSource = items[0].source;
              const cfg = sourceConfig[mainSource] || sourceConfig.dauthau;
              const markerRadius = isCluster ? Math.min(10 + Math.log2(items.length) * 3, 20) : (mainSource === 'dauthau' ? 7.5 : 10);

              return (
                <CircleMarker
                  key={key}
                  center={baseCoords}
                  radius={markerRadius}
                  pathOptions={{
                    color: 'white',
                    weight: isCluster ? 3 : 2.5,
                    fillColor: isCluster ? (items.length >= 10 ? '#2563eb' : cfg.color) : cfg.color,
                    fillOpacity: 0.95
                  }}
                >
                  <Popup maxWidth={310}>
                    <MultiProjectPopupCard
                      items={items}
                      sourceConfig={sourceConfig}
                      countryLabel={countryLabel}
                      FlagImg={FlagImg}
                      SECTOR_ICONS={SECTOR_ICONS}
                      SECTOR_NAMES={SECTOR_NAMES}
                      STATUS_ICONS={STATUS_ICONS}
                    />
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {filteredItems.length === 0 && (
          <div style={{ position:'absolute', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(15,23,42,0.5)', backdropFilter:'blur(6px)', borderRadius: 16 }}>
            <div style={{ background:'white', borderRadius:16, padding:'20px 28px', textAlign:'center', boxShadow:'0 16px 48px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🔍</div>
              <div style={{ fontWeight:700, color:'#0f172a', fontSize:15 }}>Không khớp bộ lọc</div>
              <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>Thử thay đổi điều kiện lọc</div>
            </div>
          </div>
        )}

        {/* ── Floating Filter Panel ── */}
        <div className={`dashboard-map-filter-panel ${mobileFilterOpen ? 'expanded' : 'collapsed'}`}>
          <div
            onClick={() => setMobileFilterOpen(v => !v)}
            style={{
              background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
              padding: '9px 12px',
              borderRadius: mobileFilterOpen ? '13px 13px 0 0' : '13px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}>
              🗺️ Bộ lọc <span className="mobile-filter-toggle-hint" style={{ fontSize: 10, opacity: 0.85, fontWeight: 600 }}>(400 mới nhất)</span>
            </span>
            <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: 'white' }}>
              {filteredItems.length}/{allItems.length}
            </span>
          </div>

          {mobileFilterOpen && (
            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: 5 }}>Nguồn dữ liệu</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {Object.entries(sourceConfig).map(([key, cfg]) => {
                  const active = selSources.has(key);
                  return (
                    <button key={key} onClick={() => toggleSource(key)} style={{
                      padding: '5px 9px', borderRadius: 20,
                      border: active ? 'none' : '1.5px solid rgba(0,0,0,0.1)',
                      cursor: 'pointer', fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
                      background: active ? cfg.color : 'rgba(0,0,0,0.04)',
                      color: active ? 'white' : '#475569',
                      boxShadow: active ? `0 2px 10px ${cfg.glow}` : 'none',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      {cfg.icon}
                      <span>{cfg.label === 'World Bank' ? 'WB' : cfg.label === 'Đấu Thầu' ? 'ĐT' : cfg.label}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 800, opacity: active ? 0.85 : 0.6,
                        background: active ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                        borderRadius: 20, padding: '0 4px', lineHeight: '14px',
                      }}>
                        {allItems.filter(i => i.source === key).length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: 5 }}>Quốc gia</div>
              <MultiSelectDropdown
                selected={selCountries}
                onChange={setSelCountries}
                placeholder="🌏 Tất cả quốc gia"
                options={countryList.map(c => ({
                  value: c,
                  label: COUNTRY_NAMES[c] || c,
                  icon: <FlagImg country={c} size={20} />,
                }))}
              />
            </div>

            <div>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: 5 }}>Lĩnh vực</div>
              <MultiSelectDropdown
                selected={selSectors}
                onChange={setSelSectors}
                placeholder="📦 Tất cả lĩnh vực"
                options={sectorList.map(s => ({
                  value: s,
                  label: SECTOR_NAMES[s] || s,
                  icon: SECTOR_ICONS[s] || '🏷️',
                }))}
              />
            </div>

            <div>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: 5 }}>Trạng thái</div>
              <MultiSelectDropdown
                selected={selStatuses}
                onChange={setSelStatuses}
                placeholder="⚙️ Tất cả trạng thái"
                options={statusList.map(st => ({
                  value: st,
                  label: st,
                  icon: STATUS_ICONS[st] || '⚙️',
                }))}
              />
            </div>

            <div style={{
              background: 'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(59,130,246,0.08))',
              border: '1px solid rgba(16,185,129,0.2)', borderRadius: 9, padding: '7px 9px',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, gap: 4 }}>
                {sourceBreakdown.filter(s => s.count > 0).map(s => (
                  <div key={s.key} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:s.color, boxShadow:`0 0 4px ${s.glow}` }} />
                    <span style={{ fontWeight:700, color:s.color }}>{s.icon} {s.count}</span>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid rgba(0,0,0,0.06)', paddingTop:5 }}>
                <span style={{ fontSize:10, color:'#64748b' }}>💰 Ước vốn</span>
                <span style={{ fontWeight:800, color:'#10b981', fontSize:12 }}>${(totalBudget/1e6).toFixed(0)}M</span>
              </div>
            </div>

            {hasFilters && (
              <button onClick={() => { setSelSources(new Set()); setSelCountries(new Set()); setSelStatuses(new Set()); setSelSectors(new Set()); }}
                style={{
                  padding: '6px 0', borderRadius: 8, border: '1px solid #e2e8f0',
                  background: 'transparent', color: '#64748b',
                  fontWeight: 600, fontSize: 11, cursor: 'pointer', transition: 'all 0.15s',
                }}>
                🔄 Đặt lại bộ lọc
              </button>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Source breakdown config ───────────────────────────────────
const SOURCE_CONFIG = {
  press:     { label: 'Báo Chí',        icon: '📰', color: '#3b82f6', bg: '#eff6ff' },
  adb:       { label: 'ADB (Châu Á)',   icon: '🏦', color: '#f59e0b', bg: '#fffbeb' },
  worldbank: { label: 'World Bank',     icon: '🌍', color: '#10b981', bg: '#ecfdf5' },
  gov:       { label: 'Đấu Thầu Công', icon: '📋', color: '#8b5cf6', bg: '#f5f3ff' },
};

// ── Main Dashboard ───────────────────────────────────────────
export default function DashboardPage() {
  const nav = useNavigate();
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage]               = useState(1);
  const gridRef = useRef(null);

  // API data - lấy từ cache để F5 giữ nguyên dữ liệu tức thì
  const [overview, setOverview]   = useState(() => apiCache.get('stats:overview'));
  const [trending, setTrending]   = useState(() => apiCache.get('stats:trending:15') || []);
  const [articles, setArticles]   = useState([]);
  const [totalArticles, setTotal] = useState(0);

  // Fetch stats overview
  const fetchOverview = async (force = false) => {
    try {
      const data = await statsService.getOverview(force);
      setOverview(data);
    } catch (e) {
      console.warn('Stats overview error:', e);
    }
  };

  // Fetch trending keywords
  const fetchTrending = async (limit = 15, force = false) => {
    try {
      const data = await statsService.getTrending(limit, force);
      setTrending(data || []);
    } catch (e) {
      console.warn('Trending error:', e);
    }
  };

  // Fetch articles / ODA / procurement items based on active tab
  const fetchArticles = async (filter = activeFilter, p = page) => {
    setLoading(true);
    try {
      if (filter === 'adb') {
        const data = await odaService.getProjects({ source: 'adb', page: p, size: PAGE_SIZE });
        setArticles((data.items || []).map(adaptOdaToCard));
        setTotal(data.total || 0);
      } else if (filter === 'worldbank') {
        const data = await odaService.getProjects({ source: 'worldbank', page: p, size: PAGE_SIZE });
        setArticles((data.items || []).map(adaptOdaToCard));
        setTotal(data.total || 0);
      } else if (filter === 'gov') {
        const data = await odaService.getProcurement({ page: p, size: PAGE_SIZE });
        setArticles((data.items || []).map(adaptProcToCard));
        setTotal(data.total || 0);
      } else if (filter === 'press') {
        const data = await articlesService.getArticles({ page: p, size: PAGE_SIZE, sort: 'newest', source_type: 'press' });
        setArticles(data.items || []);
        setTotal(data.total || 0);
      } else {
        // 'all'
        const data = await articlesService.getArticles({ page: p, size: PAGE_SIZE, sort: 'newest' });
        setArticles(data.items || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.warn('Articles error:', e);
      setArticles([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Initial load & data update listener
  useEffect(() => {
    fetchOverview();
    fetchTrending();

    const onDataUpdated = () => {
      fetchOverview(true);
      fetchTrending(15, true);
      fetchArticles(activeFilter, page);
    };
    window.addEventListener('bis:data_updated', onDataUpdated);
    return () => window.removeEventListener('bis:data_updated', onDataUpdated);
  }, []);

  // Khi filter/page thay đổi
  useEffect(() => {
    fetchArticles(activeFilter, page);
  }, [activeFilter, page]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchOverview(true), fetchTrending(15, true), fetchArticles(activeFilter, page)]);
    setRefreshing(false);
  };

  const handleFilter = (id) => {
    setActiveFilter(id);
    setPage(1);
  };

  const handlePageChange = (p) => {
    setPage(p);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Stats từ API (khớp với StatsOverview DTO)
  const totalCount       = overview?.total_articles ?? 0;
  const todayCount       = overview?.today_articles ?? 0;
  const govCount         = overview?.gov_count ?? 0;
  const pressCount       = overview?.press_count ?? 0;
  const adbCount         = overview?.adb_count ?? 0;
  const wbCount          = overview?.wb_count ?? 0;
  const aiProcessed      = overview?.ai_processed ?? 0;

  const chips = [
    { id: 'all',       label: '🗂️ Tất Cả',    count: totalCount },
    { id: 'press',     label: '📰 Báo Chí',    count: pressCount },
    { id: 'adb',       label: '🏦 ADB',        count: adbCount },
    { id: 'worldbank', label: '🌍 World Bank',  count: wbCount },
    { id: 'gov',       label: '📋 Đấu Thầu',   count: govCount },
  ];

  return (
    <div>
      {/* ── Hero Banner ── */}
      <div className="dashboard-banner">
        <div className="banner-aurora-1" />
        <div className="banner-aurora-2" />
        <img src={logoImg} alt="" className="banner-logo-watermark" />

        <div className="banner-content">
          <div className="banner-title" style={{ animation: 'slideInLeft 0.5s ease both' }}>
            Hệ Thống Đấu Thầu &amp; ODA Thông Minh
          </div>
          <div className="banner-sub" style={{ animation: 'slideInLeft 0.5s 0.05s ease both' }}>
            Theo dõi dữ liệu dự án, cơ hội đấu thầu từ ADB, World Bank &amp; Mua sắm công quốc gia. Phân tích tự động bởi AI — cập nhật liên tục mỗi 4h.
          </div>
          <div className="banner-pills" style={{ animation: 'slideInLeft 0.5s 0.1s ease both' }}>
            <span className="banner-pill"><Building2 size={13} style={{ color: '#f59e0b' }} /> ADB (Châu Á)</span>
            <span className="banner-pill"><Globe size={13} style={{ color: '#10b981' }} /> World Bank</span>
            <span className="banner-pill"><ShoppingBag size={13} style={{ color: '#a855f7' }} /> Đấu Thầu Công</span>
            <span className="banner-pill"><Cpu size={13} style={{ color: '#60a5fa' }} /> AI Insights</span>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="stats-grid">
        <StatsCard
          loading={!overview}
          icon={<Newspaper size={20} style={{ color: '#3b82f6' }} />}
          label="Tổng Bài Viết"
          value={totalCount}
          sub={`+${todayCount} hôm nay`}
          trend={todayCount > 0 ? `+${todayCount}` : null}
          accentColor="#3b82f6" iconBg="var(--brand-50)"
        />
        <StatsCard
          loading={!overview}
          icon={<Building2 size={20} style={{ color: '#f59e0b' }} />}
          label="ADB"
          value={adbCount}
          sub="Ngân hàng Phát triển Châu Á"
          accentColor="#f59e0b" iconBg="#fffbeb"
        />
        <StatsCard
          loading={!overview}
          icon={<Globe size={20} style={{ color: '#10b981' }} />}
          label="World Bank"
          value={wbCount}
          sub="Ngân hàng Thế giới"
          accentColor="#10b981" iconBg="#ecfdf5"
        />
        <StatsCard
          loading={!overview}
          icon={<ShoppingBag size={20} style={{ color: '#8b5cf6' }} />}
          label="Đấu Thầu Công"
          value={govCount}
          sub="Mua sắm công quốc gia"
          accentColor="#8b5cf6" iconBg="#f5f3ff"
        />
        <StatsCard
          loading={!overview}
          icon={<Newspaper size={20} style={{ color: '#3b82f6' }} />}
          label="Báo Chí"
          value={pressCount}
          sub="Tin tức tổng hợp"
          accentColor="#3b82f6" iconBg="#eff6ff"
        />
        <StatsCard
          loading={!overview}
          icon={<Cpu size={20} style={{ color: '#ec4899' }} />}
          label="AI Đã Xử Lý"
          value={aiProcessed}
          sub={`${totalCount > 0 ? Math.round(aiProcessed/totalCount*100) : 0}% tổng bài`}
          accentColor="#ec4899" iconBg="#fdf2f8"
        />
      </div>

      {/* ── Trending Strip ── */}
      <TrendingStrip
        keywords={trending}
        onSelectKeyword={(term) => nav(`/news/all?q=${encodeURIComponent(term)}`)}
      />

      {/* ── Map ── */}
      <ProjectDistributionMap />

      {/* ── News Section ── */}
      <div ref={gridRef}>
        <div className="section-header dashboard-news-section-header">
          <div className="section-title">
            <span className="dot" />
            <span style={{ whiteSpace: 'nowrap', fontWeight: 800 }}>Tin Tức Mới Nhất</span>
            <span style={{
              fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
              padding: '2px 8px', background: 'var(--bg-surface-2)',
              borderRadius: 'var(--radius-full)', border: '1px solid var(--border)',
              whiteSpace: 'nowrap',
            }}>
              {totalArticles} bài
            </span>
          </div>
          <div className="dashboard-news-actions">
            <button className="btn btn-ghost btn-sm" onClick={handleRefresh} id="btn-refresh" style={{ gap: 5 }}>
              {refreshing
                ? <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} />
                : <RefreshCw size={13} />}
              Làm mới
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => nav('/news/all')} id="btn-view-all" style={{ gap: 5 }}>
              Xem tất cả <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="filter-chips">
          {chips.map((c, idx) => (
            <button
              key={c.id}
              className={`chip ${activeFilter === c.id ? 'active' : ''}`}
              onClick={() => handleFilter(c.id)}
              id={`chip-filter-${c.id}`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {c.label}
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '1px 6px',
                background: activeFilter === c.id ? 'rgba(255,255,255,0.25)' : 'var(--bg-surface-2)',
                borderRadius: 'var(--radius-full)',
                color: activeFilter === c.id ? 'white' : 'var(--text-muted)',
              }}>
                {c.count}
              </span>
            </button>
          ))}
        </div>

        {/* News grid */}
        <div className="news-grid dashboard-news-grid">
          {loading
            ? Array.from({ length: PAGE_SIZE }, (_, i) => <SkeletonCard key={i} />)
            : articles.length === 0
              ? (
                <div className="empty-state" style={{ gridColumn: '1 / -1', minHeight: 200 }}>
                  <div className="empty-icon">📭</div>
                  <div className="empty-title">Chưa có bài viết</div>
                  <div className="empty-sub">Hệ thống sẽ crawl tự động mỗi 4h. Admin có thể crawl ngay trong phần Cài đặt.</div>
                </div>
              )
              : articles.map((a, i) => <NewsCard key={a.id} article={a} index={i} />)
          }
        </div>

        {!loading && (
          <Pagination
            page={page}
            total={totalArticles}
            pageSize={PAGE_SIZE}
            onChange={handlePageChange}
          />
        )}
      </div>

      {/* ── Source Breakdown (4-Column Grid) ── */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 18,
        padding: '22px 24px',
        marginTop: 'var(--space-8)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            }}>
              <TrendingUp size={16} />
            </div>
            Phân Bổ Theo Nguồn Dữ Liệu
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-surface-2)', padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border-subtle)' }}>
            {overview ? `${totalCount} bài viết tổng` : 'Đang tải...'}
          </span>
        </div>

        <div className="responsive-grid-form" style={{ gap: 16 }}>
          {Object.entries(SOURCE_CONFIG).map(([key, src]) => {
            let count = 0;
            if (key === 'gov') count = govCount;
            else if (key === 'press') count = pressCount;
            else if (key === 'adb') count = adbCount;
            else if (key === 'worldbank') count = wbCount;

            const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            return (
              <div
                key={key}
                onClick={() => handleFilter(key)}
                style={{
                  background: 'var(--bg-surface-2)',
                  border: '1.5px solid var(--border-subtle)',
                  borderRadius: 14, padding: '16px 18px',
                  position: 'relative', overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 12px 28px ${src.color}25`;
                  e.currentTarget.style.borderColor = src.color;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.03)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${src.color}, ${src.color}dd)` }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 34, height: 34, borderRadius: 10,
                      background: src.bg, border: `1px solid ${src.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 17, flexShrink: 0, boxShadow: `0 3px 10px ${src.color}20`,
                    }}>
                      {src.icon}
                    </span>
                    {src.label}
                  </span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: src.color, letterSpacing: '-0.5px' }}>
                    {overview ? count : <span className="skeleton" style={{ display: 'inline-block', width: 40, height: 24, borderRadius: 6 }} />}
                  </span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-surface)', borderRadius: 20, overflow: 'hidden', marginBottom: 8, border: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{
                    height: '100%', width: overview ? `${pct}%` : '0%',
                    background: `linear-gradient(90deg, ${src.color}aa, ${src.color})`,
                    borderRadius: 20, boxShadow: `0 0 10px ${src.color}66`,
                    transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: src.color, background: `${src.color}15`, padding: '2px 8px', borderRadius: 12 }}>
                    {overview ? `${pct}% tổng số` : '---'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    {overview ? `${count} bài viết` : '---'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
