// src/components/Header.jsx
import { useState, useRef, useEffect } from 'react';
import { Menu, X, Search, LogOut, User, Settings, ChevronDown, LogIn, Zap, Clock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import NotificationDropdown from './NotificationDropdown';
import logoImg from '../assets/logo.png';
import { SapphireDiamondSvg, SapphireStarSvg, LuxuryCrownSvg, LuxuryMoneyBagSvg } from './common/ThemeFxOverlay';

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

function getHeaderParticleSpec(i) {
  // Probabilities for Header Rain:
  // ~25% CỰC TO / HUGE (40px - 54px)
  // ~35% TO VỪA / LARGE (22px - 34px)
  // ~40% NHỎ / SMALL (11px - 16px)
  const seed = (Math.sin(i * 17.1234 + 43.567) * 43758.5453) % 1;
  const rand = Math.abs(seed);

  if (rand < 0.25) {
    const norm = rand / 0.25;
    const size = 40 + Math.floor(norm * 15); // 40px - 55px
    const opacity = 0.95;
    return { size, opacity, tier: 'huge' };
  } else if (rand < 0.60) {
    const norm = (rand - 0.25) / 0.35;
    const size = 22 + Math.floor(norm * 13); // 22px - 35px
    const opacity = 0.82;
    return { size, opacity, tier: 'large' };
  } else {
    const norm = (rand - 0.60) / 0.40;
    const size = 11 + Math.floor(norm * 6); // 11px - 17px
    const opacity = 0.55;
    return { size, opacity, tier: 'small' };
  }
}

const TRAJECTORIES = [
  { rotStart: '0deg', rotEnd: '0deg', driftX: '0px' },        // Rơi thẳng xuôi (0°)
  { rotStart: '35deg', rotEnd: '50deg', driftX: '18px' },     // Rơi nghiêng xuôi (35°)
  { rotStart: '170deg', rotEnd: '190deg', driftX: '-15px' },  // Rơi ngược (180°)
  { rotStart: '-45deg', rotEnd: '-55deg', driftX: '-22px' },  // Rơi nghiêng trái (-45°)
  { rotStart: '0deg', rotEnd: '360deg', driftX: '20px' },     // Rơi xoay tròn 360°
  { rotStart: '-140deg', rotEnd: '-120deg', driftX: '12px' }, // Rơi chéo ngược (-135°)
  { rotStart: '85deg', rotEnd: '95deg', driftX: '-28px' },    // Rơi ngang (90°)
  { rotStart: '-18deg', rotEnd: '-10deg', driftX: '0px' },    // Rơi hơi nghiêng (-15°)
];

function HeaderThemeRain() {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-ui-theme') || 'basic');
  const items = useRef(
    Array.from({ length: 26 }).map((_, i) => {
      const spec = getHeaderParticleSpec(i);
      const left = `${(i * 3.8 + (i % 5) * 1.5) % 97}%`;
      const durVal = 3.2 + (i % 6) * 0.65;
      const duration = `${durVal.toFixed(2)}s`;
      // Negative delay ensures particles are ALREADY scattered mid-fall on F5 page refresh (0ms freeze)
      const delay = `-${((i * 0.55) % durVal).toFixed(2)}s`;

      const traj = TRAJECTORIES[i % TRAJECTORIES.length];

      return {
        id: i,
        ...spec,
        left,
        delay,
        duration,
        ...traj,
        goldSymbol: i % 4 === 0 ? 'crown_svg' : i % 4 === 1 ? 'bag_svg' : i % 4 === 2 ? 'crown_svg' : '🪙',
        sapphireSymbol: i % 2 === 0 ? 'diamond_svg' : 'star_svg',
        animeSymbol:
          i % 9 === 0
            ? '🌸'
            : i % 9 === 1
            ? '(˶>⩊<˶)'
            : i % 9 === 2
            ? '💖'
            : i % 9 === 3
            ? 'ദ്ദി ˉ͈̀꒳ˉ͈́ )✧'
            : i % 9 === 4
            ? '🎀'
            : i % 9 === 5
            ? '( • ̀ω•́ )✧'
            : i % 9 === 6
            ? '(≡> ᴗ <≡)'
            : i % 9 === 7
            ? '「キラキラ」'
            : '(≧◡≦)',
      };
    })
  ).current;

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

  if (theme !== 'luxury' && theme !== 'sapphire' && theme !== 'anime') return null;

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
      {items.map((it) => {
        const glowFilter =
          it.tier === 'huge'
            ? theme === 'luxury'
              ? 'drop-shadow(0 6px 18px rgba(234, 179, 8, 0.95)) drop-shadow(0 2px 8px rgba(255, 215, 0, 0.8))'
              : theme === 'anime'
              ? 'drop-shadow(0 6px 18px rgba(244, 114, 182, 0.95))'
              : 'drop-shadow(0 6px 18px rgba(56, 189, 248, 0.95))'
            : it.tier === 'large'
            ? theme === 'luxury'
              ? 'drop-shadow(0 3px 10px rgba(234, 179, 8, 0.8))'
              : theme === 'anime'
              ? 'drop-shadow(0 3px 10px rgba(244, 114, 182, 0.8))'
              : 'drop-shadow(0 3px 10px rgba(56, 189, 248, 0.8))'
            : undefined;

        const renderHeaderSymbol = () => {
          if (theme === 'luxury') {
            if (it.goldSymbol === 'crown_svg') return <LuxuryCrownSvg size={it.size} />;
            if (it.goldSymbol === 'bag_svg') return <LuxuryMoneyBagSvg size={it.size} />;
            return <span style={{ fontSize: it.size, lineHeight: 1 }}>{it.goldSymbol}</span>;
          }

          if (theme === 'anime') {
            if (typeof it.animeSymbol === 'string' && (it.animeSymbol.includes('(') || it.animeSymbol.includes('「') || it.animeSymbol.includes('✧') || it.animeSymbol.length > 2)) {
              return (
                <span style={{ fontSize: Math.min(it.size, 17), fontWeight: 800, color: '#f472b6', whiteSpace: 'nowrap', textShadow: '0 0 8px rgba(244, 114, 182, 0.8)' }}>
                  {it.animeSymbol}
                </span>
              );
            }
            return <span style={{ fontSize: it.size, lineHeight: 1, color: '#f472b6' }}>{it.animeSymbol}</span>;
          }

          // Sapphire / Royal: ONLY pure blue Sapphire SVGs!
          if (it.sapphireSymbol === 'diamond_svg') return <SapphireDiamondSvg size={it.size + 4} />;
          return <SapphireStarSvg size={it.size + 2} />;
        };

        return (
          <div
            key={it.id}
            style={{
              position: 'absolute',
              top: '-90px',
              left: it.left,
              '--particle-opacity': it.opacity,
              '--rot-start': it.rotStart,
              '--rot-end': it.rotEnd,
              '--drift-x': it.driftX,
              animation: `headerParticleFall ${it.duration} linear infinite both`,
              animationDelay: it.delay,
              willChange: 'transform',
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: glowFilter,
            }}
          >
            {renderHeaderSymbol()}
          </div>
        );
      })}
    </div>
  );
}

