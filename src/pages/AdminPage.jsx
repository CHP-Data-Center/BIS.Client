// src/pages/AdminPage.jsx
import { useState, useEffect } from 'react';
import {
  ShieldCheck, RefreshCw, Users, Database, ShieldAlert, Mail, Plus, Trash2,
  Play, CheckCircle2, AlertCircle, Loader2, Globe, Cpu, Zap, Activity,
  Sliders, Search, ArrowUpRight, Check, X, Server, Edit, CheckCircle, XCircle, Building2
} from 'lucide-react';
import { adminService } from '../services/admin';
import { orgService } from '../services/organizations';
import { useAuth } from '../context/AuthContext';
import { useCrawl } from '../context/CrawlContext';
import OrganizationsPanel from '../components/admin/OrganizationsPanel';
import ScopePanel from '../components/admin/ScopePanel';
import ConfirmModal from '../components/common/ConfirmModal';

export default function AdminPage() {
  const { user, isSuperAdmin, isRegionalAdmin, userRegion } = useAuth();
  const { isCrawling, triggerCrawl } = useCrawl();
  const [activeTab, setActiveTab] = useState('crawl');
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg]             = useState(null);

  // Data states
  const [users, setUsers]         = useState([]);
  const [sources, setSources]     = useState([]);
  const [pendingSources, setPendingSources] = useState([]);
  const [crawlLogs, setCrawlLogs] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [whitelist, setWhitelist] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Region dropdown states
  const [customRegions, setCustomRegions] = useState([]);
  const [isAddingNewRegion, setIsAddingNewRegion] = useState(false);
  const [isAddingEditRegion, setIsAddingEditRegion] = useState(false);
  const [isAddingSourceEditRegion, setIsAddingSourceEditRegion] = useState(false);
  const [newCustomRegionInput, setNewCustomRegionInput] = useState('');

  const allRegions = Array.from(new Set([
    'Toàn quốc', 'Miền Bắc', 'Miền Nam', 'Miền Trung', 'Hà Nội', 'TP.HCM',
    ...customRegions,
    ...users.map(u => u.region).filter(Boolean),
  ]));

  // Edit User state
  const [editingUser, setEditingUser] = useState(null);

  // New item forms
  const [newUser, setNewUser]           = useState({
    email: '',
    password: '',
    display_name: '',
    role: 'user',
    organization_id: null,
    region: userRegion || 'Toàn quốc',
    permissions: {
      can_view_press: true,
      can_view_bidding: true,
      can_view_oda: true,
      can_manage_keywords: true,
      can_export_data: true,
    },
  });
  const [newSource, setNewSource]       = useState({ name: '', source_type: 'press', url: '', parser_type: 'rss' });
  const [editingSource, setEditingSource] = useState(null);
  const [newBlacklist, setNewBlacklist] = useState('');
  const [newWhitelist, setNewWhitelist] = useState('');

  const showAlert = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, s, pending, logs, bl, wl, orgs] = await Promise.all([
        adminService.getUsers().catch(() => []),
        adminService.getSources().catch(() => []),
        isSuperAdmin ? adminService.getPendingSources().catch(() => []) : Promise.resolve([]),
        adminService.getCrawlLogs().catch(() => []),
        adminService.getBlacklist().catch(() => []),
        adminService.getWhitelist().catch(() => []),
        orgService.listOrganizations().catch(() => []),
      ]);
      setUsers(u || []);
      const approvedOnly = (s || []).filter(item => !item.status || item.status === 'approved');
      setSources(approvedOnly);
      setPendingSources(pending || []);
      setCrawlLogs(logs || []);
      setBlacklist(bl || []);
      setWhitelist(wl || []);
      setOrganizations(orgs || []);
    } catch (e) {
      console.warn('Admin load error:', e);
      showAlert('error', e.response?.data?.detail || 'Phiên làm việc hết hạn hoặc lỗi kết nối.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Actions
  const handleCrawlNow = async () => {
    setActionLoading(true);
    try {
      await triggerCrawl();
      loadData();
    } catch (e) {
      console.warn('Crawl now error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveSource = async (sourceId) => {
    setActionLoading(true);
    try {
      const approved = await adminService.approveSource(sourceId);
      setPendingSources(prev => prev.filter(s => s.id !== sourceId));
      setSources(prev => {
        const exists = prev.some(s => s.id === sourceId);
        if (exists) {
          return prev.map(s => s.id === sourceId ? approved : s);
        }
        return [...prev, approved];
      });
      showAlert('success', `Đã duyệt nguồn tin "${approved.name}"!`);
    } catch (e) {
      showAlert('error', 'Lỗi khi duyệt nguồn.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSource = async (sourceId) => {
    setActionLoading(true);
    try {
      await adminService.rejectSource(sourceId);
      setPendingSources(prev => prev.filter(s => s.id !== sourceId));
      setSources(prev => prev.filter(s => s.id !== sourceId));
      showAlert('success', 'Đã từ chối đề xuất nguồn tin.');
    } catch (e) {
      showAlert('error', 'Lỗi khi từ chối đề xuất nguồn.');
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
      const payload = {
        ...newUser,
        organization_id: newUser.organization_id || null,
        region: isRegionalAdmin ? userRegion : newUser.region,
      };
      const created = await adminService.createUser(payload);
      setUsers(prev => [...prev, created]);
      setNewUser({
        email: '',
        password: '',
        display_name: '',
        role: 'user',
        organization_id: null,
        region: userRegion || 'Toàn quốc',
        permissions: {
          can_view_press: true,
          can_view_bidding: true,
          can_view_oda: true,
          can_manage_keywords: true,
          can_export_data: true,
        },
      });
      showAlert('success', `Đã tạo tài khoản ${created.email}!`);
    } catch (e) {
      showAlert('error', e.response?.data?.detail || 'Không thể tạo user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = (u) => {
    setDeleteConfirm({
      type: 'user',
      item: u,
      title: 'Xóa Tài Khoản Người Dùng',
      message: 'Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống?',
      itemName: u.email,
      itemSub: u.display_name ? `Họ tên: ${u.display_name}` : ''
    });
  };

  const handleOpenEditUser = (u) => {
    setEditingUser({
      id: u.id,
      email: u.email || '',
      display_name: u.display_name || '',
      role: u.role || 'user',
      organization_id: u.organization_id || null,
      region: u.region || userRegion || 'Toàn quốc',
      permissions: u.permissions || {
        can_view_press: true,
        can_view_bidding: true,
        can_view_oda: true,
        can_manage_keywords: true,
        can_export_data: true,
      },
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
        organization_id: editingUser.organization_id || null,
        region: editingUser.region,
        permissions: editingUser.permissions,
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
      if (isRegionalAdmin || created.status === 'pending') {
        showAlert('success', `⚡ Đã gửi đề xuất nguồn tin "${created.name}" tới Super Admin chờ duyệt!`);
      } else {
        setSources(prev => [...prev, created]);
        showAlert('success', `Đã thêm nguồn tin "${created.name}"!`);
      }
      setNewSource({ name: '', source_type: 'press', url: '', parser_type: 'rss' });
    } catch (e) {
      showAlert('error', e.response?.data?.detail || 'Lỗi khi thêm nguồn tin.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditSource = (s) => {
    setEditingSource({
      id: s.id,
      name: s.name || '',
      source_type: s.source_type || s.type || 'press',
      url: s.url || s.rss_url || s.base_url || '',
      parser_type: s.crawl_strategy || 'rss',
      region: s.region || userRegion || 'Toàn quốc',
    });
  };

  const handleUpdateSource = async (e) => {
    e.preventDefault();
    if (!editingSource || !editingSource.name || !editingSource.url) return;
    setActionLoading(true);
    try {
      const updated = await adminService.updateSource(editingSource.id, editingSource);
      if (isRegionalAdmin || updated.status === 'pending') {
        setSources(prev => prev.filter(s => s.id !== updated.id));
        setPendingSources(prev => {
          const exists = prev.some(p => p.id === updated.id);
          return exists ? prev.map(p => p.id === updated.id ? updated : p) : [...prev, updated];
        });
        showAlert('success', `⚡ Đã cập nhật nguồn tin "${updated.name}"! Đề xuất đã được gửi tới Super Admin chờ duyệt lại.`);
      } else {
        setSources(prev => prev.map(s => s.id === updated.id ? updated : s));
        showAlert('success', `Đã cập nhật nguồn tin "${updated.name}" thành công!`);
      }
      setEditingSource(null);
    } catch (e) {
      showAlert('error', e.response?.data?.detail || 'Lỗi khi cập nhật nguồn tin.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSource = (s) => {
    setDeleteConfirm({
      type: 'source',
      item: s,
      title: 'Xóa Nguồn Tin',
      message: 'Bạn có chắc chắn muốn xóa nguồn tin này khỏi hệ thống?',
      itemName: s.name,
      itemSub: s.url
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    const { type, item } = deleteConfirm;
    setActionLoading(true);
    try {
      if (type === 'user') {
        await adminService.deleteUser(item.id);
        setUsers(prev => prev.filter(u => u.id !== item.id));
        showAlert('success', `Đã xóa tài khoản "${item.email}" thành công.`);
      } else if (type === 'source') {
        await adminService.deleteSource(item.id);
        setSources(prev => prev.filter(s => s.id !== item.id));
        showAlert('success', `Đã xóa nguồn tin "${item.name}".`);
      } else if (type === 'blacklist') {
        await adminService.deleteBlacklist(item.id);
        setBlacklist(prev => prev.filter(x => x.id !== item.id));
        showAlert('success', 'Đã xóa từ khóa khỏi Blacklist.');
      } else if (type === 'whitelist') {
        await adminService.deleteWhitelist(item.id);
        setWhitelist(prev => prev.filter(x => x.id !== item.id));
        showAlert('success', 'Đã xóa từ khóa khỏi Whitelist.');
      }
      setDeleteConfirm(null);
    } catch (e) {
      showAlert('error', e.response?.data?.detail || 'Thao tác xóa thất bại.');
    } finally {
      setActionLoading(false);
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
    // Đa tổ chức (ADR-005): super admin quản tổ chức; org admin đặt phạm vi tổ chức mình.
    ...(isSuperAdmin ? [{ id: 'orgs', label: 'Tổ Chức', icon: <Building2 size={16} /> }] : []),
    ...(isRegionalAdmin ? [{ id: 'scope', label: 'Phạm Vi Dữ Liệu', icon: <Sliders size={16} /> }] : []),
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
              disabled={actionLoading || isCrawling}
              id="btn-admin-crawl-now"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                color: 'white', border: 'none', borderRadius: 12,
                padding: '10px 22px', fontSize: 13, fontWeight: 800, gap: 8,
                boxShadow: '0 6px 20px rgba(99,102,241,0.45)', cursor: isCrawling ? 'not-allowed' : 'pointer',
                transition: 'transform 0.15s, boxShadow 0.15s',
                opacity: isCrawling ? 0.8 : 1,
              }}
              onMouseEnter={e => !isCrawling && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              {actionLoading || isCrawling ? <Loader2 size={15} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Zap size={15} style={{ color: '#fef08a' }} />}
              {isCrawling ? 'Đang Crawl Dữ Liệu...' : '⚡ Kích Hoạt Crawl Ngay'}
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
            { label: 'Trạng Thái', val: isCrawling ? 'Crawling...' : 'Online', icon: <Activity size={15} style={{ color: isCrawling ? '#818cf8' : '#4ade80' }} />, sub: isCrawling ? 'Đang quét dữ liệu...' : 'Crawler mỗi 4h' },
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
              {/* Super Admin: Pending Sources Review Section */}
              {isSuperAdmin && pendingSources.length > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                  border: '1.5px solid #fde68a', borderRadius: 20, padding: '22px 24px',
                  boxShadow: '0 6px 24px rgba(245,158,11,0.12)',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#92400e', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={20} style={{ color: '#d97706' }} />
                    📥 Nguồn Tin Đề Xuất Chờ Super Admin Duyệt ({pendingSources.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {pendingSources.map(ps => (
                      <div key={ps.id} style={{
                        background: 'white', border: '1px solid #fef3c7', borderRadius: 14, padding: '14px 18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                      }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>{ps.type === 'gov' ? '📋' : '📰'}</span>
                            {ps.name}
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: '#eff6ff', color: '#2563eb' }}>
                              Phân vùng: {ps.region || 'Không xác định'}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                            Target URL: <a href={ps.url} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>{ps.url}</a>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-sm"
                            onClick={() => handleApproveSource(ps.id)}
                            style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 10, padding: '6px 14px', fontWeight: 800, gap: 4 }}
                          >
                            <CheckCircle size={14} /> Duyệt Nguồn
                          </button>
                          <button
                            className="btn btn-sm"
                            onClick={() => handleRejectSource(ps.id)}
                            style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '6px 14px', fontWeight: 800, gap: 4 }}
                          >
                            <XCircle size={14} /> Từ Chối
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Source Form Card */}
              <div style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 20, padding: '22px 24px', boxShadow: '0 6px 24px rgba(0,0,0,0.03)',
              }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                    <Plus size={16} />
                  </div>
                  {isSuperAdmin ? 'Thêm Nguồn Crawl Tự Động Mới' : `Đề Xuất Nguồn Crawl Mới (${userRegion || 'Phân Vùng'})`}
                </div>

                <form onSubmit={handleCreateSource} className="responsive-grid-form" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 1fr', gap: 14, alignItems: 'end' }}>
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
                    {isSuperAdmin ? 'Thêm Nguồn' : 'Gửi Đề Xuất'}
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
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleOpenEditSource(s)}
                                style={{ color: '#2563eb', padding: '6px 10px' }}
                                title="Chỉnh sửa nguồn tin"
                              >
                                <Edit size={14} /> Sửa
                              </button>
                              {isSuperAdmin ? (
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => handleDeleteSource(s)}
                                  title="Xóa nguồn"
                                  style={{ color: '#ef4444', padding: '6px 10px' }}
                                >
                                  <Trash2 size={14} /> Xóa
                                </button>
                              ) : (
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Chỉ Super Admin được xóa</span>
                              )}
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

                <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, alignItems: 'end' }}>
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
                    <select
                      className="form-input"
                      value={newUser.role}
                      disabled={isRegionalAdmin}
                      onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      {isSuperAdmin && <option value="super_admin">👑 Super Admin (Quản trị Tối cao)</option>}
                      {isSuperAdmin && <option value="admin">🔰 Admin Phân Vùng</option>}
                      <option value="staff">🧑‍💼 Nhân viên (Staff)</option>
                      <option value="user">👤 Người dùng (User)</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Phân vùng hoạt động</label>
                    {isAddingNewRegion ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          className="form-input"
                          placeholder="Nhập tên phân vùng mới..."
                          value={newCustomRegionInput}
                          onChange={e => {
                            setNewCustomRegionInput(e.target.value);
                            setNewUser({ ...newUser, region: e.target.value });
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            if (newCustomRegionInput.trim()) {
                              setCustomRegions(prev => [...prev, newCustomRegionInput.trim()]);
                            }
                            setIsAddingNewRegion(false);
                          }}
                          title="Xác nhận"
                          style={{ padding: '0 10px', color: '#10b981', fontWeight: 800 }}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setIsAddingNewRegion(false);
                            setNewUser({ ...newUser, region: 'Toàn quốc' });
                          }}
                          title="Hủy"
                          style={{ padding: '0 8px', color: '#ef4444' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <select
                        className="form-input"
                        value={newUser.organization_id ? `org_${newUser.organization_id}` : newUser.region}
                        disabled={isRegionalAdmin}
                        onChange={e => {
                          const val = e.target.value;
                          if (val.startsWith('org_')) {
                            const orgId = parseInt(val.replace('org_', ''), 10);
                            const selectedOrg = organizations.find(o => o.id === orgId);
                            setNewUser({
                              ...newUser,
                              organization_id: orgId,
                              region: selectedOrg ? selectedOrg.name : newUser.region,
                            });
                          } else if (val === '__add_new__') {
                            setIsAddingNewRegion(true);
                            setNewCustomRegionInput('');
                          } else {
                            setNewUser({
                              ...newUser,
                              organization_id: null,
                              region: val,
                            });
                          }
                        }}
                      >
                        {organizations.length > 0 && (
                          <optgroup label="🏢 Tổ chức / Phân vùng chính thức">
                            {organizations.map(o => (
                              <option key={`org_${o.id}`} value={`org_${o.id}`}>🏢 {o.name}</option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="📍 Vùng địa lý mặc định">
                          {allRegions.map(r => (
                            <option key={r} value={r}>📍 {r}</option>
                          ))}
                        </optgroup>
                        <option value="__add_new__">➕ Thêm phân vùng mới...</option>
                      </select>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={actionLoading} style={{ gap: 6, height: 42, justifyContent: 'center' }}>
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
                      const isMe = user && (u.id === user.id || (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()));
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
                              <span>
                                {u.display_name || u.email}
                                {isMe && (
                                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-600, #2563eb)', marginLeft: 6 }}>
                                    (bạn)
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{u.email}</td>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span style={{
                                fontSize: 10.5, fontWeight: 800, padding: '3px 10px', borderRadius: 20, width: 'fit-content',
                                background: u.role === 'super_admin' ? '#fef3c7' : u.role === 'admin' ? '#eff6ff' : u.role === 'staff' ? '#f0fdf4' : '#f1f5f9',
                                color: u.role === 'super_admin' ? '#92400e' : u.role === 'admin' ? '#1d4ed8' : u.role === 'staff' ? '#166534' : '#475569',
                                border: `1px solid ${u.role === 'super_admin' ? '#fde68a' : u.role === 'admin' ? '#bfdbfe' : u.role === 'staff' ? '#bbf7d0' : '#e2e8f0'}`,
                              }}>
                                {u.role === 'super_admin' ? '👑 SUPER ADMIN' : u.role === 'admin' ? '🔰 ADMIN PHÂN VÙNG' : u.role === 'staff' ? '🧑‍💼 NHÂN VIÊN' : '👤 NGƯỜI DÙNG'}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                                📍 {u.region || 'Toàn quốc'}
                              </span>
                            </div>
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
                                onClick={() => handleDeleteUser(u)}
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

          {/* TAB: TỔ CHỨC (super admin) — ADR-005 */}
          {activeTab === 'orgs' && (
            <OrganizationsPanel sources={sources} allUsers={users} onMessage={showAlert} onUserUpdated={loadData} />
          )}

          {/* TAB: PHẠM VI DỮ LIỆU (org admin đặt cho tổ chức mình) — ADR-005 */}
          {activeTab === 'scope' && (
            <ScopePanel sources={sources} onMessage={showAlert} />
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
                      <button 
                        onClick={() => setDeleteConfirm({
                          type: 'blacklist',
                          item: b,
                          title: 'Xóa Từ Khóa Blacklist',
                          message: 'Bạn có chắc chắn muốn xóa từ khóa cấm này?',
                          itemName: b.term
                        })} 
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#e11d48', padding: 0, fontSize: 14, lineHeight: 1 }}
                        title="Xóa khỏi Blacklist"
                      >×</button>
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
                      <button 
                        onClick={() => setDeleteConfirm({
                          type: 'whitelist',
                          item: w,
                          title: 'Xóa Từ Khóa Whitelist',
                          message: 'Bạn có chắc chắn muốn xóa từ khóa ưu tiên này?',
                          itemName: w.term
                        })} 
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#047857', padding: 0, fontSize: 14, lineHeight: 1 }}
                        title="Xóa khỏi Whitelist"
                      >×</button>
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
            borderRadius: 24, padding: '28px 32px', width: '100%', maxWidth: 620,
            boxShadow: '0 24px 60px rgba(0,0,0,0.35)', position: 'relative',
            animation: 'fadeIn 0.2s ease-out',
            maxHeight: 'calc(100vh - 80px)', overflowY: 'auto',
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
                  disabled={isRegionalAdmin}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  {(isSuperAdmin || editingUser.role === 'super_admin') && (
                    <option value="super_admin">👑 Super Admin (Quản trị Tối cao)</option>
                  )}
                  {(isSuperAdmin || editingUser.role === 'admin') && (
                    <option value="admin">🔰 Admin Phân Vùng</option>
                  )}
                  <option value="staff">🧑‍💼 Nhân viên (Staff)</option>
                  <option value="user">👤 Người dùng (User)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Phân vùng hoạt động</label>
                {isAddingEditRegion ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      className="form-input"
                      placeholder="Nhập tên phân vùng mới..."
                      value={editingUser.region || ''}
                      onChange={e => setEditingUser({ ...editingUser, region: e.target.value })}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        if (editingUser.region && editingUser.region.trim()) {
                          setCustomRegions(prev => [...prev, editingUser.region.trim()]);
                        }
                        setIsAddingEditRegion(false);
                      }}
                      title="Xác nhận"
                      style={{ padding: '0 10px', color: '#10b981', fontWeight: 800 }}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setIsAddingEditRegion(false)}
                      title="Hủy"
                      style={{ padding: '0 8px', color: '#ef4444' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <select
                    className="form-input"
                    value={editingUser.organization_id ? `org_${editingUser.organization_id}` : editingUser.region}
                    disabled={isRegionalAdmin}
                    onChange={e => {
                      const val = e.target.value;
                      if (val.startsWith('org_')) {
                        const orgId = parseInt(val.replace('org_', ''), 10);
                        const selectedOrg = organizations.find(o => o.id === orgId);
                        setEditingUser({
                          ...editingUser,
                          organization_id: orgId,
                          region: selectedOrg ? selectedOrg.name : editingUser.region,
                        });
                      } else if (val === '__add_new__') {
                        setIsAddingEditRegion(true);
                      } else {
                        setEditingUser({
                          ...editingUser,
                          organization_id: null,
                          region: val,
                        });
                      }
                    }}
                  >
                    {organizations.length > 0 && (
                      <optgroup label="🏢 Tổ chức / Phân vùng chính thức">
                        {organizations.map(o => (
                          <option key={`org_${o.id}`} value={`org_${o.id}`}>🏢 {o.name}</option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="📍 Vùng địa lý mặc định">
                      {allRegions.map(r => (
                        <option key={r} value={r}>📍 {r}</option>
                      ))}
                    </optgroup>
                    <option value="__add_new__">➕ Thêm phân vùng mới...</option>
                  </select>
                )}
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

              {/* Granular Staff Permissions Section */}
              <div style={{ gridColumn: 'span 2', background: 'var(--bg-surface-2)', padding: 16, borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
                <label className="form-label" style={{ marginBottom: 10, fontWeight: 800, display: 'block', color: 'var(--text-primary)' }}>
                  🔑 Phân Quyền Mô-đun Xem/Sử Dụng Cho Người Dùng
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12.5 }}>
                  {[
                    { key: 'can_view_press', label: '📰 Xem Tin Báo Chí' },
                    { key: 'can_view_bidding', label: '📋 Xem Gói Thầu GOV' },
                    { key: 'can_view_oda', label: '🌐 Xem Dự Án ODA & WB' },
                    { key: 'can_manage_keywords', label: '🏷️ Đăng Ký Từ Khóa Lọc' },
                    { key: 'can_export_data', label: '📥 Xuất Báo Cáo Data' },
                  ].map(p => (
                    <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={editingUser.permissions?.[p.key] !== false}
                        onChange={e => setEditingUser({
                          ...editingUser,
                          permissions: {
                            ...(editingUser.permissions || {}),
                            [p.key]: e.target.checked,
                          },
                        })}
                        style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
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
      {/* ── Edit Source Modal ── */}
      {editingSource && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20,
        }}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 24, padding: '28px 32px', width: '100%', maxWidth: 540,
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
                    Chỉnh Sửa Nguồn Crawl Dữ Liệu
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {isSuperAdmin ? 'Cập nhật cấu hình nguồn crawl trực tiếp' : 'Chỉnh sửa nguồn (cần Super Admin duyệt lại)'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingSource(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 8 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateSource} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Tên nguồn tin *</label>
                <input
                  className="form-input"
                  value={editingSource.name}
                  onChange={e => setEditingSource({ ...editingSource, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Loại nguồn *</label>
                <select
                  className="form-input"
                  value={editingSource.source_type}
                  onChange={e => setEditingSource({ ...editingSource, source_type: e.target.value })}
                >
                  <option value="press">📰 Báo Chí (press)</option>
                  <option value="gov">📋 Đấu Thầu (gov)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Phương thức Crawl *</label>
                <select
                  className="form-input"
                  value={editingSource.parser_type}
                  onChange={e => setEditingSource({ ...editingSource, parser_type: e.target.value })}
                >
                  <option value="rss">📡 RSS Feed</option>
                  <option value="html">🌐 HTML Web Scraping</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Đường dẫn URL / RSS Endpoint *</label>
                <input
                  className="form-input"
                  value={editingSource.url}
                  onChange={e => setEditingSource({ ...editingSource, url: e.target.value })}
                  required
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Phân vùng áp dụng</label>
                {isAddingSourceEditRegion ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      className="form-input"
                      placeholder="Nhập tên phân vùng mới..."
                      value={editingSource.region || ''}
                      onChange={e => setEditingSource({ ...editingSource, region: e.target.value })}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        if (editingSource.region && editingSource.region.trim()) {
                          setCustomRegions(prev => [...prev, editingSource.region.trim()]);
                        }
                        setIsAddingSourceEditRegion(false);
                      }}
                      title="Xác nhận"
                      style={{ padding: '0 10px', color: '#10b981', fontWeight: 800 }}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setIsAddingSourceEditRegion(false)}
                      title="Hủy"
                      style={{ padding: '0 8px', color: '#ef4444' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <select
                    className="form-input"
                    value={allRegions.includes(editingSource.region) ? editingSource.region : '__add_new__'}
                    disabled={isRegionalAdmin}
                    onChange={e => {
                      if (e.target.value === '__add_new__') {
                        setIsAddingSourceEditRegion(true);
                      } else {
                        setEditingSource({ ...editingSource, region: e.target.value });
                      }
                    }}
                  >
                    {allRegions.map(r => (
                      <option key={r} value={r}>📍 {r}</option>
                    ))}
                    <option value="__add_new__">➕ Thêm phân vùng mới...</option>
                  </select>
                )}
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditingSource(null)}
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
                  {isSuperAdmin ? 'Lưu Thay Đổi' : 'Gửi Đề Xuất Cập Nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title={deleteConfirm?.title || 'Xác Nhận Xóa'}
        message={deleteConfirm?.message || ''}
        itemName={deleteConfirm?.itemName || ''}
        itemSub={deleteConfirm?.itemSub || ''}
        confirmText="Xác Nhận Xóa"
        cancelText="Hủy Bỏ"
        type="danger"
        loading={actionLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
