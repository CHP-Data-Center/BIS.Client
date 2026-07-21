// src/components/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Newspaper, Globe, Building2, ShoppingBag,
  TrendingUp, BookOpen, Settings, HelpCircle, Cpu
} from 'lucide-react';
import { SOURCES, statsData } from '../data/mockData';

const navItems = [
  { to: '/dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard', badge: null },
  { to: '/news/all',  icon: <Newspaper size={16} />,        label: 'Tất Cả Tin',  badge: statsData.todayArticles },
];

const sourceNavItems = [
  { to: '/news/adb',        icon: <Building2 size={16} />,   label: 'ADB',               badge: null, color: SOURCES.adb.color },
  { to: '/news/worldbank',  icon: <Globe size={16} />,        label: 'World Bank',        badge: null, color: SOURCES.worldbank.color },
  { to: '/news/dauthau',    icon: <ShoppingBag size={16} />, label: 'Đấu Thầu Công',    badge: 3,    color: SOURCES.dauthau.color },
];

const toolItems = [
  { to: '/trending',  icon: <TrendingUp size={16} />,  label: 'Xu Hướng',     badge: null },
  { to: '/reports',   icon: <BookOpen size={16} />,    label: 'Báo Cáo AI',   badge: null },
  { to: '/ai-engine', icon: <Cpu size={16} />,         label: 'AI Engine',    badge: null },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Main Nav */}
      <div className="sidebar-section">
        <div className="sidebar-label">Chính</div>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            id={`sidebar-${item.to.replace(/\//g, '-').slice(1)}`}
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
        {sourceNavItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            id={`sidebar-${item.to.replace(/\//g, '-').slice(1)}`}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <span style={{ color: item.color }}>{item.icon}</span>
            {item.label}
            {item.badge != null && <span className="nav-badge">{item.badge}</span>}
          </NavLink>
        ))}
      </div>

      <div className="sidebar-divider" />

      {/* Tools */}
      <div className="sidebar-section">
        <div className="sidebar-label">Công Cụ</div>
        {toolItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            id={`sidebar-${item.to.replace(/\//g, '-').slice(1)}`}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
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
        <NavLink
          to="/help"
          id="sidebar-help"
          className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
        >
          <HelpCircle size={16} />
          Hỗ trợ
        </NavLink>

        {/* System status */}
        <div style={{
          marginTop: 12,
          padding: '10px 12px',
          background: 'var(--bg-surface-2)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: '#10b981',
              boxShadow: '0 0 6px #10b981',
              animation: 'pulse 2s infinite'
            }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Hệ thống hoạt động</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            AI Engine: Online · Cập nhật {statsData.lastUpdate}
          </div>
        </div>
      </div>
    </aside>
  );
}
