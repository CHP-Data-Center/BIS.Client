// src/pages/BookmarksPage.jsx
import { useState, useEffect } from 'react';
import { Bookmark, Trash2, ExternalLink, Calendar, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { articlesService } from '../services/articles';

export default function BookmarksPage() {
  const nav = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [removing, setRemoving]   = useState(null);

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

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
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
            Đang tải...
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
        ) : (
          <div>
            {bookmarks.map((bm, i) => (
              <div
                key={bm.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '14px 20px',
                  borderBottom: i < bookmarks.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  transition: 'background 0.15s', cursor: 'pointer',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18,
                }}>
                  🔖
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }} onClick={() => nav(`/article/${bm.article_id}`)}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    Bài viết #{bm.article_id}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {bm.folder && bm.folder !== 'default' && (
                      <span style={{ background: 'var(--bg-surface-2)', padding: '1px 7px', borderRadius: 8, border: '1px solid var(--border)' }}>
                        📁 {bm.folder}
                      </span>
                    )}
                    {bm.created_at && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={10} />
                        {new Date(bm.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => nav(`/article/${bm.article_id}`)}
                    title="Xem bài"
                    style={{ padding: '5px 8px' }}
                  >
                    <ExternalLink size={13} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleRemove(bm.article_id)}
                    title="Bỏ bookmark"
                    id={`btn-remove-bm-${bm.article_id}`}
                    disabled={removing === bm.article_id}
                    style={{ padding: '5px 8px', color: '#ef4444' }}
                  >
                    {removing === bm.article_id
                      ? <Loader2 size={13} style={{ animation: 'spin 0.6s linear infinite' }} />
                      : <Trash2 size={13} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
