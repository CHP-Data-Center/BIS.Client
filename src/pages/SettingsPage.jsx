// src/pages/SettingsPage.jsx
import { useState } from 'react';
import { Settings, Lock, Mail, Clock, Loader2, Check, ShieldCheck, User, Sparkles, KeyRound, BellRing, CheckCircle2, AlertCircle, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { authService } from '../services/auth';
import { settingsService } from '../services/settings';
import animeBg from '../assets/anime_bg.png';
import basicBg from '../assets/theme_basic_bg.png';
import classicBg from '../assets/theme_classic_bg.png';
import sapphireBg from '../assets/theme_sapphire_bg.png';
import luxuryBg from '../assets/theme_luxury_bg.png';

import { getUserTheme, setUserTheme, isThemeUnlocked } from '../utils/theme';
import AdminDigestConfig from '../components/AdminDigestConfig';

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const { t } = useLang();
  const nav = useNavigate();

  // Saved theme state
  const [savedTheme, setSavedTheme] = useState(() => getUserTheme(user));

  const handleApplySavedTheme = (themeKey) => {
    setSavedTheme(themeKey);
    setUserTheme(user, themeKey);
  };

  // Password state
  const [oldPw, setOldPw]       = useState('');
  const [newPw, setNewPw]       = useState('');
  const [newPw2, setNewPw2]     = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg]       = useState(null);

  // Digest settings state
  const [digestEnabled, setDigestEnabled] = useState(user?.email_digest_enabled ?? false);
  const [digestHour, setDigestHour]       = useState(user?.digest_hour ?? 8);
  const [timezone, setTimezone]           = useState(user?.timezone ?? 'Asia/Ho_Chi_Minh');
  const [digestLoading, setDigestLoading] = useState(false);
  const [digestMsg, setDigestMsg]         = useState(null);
  const [runLoading, setRunLoading]       = useState(false);
  const [runResult, setRunResult]         = useState(null);

  const showMsg = (setter, type, text) => {
    setter({ type, text });
    setTimeout(() => setter(null), 4500);
  };

  const handleChangePw = async (e) => {
    e.preventDefault();
    if (newPw !== newPw2) {
      showMsg(setPwMsg, 'error', 'Mật khẩu mới không khớp.');
      return;
    }
    if (newPw.length < 8) {
      showMsg(setPwMsg, 'error', 'Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    setPwLoading(true);
    try {
      await authService.changePassword(oldPw, newPw);
      setOldPw(''); setNewPw(''); setNewPw2('');
      showMsg(setPwMsg, 'success', 'Đổi mật khẩu thành công!');
    } catch (err) {
      showMsg(setPwMsg, 'error', err.response?.data?.detail || 'Mật khẩu hiện tại không đúng.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleSaveDigest = async () => {
    setDigestLoading(true);
    try {
      await settingsService.updateSettings({
        email_digest_enabled: digestEnabled,
        digest_hour: Number(digestHour),
        timezone,
      });
      showMsg(setDigestMsg, 'success', 'Đã lưu cấu hình Email Digest!');
    } catch (err) {
      showMsg(setDigestMsg, 'error', err.response?.data?.detail || 'Không thể lưu cài đặt.');
    } finally {
      setDigestLoading(false);
    }
  };

  const handleRunDigest = async () => {
    setRunLoading(true);
    setRunResult(null);
    try {
      const res = await settingsService.runDigestNow();
      setRunResult(res);
    } catch (err) {
      showMsg(setDigestMsg, 'error', err.response?.data?.detail || 'Không thể gửi email digest.');
    } finally {
      setRunLoading(false);
    }
  };

  const Alert = ({ msg }) => !msg ? null : (
    <div style={{
      padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, marginBottom: 16,
      background: msg.type === 'success' ? '#f0fdf4' : '#fff1f2',
      border: `1.5px solid ${msg.type === 'success' ? '#86efac' : '#fca5a5'}`,
      color: msg.type === 'success' ? '#15803d' : '#b91c1c',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {msg.text}
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      {/* ── Profile Hero Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        borderRadius: 24, padding: '28px 32px', color: 'white',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 12px 36px rgba(15,23,42,0.25)',
        marginBottom: 28, border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
      }}>
        {/* Glow ambient orbs */}
        <div style={{ position: 'absolute', right: -40, top: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: '20%', bottom: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, zIndex: 1 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 900, color: 'white',
            boxShadow: '0 6px 20px rgba(59,130,246,0.45)',
            border: '2.5px solid rgba(255,255,255,0.3)',
          }}>
            {user?.initials || 'U'}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
              {user?.name || user?.email}
              {isAdmin ? (
                <span style={{
                  fontSize: 10.5, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                  background: 'linear-gradient(135deg, #f59e0b, #ec4899)', color: 'white',
                  letterSpacing: '0.5px', boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
                }}>
                  👑 ADMIN
                </span>
              ) : (
                <span style={{
                  fontSize: 10.5, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.15)', color: '#93c5fd',
                  letterSpacing: '0.5px',
                }}>
                  👤 USER
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span>✉️ {user?.email}</span>
              <span>•</span>
              <span style={{ color: '#4ade80', fontWeight: 600 }}>🟢 Đã xác thực JWT</span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <button
            className="btn"
            onClick={() => nav('/admin')}
            style={{
              zIndex: 1, gap: 8, padding: '11px 22px', borderRadius: 14,
              background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
              color: 'white', fontWeight: 800, fontSize: 13.5, border: 'none',
              boxShadow: '0 6px 20px rgba(37,99,235,0.45)', cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <ShieldCheck size={18} /> {t('header.adminPanel')}
          </button>
        )}
      </div>

      {/* ── 2-Column Grid Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
        {/* Left Column: Password & Security */}
        <div className="card settings-card" style={{
          borderRadius: 20, padding: 28,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{
                width: 42, height: 42, borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-500)',
              }}>
                <KeyRound size={22} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>{t('settings.passwordTab')}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('settings.passwordSub')}</div>
              </div>
            </div>

            <Alert msg={pwMsg} />

            <form onSubmit={handleChangePw} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">{t('settings.oldPassword')} *</label>
                <input
                  id="input-old-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={oldPw}
                  onChange={(e) => setOldPw(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <div>
                <label className="form-label">{t('settings.newPassword')} *</label>
                <input
                  id="input-new-password"
                  type="password"
                  className="form-input"
                  placeholder="≥ 8 ký tự..."
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="form-label">{t('settings.confirmNewPassword')} *</label>
                <input
                  id="input-confirm-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={newPw2}
                  onChange={(e) => setNewPw2(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={pwLoading}
                style={{ gap: 8, marginTop: 4, height: 44, justifyContent: 'center', fontSize: 13.5, fontWeight: 800 }}
                id="btn-change-password"
              >
                {pwLoading ? <Loader2 size={16} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Lock size={16} />}
                {t('settings.updatePasswordBtn')}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Email Digest Notifications */}
        <div className="card settings-card" style={{
          borderRadius: 20, padding: 28,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{
                width: 42, height: 42, borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-500)',
              }}>
                <BellRing size={22} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>{t('settings.digestTab')}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('settings.digestSub')}</div>
              </div>
            </div>

            <Alert msg={digestMsg} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
                borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>{t('settings.digestEnable')}</div>
                </div>

                <input
                  type="checkbox"
                  checked={digestEnabled}
                  onChange={(e) => setDigestEnabled(e.target.checked)}
                  style={{ width: 22, height: 22, accentColor: 'var(--brand-500)', cursor: 'pointer' }}
                  id="toggle-digest-enabled"
                />
              </div>

              {digestEnabled && (
                <>
                  <div>
                    <label className="form-label">{t('settings.digestHour')}</label>
                    <input
                      type="number" min={0} max={23}
                      className="form-input"
                      value={digestHour}
                      onChange={(e) => setDigestHour(e.target.value)}
                      id="input-digest-hour"
                    />
                  </div>

                  <div>
                    <label className="form-label">{t('settings.digestTimezone')}</label>
                    <select className="form-input" value={timezone} onChange={(e) => setTimezone(e.target.value)} id="select-timezone">
                      <option value="Asia/Ho_Chi_Minh">🇻🇳 Asia/Ho_Chi_Minh (UTC+7)</option>
                      <option value="UTC">🌐 UTC</option>
                      <option value="Asia/Tokyo">🇯🇵 Asia/Tokyo (UTC+9)</option>
                      <option value="Asia/Bangkok">🇹🇭 Asia/Bangkok (UTC+7)</option>
                    </select>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                <button className="btn btn-primary" onClick={handleSaveDigest} disabled={digestLoading} style={{ flex: 1, gap: 6, height: 42, justifyContent: 'center' }} id="btn-save-digest">
                  {digestLoading ? <Loader2 size={15} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Check size={15} />}
                  {t('settings.saveDigestBtn')}
                </button>
                <button className="btn btn-secondary" onClick={handleRunDigest} disabled={runLoading} style={{ flex: 1, gap: 6, height: 42, justifyContent: 'center' }} id="btn-run-digest">
                  {runLoading ? <Loader2 size={15} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Mail size={15} />}
                  {t('settings.testDigestBtn')}
                </button>
              </div>

              {runResult && (
                <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, fontSize: 12.5, color: '#15803d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} />
                  {t('settings.digestSuccessMsg')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Admin: Cấu hình Bản Tin Chung ── */}
      {isAdmin && <AdminDigestConfig />}

      {/* ── 3rd Section: Persistent UI/UX Theme Selection ── */}
      <div className="card settings-card" style={{
        borderRadius: 20, padding: 28, marginTop: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-500)',
            }}>
              <Palette size={22} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>{t('settings.themeTab')}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, alignItems: 'stretch' }}>
          {[
            { key: 'basic', tag: 'DEFAULT', colors: ['#3b82f6', '#10b981', '#ffffff'], img: basicBg },
            { key: 'classic', tag: 'RETRO 98', colors: ['#008080', '#c0c0c0', '#000080'], img: classicBg },
            { key: 'sapphire', tag: 'SAPPHIRE', colors: ['#050914', '#1d4ed8', '#38bdf8'], img: sapphireBg },
            { key: 'luxury', tag: 'GOLD 24K', colors: ['#08080a', '#d4af37', '#fef1c9'], img: luxuryBg },
            { key: 'anime', tag: 'SAKURA 🌸', colors: ['#0f0d19', '#f472b6', '#a855f7'], img: animeBg },
          ].map(theme => {
            const isUnlocked = isThemeUnlocked(user, theme.key);
            const isCurrent = savedTheme === theme.key;
            return (
              <div key={theme.key} style={{
                padding: 18, borderRadius: 'var(--radius-lg)', border: isCurrent ? '2px solid var(--brand-500)' : '1px solid var(--border)',
                background: 'var(--bg-surface-2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                height: '100%', boxSizing: 'border-box', position: 'relative', overflow: 'hidden',
              }}>
                {theme.img && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 75,
                    backgroundImage: `url(${theme.img})`, backgroundSize: 'cover', backgroundPosition: 'center',
                    opacity: 0.35, maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))',
                    WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))',
                    pointerEvents: 'none',
                  }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: isCurrent ? 'var(--brand-600)' : '#334155', color: '#ffffff' }}>
                      {theme.tag}
                    </span>
                    {isCurrent && <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--brand-500)' }}>✓ {t('settings.currentTheme')}</span>}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', marginBottom: 6, minHeight: 38, display: 'flex', alignItems: 'center' }}>
                    {t(`theme.${theme.key}.title`)}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: 14, minHeight: 52, display: 'flex', alignItems: 'flex-start' }}>
                    {t(`theme.${theme.key}.desc`)}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 16, marginTop: 'auto' }}>
                    {theme.colors.map((c, i) => (
                      <span key={i} style={{ flex: 1, height: 8, borderRadius: 3, background: c }} />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!isUnlocked}
                  onClick={() => handleApplySavedTheme(theme.key)}
                  className={isCurrent ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                  style={{ width: '100%', fontSize: 12, fontWeight: 700, position: 'relative', zIndex: 1, marginTop: 4 }}
                >
                  {isCurrent ? `✓ ${t('settings.currentTheme')}` : isUnlocked ? t('settings.applyTheme') : `🔒 ${t('badge.upgrade')}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
