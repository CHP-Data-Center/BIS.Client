// src/components/NewsCard.jsx
import { Calendar, ExternalLink, Bookmark, BookmarkCheck, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { articlesService } from '../services/articles';

// Dynamic source styles
const SOURCE_STYLE = {
  adb:       { color: '#f59e0b', bg: '#fffbeb', icon: '🏦', name: 'ADB' },
  worldbank: { color: '#10b981', bg: '#ecfdf5', icon: '🌍', name: 'World Bank' },
  dauthau:   { color: '#8b5cf6', bg: '#f5f3ff', icon: '📋', name: 'Đấu Thầu' },
  gov:       { color: '#8b5cf6', bg: '#f5f3ff', icon: '📋', name: 'Mua Sắm Công' },
  press:     { color: '#3b82f6', bg: '#eff6ff', icon: '📰', name: 'Báo Chí' },
  default:   { color: '#6b7280', bg: '#f9fafb', icon: '📄', name: 'Nguồn tin' },
};

function getSourceStyle(article) {
  if (article.source && SOURCE_STYLE[article.source]) {
    return SOURCE_STYLE[article.source];
  }
  const sourceName = article.sources?.[0]?.source_name || '';
  if (sourceName.toLowerCase().includes('adb'))
    return { ...SOURCE_STYLE.adb, name: sourceName };
  if (sourceName.toLowerCase().includes('world bank') || sourceName.toLowerCase().includes('wb'))
    return { ...SOURCE_STYLE.worldbank, name: sourceName };
  if (sourceName.toLowerCase().includes('egp') || sourceName.toLowerCase().includes('thầu'))
    return { ...SOURCE_STYLE.gov, name: sourceName || 'Đấu Thầu' };
  if (sourceName)
    return { ...SOURCE_STYLE.press, name: sourceName };
  return { ...SOURCE_STYLE.default, name: 'Nguồn tin' };
}

export default function NewsCard({ article, index = 0 }) {
  const nav = useNavigate();
  const [bookmarked, setBookmarked] = useState(article.is_bookmarked || false);
  const [bkLoading, setBkLoading]   = useState(false);

  const src = getSourceStyle(article);
  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : article.date
      ? new Date(article.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : null;

  const titleText = article.titleVi || article.title;
  const excerptText = article.excerptVi || article.excerpt;

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

  const handleClick = () => {
    nav(`/article/${article.id}`, { state: { article } });
  };

  return (
    <article
      className="news-card"
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={handleClick}
      id={`news-card-${article.id}`}
    >
      {/* Cover */}
      <div
        className="news-card-img"
        style={{
          overflow: 'hidden', flexShrink: 0, height: 150,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
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
      <div className="news-card-body">
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

        <h3 className="news-card-title">{titleText}</h3>

        {excerptText && (
          <p style={{
            fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', flex: '1',
            maxHeight: '3.1em', marginTop: 0,
          }}>
            {excerptText}
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

        {article.matched_keywords?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
            {article.matched_keywords.slice(0, 3).map((kw) => (
              <span key={kw} style={{
                fontSize: 10, fontWeight: 600, padding: '1px 7px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--brand-50)', color: 'var(--brand-600)',
                border: '1px solid var(--brand-200)',
              }}>
                #{kw}
              </span>
            ))}
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
            title={bookmarked ? 'Bỏ bookmark' : 'Lưu lại'}
            style={{
              background: 'none', border: 'none', cursor: bkLoading ? 'wait' : 'pointer',
              color: bookmarked ? '#f59e0b' : 'var(--text-muted)',
              padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center',
              transition: 'color 0.15s, background-color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {bookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
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
