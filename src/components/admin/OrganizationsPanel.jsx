// src/components/admin/OrganizationsPanel.jsx
// Super admin quản tổ chức (ADR-005): tạo tổ chức, sửa tên, xóa tổ chức, gán/tạo org admin, đặt phạm vi, xem user.
import { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Loader2, ShieldCheck, Users, Sliders, UserPlus, CheckCircle, Pencil, Trash2, X, Check, AlertTriangle } from 'lucide-react';
import { orgService } from '../../services/organizations';
import { useAuth } from '../../context/AuthContext';
import ScopePanel from './ScopePanel';
import ConfirmModal from '../common/ConfirmModal';
import { tUI } from '../../locales';

export default function OrganizationsPanel({ sources = [], allUsers = [], onMessage, onUserUpdated }) {
  const { user: currentUser } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [newOrgName, setNewOrgName] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit / Delete org state
  const [editingOrgId, setEditingOrgId] = useState(null);
  const [editName, setEditName] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingOrg, setDeletingOrg] = useState(null);

  // Chi tiết org đang chọn
  const [detailTab, setDetailTab] = useState('users'); // users | scope | admin
  const [orgUsers, setOrgUsers] = useState([]);
  
  // Admin management modes in "admin" tab: 'assign' | 'create'
  const [adminMode, setAdminMode] = useState('assign');
  const [selectedExistingUserId, setSelectedExistingUserId] = useState('');
  const [assigning, setAssigning] = useState(false);
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

  const handleStartEdit = (org) => {
    setEditingOrgId(org.id);
    setEditName(org.name);
  };

  const handleSaveEdit = async (orgId) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setUpdating(true);
    try {
      const updated = await orgService.updateOrganization(orgId, { name: trimmed });
      onMessage?.('success', `Đã đổi tên tổ chức thành "${updated.name}".`);
      setEditingOrgId(null);
      await loadOrgs();
      if (selected?.id === orgId) {
        setSelected(prev => prev ? { ...prev, name: updated.name } : null);
      }
      onUserUpdated?.();
    } catch (e) {
      onMessage?.('error', e.response?.data?.detail || 'Cập nhật tên thất bại.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOrg = (org) => {
    setDeletingOrg(org);
  };

  const confirmDeleteOrg = async () => {
    if (!deletingOrg) return;
    const org = deletingOrg;
    setDeleting(true);
    try {
      await orgService.deleteOrganization(org.id);
      onMessage?.('success', `Đã xóa tổ chức "${org.name}".`);
      if (selected?.id === org.id) {
        setSelected(null);
      }
      setDeletingOrg(null);
      await loadOrgs();
      onUserUpdated?.();
    } catch (e) {
      onMessage?.('error', e.response?.data?.detail || 'Xóa tổ chức thất bại.');
    } finally {
      setDeleting(false);
    }
  };

  const handleAssignExistingUser = async () => {
    if (!selected || !selectedExistingUserId) return;
    setAssigning(true);
    try {
      const updated = await orgService.assignOrgAdmin(selected.id, parseInt(selectedExistingUserId, 10));
      onMessage?.('success', `Đã gán "${updated.display_name || updated.email}" làm Admin cho tổ chức "${selected.name}".`);
      setSelectedExistingUserId('');
      loadUsers(selected.id);
      onUserUpdated?.();
    } catch (e) {
      onMessage?.('error', e.response?.data?.detail || 'Không thể gán quản trị viên.');
    } finally {
      setAssigning(false);
    }
  };

  const createAdmin = async () => {
    if (!selected) return;
    try {
      await orgService.createOrgAdmin(selected.id, newAdmin);
      setNewAdmin({ email: '', password: '', display_name: '' });
      onMessage?.('success', 'Đã tạo quản trị viên mới cho tổ chức.');
      loadUsers(selected.id);
      onUserUpdated?.();
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

  // Filter available existing users (exclude super_admins and users already in this org as admin)
  const assignableUsers = allUsers.filter(u => u.role !== 'super_admin');

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* ── Cột trái: danh sách + tạo tổ chức ── */}
      <div style={{ flex: '1 1 300px', minWidth: 280, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, marginBottom: 14 }}>
          <Building2 size={16} /> {tUI('ui.to-chuc')} <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({orgs.length})</span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input className="form-input" style={{ fontSize: 13 }} placeholder={tUI('ui.ten-cong-ty-phan-vung-moi')}
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
              <div key={org.id}
                style={{
                  padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                  border: `1px solid ${selected?.id === org.id ? 'var(--brand-500)' : 'var(--border-subtle)'}`,
                  background: selected?.id === org.id ? 'var(--brand-50)' : 'var(--bg-surface-2)',
                  transition: 'all 0.15s ease',
                }}>
                {editingOrgId === org.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <input
                      className="form-input"
                      style={{ fontSize: 12, padding: '4px 8px' }}
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveEdit(org.id);
                        if (e.key === 'Escape') setEditingOrgId(null);
                      }}
                      autoFocus
                    />
                    <button className="btn btn-primary btn-xs" onClick={() => handleSaveEdit(org.id)} disabled={updating} style={{ padding: '4px 6px' }}>
                      {updating ? <Loader2 size={12} className="spin" /> : <Check size={12} />}
                    </button>
                    <button className="btn btn-ghost btn-xs" onClick={() => setEditingOrgId(null)} disabled={updating} style={{ padding: '4px 6px' }}>
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div onClick={() => selectOrg(org)} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: selected?.id === org.id ? 'var(--brand-700)' : 'var(--text-primary)' }}>
                        {org.name}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, flexShrink: 0,
                        background: org.is_active ? '#dcfce7' : '#fee2e2', color: org.is_active ? '#166534' : '#991b1b' }}>
                        {org.is_active ? 'Hoạt động' : 'Khóa'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                      <span>#{org.slug}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost btn-xs" onClick={() => handleStartEdit(org)} title={tUI('ui.doi-ten-to-chuc')} style={{ padding: '2px 4px', height: 22, color: 'var(--text-muted)' }}>
                          <Pencil size={12} />
                        </button>
                        <button className="btn btn-ghost btn-xs" onClick={() => handleDeleteOrg(org)} title={tUI('ui.xoa-to-chuc')} style={{ padding: '2px 4px', height: 22, color: '#ef4444' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
            <div style={{ marginTop: 8, fontSize: 13 }}>{tUI('ui.chon-mot-to-chuc-de-quan-ly')}</div>
          </div>
        ) : (
          <div>
            {/* Header chi tiết tổ chức: tên, đổi tên, mở/khóa, xóa */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '14px 18px' }}>
              {editingOrgId === selected.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 360 }}>
                  <input
                    className="form-input"
                    style={{ fontSize: 14, fontWeight: 700 }}
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveEdit(selected.id);
                      if (e.key === 'Escape') setEditingOrgId(null);
                    }}
                    autoFocus
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleSaveEdit(selected.id)}
                    disabled={updating}
                    title={tUI('ui.luu-ten')}
                    style={{ gap: 4 }}
                  >
                    {updating ? <Loader2 size={14} className="spin" /> : <Check size={14} />} Lưu
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setEditingOrgId(null)}
                    disabled={updating}
                    title={tUI('ui.huy')}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{selected.name}</div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleStartEdit(selected)}
                    title={tUI('ui.doi-ten-to-chuc')}
                    style={{ padding: '4px 6px', color: 'var(--text-muted)' }}
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(selected)}>
                  {selected.is_active ? 'Khóa tổ chức' : 'Mở khóa'}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleDeleteOrg(selected)}
                  disabled={deleting}
                  style={{ color: '#ef4444', gap: 4 }}
                  title={tUI('ui.xoa-to-chuc')}
                >
                  {deleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />} Xóa tổ chức
                </button>
              </div>
            </div>

            {/* Tab con */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
              {[
                { id: 'users', label: `Người dùng (${orgUsers.length})`, icon: <Users size={14} /> },
                { id: 'scope', label: tUI('ui.pham-vi-du-lieu'), icon: <Sliders size={14} /> },
                { id: 'admin', label: tUI('ui.cap-quyen-admin'), icon: <ShieldCheck size={14} /> },
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
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{tUI('ui.chua-co-nguoi-dung-trong-to-chuc-nay')}</div>
                ) : orgUsers.map(u => {
                  const isMe = currentUser && (u.id === currentUser.id || (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase()));
                  return (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                          {u.display_name}
                          {isMe && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-600, #2563eb)', marginLeft: 6 }}>{tUI('ui.ban')}</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                        background: u.role === 'admin' ? '#ede9fe' : u.role === 'staff' ? '#f0fdf4' : '#f1f5f9',
                        color: u.role === 'admin' ? '#6d28d9' : u.role === 'staff' ? '#166534' : '#475569' }}>
                        {u.role === 'admin' ? '🔰 ADMIN PHÂN VÙNG' : u.role === 'staff' ? '🧑‍💼 NHÂN VIÊN' : '👤 NGƯỜI DÙNG'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {detailTab === 'scope' && (
              <ScopePanel orgId={selected.id} sources={sources} onMessage={onMessage} />
            )}

            {detailTab === 'admin' && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 20 }}>
                {/* ── 1. Quản trị viên hiện có ── */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <ShieldCheck size={14} style={{ color: '#6d28d9' }} /> Quản trị viên hiện có ({orgUsers.filter(u => u.role === 'admin').length})
                  </div>

                  {orgUsers.filter(u => u.role === 'admin').length === 0 ? (
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', background: 'var(--bg-surface-2)', padding: '10px 14px', borderRadius: 10, fontStyle: 'italic' }}>
                      Tổ chức này chưa có Quản trị viên nào.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                      {orgUsers.filter(u => u.role === 'admin').map(u => {
                        const isMe = currentUser && (u.id === currentUser.id || (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase()));
                        return (
                          <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-surface-2)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ede9fe', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                              {(u.display_name || u.email || 'A')[0].toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {u.display_name || u.email}
                                {isMe && <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--brand-600, #2563eb)', marginLeft: 4 }}>{tUI('ui.ban')}</span>}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {u.email}
                              </div>
                            </div>
                          <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: '#ede9fe', color: '#6d28d9', flexShrink: 0 }}>
                            ADMIN
                          </span>
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>

                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '18px 0' }} />

                {/* ── 2. Thêm / Gán Admin mới ── */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Thêm Quản Trị Viên
                    </span>

                    {/* Sub-toggle */}
                    <div style={{ display: 'inline-flex', gap: 4, background: 'var(--bg-surface-2)', padding: 3, borderRadius: 8 }}>
                      <button
                        onClick={() => setAdminMode('assign')}
                        style={{
                          padding: '4px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer',
                          background: adminMode === 'assign' ? 'var(--bg-surface)' : 'transparent',
                          color: adminMode === 'assign' ? 'var(--brand-600)' : 'var(--text-muted)',
                          boxShadow: adminMode === 'assign' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        }}>
                        <UserPlus size={12} style={{ display: 'inline', marginRight: 4 }} /> Nâng cấp TK sẵn có
                      </button>
                      <button
                        onClick={() => setAdminMode('create')}
                        style={{
                          padding: '4px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer',
                          background: adminMode === 'create' ? 'var(--bg-surface)' : 'transparent',
                          color: adminMode === 'create' ? 'var(--brand-600)' : 'var(--text-muted)',
                          boxShadow: adminMode === 'create' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        }}>
                        <Plus size={12} style={{ display: 'inline', marginRight: 4 }} /> Tạo TK Mới
                      </button>
                    </div>
                  </div>

                  {adminMode === 'assign' ? (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <select
                        className="form-input"
                        style={{ fontSize: 13, flex: '1 1 240px' }}
                        value={selectedExistingUserId}
                        onChange={e => setSelectedExistingUserId(e.target.value)}
                      >
                        <option value="">{tUI('ui.chon-tai-khoan-tu-danh-sach')}</option>
                        {assignableUsers.map(u => (
                          <option key={u.id} value={u.id}>
                            👤 {u.display_name || u.email} ({u.email})
                          </option>
                        ))}
                      </select>

                      <button
                        className="btn btn-primary"
                        onClick={handleAssignExistingUser}
                        disabled={assigning || !selectedExistingUserId}
                        style={{ gap: 6, whiteSpace: 'nowrap' }}
                      >
                        {assigning ? <Loader2 size={15} className="spin" /> : <ShieldCheck size={15} />}
                        Gán Quyền Admin
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                        <input className="form-input" style={{ fontSize: 13 }} placeholder="Email (*)"
                          value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} />
                        <input className="form-input" style={{ fontSize: 13 }} type="password" placeholder={tUI('ui.mat-khau')}
                          value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} />
                        <input className="form-input" style={{ fontSize: 13 }} placeholder={tUI('ui.ten-hien-thi-tuy-chon')}
                          value={newAdmin.display_name} onChange={e => setNewAdmin({ ...newAdmin, display_name: e.target.value })} />
                      </div>
                      <button className="btn btn-primary" onClick={createAdmin} style={{ gap: 6, width: 'fit-content', alignSelf: 'flex-end' }}>
                        <ShieldCheck size={15} /> Tạo Admin Mới
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modal xác nhận xóa tổ chức ── */}
      <ConfirmModal
        isOpen={!!deletingOrg}
        title={tUI('ui.xoa-to-chuc-2')}
        message="Tất cả người dùng thuộc tổ chức này sẽ được tự động chuyển thành chưa thuộc tổ chức."
        itemName={deletingOrg?.name}
        confirmText="Xóa Tổ Chức"
        cancelText="Hủy Bỏ"
        type="danger"
        loading={deleting}
        onConfirm={confirmDeleteOrg}
        onClose={() => setDeletingOrg(null)}
      />
    </div>
  );
}

