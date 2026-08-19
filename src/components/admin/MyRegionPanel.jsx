// src/components/admin/MyRegionPanel.jsx
// Admin phân vùng tự quản CHÍNH phân vùng mình (ADR-005): xem/đổi tên + đặt phạm vi dữ liệu.
// Cố ý KHÔNG có danh sách phân vùng khác, không tạo/xóa vùng — đó là quyền super admin.
import { useState, useEffect, useCallback, useRef } from 'react';
import { Building2, Loader2, Pencil, Check, X, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { orgService } from '../../services/organizations';
import { useAuth } from '../../context/AuthContext';
import ScopePanel from './ScopePanel';
import { tUI } from '../../locales';

export default function MyRegionPanel({ sources = [], onMessage, onRegionRenamed }) {
  const { user, refreshUser } = useAuth();
  const [org, setOrg] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [saving, setSaving] = useState(false);

  // onMessage được tạo lại mỗi lần cha render (và nó setState -> render tiếp). Giữ trong ref
  // để `load` ổn định, nếu không effect dưới sẽ gọi API lặp vô hạn ngay khi có lỗi.
  const messageRef = useRef(onMessage);
  messageRef.current = onMessage;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrg(await orgService.getMyOrganization());
      setLoadError('');
    } catch (e) {
      // 403 = phân vùng đang bị super admin tạm dừng; nêu đúng lý do server trả về thay vì
      // để trơ ra thẻ rỗng rồi ScopePanel bên dưới lại lỗi tiếp.
      const detail = e.response?.data?.detail || tUI('admin.myRegionLoadError');
      setLoadError(detail);
      messageRef.current?.('error', detail);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = () => {
    setDraftName(org?.name || '');
    setEditing(true);
  };

  const saveName = async () => {
    const name = draftName.trim();
    if (!name || name === org?.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const updated = await orgService.updateMyOrganization({ name });
      setOrg(updated);
      setEditing(false);
      onMessage?.('success', tUI('admin.myRegionRenamed'));
      // Nhãn phân vùng của chính admin đổi theo -> làm mới thông tin đăng nhập.
      await refreshUser?.();
      onRegionRenamed?.(updated);
    } catch (e) {
      onMessage?.('error', e.response?.data?.detail || tUI('admin.myRegionRenameError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader2 className="spin" /> {tUI('common.loading')}
      </div>
    );
  }

  if (loadError || !org) {
    return (
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 16, padding: 32, display: 'flex', gap: 14, alignItems: 'flex-start',
      }}>
        <AlertTriangle size={22} style={{ flexShrink: 0, color: '#d97706', marginTop: 2 }} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            {tUI('admin.myRegionUnavailable')}
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {loadError || tUI('admin.myRegionLoadError')}
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={load}
                  style={{ marginTop: 14, gap: 6 }}>
            <RefreshCw size={14} /> {tUI('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Thẻ nhận diện phân vùng */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 16, padding: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'var(--brand-50)', color: 'var(--brand-600)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={22} />
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {tUI('admin.myRegionLabel')}
            </div>

            {editing ? (
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input
                  className="form-input"
                  style={{ fontSize: 15, fontWeight: 700, maxWidth: 340 }}
                  value={draftName}
                  autoFocus
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); saveName(); }
                    if (e.key === 'Escape') setEditing(false);
                  }}
                />
                <button type="button" className="btn btn-primary btn-sm" onClick={saveName}
                        disabled={saving} style={{ gap: 4 }}>
                  {saving ? <Loader2 size={14} className="spin" /> : <Check size={14} />}
                  {tUI('common.save')}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}
                        disabled={saving}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {org?.name}
                </span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={startEdit}
                        title={tUI('admin.myRegionRename')} style={{ gap: 4, fontSize: 12 }}>
                  <Pencil size={13} /> {tUI('admin.myRegionRename')}
                </button>
              </div>
            )}

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              {tUI('admin.myRegionAdminOf')} <strong>{user?.display_name || user?.email}</strong>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 16, padding: '10px 14px',
          borderRadius: 10, background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
          fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6,
        }}>
          <ShieldCheck size={15} style={{ flexShrink: 0, marginTop: 1, color: 'var(--brand-600)' }} />
          <span>{tUI('admin.myRegionNote')}</span>
        </div>
      </div>

      {/* Phạm vi dữ liệu của vùng mình */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
          {tUI('admin.tabScope')}
        </div>
        <ScopePanel sources={sources} onMessage={onMessage} />
      </div>
    </div>
  );
}
