// src/components/NotificationDropdown.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, Trash2, ExternalLink, FileText,
  Newspaper, AlertCircle, Zap, Sparkles, X, ChevronRight, Clock, ShieldAlert
} from 'lucide-react';
import { articlesService } from '../services/articles';
import { adminService } from '../services/admin';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

export default function NotificationDropdown() {
  const { user, isSuperAdmin, isRegionalAdmin } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bis_read_notifs') || '[]');
    } catch {
      return [];
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

  // Fetch notifications
  const loadNotifications = async () => {
    try {
      const items = [];

      // 1. If Admin / SuperAdmin: check pending sources
      if (isSuperAdmin || isRegionalAdmin) {
        const pending = isSuperAdmin ? await adminService.getPendingSources().catch(() => []) : [];
        if (pending && pending.length > 0) {
          items.push({
            id: `pending_sources_${pending.length}_${pending[0]?.id}`,
            type: 'pending_source',
            title: `📥 ${pending.length} pending sources`,
            desc: `"${pending[0]?.name || 'Source'}" (${pending[0]?.region || 'Region'}).`,
            time: 'Urgent',
            link: '/admin',
            isUrgent: true,
          });
        }
      }

      // 2. Fetch latest articles
      const articlesData = await articlesService.getArticles({ size: 5, sort: 'newest' }).catch(() => null);
      if (articlesData && articlesData.items) {
        articlesData.items.slice(0, 4).forEach((art, idx) => {
          const isGov = art.source_type === 'gov';
          items.push({
            id: `art_${art.id}`,
            type: isGov ? 'bidding' : 'news',
            title: isGov ? `📋 ${art.title}` : `📰 ${art.title}`,
            desc: art.summary ? (art.summary.length > 80 ? art.summary.slice(0, 80) + '...' : art.summary) : (art.source_name || ''),
            time: art.published_at ? formatTimeAgo(art.published_at) : `${(idx + 1) * 15}m`,
            link: `/article/${art.id}`,
            articleData: art,
          });
        });
      }

      // 3. System status notification
      items.push({
        id: 'sys_crawl_status_ok',
        type: 'system',
        title: '⚡ Auto Crawler Active',
        desc: 'BIS background crawler runs every 4 hours.',
        time: 'Today',
        link: '/dashboard',
      });

      setNotifications(items);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, [user]);

  const unreadList = notifications.filter(n => !readIds.includes(n.id));
  const unreadCount = unreadList.length;

  const handleMarkAllRead = () => {
    const allIds = notifications.map(n => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    localStorage.setItem('bis_read_notifs', JSON.stringify(updated));
  };

  const handleNotificationClick = (notif) => {
    if (!readIds.includes(notif.id)) {
      const updated = [...readIds, notif.id];
      setReadIds(updated);
      localStorage.setItem('bis_read_notifs', JSON.stringify(updated));
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleClearAll = () => {
    const allIds = notifications.map(n => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    localStorage.setItem('bis_read_notifs', JSON.stringify(updated));
  };

  function formatTimeAgo(dateStr) {
    try {
      const diffSec = Math.floor((new Date() - new Date(dateStr)) / 1000);
      if (diffSec < 60) return lang === 'vi' ? 'Vừa xong' : lang === 'ja' ? 'たった今' : 'Just now';
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
      return lang === 'vi' ? 'Vừa xong' : lang === 'ja' ? 'たった今' : 'Just now';
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'pending_source':
        return <AlertCircle size={16} style={{ color: '#f59e0b' }} />;
      case 'bidding':
        return <FileText size={16} style={{ color: '#8b5cf6' }} />;
      case 'news':
        return <Newspaper size={16} style={{ color: '#3b82f6' }} />;
      case 'system':
      default:
        return <Zap size={16} style={{ color: '#10b981' }} />;
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        className="notif-btn"
        id="btn-notifications"
        title={t('header.notifications')}
        onClick={() => {
          setIsOpen(o => !o);
          if (!isOpen) loadNotifications();
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
          position: 'absolute', top: 48, right: 0, width: 360,
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
                  display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px',
                  borderRadius: 6, transition: 'background 0.15s',
                }}
                title={t('header.markAllRead')}
              >
                <CheckCheck size={14} /> {t('header.markAllRead')}
              </button>
            )}
          </div>

          {/* Notification List */}
          <div style={{ maxHeight: 340, overflowY: 'auto', padding: '6px 0' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Sparkles size={24} style={{ margin: '0 auto 8px', color: '#a1a1aa' }} />
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t('header.noNotifications')}</div>
              </div>
            ) : (
              notifications.map(item => {
                const isRead = readIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    style={{
                      padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start',
                      background: isRead ? 'transparent' : 'rgba(37, 99, 235, 0.04)',
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer', transition: 'background 0.15s', position: 'relative',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isRead ? 'var(--bg-surface-2)' : 'rgba(37, 99, 235, 0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = isRead ? 'transparent' : 'rgba(37, 99, 235, 0.04)'}
                  >
                    {/* Unread dot */}
                    {!isRead && (
                      <span style={{
                        position: 'absolute', left: 6, top: 18, width: 6, height: 6,
                        borderRadius: '50%', background: '#2563eb',
                      }} />
                    )}

                    {/* Icon container */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: item.isUrgent ? '#fffbeb' : 'var(--bg-surface-2)',
                      border: `1px solid ${item.isUrgent ? '#fde68a' : 'var(--border-subtle)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
                    }}>
                      {getIcon(item.type)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12.5, fontWeight: isRead ? 600 : 800,
                        color: 'var(--text-primary)',
                        lineHeight: 1.4, marginBottom: 3,
                        overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {item.title}
                      </div>

                      <div style={{
                        fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.35,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {item.desc}
                      </div>

                      <div style={{
                        fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4,
                        display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600,
                      }}>
                        <Clock size={10} /> {item.time}
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
              onClick={handleClearAll}
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <Trash2 size={12} /> Đánh dấu tất cả đã đọc
            </button>

            <button
              onClick={() => { setIsOpen(false); navigate('/news/all'); }}
              style={{
                background: 'none', border: 'none', color: '#2563eb',
                fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              Xem tất cả tin tức <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
