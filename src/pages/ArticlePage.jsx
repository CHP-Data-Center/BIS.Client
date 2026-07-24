// src/pages/ArticlePage.jsx
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Globe, Cpu, ExternalLink, Bookmark, BookmarkCheck, Share2, ChevronRight, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { articlesService } from '../services/articles';

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

// Source color/icon fallback table (nếu backend không trả source name)
const SOURCE_COLORS = {
  gov:   { color: '#8b5cf6', bg: '#f5f3ff', icon: '📋', name: 'Mua Sắm Công' },
  press: { color: '#3b82f6', bg: '#eff6ff', icon: '📰', name: 'Báo Chí' },
};
const DEFAULT_SRC = { color: '#6b7280', bg: '#f9fafb', icon: '📄', name: 'Nguồn tin' };

export default function ArticlePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentQ = searchParams.get('q') || '';

  // Article có thể được truyền qua navigation state (từ NewsCard click)
  const [article, setArticle] = useState(location.state?.article || null);
  const [loading, setLoading]     = useState(!article);
  const [bookmarked, setBookmarked] = useState(article?.is_bookmarked || false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [related, setRelated]   = useState([]);

  // Nếu không có article trong state → fetch từ API
  useEffect(() => {
    if (article) {
      // Đã có data, mark read
      articlesService.markRead(article.id).catch(() => {});
      setBookmarked(article.is_bookmarked);
      return;
    }
    // Không có state → fetch list với id để tìm bài
    setLoading(true);
    articlesService.getArticles({ only_my_keywords: false, size: 100, page: 1 })
      .then((data) => {
        const found = data.items?.find((a) => String(a.id) === String(id));
        if (found) {
          setArticle(found);
          setBookmarked(found.is_bookmarked);
          articlesService.markRead(found.id).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // Lấy related articles (cùng source type)
  useEffect(() => {
    if (!article) return;
    articlesService.getArticles({ only_my_keywords: false, size: 5, page: 1 })
      .then((data) => {
        setRelated((data.items || []).filter((a) => a.id !== article.id).slice(0, 4));
      })
      .catch(() => {});
  }, [article?.id]);

  const handleBookmark = async () => {
    if (!article) return;
    setBookmarkLoading(true);
    try {
      if (bookmarked) {
        await articlesService.removeBookmark(article.id);
        setBookmarked(false);
      } else {
        await articlesService.addBookmark(article.id);
        setBookmarked(true);
      }
    } catch (e) {
      console.warn('Bookmark error:', e);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share && article) {
      navigator.share({ title: article.title, url: article.url || window.location.href })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
        <Loader2 size={32} style={{ color: 'var(--brand-500)', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Đang tải bài viết...</span>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📄</div>
        <div className="empty-title">Không tìm thấy bài viết</div>
        <div className="empty-sub">Bài viết này có thể đã bị xóa hoặc không tồn tại</div>
        <button className="btn btn-primary" onClick={() => nav(-1)} style={{ marginTop: 20 }}>
          <ArrowLeft size={14} /> Quay lại
        </button>
      </div>
    );
  }

  // Lấy source info từ article.sources[0] nếu có
  const firstSource = article.sources?.[0];
  const srcName = firstSource?.source_name || DEFAULT_SRC.name;
  const srcColor = DEFAULT_SRC.color;
  const srcBg    = DEFAULT_SRC.bg;
  const srcIcon  = DEFAULT_SRC.icon;

  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <a onClick={() => nav('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</a>
        <ChevronRight size={12} className="breadcrumb-sep" />
        <a onClick={() => nav(-1)} style={{ cursor: 'pointer' }}>Tin tức</a>
        <ChevronRight size={12} className="breadcrumb-sep" />
        <span style={{ color: 'var(--text-primary)', fontWeight: 600, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {article.title?.slice(0, 40)}…
        </span>
      </div>

      <div className="article-layout">
        {/* Main */}
        <div>
          <article className="article-card">
            {/* Cover image or gradient */}
            <div style={{
              height: 200,
              background: article.image_url
                ? 'none'
                : 'linear-gradient(135deg, #eff6ff, #dbeafe)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 'var(--space-6)',
              overflow: 'hidden',
            }}>
              {article.image_url ? (
                <img src={article.image_url} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 72, filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.08))' }}>📰</span>
              )}
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span className="news-source-tag" style={{ background: srcColor }}>
                {srcIcon} {srcName}
              </span>
              {article.matched_keywords?.length > 0 && article.matched_keywords.map((kw) => {
                const matched = isTagMatched(kw, currentQ);
                return (
                  <span
                    key={kw}
                    onClick={() => nav(`/news/all?q=${encodeURIComponent(kw)}`)}
                    style={{
                      fontSize: 11,
                      fontWeight: matched ? 700 : 600,
                      padding: '2px 9px',
                      borderRadius: 'var(--radius-full)',
                      background: matched
                        ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                        : 'var(--bg-surface-2)',
                      color: matched ? '#ffffff' : 'var(--text-secondary)',
                      border: matched ? '1px solid #1d4ed8' : '1px solid var(--border)',
                      cursor: 'pointer',
                      boxShadow: matched
                        ? '0 2px 8px rgba(37, 99, 235, 0.4), 0 0 0 2px rgba(59, 130, 246, 0.2)'
                        : 'none',
                      transition: 'all 0.15s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                    title={`Bấm để tìm bài viết với từ khóa #${kw}`}
                  >
                    {matched && <span style={{ fontSize: 9 }}>⚡</span>}
                    #{kw}
                  </span>
                );
              })}
            </div>

            <h1 className="article-title">{article.title}</h1>

            {/* Excerpt / AI summary */}
            {article.excerpt && (
              <div style={{
                display: 'flex',
                gap: 10,
                padding: '14px 16px',
                background: 'linear-gradient(135deg, rgba(244,114,182,0.07), rgba(167,139,250,0.07))',
                border: '1px solid rgba(167,139,250,0.25)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-6)',
              }}>
                <div>
                  <span className="ai-badge" style={{ marginBottom: 6, display: 'inline-flex' }}>
                    <Cpu size={9} /> Tóm tắt
                  </span>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {article.excerpt}
                  </p>
                </div>
              </div>
            )}

            {/* Metadata row */}
            <div style={{
              display: 'flex', gap: 20, flexWrap: 'wrap',
              padding: '12px 0',
              borderTop: '1px solid var(--border-subtle)',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: 'var(--space-6)',
              fontSize: 12, color: 'var(--text-muted)',
            }}>
              {publishedDate && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Calendar size={12} /> {publishedDate}
                </span>
              )}
              {article.sources?.length > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Globe size={12} /> {article.sources.length} nguồn đăng
                </span>
              )}
            </div>

            {/* Multi-source switcher */}
            {article.sources?.length > 1 && (
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  🔗 Xem từ nguồn khác:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {article.sources.map((s) => (
                    <a
                      key={s.article_id}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '5px 12px', borderRadius: 'var(--radius-full)',
                        background: 'var(--bg-surface-2)', color: 'var(--brand-600)',
                        fontSize: 11, fontWeight: 600,
                        border: '1px solid var(--border)',
                        textDecoration: 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      <ExternalLink size={10} /> {s.source_name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 'var(--space-6)' }}>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ gap: 6 }}
                id="btn-read-original"
              >
                <ExternalLink size={14} /> Xem bài gốc
              </a>
              <button
                className={`btn ${bookmarked ? 'btn-primary' : 'btn-secondary'}`}
                style={{ gap: 6 }}
                id="btn-bookmark"
                onClick={handleBookmark}
                disabled={bookmarkLoading}
              >
                {bookmarkLoading
                  ? <Loader2 size={14} style={{ animation: 'spin 0.6s linear infinite' }} />
                  : bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                {bookmarked ? 'Đã lưu' : 'Lưu lại'}
              </button>
              <button className="btn btn-secondary" style={{ gap: 6 }} id="btn-share" onClick={handleShare}>
                <Share2 size={14} /> Chia sẻ
              </button>
              <button className="btn btn-ghost" onClick={() => nav(-1)} id="btn-back" style={{ marginLeft: 'auto', gap: 6 }}>
                <ArrowLeft size={14} /> Quay lại
              </button>
            </div>
          </article>
        </div>

        {/* Sidebar */}
        <div>
          {/* Source info */}
          <div className="article-sidebar-card">
            <div className="article-sidebar-title">
              <span>{srcIcon}</span> Về {srcName}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Bài viết được thu thập tự động từ nguồn tin {srcName} thông qua hệ thống BIS Crawler.
            </p>
            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  marginTop: 12, fontSize: 12, fontWeight: 600,
                  color: srcColor, textDecoration: 'none',
                }}
              >
                <ExternalLink size={11} /> Xem bài gốc
              </a>
            )}
          </div>

          {/* Matched keywords */}
          {article.matched_keywords?.length > 0 && (
            <div className="article-sidebar-card">
              <div className="article-sidebar-title">🏷️ Từ Khóa Khớp</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {article.matched_keywords.map((kw) => {
                  const matched = isTagMatched(kw, currentQ);
                  return (
                    <span
                      key={kw}
                      onClick={() => nav(`/news/all?q=${encodeURIComponent(kw)}`)}
                      style={{
                        fontSize: 11,
                        fontWeight: matched ? 700 : 600,
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: matched
                          ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                          : 'var(--brand-50)',
                        color: matched ? '#ffffff' : 'var(--brand-700)',
                        border: matched ? '1px solid #1d4ed8' : '1px solid var(--brand-200)',
                        cursor: 'pointer',
                        boxShadow: matched
                          ? '0 2px 6px rgba(37, 99, 235, 0.35)'
                          : 'none',
                        transition: 'all 0.15s ease',
                      }}
                      title={`Bấm để tìm bài viết với từ khóa #${kw}`}
                    >
                      {matched ? '⚡ ' : ''}#{kw}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Related articles */}
          {related.length > 0 && (
            <div className="article-sidebar-card">
              <div className="article-sidebar-title">📰 Bài Viết Liên Quan</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {related.map((ra) => (
                  <div
                    key={ra.id}
                    style={{
                      display: 'flex', gap: 10, padding: '10px 6px',
                      borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onClick={() => nav(`/article/${ra.id}`, { state: { article: ra } })}
                    id={`related-${ra.id}`}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, flexShrink: 0,
                    }}>
                      📰
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {ra.title}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}>
                        {ra.published_at ? new Date(ra.published_at).toLocaleDateString('vi-VN') : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
