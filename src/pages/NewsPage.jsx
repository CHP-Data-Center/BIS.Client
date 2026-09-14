import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import {
  Search, Filter, ChevronRight, ChevronDown, ChevronUp, Bookmark, BookmarkCheck,
  RotateCcw, ChevronLeft, Loader2, Building2, Globe, ShoppingBag,
  Newspaper, FileText, X, LayoutGrid, List, Cpu, ExternalLink, Tag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { articlesService } from '../services/articles';
import { keywordsService } from '../services/keywords';
import { odaService } from '../services/oda';
import { adaptOdaToCard, adaptProcToCard } from '../adapters/oda';
import NewsCard from '../components/NewsCard';
import WorldBankView from '../components/WorldBankView';
import { getSourceStyle } from '../utils/sourceStyle';
import { tUI } from '../locales';

const PAGE_SIZE = 12;

// Ánh xạ URL param -> nguồn. api: 'articles' (tin bài) | 'oda' (ADB/WB) | 'proc' (đấu thầu).
// ADB/WB nằm ở bảng oda_projects, đấu thầu ở procurement_items — KHÔNG phải /articles.
const SOURCE_MAP = {
  all:       { labelKey: 'nav.press', label: tUI('ui.tin-tuc-bao-chi'), api: 'articles', type: 'press', icon: <Newspaper size={18} style={{ color: '#3b82f6' }} /> },
  press:     { labelKey: 'nav.press', label: tUI('ui.tin-tuc-bao-chi'), api: 'articles', type: 'press', icon: <Newspaper size={18} style={{ color: '#3b82f6' }} /> },
  tintuc:    { labelKey: 'nav.press', label: tUI('ui.tin-tuc-bao-chi'), api: 'articles', type: 'press', icon: <Newspaper size={18} style={{ color: '#3b82f6' }} /> },
  adb:       { labelKey: 'nav.adbProjects', label: tUI('ui.du-an-adb-chau-a-2'), api: 'oda', odaSource: 'adb', kind: 'project', icon: <Building2 size={18} style={{ color: '#f59e0b' }} /> },
  'adb-tenders': { labelKey: 'nav.adbTenders', label: tUI('ui.thong-bao-moi-thau-adb'), api: 'oda', odaSource: 'adb', kind: 'notice', icon: <ShoppingBag size={18} style={{ color: '#f59e0b' }} /> },
  worldbank: { labelKey: 'nav.worldbank', label: tUI('ui.du-an-world-bank-2'), api: 'oda', odaSource: 'worldbank', icon: <Globe size={18} style={{ color: '#10b981' }} /> },
  gov:       { labelKey: 'nav.procGroup', label: tUI('ui.mua-sam-cong-dau-thau'), api: 'proc', icon: <ShoppingBag size={18} style={{ color: '#8b5cf6' }} /> },
  dauthau:   { labelKey: 'nav.procGroup', label: tUI('ui.mua-sam-cong-quoc-gia'), api: 'proc', icon: <ShoppingBag size={18} style={{ color: '#8b5cf6' }} /> },
  // Tách 2 trang riêng, cùng khu vực "Đấu Thầu Công" (kind lọc notice/plan).
  tbmt:      { labelKey: 'nav.tbmt', label: tUI('ui.thong-bao-moi-thau-tbmt'), api: 'proc', kind: 'notice', icon: <ShoppingBag size={18} style={{ color: '#8b5cf6' }} /> },
  khlcnt:    { labelKey: 'nav.khlcnt', label: tUI('ui.ke-hoach-lua-chon-nha-thau-khlcnt'), api: 'proc', kind: 'plan', icon: <FileText size={18} style={{ color: '#8b5cf6' }} /> },
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

function CompactSkeleton() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 16px', borderRadius: 10,
      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      marginBottom: 8
    }}>
      <div className="skeleton" style={{ width: 75, height: 22, borderRadius: 6, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="skeleton" style={{ width: '60%', height: 16, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: '90%', height: 12, borderRadius: 4 }} />
      </div>
      <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0 }} />
    </div>
  );
}

