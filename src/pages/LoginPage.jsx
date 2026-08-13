// src/pages/LoginPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Cpu, Mail, Lock, ShieldCheck, Sparkles, X, Loader2, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/auth';
import { syncUserTheme } from '../utils/theme';
import logoImg from '../assets/logo.png';


// Google Icon Component
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
    </svg>
  );
}

// Floating particles background
function Particles() {
  const items = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 8}s`,
    duration: `${6 + Math.random() * 10}s`,
    size: `${3 + Math.random() * 5}px`,
    opacity: 0.15 + Math.random() * 0.45,
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
  const { user, login, loginWithGoogle, loginError, setLoginError, isLoggedIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Reset password modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [resetNewPw, setResetNewPw] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setShowResetModal(true);
    }
    if (params.get('session_expired') === '1') {
      setLoginError('Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.');
    } else {
      setLoginError('');
    }
    // Sync active theme from user context or last active active user theme
    syncUserTheme(user);
  }, [user]);

  const handleSendForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      await authService.forgotPassword(forgotEmail.trim());
      setForgotSuccess(true);
    } catch (err) {
      setForgotSuccess(true);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetToken.trim() || !resetNewPw) return;
    setResetLoading(true);
    setResetMsg(null);
    try {
      await authService.resetPassword(resetToken.trim(), resetNewPw);
      setResetMsg({ type: 'success', text: 'Đặt lại mật khẩu thành công! Hãy đăng nhập với mật khẩu mới.' });
      setTimeout(() => {
        setShowResetModal(false);
        setResetNewPw('');
      }, 2500);
    } catch (err) {
      setResetMsg({ type: 'error', text: err.response?.data?.detail || 'Token đặt lại không hợp lệ hoặc đã hết hạn.' });
    } finally {
      setResetLoading(false);
    }
  };


  // Redirect if logged in
  useEffect(() => {
    if (isLoggedIn) {
      const target = user?.role === 'personal' ? '/news/press' : '/dashboard';
      nav(target, { replace: true });
    }
  }, [isLoggedIn, user]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setFieldErrors({ email: '', password: '' });

    const trimmedEmail = email.trim();
    let hasError = false;
    const newFieldErrors = { email: '', password: '' };

    if (!trimmedEmail) {
      newFieldErrors.email = 'Vui lòng nhập email công việc.';
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        newFieldErrors.email = 'Định dạng email không hợp lệ.';
        hasError = true;
      }
    }

    if (!password) {
      newFieldErrors.password = 'Vui lòng nhập mật khẩu.';
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(newFieldErrors);
      if (newFieldErrors.email && newFieldErrors.password) {
        setLoginError('Vui lòng điền đầy đủ email và mật khẩu.');
      } else {
        setLoginError(newFieldErrors.email || newFieldErrors.password);
      }
      return;
    }

    setLoading(true);
    const userObj = await login(trimmedEmail, password);
    setLoading(false);
    if (userObj) {
      const target = userObj.role === 'personal' ? '/news/press' : '/dashboard';
      nav(target, { replace: true });
    }
  };

  const handleGoogleLogin = async () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '227924702568-q0kmobftaj5crfve5vu9tmr6kkl2vvec.apps.googleusercontent.com';
    setLoginError('');
    setFieldErrors({ email: '', password: '' });

    if (!googleClientId) {
      setLoginError('Chưa cấu hình VITE_GOOGLE_CLIENT_ID trong môi trường.');
      return;
    }

    if (!window.google?.accounts) {
      setLoginError('Thư viện Google OAuth đang tải, vui lòng thử lại sau giây lát.');
      return;
    }

    setGoogleLoading(true);

    try {
      if (window.google.accounts.oauth2) {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (response) => {
            if (response && response.access_token) {
              let userInfo = null;
              try {
                const uRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${response.access_token}` }
                });
                if (uRes.ok) userInfo = await uRes.json();
              } catch (e) {
                console.warn('Browser fetch userinfo error:', e);
              }
              const userObj = await loginWithGoogle(null, response.access_token, userInfo);
              setGoogleLoading(false);
              if (userObj) {
                const target = userObj.role === 'personal' ? '/news/press' : '/dashboard';
                nav(target, { replace: true });
              }
            } else {
              setGoogleLoading(false);
              if (response?.error !== 'popup_closed_by_user') {
                setLoginError('Đăng nhập Google không thành công.');
              }
            }
          },
          error_callback: (err) => {
            setGoogleLoading(false);
            setLoginError('Đã xảy ra lỗi khi mở đăng nhập Google.');
          },
        });
        tokenClient.requestAccessToken();
      } else if (window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (response && response.credential) {
              const userObj = await loginWithGoogle(response.credential, null);
              setGoogleLoading(false);
              if (userObj) {
                const target = userObj.role === 'personal' ? '/news/press' : '/dashboard';
                nav(target, { replace: true });
              }
            } else {
              setGoogleLoading(false);
              if (response?.error !== 'popup_closed_by_user') {
                setLoginError('Không lấy được thông tin đăng nhập từ Google.');
              }
            }
          },
        });
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setGoogleLoading(false);
          }
        });
      }
    } catch (err) {
      setGoogleLoading(false);
      setLoginError('Lỗi Đăng nhập Google: ' + (err.message || err));
    }
  };

  const fillDemo = () => {
    setLoginError('');
    setFieldErrors({ email: '', password: '' });
    setEmail('admin@ckjvn.vn');
    setPassword('Admin@12345');
  };

  return (
    <div className="login-page">
      <Particles />

      {/* Dynamic Ambient Background Orbs */}
      <div className="login-bg-orb" style={{
        width: 480, height: 480, top: -140, left: -140,
        background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(37,99,235,0.05) 60%, transparent 70%)',
        animationDelay: '0s', animationDuration: '8s'
      }} />
      <div className="login-bg-orb" style={{
        width: 380, height: 380, bottom: -100, right: -80,
        background: 'radial-gradient(circle, rgba(20,184,166,0.3) 0%, rgba(13,148,136,0.05) 60%, transparent 70%)',
        animationDelay: '3s', animationDuration: '9s'
      }} />
      <div className="login-bg-orb" style={{
        width: 260, height: 260, top: '35%', right: '8%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, rgba(139,92,246,0.05) 60%, transparent 70%)',
        animationDelay: '1.5s', animationDuration: '7s'
      }} />


      {/* Main Glassmorphism Card */}
      <div className="login-card">
        {/* Logo Header */}
        <div className="login-logo">
          <div className="login-logo-container">
            <img
              src={logoImg}
              alt="BIS Logo"
              className="login-logo-img"
            />
          </div>
          <div className="login-title">Bidding Intelligence System</div>
          <div className="login-subtitle">Hệ Thống Thông Tin Đấu Thầu Thông Minh</div>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          className="login-btn-google"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          id="btn-google-login"
        >
          {googleLoading ? (
            <><span className="spinner spinner-dark" /> Đang kết nối Google...</>
          ) : (
            <><GoogleIcon /> <span>Đăng nhập bằng Google</span></>
          )}
        </button>

        {/* Divider */}
        <div className="auth-divider">
          <span>hoặc tiếp tục với email</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="input-email">Email công việc</label>
            <div className="form-input-wrapper">
              <Mail className="form-input-icon" size={17} />
              <input
                id="input-email"
                type="email"
                className={`form-input form-input-has-icon ${fieldErrors.email ? 'form-input-error' : ''}`}
                placeholder="admin@ckjvn.vn"
                value={email}
                onInvalid={(e) => e.preventDefault()}
                onChange={e => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                  if (loginError) setLoginError('');
                }}
                autoComplete="username"
              />
            </div>
            {fieldErrors.email && (
              <div className="field-error-text">⚠️ {fieldErrors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="input-password">Mật khẩu</label>
            <div className="form-input-wrapper">
              <Lock className="form-input-icon" size={17} />
              <input
                id="input-password"
                type={showPw ? 'text' : 'password'}
                className={`form-input form-input-has-icon ${fieldErrors.password ? 'form-input-error' : ''}`}
                placeholder="••••••••"
                value={password}
                onInvalid={(e) => e.preventDefault()}
                onChange={e => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                  if (loginError) setLoginError('');
                }}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                id="btn-toggle-password"
                className="btn-toggle-pw"
                title={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && (
              <div className="field-error-text">⚠️ {fieldErrors.password}</div>
            )}
          </div>

          {/* Options: Remember me & Forgot PW */}
          <div className="form-options">
            <label className="remember-me-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <a href="#forgot" onClick={(e) => { e.preventDefault(); setShowForgotModal(true); setForgotSuccess(false); setForgotEmail(''); }} className="forgot-link">
              Quên mật khẩu?
            </a>
          </div>

          {loginError && (
            <div className="login-error-alert">
              ⚠️ {loginError}
            </div>
          )}

          <button
            type="submit"
            className="login-btn"
            id="btn-login-submit"
            disabled={loading || googleLoading}
          >
            {loading ? (
              <><span className="spinner" /> Đang xác thực...</>
            ) : (
              <><LogIn size={17} /> <span>Đăng nhập hệ thống</span></>
            )}
          </button>
        </form>

        {/* Demo Fast Login Shortcut — Chỉ hiển thị khi chạy ở Localhost */}
        {(import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
          <div className="login-demo-hint">
            <div className="demo-hint-title">
              <ShieldCheck size={13} style={{ color: 'var(--brand-600)' }} />
              <span>TÀI KHOẢN DÙNG THỬ (DEV ONLY)</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setEmail('superadmin@ckjvn.vn');
                  setPassword('SuperAdmin@12345');
                }}
                id="btn-demo-superadmin"
                className="btn-demo-acc"
              >
                👑 Super Admin: superadmin@ckjvn.vn
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@ckjvn.vn');
                  setPassword('Admin@12345');
                }}
                id="btn-demo-admin"
                className="btn-demo-acc"
              >
                ⚡ Admin Doanh Nghiệp: admin@ckjvn.vn
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('personal@ckjvn.vn');
                  setPassword('User@12345');
                }}
                id="btn-demo-user"
                className="btn-demo-acc"
              >
                👤 User Cá Nhân: personal@ckjvn.vn
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Centered Modal Popup: Quên mật khẩu ── */}


      {showForgotModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
        onClick={() => setShowForgotModal(false)}
        >
          <div
            style={{
              width: '100%', maxWidth: 460, background: 'var(--bg-surface)',
              borderRadius: 24, padding: 32, border: '1px solid var(--border)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.35)', position: 'relative',
              color: 'var(--text-primary)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowForgotModal(false)}
              style={{
                position: 'absolute', top: 18, right: 18, background: 'transparent',
                border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 6,
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14, background: 'var(--brand-50)',
                color: 'var(--brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <KeyRound size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Quên Mật Khẩu</h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Gửi link đặt lại mật khẩu qua email</div>
              </div>
            </div>

            {forgotSuccess ? (
              <div style={{
                padding: '16px 20px', borderRadius: 16, background: '#f0fdf4',
                border: '1.5px solid #86efac', color: '#15803d', fontSize: 13.5, fontWeight: 700,
                textAlign: 'center', marginTop: 12,
              }}>
                <CheckCircle2 size={32} style={{ margin: '0 auto 8px', color: '#16a34a' }} />
                Yêu cầu đã được ghi nhận. Nếu email tồn tại trong hệ thống, link hướng dẫn sẽ được gửi đến hòm thư của bạn.
              </div>
            ) : (
              <form onSubmit={handleSendForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
                <div>
                  <label className="form-label">Nhập email tài khoản của bạn *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="vi-du@company.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="login-btn"
                  disabled={forgotLoading}
                  style={{ marginTop: 8 }}
                >
                  {forgotLoading ? <><Loader2 size={16} className="spin" /> Đang gửi...</> : 'Gửi link khôi phục'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Centered Modal Popup: Đặt lại mật khẩu ── */}
      {showResetModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
        onClick={() => setShowResetModal(false)}
        >
          <div
            style={{
              width: '100%', maxWidth: 460, background: 'var(--bg-surface)',
              borderRadius: 24, padding: 32, border: '1px solid var(--border)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.35)', position: 'relative',
              color: 'var(--text-primary)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowResetModal(false)}
              style={{
                position: 'absolute', top: 18, right: 18, background: 'transparent',
                border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 6,
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14, background: 'var(--brand-50)',
                color: 'var(--brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <KeyRound size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Đặt Lai Mật Khẩu</h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tạo mật khẩu mới cho tài khoản</div>
              </div>
            </div>

            {resetMsg && (
              <div style={{
                padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, marginBottom: 16,
                background: resetMsg.type === 'success' ? '#f0fdf4' : '#fff1f2',
                border: `1.5px solid ${resetMsg.type === 'success' ? '#86efac' : '#fca5a5'}`,
                color: resetMsg.type === 'success' ? '#15803d' : '#b91c1c',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {resetMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {resetMsg.text}
              </div>
            )}

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Token khôi phục *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Mã token nhận qua email"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Mật khẩu mới *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="≥ 8 ký tự"
                  value={resetNewPw}
                  onChange={(e) => setResetNewPw(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="login-btn"
                disabled={resetLoading}
                style={{ marginTop: 8 }}
              >
                {resetLoading ? <><Loader2 size={16} className="spin" /> Đang xử lý...</> : 'Cập nhật mật khẩu mới'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


