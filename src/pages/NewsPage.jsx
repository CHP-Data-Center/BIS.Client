// src/pages/NewsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, ChevronRight, Bookmark, BookmarkCheck, RotateCcw, ChevronLeft, Loader2, Building2, Globe, ShoppingBag, Newspaper } from 'lucide-react';
import { articlesService } from '../services/articles';
import NewsCard from '../components/NewsCard';

const PAGE_SIZE = 18;

// Source type mapping based on URL param
const SOURCE_MAP = {
  all:       { label: 'Tất Cả Tin Tức & Dự Án', type: null, icon: <Newspaper size={18} style={{ color: '#3b82f6' }} /> },
  press:     { label: 'Tin Tức Báo Chí', type: 'press', icon: <Newspaper size={18} style={{ color: '#3b82f6' }} /> },
  gov:       { label: 'Mua Sắm Công / Đấu Thầu', type: 'gov', icon: <ShoppingBag size={18} style={{ color: '#8b5cf6' }} /> },
  tintuc:    { label: 'Tin Tức Báo Chí', type: 'press', icon: <Newspaper size={18} style={{ color: '#3b82f6' }} /> },
  adb:       { label: 'Dự Án & Đấu Thầu ADB (Châu Á)', query: 'ADB', mockKey: 'adb', icon: <Building2 size={18} style={{ color: '#f59e0b' }} /> },
  worldbank: { label: 'Dự Án & Đấu Thầu World Bank', query: 'World Bank', mockKey: 'worldbank', icon: <Globe size={18} style={{ color: '#10b981' }} /> },
  dauthau:   { label: 'Mua Sắm Công Quốc Gia', type: 'gov', mockKey: 'dauthau', icon: <ShoppingBag size={18} style={{ color: '#8b5cf6' }} /> },
};

function SkeletonCard() {
  return (
    <div className="news-card" style={{ cursor: 'default' }}>
      <div className="skeleton" style={{ height: 160 }} />
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="skeleton" style={{ height: 18, width: 60, borderRadius: 20 }} />
        </div>
        <div className="skeleton" style={{ height: 16, borderRadius: 5 }} />
        <div className="skeleton" style={{ height: 16, width: '75%', borderRadius: 5 }} />
        <div className="skeleton" style={{ height: 12, borderRadius: 5 }} />
      </div>
    </div>
  );
}

function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button className="page-btn" onClick={() => onChange(page - 1)} disabled={page === 1} id="btn-news-prev">
        <ChevronLeft size={15} />
      </button>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, padding: '0 8px' }}>
        Trang {page} / {totalPages} — {total} bài
      </span>
      <button className="page-btn" onClick={() => onChange(page + 1)} disabled={page === totalPages} id="btn-news-next">
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

