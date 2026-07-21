// src/pages/LoginPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

// Random floating particles
function Particles() {
  const items = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left:  `${Math.random() * 100}%`,
    delay: `${Math.random() * 8}s`,
    duration: `${6 + Math.random() * 8}s`,
    size:  `${3 + Math.random() * 5}px`,
    opacity: 0.15 + Math.random() * 0.35,
  }));
  return (
    <div className="particles">
      {items.map(p => (
        <span key={p.id} className="particle" style={{
          left: p.left,
          bottom: '-10px',
          width: p.size,
          height: p.size,
          animationDelay: p.delay,
          animationDuration: p.duration,
          opacity: p.opacity,
        }} />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const { login, loginError, setLoginError } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setLoginError(''); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // simulate API
    const ok = login(email, password);
    setLoading(false);
    if (ok) nav('/dashboard');
  };

  const fillDemo = (type) => {
    if (type === 'admin') { setEmail('admin@iih.vn'); setPassword('iih2026'); }
    else                  { setEmail('demo@iih.vn');  setPassword('demo123'); }
  };

  return (
    <div className="login-page">
      <Particles />

      {/* Orbs */}
      <div className="login-bg-orb" style={{
        width: 400, height: 400, top: -100, left: -100,
        background: 'radial-gradient(circle, rgba(37,99,235,0.3) 0%, transparent 70%)',
        animationDelay: '0s', animationDuration: '7s'
      }} />
      <div className="login-bg-orb" style={{
        width: 300, height: 300, bottom: -80, right: -60,
        background: 'radial-gradient(circle, rgba(13,148,136,0.25) 0%, transparent 70%)',
        animationDelay: '3s', animationDuration: '8s'
      }} />
      <div className="login-bg-orb" style={{
        width: 200, height: 200, top: '40%', right: '10%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
        animationDelay: '1.5s', animationDuration: '6s'
      }} />

      {/* Theme toggle top-right */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 20 }}>
        <ThemeToggle />
      </div>

      {/* Card */}
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-mark">IIH</div>
          <div className="login-title">Trung Tâm Thông Tin Tích Hợp</div>
          <div className="login-subtitle">Integrated Intelligence Hub · Đăng nhập để tiếp tục</div>
        </div>

        {/* AI badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          background: 'linear-gradient(135deg, rgba(244,114,182,0.1), rgba(167,139,250,0.1))',
          border: '1px solid rgba(167,139,250,0.3)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 20,
        }}>
          <Cpu size={13} style={{ color: '#a78bfa' }} />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
            Hệ thống AI Crawler đang hoạt động · Dữ liệu cập nhật mỗi 30 phút
          </span>
          <span style={{
            marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
            background: '#10b981', boxShadow: '0 0 6px #10b981', flexShrink: 0,
            animation: 'pulse 2s infinite'
          }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="input-email">Email</label>
            <input
              id="input-email"
              type="email"
              className="form-input"
              placeholder="admin@iih.vn"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="input-password">Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <input
                id="input-password"
                type={showPw ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                id="btn-toggle-password"
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', padding: 4, borderRadius: 4,
                  transition: 'color 0.15s',
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {loginError && (
            <div style={{
              padding: '10px 14px',
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              color: '#e11d48',
              marginBottom: 12,
              fontWeight: 500,
            }}>
              ⚠️ {loginError}
            </div>
          )}

          <button
            type="submit"
            className="login-btn"
            id="btn-login-submit"
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" /> Đang đăng nhập...</>
              : <><LogIn size={16} /> Đăng nhập hệ thống</>}
          </button>
        </form>

        {/* Demo hint */}
        <div className="login-demo-hint">
          <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)', fontSize: 11 }}>
            🔑 TÀI KHOẢN DEMO
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              id="btn-demo-admin"
              style={{
                fontSize: 11, padding: '4px 12px',
                background: 'var(--brand-100)', color: 'var(--brand-700)',
                borderRadius: 'var(--radius-full)', fontWeight: 600,
                border: '1px solid var(--brand-200)', cursor: 'pointer',
              }}
            >
              Admin: admin@iih.vn / iih2026
            </button>
            <button
              type="button"
              onClick={() => fillDemo('viewer')}
              id="btn-demo-viewer"
              style={{
                fontSize: 11, padding: '4px 12px',
                background: '#f5f3ff', color: '#6d28d9',
                borderRadius: 'var(--radius-full)', fontWeight: 600,
                border: '1px solid #ddd6fe', cursor: 'pointer',
              }}
            >
              Demo: demo@iih.vn / demo123
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
