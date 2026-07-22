// src/pages/DashboardPage.jsx
import { useState, useEffect, useRef } from 'react';
import {
  Newspaper, Building2, Globe, ShoppingBag, Cpu,
  RefreshCw, ArrowRight, TrendingUp, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import NewsCard from '../components/NewsCard';
import { mockArticles, statsData, trendingKeywords, SOURCES, mockAdbProjects, mockWbProjects, mockProcurementNotices, mockProcurementPlans } from '../data/mockData';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const PAGE_SIZE = 6;

// ── Trending marquee strip ───────────────────────────────────
function TrendingStrip() {
  // items = [all keywords] + [all keywords] for seamless loop
  const items = [...trendingKeywords, ...trendingKeywords];

  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return '';
  };

  const rankColors = { 1: '#f59e0b', 2: '#818cf8', 3: '#ec4899' };

  return (
    <div className="trending-strip">
      <div className="trending-strip-header">
        <div className="trending-strip-title">
          <Zap size={14} style={{ color: '#f59e0b', animation: 'floatY 1.5s ease-in-out infinite' }} />
          Từ Khóa Đang Nổi Bật
        </div>
        <span className="hot-badge" style={{ animation: 'pulse 2s infinite' }}>🔥 LIVE</span>
        {/* rank-1 pill only — compact, won't overflow */}
        {trendingKeywords.slice(0, 1).map(kw => (
          <span key={kw.rank} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: 11, fontWeight: 700,
            background: '#fef3c7', color: '#92400e',
            border: '1px solid #f59e0b66',
            whiteSpace: 'nowrap',
            animation: 'bounceIn 0.5s ease both',
            marginLeft: 4,
          }}>
            <span style={{
              width: 14, height: 14, borderRadius: '50%',
              background: '#f59e0b', color: 'white', fontSize: 8, fontWeight: 900,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>1</span>
            {kw.emoji} {kw.text}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
          ↔ Di chuột để dừng
        </span>
      </div>

      <div className="trending-marquee-wrapper">
        <div className="trending-marquee-track">
          {items.map((kw, i) => (
            <span
              key={i}
              className={`trending-keyword-chip ${getRankClass(kw.rank)}`}
              id={i < trendingKeywords.length ? `trending-chip-${kw.rank}` : undefined}
            >
              <span style={{ fontSize: 14 }}>{kw.emoji}</span>
              {kw.rank <= 3 && (
                <span style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: rankColors[kw.rank],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 900, color: 'white', flexShrink: 0,
                }}>{kw.rank}</span>
              )}
              {kw.text}
              <span style={{ fontSize: 10, opacity: 0.55, fontWeight: 700, marginLeft: 2 }}>·{kw.count}</span>
            </span>
          ))}
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

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

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

      {pages.map(p => (
        <button
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

function MapFlyTo({ items, source, country, sector, status }) {
  const map = useMap();
  const timerRef = useRef(null);

  useEffect(() => {
    // Debounce: wait a frame so React finishes rendering markers before moving
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const coords = items.map(i => MAP_COORDS[i.id]).filter(Boolean);
      if (coords.length === 0) return;

      if (coords.length === 1) {
        // Single point: smooth fly, but clamp zoom so marker never looks huge
        map.flyTo(coords[0], 7, { animate: true, duration: 0.5, easeLinearity: 0.5 });
      } else {
        const lats = coords.map(c => c[0]);
        const lngs = coords.map(c => c[1]);
        const bounds = [
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)],
        ];
        // fitBounds = instant snap to correct zoom, no ugly intermediate zoom frames
        // Then we smooth it with a short CSS opacity crossfade via map panning
        map.fitBounds(bounds, {
          padding: [55, 55],
          maxZoom: 8,
          animate: true,
          duration: 0.45,
          easeLinearity: 0.35,
        });
      }
    }, 30); // 30ms debounce — enough for React to paint the filtered markers

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
          {/* Clear all row */}
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


// ── Project Distribution Map (Leaflet Real World Map) ────────────
function ProjectDistributionMap() {
  // Multi-select: empty Set = "all"
  const [selSources,   setSelSources]   = useState(new Set());
  const [selCountries, setSelCountries] = useState(new Set());
  const [selStatuses,  setSelStatuses]  = useState(new Set());
  const [selSectors,   setSelSectors]   = useState(new Set());

  const allItems = [
    ...mockAdbProjects.map(p => ({ ...p, source: 'adb', type: 'Dự án ADB' })),
    ...mockWbProjects.map(p => ({ ...p, source: 'worldbank', type: 'Dự án World Bank' })),
    ...mockProcurementNotices.map(p => ({ ...p, source: 'dauthau', type: 'TB Mời thầu', sector: p.sector || 'Transport' })),
    ...mockProcurementPlans.map(p => ({ ...p, source: 'dauthau', type: 'Kế hoạch thầu', sector: p.sector || 'Transport' }))
  ].filter(item => MAP_COORDS[item.id]);

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

  const countryLabel2 = c => countryLabel(c);

  return (
    <div style={{ marginBottom: 'var(--space-8)' }}>
      {/* ── Section Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(59,130,246,0.4)',
          }}>
            <Globe size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Bản Đồ Phân Bố Dự Án ODA &amp; Đấu Thầu
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
              <Cpu size={11} style={{ color: '#a855f7' }} />
              AI Powered · {filteredItems.length} dự án hiển thị trên bản đồ
            </div>
          </div>
        </div>
        {/* Legend pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.entries(sourceConfig).map(([key, cfg]) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 10px', borderRadius: 20,
              background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
              fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)'
            }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 6px ${cfg.glow}` }} />
              {cfg.icon} {cfg.label} · <strong style={{ color: cfg.color }}>{allItems.filter(i=>i.source===key).length}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* ── Full-width map with floating filter overlay ── */}
      <div style={{
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid var(--border-subtle)',
        position: 'relative',
        overflow: 'visible',
      }}>
        {/* Map container needs clip */}
        <div style={{ borderRadius: 16, overflow: 'hidden' }}>
          <MapContainer
            center={[15, 107]}
            zoom={4}
            style={{ height: 500, width: '100%' }}
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

            {filteredItems.map(item => {
              const coords = MAP_COORDS[item.id];
              if (!coords) return null;
              const cfg = sourceConfig[item.source] || sourceConfig.dauthau;
              return (
                <CircleMarker
                  key={item.id}
                  center={coords}
                  radius={item.source === 'dauthau' ? 7 : 10}
                  pathOptions={{ color: 'white', weight: 2.5, fillColor: cfg.color, fillOpacity: 0.92 }}
                >
                  <Popup maxWidth={280}>
                    <div style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", padding: '4px 2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'white', background: cfg.color, padding: '3px 9px', borderRadius: 20 }}>
                          {item.type}
                        </span>
                        <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{String(item.id).slice(0,12)}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4, color: '#0f172a', marginBottom: 8 }}>
                        {(item.title||'').length > 80 ? (item.title||'').slice(0,80)+'…' : item.title}
                      </div>
                      <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#475569', marginBottom: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FlagImg country={item.country} size={16} /> {countryLabel2(item.country)}</span>
                        {item.amount && <span style={{ fontWeight: 700, color: cfg.color }}>💰 {item.amount}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#475569', marginBottom: 10, flexWrap: 'wrap' }}>
                        {item.sector && <span>{SECTOR_ICONS[item.sector] || '🏷️'} {SECTOR_NAMES[item.sector] || item.sector}</span>}
                        {item.status && <span style={{ background: item.status==='Active' ? '#dcfce7':'#f1f5f9', color: item.status==='Active' ? '#16a34a':'#475569', borderRadius: 20, padding: '1px 8px', fontWeight: 600 }}>{STATUS_ICONS[item.status] || '⚙️'} {item.status}</span>}
                      </div>
                      <div style={{ background: 'linear-gradient(135deg,rgba(168,85,247,.07),rgba(59,130,246,.07))', border: '1px dashed rgba(168,85,247,.3)', borderRadius: 10, padding: '8px 10px', fontSize: 11, color: '#334155', lineHeight: 1.5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#a855f7', fontSize: 10, marginBottom: 4 }}>
                          <Cpu size={10} /> PHÂN TÍCH AI
                        </div>
                        {item.aiSummary || 'Dự án thúc đẩy nâng cấp hạ tầng, kết nối vùng và cải thiện an sinh xã hội khu vực.'}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {/* Empty state overlay */}
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
        <div style={{
          position: 'absolute', top: 12, right: 12, zIndex: 1000,
          width: 228,
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.7)',
          borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}>
          {/* Panel header */}
          <div style={{
            background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
            padding: '9px 12px', borderRadius: '13px 13px 0 0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>🗺️ Bộ lọc</span>
            <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: 'white' }}>
              {filteredItems.length}/{allItems.length}
            </span>
          </div>

          <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 8 }}>

            {/* ── Source multi-toggle chips ── */}
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
              {selSources.size === 0 && (
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, fontStyle: 'italic' }}>Chọn để lọc theo nguồn</div>
              )}
            </div>

            {/* ── Country multi-select ── */}
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

            {/* ── Sector multi-select ── */}
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

            {/* ── Status multi-select ── */}
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

            {/* ── Mini stats ── */}
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

            {/* Reset */}
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
        </div>

        {/* ── Bottom legend bar ── */}
        <div style={{
          position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, display: 'flex', gap: 10,
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.7)', borderRadius: 20,
          padding: '5px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
          whiteSpace: 'nowrap',
        }}>
          {Object.entries(sourceConfig).map(([key, cfg]) => (
            <div key={key} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600, color:'#475569' }}>
              <div style={{ width:9, height:9, borderRadius:'50%', background:cfg.color, boxShadow:`0 0 5px ${cfg.glow}` }} />
              {cfg.icon} {cfg.label} <strong style={{ color:cfg.color }}>{allItems.filter(i=>i.source===key).length}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ── Main Dashboard ───────────────────────────────────────────
export default function DashboardPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const gridRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setRefreshing(false);
  };

  const filtered = (activeFilter === 'all'
    ? mockArticles
    : mockArticles.filter(a => a.source === activeFilter)
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalFiltered = filtered.length;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilter = (id) => {
    setActiveFilter(id);
    setPage(1);
  };

  const handlePageChange = (p) => {
    setPage(p);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const chips = [
    { id: 'all',       label: '🗂️ Tất Cả',   count: mockArticles.length },
    { id: 'tintuc',    label: '📰 Tin Tức',   count: mockArticles.filter(a => a.source === 'tintuc').length },
    { id: 'adb',       label: '🏦 ADB',       count: mockArticles.filter(a => a.source === 'adb').length },
    { id: 'worldbank', label: '🌍 World Bank', count: mockArticles.filter(a => a.source === 'worldbank').length },
    { id: 'dauthau',   label: '📋 Đấu Thầu',  count: mockArticles.filter(a => a.source === 'dauthau').length },
  ];

  return (
    <div>
      {/* ── Hero Banner ── */}
      <div className="dashboard-banner">
        <div className="banner-orb" />
        <div className="banner-content">
          <div className="banner-title" style={{ animation: 'slideInLeft 0.6s ease both' }}>
            Trung Tâm Thông Tin Tích Hợp
          </div>
          <div className="banner-sub" style={{ animation: 'slideInLeft 0.6s 0.1s ease both', opacity: 0, animationFillMode: 'forwards' }}>
            Theo dõi tin tức, dự án và đấu thầu từ ADB, World Bank và hệ thống đấu thầu quốc gia.
            Phân tích bởi AI — cập nhật liên tục.
          </div>
          <div className="banner-pills" style={{ animation: 'slideInLeft 0.6s 0.2s ease both', opacity: 0, animationFillMode: 'forwards' }}>
            <span className="banner-pill"><Building2 size={11} /> ADB</span>
            <span className="banner-pill"><Globe size={11} /> World Bank</span>
            <span className="banner-pill"><ShoppingBag size={11} /> Đấu Thầu</span>
            <span className="banner-pill"><Cpu size={11} /> AI Powered</span>
          </div>
        </div>
        <div className="banner-stat" style={{ animation: 'bounceIn 0.7s 0.3s ease both', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="banner-stat-num">{statsData.totalArticles.toLocaleString()}</div>
          <div className="banner-stat-label">Bài Viết Tổng Hợp</div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.65 }}>
            Hôm nay: +{statsData.todayArticles} bài mới
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="stats-grid" style={{ animation: 'fadeUp 0.5s 0.1s ease both' }}>
        <StatsCard icon={<Newspaper size={20} style={{ color: '#3b82f6' }} />}
          label="Tổng Bài Viết" value={statsData.totalArticles}
          sub={`+${statsData.todayArticles} hôm nay`} trend="+12.4%"
          accentColor="#3b82f6" iconBg="var(--brand-50)" />
        <StatsCard icon={<Building2 size={20} style={{ color: '#f59e0b' }} />}
          label="ADB" value={statsData.adbCount}
          sub="Ngân hàng Phát triển Châu Á" trend="+8.1%"
          accentColor="#f59e0b" iconBg="#fffbeb" />
        <StatsCard icon={<Globe size={20} style={{ color: '#10b981' }} />}
          label="World Bank" value={statsData.wbCount}
          sub="Ngân hàng Thế giới" trend="+5.3%"
          accentColor="#10b981" iconBg="#ecfdf5" />
        <StatsCard icon={<ShoppingBag size={20} style={{ color: '#8b5cf6' }} />}
          label="Đấu Thầu Công" value={statsData.dauthauCount}
          sub="Mua sắm công quốc gia" trend="+18.7%"
          accentColor="#8b5cf6" iconBg="#f5f3ff" />
        <StatsCard icon={<Newspaper size={20} style={{ color: 'var(--color-ai)' }} />}
          label="Tin Tức Báo Chí" value={mockArticles.filter(a => a.source === 'tintuc').length}
          sub="Crawl từ các trang báo" trend="+6.2%"
          accentColor="var(--color-ai)" iconBg="var(--brand-50)" />
        <StatsCard icon={<Cpu size={20} style={{ color: '#ec4899' }} />}
          label="AI Đã Xử Lý" value={statsData.aiProcessed}
          sub={`${Math.round(statsData.aiProcessed / statsData.totalArticles * 100)}% tổng bài`} trend="+99.3%"
          accentColor="#ec4899" iconBg="#fdf2f8" />
      </div>

      {/* ── 🔥 Trending Strip (TOP) ── */}
      <TrendingStrip />

      {/* ── Geographical Distribution Map ── */}
      <ProjectDistributionMap />

      {/* ── News Section ── */}
      <div ref={gridRef}>
        {/* Section header */}
        <div className="section-header">
          <div className="section-title">
            <span className="dot" />
            Tin Tức Mới Nhất
            <span style={{
              fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
              padding: '2px 8px', background: 'var(--bg-surface-2)',
              borderRadius: 'var(--radius-full)', border: '1px solid var(--border)',
            }}>
              {totalFiltered} bài
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={handleRefresh} id="btn-refresh" style={{ gap: 5 }}>
              <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
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
        <div className="news-grid">
          {loading
            ? Array.from({ length: PAGE_SIZE }, (_, i) => <SkeletonCard key={i} />)
            : paged.map((a, i) => <NewsCard key={a.id} article={a} index={i} />)}
        </div>

        {/* Pagination */}
        {!loading && (
          <Pagination
            page={page}
            total={totalFiltered}
            pageSize={PAGE_SIZE}
            onChange={handlePageChange}
          />
        )}
      </div>

      {/* ── Source Breakdown ── */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)',
        marginTop: 'var(--space-8)',
      }}>
        <div className="article-sidebar-title" style={{ marginBottom: 'var(--space-5)' }}>
          <TrendingUp size={14} style={{ color: 'var(--brand-500)' }} />
          Phân Bổ Theo Nguồn
        </div>
        {/* ── Source Breakdown ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--space-6)',
        }}>
          {Object.values(SOURCES).map(src => {
            const count = mockArticles.filter(a => a.source === src.id).length;
            const pct = Math.round(count / mockArticles.length * 100);
            return (
              <div key={src.id} style={{
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-5)',
                borderTop: `3px solid ${src.color}`,
                transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: src.bg || src.darkBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, flexShrink: 0,
                    }}>{src.icon}</span>
                    {src.name}
                  </span>
                  <span style={{
                    fontSize: 22, fontWeight: 900, color: src.color,
                    letterSpacing: '-0.5px',
                  }}>{count}</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-surface)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{
                    height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${src.color}99, ${src.color})`,
                    borderRadius: 'var(--radius-full)',
                    boxShadow: `0 0 10px ${src.color}55`,
                    transition: 'width 1.4s cubic-bezier(0.34,1.56,0.64,1)',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{pct}% tổng bài viết</span>
                  <span style={{ fontSize: 11, color: src.color, fontWeight: 700 }}>Bài</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
