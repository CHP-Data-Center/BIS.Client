// src/pages/BookmarksPage.jsx
import { useState, useEffect } from 'react';
import { Bookmark, Trash2, ExternalLink, Calendar, Loader2, Eye, LayoutGrid, List, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { articlesService } from '../services/articles';
import NewsCard from '../components/NewsCard';

// Color & icon mapping for source tags
const SOURCE_STYLE = {
  adb:       { color: '#f59e0b', bg: '#fffbeb', icon: '🏦', name: 'ADB', label: 'Dự Án ADB' },
  worldbank: { color: '#10b981', bg: '#ecfdf5', icon: '🌍', name: 'World Bank', label: 'World Bank' },
  dauthau:   { color: '#8b5cf6', bg: '#f5f3ff', icon: '📋', name: 'Mua Sắm Công', label: 'Đấu Thầu' },
  gov:       { color: '#8b5cf6', bg: '#f5f3ff', icon: '📋', name: 'Mua Sắm Công', label: 'Đấu Thầu' },
  press:     { color: '#3b82f6', bg: '#eff6ff', icon: '📰', name: 'Báo Chí', label: 'Tin Tức' },
  default:   { color: '#6b7280', bg: '#f9fafb', icon: '📄', name: 'Nguồn Tin', label: 'Tin Tức' },
};

function getSourceInfo(bm) {
  const name = bm.source_name || '';
  const type = bm.source_type || '';
  const lowerName = name.toLowerCase();

  if (lowerName.includes('adb')) {
    return { ...SOURCE_STYLE.adb, name: name || 'ADB' };
  }
  if (lowerName.includes('world bank') || lowerName.includes('wb')) {
    return { ...SOURCE_STYLE.worldbank, name: name || 'World Bank' };
  }
  if (type === 'gov' || lowerName.includes('thầu') || lowerName.includes('egp')) {
    return { ...SOURCE_STYLE.gov, name: name || 'Mua Sắm Công / Đấu Thầu' };
  }
  if (type === 'press' || name) {
    return { ...SOURCE_STYLE.press, name: name || 'Báo Chí' };
  }
  return { ...SOURCE_STYLE.default, name: 'Nguồn tin' };
}

export default function BookmarksPage() {
  const nav = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [removing, setRemoving]   = useState(null);
  const [viewMode, setViewMode]   = useState('list'); // 'list' | 'grid'

  useEffect(() => {
    articlesService.getBookmarks()
      .then(setBookmarks)
      .catch(() => setBookmarks([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (articleId) => {
    setRemoving(articleId);
    try {
      await articlesService.removeBookmark(articleId);
      setBookmarks((prev) => prev.filter((b) => b.article_id !== articleId));
    } catch {
      // silent
    } finally {
      setRemoving(null);
    }
  };

  const mapBookmarkToArticle = (bm) => ({
    id: bm.article_id,
    title: bm.article_title || `Bài viết #${bm.article_id}`,
    url: bm.article_url,
    image_url: bm.article_image_url || bm.image_url,
    sources: bm.source_name ? [{ source_name: bm.source_name }] : [],
    source: bm.source_type || (bm.source_name?.toLowerCase().includes('thầu') ? 'gov' : 'press'),
    excerpt: bm.excerpt,
    published_at: bm.published_at || bm.created_at,
    is_bookmarked: true,
  });

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: '0 4px 14px rgba(245,158,11,0.35)',
            }}>
              <Bookmark size={20} color="white" />
            </div>
            Bài Viết Đã Lưu
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Danh sách bài viết bạn đã đánh dấu lưu lại.
          </p>
        </div>

        {/* View Toggle */}
        {bookmarks.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-surface-2)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
            <button
              onClick={() => setViewMode('list')}
              title="Chế độ Danh sách"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, border: 'none',
                background: viewMode === 'list' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'list' ? 'var(--brand-600)' : 'var(--text-muted)',
                fontWeight: viewMode === 'list' ? 700 : 500, fontSize: 12, cursor: 'pointer',
                boxShadow: viewMode === 'list' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <List size={15} /> Danh sách
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Chế độ Lưới thẻ"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, border: 'none',
                background: viewMode === 'grid' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--brand-600)' : 'var(--text-muted)',
                fontWeight: viewMode === 'grid' ? 700 : 500, fontSize: 12, cursor: 'pointer',
                boxShadow: viewMode === 'grid' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <LayoutGrid size={15} /> Lưới thẻ
            </button>
          </div>
        )}
      </div>

      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
      }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Bookmark của tôi</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-200)' }}>
            {bookmarks.length} bài
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 8px', display: 'block' }} />
            Đang tải danh sách bài viết đã lưu...
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="empty-state" style={{ minHeight: 200 }}>
            <div className="empty-icon">🔖</div>
            <div className="empty-title">Chưa có bookmark nào</div>
            <div className="empty-sub">Khi đọc bài viết, bấm "Lưu lại" để bookmark xuất hiện ở đây.</div>
            <button className="btn btn-primary" onClick={() => nav('/news/all')} style={{ marginTop: 12 }}>
              Xem tin tức
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {bookmarks.map((bm, i) => (
              <NewsCard key={bm.id} article={mapBookmarkToArticle(bm)} index={i} />
            ))}
          </div>
        ) : (
          <div>
            {bookmarks.map((bm, i) => {
              const srcInfo = getSourceInfo(bm);
              const imageUrl = bm.article_image_url || bm.image_url;
              const displayDate = bm.published_at
                ? new Date(bm.published_at).toLocaleDateString('vi-VN')
                : bm.created_at
                  ? new Date(bm.created_at).toLocaleDateString('vi-VN')
                  : null;

              return (
                <div
                  key={bm.id}
                  className="bookmark-row-card"
                  onClick={() => nav(`/article/${bm.article_id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '16px 20px',
                    borderBottom: i < bookmarks.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {/* Article Image / Icon Container */}
                  <div
                    style={{
                      width: 120, height: 85, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                      background: imageUrl ? 'none' : `linear-gradient(135deg, ${srcInfo.bg}, #ffffff)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={bm.article_title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                      />
                    ) : (
                      <span style={{ fontSize: 32, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
                        {srcInfo.icon}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Tags row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      {/* Tag thuộc nguồn nào (Source Tag) */}
                      <span className="news-source-tag" style={{ background: srcInfo.color }}>
                        <span style={{ fontSize: 10 }}>{srcInfo.icon}</span>
                        {srcInfo.name}
                      </span>

                      {/* Source Type / Label badge */}
                      <span style={{
                        fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                        background: srcInfo.bg, color: srcInfo.color,
                        border: `1px solid ${srcInfo.color}35`,
                      }}>
                        {srcInfo.label}
                      </span>

                      {/* Folder tag */}
                      {bm.folder && bm.folder !== 'default' && (
                        <span style={{
                          fontSize: 10.5, fontWeight: 600, background: 'var(--bg-surface-2)',
                          padding: '1px 8px', borderRadius: 10, border: '1px solid var(--border)',
                          color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}>
                          📁 {bm.folder}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <div className="bookmark-card-title" style={{
                      fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4,
                      lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden', transition: 'color 0.2s ease',
                    }}>
                      {bm.article_title || `Bài viết #${bm.article_id}`}
                    </div>

                    {/* Excerpt if present */}
                    {bm.excerpt && (
                      <div style={{
                        fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 6,
                        lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {bm.excerpt}
                      </div>
                    )}

                    {/* Date */}
                    {displayDate && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={11} />
                        <span>{displayDate}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        nav(`/article/${bm.article_id}`);
                      }}
                      title="Xem chi tiết"
                      style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Eye size={14} />
                    </button>
                    {bm.article_url && (
                      <a
                        className="btn btn-ghost btn-sm"
                        href={bm.article_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Xem bài gốc"
                        style={{ padding: '6px 10px', display: 'flex', alignItems: 'center' }}
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(bm.article_id);
                      }}
                      title="Bỏ bookmark"
                      id={`btn-remove-bm-${bm.article_id}`}
                      disabled={removing === bm.article_id}
                      style={{ padding: '6px 10px', color: '#ef4444' }}
                    >
                      {removing === bm.article_id
                        ? <Loader2 size={14} style={{ animation: 'spin 0.6s linear infinite' }} />
                        : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
