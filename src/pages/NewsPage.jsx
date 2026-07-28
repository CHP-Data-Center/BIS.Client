// src/pages/NewsPage.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, ChevronRight, Bookmark, BookmarkCheck, RotateCcw, ChevronLeft, Loader2, Building2, Globe, ShoppingBag, Newspaper, X } from 'lucide-react';
import { articlesService } from '../services/articles';
import { odaService } from '../services/oda';
import { adaptOdaToCard, adaptProcToCard } from '../adapters/oda';
import NewsCard from '../components/NewsCard';
import WorldBankView from '../components/WorldBankView';

const PAGE_SIZE = 12;

// Ánh xạ URL param -> nguồn. api: 'articles' (tin bài) | 'oda' (ADB/WB) | 'proc' (đấu thầu).
// ADB/WB nằm ở bảng oda_projects, đấu thầu ở procurement_items — KHÔNG phải /articles.
const SOURCE_MAP = {
  all:       { label: 'Tất Cả Tin Tức & Dự Án', api: 'articles', type: null, icon: <Newspaper size={18} style={{ color: '#3b82f6' }} /> },
  press:     { label: 'Tin Tức Báo Chí', api: 'articles', type: 'press', icon: <Newspaper size={18} style={{ color: '#3b82f6' }} /> },
  tintuc:    { label: 'Tin Tức Báo Chí', api: 'articles', type: 'press', icon: <Newspaper size={18} style={{ color: '#3b82f6' }} /> },
  adb:       { label: 'Dự Án ADB (Châu Á)', api: 'oda', odaSource: 'adb', icon: <Building2 size={18} style={{ color: '#f59e0b' }} /> },
  worldbank: { label: 'Dự Án World Bank', api: 'oda', odaSource: 'worldbank', icon: <Globe size={18} style={{ color: '#10b981' }} /> },
  gov:       { label: 'Mua Sắm Công / Đấu Thầu', api: 'proc', icon: <ShoppingBag size={18} style={{ color: '#8b5cf6' }} /> },
  dauthau:   { label: 'Mua Sắm Công Quốc Gia', api: 'proc', icon: <ShoppingBag size={18} style={{ color: '#8b5cf6' }} /> },
};

