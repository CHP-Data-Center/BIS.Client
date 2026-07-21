// src/pages/NewsPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronRight, Calendar, Tag, ExternalLink, Cpu } from 'lucide-react';
import { getArticlesBySource, SOURCES, mockArticles } from '../data/mockData';
import NewsCard from '../components/NewsCard';

export default function NewsPage() {
  const { source } = useParams();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [sortBy, setSortBy] = useState('date');

  const src = SOURCES[source];
  const allArticles = getArticlesBySource(source === 'all' ? null : source);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, [source]);

  const filtered = allArticles.filter(a => {
    const q = search.toLowerCase();
    return !q || (a.titleVi || a.title).toLowerCase().includes(q)
      || (a.excerptVi || a.excerpt).toLowerCase().includes(q)
      || a.category?.toLowerCase().includes(q);
  });

  // Header color based on source
  const headerStyle = src
    ? { background: `linear-gradient(135deg, ${src.color}22, ${src.color}08)`, borderColor: `${src.color}33` }
    : { background: 'linear-gradient(135deg, var(--brand-50), var(--bg-surface-2))' };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <a onClick={() => nav('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</a>
        <ChevronRight size={12} className="breadcrumb-sep" />
        <span>Nguồn Dữ Liệu</span>
        <ChevronRight size={12} className="breadcrumb-sep" />
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          {src?.fullName ?? 'Tất Cả Nguồn'}
        </span>
      </div>

      {/* Page header card */}
      <div style={{
        ...headerStyle,
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6) var(--space-8)',
        marginBottom: 'var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-5)',
      }}>
        {src ? (
          <>
            <div style={{
              width: 56, height: 56,
              background: src.bg,
              borderRadius: 'var(--radius-lg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26,
              border: `1px solid ${src.color}44`,
              flexShrink: 0,
            }}>
              {src.icon}
            </div>
            <div>
              <h1 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 22, fontWeight: 800,
                color: 'var(--text-primary)', letterSpacing: -0.3,
              }}>
                {src.fullName}
              </h1>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
                {src.desc} · {allArticles.length} bài viết đã thu thập
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 600, color: src.color,
                  padding: '5px 12px',
                  background: `${src.color}15`,
                  borderRadius: 'var(--radius-full)',
                  border: `1px solid ${src.color}30`,
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={11} /> Trang chính thức
              </a>
            </div>
          </>
        ) : (
          <div>
            <h1 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 22, fontWeight: 800, color: 'var(--text-primary)',
            }}>
              🗂️ Tất Cả Nguồn Dữ Liệu
            </h1>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
              Tổng hợp từ ADB, World Bank và Đấu thầu Quốc gia · {allArticles.length} bài viết
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        marginBottom: 'var(--space-5)', flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div className="search-bar" style={{ width: 'auto', flex: '1 1 200px', maxWidth: 340 }}>
          <Search size={14} className="search-icon" />
          <input
            id="input-news-search"
            className="search-input"
            style={{ width: '100%' }}
            placeholder="Tìm kiếm trong nguồn này..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
          {/* Sort */}
          <select
            id="select-sort"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              padding: '7px 12px', fontSize: 12, fontWeight: 600,
              border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)', color: 'var(--text-primary)',
              cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="date">Mới nhất</option>
            <option value="amount">Giá trị</option>
            <option value="category">Lĩnh vực</option>
          </select>

          {/* View toggle */}
          <div style={{
            display: 'flex',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}>
            {['grid', 'list'].map(m => (
              <button
                key={m}
                id={`btn-view-${m}`}
                onClick={() => setViewMode(m)}
                style={{
                  padding: '7px 14px', fontSize: 12, fontWeight: 600,
                  background: viewMode === m ? 'var(--brand-600)' : 'var(--bg-surface)',
                  color: viewMode === m ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}
              >
                {m === 'grid' ? '⊞ Grid' : '☰ List'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      {search && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          Tìm thấy <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> kết quả cho "{search}"
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} style={{
              height: 72, background: 'var(--bg-surface)', borderRadius: 12,
              marginBottom: 2, padding: '0 20px',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div className="skeleton" style={{ width: 24, height: 14, borderRadius: 4 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 14, width: '70%', borderRadius: 4, marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 11, width: '40%', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">Không tìm thấy kết quả</div>
          <div className="empty-sub">Thử tìm với từ khóa khác</div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="news-grid">
          {filtered.map((a, i) => <NewsCard key={a.id} article={a} index={i} />)}
        </div>
      ) : (
        <div className="news-table-wrapper">
          {filtered.map((a, idx) => {
            const s = SOURCES[a.source];
            return (
              <div
                key={a.id}
                className="news-table-row"
                onClick={() => nav(`/article/${a.id}`)}
                id={`list-row-${a.id}`}
              >
                <div className="news-table-num">{String(idx + 1).padStart(2, '0')}</div>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: s.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 18, flexShrink: 0,
                }}>
                  {a.coverEmoji}
                </div>
                <div className="news-table-content">
                  <div className="news-table-title">{a.titleVi || a.title}</div>
                  <div className="news-table-meta">
                    <span style={{
                      padding: '1px 7px', borderRadius: 'var(--radius-full)',
                      background: s.color, color: 'white', fontSize: 10, fontWeight: 700,
                    }}>{s.name}</span>
                    {a.category && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Tag size={10} />{a.category}
                      </span>
                    )}
                    {a.aiSummary && (
                      <span className="ai-badge" style={{ display: 'inline-flex' }}>
                        <Cpu size={9} />AI
                      </span>
                    )}
                  </div>
                </div>
                <div className="news-table-right">
                  {a.amount && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{a.amount}</span>
                  )}
                  {a.status && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: a.status === 'Đang mở thầu' ? '#10b981' : '#f59e0b',
                    }}>{a.status}</span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-muted)' }}>
                    <Calendar size={10} />
                    {new Date(a.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
