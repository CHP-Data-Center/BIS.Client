// src/components/admin/ScopePanel.jsx
// Cấu hình PHẠM VI dữ liệu của tổ chức (ADR-005): nguồn + quốc gia + từ khóa.
// orgId có -> chế độ super admin (đặt cho org khác); không -> org admin đặt tổ chức mình.
import { useState, useEffect, useCallback, useRef } from 'react';
import { Save, Loader2, X, Plus, Globe, Tag, Database } from 'lucide-react';
import { orgService } from '../../services/organizations';
import { tUI } from '../../locales';

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
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>{tUI('ui.de-trong-khong-gioi-han')}</span>
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
        {values.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{tUI('ui.chua-gioi-han-thay-tat-ca')}</span>}
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
  const [scope, setScope] = useState({ sources: [], countries: [], keywords: [], article_types: [], categories: [] });

  const ARTICLE_TYPE_OPTIONS = [
    { id: 'press', label: tUI('ui.bao-chi'), icon: '📰' },
    { id: 'adb', label: tUI('ui.du-an-adb'), icon: '🏛️' },
    { id: 'worldbank', label: 'World Bank', icon: '🌍' },
    { id: 'procurement', label: tUI('ui.dau-thau-mua-sam-cong'), icon: '📜' },
  ];

  // Giữ onMessage trong ref: cha tạo lại hàm này mỗi lần render nên để trong deps của
  // useCallback sẽ khiến effect nạp lại liên tục (gọi API lặp vô hạn khi lỗi).
  const messageRef = useRef(onMessage);
  messageRef.current = onMessage;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = orgId ? await orgService.getOrgScopeSuper(orgId) : await orgService.getMyScope();
      setScope({
        sources: data.sources || [],
        countries: data.countries || [],
        keywords: data.keywords || [],
        article_types: data.article_types || [],
        categories: data.categories || [],
      });
    } catch (e) {
      messageRef.current?.('error', e.response?.data?.detail || 'Không tải được phạm vi.');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  const toggleSource = (id) => {
    setScope(s => ({
      ...s,
      sources: s.sources.includes(id) ? s.sources.filter(x => x !== id) : [...s.sources, id],
    }));
  };

  const toggleArticleType = (id) => {
    setScope(s => ({
      ...s,
      article_types: s.article_types.includes(id) ? s.article_types.filter(x => x !== id) : [...s.article_types, id],
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        sources: scope.sources,
        countries: scope.countries,
        keywords: scope.keywords,
        article_types: scope.article_types,
        categories: scope.categories,
      };
      if (orgId) await orgService.setOrgScopeSuper(orgId, payload);
      else await orgService.setMyScope(payload);
      onMessage?.('success', 'Đã lưu phạm vi dữ liệu phân vùng thành công.');
    } catch (e) {
      onMessage?.('error', e.response?.data?.detail || 'Lưu phạm vi thất bại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}><Loader2 className="spin" /> {tUI('common.loading')}</div>;
  }

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 24 }}>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 0, marginBottom: 20, lineHeight: 1.5 }}>
        Cấu hình dữ liệu phân vùng cho phép Admin phân vùng chọn **Loại bài** (Báo chí, ADB, World Bank, Đấu thầu), **Loại từ khóa**, **Từ khóa** và **Quốc gia**.
        <br />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tUI('ui.de-trong-mot-muc-khong-gioi-han-theo-muc-do-nguo')}</span>
      </p>

      {/* 1. Loại bài / Nguồn thông tin */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
          <Tag size={14} /> Loại bài & Nguồn dữ liệu chính
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>{tUI('ui.bo-chon-tat-ca-xem-moi-loai-bai')}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ARTICLE_TYPE_OPTIONS.map(opt => {
            const on = scope.article_types.includes(opt.id);
            return (
              <button key={opt.id} type="button" onClick={() => toggleArticleType(opt.id)}
                style={{
                  fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 20, cursor: 'pointer',
                  background: on ? 'var(--brand-500)' : 'var(--bg-surface-2)',
                  color: on ? 'white' : 'var(--text-secondary)',
                  border: `1px solid ${on ? 'var(--brand-500)' : 'var(--border)'}`,
                  display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s ease'
                }}>
                <span>{opt.icon}</span> {on ? '✓ ' : ''}{opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Nguồn dữ liệu cụ thể */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
          <Database size={14} /> Nguồn báo chí cụ thể
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>{tUI('ui.bo-chon-tat-ca-xem-moi-nguon-bao-chi')}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
          {sources.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tUI('ui.khong-co-nguon-nao')}</span>}
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

      {/* 3. Loại từ khóa / Lĩnh vực */}
      <TagInput label="Loại từ khóa / Lĩnh vực" icon={<Tag size={14} />} values={scope.categories}
        onChange={v => setScope(s => ({ ...s, categories: v }))} placeholder={tUI('ui.vd-giao-thong-cau-duong-sat-oda-dau-thau')} />

      {/* 4. Quốc gia */}
      <TagInput label="Quốc gia (dự án ODA & Tin tức)" icon={<Globe size={14} />} values={scope.countries}
        onChange={v => setScope(s => ({ ...s, countries: v }))} placeholder="VD: Vietnam, Thailand, Philippines…" />

      {/* 5. Từ khóa chi tiết */}
      <TagInput label="Từ khóa chi tiết" icon={<Tag size={14} />} values={scope.keywords}
        onChange={v => setScope(s => ({ ...s, keywords: v }))} placeholder={tUI('ui.vd-cao-toc-dau-thau-tin-dung-khoan-vay')} />

      <button className="btn btn-primary" onClick={save} disabled={saving} style={{ gap: 8, marginTop: 12, width: '100%', justifyContent: 'center' }}>
        {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Lưu cấu hình phạm vi dữ liệu phân vùng
      </button>
    </div>
  );
}
