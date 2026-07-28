// src/components/admin/OrganizationsPanel.jsx
// Super admin quản tổ chức (ADR-005): tạo tổ chức, tạo org admin, đặt phạm vi, xem user.
import { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Loader2, ShieldCheck, Users, Sliders } from 'lucide-react';
import { orgService } from '../../services/organizations';
import ScopePanel from './ScopePanel';

export default function OrganizationsPanel({ sources = [], onMessage }) {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [newOrgName, setNewOrgName] = useState('');
  const [creating, setCreating] = useState(false);

  // Chi tiết org đang chọn
  const [detailTab, setDetailTab] = useState('users'); // users | scope | admin
  const [orgUsers, setOrgUsers] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', display_name: '' });

  const loadOrgs = useCallback(async () => {
    setLoading(true);
    try {
      setOrgs(await orgService.listOrganizations());
    } catch (e) {
      onMessage?.('error', e.response?.data?.detail || 'Không tải được danh sách tổ chức.');
    } finally {
      setLoading(false);
    }
  }, [onMessage]);

  useEffect(() => { loadOrgs(); }, [loadOrgs]);

  const loadUsers = useCallback(async (orgId) => {
    try { setOrgUsers(await orgService.listOrgUsers(orgId)); } catch { setOrgUsers([]); }
  }, []);

  const selectOrg = (org) => {
    setSelected(org);
    setDetailTab('users');
    loadUsers(org.id);
  };

  const createOrg = async () => {
    const name = newOrgName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const org = await orgService.createOrganization({ name });
      setNewOrgName('');
      onMessage?.('success', `Đã tạo tổ chức "${org.name}".`);
      await loadOrgs();
      selectOrg(org);
    } catch (e) {
      onMessage?.('error', e.response?.data?.detail || 'Tạo tổ chức thất bại.');
    } finally {
      setCreating(false);
    }
  };

  const createAdmin = async () => {
    if (!selected) return;
    try {
      await orgService.createOrgAdmin(selected.id, newAdmin);
      setNewAdmin({ email: '', password: '', display_name: '' });
      onMessage?.('success', 'Đã tạo quản trị viên cho tổ chức.');
      loadUsers(selected.id);
    } catch (e) {
      onMessage?.('error', e.response?.data?.detail || 'Tạo admin thất bại (mật khẩu cần đủ mạnh?).');
    }
  };

  const toggleActive = async (org) => {
    try {
      await orgService.updateOrganization(org.id, { is_active: !org.is_active });
      loadOrgs();
      if (selected?.id === org.id) setSelected({ ...org, is_active: !org.is_active });
    } catch (e) {
      onMessage?.('error', e.response?.data?.detail || 'Cập nhật thất bại.');
    }
  };

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* ── Cột trái: danh sách + tạo tổ chức ── */}
      <div style={{ flex: '1 1 300px', minWidth: 280, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, marginBottom: 14 }}>
          <Building2 size={16} /> Tổ chức <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({orgs.length})</span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input className="form-input" style={{ fontSize: 13 }} placeholder="Tên công ty mới…"
            value={newOrgName} onChange={e => setNewOrgName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') createOrg(); }} />
          <button className="btn btn-primary btn-sm" onClick={createOrg} disabled={creating} style={{ gap: 4, flexShrink: 0 }}>
            {creating ? <Loader2 size={14} className="spin" /> : <Plus size={14} />} Tạo
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}><Loader2 className="spin" /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {orgs.map(org => (
              <div key={org.id} onClick={() => selectOrg(org)}
                style={{
                  padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                  border: `1px solid ${selected?.id === org.id ? 'var(--brand-500)' : 'var(--border)'}`,
                  background: selected?.id === org.id ? 'var(--brand-50)' : 'var(--bg-surface-2)',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{org.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                    background: org.is_active ? '#dcfce7' : '#fee2e2', color: org.is_active ? '#166534' : '#991b1b' }}>
                    {org.is_active ? 'Hoạt động' : 'Khóa'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>#{org.slug}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Cột phải: chi tiết tổ chức đang chọn ── */}
      <div style={{ flex: '2 1 420px', minWidth: 320 }}>
        {!selected ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px dashed var(--border)', borderRadius: 16 }}>
            <Building2 size={32} style={{ opacity: 0.4 }} />
            <div style={{ marginTop: 8, fontSize: 13 }}>Chọn một tổ chức để quản lý.</div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{selected.name}</div>
              <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(selected)}>
                {selected.is_active ? 'Khóa tổ chức' : 'Mở khóa'}
              </button>
            </div>

            {/* Tab con */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
              {[
                { id: 'users', label: 'Người dùng', icon: <Users size={14} /> },
                { id: 'scope', label: 'Phạm vi dữ liệu', icon: <Sliders size={14} /> },
                { id: 'admin', label: 'Tạo admin', icon: <ShieldCheck size={14} /> },
              ].map(t => (
                <button key={t.id} onClick={() => setDetailTab(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13, fontWeight: 700,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: detailTab === t.id ? 'var(--brand-600)' : 'var(--text-muted)',
                    borderBottom: `2px solid ${detailTab === t.id ? 'var(--brand-500)' : 'transparent'}`,
                  }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {detailTab === 'users' && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 18 }}>
                {orgUsers.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Chưa có người dùng.</div>
                ) : orgUsers.map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{u.display_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                      background: u.role === 'admin' ? '#ede9fe' : '#f1f5f9', color: u.role === 'admin' ? '#6d28d9' : '#475569' }}>
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {detailTab === 'scope' && (
              <ScopePanel orgId={selected.id} sources={sources} onMessage={onMessage} />
            )}

            {detailTab === 'admin' && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 18, maxWidth: 420 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Tạo quản trị viên cho "{selected.name}"</div>
                <input className="form-input" style={{ fontSize: 13, marginBottom: 8 }} placeholder="Email"
                  value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} />
                <input className="form-input" style={{ fontSize: 13, marginBottom: 8 }} type="password" placeholder="Mật khẩu mạnh (≥8, hoa, số, ký tự đặc biệt)"
                  value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} />
                <input className="form-input" style={{ fontSize: 13, marginBottom: 12 }} placeholder="Tên hiển thị (tùy chọn)"
                  value={newAdmin.display_name} onChange={e => setNewAdmin({ ...newAdmin, display_name: e.target.value })} />
                <button className="btn btn-primary" onClick={createAdmin} style={{ gap: 6 }}>
                  <ShieldCheck size={15} /> Tạo admin tổ chức
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
