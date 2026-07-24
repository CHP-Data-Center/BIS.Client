// src/components/NewsCard.jsx
import { Calendar, ExternalLink, Bookmark, BookmarkCheck, Cpu } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { articlesService } from '../services/articles';

// Dynamic source styles
const SOURCE_STYLE = {
  adb:       { color: '#f59e0b', bg: '#fffbeb', icon: '🏦', name: 'ADB' },
  worldbank: { color: '#10b981', bg: '#ecfdf5', icon: '🌍', name: 'World Bank' },
  dauthau:   { color: '#3b82f6', bg: '#eff6ff', icon: '📋', name: 'Đấu Thầu' },
  gov:       { color: '#3b82f6', bg: '#eff6ff', icon: '📋', name: 'Mua Sắm Công' },
  press:     { color: '#3b82f6', bg: '#eff6ff', icon: '📰', name: 'Báo Chí' },
  default:   { color: '#3b82f6', bg: '#eff6ff', icon: '📄', name: 'Nguồn tin' },
};

function stripAccents(str = '') {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function isTagMatched(tag, query) {
  if (!query || !query.trim()) return false;
  const normTag = stripAccents(tag);
  const normQ = stripAccents(query.trim());
  return normTag.includes(normQ);
}

function highlightText(text, query) {
  if (!text || !query || !query.trim()) return text;
  const qClean = query.trim();
  try {
    const escaped = qClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === qClean.toLowerCase() ? (
        <mark
          key={i}
          style={{
            backgroundColor: 'rgba(254, 240, 138, 0.95)',
            color: '#854d0e',
            fontWeight: 700,
            padding: '0px 3px',
            borderRadius: 3,
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
          }}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  } catch {
    return text;
  }
}

function getSourceStyle(article) {
  const sourceName = article.sources?.[0]?.source_name || '';
  if (sourceName.toLowerCase().includes('báo')) {
    return { color: '#3b82f6', bg: '#eff6ff', icon: '📰', name: sourceName };
  }
  if (article.source && SOURCE_STYLE[article.source]) {
    const base = SOURCE_STYLE[article.source];
    if (sourceName) {
      return { ...base, name: sourceName };
    }
    return base;
  }
  if (sourceName.toLowerCase().includes('adb'))
    return { ...SOURCE_STYLE.adb, name: sourceName };
  if (sourceName.toLowerCase().includes('world bank') || sourceName.toLowerCase().includes('wb'))
    return { ...SOURCE_STYLE.worldbank, name: sourceName };
  if (sourceName.toLowerCase().includes('egp') || sourceName.toLowerCase().includes('thầu'))
    return { ...SOURCE_STYLE.gov, name: sourceName };
  if (sourceName)
    return { ...SOURCE_STYLE.press, name: sourceName };
  return { ...SOURCE_STYLE.default, name: 'Nguồn tin' };
}

export default function NewsCard({ article, index = 0 }) {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const currentQ = searchParams.get('q') || '';

  const [bookmarked, setBookmarked] = useState(article.is_bookmarked || false);
  const [bkLoading, setBkLoading]   = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);

  const src = getSourceStyle(article);
  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : article.date
      ? new Date(article.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : null;

  const titleText = article.titleVi || article.title;
  const excerptText = article.excerptVi || article.excerpt;

  const rawKeywords = article.matched_keywords || [];
  const sortedKeywords = useMemo(() => {
    if (!rawKeywords.length) return [];
    if (!currentQ.trim()) return rawKeywords;
    return [...rawKeywords].sort((a, b) => {
      const aMatch = isTagMatched(a, currentQ);
      const bMatch = isTagMatched(b, currentQ);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }, [rawKeywords, currentQ]);

  const visibleTags = sortedKeywords.slice(0, 3);
  const remainingTags = sortedKeywords.slice(3);

  const handleBookmark = async (e) => {
    e.stopPropagation();
    if (bkLoading) return;
    setBkLoading(true);
    try {
      if (bookmarked) {
        if (article.is_local_project) {
          try {
            const raw = localStorage.getItem(article.local_key);
            if (raw) {
              const list = JSON.parse(raw);
              const updated = list.filter((p) => p.id !== article.original_id);
              localStorage.setItem(article.local_key, JSON.stringify(updated));
            }
          } catch (err) {
            console.error(err);
          }
        } else if (typeof article.id === 'number') {
          await articlesService.removeBookmark(article.id);
        }
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

  const handleClick = () => {
    if (article.is_local_project && article.url) {
      window.open(article.url, '_blank');
    } else {
      nav(`/article/${article.id}`, { state: { article } });
    }
  };

  return (
    <article
      className="news-card"
      style={{ animationDelay: `${index * 60}ms`, overflow: 'visible' }}
      onClick={handleClick}
      id={`news-card-${article.id}`}
    >
      {/* Cover */}
      <div
        className="news-card-img"
        style={{
          overflow: 'hidden', flexShrink: 0, height: 150,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)',
          background: article.image_url
            ? 'none'
            : article.gradient
              ? `linear-gradient(135deg, ${article.gradient[0]}, ${article.gradient[1]})`
              : `linear-gradient(135deg, ${src.bg}, #ffffff)`,
        }}
      >
        {article.image_url ? (
          <img
            src={article.image_url}
            alt={titleText}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
          />
        ) : (
          <span style={{ fontSize: 48, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.12))', display: 'block' }}>
            {article.coverEmoji || src.icon}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="news-card-body" style={{ overflow: 'visible', position: 'relative' }}>
        <div className="news-card-meta">
          <span className="news-source-tag" style={{ background: src.color }}>
            <span style={{ fontSize: 10 }}>{src.icon}</span>
            {src.name}
          </span>

          {article.amount && (
            <span style={{
              fontSize: 11, fontWeight: 800, color: src.color,
              background: src.bg, padding: '2px 8px', borderRadius: 12,
              border: `1px solid ${src.color}40`,
            }}>
              💰 {article.amount}
            </span>
          )}

          {article.sources?.length > 1 && (
            <span style={{
              fontSize: 10.5, fontWeight: 700, padding: '2px 7px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-surface-2)', color: 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}>
              +{article.sources.length - 1} nguồn
            </span>
          )}

          {article.is_read && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>✓ Đã đọc</span>
          )}
        </div>

        <h3 className="news-card-title">{highlightText(titleText, currentQ)}</h3>

        {excerptText && (
          <p style={{
            fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', flex: '1',
            maxHeight: '3.1em', marginTop: 0,
          }}>
            {highlightText(excerptText, currentQ)}
          </p>
        )}

        {article.aiSummary && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 10px',
            background: 'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(244,114,182,0.08))',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(167,139,250,0.3)',
            marginTop: 'auto',
          }}>
            <span className="ai-badge" style={{ flexShrink: 0 }}>
              <Cpu size={9} /> AI
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, fontWeight: 500 }}>
              {article.aiSummary}
            </span>
          </div>
        )}

        {sortedKeywords.length > 0 && (
          <div style={{
            display: 'flex', gap: 4, flexWrap: 'nowrap', marginTop: 6,
            alignItems: 'center', overflow: 'visible', width: '100%',
          }}>
            {visibleTags.map((kw) => {
              const matched = isTagMatched(kw, currentQ);
              return (
                <span
                  key={kw}
                  onClick={(e) => {
                    e.stopPropagation();
                    nav(`/news/all?q=${encodeURIComponent(kw)}`);
                  }}
                  style={{
                    fontSize: 10,
                    fontWeight: matched ? 700 : 600,
                    padding: '1.5px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: matched
                      ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                      : 'var(--brand-50)',
                    color: matched ? '#ffffff' : 'var(--brand-600)',
                    border: matched ? '1px solid #1d4ed8' : '1px solid var(--brand-200)',
                    cursor: 'pointer',
                    boxShadow: matched
                      ? '0 2px 8px rgba(37, 99, 235, 0.4), 0 0 0 2px rgba(59, 130, 246, 0.25)'
                      : 'none',
                    transition: 'all 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                  title={`Bấm để tìm bài viết với từ khóa #${kw}`}
                >
                  {matched && <span style={{ fontSize: 9 }}>⚡</span>}
                  #{kw}
                </span>
              );
            })}

            {remainingTags.length > 0 && (
              <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
                <span
                  onMouseEnter={() => setShowOverflow(true)}
                  onMouseLeave={() => setShowOverflow(false)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOverflow((v) => !v);
                  }}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1.5px 7px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-surface-2)',
                    color: 'var(--brand-600)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                  title="Rê chuột hoặc bấm để xem thêm từ khóa"
                >
                  +{remainingTags.length}...
                </span>

                {showOverflow && (
                  <div
                    onMouseEnter={() => setShowOverflow(true)}
                    onMouseLeave={() => setShowOverflow(false)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 6px)',
                      right: 0,
                      zIndex: 1000,
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: '8px 10px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                      maxWidth: 220,
                      minWidth: 150,
                      whiteSpace: 'normal',
                    }}
                  >
                    <div style={{ width: '100%', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2 }}>
                      Từ khóa khác ({remainingTags.length}):
                    </div>
                    {remainingTags.map((kw) => {
                      const matched = isTagMatched(kw, currentQ);
                      return (
                        <span
                          key={kw}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowOverflow(false);
                            nav(`/news/all?q=${encodeURIComponent(kw)}`);
                          }}
                          style={{
                            fontSize: 10,
                            fontWeight: matched ? 700 : 600,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: matched
                              ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                              : 'var(--brand-50)',
                            color: matched ? '#ffffff' : 'var(--brand-600)',
                            border: matched ? '1px solid #1d4ed8' : '1px solid var(--brand-200)',
                            cursor: 'pointer',
                            boxShadow: matched ? '0 2px 6px rgba(37, 99, 235, 0.35)' : 'none',
                            whiteSpace: 'nowrap',
                          }}
                          title={`Bấm để tìm bài viết với từ khóa #${kw}`}
                        >
                          {matched ? '⚡ ' : ''}#{kw}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="news-card-footer">
        <div className="news-card-date">
          <Calendar size={11} />
          {publishedDate || 'N/A'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={handleBookmark}
            id={`btn-bookmark-${article.id}`}
            title={bookmarked ? 'Bỏ lưu' : 'Lưu lại'}
            style={{
              background: 'none', border: 'none',
              cursor: bkLoading ? 'wait' : 'pointer',
              color: bookmarked ? 'var(--brand-600)' : 'var(--text-muted)',
              padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center',
              transition: 'color 0.15s, background-color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--brand-600)';
              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = bookmarked ? 'var(--brand-600)' : 'var(--text-muted)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {bookmarked ? <BookmarkCheck size={18} style={{ color: 'var(--brand-600)' }} /> : <Bookmark size={18} />}
          </button>
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Xem bài gốc"
              style={{
                color: 'var(--text-muted)',
                padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center',
                transition: 'color 0.15s, background-color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--brand-600)';
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <ExternalLink size={18} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
