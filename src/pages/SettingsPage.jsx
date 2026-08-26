// src/pages/SettingsPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { authService } from '../services/auth';
import { settingsService } from '../services/settings';
import { useNavigate } from 'react-router-dom';
import {
  KeyRound, BellRing, CheckCircle2, AlertCircle, Loader2,
  Mail, Sparkles, ShieldCheck, Lock, Palette, MapPin, Compass, Check
} from 'lucide-react';
import AdminDigestConfig from '../components/AdminDigestConfig';
import { getUserTheme, setUserTheme, isThemeUnlocked } from '../utils/theme';
import basicBg from '../assets/theme_basic_bg.png';
import classicBg from '../assets/theme_classic_bg.png';
import sapphireBg from '../assets/theme_sapphire_bg.png';
import luxuryBg from '../assets/theme_luxury_bg.png';
import animeBg from '../assets/anime_bg.png';
import { tUI } from '../locales';

export default function SettingsPage() {
  const { user, isAdmin, refreshUser, openOnboarding } = useAuth();
  const { t } = useLang();
  const nav = useNavigate();

  // Password state
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  // Region & Digest state
  const [region, setRegion] = useState('');
  const [digestEnabled, setDigestEnabled] = useState(false);
  const [digestHour, setDigestHour] = useState(8);
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [bellRinging, setBellRinging] = useState(false);
  const [prefLoading, setPrefLoading] = useState(false);
  const [prefMsg, setPrefMsg] = useState(null);

  // Test digest state
  const [runLoading, setRunLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);

  // UI Theme state
  const [savedTheme, setSavedTheme] = useState(() => getUserTheme(user));

  useEffect(() => {
    if (user) {
      setRegion(user.region || 'Toàn quốc');
      setDigestEnabled(!!user.email_digest_enabled);
      setDigestHour(user.digest_hour ?? 8);
      setTimezone(user.timezone || 'Asia/Ho_Chi_Minh');
      setSavedTheme(getUserTheme(user));
    }
  }, [user]);

  const handleApplySavedTheme = (themeKey) => {
    setUserTheme(user, themeKey);
    setSavedTheme(themeKey);
  };

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
      showMsg(setPwMsg, 'error', 'Mật khẩu mới tối thiểu 8 ký tự.');
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

  const handleSavePreferences = async () => {
    setPrefLoading(true);
    try {
      const finalRegion = region.trim() || 'Toàn quốc';
      await settingsService.updateSettings({
        region: finalRegion,
        email_digest_enabled: digestEnabled,
        digest_hour: Number(digestHour),
        timezone,
      });
      const userKey = user?.email || user?.id;
      if (userKey) {
        localStorage.setItem(`bis_user_region_${userKey}`, finalRegion);
      }
      await refreshUser();
      showMsg(setPrefMsg, 'success', 'Đã lưu cấu hình Phân Vùng & Email Digest thành công!');
    } catch (err) {
      showMsg(setPrefMsg, 'error', err.response?.data?.detail || 'Không thể lưu cài đặt.');
    } finally {
      setPrefLoading(false);
    }
  };

  const handleRunDigest = async () => {
    setRunLoading(true);
    setRunResult(null);
    try {
      const res = await settingsService.runDigestNow();
      setRunResult(res);
    } catch (err) {
      showMsg(setPrefMsg, 'error', err.response?.data?.detail || 'Không thể gửi email digest.');
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

  const userRegion = user?.region || 'Toàn quốc';

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
              <span>📍 {userRegion}</span>
              <span>•</span>
              <span style={{ color: '#4ade80', fontWeight: 600 }}>{tUI('ui.da-xac-thuc-jwt')}</span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, zIndex: 1 }}>
            <button
              className="btn"
              onClick={() => nav('/admin')}
              style={{
                gap: 8, padding: '11px 22px', borderRadius: 14,
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
          </div>
        )}
      </div>

      {/* ── 2-Column Perfectly Balanced Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24, alignItems: 'stretch' }}>
        
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
                  placeholder={tUI('ui.8-ky-tu-2')}
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
                style={{ gap: 8, marginTop: 10, height: 44, justifyContent: 'center', fontSize: 13.5, fontWeight: 800 }}
                id="btn-change-password"
              >
                {pwLoading ? <Loader2 size={16} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Lock size={16} />}
                {t('settings.updatePasswordBtn')}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Phân Vùng & Email Digest */}
        <div className="card settings-card" style={{
          borderRadius: 20, padding: 28,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-500)',
                }}>
                  <BellRing size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>Phân Vùng & Email Digest</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cá nhân hóa địa bàn & nhận báo cáo tự động</div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={openOnboarding}
                style={{ gap: 5, fontSize: 12, fontWeight: 700, borderRadius: 10 }}
              >
                <Sparkles size={13} style={{ color: '#3b82f6' }} /> Setup Wizard
              </button>
            </div>

            <Alert msg={prefMsg} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Phân Vùng Selection */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} style={{ color: 'var(--brand-500)' }} /> Phân Vùng Hoạt Động
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <select
                    className="form-input"
                    value={['Toàn quốc', 'Miền Bắc', 'Miền Trung', 'Miền Nam', 'Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Quảng Ninh', 'Bình Dương', 'Đồng Nai'].includes(region) ? region : '__custom__'}
                    onChange={(e) => {
                      if (e.target.value !== '__custom__') {
                        setRegion(e.target.value);
                      }
                    }}
                    id="select-user-region"
                    style={{ minHeight: 40, height: 40, padding: '8px 12px', fontSize: 13, borderRadius: 10, lineHeight: '1.4' }}
                  >
                    <option value="Toàn quốc">Toàn quốc (Mặc định)</option>
                    <option value="Miền Bắc">Miền Bắc</option>
                    <option value="Miền Trung">Miền Trung</option>
                    <option value="Miền Nam">Miền Nam</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="TP.HCM">TP. Hồ Chí Minh</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Hải Phòng">Hải Phòng</option>
                    <option value="Cần Thơ">Cần Thơ</option>
                    <option value="Quảng Ninh">Quảng Ninh</option>
                    <option value="Bình Dương">Bình Dương</option>
                    <option value="Đồng Nai">Đồng Nai</option>
                    <option value="__custom__">✏️ Khác (Tự gõ bên cạnh)</option>
                  </select>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Tên địa phương..."
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    id="input-user-region-custom"
                    style={{ minHeight: 40, height: 40, padding: '8px 12px', fontSize: 13, borderRadius: 10 }}
                  />
                </div>
              </div>

              {/* Email Digest Toggle */}
              <div
                onClick={() => {
                  const next = !digestEnabled;
                  setDigestEnabled(next);
                  if (next) {
                    setBellRinging(true);
                    setTimeout(() => setBellRinging(false), 800);
                  }
                }}
                style={{
                  background: digestEnabled ? 'rgba(16, 185, 129, 0.07)' : 'var(--bg-surface-2)',
                  border: digestEnabled ? '1.5px solid rgba(16, 185, 129, 0.45)' : '1px solid var(--border-subtle)',
                  borderRadius: 14,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: digestEnabled ? '0 4px 16px rgba(16, 185, 129, 0.12)' : 'none',
                  userSelect: 'none',
                  marginTop: 2
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: digestEnabled ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(148, 163, 184, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: digestEnabled ? '#ffffff' : '#64748b',
                    boxShadow: digestEnabled ? '0 3px 10px rgba(16, 185, 129, 0.35)' : 'none',
                    flexShrink: 0,
                    transition: 'all 0.25s ease',
                  }}>
                    <div className={bellRinging || digestEnabled ? 'bell-ring-active' : ''} style={{ display: 'flex', transformOrigin: 'top center' }}>
                      <BellRing size={18} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>{t('settings.digestEnable')}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>Gửi báo cáo tổng hợp tự động về {user?.email}</div>
                  </div>
                </div>

                {/* Luxury iOS Switch */}
                <div
                  style={{
                    width: 46,
                    height: 26,
                    borderRadius: 13,
                    background: digestEnabled ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(148, 163, 184, 0.35)',
                    position: 'relative',
                    transition: 'background 0.25s ease, box-shadow 0.25s ease',
                    boxShadow: digestEnabled ? '0 2px 8px rgba(16, 185, 129, 0.4)' : 'none',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#ffffff',
                      position: 'absolute',
                      top: 3,
                      left: digestEnabled ? 23 : 3,
                      transition: 'left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.22)',
                    }}
                  />
                </div>
              </div>

              {digestEnabled && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="form-label">{t('settings.digestHour')}</label>
                    <input
                      type="number" min={0} max={23}
                      className="form-input"
                      value={digestHour}
                      onChange={(e) => setDigestHour(e.target.value)}
                      id="input-digest-hour"
                      style={{ minHeight: 40, height: 40, padding: '8px 12px', fontSize: 13, borderRadius: 10 }}
                    />
                  </div>

                  <div>
                    <label className="form-label">{t('settings.digestTimezone')}</label>
                    <select
                      className="form-input"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      id="select-timezone"
                      style={{ minHeight: 40, height: 40, padding: '8px 12px', fontSize: 13, borderRadius: 10, lineHeight: '1.4' }}
                    >
                      <option value="Asia/Ho_Chi_Minh">Việt Nam (UTC+7)</option>
                      <option value="Asia/Bangkok">Bangkok (UTC+7)</option>
                      <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
                      <option value="UTC">UTC (Quốc tế)</option>
                    </select>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                <button className="btn btn-primary" onClick={handleSavePreferences} disabled={prefLoading} style={{ flex: 1, gap: 6, height: 44, justifyContent: 'center', fontWeight: 800 }} id="btn-save-digest">
                  {prefLoading ? <Loader2 size={15} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Check size={15} />}
                  Lưu Cấu Hình
                </button>
                <button className="btn btn-secondary" onClick={handleRunDigest} disabled={runLoading} style={{ flex: 1, gap: 6, height: 44, justifyContent: 'center', fontWeight: 700 }} id="btn-run-digest">
                  {runLoading ? <Loader2 size={15} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Mail size={15} />}
                  {t('settings.testDigestBtn')}
                </button>
              </div>

              {runResult && (
                <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, fontSize: 12, color: '#15803d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={15} />
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