function CompactNewsRow({ article, index }) {
  const nav = useNavigate();
  const { lang, t } = useLang();
  const [bookmarked, setBookmarked] = useState(article.is_bookmarked || false);
  const [bkLoading, setBkLoading] = useState(false);

  const src = getSourceStyle(article);
  const dateLocale = lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'vi-VN';
  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit', year: 'numeric' })
    : article.date
      ? new Date(article.date).toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit', year: 'numeric' })
      : null;

  const titleText = article.titleVi || article.title;
  const excerptText = article.excerptVi || article.excerpt;

  const handleClick = () => {
    const isWbOrAdb = article.source === 'worldbank' || article.source === 'adb' || article.source_type === 'worldbank' || article.source_type === 'adb' || article.local_key === 'saved_worldbank_projects' || article.local_key === 'saved_adb_projects';
    if (isWbOrAdb) {
      const targetId = article.original_id || article.project_code || article.id;
      nav(`/worldbank/project/${targetId}`, { state: { project: article } });
    } else {
      nav(`/article/${article.id}`, { state: { article } });
    }
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    if (bkLoading) return;
    setBkLoading(true);
    try {
      if (bookmarked) {
        if (typeof article.id === 'number') await articlesService.removeBookmark(article.id);
        setBookmarked(false);
      } else {
        if (typeof article.id === 'number') await articlesService.addBookmark(article.id);
        setBookmarked(true);
      }
    } catch (err) {
      console.warn('Bookmark err:', err);
    } finally {
      setBkLoading(false);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="compact-news-row"
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 18px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        marginBottom: 8,
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        animation: 'fadeIn 0.25s ease-out forwards',
        animationDelay: `${Math.min(index * 35, 300)}ms`
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--brand-400, #3b82f6)';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Source tag & Date */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 110, flexShrink: 0 }}>
        <span
          className="news-source-tag"
          style={{
            background: src.bg,
            color: src.color,
            border: `1px solid ${src.border}`,
            fontSize: 10,
            padding: '2px 7px',
            width: 'fit-content'
          }}
        >
          {src.icon} {src.name}
        </span>
        {publishedDate && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
            {publishedDate}
          </span>
        )}
      </div>

      {/* Title & Short Excerpt */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h4 style={{
            fontSize: 13.5, fontWeight: 700, margin: 0, color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            lineHeight: 1.4
          }}>
            {titleText}
          </h4>
          {article.is_read && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', flexShrink: 0 }}>
              ✓ {t('common.readStatus')}
            </span>
          )}
        </div>

        {excerptText && (
          <p style={{
            fontSize: 12, color: 'var(--text-secondary)', margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            lineHeight: 1.4
          }}>
            {excerptText}
          </p>
        )}
      </div>

      {/* Keywords / AI badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {article.aiSummary && (
          <span className="ai-badge" style={{ fontSize: 10, padding: '2px 7px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Cpu size={10} /> AI
          </span>
        )}
        {article.matched_keywords?.slice(0, 2).map(kw => (
          <span
            key={kw}
            style={{
              fontSize: 10.5, fontWeight: 600, color: 'var(--brand-700)',
              background: 'var(--brand-50, #eff6ff)',
              padding: '2px 7px', borderRadius: 6,
              border: '1px solid var(--brand-200, #bfdbfe)'
            }}
          >
            #{kw}
          </span>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <button
          onClick={handleBookmark}
          disabled={bkLoading}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 6, borderRadius: 6, color: bookmarked ? '#f59e0b' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s'
          }}
          title={bookmarked ? 'Bỏ lưu' : 'Lưu bài viết'}
        >
          {bookmarked ? <BookmarkCheck size={16} fill="#f59e0b" /> : <Bookmark size={16} />}
        </button>

        {article.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--text-muted)', padding: 6, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none'
            }}
            title="Xem bài gốc"
          >
            <ExternalLink size={14} />
          </a>
        )}
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
        title={tUI('ui.trang-truoc')}
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
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isPersonalUser, hasSourceAccess } = useAuth();
  const scrollContainerRef = useRef(null);
  const tagContainerRef = useRef(null);
  const [canExpand, setCanExpand] = useState(false);

  if (source !== 'all' && source !== 'press' && !hasSourceAccess(source)) {
    return <Navigate to="/upgrade" replace />;
  }

  const [loading, setLoading]                 = useState(true);
  const [articles, setArticles]               = useState([]);
  const [total, setTotal]                     = useState(0);
  const [page, setPage]                       = useState(1);
  const [onlyBookmarked, setOnlyBookmarked]   = useState(false);
  const [bookmarkedArticles, setBookmarkedArticles] = useState([]);
  const [loadingBookmarks, setLoadingBookmarks]     = useState(false);
  const [viewMode, setViewMode]               = useState(() => {
    return localStorage.getItem('bis_news_view_mode') || 'grid';
  });

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('bis_news_view_mode', mode);
  };

  // Filters
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [search, setSearch]           = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy]           = useState('newest');
  const [dateFrom, setDateFrom]       = useState(searchParams.get('from') || '');
  const [dateTo, setDateTo]           = useState(searchParams.get('to') || '');
  const [onlyMyKw, setOnlyMyKw]       = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState(searchParams.get('source_id') || '');
  const [availableSources, setAvailableSources] = useState([]);
  const [loadingSources, setLoadingSources]     = useState(false);
  const [userKeywords, setUserKeywords]         = useState([]);
  const [kwExpanded, setKwExpanded]             = useState(false);
  // Ngôn ngữ TOÀN CỤC (header 🌐): đổi là menu + nhãn + nội dung tin đổi theo.
  const { lang, setLang, t } = useLang();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const srcConfig = SOURCE_MAP[source] || SOURCE_MAP.all;

  // Lấy danh sách từ khóa đã lưu của người dùng
  useEffect(() => {
    let isMounted = true;
    keywordsService.getKeywords()
      .then(res => {
        if (isMounted && Array.isArray(res)) {
          setUserKeywords(res);
        }
      })
      .catch(err => console.warn('Failed to load user keywords:', err));
    return () => { isMounted = false; };
  }, [lang, user?.id]);

  useEffect(() => {
    if (tagContainerRef.current) {
      setCanExpand(tagContainerRef.current.scrollHeight > 56);
    }
  }, [userKeywords, kwExpanded]);

  // Lấy danh sách nguồn báo chí khi ở mục tin bài
  useEffect(() => {
    if (srcConfig.api !== 'articles') return;
    let isMounted = true;
    setLoadingSources(true);
    articlesService.getSources(srcConfig.type ? { source_type: srcConfig.type } : {})
      .then(res => {
        if (isMounted) setAvailableSources(res || []);
      })
      .catch(err => console.warn('Failed to load sources list:', err))
      .finally(() => {
        if (isMounted) setLoadingSources(false);
      });
    return () => { isMounted = false; };
  }, [srcConfig.api, srcConfig.type]);

  const filtersRef = useRef({ page: 1, search: '', sortBy: 'newest', dateFrom: '', dateTo: '', onlyMyKw: false, selectedSourceId: '', lang: 'vi' });
  useEffect(() => {
    filtersRef.current = { page, search, sortBy, dateFrom, dateTo, onlyMyKw, selectedSourceId, lang };
  });

  const updateQueryParams = useCallback((newQ, newFrom, newTo, newSourceId) => {
    const p = new URLSearchParams();
    if (newQ) p.set('q', newQ);
    if (newFrom) p.set('from', newFrom);
    if (newTo) p.set('to', newTo);
    const sid = newSourceId !== undefined ? newSourceId : selectedSourceId;
    if (sid) p.set('source_id', sid);
    const qs = p.toString();
    nav(`/news/${source}${qs ? `?${qs}` : ''}`, { replace: true });
  }, [nav, source, selectedSourceId]);

  const fetchArticles = useCallback(async (p = 1, overrideSearch = null, force = false, overrideFilters = null) => {
    setLoading(true);
    try {
      const q = (overrideSearch !== null ? overrideSearch : search).trim();
      const from = overrideFilters && overrideFilters.from !== undefined ? overrideFilters.from : dateFrom;
      const to = overrideFilters && overrideFilters.to !== undefined ? overrideFilters.to : dateTo;
      const sid = overrideFilters && overrideFilters.sourceId !== undefined ? overrideFilters.sourceId : selectedSourceId;

      if (from && to && from > to) {
        setLoading(false);
        return;
      }

      let items = [];
      let tot = 0;

      if (srcConfig.api === 'oda') {
        // Dự án ADB / World Bank (bảng oda_projects).
        const res = await odaService.getProjects({
          source: srcConfig.odaSource, page: p, size: PAGE_SIZE,
          ...(srcConfig.kind ? { kind: srcConfig.kind } : {}), ...(q ? { q } : {}),
          ...(from ? { date_from: from } : {}),
          ...(to ? { date_to: to } : {}),
        });
        items = (res.items || []).map(adaptOdaToCard);
        tot = res.total || 0;
      } else if (srcConfig.api === 'proc') {
        // Mua sắm công / đấu thầu (bảng procurement_items).
        const res = await odaService.getProcurement({
          page: p, size: PAGE_SIZE, ...(srcConfig.kind ? { kind: srcConfig.kind } : {}), ...(q ? { q } : {}),
          ...(from ? { date_from: from } : {}),
          ...(to ? { date_to: to } : {}),
        });
        items = (res.items || []).map(adaptProcToCard);
        tot = res.total || 0;
      } else {
        // Tin bài (bảng articles).
        const params = { page: p, size: PAGE_SIZE, sort: sortBy, only_my_keywords: onlyMyKw };
        if (q)              params.q           = q;
        if (srcConfig.type) params.source_type = srcConfig.type;
        if (sid)            params.source_id   = Number(sid);
        if (from)           params.date_from   = from;
        if (to)             params.date_to     = to;
        if (lang !== 'vi')  params.lang        = lang; // bài có bản dịch hiện EN/JA
        const res = await articlesService.getArticles(params, force);
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
  }, [search, sortBy, srcConfig, dateFrom, dateTo, onlyMyKw, selectedSourceId, lang]);

  const fetchBookmarks = useCallback(async () => {
    setLoadingBookmarks(true);
    try {
      const bms = await articlesService.getBookmarks();
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
    } catch {
      setBookmarkedArticles([]);
    } finally {
      setLoadingBookmarks(false);
    }
  }, []);

  // Synchronize search inputs and date filters when URL search params change
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const sid = searchParams.get('source_id') || '';
    setSearchInput(q);
    setSearch(q);
    setDateFrom(from);
    setDateTo(to);
    setSelectedSourceId(sid);
    setOnlyBookmarked(false);
    setPage(1);
  }, [source, searchParams]);

  // Main data fetch effect: triggers when source, search, page, sort, or date filters change
  useEffect(() => {
    if (dateFrom && dateTo && dateFrom > dateTo) return;
    fetchArticles(page);
  }, [source, search, page, sortBy, selectedSourceId, dateFrom, dateTo, onlyMyKw, lang, fetchArticles]);

  // Bookmarks & background update event listener
  useEffect(() => {
    fetchBookmarks();

    const onDataUpdated = () => {
      const f = filtersRef.current;
      fetchArticles(f.page, f.search, true, { from: f.dateFrom, to: f.dateTo, sourceId: f.selectedSourceId });
      fetchBookmarks(true);
    };
    window.addEventListener('bis:data_updated', onDataUpdated);
    return () => window.removeEventListener('bis:data_updated', onDataUpdated);
  }, [fetchBookmarks, fetchArticles]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const q = searchInput.trim();
    setSearch(q);
    setPage(1);
    updateQueryParams(q, dateFrom, dateTo, selectedSourceId);
    fetchArticles(1, q, true, { from: dateFrom, to: dateTo, sourceId: selectedSourceId });
  };

  const handleApplyDateRange = (fVal = dateFrom, tVal = dateTo) => {
    if (fVal && tVal && fVal > tVal) return;
    setDateFrom(fVal);
    setDateTo(tVal);
    setPage(1);
    updateQueryParams(search, fVal, tVal, selectedSourceId);
    fetchArticles(1, search, true, { from: fVal, to: tVal, sourceId: selectedSourceId });
  };

  const getActivePreset = () => {
    if (!dateFrom && !dateTo) return null;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (dateFrom === todayStr && dateTo === todayStr) return 'today';
    const d7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    if (dateFrom === d7 && dateTo === todayStr) return '7d';
    const d30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    if (dateFrom === d30 && dateTo === todayStr) return '30d';
    const mStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    if (dateFrom === mStart && dateTo === todayStr) return 'month';
    return null;
  };
  const activePreset = getActivePreset();

  const handlePresetDate = (type) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    let f = '';
    let t = todayStr;
    if (type === 'today') {
      f = todayStr;
    } else if (type === '7d') {
      f = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    } else if (type === '30d') {
      f = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    } else if (type === 'month') {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      f = `${y}-${m}-01`;
    } else if (type === 'all') {
      f = '';
      t = '';
    }
    handleApplyDateRange(f, t);
  };

  const handleReset = () => {
    setSearchInput('');
    setSearch('');
    setSortBy('newest');
    setDateFrom('');
    setDateTo('');
    setSelectedSourceId('');
    setOnlyMyKw(false);
    setOnlyBookmarked(false);
    setPage(1);
    updateQueryParams('', '', '', '');
    fetchArticles(1, '', true, { from: '', to: '', sourceId: '' });
  };

  const handlePageChange = (p) => {
    setPage(p);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dữ liệu bài viết và tổng số bài tương ứng với chế độ lọc
  const displayedArticles = onlyBookmarked ? bookmarkedArticles : articles;
  const effectiveTotal = onlyBookmarked ? bookmarkedArticles.length : total;
  const isPageLoading = onlyBookmarked ? loadingBookmarks : loading;
  const bookmarkedCount = bookmarkedArticles.length;

  if (source === 'worldbank') {
    return <WorldBankView type="worldbank" />;
  }
  // ADB tách 2 trang như Đấu Thầu Công: dự án vs thông báo mời thầu.
  if (source === 'adb') {
    return <WorldBankView type="adb" kind="project" />;
  }
  if (source === 'adb-tenders') {
    return <WorldBankView type="adb" kind="notice" />;
  }
  if (source === 'tbmt') {
    return <WorldBankView type="procurement" kind="notice" />;
  }
  if (source === 'khlcnt') {
    return <WorldBankView type="procurement" kind="plan" />;
  }
  if (source === 'gov' || source === 'dauthau') {
    return <WorldBankView type="procurement" />;
  }

  return (
    <div className="news-page-container">
      {/* Nút ẩn/hiện Bộ Lọc cho Mobile */}
      <button
        className="news-mobile-filter-btn"
        onClick={() => setMobileFilterOpen(v => !v)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} color="var(--brand-500)" />
          <span>{srcConfig.api === 'oda' ? 'Bộ Lọc Dự Án' : srcConfig.api === 'proc' ? 'Bộ Lọc Đấu Thầu' : 'Bộ Lọc Tin Tức'}</span>
          {(search || dateFrom || dateTo || onlyMyKw || onlyBookmarked) && (
            <span className="filter-active-dot" title={tUI('ui.dang-ap-dung-bo-loc')} />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {mobileFilterOpen ? 'Thu gọn' : 'Mở bộ lọc'}
          </span>
          <ChevronDown
            size={16}
            style={{
              transform: mobileFilterOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </div>
      </button>



      {/* ── Filter sidebar (Đồng bộ UI gọn gàng theo dung lượng nội dung) ── */}
      <div className={`news-filter-sidebar ${mobileFilterOpen ? 'mobile-open' : ''}`}>
        {/* Header với nút Đặt lại góc trên phải */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} color="var(--brand-500)" />
            {t('filter.title')}
          </div>
          <button
            className="btn btn-ghost btn-xs"
            onClick={handleReset}
            style={{ gap: 4, fontSize: 11, color: 'var(--text-muted)', padding: '2px 6px' }}
            id="btn-reset-filters"
          >
            <RotateCcw size={11} /> {t('news.reset')}
          </button>
        </div>

        {/* Nút lọc "Bài đã lưu" / "Dự án đã lưu" */}
        <button
          onClick={() => {
            setOnlyBookmarked(v => !v);
            fetchBookmarks();
          }}
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
            ? `${t('news.saved')}`
            : `${t('filter.savedOnly')}`}
          <span style={{
            fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 10,
            background: onlyBookmarked ? 'rgba(255,255,255,0.25)' : '#dbeafe',
            color: onlyBookmarked ? 'white' : '#1d4ed8',
            marginLeft: 2,
          }}>
            {bookmarkedCount}
          </span>
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
              placeholder={t('news.searchPlaceholder')}
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
            title={t('common.search')}
          >
            <Search size={13} />
            {t('common.search')}
          </button>
        </form>

        {/* Danh sách từ khóa đã lưu của người dùng (giới hạn 2 dòng, có mở rộng) */}
        {(() => {
          const defaultKws = ['cầu', 'cao tốc', 'đường sắt', 'đấu thầu', 'ODA'];
          const activeKws = userKeywords.length > 0
            ? [...new Set(userKeywords.map(k => k.display_term || k.term).filter(Boolean))]
            : defaultKws;
          if (!activeKws.length) return null;

          return (
            <div style={{ marginTop: -2 }}>
              <div
                ref={tagContainerRef}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 4,
                  maxHeight: kwExpanded ? 240 : 54,
                  overflowY: kwExpanded ? 'auto' : 'hidden',
                  transition: 'max-height 0.25s ease',
                  paddingBottom: 2,
                }}
              >
                {activeKws.map((kw) => {
                  const tagText = kw.startsWith('#') ? kw : `#${kw}`;
                  const rawTerm = kw.replace(/^#/, '').toLowerCase();
                  const curSearch = (search || '').trim().toLowerCase();
                  const isActive =
                    curSearch === tagText.toLowerCase() ||
                    curSearch === rawTerm ||
                    curSearch === `#${rawTerm}`;

                  return (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => {
                        if (isActive) {
                          setSearchInput('');
                          setSearch('');
                          setPage(1);
                          fetchArticles(1, '');
                          updateQueryParams('', dateFrom, dateTo);
                        } else {
                          setSearchInput(tagText);
                          setSearch(tagText);
                          setPage(1);
                          fetchArticles(1, tagText);
                          updateQueryParams(tagText, dateFrom, dateTo);
                        }
                      }}
                      style={{
                        fontSize: 11,
                        padding: '2.5px 8px',
                        height: 24,
                        borderRadius: 12,
                        border: isActive ? '1px solid #2563eb' : '1px solid var(--border-subtle)',
                        background: isActive
                          ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                          : 'var(--bg-surface-2)',
                        color: isActive ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontWeight: isActive ? 700 : 500,
                        transition: 'all 0.15s ease',
                        boxShadow: isActive ? '0 1px 4px rgba(37, 99, 235, 0.3)' : 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        whiteSpace: 'nowrap',
                      }}
                      title={`Lọc theo từ khóa ${tagText}`}
                    >
                      {tagText}
                    </button>
                  );
                })}
              </div>

              {(activeKws.length > 5 || canExpand) && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 3 }}>
                  <button
                    type="button"
                    onClick={() => setKwExpanded((v) => !v)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 10.5,
                      color: 'var(--brand-600, #2563eb)',
                      cursor: 'pointer',
                      padding: '1px 4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 2,
                      fontWeight: 600,
                    }}
                  >
                    {kwExpanded ? (
                      <>
                        Thu gọn <ChevronUp size={12} />
                      </>
                    ) : (
                      <>
                        Xem thêm ({activeKws.length}) <ChevronDown size={12} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Dropdown Lựa chọn Nguồn (khi xem báo chí) */}
        {srcConfig.api === 'articles' && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
              {t('news.source')}
            </label>
            <select
              id="select-news-source"
              className="form-input"
              style={{ minHeight: 38, padding: '6px 10px', fontSize: 12, lineHeight: 1.4 }}
              value={selectedSourceId}
              onChange={e => {
                const val = e.target.value;
                setSelectedSourceId(val);
                setPage(1);
                updateQueryParams(search, dateFrom, dateTo, val);
                fetchArticles(1, search, true, { from: dateFrom, to: dateTo, sourceId: val });
              }}
              disabled={loadingSources}
            >
              <option value="">{t('news.allSources')}</option>
              {availableSources.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Dropdown Sắp xếp */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>{t('news.sort')}</label>
          <select
            className="form-input"
            style={{ minHeight: 38, padding: '6px 10px', fontSize: 12, lineHeight: 1.4 }}
            value={sortBy}
            onChange={e => { setSortBy(e.target.value); setPage(1); }}
          >
            <option value="newest">{t('news.sortNewest')}</option>
            <option value="match_count">{t('news.sortMatch')}</option>
          </select>
        </div>

        {/* Khoảng thời gian */}
        <div style={{ paddingTop: 8, borderTop: '1px dashed var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {t('news.dateRange')}:
              </span>
              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => handlePresetDate('all')}
                  style={{ background: 'none', border: 'none', fontSize: 10, color: '#ef4444', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                >
                  Xóa lọc
                </button>
              )}
            </div>

            {/* Phím tắt chọn nhanh */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
              {[
                { label: 'Hôm nay', type: 'today' },
                { label: '7 ngày qua', type: '7d' },
                { label: '30 ngày qua', type: '30d' },
                { label: 'Tháng này', type: 'month' },
              ].map((p) => {
                const isActive = activePreset === p.type;
                return (
                  <button
                    key={p.type}
                    type="button"
                    onClick={() => handlePresetDate(p.type)}
                    style={{
                      padding: '5px 6px',
                      fontSize: 11,
                      borderRadius: 6,
                      border: isActive ? '1px solid var(--brand-500)' : '1px solid var(--border-subtle)',
                      background: isActive ? 'var(--brand-50, #eff6ff)' : 'var(--bg-surface-2)',
                      color: isActive ? 'var(--brand-600, #2563eb)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                      fontWeight: isActive ? 700 : 500,
                      boxShadow: isActive ? '0 1px 3px rgba(37, 99, 235, 0.15)' : 'none',
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* 2 ô nhập ngày tùy chỉnh (tự động áp dụng ngay khi chọn) */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input
                type="date"
                min="2000-01-01"
                max="2099-12-31"
                className="form-input"
                style={{ fontSize: 11, padding: '3px 6px', minHeight: 32, flex: 1, ...(dateFrom && dateTo && dateFrom > dateTo ? { borderColor: '#ef4444' } : {}) }}
                value={dateFrom}
                onChange={e => {
                  const val = e.target.value;
                  const y = val.split('-')[0];
                  if (y && y.length > 4) return;
                  handleApplyDateRange(val, dateTo);
                }}
              />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>-</span>
              <input
                type="date"
                min="2000-01-01"
                max="2099-12-31"
                className="form-input"
                style={{ fontSize: 11, padding: '3px 6px', minHeight: 32, flex: 1, ...(dateFrom && dateTo && dateFrom > dateTo ? { borderColor: '#ef4444' } : {}) }}
                value={dateTo}
                onChange={e => {
                  const val = e.target.value;
                  const y = val.split('-')[0];
                  if (y && y.length > 4) return;
                  handleApplyDateRange(dateFrom, val);
                }}
              />
            </div>

            {dateFrom && dateTo && dateFrom > dateTo && (
              <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, display: 'block', marginTop: 4 }}>
                ⚠️ Ngày bắt đầu không được sau ngày kết thúc
              </span>
            )}
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
              {t('news.onlyMyKw')}
            </label>
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <div className="news-main-content">
        {/* Header & Breadcrumb */}
        <div style={{ flexShrink: 0, marginBottom: 10 }}>
          <div className="section-header" style={{ marginBottom: 8 }}>
            <div className="section-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {srcConfig.icon}
                {t(srcConfig.labelKey || 'nav.press')}
              </span>

              <span style={{
                fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
                padding: '2px 8px', background: 'var(--bg-surface-2)',
                borderRadius: 'var(--radius-full)', border: '1px solid var(--border)',
              }}>
                {isPageLoading ? '...' : effectiveTotal} {t('news.articlesCount')}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* View Mode Switcher: Lưới thẻ vs Dòng tinh gọn */}
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'var(--bg-surface-2)',
                padding: '2px', borderRadius: 8,
                border: '1px solid var(--border)'
              }}>
                <button
                  type="button"
                  onClick={() => handleToggleViewMode('grid')}
                  style={{
                    background: viewMode === 'grid' ? 'var(--bg-surface)' : 'transparent',
                    color: viewMode === 'grid' ? 'var(--brand-600)' : 'var(--text-muted)',
                    border: 'none', borderRadius: 6, padding: '4px 9px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700,
                    boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  title={tUI('ui.grid-view-title', 'Chế độ lưới thẻ (Grid)')}
                >
                  <LayoutGrid size={13} /> {tUI('ui.dang-luoi', 'Dạng lưới')}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleViewMode('compact')}
                  style={{
                    background: viewMode === 'compact' ? 'var(--bg-surface)' : 'transparent',
                    color: viewMode === 'compact' ? 'var(--brand-600)' : 'var(--text-muted)',
                    border: 'none', borderRadius: 6, padding: '4px 9px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700,
                    boxShadow: viewMode === 'compact' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  title={tUI('ui.compact-view-title', 'Chế độ danh sách dòng tinh gọn (Compact List)')}
                >
                  <List size={14} /> {tUI('ui.tinh-gon', 'Tinh gọn')}
                </button>
              </div>

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
                {t('common.refresh')}
              </button>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="breadcrumb">
            <a onClick={() => nav(isPersonalUser ? '/news/press' : '/dashboard')} style={{ cursor: 'pointer' }}>
              {isPersonalUser ? t('nav.home') : t('nav.dashboard')}
            </a>
            <ChevronRight size={12} className="breadcrumb-sep" />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{t(srcConfig.labelKey) || srcConfig.label}</span>
          </div>
        </div>

        {/* ── CHỈ PHẦN NÀY ĐƯỢC PHÉP SCROLL (Khung danh sách thẻ tin) ── */}
        <div
          ref={scrollContainerRef}
          className="news-scroll-area"
        >
          {viewMode === 'compact' ? (
            <div className="news-compact-list" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {isPageLoading
                ? Array.from({ length: PAGE_SIZE }, (_, i) => <CompactSkeleton key={i} />)
                : displayedArticles.length === 0
                  ? (
                    <div className="empty-state" style={{ minHeight: 300 }}>
                      <div className="empty-icon">{onlyBookmarked ? '🔖' : '📭'}</div>
                      <div className="empty-title">
                        {onlyBookmarked ? 'Chưa có bài viết nào được lưu' : 'Không tìm thấy bài viết'}
                      </div>
                      <div className="empty-sub">
                        {onlyBookmarked
                          ? 'Bấm vào biểu tượng bookmark trên dòng bài viết để lưu lại.'
                          : (search ? `Không có kết quả cho "${search}". Thử từ khóa khác.` : 'Hệ thống tự động crawl dữ liệu mới nhất.')}
                      </div>
                      {(search || onlyBookmarked) && (
                        <button className="btn btn-secondary" onClick={handleReset} style={{ marginTop: 12 }}>
                          Xóa bộ lọc
                        </button>
                      )}
                    </div>
                  )
                  : displayedArticles.map((a, i) => <CompactNewsRow key={a.id} article={a} index={i} />)
              }
            </div>
          ) : (
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
          )}

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
