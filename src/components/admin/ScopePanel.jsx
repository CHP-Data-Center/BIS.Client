// src/components/admin/ScopePanel.jsx
// Cấu hình PHẠM VI dữ liệu của tổ chức (ADR-005): nguồn + quốc gia + từ khóa.
// orgId có -> chế độ super admin (đặt cho org khác); không -> org admin đặt tổ chức mình.
import { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, X, Plus, Globe, Tag, Database } from 'lucide-react';
import { orgService } from '../../services/organizations';

function TagInput({ label, icon, values, onChange, placeholder }) {
  const [text, setText] = useState('');
  const add = () => {
    const v = text.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setText('');
  };
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
        {icon} {label}
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>(để trống = không giới hạn)</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          className="form-input" style={{ fontSize: 13 }} value={text}
          placeholder={placeholder}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <button type="button" className="btn btn-secondary btn-sm" onClick={add} style={{ gap: 4, flexShrink: 0 }}>
          <Plus size={14} /> Thêm
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {values.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa giới hạn — thấy tất cả</span>}
        {values.map(v => (
          <span key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-200)' }}>
            {v}
            <X size={12} style={{ cursor: 'pointer' }} onClick={() => onChange(values.filter(x => x !== v))} />
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ScopePanel({ orgId = null, sources = [], onMessage }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scope, setScope] = useState({ sources: [], countries: [], keywords: [] });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = orgId ? await orgService.getOrgScopeSuper(orgId) : await orgService.getMyScope();
      setScope({
        sources: data.sources || [],
        countries: data.countries || [],
        keywords: data.keywords || [],
      });
    } catch (e) {
      onMessage?.('error', e.response?.data?.detail || 'Không tải được phạm vi.');
    } finally {
      setLoading(false);
    }
  }, [orgId, onMessage]);

  useEffect(() => { load(); }, [load]);

  const toggleSource = (id) => {
    setScope(s => ({
      ...s,
      sources: s.sources.includes(id) ? s.sources.filter(x => x !== id) : [...s.sources, id],
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { sources: scope.sources, countries: scope.countries, keywords: scope.keywords };
      if (orgId) await orgService.setOrgScopeSuper(orgId, payload);
      else await orgService.setMyScope(payload);
      onMessage?.('success', 'Đã lưu phạm vi dữ liệu.');
    } catch (e) {
      onMessage?.('error', e.response?.data?.detail || 'Lưu phạm vi thất bại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}><Loader2 className="spin" /> Đang tải…</div>;
  }

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 24 }}>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 0, marginBottom: 20, lineHeight: 1.5 }}>
        Giới hạn dữ liệu tổ chức được thấy. <strong>Để trống một mục = không giới hạn theo mục đó</strong> (thấy tất cả).
        Người dùng trong tổ chức chỉ thấy tin/dự án khớp phạm vi này.
      </p>

      {/* Nguồn dữ liệu */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
          <Database size={14} /> Nguồn dữ liệu
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>(bỏ chọn tất cả = thấy mọi nguồn)</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
          {sources.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Không có nguồn nào.</span>}
          {sources.map(s => {
            const on = scope.sources.includes(s.id);
            return (
              <button key={s.id} type="button" onClick={() => toggleSource(s.id)}
                style={{
                  fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                  background: on ? 'var(--brand-500)' : 'var(--bg-surface-2)',
                  color: on ? 'white' : 'var(--text-secondary)',
                  border: `1px solid ${on ? 'var(--brand-500)' : 'var(--border)'}`,
                }}>
                {on ? '✓ ' : ''}{s.name}
              </button>
            );
          })}
        </div>
      </div>

      <TagInput label="Quốc gia (dự án ODA)" icon={<Globe size={14} />} values={scope.countries}
        onChange={v => setScope(s => ({ ...s, countries: v }))} placeholder="VD: Vietnam, Thailand…" />
      <TagInput label="Từ khóa" icon={<Tag size={14} />} values={scope.keywords}
        onChange={v => setScope(s => ({ ...s, keywords: v }))} placeholder="VD: cầu, đường sắt, ODA…" />

      <button className="btn btn-primary" onClick={save} disabled={saving} style={{ gap: 8, marginTop: 8 }}>
        {saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />} Lưu phạm vi
      </button>
    </div>
  );
}
