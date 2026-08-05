// src/pages/SettingsPage.jsx
import { useState } from 'react';
import { Settings, Lock, Mail, Clock, Loader2, Check, ShieldCheck, User, Sparkles, KeyRound, BellRing, CheckCircle2, AlertCircle, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth';
import { settingsService } from '../services/settings';

import { getUserTheme, setUserTheme } from '../utils/theme';

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
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
            <ShieldCheck size={18} /> Đến Bảng Quản Trị Admin
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
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>Bảo Mật &amp; Mật Khẩu</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Thay đổi mật khẩu đăng nhập định kỳ</div>
              </div>
            </div>

            <Alert msg={pwMsg} />

            <form onSubmit={handleChangePw} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Mật khẩu hiện tại *</label>
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
                <label className="form-label">Mật khẩu mới *</label>
                <input
                  id="input-new-password"
                  type="password"
                  className="form-input"
                  placeholder="≥ 8 ký tự, chữ hoa, chữ số..."
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="form-label">Xác nhận mật khẩu mới *</label>
                <input
                  id="input-confirm-password"
                  type="password"
                  className="form-input"
                  placeholder="Nhập lại mật khẩu mới"
                  value={newPw2}
                  onChange={(e) => setNewPw2(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div style={{
                background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
                borderRadius: 12, padding: '10px 14px', fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5,
              }}>
                🔒 Mật khẩu phải dài ít nhất 8 ký tự. Bạn sẽ cần đăng nhập lại sau khi đổi mật khẩu thành công.
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={pwLoading}
                style={{ gap: 8, marginTop: 4, height: 44, justifyContent: 'center', fontSize: 13.5, fontWeight: 800 }}
                id="btn-change-password"
              >
                {pwLoading ? <Loader2 size={16} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Lock size={16} />}
                Cập Nhật Mật Khẩu
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
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>Email Digest Thông Minh</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tóm tắt tin tức tự động gửi về Email</div>
              </div>
            </div>

            <Alert msg={digestMsg} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
                borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>Tự động gửi Digest hàng ngày</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>Gửi thông báo tin tức khớp với từ khóa của bạn</div>
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
                    <label className="form-label">Giờ nhận email trong ngày (0 – 23h)</label>
                    <input
                      type="number" min={0} max={23}
                      className="form-input"
                      value={digestHour}
                      onChange={(e) => setDigestHour(e.target.value)}
                      id="input-digest-hour"
                    />
                  </div>

                  <div>
                    <label className="form-label">Múi giờ làm việc (Timezone)</label>
                    <select className="form-input" value={timezone} onChange={(e) => setTimezone(e.target.value)} id="select-timezone">
                      <option value="Asia/Ho_Chi_Minh">🇻🇳 Asia/Ho_Chi_Minh (UTC+7)</option>
                      <option value="UTC">🌐 UTC (Quốc tế)</option>
                      <option value="Asia/Tokyo">🇯🇵 Asia/Tokyo (UTC+9)</option>
                      <option value="Asia/Bangkok">🇹🇭 Asia/Bangkok (UTC+7)</option>
                    </select>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                <button className="btn btn-primary" onClick={handleSaveDigest} disabled={digestLoading} style={{ flex: 1, gap: 6, height: 42, justifyContent: 'center' }} id="btn-save-digest">
                  {digestLoading ? <Loader2 size={15} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Check size={15} />}
                  Lưu Cấu Hình
                </button>
                <button className="btn btn-secondary" onClick={handleRunDigest} disabled={runLoading} style={{ flex: 1, gap: 6, height: 42, justifyContent: 'center' }} id="btn-run-digest">
                  {runLoading ? <Loader2 size={15} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Mail size={15} />}
                  Gửi Thử Ngay
                </button>
              </div>

              {runResult && (
                <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, fontSize: 12.5, color: '#15803d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} />
                  Đã kích hoạt: Tổng hợp {runResult.total_items} tin tức · Đã gửi {runResult.emails_sent} email.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>Tùy Chỉnh Giao Diện Hệ Thống (UI/UX Themes)</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Thay đổi giao diện làm việc cố định cho tài khoản của bạn</div>
            </div>
          </div>
          {(user?.role === 'super_admin' || user?.role === 'admin') && (
            <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, background: 'linear-gradient(135deg, #f59e0b, #ec4899)', color: 'white', boxShadow: '0 2px 8px rgba(245,158,11,0.3)' }}>
              👑 SUPER ADMIN — UNLOCKED TOÀN BỘ THEMES
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {[
            { key: 'basic', title: 'BIS Modern Glassmorphism', desc: 'Giao diện mượt mà hiện đại mặc định.', colors: ['#3b82f6', '#10b981', '#ffffff'], tag: 'MẶC ĐỊNH' },
            { key: 'classic', title: 'Classic Y2K Japanese Web', desc: 'Phong cách Nhật Bản Y2K vuông phẳng 2000s.', colors: ['#e4e0d4', '#807868', '#8b4513'], tag: 'Y2K 2000s' },
            { key: 'cyberpunk', title: 'Cyberpunk Neo-Tokyo', desc: 'Sci-Fi Cyberpunk Đêm Neon — Góc cắt Futuristic, hiệu ứng Neon Pulse & Cyber Glow.', colors: ['#040814', '#00f0ff', '#ff007f'], tag: 'CYBERPUNK NEON' },
            { key: 'luxury', title: 'Bloomberg Luxury Executive', desc: 'Doanh Nhân Thượng Lưu — Đen Obsidian huyền bí, Viền Vàng Gold 24K & Ánh Kim Sang Trọng.', colors: ['#08080a', '#d4af37', '#fef1c9'], tag: 'LUXURY GOLD 24K' },
          ].map(theme => {
            const isUnlocked = user?.role === 'super_admin' || user?.role === 'admin' || theme.key === 'basic';
            const isCurrent = savedTheme === theme.key;
            return (
              <div key={theme.key} style={{
                padding: 18, borderRadius: 'var(--radius-lg)', border: isCurrent ? '2px solid var(--brand-500)' : '1px solid var(--border)',
                background: 'var(--bg-surface-2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: isCurrent ? 'var(--brand-600)' : '#334155', color: '#ffffff' }}>
                      {theme.tag}
                    </span>
                    {isCurrent && <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--brand-500)' }}>✓ ĐANG DÙNG</span>}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{theme.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 12 }}>{theme.desc}</div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
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
                  style={{ width: '100%', fontSize: 12, fontWeight: 700 }}
                >
                  {isCurrent ? '✓ Đang Áp Dụng' : isUnlocked ? 'Áp Dụng Giao Diện' : '🔒 Cần Nâng Cấp Gói'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
