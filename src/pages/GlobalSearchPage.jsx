// src/pages/GlobalSearchPage.jsx
// Tìm kiếm TOÀN CỤC từ ô search header: 1 từ khóa quét CẢ 4 kho đã crawl
// (Báo chí, Mua sắm công TBMT/KHLCNT, World Bank, ADB)
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Newspaper, ShoppingBag, Globe, Building2, Search, ExternalLink,
  ChevronRight, Filter, Layers, ArrowRight, SlidersHorizontal,
  Calendar, RotateCcw, Sparkles, X, Check
} from 'lucide-react';
import { articlesService } from '../services/articles';
import { odaService } from '../services/oda';
import { useLang } from '../context/LanguageContext';
import { tUI } from '../locales';
import ThemePageLoader from '../components/common/ThemePageLoader';

const SECTION_STYLE = {
  press: { icon: Newspaper, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)', to: (q) => `/news/press?q=${encodeURIComponent(q)}` },
  proc: { icon: ShoppingBag, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)', to: (q) => `/news/tbmt?q=${encodeURIComponent(q)}` },
  wb: { icon: Globe, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', to: (q) => `/news/worldbank?q=${encodeURIComponent(q)}` },
  adb: { icon: Building2, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', to: (q) => `/news/adb?q=${encodeURIComponent(q)}` },
};

const SECTORS_LIST = [
  { slug: 'cau', label: { vi: 'Cầu', en: 'Bridges', ja: '橋梁' } },
  { slug: 'duong-bo', label: { vi: 'Đường bộ / Cao tốc', en: 'Roads & Highways', ja: '道路・高速道路' } },
  { slug: 'duong-sat', label: { vi: 'Đường sắt / Metro', en: 'Railways & Metro', ja: '鉄道・地下鉄' } },
  { slug: 'cang-bien', label: { vi: 'Cảng biển', en: 'Seaports', ja: '港湾' } },
  { slug: 'hang-khong', label: { vi: 'Hàng không', en: 'Aviation & Airports', ja: '航空・空港' } },
  { slug: 'nang-luong', label: { vi: 'Năng lượng', en: 'Energy & Power', ja: 'エネルギー' } },
  { slug: 'cap-thoat-nuoc', label: { vi: 'Cấp thoát nước', en: 'Water Supply', ja: '上下水道' } },
  { slug: 'ha-tang-do-thi', label: { vi: 'Hạ tầng đô thị', en: 'Urban Infrastructure', ja: '都市インフラ' } },
];

const QUICK_TAGS = ['#cầu', '#cao tốc', '#đường sắt', '#đấu thầu', '#ODA', '#Hà Nội', '#Lâm Đồng', '#World Bank', '#ADB'];

/** Highlight matching search keywords in text (hỗ trợ nhiều từ khóa riêng lẻ) */
function HighlightedText({ text, query }) {
  if (!text || !query) return <span>{text || ''}</span>;
  const words = String(query)
    .split(/[\s,+#]+/)
    .map(w => w.trim())
    .filter(w => w.length >= 1);
  if (!words.length) return <span>{text || ''}</span>;

  // Sắp xếp từ dài trước từ ngắn để tránh regex ăn mất từ dài
  const sorted = [...words].sort((a, b) => b.length - a.length);
  const pattern = sorted.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');
  const parts = String(text).split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        words.some(w => w.toLowerCase() === part.toLowerCase()) ? (
          <mark
            key={i}
            style={{
              background: 'rgba(234, 179, 8, 0.28)',
              color: 'var(--text-primary)',
              borderRadius: 3,
              padding: '0 3px',
              fontWeight: 800,
              boxShadow: '0 0 8px rgba(234, 179, 8, 0.3)',
            }}
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

function SectionCard({ kind, title, total, toAll, onSelectTab, isGridView, children, t, query }) {
  const meta = SECTION_STYLE[kind];
  const Icon = meta.icon;
  const resultsUnitStr = t('search.resultsCount');

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${meta.border}`,
        borderRadius: 18,
        padding: isGridView ? '16px 18px' : '20px 22px',
        marginBottom: isGridView ? 0 : 20,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        transition: 'all 0.2s ease',
        height: isGridView ? '100%' : 'auto',
        minHeight: isGridView ? 280 : 'auto',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 12,
        paddingBottom: 10,
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: meta.bg,
            border: `1px solid ${meta.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 2px 10px ${meta.color}20`,
            flexShrink: 0,
          }}>
            <Icon size={16} style={{ color: meta.color }} />
          </div>
          <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            <h3 style={{
              fontSize: 14.5,
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {kind === 'adb' && isGridView ? t('search.adb') : kind === 'wb' && isGridView ? t('search.wb') : title}
            </h3>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              color: meta.color,
              background: meta.bg,
              border: `1px solid ${meta.border}`,
              padding: '1px 7px',
              borderRadius: 20,
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}>
              {total} {resultsUnitStr}
            </span>
          </div>
        </div>

        {total > 0 && (
          <button
            type="button"
            onClick={onSelectTab || (() => {})}
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: meta.color,
              background: meta.bg,
              border: `1px solid ${meta.border}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 10,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            <span>{isGridView ? t('search.viewSeparately') : t('search.viewAll')}</span>
            <ChevronRight size={13} />
          </button>
        )}
      </div>

      {total === 0 ? (
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '24px 8px', textAlign: 'center', fontStyle: 'italic', flex: 1 }}>
          {t('search.emptySection')}
        </div>
      ) : (
        <div
          className="custom-modal-scroll"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            flex: 1,
            maxHeight: isGridView ? 240 : 'none',
            overflowY: isGridView ? 'auto' : 'visible',
            paddingRight: isGridView ? 4 : 0,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function ResultRow({ title, sub, excerpt, href, to, query, badgeText, badgeColor, compact = false }) {
  const nav = useNavigate();
  const inner = (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: compact ? 2 : 4 }}>
        {badgeText && (
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            color: badgeColor || '#3b82f6',
            background: `${badgeColor || '#3b82f6'}1a`,
            border: `1px solid ${badgeColor || '#3b82f6'}40`,
            padding: '1px 6px',
            borderRadius: 5,
            flexShrink: 0,
          }}>
            {badgeText}
          </span>
        )}
        <div style={{
          fontSize: compact ? 13 : 14,
          fontWeight: 700,
          color: 'var(--text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}>
          <HighlightedText text={title} query={query} />
        </div>
      </div>

      {sub && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {sub}
        </div>
      )}

      {!compact && excerpt && (
        <div style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          marginTop: 4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: 1.5,
        }}>
          <HighlightedText text={excerpt} query={query} />
        </div>
      )}
    </div>
  );

  const style = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: compact ? '9px 11px' : '12px 14px',
    borderRadius: 10,
    background: 'var(--bg-surface-2, rgba(255,255,255,0.03))',
    border: '1px solid var(--border-subtle)',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  };

  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={style}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--brand-500)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {inner}
      <ExternalLink size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </a>
  ) : (
    <div
      style={style}
      onClick={() => nav(to)}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--brand-500)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {inner}
      <ArrowRight size={13} style={{ color: 'var(--brand-500)', flexShrink: 0 }} />
    </div>
  );
}

