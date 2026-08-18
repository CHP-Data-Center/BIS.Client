// src/pages/GlobalSearchPage.jsx
// Tìm kiếm TOÀN CỤC từ ô search header: 1 từ khóa quét CẢ 4 kho đã crawl
// (Báo chí, Mua sắm công TBMT/KHLCNT, World Bank, ADB)
import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Newspaper, ShoppingBag, Globe, Building2, Search, ExternalLink,
  ChevronRight, Sparkles, Filter, Layers, ArrowRight, Clock, MapPin, DollarSign
} from 'lucide-react';
import { articlesService } from '../services/articles';
import { odaService } from '../services/oda';
import { useLang } from '../context/LanguageContext';
import ThemePageLoader from '../components/common/ThemePageLoader';

const SECTION_STYLE = {
  press: { icon: Newspaper, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)', to: (q) => `/news/press?q=${encodeURIComponent(q)}` },
  proc: { icon: ShoppingBag, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)', to: (q) => `/news/tbmt?q=${encodeURIComponent(q)}` },
  wb: { icon: Globe, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', to: (q) => `/news/worldbank?q=${encodeURIComponent(q)}` },
  adb: { icon: Building2, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', to: (q) => `/news/adb?q=${encodeURIComponent(q)}` },
};

/** Highlight matching search keywords in text */
function HighlightedText({ text, query }) {
  if (!text || !query) return <span>{text || ''}</span>;
  const parts = String(text).split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
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
  const resultsUnitStr = (t('search.resultsCount') && !t('search.resultsCount').includes('.')) ? t('search.resultsCount') : 'kết quả';

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
              {kind === 'adb' && isGridView ? 'Dự án ADB' : kind === 'wb' && isGridView ? 'Dự án World Bank' : title}
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
            <span>{isGridView ? 'Xem riêng' : (t('search.viewAll') || 'Xem tất cả')}</span>
            <ChevronRight size={13} />
          </button>
        )}
      </div>

      {total === 0 ? (
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '24px 8px', textAlign: 'center', fontStyle: 'italic', flex: 1 }}>
          {t('search.empty') || 'Không tìm thấy dữ liệu phù hợp trong danh mục này.'}
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

  useEffect(() => {
    setQueryInput(rawQ);
  }, [rawQ]);

  useEffect(() => {
    if (!q) { setLoading(false); return; }
    let alive = true;
    setLoading(true);
    // 4 kho quét SONG SONG — server đã tìm tiêu đề + nội dung + bản dịch.
    Promise.allSettled([
      articlesService.getArticles({ q, only_my_keywords: false, size: 10, ...(lang !== 'vi' ? { lang } : {}) }),
      odaService.getProcurement({ q, size: 10 }),
      odaService.getProjects({ q, source: 'worldbank', size: 8 }),
      odaService.getProjects({ q, source: 'adb', size: 8 }),
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
  }, [q, lang]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (queryInput.trim()) {
      setSearchParams({ q: queryInput.trim() });
    }
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
                {t('search.title') || 'Tìm kiếm toàn cục'}
              </h1>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Tra cứu đồng thời trên 4 kho dữ liệu: Báo chí, Mua sắm công, World Bank & ADB
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
              ✨ {totalResults} kết quả khớp từ khóa
            </div>
          )}
        </div>

        {/* Live Search Input Form */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Nhập từ khóa tìm kiếm (ví dụ: công nghiệp, World Bank, thủy lợi)..."
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
            <span>Tìm kiếm</span>
          </button>
        </form>
      </div>

      {/* Category Filter Tabs */}
      {q && !loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 16, marginBottom: 8 }}>
          {[
            { id: 'all', label: 'Tất cả', count: totalResults, icon: Layers, color: '#9333ea', activeBg: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)' },
            { id: 'press', label: t('search.press') || 'Báo Chí', count: data.press?.total || 0, icon: Newspaper, color: '#2563eb', activeBg: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' },
            { id: 'proc', label: t('search.proc') || 'Mua Sắm Công', count: data.proc?.total || 0, icon: ShoppingBag, color: '#9333ea', activeBg: 'linear-gradient(135deg, #9333ea 0%, #a855f7 100%)' },
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
        <ThemePageLoader message="Đang quét tìm kiếm trên 4 cơ sở dữ liệu..." minHeight="420px" />
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
            Vui lòng nhập từ khóa để bắt đầu tìm kiếm
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 460, margin: '0 auto' }}>
            Hệ thống sẽ đồng thời tìm kiếm trên Báo chí, Gói thầu Mua sắm công (TBMT & KHLCNT), Dự án World Bank & ADB.
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
            Không tìm thấy kết quả phù hợp cho từ khóa “{q}”
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto 20px' }}>
            Thử kiểm tra lại lỗi chính tả, sử dụng từ khóa ngắn hơn hoặc các thuật ngữ chung như "World Bank", "Thủy lợi", "Bưu chính".
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
              title={t('search.press') || 'Báo Chí'}
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
                  badgeText="Báo Chí"
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
              title={t('search.proc') || 'Mua Sắm Công (TBMT / KHLCNT)'}
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
              title="Dự án World Bank (WB)"
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
              title="Dự án Ngân hàng Phát triển Châu Á (ADB)"
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