function SkeletonCard() {
  return (
    <div className="news-card" style={{ cursor: 'default', height: 410 }}>
      <div className="skeleton" style={{ height: 150 }} />
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
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

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) pages.push(i);
    else if (pages[pages.length - 1] !== '...') pages.push('...');
  }

  return (
    <div className="pagination" style={{ marginTop: 20, marginBottom: 12 }}>
      <button
        className="page-btn"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        id="btn-news-prev"
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
              id={`btn-news-page-${p}`}
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
        id="btn-news-next"
        title="Trang sau"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

export default function NewsPage() {
  const { source = 'all' } = useParams();

  if (source === 'worldbank') {
    return <WorldBankView type="worldbank" />;
  }
  if (source === 'adb') {
    return <WorldBankView type="adb" />;
  }
  if (source === 'gov' || source === 'dauthau') {
    return <WorldBankView type="procurement" />;
  }
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const scrollContainerRef = useRef(null);

  const [loading, setLoading]                 = useState(true);
  const [articles, setArticles]               = useState([]);
  const [total, setTotal]                     = useState(0);
  const [page, setPage]                       = useState(1);
  const [onlyBookmarked, setOnlyBookmarked]   = useState(false);
  const [bookmarkedArticles, setBookmarkedArticles] = useState([]);
  const [loadingBookmarks, setLoadingBookmarks]     = useState(false);

  // Filters
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [search, setSearch]           = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy]           = useState('newest');
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');
  const [onlyMyKw, setOnlyMyKw]       = useState(false);

  const srcConfig = SOURCE_MAP[source] || SOURCE_MAP.all;

  const fetchArticles = useCallback(async (p = 1, overrideSearch = null) => {
    setLoading(true);
    try {
      const q = (overrideSearch !== null ? overrideSearch : search).trim();
      let items = [];
      let tot = 0;

      if (srcConfig.api === 'oda') {
        // Dự án ADB / World Bank (bảng oda_projects).
        const res = await odaService.getProjects({
          source: srcConfig.odaSource, page: p, size: PAGE_SIZE, ...(q ? { q } : {}),
        });
        items = (res.items || []).map(adaptOdaToCard);
        tot = res.total || 0;
      } else if (srcConfig.api === 'proc') {
        // Mua sắm công / đấu thầu (bảng procurement_items).
        const res = await odaService.getProcurement({
          page: p, size: PAGE_SIZE, ...(q ? { q } : {}),
        });
        items = (res.items || []).map(adaptProcToCard);
        tot = res.total || 0;
      } else {
        // Tin bài (bảng articles).
        const params = { page: p, size: PAGE_SIZE, sort: sortBy, only_my_keywords: onlyMyKw };
        if (q)              params.q           = q;
        if (srcConfig.type) params.source_type = srcConfig.type;
        if (dateFrom)       params.date_from   = dateFrom;
        if (dateTo)         params.date_to     = dateTo;
        const res = await articlesService.getArticles(params);
        items = res.items || [];
        tot = res.total || 0;
      }

      setArticles(items);
      setTotal(tot);
    } catch (e) {
      console.warn('NewsPage fetch error:', e);
      setArticles([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, srcConfig, dateFrom, dateTo, onlyMyKw]);

  // Fetch bookmarks khi lọc "Bài đã lưu"
  useEffect(() => {
    if (onlyBookmarked) {
      setLoadingBookmarks(true);
      articlesService.getBookmarks()
        .then((bms) => {
          const mapped = (bms || []).map((bm) => ({
            id: bm.article_id,
            title: bm.article_title || `Bài viết #${bm.article_id}`,
            url: bm.article_url,
            image_url: bm.article_image_url || bm.image_url,
            sources: bm.source_name ? [{ source_name: bm.source_name }] : [],
            source: bm.source_type || (bm.source_name?.toLowerCase().includes('thầu') ? 'gov' : 'press'),
            excerpt: bm.excerpt,
            published_at: bm.published_at || bm.created_at,
            matched_keywords: bm.matched_keywords || [],
            is_bookmarked: true,
          }));
          setBookmarkedArticles(mapped);
        })
        .catch(() => setBookmarkedArticles([]))
        .finally(() => setLoadingBookmarks(false));
    }
  }, [onlyBookmarked]);

  const queryQ = searchParams.get('q') || '';

  // Synchronize + fetch when source or query parameter changes
  useEffect(() => {
    setPage(1);
    setSearchInput(queryQ);
    setSearch(queryQ);
    setOnlyBookmarked(false);
    fetchArticles(1, queryQ);
  }, [source, queryQ]);

  // Fetch when page changes & listen for global background crawl finish event
  useEffect(() => {
    fetchArticles(page);

    const onDataUpdated = () => {
      fetchArticles(page);
    };
    window.addEventListener('bis:data_updated', onDataUpdated);
    return () => window.removeEventListener('bis:data_updated', onDataUpdated);
  }, [page]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const q = searchInput.trim();
    setSearch(q);
    setPage(1);
    fetchArticles(1, q);
    if (q) {
      nav(`/news/${source}?q=${encodeURIComponent(q)}`);
    } else {
      nav(`/news/${source}`);
    }
  };

  const handleReset = () => {
    setSearchInput('');
    setSearch('');
    setSortBy('newest');
    setDateFrom('');
    setDateTo('');
    setOnlyMyKw(false);
    setOnlyBookmarked(false);
    setPage(1);
    fetchArticles(1, '');
    nav(`/news/${source}`);
  };

  const handlePageChange = (p) => {
    setPage(p);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dữ liệu bài viết và tổng số bài tương ứng với chế độ lọc
  const displayedArticles = onlyBookmarked ? bookmarkedArticles : articles;
  const effectiveTotal = onlyBookmarked ? bookmarkedArticles.length : total;
  const isPageLoading = onlyBookmarked ? loadingBookmarks : loading;
  const bookmarkedCount = onlyBookmarked
    ? bookmarkedArticles.length
    : articles.filter(a => a.is_bookmarked).length;

  return (
    <div style={{
      display: 'flex',
      gap: 20,
      alignItems: 'stretch',
      height: 'calc(100vh - var(--header-h) - 48px)',
      overflow: 'hidden',
    }}>
      {/* ── Filter sidebar (Đồng bộ UI gọn gàng theo dung lượng nội dung) ── */}
      <div style={{
        width: 280,
        flexShrink: 0,
        alignSelf: 'flex-start',
        maxHeight: '100%',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 14,
        padding: 14,
        display: 'flex', flexDirection: 'column',
        gap: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        overflowY: 'auto',
      }}>
        {/* Header với nút Đặt lại góc trên phải */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} color="var(--brand-500)" />
            {srcConfig.api === 'oda' ? 'Bộ Lọc Dự Án' : srcConfig.api === 'proc' ? 'Bộ Lọc Đấu Thầu' : 'Bộ Lọc Tin Tức'}
          </div>
          <button
            className="btn btn-ghost btn-xs"
            onClick={handleReset}
            style={{ gap: 4, fontSize: 11, color: 'var(--text-muted)', padding: '2px 6px' }}
            id="btn-reset-filters"
          >
            <RotateCcw size={11} /> Đặt lại
          </button>
        </div>

        {/* Nút lọc "Bài đã lưu" / "Dự án đã lưu" */}
        <button
          onClick={() => setOnlyBookmarked(v => !v)}
          id="btn-filter-bookmarked"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '9px 12px',
            borderRadius: 8,
            border: onlyBookmarked ? 'none' : '1px solid var(--border)',
            background: onlyBookmarked
              ? 'linear-gradient(135deg, var(--brand-600), #2563eb)'
              : 'var(--bg-surface-2)',
            color: onlyBookmarked ? 'white' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: 12,
            cursor: 'pointer',
            width: '100%',
            boxShadow: onlyBookmarked ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          {onlyBookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          {onlyBookmarked
            ? (srcConfig.api === 'oda' ? 'Đang hiện: Dự án đã lưu' : 'Đang hiện: Bài đã lưu')
            : (srcConfig.api === 'oda' ? 'Chỉ dự án đã lưu' : 'Chỉ bài đã lưu')}
          {bookmarkedCount > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 10,
              background: onlyBookmarked ? 'rgba(255,255,255,0.25)' : 'var(--brand-100)',
              color: onlyBookmarked ? 'white' : 'var(--brand-700)',
            }}>
              {bookmarkedCount}
            </span>
          )}
        </button>

        {/* Ô tìm kiếm + Nút Tìm kiếm hàng ngang */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              id="input-news-search"
              type="text"
              className="form-input"
              style={{ paddingLeft: 30, paddingRight: searchInput ? 26 : 10, fontSize: 12, height: 36, width: '100%' }}
              placeholder="Tìm Tên, ID, Từ khóa..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleSearch(e);
                }
              }}
            />
            {searchInput && (
              <X
                size={13}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setPage(1);
                  fetchArticles(1, '');
                }}
              />
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            style={{
              height: 36,
              padding: '0 12px',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              whiteSpace: 'nowrap',
              borderRadius: 8,
            }}
            title="Bấm để tìm kiếm"
          >
            <Search size={13} />
            Tìm kiếm
          </button>
        </form>

        {/* Dropdown Sắp xếp */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Sắp xếp:</label>
          <select
            className="form-input"
            style={{ minHeight: 38, padding: '6px 10px', fontSize: 12, lineHeight: 1.4 }}
            value={sortBy}
            onChange={e => { setSortBy(e.target.value); setPage(1); }}
          >
            <option value="newest">Mới nhất</option>
            <option value="match_count">Khớp nhiều nhất</option>
          </select>
        </div>

        {/* Khoảng thời gian */}
        <div style={{ paddingTop: 8, borderTop: '1px dashed var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Khoảng Thời Gian:</span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input
                type="date"
                className="form-input"
                style={{ fontSize: 11, padding: '3px 6px', minHeight: 32, flex: 1 }}
                value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>-</span>
              <input
                type="date"
                className="form-input"
                style={{ fontSize: 11, padding: '3px 6px', minHeight: 32, flex: 1 }}
                value={dateTo}
                onChange={e => { setDateTo(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </div>

        {/* Checkbox Chỉ từ khóa của tôi */}
        {srcConfig.api === 'articles' && (
          <div style={{ paddingTop: 4 }}>
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
        )}
      </div>

      {/* ── Main content (Phần khung bên ngoài cố định) ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Header & Breadcrumb (Cố định phía trên) */}
        <div style={{ flexShrink: 0, marginBottom: 10 }}>
          <div className="section-header" style={{ marginBottom: 8 }}>
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

              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  if (onlyBookmarked) {
                    setLoadingBookmarks(true);
                    articlesService.getBookmarks()
                      .then((bms) => {
                        const mapped = (bms || []).map((bm) => ({
                          id: bm.article_id,
                          title: bm.article_title || `Bài viết #${bm.article_id}`,
                          url: bm.article_url,
                          image_url: bm.article_image_url || bm.image_url,
                          sources: bm.source_name ? [{ source_name: bm.source_name }] : [],
                          source: bm.source_type || (bm.source_name?.toLowerCase().includes('thầu') ? 'gov' : 'press'),
                          excerpt: bm.excerpt,
                          published_at: bm.published_at || bm.created_at,
                          matched_keywords: bm.matched_keywords || [],
                          is_bookmarked: true,
                        }));
                        setBookmarkedArticles(mapped);
                      })
                      .catch(() => {})
                      .finally(() => setLoadingBookmarks(false));
                  } else {
                    setPage(1);
                    fetchArticles(1);
                  }
                }}
                id="btn-news-refresh"
                style={{ gap: 5 }}
              >
                {isPageLoading ? <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> : <RotateCcw size={13} />}
                Làm mới
              </button>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="breadcrumb">
            <a onClick={() => nav('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</a>
            <ChevronRight size={12} className="breadcrumb-sep" />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{srcConfig.label}</span>
          </div>
        </div>

        {/* ── CHỈ PHẦN NÀY ĐƯỢC PHÉP SCROLL (Khung danh sách thẻ tin) ── */}
        <div
          ref={scrollContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: 6,
            paddingBottom: 16,
          }}
        >
          <div className="news-grid news-page-grid">
            {isPageLoading
              ? Array.from({ length: PAGE_SIZE }, (_, i) => <SkeletonCard key={i} />)
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

          {!isPageLoading && (
            <Pagination
              page={onlyBookmarked ? 1 : page}
              total={effectiveTotal}
              pageSize={PAGE_SIZE}
              onChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
