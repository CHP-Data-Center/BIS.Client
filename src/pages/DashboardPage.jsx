// src/pages/DashboardPage.jsx
import { useState, useEffect, useRef } from 'react';
import {
  Newspaper, Building2, Globe, ShoppingBag, Cpu,
  RefreshCw, ArrowRight, TrendingUp, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import NewsCard from '../components/NewsCard';
import { mockArticles, statsData, trendingKeywords, SOURCES } from '../data/mockData';

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
        {/* Top-3 quick pills always visible */}
        <div style={{ display: 'flex', gap: 6, marginLeft: 16 }}>
          {trendingKeywords.slice(0, 3).map(kw => (
            <span key={kw.rank} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: 11, fontWeight: 700,
              background: kw.rank === 1 ? '#fef3c7' : kw.rank === 2 ? '#e0e7ff' : '#fce7f3',
              color: kw.rank === 1 ? '#92400e' : kw.rank === 2 ? '#3730a3' : '#9d174d',
              border: `1px solid ${rankColors[kw.rank]}66`,
              whiteSpace: 'nowrap',
              animation: `bounceIn 0.5s ${kw.rank * 0.1}s ease both`,
            }}>
              <span style={{
                width: 14, height: 14, borderRadius: '50%',
                background: rankColors[kw.rank],
                color: 'white', fontSize: 8, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>{kw.rank}</span>
              {kw.emoji} {kw.text}
            </span>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>
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

  const filtered = activeFilter === 'all'
    ? mockArticles
    : mockArticles.filter(a => a.source === activeFilter);

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
        <StatsCard icon={<Cpu size={20} style={{ color: '#ec4899' }} />}
          label="AI Đã Xử Lý" value={statsData.aiProcessed}
          sub={`${Math.round(statsData.aiProcessed / statsData.totalArticles * 100)}% tổng bài`} trend="+99.3%"
          accentColor="#ec4899" iconBg="#fdf2f8" />
      </div>

      {/* ── 🔥 Trending Strip (TOP) ── */}
      <TrendingStrip />

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
