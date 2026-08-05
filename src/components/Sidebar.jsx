import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Newspaper, Globe, Building2, ShoppingBag,
  Settings, Tag, Bookmark, Bot, ShieldCheck, Loader2, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCrawl } from '../context/CrawlContext';

const navItems = [
  { to: '/dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard', badge: null },
  { to: '/news/all',  icon: <Newspaper size={16} />,       label: 'Tất Cả Tin',  badge: null },
];

const sourceNavItems = [
  { to: '/news/press',     icon: <Newspaper size={16} />,   label: 'Báo Chí',           badge: null, color: '#3b82f6' },
  { to: '/news/adb',       icon: <Building2 size={16} />,   label: 'ADB (Châu Á)',      badge: null, color: '#f59e0b' },
  { to: '/news/worldbank', icon: <Globe size={16} />,        label: 'World Bank',        badge: null, color: '#10b981' },
  { to: '/news/gov',       icon: <ShoppingBag size={16} />, label: 'Đấu Thầu Công',    badge: null, color: '#8b5cf6' },
];

const toolItems = [
  { to: '/keywords',  icon: <Tag size={16} />,      label: 'Từ Khóa',    badge: null },
  { to: '/bookmarks', icon: <Bookmark size={16} />, label: 'Đã Lưu',     badge: null },
  { to: '/ai-chat',   icon: <Bot size={16} />,      label: 'Trợ Lý AI',  badge: null, highlight: true },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, isPersonalUser } = useAuth();
  const { isCrawling } = useCrawl();
  const location = useLocation();
  const isUpgradePage = location.pathname === '/upgrade';

  const filteredNavItems = navItems.filter(item => {
    if (isPersonalUser && item.to === '/dashboard') return false;
    return true;
  });

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Main Nav */}
      <div className="sidebar-section">
        <div className="sidebar-label">Chính</div>
        {filteredNavItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            id={`sidebar-${item.to.replace(/\//g, '-').slice(1)}`}
            onClick={() => onClose?.()}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
            {item.badge != null && <span className="nav-badge">{item.badge}</span>}
          </NavLink>
        ))}
      </div>

      <div className="sidebar-divider" />

      {/* Sources */}
      <div className="sidebar-section">
        <div className="sidebar-label">Nguồn Dữ Liệu</div>

        {/* 1. Unlocked Source: Báo Chí */}
        <NavLink
          to="/news/press"
          id="sidebar-news-press"
          onClick={() => onClose?.()}
          className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
        >
          <span style={{ color: '#3b82f6' }}><Newspaper size={16} /></span>
          Báo Chí
        </NavLink>

        {/* 2. Locked Sources (ADB, World Bank, Đấu Thầu) với hiệu ứng trượt mở/đóng mượt mà */}
        {isPersonalUser ? (
          <div style={{
            maxHeight: isUpgradePage ? 200 : 0,
            opacity: isUpgradePage ? 1 : 0,
            overflow: 'hidden',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: isUpgradePage ? 'auto' : 'none',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            {sourceNavItems.filter(s => s.to !== '/news/press').map(item => (
              <NavLink
                key={item.to}
                to="/upgrade"
                id={`sidebar-${item.to.replace(/\//g, '-').slice(1)}`}
                onClick={() => onClose?.()}
                className={() => "sidebar-nav-item locked-item"}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 6, opacity: 0.9, whiteSpace: 'nowrap', padding: '9px 10px'
                }}
                title="Tính năng có phí — Bấm để xem gói nâng cấp"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', minWidth: 0 }}>
                  <span style={{ color: item.color, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 500 }}>{item.label}</span>
                </div>
                <span className="upgrade-badge" style={{
                  marginLeft: 'auto', flexShrink: 0, whiteSpace: 'nowrap',
                  fontSize: 9, fontWeight: 800, padding: '2px 5px', height: 20,
                  display: 'inline-flex', alignItems: 'center', gap: 2,
                  borderRadius: 6, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a'
                }}>
                  🔒 NÂNG CẤP
                </span>
              </NavLink>
            ))}
          </div>
        ) : (
          sourceNavItems.filter(s => s.to !== '/news/press').map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              id={`sidebar-${item.to.replace(/\//g, '-').slice(1)}`}
              onClick={() => onClose?.()}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <span style={{ color: item.color }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))
        )}
      </div>

      <div className="sidebar-divider" />

      {/* Tools */}
      <div className="sidebar-section">
        <div className="sidebar-label">Công Cụ</div>
        
        {/* Unlocked Tools: Từ Khóa, Đã Lưu */}
        {toolItems.filter(t => t.to !== '/ai-chat').map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            id={`sidebar-${item.to.replace(/\//g, '-').slice(1)}`}
            onClick={() => onClose?.()}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}

        {/* Locked Tool: Trợ Lý AI với hiệu ứng trượt mở/đóng mượt mà */}
        {isPersonalUser ? (
          <div style={{
            maxHeight: isUpgradePage ? 60 : 0,
            opacity: isUpgradePage ? 1 : 0,
            overflow: 'hidden',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: isUpgradePage ? 'auto' : 'none',
          }}>
            <NavLink
              to="/upgrade"
              id="sidebar-ai-chat"
              onClick={() => onClose?.()}
              className={() => "sidebar-nav-item locked-item"}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 6, opacity: 0.9, whiteSpace: 'nowrap', padding: '9px 10px'
              }}
              title="Tính năng có phí — Bấm để xem gói nâng cấp"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', minWidth: 0 }}>
                <span style={{ color: '#a855f7', flexShrink: 0 }}><Bot size={16} /></span>
                <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 500 }}>Trợ Lý AI</span>
              </div>
              <span className="upgrade-badge" style={{
                marginLeft: 'auto', flexShrink: 0, whiteSpace: 'nowrap',
                fontSize: 9, fontWeight: 800, padding: '2px 5px', height: 20,
                display: 'inline-flex', alignItems: 'center', gap: 2,
                borderRadius: 6, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a'
              }}>
                🔒 NÂNG CẤP
              </span>
            </NavLink>
          </div>
        ) : (
          <NavLink
            to="/ai-chat"
            id="sidebar-ai-chat"
            onClick={() => onClose?.()}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            style={{ position: 'relative' }}
          >
            <span style={{ color: '#a855f7' }}><Bot size={16} /></span>
            Trợ Lý AI
            <span style={{
              marginLeft: 'auto',
              fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 8,
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              color: 'white', letterSpacing: '0.3px',
            }}>AI</span>
          </NavLink>
        )}

        {isAdmin && (
          <NavLink
            to="/admin"
            id="sidebar-admin"
            onClick={() => onClose?.()}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            style={{ color: '#2563eb', fontWeight: 700, marginTop: 4 }}
          >
            <ShieldCheck size={16} style={{ color: '#2563eb' }} />
            Quản Trị Admin
            <span style={{
              marginLeft: 'auto',
              fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 8,
              background: '#dbeafe', color: '#1d4ed8',
            }}>PRO</span>
          </NavLink>
        )}

        {isPersonalUser && (
          <NavLink
            to="/upgrade"
            id="sidebar-upgrade"
            onClick={() => onClose?.()}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            style={{
              marginTop: 6, fontWeight: 800,
              background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(236,72,153,0.12))',
              border: '1px solid rgba(168,85,247,0.3)', color: '#9333ea',
            }}
          >
            <Zap size={16} style={{ color: '#a855f7' }} />
            Nâng Cấp Tính Năng
            <span style={{
              marginLeft: 'auto',
              fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 8,
              background: 'linear-gradient(135deg, #a855f7, #ec4899)', color: 'white',
            }}>HOT</span>
          </NavLink>
        )}
      </div>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <NavLink
          to="/settings"
          id="sidebar-settings"
          className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
        >
          <Settings size={16} />
          Cài đặt
        </NavLink>

        {/* System status */}
        <div style={{
          marginTop: 12,
          padding: '10px 12px',
          background: isCrawling ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-surface-2)',
          borderRadius: 'var(--radius-md)',
          border: isCrawling ? '1px solid rgba(129, 140, 248, 0.4)' : '1px solid var(--border-subtle)',
          transition: 'all 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            {isCrawling ? (
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: '#818cf8',
                animation: 'crawlPulse 1.5s infinite', display: 'inline-block'
              }} />
            ) : (
              <span style={{
                width: 7, height: 7, borderRadius: '50%', background: '#10b981',
                boxShadow: '0 0 6px #10b981', animation: 'pulse 2s infinite'
              }} />
            )}
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: isCrawling ? '#818cf8' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              {isCrawling ? (
                <>
                  <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite', color: '#818cf8' }} />
                  Đang crawl dữ liệu...
                </>
              ) : (
                'Hệ thống hoạt động'
              )}
            </span>
          </div>
          <div style={{ fontSize: 10, color: isCrawling ? '#a5b4fc' : 'var(--text-muted)', fontWeight: isCrawling ? 600 : 400 }}>
            {isCrawling ? (isPersonalUser ? 'Đang quét Báo chí...' : 'Đang quét Báo chí, WB, ADB & Đấu thầu...') : 'AI Crawler: Online · Crawl mỗi 4h'}
          </div>
          {user && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
              👤 {user.display_name || user.email}
              {isAdmin && ' · 👑 Admin'}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
