// src/components/AdminDigestConfig.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  Send, Clock, Users, Plus, X, Loader2, Check, TestTube2, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { digestService } from '../services/digest';
import { useLang } from '../context/LanguageContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminDigestConfig() {
  const { lang, t } = useLang();
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [newRecipient, setNewRecipient] = useState('');
  const [testEmail, setTestEmail] = useState('');

  const dayLabels = lang === 'ja'
    ? ['月', '火', '水', '木', '金', '土', '日']
    : lang === 'en'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4500); };

  const load = useCallback(async () => {
    setLoading(true);
    try { setCfg(await digestService.getConfig()); }
    catch { showMsg('error', 'Không tải được cấu hình bản tin.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (patch) => setCfg((c) => ({ ...c, ...patch }));
  const toggleDay = (d) => set({
    days: cfg.days.includes(d) ? cfg.days.filter((x) => x !== d) : [...cfg.days, d].sort((a, b) => a - b),
  });

  const addRecipient = () => {
    const e = newRecipient.trim().toLowerCase();
    if (!EMAIL_RE.test(e)) return showMsg('error', 'Email không hợp lệ.');
    if (cfg.recipients.includes(e)) return showMsg('error', 'Email đã có trong danh sách.');
    set({ recipients: [...cfg.recipients, e] });
    setNewRecipient('');
  };
  const removeRecipient = (e) => set({ recipients: cfg.recipients.filter((x) => x !== e) });

  const save = async () => {
    setSaving(true);
    try {
      setCfg(await digestService.saveConfig({ ...cfg, keywords: cfg.keywords.filter(Boolean) }));
      showMsg('success', 'Đã lưu cấu hình & áp lịch gửi bản tin.');
    } catch (err) { showMsg('error', err?.response?.data?.detail || 'Lưu thất bại.'); }
    finally { setSaving(false); }
  };
  const sendTest = async () => {
    const e = testEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(e)) return showMsg('error', 'Nhập email hợp lệ để gửi thử.');
    setBusy(true);
    try { const r = await digestService.sendTest(e); showMsg(r.ok ? 'success' : 'error', r.ok ? `Đã gửi thử tới ${e}.` : 'Gửi thử thất bại.'); }
    catch { showMsg('error', 'Gửi thử thất bại.'); } finally { setBusy(false); }
  };
  const sendNow = async () => {
    setBusy(true);
    try { const r = await digestService.sendNow(); showMsg(r.failed ? 'error' : 'success', `Đã gửi ${r.sent}/${r.recipients} email · ${r.items} mục.`); }
    catch { showMsg('error', 'Gửi ngay thất bại.'); } finally { setBusy(false); }
  };

  const Alert = () => !msg ? null : (
    <div style={{
      padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, marginBottom: 16,
      background: msg.type === 'success' ? '#f0fdf4' : '#fff1f2',
      border: `1.5px solid ${msg.type === 'success' ? '#86efac' : '#fca5a5'}`,
      color: msg.type === 'success' ? '#15803d' : '#b91c1c',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {msg.text}
    </div>
  );

  return (
    <div className="card settings-card" style={{ borderRadius: 20, padding: 28, marginTop: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-500)' }}>
            <Send size={22} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>{t('digest.adminTitle')}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('digest.adminSubtitle')}</div>
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: 'white' }}>{t('digest.onlyAdminBadge')}</span>
      </div>

      {loading || !cfg ? (
        <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={24} style={{ animation: 'spin 0.6s linear infinite', display: 'block', margin: '0 auto 8px' }} /> ...
        </div>
      ) : (
        <>
          <Alert />

          {/* Lịch gửi */}
          <div style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>{t('digest.autoSchedule')}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{t('digest.autoScheduleSub')}</div>
            </div>
            <input type="checkbox" checked={cfg.enabled} onChange={(e) => set({ enabled: e.target.checked })}
              style={{ width: 22, height: 22, accentColor: 'var(--brand-500)', cursor: 'pointer' }} />
          </div>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 18 }}>
            <div>
              <label className="form-label"><Clock size={13} style={{ verticalAlign: -2 }} /> {t('digest.sendHour')}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" min={0} max={23} className="form-input" style={{ width: 72, textAlign: 'center' }}
                  value={cfg.send_hour} onChange={(e) => set({ send_hour: Math.max(0, Math.min(23, +e.target.value || 0)) })} />
                <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>:</span>
                <input type="number" min={0} max={59} className="form-input" style={{ width: 72, textAlign: 'center' }}
                  value={cfg.send_minute} onChange={(e) => set({ send_minute: Math.max(0, Math.min(59, +e.target.value || 0)) })} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <label className="form-label">{t('digest.daysOfWeek')}</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {dayLabels.map((lbl, d) => {
                  const on = cfg.days.includes(d);
                  const theme = document.documentElement.getAttribute('data-ui-theme') || 'basic';
                  
                  let btnBg = 'var(--bg-surface-2)';
                  let btnColor = 'var(--text-muted)';
                  let btnBorder = '1px solid var(--border)';
                  let btnShadow = 'none';
                  let btnWeight = 700;

                  if (on) {
                    btnWeight = 900;
                    if (theme === 'luxury') {
                      btnBg = 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%)';
                      btnColor = '#000000';
                      btnBorder = '1px solid #fef08a';
                      btnShadow = '0 2px 10px rgba(234, 179, 8, 0.45)';
                    } else if (theme === 'sapphire') {
                      btnBg = 'linear-gradient(135deg, #38bdf8 0%, #1d4ed8 100%)';
                      btnColor = '#ffffff';
                      btnBorder = '1px solid #7dd3fc';
                      btnShadow = '0 2px 10px rgba(56, 189, 248, 0.5)';
                    } else if (theme === 'anime') {
                      btnBg = 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)';
                      btnColor = '#ffffff';
                      btnBorder = '1px solid #fbcfe8';
                      btnShadow = '0 2px 10px rgba(244, 114, 182, 0.5)';
                    } else {
                      btnBg = 'var(--brand-500)';
                      btnColor = '#ffffff';
                      btnBorder = 'none';
                      btnShadow = '0 2px 8px rgba(37, 99, 235, 0.3)';
                    }
                  }

                  return (
                    <button key={d} type="button" onClick={() => toggleDay(d)} style={{
                      width: 44, height: 38, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: btnWeight,
                      border: btnBorder,
                      background: btnBg,
                      color: btnColor,
                      boxShadow: btnShadow,
                      transition: 'all 0.2s ease',
                    }}>{lbl}</button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Người nhận */}
          <div style={{ marginBottom: 18 }}>
            <label className="form-label"><Users size={13} style={{ verticalAlign: -2 }} /> {t('digest.recipients')} ({cfg.recipients.length})</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input type="email" className="form-input" style={{ flex: 1 }} placeholder="them-email@ckjvn.vn"
                value={newRecipient} onChange={(e) => setNewRecipient(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())} />
              <button type="button" className="btn btn-primary" onClick={addRecipient} style={{ gap: 6 }}><Plus size={15} /> {t('digest.addRecipient')}</button>
            </div>
            {cfg.recipients.length === 0 ? (
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontStyle: 'italic' }}>...</div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {cfg.recipients.map((e) => (
                  <span key={e} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 20, padding: '5px 10px', fontSize: 13 }}>
                    {e} <X size={14} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => removeRecipient(e)} />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <button className="btn btn-primary" onClick={save} disabled={saving} style={{ gap: 8, height: 44, fontWeight: 800, padding: '0 22px' }}>
              {saving ? <Loader2 size={16} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Check size={16} />} {t('digest.saveConfig')}
            </button>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="email" className="form-input" style={{ width: 200 }} placeholder="email..."
                value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
              <button className="btn btn-secondary" onClick={sendTest} disabled={busy} style={{ gap: 6 }}><TestTube2 size={15} /> {t('digest.sendTest')}</button>
              <button className="btn btn-secondary" onClick={sendNow} disabled={busy} style={{ gap: 6 }}><Send size={15} /> {t('digest.sendNow')}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

