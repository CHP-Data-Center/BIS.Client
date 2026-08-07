// src/pages/EmailDigestPage.jsx — Cấu hình Email Digest CHUNG (admin):
// nội dung tùy biến · người nhận · giờ gửi · lịch hằng ngày (chọn thứ).
import { useState, useEffect, useCallback } from 'react';
import {
  Mail, Clock, Users, FileText, Save, Send, TestTube2, Plus, X,
  CheckCircle2, AlertCircle, RefreshCw, Power,
} from 'lucide-react';
import { digestService } from '../services/digest';

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']; // 0..6

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const brand = '#159B4C';

export default function EmailDigestPage() {
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [newRecipient, setNewRecipient] = useState('');
  const [testEmail, setTestEmail] = useState('');

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCfg(await digestService.getConfig());
    } catch {
      showToast('Không tải được cấu hình', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (patch) => setCfg((c) => ({ ...c, ...patch }));

  const toggleDay = (d) => set({
    days: cfg.days.includes(d) ? cfg.days.filter((x) => x !== d) : [...cfg.days, d].sort((a, b) => a - b),
  });

  const addRecipient = () => {
    const e = newRecipient.trim().toLowerCase();
    if (!EMAIL_RE.test(e)) return showToast('Email không hợp lệ', 'error');
    if (cfg.recipients.includes(e)) return showToast('Email đã có trong danh sách', 'warning');
    set({ recipients: [...cfg.recipients, e] });
    setNewRecipient('');
  };

  const removeRecipient = (e) => set({ recipients: cfg.recipients.filter((x) => x !== e) });

  const save = async () => {
    if (cfg.recipients.length === 0 && cfg.enabled) {
      showToast('Nên thêm ít nhất 1 người nhận trước khi bật lịch', 'warning');
    }
    setSaving(true);
    try {
      setCfg(await digestService.saveConfig({
        ...cfg,
        keywords: cfg.keywords.filter(Boolean),
      }));
      showToast('Đã lưu cấu hình & áp lịch gửi', 'success');
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Lưu thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    const e = testEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(e)) return showToast('Nhập email hợp lệ để gửi thử', 'error');
    setBusy(true);
    try {
      const r = await digestService.sendTest(e);
      showToast(r.ok ? `Đã gửi thử tới ${e}` : 'Gửi thử thất bại', r.ok ? 'success' : 'error');
    } catch { showToast('Gửi thử thất bại', 'error'); } finally { setBusy(false); }
  };

  const sendNow = async () => {
    setBusy(true);
    try {
      const r = await digestService.sendNow();
      showToast(`Đã gửi ${r.sent}/${r.recipients} email · ${r.items} mục`, r.failed ? 'warning' : 'success');
    } catch { showToast('Gửi ngay thất bại', 'error'); } finally { setBusy(false); }
  };

  if (loading || !cfg) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={30} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block', color: brand }} />
        Đang tải cấu hình email…
      </div>
    );
  }

  const cardStyle = {
    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
    borderRadius: 14, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 };
  const sectionTitle = { fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '4px 2px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999, padding: '12px 18px', borderRadius: 12,
          background: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f59e0b' : '#3b82f6',
          color: 'white', fontWeight: 600, fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <CheckCircle2 size={16} /> {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: brand, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Mail size={20} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Cấu Hình Email Digest</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Bản tin tổng hợp tự động — tùy biến nội dung, người nhận và lịch gửi.</p>
        </div>
      </div>

      {/* Lịch gửi */}
      <div style={cardStyle}>
        <div style={sectionTitle}><Clock size={17} color={brand} /> Lịch gửi</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 14 }}>
          <span
            onClick={() => set({ enabled: !cfg.enabled })}
            style={{
              width: 44, height: 24, borderRadius: 12, background: cfg.enabled ? brand : '#cbd5e1',
              position: 'relative', transition: 'background .2s', flexShrink: 0,
            }}
          >
            <span style={{ position: 'absolute', top: 2, left: cfg.enabled ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left .2s' }} />
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Power size={14} color={cfg.enabled ? brand : '#94a3b8'} />
            {cfg.enabled ? 'Đang bật gửi tự động' : 'Đang tắt (không gửi tự động)'}
          </span>
        </label>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={labelStyle}>Giờ gửi (hằng ngày)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="number" min={0} max={23} className="form-input" style={{ width: 68, height: 38, textAlign: 'center' }}
                value={cfg.send_hour} onChange={(e) => set({ send_hour: Math.max(0, Math.min(23, +e.target.value || 0)) })} />
              <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>:</span>
              <input type="number" min={0} max={59} className="form-input" style={{ width: 68, height: 38, textAlign: 'center' }}
                value={cfg.send_minute} onChange={(e) => set({ send_minute: Math.max(0, Math.min(59, +e.target.value || 0)) })} />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={labelStyle}>Ngày trong tuần</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DAY_LABELS.map((lbl, d) => {
                const on = cfg.days.includes(d);
                return (
                  <button key={d} onClick={() => toggleDay(d)} style={{
                    width: 42, height: 36, borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    border: on ? 'none' : '1px solid var(--border)', background: on ? brand : 'var(--bg-surface-2)',
                    color: on ? 'white' : 'var(--text-secondary)',
                  }}>{lbl}</button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Người nhận */}
      <div style={cardStyle}>
        <div style={sectionTitle}><Users size={17} color={brand} /> Người nhận ({cfg.recipients.length})</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input type="email" className="form-input" style={{ flex: 1, height: 38 }} placeholder="them-email@ckjvn.vn"
            value={newRecipient} onChange={(e) => setNewRecipient(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addRecipient()} />
          <button className="btn btn-primary" onClick={addRecipient} style={{ background: brand, border: 'none', gap: 6, display: 'flex', alignItems: 'center' }}>
            <Plus size={15} /> Thêm
          </button>
        </div>
        {cfg.recipients.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa có người nhận nào.</div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {cfg.recipients.map((e) => (
              <span key={e} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 20, padding: '5px 10px', fontSize: 13 }}>
                {e}
                <X size={14} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => removeRecipient(e)} />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Nội dung */}
      <div style={cardStyle}>
        <div style={sectionTitle}><FileText size={17} color={brand} /> Nội dung email</div>
        <div style={{ marginBottom: 14 }}>
          <div style={labelStyle}>Tiêu đề</div>
          <input type="text" className="form-input" style={{ width: '100%', height: 38 }}
            value={cfg.subject} onChange={(e) => set({ subject: e.target.value })} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={labelStyle}>Lời mở đầu (tùy biến)</div>
          <textarea className="form-input" rows={3} style={{ width: '100%', resize: 'vertical' }}
            placeholder="Vd: Kính gửi Quý anh chị, dưới đây là tổng hợp tin đấu thầu & dự án nổi bật…"
            value={cfg.intro || ''} onChange={(e) => set({ intro: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={labelStyle}>Số mục tối đa</div>
            <input type="number" min={1} max={50} className="form-input" style={{ width: 90, height: 38, textAlign: 'center' }}
              value={cfg.max_items} onChange={(e) => set({ max_items: Math.max(1, Math.min(50, +e.target.value || 1)) })} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', height: 38 }}>
            <input type="checkbox" checked={cfg.include_news} onChange={(e) => set({ include_news: e.target.checked })} />
            Kèm tin tức mới
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', height: 38 }}>
            <input type="checkbox" checked={cfg.include_procurement} onChange={(e) => set({ include_procurement: e.target.checked })} />
            Kèm đấu thầu / dự án
          </label>
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={labelStyle}>Lọc theo từ khóa (cách nhau dấu phẩy — để trống = tất cả)</div>
          <input type="text" className="form-input" style={{ width: '100%', height: 38 }}
            placeholder="cao tốc, cầu, đường sắt"
            value={cfg.keywords.join(', ')}
            onChange={(e) => set({ keywords: e.target.value.split(',').map((s) => s.trim()) })} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ ...cardStyle, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="btn btn-primary" onClick={save} disabled={saving}
          style={{ background: brand, border: 'none', gap: 8, display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 700, padding: '10px 20px' }}>
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} Lưu cấu hình
        </button>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="email" className="form-input" style={{ width: 200, height: 38 }} placeholder="Email để gửi thử…"
            value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
          <button className="btn btn-secondary" onClick={sendTest} disabled={busy}
            style={{ gap: 6, display: 'flex', alignItems: 'center', fontSize: 13 }}>
            <TestTube2 size={15} /> Gửi thử
          </button>
          <button className="btn btn-secondary" onClick={sendNow} disabled={busy}
            style={{ gap: 6, display: 'flex', alignItems: 'center', fontSize: 13, borderColor: brand, color: brand }}>
            <Send size={15} /> Gửi ngay
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-muted)', padding: '0 4px' }}>
        <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>Chưa cấu hình SMTP thì email chỉ ghi ra log server (chế độ console) — "Gửi thử/Gửi ngay" vẫn báo thành công để kiểm thử nội dung.</span>
      </div>
    </div>
  );
}
