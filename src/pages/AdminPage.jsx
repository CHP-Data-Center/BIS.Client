// src/pages/AdminPage.jsx
import { useState, useEffect } from 'react';
import {
  ShieldCheck, RefreshCw, Users, Database, ShieldAlert, Mail, Plus, Trash2,
  Play, CheckCircle2, AlertCircle, Loader2, Globe, Cpu, Zap, Activity,
  Sliders, Search, ArrowUpRight, Check, X, Server, Edit
} from 'lucide-react';
import { adminService } from '../services/admin';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('crawl');
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg]             = useState(null);

  // Data states
  const [users, setUsers]         = useState([]);
  const [sources, setSources]     = useState([]);
  const [crawlLogs, setCrawlLogs] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [whitelist, setWhitelist] = useState([]);

  // Edit User state
  const [editingUser, setEditingUser] = useState(null);

  // New item forms
  const [newUser, setNewUser]           = useState({ email: '', password: '', display_name: '', role: 'user' });
  const [newSource, setNewSource]       = useState({ name: '', source_type: 'press', url: '', parser_type: 'rss' });
  const [newBlacklist, setNewBlacklist] = useState('');
  const [newWhitelist, setNewWhitelist] = useState('');

  const showAlert = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, s, logs, bl, wl] = await Promise.all([
        adminService.getUsers().catch(() => []),
        adminService.getSources().catch(() => []),
        adminService.getCrawlLogs().catch(() => []),
        adminService.getBlacklist().catch(() => []),
        adminService.getWhitelist().catch(() => []),
      ]);
      setUsers(u);
      setSources(s);
      setCrawlLogs(logs);
      setBlacklist(bl);
      setWhitelist(wl);
    } catch (e) {
      console.warn('Admin load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Actions
  const handleCrawlNow = async () => {
    setActionLoading(true);
    try {
      const res = await adminService.crawlNow();
      showAlert('success', `⚡ Kích hoạt Crawl thành công! Đã lưu ${res.total_saved} bài mới / tổng ${res.total_items} tin tìm thấy.`);
      loadData();
    } catch (e) {
      showAlert('error', e.response?.data?.detail || 'Lỗi khi kích hoạt crawl.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunDigestAll = async () => {
    setActionLoading(true);
    try {
      const res = await adminService.runDigestAll();
      showAlert('success', `📧 Đã gửi Email Digest! ${res.emails_sent} email đã gửi thành công.`);
    } catch (e) {
      showAlert('error', e.response?.data?.detail || 'Lỗi khi gửi email digest.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password) return;
    setActionLoading(true);
    try {
      const created = await adminService.createUser(newUser);
      setUsers(prev => [...prev, created]);
      setNewUser({ email: '', password: '', display_name: '', role: 'user' });
      showAlert('success', `Đã tạo tài khoản ${created.email}!`);
    } catch (e) {
      showAlert('error', e.response?.data?.detail || 'Không thể tạo user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return;
    try {
      await adminService.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      showAlert('success', 'Đã xóa tài khoản thành công.');
    } catch (e) {
      showAlert('error', 'Lỗi khi xóa tài khoản.');
    }
  };

  const handleOpenEditUser = (u) => {
    setEditingUser({
      id: u.id,
      email: u.email || '',
      display_name: u.display_name || '',
      role: u.role || 'user',
      password: '',
      is_active: u.is_active ?? true,
      email_digest_enabled: u.email_digest_enabled ?? true,
      digest_hour: u.digest_hour ?? 7,
      timezone: u.timezone || 'Asia/Ho_Chi_Minh',
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setActionLoading(true);
    try {
      const payload = {
        email: editingUser.email,
        display_name: editingUser.display_name,
        role: editingUser.role,
        is_active: editingUser.is_active,
        email_digest_enabled: editingUser.email_digest_enabled,
        digest_hour: parseInt(editingUser.digest_hour, 10),
        timezone: editingUser.timezone,
      };
      if (editingUser.password && editingUser.password.trim() !== '') {
        payload.password = editingUser.password.trim();
      }
      const updated = await adminService.updateUser(editingUser.id, payload);
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      setEditingUser(null);
      showAlert('success', `Đã cập nhật thông tin tài khoản ${updated.email}!`);
    } catch (e) {
      showAlert('error', e.response?.data?.detail || 'Lỗi khi cập nhật tài khoản.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSource = async (e) => {
    e.preventDefault();
    if (!newSource.name || !newSource.url) return;
    setActionLoading(true);
    try {
      const created = await adminService.createSource(newSource);
      setSources(prev => [...prev, created]);
      setNewSource({ name: '', source_type: 'press', url: '', parser_type: 'rss' });
      showAlert('success', `Đã thêm nguồn tin "${created.name}"!`);
    } catch (e) {
      showAlert('error', e.response?.data?.detail || 'Lỗi khi thêm nguồn tin.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSource = async (id) => {
    if (!confirm('Xóa nguồn tin này khỏi hệ thống?')) return;
    try {
      await adminService.deleteSource(id);
      setSources(prev => prev.filter(s => s.id !== id));
      showAlert('success', 'Đã xóa nguồn tin.');
    } catch (e) {
      showAlert('error', 'Không thể xóa nguồn tin.');
    }
  };

  const handleAddBlacklist = async (e) => {
    e.preventDefault();
    if (!newBlacklist.trim()) return;
    try {
      const item = await adminService.addBlacklist(newBlacklist.trim());
      setBlacklist(prev => [...prev, item]);
      setNewBlacklist('');
      showAlert('success', 'Đã thêm từ khóa vào Blacklist.');
    } catch (e) {
      showAlert('error', 'Lỗi khi thêm từ khóa.');
    }
  };

  const handleAddWhitelist = async (e) => {
    e.preventDefault();
    if (!newWhitelist.trim()) return;
    try {
      const item = await adminService.addWhitelist(newWhitelist.trim());
      setWhitelist(prev => [...prev, item]);
      setNewWhitelist('');
      showAlert('success', 'Đã thêm từ khóa vào Whitelist.');
    } catch (e) {
      showAlert('error', 'Lỗi khi thêm từ khóa.');
    }
  };

  const tabs = [
    { id: 'crawl',     label: 'Nguồn & Crawler', icon: <Database size={16} />, badge: sources.length },
    { id: 'users',     label: 'Tài Khoản User',  icon: <Users size={16} />,    badge: users.length },
    { id: 'filters',   label: 'Bộ Lọc Từ Khóa', icon: <ShieldAlert size={16} />, badge: blacklist.length + whitelist.length },
    { id: 'digest',    label: 'Email Digest',    icon: <Mail size={16} /> },
  ];

  return (
    <div style={{ width: '100%' }}>
      {/* ── Admin Hero Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e293b 100%)',
        borderRadius: 24, padding: '28px 32px', color: 'white',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 12px 36px rgba(15,23,42,0.25)',
        marginBottom: 28, border: '1px solid rgba(255,255,255,0.1)',
      }}>
        {/* Glow ambient orbs */}
        <div style={{ position: 'absolute', right: -40, top: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: '30%', bottom: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, zIndex: 1, position: 'relative' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 12px', borderRadius: 20, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(129,140,248,0.3)', fontSize: 11, fontWeight: 700, color: '#a5b4fc', marginBottom: 10 }}>
              <ShieldCheck size={13} /> CENTER CONTROL PANEL
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.5px' }}>
              Bảng Quản Trị Hệ Thống BIS
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6, maxWidth: 520, lineHeight: 1.5 }}>
              Điều hành tiến trình crawl tự động, quản lý nguồn dữ liệu, danh sách tài khoản và bộ lọc thông minh.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className="btn"
              onClick={loadData}
              style={{
                background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12, padding: '10px 16px', fontSize: 13, fontWeight: 700, gap: 6,
                backdropFilter: 'blur(8px)', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Làm Mới Data
            </button>

            <button
              className="btn"
              onClick={handleCrawlNow}
              disabled={actionLoading}
              id="btn-admin-crawl-now"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                color: 'white', border: 'none', borderRadius: 12,
                padding: '10px 22px', fontSize: 13, fontWeight: 800, gap: 8,
                boxShadow: '0 6px 20px rgba(99,102,241,0.45)', cursor: 'pointer',
                transition: 'transform 0.15s, boxShadow 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              {actionLoading ? <Loader2 size={15} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Zap size={15} style={{ color: '#fef08a' }} />}
              ⚡ Kích Hoạt Crawl Ngay
            </button>
          </div>
        </div>

        {/* System Stats Bar */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
          marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          {[
            { label: 'Nguồn Crawler', val: sources.length, icon: <Database size={15} style={{ color: '#818cf8' }} />, sub: 'Nguồn tự động' },
            { label: 'Tài Khoản', val: users.length, icon: <Users size={15} style={{ color: '#38bdf8' }} />, sub: 'Người dùng' },
            { label: 'Từ Khóa Lọc', val: blacklist.length + whitelist.length, icon: <ShieldAlert size={15} style={{ color: '#f472b6' }} />, sub: `${blacklist.length} cấm · ${whitelist.length} ưu tiên` },
            { label: 'Trạng Thái', val: 'Online', icon: <Activity size={15} style={{ color: '#4ade80' }} />, sub: 'Crawler mỗi 4h' },
          ].map((st, idx) => (
            <div key={idx} style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '12px 16px',
              border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{st.label}</span>
                {st.icon}
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>{st.val}</div>
              <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>{st.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alert Notification Bar */}
      {msg && (
        <div style={{
          padding: '14px 18px', borderRadius: 14, fontSize: 13.5, fontWeight: 700, marginBottom: 24,
          background: msg.type === 'success' ? '#f0fdf4' : '#fff1f2',
          border: `1.5px solid ${msg.type === 'success' ? '#86efac' : '#fca5a5'}`,
          color: msg.type === 'success' ? '#15803d' : '#b91c1c',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {msg.text}
        </div>
      )}

      {/* ── Segmented Navigation Tabs ── */}
      <div style={{
        display: 'flex', gap: 8, padding: 6,
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 16, marginBottom: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
      }}>
        {tabs.map(t => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 12, border: 'none',
                background: active ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                color: active ? 'white' : 'var(--text-secondary)',
                fontWeight: active ? 800 : 600, fontSize: 13, cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: active ? '0 4px 14px rgba(37,99,235,0.35)' : 'none',
              }}
            >
              {t.icon}
              {t.label}
              {t.badge != null && (
                <span style={{
                  fontSize: 10.5, fontWeight: 800, padding: '1px 7px', borderRadius: 20,
                  background: active ? 'rgba(255,255,255,0.25)' : 'var(--bg-surface-2)',
                  color: active ? 'white' : 'var(--text-muted)',
                }}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={32} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 12px', display: 'block', color: '#3b82f6' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Đang tải cấu hình quản trị hệ thống...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: CRAWLER & SOURCES */}
          {activeTab === 'crawl' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Add Source Form Card */}
              <div style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 20, padding: '22px 24px', boxShadow: '0 6px 24px rgba(0,0,0,0.03)',
              }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                    <Plus size={16} />
                  </div>
                  Thêm Nguồn Crawl Tự Động Mới
                </div>

                <form onSubmit={handleCreateSource} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 1fr', gap: 14, alignItems: 'end' }}>
                  <div>
                    <label className="form-label">Tên nguồn tin *</label>
                    <input className="form-input" placeholder="vd: VnExpress Kinh Doanh" value={newSource.name} onChange={e => setNewSource({ ...newSource, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="form-label">Loại nguồn *</label>
                    <select className="form-input" value={newSource.source_type} onChange={e => setNewSource({ ...newSource, source_type: e.target.value })}>
                      <option value="press">📰 Báo Chí (press)</option>
                      <option value="gov">📋 Đấu Thầu (gov)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Đường dẫn RSS / Endpoint API *</label>
                    <input className="form-input" placeholder="https://vnexpress.net/rss/kinh-doanh.rss" value={newSource.url} onChange={e => setNewSource({ ...newSource, url: e.target.value })} required />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading} style={{ gap: 6, height: 42, justifyContent: 'center' }}>
                    {actionLoading ? <Loader2 size={15} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Plus size={15} />}
                    Thêm Nguồn
                  </button>
                </form>
              </div>

              {/* Sources Table */}
              <div style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 20, overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,0.03)',
              }}>
                <div style={{
                  padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--bg-surface-2)',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Database size={16} style={{ color: '#3b82f6' }} />
                    Danh Sách Nguồn Đang Theo Dõi ({sources.length})
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '3px 10px', borderRadius: 20, border: '1px solid #a7f3d0' }}>
                    🟢 Crawler Active
                  </span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface-2)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '12px 20px' }}>Tên Nguồn</th>
                      <th style={{ padding: '12px 20px' }}>Loại Nguồn</th>
                      <th style={{ padding: '12px 20px' }}>URL / Target</th>
                      <th style={{ padding: '12px 20px' }}>Lần Crawl Cuối</th>
                      <th style={{ padding: '12px 20px', textAlign: 'right' }}>Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sources.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                          Chưa có nguồn tin nào. Thêm nguồn đầu tiên ở trên.
                        </td>
                      </tr>
                    ) : sources.map(s => {
                      const isGov = s.source_type === 'gov';
                      return (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}>
                          <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 16 }}>{isGov ? '📋' : '📰'}</span>
                              {s.name}
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{
                              fontSize: 10.5, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                              background: isGov ? '#f5f3ff' : '#eff6ff',
                              color: isGov ? '#8b5cf6' : '#3b82f6',
                              border: `1px solid ${isGov ? '#ddd6fe' : '#bfdbfe'}`,
                            }}>
                              {isGov ? 'ĐẤU THẦU (GOV)' : 'BÁO CHÍ (PRESS)'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px', color: 'var(--text-muted)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-600)', textDecoration: 'none', fontWeight: 600 }}>
                              {s.url}
                            </a>
                          </td>
                          <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 12 }}>
                            {s.last_crawled_at ? new Date(s.last_crawled_at).toLocaleString('vi-VN') : 'Vừa khởi tạo'}
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleDeleteSource(s.id)}
                              title="Xóa nguồn"
                              style={{ color: '#ef4444', padding: '6px 10px' }}
                            >
                              <Trash2 size={14} /> Xóa
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: USERS */}
          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Add User Form Card */}
              <div style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 20, padding: '22px 24px', boxShadow: '0 6px 24px rgba(0,0,0,0.03)',
              }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                    <Users size={16} />
                  </div>
                  Tạo Tài Khoản Người Dùng Mới
                </div>

                <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, alignItems: 'end' }}>
                  <div>
                    <label className="form-label">Email tài khoản *</label>
                    <input className="form-input" type="email" placeholder="user@ckjvn.vn" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                  </div>
                  <div>
                    <label className="form-label">Mật khẩu khởi tạo *</label>
                    <input className="form-input" type="password" placeholder="••••••••" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                  </div>
                  <div>
                    <label className="form-label">Họ và tên hiển thị</label>
                    <input className="form-input" placeholder="Nguyễn Văn A" value={newUser.display_name} onChange={e => setNewUser({ ...newUser, display_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Phân quyền vai trò</label>
                    <select className="form-input" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                      <option value="user">👤 User (Người dùng)</option>
                      <option value="admin">👑 Admin (Quản trị viên)</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading} style={{ gridColumn: 'span 4', width: 'fit-content', gap: 6, padding: '9px 22px' }}>
                    {actionLoading ? <Loader2 size={15} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Plus size={15} />}
                    Tạo Tài Khoản Mới
                  </button>
                </form>
              </div>

              {/* Users Table Card */}
              <div style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 20, overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,0.03)',
              }}>
                <div style={{
                  padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)',
                  fontWeight: 800, fontSize: 15, background: 'var(--bg-surface-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span>Danh Sách Người Dùng ({users.length})</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Tự động cấp quyền JWT</span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface-2)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '12px 20px' }}>Họ &amp; Tên</th>
                      <th style={{ padding: '12px 20px' }}>Email</th>
                      <th style={{ padding: '12px 20px' }}>Vai Trò</th>
                      <th style={{ padding: '12px 20px' }}>Trạng Thái</th>
                      <th style={{ padding: '12px 20px' }}>Ngày Khởi Tạo</th>
                      <th style={{ padding: '12px 20px', textAlign: 'right' }}>Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => {
                      const isAdminRole = u.role === 'admin';
                      const isActive = u.is_active !== false;
                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: isAdminRole ? 'linear-gradient(135deg, #f59e0b, #ec4899)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 800,
                              }}>
                                {(u.display_name || u.email).slice(0, 2).toUpperCase()}
                              </div>
                              {u.display_name || u.email}
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{u.email}</td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{
                              fontSize: 10.5, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                              background: isAdminRole ? '#fef3c7' : '#f1f5f9',
                              color: isAdminRole ? '#92400e' : '#475569',
                              border: `1px solid ${isAdminRole ? '#fde68a' : '#e2e8f0'}`,
                            }}>
                              {isAdminRole ? '👑 ADMIN' : '👤 USER'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{
                              fontSize: 10.5, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                              background: isActive ? '#ecfdf5' : '#fef2f2',
                              color: isActive ? '#047857' : '#b91c1c',
                              border: `1px solid ${isActive ? '#a7f3d0' : '#fca5a5'}`,
                            }}>
                              {isActive ? '🟢 HOẠT ĐỘNG' : '🔴 ĐÃ KHÓA'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 12 }}>
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '-'}
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleOpenEditUser(u)}
                                style={{ color: '#2563eb', padding: '6px 10px' }}
                                title="Chỉnh sửa tài khoản"
                              >
                                <Edit size={14} /> Sửa
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleDeleteUser(u.id)}
                                style={{ color: '#ef4444', padding: '6px 10px' }}
                                title="Xóa tài khoản"
                              >
                                <Trash2 size={14} /> Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: BLACK & WHITE LIST */}
          {activeTab === 'filters' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
              {/* Blacklist Card */}
              <div style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 20, padding: 24, boxShadow: '0 6px 24px rgba(0,0,0,0.03)',
              }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#ef4444', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldAlert size={20} /> Blacklist (Từ Khóa Cấm Quét)
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                  Các tin tức chứa từ khóa trong danh sách này sẽ bị tự động bỏ qua khi crawl.
                </p>
                <form onSubmit={handleAddBlacklist} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input className="form-input" placeholder="Nhập từ khóa cấm..." value={newBlacklist} onChange={e => setNewBlacklist(e.target.value)} />
                  <button type="submit" className="btn btn-primary" style={{ gap: 4, padding: '0 16px' }}>
                    <Plus size={15} /> Thêm
                  </button>
                </form>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {blacklist.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Chưa có từ khóa nào.</span>
                  ) : blacklist.map(b => (
                    <span key={b.id} style={{
                      background: '#fff1f2', border: '1px solid #fecdd3', color: '#e11d48',
                      fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      {b.term}
                      <button onClick={async () => { await adminService.deleteBlacklist(b.id); setBlacklist(prev => prev.filter(x => x.id !== b.id)); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#e11d48', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Whitelist Card */}
              <div style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 20, padding: 24, boxShadow: '0 6px 24px rgba(0,0,0,0.03)',
              }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#10b981', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={20} /> Whitelist (Từ Khóa Ưu Tiên)
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                  Các tin tức chứa từ khóa ưu tiên sẽ được gắn cờ mốc quan trọng và đưa lên đầu.
                </p>
                <form onSubmit={handleAddWhitelist} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input className="form-input" placeholder="Nhập từ khóa ưu tiên..." value={newWhitelist} onChange={e => setNewWhitelist(e.target.value)} />
                  <button type="submit" className="btn btn-primary" style={{ gap: 4, padding: '0 16px' }}>
                    <Plus size={15} /> Thêm
                  </button>
                </form>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {whitelist.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Chưa có từ khóa nào.</span>
                  ) : whitelist.map(w => (
                    <span key={w.id} style={{
                      background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857',
                      fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      {w.term}
                      <button onClick={async () => { await adminService.deleteWhitelist(w.id); setWhitelist(prev => prev.filter(x => x.id !== w.id)); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#047857', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DIGEST */}
          {activeTab === 'digest' && (
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 20, padding: 36, textAlign: 'center', boxShadow: '0 6px 24px rgba(0,0,0,0.03)',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #dbeafe, #eff6ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', color: '#2563eb',
              }}>
                <Mail size={32} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>
                Gửi Email Digest Hàng Ngày Toàn Hệ Thống
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto 24px', lineHeight: 1.6 }}>
                Hệ thống sẽ quét tất cả bài viết mới nhất khớp với bộ từ khóa cá nhân của từng người dùng và tự động gửi bản tin qua Email.
              </p>
              <button
                className="btn btn-primary"
                onClick={handleRunDigestAll}
                disabled={actionLoading}
                style={{ gap: 8, padding: '12px 28px', fontSize: 14, fontWeight: 800, borderRadius: 14 }}
              >
                {actionLoading ? <Loader2 size={16} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Mail size={16} />}
                Kích Hoạt Gửi Email Digest Ngay
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Edit User Modal ── */}
      {editingUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20,
        }}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 24, padding: '28px 32px', width: '100%', maxWidth: 580,
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)', position: 'relative',
            animation: 'fadeIn 0.2s ease-out',
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <Edit size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    Chỉnh Sửa Tài Khoản Người Dùng
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cập nhật phân quyền, mật khẩu và cài đặt cá nhân</span>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 8 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div>
                <label className="form-label">Email tài khoản *</label>
                <input
                  className="form-input"
                  type="email"
                  value={editingUser.email}
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Họ và tên hiển thị</label>
                <input
                  className="form-input"
                  type="text"
                  value={editingUser.display_name}
                  onChange={e => setEditingUser({ ...editingUser, display_name: e.target.value })}
                  placeholder="Họ và tên"
                />
              </div>

              <div>
                <label className="form-label">Phân quyền vai trò</label>
                <select
                  className="form-input"
                  value={editingUser.role}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  <option value="user">👤 User (Người dùng)</option>
                  <option value="admin">👑 Admin (Quản trị viên)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Trạng thái tài khoản</label>
                <select
                  className="form-input"
                  value={editingUser.is_active ? 'true' : 'false'}
                  onChange={e => setEditingUser({ ...editingUser, is_active: e.target.value === 'true' })}
                >
                  <option value="true">🟢 Hoạt động</option>
                  <option value="false">🔴 Đã khóa tài khoản</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Mật khẩu mới (Đặt lại mật khẩu)</label>
                <input
                  className="form-input"
                  type="password"
                  value={editingUser.password}
                  onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                  placeholder="Để trống nếu không muốn đổi mật khẩu (Mật khẩu cần ≥8 ký tự, có chữ hoa, số & ký tự đặc biệt)"
                />
              </div>

              <div>
                <label className="form-label">Bản tin Email Digest</label>
                <select
                  className="form-input"
                  value={editingUser.email_digest_enabled ? 'true' : 'false'}
                  onChange={e => setEditingUser({ ...editingUser, email_digest_enabled: e.target.value === 'true' })}
                >
                  <option value="true">📧 Bật nhận Email Digest</option>
                  <option value="false">🔕 Tắt Email Digest</option>
                </select>
              </div>

              <div>
                <label className="form-label">Giờ nhận Digest (0 - 23h)</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  max={23}
                  value={editingUser.digest_hour}
                  onChange={e => setEditingUser({ ...editingUser, digest_hour: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditingUser(null)}
                  style={{ padding: '10px 20px', borderRadius: 12 }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                  style={{ padding: '10px 24px', borderRadius: 12, gap: 8, fontWeight: 800 }}
                >
                  {actionLoading ? <Loader2 size={16} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Check size={16} />}
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