export default function NewsPage() {
  const { source = 'all' } = useParams();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading]         = useState(true);
  const [articles, setArticles]       = useState([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);

  // Filters
  const [search, setSearch]     = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy]     = useState('newest');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [onlyMyKw, setOnlyMyKw] = useState(false);

  const srcConfig = SOURCE_MAP[source] || SOURCE_MAP.all;

  const fetchArticles = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = {
        page: p,
        size: PAGE_SIZE,
        sort: sortBy,
        only_my_keywords: onlyMyKw,
      };
      const queryVal = search.trim() || srcConfig.query || '';
      if (queryVal)          params.q           = queryVal;
      if (srcConfig.type)    params.source_type = srcConfig.type;
      if (dateFrom)          params.date_from   = dateFrom;
      if (dateTo)            params.date_to     = dateTo;

      const data = await articlesService.getArticles(params);
      setArticles(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.warn('NewsPage fetch error:', e);
      setArticles([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, srcConfig, dateFrom, dateTo, onlyMyKw]);

  // Reset + fetch when source changes
  useEffect(() => {
    setPage(1);
    setSearch(searchParams.get('q') || '');
    setOnlyBookmarked(false);
    fetchArticles(1);
  }, [source]);

  // Fetch when page changes
  useEffect(() => {
    fetchArticles(page);
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchArticles(1);
  };

  const handleReset = () => {
    setSearch('');
    setSortBy('newest');
    setDateFrom('');
    setDateTo('');
    setOnlyMyKw(false);
    setOnlyBookmarked(false);
    setPage(1);
    setTimeout(() => fetchArticles(1), 50);
  };

  const handlePageChange = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Lọc client cho "Bài đã lưu"
  const displayedArticles = onlyBookmarked
    ? articles.filter(a => a.is_bookmarked)
    : articles;

  const bookmarkedCount = articles.filter(a => a.is_bookmarked).length;

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* ── Filter sidebar ── */}
      <div style={{
        width: 240, flexShrink: 0,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16,
        padding: 16,
        position: 'sticky',
        top: 80,
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={14} />
          Bộ Lọc
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ marginBottom: 14 }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              id="input-news-search"
              className="form-input"
              style={{ paddingLeft: 32, fontSize: 12 }}
              placeholder="Tìm kiếm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: 8, gap: 6, justifyContent: 'center' }}>
            <Search size={12} /> Tìm kiếm
          </button>
        </form>

        {/* Sort */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 6 }}>Sắp xếp</div>
          <select
            className="form-input"
            style={{ fontSize: 12 }}
            value={sortBy}
            onChange={e => { setSortBy(e.target.value); setPage(1); fetchArticles(1); }}
          >
            <option value="newest">Mới nhất</option>
            <option value="match_count">Khớp nhiều nhất</option>
          </select>
        </div>

        {/* Date range */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 6 }}>Từ ngày</div>
          <input type="date" className="form-input" style={{ fontSize: 12 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', margin: '8px 0 6px' }}>Đến ngày</div>
          <input type="date" className="form-input" style={{ fontSize: 12 }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>

        {/* Only my keywords */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={onlyMyKw}
              onChange={e => { setOnlyMyKw(e.target.checked); setPage(1); }}
              style={{ width: 14, height: 14, accentColor: 'var(--brand-500)' }}
            />
            Chỉ từ khóa của tôi
          </label>
        </div>

        <button className="btn btn-ghost btn-sm" style={{ width: '100%', gap: 6, justifyContent: 'center' }} onClick={handleReset} id="btn-reset-filters">
          <RotateCcw size={12} /> Đặt lại
        </button>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div className="section-header" style={{ marginBottom: 16 }}>
          <div className="section-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {srcConfig.icon}
              {srcConfig.label}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
              padding: '2px 8px', background: 'var(--bg-surface-2)',
              borderRadius: 'var(--radius-full)', border: '1px solid var(--border)',
            }}>
              {displayedArticles.length} bài
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* 🌟 Nút lọc "Bài đã lưu" đẹp mắt */}
            <button
              className="btn btn-sm"
              onClick={() => setOnlyBookmarked(v => !v)}
              id="btn-filter-bookmarked"
              style={{
                gap: 6,
                background: onlyBookmarked
                  ? 'linear-gradient(135deg, #f59e0b, #ec4899)'
                  : 'var(--bg-surface)',
                color: onlyBookmarked ? 'white' : 'var(--text-secondary)',
                border: onlyBookmarked ? 'none' : '1px solid var(--border)',
                boxShadow: onlyBookmarked ? '0 4px 14px rgba(245,158,11,0.35)' : 'none',
                fontWeight: 700,
                transition: 'all 0.2s ease',
              }}
            >
              {onlyBookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
              {onlyBookmarked ? 'Đang hiện: Bài đã lưu' : 'Bài đã lưu'}
              {bookmarkedCount > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 10,
                  background: onlyBookmarked ? 'rgba(255,255,255,0.3)' : 'var(--brand-100)',
                  color: onlyBookmarked ? 'white' : 'var(--brand-700)',
                }}>
                  {bookmarkedCount}
                </span>
              )}
            </button>

            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setPage(1); fetchArticles(1); }}
              id="btn-news-refresh"
              style={{ gap: 5 }}
            >
              {loading ? <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> : <RotateCcw size={13} />}
              Làm mới
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="breadcrumb" style={{ marginBottom: 16 }}>
          <a onClick={() => nav('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</a>
          <ChevronRight size={12} className="breadcrumb-sep" />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{srcConfig.label}</span>
        </div>

        {/* Grid */}
        <div className="news-grid">
          {loading
            ? Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)
            : displayedArticles.length === 0
              ? (
                <div className="empty-state" style={{ gridColumn: '1 / -1', minHeight: 300 }}>
                  <div className="empty-icon">{onlyBookmarked ? '🔖' : '📭'}</div>
                  <div className="empty-title">
                    {onlyBookmarked ? 'Chưa có bài viết nào được lưu' : 'Không tìm thấy bài viết'}
                  </div>
                  <div className="empty-sub">
                    {onlyBookmarked
                      ? 'Bấm vào biểu tượng bookmark trên thẻ bài viết để lưu lại.'
                      : (search ? `Không có kết quả cho "${search}". Thử từ khóa khác.` : 'Hệ thống tự động crawl dữ liệu mới nhất.')}
                  </div>
                  {(search || onlyBookmarked) && (
                    <button className="btn btn-secondary" onClick={handleReset} style={{ marginTop: 12 }}>
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              )
              : displayedArticles.map((a, i) => <NewsCard key={a.id} article={a} index={i} />)
          }
        </div>

        {!loading && (
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={handlePageChange} />
        )}
      </div>
    </div>
  );
}
