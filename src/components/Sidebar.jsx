import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Newspaper, Globe, Building2, ShoppingBag, FileText, ChevronDown,
  Settings, Tag, Bookmark, Bot, ShieldCheck, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

// Nhãn qua khóa i18n (t('nav.…')) — đổi ngôn ngữ giao diện là menu đổi theo.
const navItems = [
  { to: '/dashboard', icon: <LayoutDashboard size={16} />, labelKey: 'nav.dashboard', badge: null },
  { to: '/news/all',  icon: <Newspaper size={16} />,       labelKey: 'nav.allNews',   badge: null },
];

const sourceNavItems = [
  { to: '/news/press',     icon: <Newspaper size={16} />,  labelKey: 'nav.press',     badge: null, color: '#3b82f6' },
  { to: '/news/adb',       icon: <Building2 size={16} />,  labelKey: 'nav.adb',       badge: null, color: '#f59e0b' },
  { to: '/news/worldbank', icon: <Globe size={16} />,       labelKey: 'nav.worldbank', badge: null, color: '#10b981' },
];

// Nhóm "Đấu Thầu Công" — bấm để XỔ RA 2 trang con (TBMT / KHLCNT).
const procurementGroup = {
  labelKey: 'nav.procGroup',
  color: '#8b5cf6',
  icon: <ShoppingBag size={16} />,
  children: [
    { to: '/news/tbmt',   icon: <ShoppingBag size={14} />, labelKey: 'nav.tbmt' },
    { to: '/news/khlcnt', icon: <FileText size={14} />,    labelKey: 'nav.khlcnt' },
  ],
};