export default function GlobalSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawQ = searchParams.get('q') || '';
  const [queryInput, setQueryInput] = useState(rawQ);
  const q = rawQ.trim();
  const { lang, t } = useLang();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'press' | 'proc' | 'wb' | 'adb'
  const [data, setData] = useState({ press: null, proc: null, wb: null, adb: null });

  // ── Bộ Lọc Nâng Cao ──
  const [operator, setOperator] = useState(searchParams.get('operator') || 'and');
  const [sector, setSector] = useState(searchParams.get('sector') || '');
  const [dateRange, setDateRange] = useState(searchParams.get('range') || 'all');
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('to') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(searchParams.get('operator') === 'or' || searchParams.get('sector') || searchParams.get('range') || searchParams.get('sort'))
  );

  useEffect(() => {
    setQueryInput(rawQ);
    if (searchParams.get('operator')) setOperator(searchParams.get('operator'));
    if (searchParams.get('sector')) setSector(searchParams.get('sector'));
    if (searchParams.get('range')) setDateRange(searchParams.get('range'));
    if (searchParams.get('from')) setDateFrom(searchParams.get('from'));
    if (searchParams.get('to')) setDateTo(searchParams.get('to'));
    if (searchParams.get('sort')) setSort(searchParams.get('sort'));
  }, [rawQ, searchParams]);

  // Đếm số tiêu chí lọc đang kích hoạt
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (operator === 'or') count++;
    if (sector) count++;
    if (dateRange !== 'all') count++;
    if (sort !== 'newest') count++;
    return count;
  }, [operator, sector, dateRange, sort]);

  // Tính toán khoảng ngày YYYY-MM-DD
  const computedDates = useMemo(() => {
    if (dateRange === 'custom') {
      return { from: dateFrom || undefined, to: dateTo || undefined };
    }
    if (dateRange === 'all') return { from: undefined, to: undefined };
    const now = new Date();
    const past = new Date();
    if (dateRange === '24h') past.setDate(now.getDate() - 1);
    else if (dateRange === '7d') past.setDate(now.getDate() - 7);
    else if (dateRange === '30d') past.setDate(now.getDate() - 30);
    const fmt = d => d.toISOString().split('T')[0];
    return { from: fmt(past), to: fmt(now) };
  }, [dateRange, dateFrom, dateTo]);

  useEffect(() => {
    if (!q) { setLoading(false); return; }
    let alive = true;
    setLoading(true);

    const pressParams = {
      q,
      only_my_keywords: false,
      size: 10,
      operator,
      sort,
      ...(sector ? { sector } : {}),
      ...(computedDates.from ? { date_from: computedDates.from } : {}),
      ...(computedDates.to ? { date_to: computedDates.to } : {}),
      ...(lang !== 'vi' ? { lang } : {}),
    };
    const procParams = {
      q,
      size: 10,
      ...(sector ? { sector } : {}),
    };
    const odaParams = {
      q,
      size: 8,
      ...(sector ? { sector } : {}),
    };

    // 4 kho quét SONG SONG — server đã tìm tiêu đề + nội dung + bản dịch + lọc nâng cao.
    Promise.allSettled([
      articlesService.getArticles(pressParams),
      odaService.getProcurement(procParams),
      odaService.getProjects({ ...odaParams, source: 'worldbank' }),
      odaService.getProjects({ ...odaParams, source: 'adb' }),
    ]).then(([a, p, w, d]) => {
      if (!alive) return;
      setData({
        press: a.status === 'fulfilled' ? a.value : { items: [], total: 0 },
        proc: p.status === 'fulfilled' ? p.value : { items: [], total: 0 },
        wb: w.status === 'fulfilled' ? w.value : { items: [], total: 0 },
        adb: d.status === 'fulfilled' ? d.value : { items: [], total: 0 },
      });
      setLoading(false);
    });
    return () => { alive = false; };
  }, [q, lang, operator, sector, computedDates, sort]);

  const applySearch = (override = {}) => {
    const targetQ = override.q !== undefined ? override.q : queryInput.trim();
    if (!targetQ) return;
    const targetOp = override.operator !== undefined ? override.operator : operator;
    const targetSec = override.sector !== undefined ? override.sector : sector;
    const targetRange = override.range !== undefined ? override.range : dateRange;
    const targetFrom = override.from !== undefined ? override.from : dateFrom;
    const targetTo = override.to !== undefined ? override.to : dateTo;
    const targetSort = override.sort !== undefined ? override.sort : sort;

    const nextParams = { q: targetQ };
    if (targetOp !== 'and') nextParams.operator = targetOp;
    if (targetSec) nextParams.sector = targetSec;
    if (targetRange !== 'all') nextParams.range = targetRange;
    if (targetRange === 'custom') {
      if (targetFrom) nextParams.from = targetFrom;
      if (targetTo) nextParams.to = targetTo;
    }
    if (targetSort !== 'newest') nextParams.sort = targetSort;
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    applySearch();
  };

  const handleResetFilters = () => {
    setOperator('and');
    setSector('');
    setDateRange('all');
    setDateFrom('');
    setDateTo('');
    setSort('newest');
    if (queryInput.trim()) {
      setSearchParams({ q: queryInput.trim() });
    }
  };

  const handleTagClick = (tag) => {
    const clean = tag.replace(/^#/, '');
    const current = queryInput.trim();
    const next = current ? `${current} ${clean}` : clean;
    setQueryInput(next);
    applySearch({ q: next });
  };

  const totalResults = useMemo(() => {
    return (
      (data.press?.total || 0) +
      (data.proc?.total || 0) +
      (data.wb?.total || 0) +
      (data.adb?.total || 0)
    );
  }, [data]);

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '24px 16px', position: 'relative', zIndex: 2 }}>
      {/* Header Hero Search Bar Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface-2) 100%)',
          border: '1px solid var(--border)',
          borderRadius: 22,
          padding: '24px 28px',
          marginBottom: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
            }}>
              <Search size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {t('search.title')}
              </h1>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {t('search.subtitle')}
              </div>
            </div>
          </div>

          {q && (
            <div style={{
              fontSize: 12.5,
              fontWeight: 800,
              color: '#3b82f6',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              padding: '6px 14px',
              borderRadius: 20,
            }}>
              ✨ {t('search.matchedBadge', { count: totalResults })}
            </div>
          )}
        </div>

        {/* Live Search Input Form */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder={t('search.inputPlaceholder')}
              style={{
                width: '100%',
                height: 46,
                padding: '0 16px 0 42px',
                borderRadius: 14,
                border: '1.5px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: 14,
                fontWeight: 600,
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)',
                boxSizing: 'border-box',
              }}
            />
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              height: 46,
              padding: '0 16px',
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: showAdvanced || activeFilterCount > 0 ? 'var(--brand-50, #eff6ff)' : 'var(--bg-surface)',
              color: showAdvanced || activeFilterCount > 0 ? 'var(--brand-600, #2563eb)' : 'var(--text-secondary)',
              border: `1.5px solid ${showAdvanced || activeFilterCount > 0 ? 'var(--brand-300, #93c5fd)' : 'var(--border)'}`,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={lang === 'ja' ? '詳細フィルター' : (lang === 'en' ? 'Advanced Filter' : 'Bộ lọc nâng cao')}
          >
            <SlidersHorizontal size={16} />
            <span>{lang === 'ja' ? '詳細フィルター' : (lang === 'en' ? 'Filters' : 'Lọc nâng cao')}</span>
            {activeFilterCount > 0 && (
              <span style={{
                background: 'var(--brand-600, #2563eb)',
                color: 'white',
                fontSize: 10.5,
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: 10,
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              height: 46,
              padding: '0 22px',
              borderRadius: 14,
              fontWeight: 800,
              fontSize: 13.5,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <Search size={16} />
            <span>{t('common.search')}</span>
          </button>
        </form>

        {/* Quick Suggestion Tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={13} style={{ color: '#f59e0b' }} />
            {lang === 'ja' ? 'おすすめ:' : (lang === 'en' ? 'Suggestions:' : 'Gợi ý từ khóa:')}
          </span>
          {QUICK_TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              style={{
                background: queryInput.includes(tag.replace(/^#/, '')) ? 'var(--brand-50, #eff6ff)' : 'var(--bg-surface-2)',
                color: queryInput.includes(tag.replace(/^#/, '')) ? 'var(--brand-600, #2563eb)' : 'var(--text-secondary)',
                border: `1px solid ${queryInput.includes(tag.replace(/^#/, '')) ? 'var(--brand-300, #93c5fd)' : 'var(--border-subtle)'}`,
                padding: '2px 9px',
                borderRadius: 12,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* ── Advanced Filters Panel (Collapsible) ── */}
        {showAdvanced && (
          <div
            style={{
              marginTop: 18,
              paddingTop: 18,
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              {/* Option 1: Search Operator (AND / OR) */}
              <div style={{ background: 'var(--bg-surface-2)', padding: '12px 14px', borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
                <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block', letterSpacing: 0.5 }}>
                  🎯 {lang === 'ja' ? '検索モード (演算子)' : (lang === 'en' ? 'Match Operator' : 'Chế độ khớp từ khóa')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => { setOperator('and'); applySearch({ operator: 'and' }); }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: operator === 'and' ? 800 : 600,
                      border: `1px solid ${operator === 'and' ? 'var(--brand-600, #2563eb)' : 'var(--border)'}`,
                      background: operator === 'and' ? 'var(--brand-600, #2563eb)' : 'var(--bg-surface)',
                      color: operator === 'and' ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    title={t('news.matchAndDesc')}
                  >
                    {t('news.matchAnd')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOperator('or'); applySearch({ operator: 'or' }); }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: operator === 'or' ? 800 : 600,
                      border: `1px solid ${operator === 'or' ? 'var(--brand-600, #2563eb)' : 'var(--border)'}`,
                      background: operator === 'or' ? 'var(--brand-600, #2563eb)' : 'var(--bg-surface)',
                      color: operator === 'or' ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    title={t('news.matchOrDesc')}
                  >
                    {t('news.matchOr')}
                  </button>
                </div>
              </div>

              {/* Option 2: Sector Filter */}
              <div style={{ background: 'var(--bg-surface-2)', padding: '12px 14px', borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
                <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block', letterSpacing: 0.5 }}>
                  🏗️ {lang === 'ja' ? 'インフラ分野' : (lang === 'en' ? 'Infrastructure Sector' : 'Lĩnh vực hạ tầng')}
                </label>
                <select
                  value={sector}
                  onChange={(e) => { setSector(e.target.value); applySearch({ sector: e.target.value }); }}
                  style={{
                    width: '100%',
                    height: 34,
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: 12.5,
                    fontWeight: 600,
                    padding: '0 8px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">{lang === 'ja' ? '── すべての分野 ──' : (lang === 'en' ? '── All Sectors ──' : '── Tất cả lĩnh vực ──')}</option>
                  {SECTORS_LIST.map(s => (
                    <option key={s.slug} value={s.slug}>{s.label[lang] || s.label.vi}</option>
                  ))}
                </select>
              </div>

              {/* Option 3: Time Range */}
              <div style={{ background: 'var(--bg-surface-2)', padding: '12px 14px', borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
                <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block', letterSpacing: 0.5 }}>
                  📅 {lang === 'ja' ? '期間' : (lang === 'en' ? 'Time Range' : 'Khoảng thời gian')}
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {[
                    { id: 'all', label: lang === 'ja' ? 'すべて' : (lang === 'en' ? 'All' : 'Tất cả') },
                    { id: '24h', label: '24h' },
                    { id: '7d', label: lang === 'ja' ? '7日間' : (lang === 'en' ? '7 days' : '7 ngày') },
                    { id: '30d', label: lang === 'ja' ? '30日間' : (lang === 'en' ? '30 days' : '30 ngày') },
                    { id: 'custom', label: lang === 'ja' ? '指定' : (lang === 'en' ? 'Custom' : 'Tùy chỉnh') },
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => { setDateRange(r.id); applySearch({ range: r.id }); }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: dateRange === r.id ? 800 : 600,
                        border: `1px solid ${dateRange === r.id ? 'var(--brand-600, #2563eb)' : 'var(--border)'}`,
                        background: dateRange === r.id ? 'var(--brand-600, #2563eb)' : 'var(--bg-surface)',
                        color: dateRange === r.id ? '#ffffff' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                {dateRange === 'custom' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => { setDateFrom(e.target.value); applySearch({ range: 'custom', from: e.target.value }); }}
                      style={{ flex: 1, height: 30, fontSize: 11, padding: '0 4px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>-</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => { setDateTo(e.target.value); applySearch({ range: 'custom', to: e.target.value }); }}
                      style={{ flex: 1, height: 30, fontSize: 11, padding: '0 4px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    />
                  </div>
                )}
              </div>

              {/* Option 4: Sort */}
              <div style={{ background: 'var(--bg-surface-2)', padding: '12px 14px', borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
                <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block', letterSpacing: 0.5 }}>
                  ⚡ {lang === 'ja' ? '並び替え' : (lang === 'en' ? 'Sort By' : 'Sắp xếp theo')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                  {[
                    { id: 'newest', label: lang === 'ja' ? '最新' : (lang === 'en' ? 'Newest' : 'Mới nhất') },
                    { id: 'match_count', label: lang === 'ja' ? '一致順' : (lang === 'en' ? 'Relevance' : 'Khớp nhất') },
                    { id: 'trending', label: lang === 'ja' ? '注目' : (lang === 'en' ? 'Trending' : 'Nổi bật') },
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setSort(s.id); applySearch({ sort: s.id }); }}
                      style={{
                        padding: '6px 4px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: sort === s.id ? 800 : 600,
                        border: `1px solid ${sort === s.id ? 'var(--brand-600, #2563eb)' : 'var(--border)'}`,
                        background: sort === s.id ? 'var(--brand-600, #2563eb)' : 'var(--bg-surface)',
                        color: sort === s.id ? '#ffffff' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions of Filter Panel */}
            {activeFilterCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    padding: '4px 12px',
                    borderRadius: 8,
                    fontSize: 11.5,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={12} />
                  <span>{lang === 'ja' ? 'フィルターをリセット' : (lang === 'en' ? 'Reset Filters' : 'Đặt lại bộ lọc')}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Filter Tabs */}
      {q && !loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 16, marginBottom: 8 }}>
          {[
            { id: 'all', label: t('common.all'), count: totalResults, icon: Layers, color: '#9333ea', activeBg: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)' },
            { id: 'press', label: t('search.pressShort'), count: data.press?.total || 0, icon: Newspaper, color: '#2563eb', activeBg: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' },
            { id: 'proc', label: t('search.proc'), count: data.proc?.total || 0, icon: ShoppingBag, color: '#9333ea', activeBg: 'linear-gradient(135deg, #9333ea 0%, #a855f7 100%)' },
            { id: 'wb', label: 'World Bank', count: data.wb?.total || 0, icon: Globe, color: '#059669', activeBg: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' },
            { id: 'adb', label: 'ADB', count: data.adb?.total || 0, icon: Building2, color: '#d97706', activeBg: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)' },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 16px',
                  borderRadius: 14,
                  fontSize: 13,
                  fontWeight: active ? 800 : 600,
                  cursor: 'pointer',
                  border: active ? '1px solid transparent' : '1px solid var(--border)',
                  background: active ? tab.activeBg : 'var(--bg-surface)',
                  color: active ? '#ffffff' : 'var(--text-primary)',
                  boxShadow: active ? '0 4px 14px rgba(0,0,0,0.2)' : 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <TabIcon size={14} style={{ color: active ? '#ffffff' : tab.color }} />
                <span>{tab.label}</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: active ? 'rgba(255, 255, 255, 0.28)' : 'var(--bg-surface-2)',
                  color: active ? '#ffffff' : 'var(--text-secondary)',
                  border: active ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid var(--border-subtle)',
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <ThemePageLoader message={t('search.loading')} minHeight="420px" />
      ) : !q ? (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '48px 24px',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}>
          <Search size={40} style={{ color: 'var(--brand-500)', marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            {t('search.promptTitle')}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 460, margin: '0 auto' }}>
            {t('search.promptSub')}
          </div>
        </div>
      ) : totalResults === 0 ? (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            {t('search.noResultTitle', { query: q })}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto 20px' }}>
            {t('search.noResultSub')}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: activeTab === 'all' ? 'grid' : 'block',
            gridTemplateColumns: activeTab === 'all' ? 'repeat(auto-fit, minmax(480px, 1fr))' : '1fr',
            gap: 18,
            alignItems: 'stretch',
          }}
        >
          {/* Section: Báo Chí */}
          {(activeTab === 'all' || activeTab === 'press') && (
            <SectionCard
              kind="press"
              title={t('search.press')}
              total={data.press?.total || 0}
              toAll={SECTION_STYLE.press.to(q)}
              onSelectTab={() => setActiveTab('press')}
              isGridView={activeTab === 'all'}
              t={t}
              query={q}
            >
              {(data.press?.items || []).map((a) => (
                <ResultRow
                  key={a.id}
                  title={a.title}
                  excerpt={a.excerpt || a.summary}
                  sub={a.source_name || a.published_at}
                  to={`/article/${a.id}`}
                  query={q}
                  badgeText={t('search.pressShort')}
                  badgeColor="#3b82f6"
                  compact={activeTab === 'all'}
                />
              ))}
            </SectionCard>
          )}

          {/* Section: Mua Sắm Công */}
          {(activeTab === 'all' || activeTab === 'proc') && (
            <SectionCard
              kind="proc"
              title={t('search.proc')}
              total={data.proc?.total || 0}
              toAll={SECTION_STYLE.proc.to(q)}
              onSelectTab={() => setActiveTab('proc')}
              isGridView={activeTab === 'all'}
              t={t}
              query={q}
            >
              {(data.proc?.items || []).map((p) => (
                <ResultRow
                  key={p.id}
                  title={p.title}
                  sub={[p.id, p.procuring_entity, p.publish_date].filter(Boolean).join(' · ')}
                  to={`/procurement/${encodeURIComponent(p.id)}`}
                  query={q}
                  badgeText={p.kind === 'plan' ? 'KHLCNT' : 'TBMT'}
                  badgeColor="#a855f7"
                  compact={activeTab === 'all'}
                />
              ))}
            </SectionCard>
          )}

          {/* Section: World Bank */}
          {(activeTab === 'all' || activeTab === 'wb') && (
            <SectionCard
              kind="wb"
              title={t('search.wbSection')}
              total={data.wb?.total || 0}
              toAll={SECTION_STYLE.wb.to(q)}
              onSelectTab={() => setActiveTab('wb')}
              isGridView={activeTab === 'all'}
              t={t}
              query={q}
            >
              {(data.wb?.items || []).map((p) => (
                <ResultRow
                  key={p.id}
                  title={p.title}
                  sub={[p.external_id, p.country, p.amount].filter(Boolean).join(' · ')}
                  to={`/news/worldbank?q=${encodeURIComponent(p.external_id || p.title)}`}
                  query={q}
                  badgeText="World Bank"
                  badgeColor="#10b981"
                  compact={activeTab === 'all'}
                />
              ))}
            </SectionCard>
          )}

          {/* Section: ADB */}
          {(activeTab === 'all' || activeTab === 'adb') && (
            <SectionCard
              kind="adb"
              title={t('search.adbSection')}
              total={data.adb?.total || 0}
              toAll={SECTION_STYLE.adb.to(q)}
              onSelectTab={() => setActiveTab('adb')}
              isGridView={activeTab === 'all'}
              t={t}
              query={q}
            >
              {(data.adb?.items || []).map((p) => (
                <ResultRow
                  key={p.id}
                  title={p.title}
                  sub={[p.external_id, p.country, p.amount].filter(Boolean).join(' · ')}
                  to={`/news/adb?q=${encodeURIComponent(p.external_id || p.title)}`}
                  query={q}
                  badgeText="ADB"
                  badgeColor="#f59e0b"
                  compact={activeTab === 'all'}
                />
              ))}
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}
