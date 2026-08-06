// src/components/Header.jsx
import { useState, useRef, useEffect } from 'react';
import { Menu, X, Search, LogOut, User, Settings, ChevronDown, LogIn, Zap, Clock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import logoImg from '../assets/logo.png';
import { SapphireDiamondSvg, SapphireStarSvg } from './common/ThemeFxOverlay';

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



function HeaderThemeRain() {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-ui-theme') || 'basic');
  const items = useRef([
    { id: 1,  left: '4%',  symbol: '🪙', isDiamond: true,  delay: '0s',    duration: '3.8s', size: 12 },
    { id: 2,  left: '9%',  symbol: '✨', isDiamond: false, delay: '1.2s',  duration: '4.5s', size: 10 },
    { id: 3,  left: '15%', symbol: '💰', isDiamond: true,  delay: '0.5s',  duration: '4.1s', size: 12 },
    { id: 4,  left: '21%', symbol: '⭐', isDiamond: false, delay: '1.8s',  duration: '4.7s', size: 11 },
    { id: 5,  left: '27%', symbol: '🪙', isDiamond: true,  delay: '0.9s',  duration: '3.6s', size: 13 },
    { id: 6,  left: '33%', symbol: '✨', isDiamond: false, delay: '2.4s',  duration: '4.3s', size: 10 },
    { id: 7,  left: '39%', symbol: '💰', isDiamond: true,  delay: '0.3s',  duration: '4.0s', size: 12 },
    { id: 8,  left: '45%', symbol: '⭐', isDiamond: false, delay: '1.6s',  duration: '4.6s', size: 11 },
    { id: 9,  left: '51%', symbol: '🪙', isDiamond: true,  delay: '2.7s',  duration: '4.2s', size: 13 },
    { id: 10, left: '57%', symbol: '✨', isDiamond: false, delay: '0.8s',  duration: '4.4s', size: 10 },
    { id: 11, left: '63%', symbol: '💰', isDiamond: true,  delay: '1.9s',  duration: '3.9s', size: 12 },
    { id: 12, left: '69%', symbol: '⭐', isDiamond: false, delay: '0.4s',  duration: '4.5s', size: 11 },
    { id: 13, left: '75%', symbol: '🪙', isDiamond: true,  delay: '2.1s',  duration: '4.1s', size: 13 },
    { id: 14, left: '81%', symbol: '✨', isDiamond: false, delay: '1.1s',  duration: '4.7s', size: 10 },
    { id: 15, left: '87%', symbol: '💰', isDiamond: true,  delay: '2.5s',  duration: '4.3s', size: 12 },
    { id: 16, left: '92%', symbol: '⭐', isDiamond: false, delay: '0.7s',  duration: '4.6s', size: 11 },
    { id: 17, left: '96%', symbol: '🪙', isDiamond: true,  delay: '1.5s',  duration: '4.0s', size: 12 },
  ]).current;

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute('data-ui-theme') || 'basic';
      setTheme(current);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-ui-theme'],
    });

    return () => observer.disconnect();
  }, []);

  if (theme !== 'luxury' && theme !== 'sapphire') return null;

  const isLuxury = theme === 'luxury';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 1, // Sitting behind header-left and header-right (zIndex 2)
      }}
    >
      {items.map((it) => (
        <div
          key={it.id}
          style={{
            position: 'absolute',
            top: '-20px',
            left: it.left,
            fontSize: it.size,
            opacity: 0.85,
            animation: `headerParticleFall ${it.duration} ease-in-out infinite`,
            animationDelay: it.delay,
            willChange: 'transform',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isLuxury ? (
            it.symbol
          ) : it.isDiamond ? (
            <SapphireDiamondSvg size={it.size + 5} />
          ) : (
            <SapphireStarSvg size={it.size + 3} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Header({ onToggleSidebar, isSidebarOpen }) {
  const { user, logout, isGuest, isAdmin, isPersonalUser } = useAuth();
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
      const targetSource = isPersonalUser ? 'press' : 'all';
      nav(`/news/${targetSource}?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const displayName = user?.display_name || user?.name || user?.email || 'User';
  const nameParts = displayName.split(' ').filter(Boolean);
  const shortName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : 'User';

  return (
    <header className="header" style={{ position: 'fixed' }}>
      {/* Header Particle Rain for Luxury & Sapphire */}
      <HeaderThemeRain />

      {/* Left */}
      <div className="header-left" style={{ position: 'relative', zIndex: 2 }}>
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

        <div className="header-logo" onClick={() => nav(isPersonalUser ? '/news/press' : '/dashboard')} style={{ cursor: 'pointer' }}>
          <img src={logoImg} alt="BIS Logo" className="logo-img" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
          <div className="logo-text">
            <span className="logo-title">Hệ Thống BIS</span>
            <span className="logo-sub">Bidding Intelligence System</span>
          </div>
        </div>

        <div className="header-divider" style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 4px' }} />

        <LiveClock />
      </div>

      {/* Right */}
      <div className="header-right" style={{ position: 'relative', zIndex: 2 }}>
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
                  <div className="user-role-badge" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    marginTop: 5, padding: '2px 9px',
                    borderRadius: 'var(--radius-full)', fontSize: 10, fontWeight: 800,
                  }}>
                    <Zap size={9} /> {
                      isPersonalUser ? 'NGƯỜI DÙNG CÁ NHÂN'
                      : user?.role === 'super_admin' ? 'SUPER ADMIN'
                      : user?.role === 'admin' ? 'ADMIN PHÂN VÙNG'
                      : user?.role === 'staff' ? 'NHÂN VIÊN'
                      : 'NGƯỜI DÙNG'
                    }
                  </div>
                </div>
                {isAdmin && (
                  <div className="user-menu-item" onClick={() => { nav('/admin'); setUserMenuOpen(false); }} id="menu-admin" style={{ color: '#2563eb', fontWeight: 700 }}>
                    <ShieldCheck size={14} style={{ color: '#2563eb' }} /> Bảng Quản Trị Admin
                  </div>
                )}
                {isPersonalUser && (
                  <div className="user-menu-item" onClick={() => { nav('/upgrade'); setUserMenuOpen(false); }} id="menu-upgrade" style={{ color: '#9333ea', fontWeight: 700 }}>
                    <Zap size={14} style={{ color: '#a855f7' }} /> Nâng Cấp Gói Dịch Vụ
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
