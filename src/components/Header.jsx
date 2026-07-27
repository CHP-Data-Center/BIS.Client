// src/components/Header.jsx
import { useState, useRef, useEffect } from 'react';
import { Menu, X, Search, LogOut, User, Settings, ChevronDown, LogIn, Zap, Clock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import NotificationDropdown from './NotificationDropdown';

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="live-clock" style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '4px 10px',
      background: 'var(--bg-surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-full)',
      fontSize: 11.5, fontWeight: 600,
      color: 'var(--text-secondary)',
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: '0.3px',
    }}>
      <Clock size={11} style={{ color: 'var(--brand-500)', flexShrink: 0 }} />
      {time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </div>
  );
}

export default function Header({ onToggleSidebar, isSidebarOpen }) {
  const { user, logout, isGuest, isAdmin } = useAuth();
  const nav = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const userRef = useRef();

  useEffect(() => {
    const h = (e) => { if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = () => {
    logout();
    nav('/login');
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      nav(`/news/all?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const displayName = user?.display_name || user?.name || user?.email || 'User';
  const nameParts = displayName.split(' ').filter(Boolean);
  const shortName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : 'User';

  return (
    <header className="header">
      {/* Left */}
      <div className="header-left">
        <button
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Menu"
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            padding: 6,
            cursor: 'pointer',
            color: 'var(--text-primary)',
            borderRadius: 6,
          }}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="header-logo" onClick={() => nav('/dashboard')} style={{ cursor: 'pointer' }}>
          <img src="/logo.png" alt="BIS Logo" className="logo-img" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
          <div className="logo-text">
            <span className="logo-title">Hệ Thống BIS</span>
            <span className="logo-sub">Bidding Intelligence System</span>
          </div>
        </div>

        <div className="header-divider" style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 4px' }} />

        <LiveClock />
      </div>

      {/* Right */}
      <div className="header-right">
        {/* Search */}
        <div className="search-bar">
          <Search size={14} className="search-icon" />
          <input
            id="input-search"
            className="search-input"
            placeholder="Tìm kiếm tin tức... (Enter)"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>

        {/* Theme */}
        <ThemeToggle />

        {/* Notification */}
        <NotificationDropdown />

        {/* Guest CTA OR User menu */}
        {isGuest ? (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => nav('/login')}
            id="btn-login-cta"
            style={{
              gap: 6, animation: 'glowPulse 3s ease infinite',
              padding: '7px 16px', fontSize: 12.5,
            }}
          >
            <LogIn size={13} /> Đăng nhập
          </button>
        ) : (
          <div className="relative" ref={userRef}>
            <button
              className="user-avatar-btn"
              onClick={() => setUserMenuOpen(o => !o)}
              id="btn-user-menu"
            >
              <div className="avatar">{user?.initials || 'U'}</div>
              <span className="avatar-name">{shortName}</span>
              <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
            </button>

            {userMenuOpen && (
              <div className="user-menu">
                <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{displayName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    marginTop: 5, padding: '1px 8px',
                    background: 'var(--brand-50)', color: 'var(--brand-700)',
                    borderRadius: 'var(--radius-full)', fontSize: 10, fontWeight: 700,
                    border: '1px solid var(--brand-200)',
                  }}>
                    <Zap size={9} /> {(user?.role || 'user').toUpperCase()}
                  </div>
                </div>
                {isAdmin && (
                  <div className="user-menu-item" onClick={() => { nav('/admin'); setUserMenuOpen(false); }} id="menu-admin" style={{ color: '#2563eb', fontWeight: 700 }}>
                    <ShieldCheck size={14} style={{ color: '#2563eb' }} /> Bảng Quản Trị Admin
                  </div>
                )}
                <div className="user-menu-item" onClick={() => { nav('/settings'); setUserMenuOpen(false); }} id="menu-settings">
                  <Settings size={14} /> Cài đặt
                </div>
                <div className="user-menu-item" onClick={() => { nav('/keywords'); setUserMenuOpen(false); }} id="menu-keywords">
                  <User size={14} /> Từ khóa của tôi
                </div>
                <div className="user-menu-item danger" onClick={handleLogout} id="menu-logout">
                  <LogOut size={14} /> Đăng xuất
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