const toolItems = [
  { to: '/keywords',  icon: <Tag size={16} />,      labelKey: 'nav.keywords',  badge: null },
  { to: '/bookmarks', icon: <Bookmark size={16} />, labelKey: 'nav.bookmarks', badge: null },
  { to: '/ai-chat',   icon: <Bot size={16} />,      labelKey: 'nav.ai',        badge: null, highlight: true },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, isPersonalUser, isSuperAdmin } = useAuth();
  const { t } = useLang();
  const location = useLocation();
  const isUpgradePage = location.pathname === '/upgrade';

  const userKey = user?.email || user?.id;
  const hasAiAccess = isSuperAdmin || user?.has_ai === true || localStorage.getItem(`bis_ai_package_${userKey}`) === 'true';

  const filteredNavItems = navItems.filter(item => {
    if (isPersonalUser && item.to === '/dashboard') return false;
    return true;
  });

  const procActive = procurementGroup.children.some((c) => location.pathname.startsWith(c.to));
  const [procOpen, setProcOpen] = useState(true);
  const showProcChildren = procOpen || procActive;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Main Nav */}
      <div className="sidebar-section">
        <div className="sidebar-label">{t('nav.main')}</div>
        {filteredNavItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            id={`sidebar-${item.to.replace(/\//g, '-').slice(1)}`}
            onClick={() => onClose?.()}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            {t(item.labelKey)}
            {item.badge != null && <span className="nav-badge">{item.badge}</span>}
          </NavLink>
        ))}
      </div>

      <div className="sidebar-divider" />

      {/* Sources */}
      <div className="sidebar-section">
        <div className="sidebar-label">{t('nav.sources')}</div>

        {/* 1. Unlocked Source: Báo Chí */}
        <NavLink
          to="/news/press"
          id="sidebar-news-press"
          onClick={() => onClose?.()}
          className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
        >
          <span style={{ color: '#3b82f6' }}><Newspaper size={16} /></span>
          {t('nav.press')}
        </NavLink>

        {/* 2. Nguồn trả phí (ADB, World Bank, Đấu Thầu). Personal user: khóa (mở khi vào /upgrade). */}
        {isPersonalUser ? (
          <div style={{
            maxHeight: isUpgradePage ? 260 : 0,
            opacity: isUpgradePage ? 1 : 0,
            overflow: 'hidden',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: isUpgradePage ? 'auto' : 'none',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            {[
              ...sourceNavItems.filter(s => s.to !== '/news/press'),
              { to: '/news/tbmt', icon: <ShoppingBag size={16} />, labelKey: 'nav.procGroup', color: '#8b5cf6' },
            ].map(item => (
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
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 500 }}>{t(item.labelKey)}</span>
                </div>
                <span className="upgrade-badge" style={{
                  marginLeft: 'auto', flexShrink: 0, whiteSpace: 'nowrap',
                  fontSize: 9, fontWeight: 800, padding: '2px 5px', height: 20,
                  display: 'inline-flex', alignItems: 'center', gap: 2,
                  borderRadius: 6, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a'
                }}>
                  {t('badge.upgrade')}
                </span>
              </NavLink>
            ))}
          </div>
        ) : (
          <>
            {sourceNavItems.filter(s => s.to !== '/news/press').map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                id={`sidebar-${item.to.replace(/\//g, '-').slice(1)}`}
                onClick={() => onClose?.()}
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <span style={{ color: item.color }}>{item.icon}</span>
                {t(item.labelKey)}
              </NavLink>
            ))}

            {/* Nhóm "Đấu Thầu Công" — bấm để xổ ra 2 trang con (TBMT/KHLCNT) */}
            <button
              type="button"
              id="sidebar-proc-group"
              onClick={() => setProcOpen(o => !o)}
              className={`sidebar-nav-item ${procActive ? 'group-active' : ''}`}
              style={{ width: '100%', background: 'none', border: 'none', font: 'inherit', textAlign: 'left', cursor: 'pointer' }}
            >
              <span style={{ color: procurementGroup.color }}>{procurementGroup.icon}</span>
              {t(procurementGroup.labelKey)}
              <ChevronDown
                size={14}
                style={{
                  marginLeft: 'auto',
                  transition: 'transform 0.2s ease',
                  transform: showProcChildren ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>
            {showProcChildren && procurementGroup.children.map(child => (
              <NavLink
                key={child.to}
                to={child.to}
                id={`sidebar-${child.to.replace(/\//g, '-').slice(1)}`}
                onClick={() => onClose?.()}
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                style={{ paddingLeft: 24, fontSize: 12.5, whiteSpace: 'nowrap' }}
              >
                <span style={{ color: procurementGroup.color }}>{child.icon}</span>
                {t(child.labelKey)}
              </NavLink>
            ))}
          </>
        )}
      </div>

      <div className="sidebar-divider" />

      {/* Tools */}
      <div className="sidebar-section">
        <div className="sidebar-label">{t('nav.tools')}</div>
        
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
            {t(item.labelKey)}
          </NavLink>
        ))}

        {/* Trợ Lý AI: Kiểm tra quyền AI thực tế (Super Admin hoặc đã đăng ký gói AI) */}
        {hasAiAccess ? (
          <NavLink
            to="/ai-chat"
            id="sidebar-ai-chat"
            onClick={() => onClose?.()}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            style={{ position: 'relative' }}
          >
            <span style={{ color: '#a855f7' }}><Bot size={16} /></span>
            {t('nav.ai')}
            <span style={{
              marginLeft: 'auto',
              fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 8,
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              color: 'white', letterSpacing: '0.3px',
            }}>AI</span>
          </NavLink>
        ) : (
          <NavLink
            to="/upgrade"
            id="sidebar-ai-chat"
            onClick={() => onClose?.()}
            className={() => "sidebar-nav-item locked-item"}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 6, opacity: 0.9, whiteSpace: 'nowrap', padding: '9px 10px'
            }}
            title="Tính năng AI có phí — Bấm để nâng cấp"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', minWidth: 0 }}>
              <span style={{ color: '#a855f7', flexShrink: 0 }}><Bot size={16} /></span>
              <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 500 }}>{t('nav.ai')}</span>
            </div>
            <span className="upgrade-badge" style={{
              marginLeft: 'auto', flexShrink: 0, whiteSpace: 'nowrap',
              fontSize: 9, fontWeight: 800, padding: '2px 5px', height: 20,
              display: 'inline-flex', alignItems: 'center', gap: 2,
              borderRadius: 6, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a'
            }}>
              {t('badge.upgrade')}
            </span>
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
            {t('nav.admin')}
            <span style={{
              marginLeft: 'auto',
              fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 8,
              background: '#dbeafe', color: '#1d4ed8',
            }}>PRO</span>
          </NavLink>
        )}

        {(!isSuperAdmin || isPersonalUser) && (
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
            {t('nav.upgrade')}
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
          {t('nav.settings')}
        </NavLink>
      </div>
    </aside>
  );
}
