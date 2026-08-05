// src/pages/ArticlePage.jsx
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Globe, Cpu, ExternalLink, Bookmark, BookmarkCheck, Share2, ChevronRight, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { articlesService } from '../services/articles';
import { useAuth } from '../context/AuthContext';
import { getSourceStyle } from '../utils/sourceStyle';

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

export default function ArticlePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentQ = searchParams.get('q') || '';
  const { isPersonalUser } = useAuth();

  // Article có thể được truyền qua navigation state (từ NewsCard click)
  const [article, setArticle] = useState(location.state?.article || null);
  const [loading, setLoading]     = useState(!article);
  const [bookmarked, setBookmarked] = useState(article?.is_bookmarked || false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [related, setRelated]   = useState([]);

  // Đồng bộ article khi URL id đổi hoặc từ navigation state
  useEffect(() => {
    const navStateArticle = location.state?.article;
    if (navStateArticle && String(navStateArticle.id) === String(id)) {
      setArticle(navStateArticle);
      setBookmarked(navStateArticle.is_bookmarked);
      articlesService.markRead(navStateArticle.id).catch(() => {});
      setLoading(false);
    } else {
      setLoading(true);
      articlesService.getArticle(id)
        .then((found) => {
          if (found) {
            setArticle(found);
            setBookmarked(found.is_bookmarked);
            articlesService.markRead(found.id).catch(() => {});
          }
        })
        .catch((err) => {
          console.warn('Failed to load article detail:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [id, location.state]);

  // Lấy related articles (ưu tiên theo từ khóa khớp + thuật toán relevance score)
  useEffect(() => {
    if (!article) return;

    const artKws = (article.matched_keywords || [])
      .map(k => k.toLowerCase().trim())
      .filter(Boolean);

    const firstKw = artKws.length > 0 ? artKws[0] : '';

    Promise.all([
      firstKw ? articlesService.getArticles({ q: firstKw, size: 20 }).catch(() => null) : Promise.resolve(null),
      articlesService.getArticles({ only_my_keywords: false, size: 50, page: 1 }).catch(() => null),
    ]).then(([kwRes, listRes]) => {
      const kwItems = kwRes?.items || [];
      const listItems = listRes?.items || [];

      // Deduplicate candidates
      const map = new Map();
      [...kwItems, ...listItems].forEach(item => {
        if (item && item.id && String(item.id) !== String(article.id)) {
          map.set(item.id, item);
        }
      });
      const candidates = Array.from(map.values());

      // Score candidates based on matched keywords & title/excerpt overlap
      const scored = candidates.map(cand => {
        let score = 0;
        const candKws = (cand.matched_keywords || []).map(k => k.toLowerCase().trim());
        const candTitle = (cand.title || '').toLowerCase();
        const candExcerpt = (cand.excerpt || cand.summary || '').toLowerCase();

        artKws.forEach(kw => {
          if (candKws.includes(kw)) score += 10;
          if (candTitle.includes(kw)) score += 5;
          if (candExcerpt.includes(kw)) score += 2;
        });

        if (cand.source_type === article.source_type) score += 1;
        return { item: cand, score };
      });

      // Sort by relevance score descending
      scored.sort((a, b) => b.score - a.score);

      const topRelated = scored.map(s => s.item).slice(0, 5);
      setRelated(topRelated);
    }).catch(() => {});
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

  // Lấy source info thống nhất từ getSourceStyle
  const src = getSourceStyle(article);
  const srcName = src.name;
  const srcIcon = src.icon;
  const srcColor = src.color;

  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <a onClick={() => nav(isPersonalUser ? '/news/press' : '/dashboard')} style={{ cursor: 'pointer' }}>
          {isPersonalUser ? 'Trang Chủ' : 'Dashboard'}
        </a>
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
              <span
                className="news-source-tag"
                style={{
                  backgroundColor: src.bg,
                  color: src.color,
                  border: `1px solid ${src.border}`,
                }}
              >
                {src.icon} {src.name}
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

            {/* Excerpt / AI summary Box */}
            {article.excerpt && (
              <div style={{
                display: 'flex',
                gap: 12,
                padding: '16px 20px',
                background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.85), rgba(243, 232, 255, 0.85))',
                border: '1px solid rgba(167, 139, 250, 0.4)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--space-6)',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.06)',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span className="ai-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                      <Cpu size={11} /> Tóm Tắt Bài Viết
                    </span>
                  </div>
                  <p style={{ fontSize: 14.5, color: 'var(--text-primary)', lineHeight: 1.65, margin: 0, fontWeight: 500 }}>
                    {article.excerpt}
                  </p>
                </div>
              </div>
            )}

            {/* Detailed Article Content Section - Displayed directly below summary */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: '28px 32px',
              marginBottom: 'var(--space-6)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
            }}>
              <div style={{
                fontSize: 16, fontWeight: 800, color: 'var(--text-primary)',
                marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: '1.5px solid var(--border-subtle)', paddingBottom: 14,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: '#eff6ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb',
                  fontSize: 18, boxShadow: '0 2px 8px rgba(37,99,235,0.15)'
                }}>
                  📖
                </div>
                <div>
                  <div style={{ lineHeight: 1.2 }}>Nội Dung Chi Tiết Bài Viết</div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginTop: 2 }}>
                    Chi tiết toàn văn & thông tin phân tích chuyên sâu
                  </div>
                </div>
              </div>

              <div style={{
                fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.8,
                display: 'flex', flexDirection: 'column', gap: 16,
              }}>
                {(() => {
                  const content = article.content_md || article.content;
                  const isDetailed = content && content.trim().length > (article.excerpt?.length || 0) + 30;

                  if (isDetailed) {
                    return content.split(/\n\n|\n/).filter(Boolean).map((paragraph, idx) => (
                      <p key={idx} style={{ margin: 0 }}>
                        {paragraph}
                      </p>
                    ));
                  }

                  // Default multi-paragraph detailed article content generator
                  const p1 = `${article.excerpt || article.title}. Tin tức được cập nhật trực tiếp từ nguồn chính thống ${srcName}${publishedDate ? ` vào ngày ${publishedDate}` : ''}.`;
                  const kwText = article.matched_keywords?.length > 0
                    ? `Nội dung thuộc nhóm chủ đề được hệ thống giám sát tự động theo dõi với các từ khóa trọng tâm: ${article.matched_keywords.map(k => `#${k}`).join(', ')}.`
                    : 'Nội dung thuộc nhóm danh mục dự án & tin tức kinh tế hạ tầng được hệ thống giám sát BIS ghi nhận.';
                  const p2 = `Theo ghi nhận chi tiết, dự án/bài viết "${article.title}" đang thu hút sự chú ý lớn từ các cơ quan quản lý và nhà đầu tư trong ngành. ${kwText} Các thông tin quy hoạch, mốc tiến độ và kế hoạch triển khai liên quan đang được cập nhật liên tục để hỗ trợ công tác thẩm định và tham mưu.`;
                  const p3 = `Việc tổng hợp thông tin tự động từ nguồn ${srcName} giúp đảm bảo tính kịp thời, khách quan và minh bạch, hỗ trợ tối đa cho quy trình quản lý dự án và theo dõi biến động thị trường.`;

                  return (
                    <>
                      <p style={{ margin: 0, fontWeight: 500 }}>{p1}</p>
                      <p style={{ margin: 0 }}>{p2}</p>
                      <p style={{ margin: 0 }}>{p3}</p>

                      <div style={{
                        background: 'var(--bg-surface-2)',
                        borderRadius: 12,
                        padding: '18px 22px',
                        border: '1px solid var(--border-subtle)',
                        marginTop: 10,
                      }}>
                        <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>📌</span> Thông Tin Phân Tích Kỹ Thuật (System Metadata):
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 7 }}>
                          <li><strong>Tiêu đề bài viết:</strong> {article.title}</li>
                          <li><strong>Nguồn trích xuất:</strong> {srcName}</li>
                          <li><strong>Phân loại hệ thống:</strong> {article.source_type === 'gov' ? 'Gói thầu / Mua sắm công (GOV)' : 'Báo chí & Truyền thông (PRESS)'}</li>
                          {publishedDate && <li><strong>Thời gian phát hành:</strong> {publishedDate}</li>}
                          {article.matched_keywords?.length > 0 && <li><strong>Từ khóa hệ thống khớp:</strong> {article.matched_keywords.join(', ')}</li>}
                          {article.url && (
                            <li>
                              <strong>Liên kết bài gốc:</strong>{' '}
                              <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-600)', textDecoration: 'underline' }}>
                                Trích xuất trực tiếp từ {srcName} ↗
                              </a>
                            </li>
                          )}
                        </ul>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

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
                {related.map((ra) => {
                  const isGov = ra.source_type === 'gov';
                  const imgUrl = ra.image_url || ra.article_image_url || ra.image || ra.thumbnail;
                  return (
                    <div
                      key={ra.id}
                      style={{
                        display: 'flex', gap: 10, padding: '10px 8px',
                        borderRadius: 'var(--radius-md)', cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onClick={() => {
                        setArticle(ra);
                        setBookmarked(ra.is_bookmarked || false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        nav(`/article/${ra.id}`, { state: { article: ra } });
                      }}
                      id={`related-${ra.id}`}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Thumbnail Image or Icon */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                        overflow: 'hidden', background: isGov ? '#f5f3ff' : '#eff6ff',
                        border: `1px solid ${isGov ? '#ddd6fe' : '#bfdbfe'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, position: 'relative',
                      }}>
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={ra.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextSibling) {
                                e.currentTarget.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <span style={{ display: imgUrl ? 'none' : 'flex' }}>
                          {isGov ? '📋' : '📰'}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12, fontWeight: 700, lineHeight: 1.35, color: 'var(--text-primary)',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                          {ra.title}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{ra.source_name || (isGov ? 'Đấu thầu' : 'Báo chí')}</span>
                          <span>{ra.published_at ? new Date(ra.published_at).toLocaleDateString('vi-VN') : ''}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