// Công tắc ngôn ngữ toàn giao diện: menu/nhãn + nội dung tin đổi theo (vi→en→ja).
const LANG_META = { vi: '🇻🇳 VI', en: '🇬🇧 EN', ja: '🇯🇵 JA' };

function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref} style={{ position: 'relative' }}>
      <button
        id="btn-lang-switch"
        onClick={() => setOpen(o => !o)}
        title="Đổi ngôn ngữ / Change language / 言語を変更"
        style={{
          display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
          background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-full)', cursor: 'pointer',
          fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)',
        }}
      >
        {LANG_META[lang] || LANG_META.vi}
        <ChevronDown size={11} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 1000,
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', overflow: 'hidden', minWidth: 150,
        }}>
          {[['vi', '🇻🇳 Tiếng Việt'], ['en', '🇬🇧 English'], ['ja', '🇯🇵 日本語']].map(([code, label]) => (
            <div
              key={code}
              onClick={() => { setLang(code); setOpen(false); }}
              style={{
                padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                fontWeight: lang === code ? 800 : 500,
                color: lang === code ? 'var(--brand-600)' : 'var(--text-primary)',
                background: lang === code ? 'var(--bg-surface-2)' : 'transparent',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-2)'; }}
              onMouseLeave={(e) => { if (lang !== code) e.currentTarget.style.background = 'transparent'; }}
            >
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header({ onToggleSidebar, isSidebarOpen }) {
  const { user, logout, isGuest, isAdmin, isPersonalUser } = useAuth();
  const { t } = useLang();
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
      // Tìm TOÀN CỤC (4 kho, chia mục). Personal user chỉ có Báo Chí → về trang press.
      if (isPersonalUser) nav(`/news/press?q=${encodeURIComponent(searchVal.trim())}`);
      else nav(`/search?q=${encodeURIComponent(searchVal.trim())}`);
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
            placeholder={t('header.searchPlaceholder')}
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>

        {/* Ngôn ngữ giao diện + tin */}
        <LanguageSwitcher />

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
            <LogIn size={13} /> {t('header.login')}
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
                    <ShieldCheck size={14} style={{ color: '#2563eb' }} /> {t('header.adminPanel')}
                  </div>
                )}
                {isPersonalUser && (
                  <div className="user-menu-item" onClick={() => { nav('/upgrade'); setUserMenuOpen(false); }} id="menu-upgrade" style={{ color: '#9333ea', fontWeight: 700 }}>
                    <Zap size={14} style={{ color: '#a855f7' }} /> {t('header.upgradeMenu')}
                  </div>
                )}
                <div className="user-menu-item" onClick={() => { nav('/settings'); setUserMenuOpen(false); }} id="menu-settings">
                  <Settings size={14} /> {t('header.settings')}
                </div>
                <div className="user-menu-item" onClick={() => { nav('/keywords'); setUserMenuOpen(false); }} id="menu-keywords">
                  <User size={14} /> {t('header.myKeywords')}
                </div>
                <div className="user-menu-item danger" onClick={handleLogout} id="menu-logout">
                  <LogOut size={14} /> {t('header.logout')}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
