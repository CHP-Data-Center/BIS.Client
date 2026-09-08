// src/components/NotificationDropdown.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, Trash2, FileText,
  Newspaper, AlertCircle, Sparkles, ChevronRight, Clock,
  Building2, Globe
} from 'lucide-react';
import { articlesService } from '../services/articles';
import { adminService } from '../services/admin';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { getSourceStyle } from '../utils/sourceStyle';

export default function NotificationDropdown() {
  const { user, isSuperAdmin, isRegionalAdmin } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [localReadIds, setLocalReadIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('bis_read_notifs') || '[]'));
    } catch {
      return new Set();
    }
  });
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  function formatTimeAgo(dateStr) {
    if (!dateStr) return lang === 'vi' ? 'Gần đây' : lang === 'ja' ? '最近' : 'Recent';
    try {
      const diffSec = Math.floor((new Date() - new Date(dateStr)) / 1000);
      if (isNaN(diffSec) || diffSec < 60) {
        return lang === 'vi' ? 'Vừa xong' : lang === 'ja' ? 'たった今' : 'Just now';
      }
      if (diffSec < 3600) {
        const m = Math.floor(diffSec / 60);
        return lang === 'vi' ? `${m} phút trước` : lang === 'ja' ? `${m}分前` : `${m}m ago`;
      }
      if (diffSec < 86400) {
        const h = Math.floor(diffSec / 3600);
        return lang === 'vi' ? `${h} giờ trước` : lang === 'ja' ? `${h}時間前` : `${h}h ago`;
      }
      const d = Math.floor(diffSec / 86400);
      return lang === 'vi' ? `${d} ngày trước` : lang === 'ja' ? `${d}日前` : `${d}d ago`;
    } catch {
      return lang === 'vi' ? 'Gần đây' : lang === 'ja' ? '最近' : 'Recent';
    }
  }

  // Fetch notifications
  const loadNotifications = useCallback(async (force = false) => {
    if (!user) {
      setNotifications([]);
      return;
    }

    try {
      const items = [];

      // 1. If Admin / SuperAdmin: check pending sources
      if (isSuperAdmin || isRegionalAdmin) {
        try {
          const pending = isSuperAdmin ? await adminService.getPendingSources().catch(() => []) : [];
          if (pending && pending.length > 0) {
            const pId = `pending_sources_${pending.length}_${pending[0]?.id}`;
            items.push({
              id: pId,
              type: 'pending_source',
              title: lang === 'vi'
                ? `Có ${pending.length} nguồn tin chờ phê duyệt`
                : lang === 'ja'
                ? `承認待ちソースが ${pending.length} 件あります`
                : `${pending.length} sources pending review`,
              desc: `${pending[0]?.name || 'Nguồn tin'} (${pending[0]?.region || 'Chưa phân vùng'})`,
              time: lang === 'vi' ? 'Cần xử lý' : lang === 'ja' ? '要対応' : 'Action needed',
              link: '/admin',
              isUrgent: true,
              isRead: localReadIds.has(pId),
            });
          }
        } catch {
          // ignore admin call error
        }
      }

      // 2. Fetch latest articles & bidding notices
      const articlesData = await articlesService.getArticles({ size: 12, sort: 'newest' }, force).catch(() => null);
      if (articlesData?.items && Array.isArray(articlesData.items)) {
        articlesData.items.forEach((art) => {
          const style = getSourceStyle(art);
          const isRead = Boolean(art.is_read || localReadIds.has(`art_${art.id}`) || localReadIds.has(art.id));
          const snippet = art.excerpt ? (art.excerpt.length > 90 ? art.excerpt.slice(0, 90) + '...' : art.excerpt) : '';
          const sourceLabel = style.name || art.sources?.[0]?.source_name || '';

          // Determine clean item type
          let itemType = 'news';
          if (style.icon === '📋') itemType = 'bidding';
          else if (style.icon === '🏦') itemType = 'adb';
          else if (style.icon === '🌍') itemType = 'worldbank';

          items.push({
            id: `art_${art.id}`,
            articleId: art.id,
            type: itemType,
            sourceStyle: style,
            title: art.title,
            desc: snippet ? (sourceLabel ? `${sourceLabel}: ${snippet}` : snippet) : sourceLabel,
            sourceLabel,
            time: formatTimeAgo(art.published_at || art.fetched_at),
            link: `/article/${art.id}`,
            isRead,
            articleData: art,
          });
        });
      }

      setNotifications(items);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    }
  }, [user, isSuperAdmin, isRegionalAdmin, lang, localReadIds]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(() => loadNotifications(false), 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = async () => {
    const allIds = notifications.map(n => n.id);
    const unreadArticleIds = notifications
      .filter(n => !n.isRead && n.articleId)
      .map(n => n.articleId);

    // 1. Optimistic UI update
    setLocalReadIds(prev => {
      const next = new Set([...prev, ...allIds, ...unreadArticleIds]);
      try {
        localStorage.setItem('bis_read_notifs', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });

    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    // 2. Sync to backend
    try {
      await articlesService.markAllRead(unreadArticleIds.length > 0 ? unreadArticleIds : null);
    } catch (e) {
      console.warn('Failed to sync mark all read:', e);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      // Optimistic update
      setLocalReadIds(prev => {
        const next = new Set([...prev, notif.id, notif.articleId].filter(Boolean));
        try {
          localStorage.setItem('bis_read_notifs', JSON.stringify(Array.from(next)));
        } catch {}
        return next;
      });

      setNotifications(prev =>
        prev.map(n => (n.id === notif.id ? { ...n, isRead: true } : n))
      );

      if (notif.articleId) {
        articlesService.markRead(notif.articleId).catch(() => {});
      }
    }

    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const renderIcon = (item) => {
    if (item.type === 'pending_source') {
      return <AlertCircle size={15} style={{ color: '#f59e0b' }} />;
    }
    if (item.type === 'bidding') {
      return <FileText size={15} style={{ color: '#2563eb' }} />;
    }
    if (item.type === 'adb') {
      return <Building2 size={15} style={{ color: '#d97706' }} />;
    }
    if (item.type === 'worldbank') {
      return <Globe size={15} style={{ color: '#047857' }} />;
    }
    return <Newspaper size={15} style={{ color: '#2563eb' }} />;
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        className="notif-btn"
        id="btn-notifications"
        title={t('header.notifications')}
        onClick={() => {
          const nextState = !isOpen;
          setIsOpen(nextState);
          if (nextState) loadNotifications(true);
        }}
        style={{
          width: 38, height: 38, borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isOpen ? 'var(--brand-50)' : 'var(--bg-surface-2)',
          border: `1.5px solid ${isOpen ? 'var(--brand-300)' : 'var(--border)'}`,
          color: isOpen ? 'var(--brand-600)' : 'var(--text-secondary)',
          cursor: 'pointer', position: 'relative', transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 12px rgba(37,99,235,0.15)' : 'none',
        }}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -3, right: -3,
            minWidth: 18, height: 18, padding: '0 4px',
            borderRadius: 10, background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: 'white', fontSize: 10.5, fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg-surface)',
            boxShadow: '0 2px 6px rgba(239,68,68,0.4)',
            animation: 'pulse 2s infinite',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Popover */}
      {isOpen && (
        <div style={{
          position: 'absolute', top: 48, right: 0, width: 370,
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 20, boxShadow: '0 16px 48px rgba(15,23,42,0.22)',
          zIndex: 9999, overflow: 'hidden', animation: 'fadeIn 0.2s ease-out',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, background: '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb'
              }}>
                <Bell size={15} />
              </div>
              <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>
                {t('header.notifications')}
              </span>
              {unreadCount > 0 && (
                <span style={{
                  fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 12,
                  background: '#fef2f2', color: '#ef4444', border: '1px solid #fecdd3',
                }}>
                  {unreadCount}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'none', border: 'none', color: '#2563eb',
                  fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
                  borderRadius: 6, transition: 'background 0.15s',
                }}
                title={t('header.markAllRead')}
              >
                <CheckCheck size={14} /> {t('header.markAllRead')}
              </button>
            )}
          </div>

          {/* Notification List */}
          <div style={{ maxHeight: 360, overflowY: 'auto', padding: '6px 0' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Sparkles size={24} style={{ margin: '0 auto 8px', color: '#a1a1aa' }} />
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t('header.noNotifications')}</div>
              </div>
            ) : (
              notifications.map(item => {
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    style={{
                      padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start',
                      background: item.isRead ? 'transparent' : 'rgba(37, 99, 235, 0.04)',
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer', transition: 'background 0.15s', position: 'relative',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = item.isRead ? 'var(--bg-surface-2)' : 'rgba(37, 99, 235, 0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = item.isRead ? 'transparent' : 'rgba(37, 99, 235, 0.04)'}
                  >
                    {/* Unread dot */}
                    {!item.isRead && (
                      <span style={{
                        position: 'absolute', left: 6, top: 18, width: 6, height: 6,
                        borderRadius: '50%', background: '#2563eb',
                        boxShadow: '0 0 6px rgba(37,99,235,0.7)',
                      }} />
                    )}

                    {/* Icon container */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: item.isUrgent ? '#fffbeb' : (item.sourceStyle?.bg || 'var(--bg-surface-2)'),
                      border: `1px solid ${item.isUrgent ? '#fde68a' : (item.sourceStyle?.border || 'var(--border-subtle)')}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
                    }}>
                      {renderIcon(item)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12.5,
                        fontWeight: item.isRead ? 600 : 800,
                        color: item.isRead ? 'var(--text-secondary)' : 'var(--text-primary)',
                        lineHeight: 1.4, marginBottom: 3,
                        overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {item.title}
                      </div>

                      {item.desc && (
                        <div style={{
                          fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.35,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          marginBottom: 4,
                        }}>
                          {item.desc}
                        </div>
                      )}

                      <div style={{
                        fontSize: 10.5, color: 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 6, fontWeight: 600,
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} /> {item.time}
                        </span>
                        {item.sourceLabel && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                            background: item.sourceStyle?.bg || 'var(--bg-surface-2)',
                            color: item.sourceStyle?.color || 'var(--text-muted)',
                            border: `1px solid ${item.sourceStyle?.border || 'transparent'}`,
                          }}>
                            {item.sourceLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '10px 16px', borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5,
          }}>
            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              style={{
                background: 'none', border: 'none',
                color: unreadCount > 0 ? 'var(--text-secondary)' : 'var(--text-muted)',
                fontWeight: 600, cursor: unreadCount > 0 ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', gap: 4,
                opacity: unreadCount > 0 ? 1 : 0.5,
              }}
            >
              <Trash2 size={12} /> {t('header.markAllRead')}
            </button>

            <button
              onClick={() => { setIsOpen(false); navigate('/news/all'); }}
              style={{
                background: 'none', border: 'none', color: '#2563eb',
                fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {lang === 'vi' ? 'Xem tất cả tin tức' : lang === 'ja' ? 'すべてのニュースを見る' : 'View all news'} <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
