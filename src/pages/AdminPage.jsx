// src/pages/AdminPage.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck, RefreshCw, Users, Database, ShieldAlert, Mail, Plus, Trash2,
  Play, CheckCircle2, AlertCircle, Loader2, Globe, Cpu, Zap, Activity,
  Sliders, Search, ArrowUpRight, Check, X, Server, Edit, CheckCircle, XCircle, Building2,
  ChevronDown, Eye
} from 'lucide-react';

// Nhóm nguồn theo tên miền (cha–con). Lấy URL từ nhiều field có thể có.
const getSourceUrl = (s) => s.url || s.rss_url || s.base_url || '';
const getSourceDomain = (s) => {
  try {
    return new URL(getSourceUrl(s)).hostname.replace(/^www\./, '');
  } catch {
    return 'khác';
  }
};
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

  // Danh sách nguồn: tìm kiếm + nhóm cha–con (Loại nguồn → Tên miền → feed), xổ ra/thu gọn.
  const [sourceSearch, setSourceSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());
  const toggleGroup = (key) =>
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

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
  const [viewingUser, setViewingUser] = useState(null);

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

  const [showBuySlotModal, setShowBuySlotModal] = useState(false);
  const [slotPhone, setSlotPhone] = useState('');
  const [slotSubmitting, setSlotSubmitting] = useState(false);

  // ESC key listener to close active modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (editingUser) setEditingUser(null);
        if (viewingUser) setViewingUser(null);
        if (editingSource) setEditingSource(null);
        if (showBuySlotModal) setShowBuySlotModal(false);
        if (deleteConfirm) setDeleteConfirm(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingUser, viewingUser, editingSource, showBuySlotModal, deleteConfirm]);

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
      setUsers((u || []).map(usr => {
        const uKey = usr.email || usr.id;
        const activePkg = localStorage.getItem(`bis_active_package_${uKey}`) || (usr.role === 'super_admin' ? 'full' : usr.role === 'admin' ? 'enterprise' : 'free');
        const hasAi = localStorage.getItem(`bis_ai_package_${uKey}`) === 'true' || usr.role === 'super_admin';
        const pkgExp = localStorage.getItem(`bis_pkg_exp_${uKey}`) || (usr.role === 'super_admin' || activePkg === 'free' ? 'Vĩnh viễn' : '12/05/2026 - 12/05/2027');
        const themes = JSON.parse(localStorage.getItem(`bis_purchased_themes_${uKey}`) || '[]');
        const selectedSrcs = JSON.parse(localStorage.getItem(`bis_selected_sources_${uKey}`) || '["adb", "worldbank"]');
        const maxUsers = parseInt(localStorage.getItem(`bis_max_users_${uKey}`) || '10', 10);
        return {
          ...usr,
          active_package: activePkg,
          has_ai: hasAi,
          package_expiration: pkgExp,
          purchased_themes: themes,
          selected_sources: selectedSrcs,
          max_users: maxUsers,
        };
      }));
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

    // Kiểm tra giới hạn số lượng tài khoản cho Admin Phân Vùng (Gói Enterprise)
    const myMaxUsers = user?.max_users || parseInt(localStorage.getItem(`bis_max_users_${user?.email || user?.id}`) || '10', 10);
    const currentRegionalUsers = users.filter(u => u.role !== 'super_admin' && (isSuperAdmin || u.region === userRegion));
    if (isRegionalAdmin && currentRegionalUsers.length >= myMaxUsers) {
      showAlert('error', `⚠️ Bạn đã đạt giới hạn tối đa ${myMaxUsers} tài khoản thành viên của Gói Enterprise Phân Vùng. Vui lòng liên hệ Super Admin để nâng cấp mua thêm slot!`);
      return;
    }

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
      active_package: u.active_package || (u.role === 'admin' ? 'enterprise' : 'free'),
      has_ai: u.has_ai ?? false,
      package_expiration: u.package_expiration || (u.active_package === 'free' || u.role === 'super_admin' ? 'Vĩnh viễn' : '12/05/2026 - 12/05/2027'),
      purchased_themes: u.purchased_themes || [],
      selected_sources: u.selected_sources || ['adb', 'worldbank'],
      max_users: u.max_users || 10,
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

      // Persist packages, AI status, expiration date, purchased themes, selected sources, and max_users
      const uKey = editingUser.email || editingUser.id;
      localStorage.setItem(`bis_active_package_${uKey}`, editingUser.active_package);
      localStorage.setItem(`bis_ai_package_${uKey}`, editingUser.has_ai ? 'true' : 'false');
      localStorage.setItem(`bis_pkg_exp_${uKey}`, editingUser.package_expiration || 'Vĩnh viễn');
      localStorage.setItem(`bis_purchased_themes_${uKey}`, JSON.stringify(editingUser.purchased_themes || []));
      localStorage.setItem(`bis_selected_sources_${uKey}`, JSON.stringify(editingUser.selected_sources || ['adb', 'worldbank']));
      localStorage.setItem(`bis_max_users_${uKey}`, String(editingUser.max_users || 10));

      let updated;
      try {
        updated = await adminService.updateUser(editingUser.id, payload);
      } catch (err) {
        // Fallback for local mock user update
        updated = { ...editingUser };
      }

      const mergedUser = {
        ...updated,
        active_package: editingUser.active_package,
        has_ai: editingUser.has_ai,
        package_expiration: editingUser.package_expiration,
        purchased_themes: editingUser.purchased_themes,
        selected_sources: editingUser.selected_sources,
        max_users: editingUser.max_users || 10,
      };

      setUsers(prev => prev.map(u => u.id === editingUser.id ? mergedUser : u));
      setEditingUser(null);
      showAlert('success', `⚡ Đã cập nhật gói dịch vụ & quyền tài khoản ${mergedUser.email}!`);
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
                <div className="pending-source-banner" style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(254, 243, 199, 0.18) 100%)',
                  border: '1.5px solid var(--border)', borderRadius: 20, padding: '22px 24px',
                  boxShadow: '0 6px 24px rgba(245,158,11,0.08)',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={20} style={{ color: '#d97706' }} />
                    📥 Nguồn Tin Đề Xuất Chờ Super Admin Duyệt ({pendingSources.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {pendingSources.map(ps => (
                      <div key={ps.id} className="pending-source-item" style={{
                        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '14px 18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                      }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>{ps.type === 'gov' ? '📋' : '📰'}</span>
                            {ps.name}
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: 'rgba(59, 130, 246, 0.12)', color: 'var(--brand-600, #2563eb)' }}>
                              Phân vùng: {ps.region || 'Không xác định'}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                            Target URL: <a href={ps.url} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-600)' }}>{ps.url}</a>
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
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-600, #2563eb)' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        value={sourceSearch}
                        onChange={e => setSourceSearch(e.target.value)}
                        placeholder="Tìm nguồn theo tên / URL..."
                        className="form-input"
                        style={{ paddingLeft: 30, height: 34, fontSize: 12, width: 230 }}
                      />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '3px 10px', borderRadius: 20, border: '1px solid #a7f3d0' }}>
                      🟢 Crawler Active
                    </span>
                  </div>
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
                    {(() => {
                      const q = sourceSearch.trim().toLowerCase();
                      const filtered = q
                        ? sources.filter(s =>
                            (s.name || '').toLowerCase().includes(q) ||
                            getSourceUrl(s).toLowerCase().includes(q))
                        : sources;
                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                              {sources.length === 0
                                ? 'Chưa có nguồn tin nào. Thêm nguồn đầu tiên ở trên.'
                                : 'Không tìm thấy nguồn phù hợp.'}
                            </td>
                          </tr>
                        );
                      }
                      // renderRow: 1 dòng feed, thụt lề theo cấp (px).
                      const renderRow = (s, indent) => {
                        const isGov = s.source_type === 'gov';
                        return (
                          <tr key={s.id} className="source-item-row" style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}>
                            <td style={{ padding: '14px 20px', paddingLeft: indent, fontWeight: 700, color: 'var(--text-primary)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 16 }}>{isGov ? '📋' : '📰'}</span>
                                {s.name}
                              </div>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <span className={`source-type-badge ${isGov ? 'gov' : 'press'}`} style={{
                                fontSize: 10.5, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                                background: isGov ? 'rgba(139, 92, 246, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                                color: isGov ? 'var(--color-dau-thau, #8b5cf6)' : 'var(--brand-500, #3b82f6)',
                                border: `1px solid ${isGov ? 'rgba(139, 92, 246, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`,
                              }}>
                                {isGov ? 'ĐẤU THẦU (GOV)' : 'BÁO CHÍ (PRESS)'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 20px', color: 'var(--text-muted)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <a href={getSourceUrl(s)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-600)', textDecoration: 'none', fontWeight: 600 }}>
                                {getSourceUrl(s)}
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
                                  style={{ color: 'var(--brand-600, #2563eb)', padding: '6px 10px' }}
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
                      };

                      // Cây 2 tầng: Loại nguồn → Tên miền → feed.
                      const TYPE_META = {
                        gov:   { label: 'Đấu Thầu (GOV)',  icon: '📋', color: 'var(--color-dau-thau, #8b5cf6)', bg: 'rgba(139, 92, 246, 0.08)', border: 'rgba(139, 92, 246, 0.2)' },
                        press: { label: 'Báo Chí (Press)', icon: '📰', color: 'var(--brand-500, #3b82f6)', bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.2)' },
                      };
                      const byType = {};
                      filtered.forEach(s => {
                        const t = s.source_type || 'press';
                        (byType[t] = byType[t] || []).push(s);
                      });
                      const typeOrder = [
                        ...['gov', 'press'].filter(t => byType[t]),
                        ...Object.keys(byType).filter(t => !['gov', 'press'].includes(t)),
                      ];

                      const rows = [];
                      typeOrder.forEach(type => {
                        const meta = TYPE_META[type] || { label: type, icon: '📄', color: 'var(--text-secondary)', bg: 'var(--bg-surface-2)', border: 'var(--border-subtle)' };
                        const typeList = byType[type];
                        const tKey = 't:' + type;
                        const tOpen = expandedGroups.has(tKey) || !!q; // đang tìm kiếm thì mở hết
                        rows.push(
                          <tr key={tKey} onClick={() => toggleGroup(tKey)}
                              className={`source-type-group-row ${type}`}
                              style={{ cursor: 'pointer', background: meta.bg, borderBottom: `1px solid ${meta.border}` }}>
                            <td colSpan={5} style={{ padding: '12px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: meta.color }}>
                                <ChevronDown size={16} style={{ transition: 'transform 0.15s', transform: tOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                                <span style={{ fontSize: 16 }}>{meta.icon}</span>
                                {meta.label}
                                <span className="group-count-badge" style={{ fontSize: 11, fontWeight: 800, color: meta.color, background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: 12, border: `1px solid ${meta.border}` }}>
                                  {typeList.length} nguồn
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>· {tOpen ? 'thu gọn' : 'xổ ra'}</span>
                              </div>
                            </td>
                          </tr>
                        );
                        if (!tOpen) return;
                        // Trong mỗi loại: gom theo tên miền (giữ thứ tự).
                        const domOrder = [];
                        const byDom = {};
                        typeList.forEach(s => {
                          const d = getSourceDomain(s);
                          if (!byDom[d]) { byDom[d] = []; domOrder.push(d); }
                          byDom[d].push(s);
                        });
                        domOrder.forEach(domain => {
                          const list = byDom[domain];
                          if (list.length === 1) { rows.push(renderRow(list[0], 46)); return; }
                          const dKey = 'd:' + type + ':' + domain;
                          const dOpen = expandedGroups.has(dKey) || !!q;
                          rows.push(
                            <tr key={dKey} onClick={() => toggleGroup(dKey)}
                                className="source-domain-group-row"
                                style={{ cursor: 'pointer', background: 'var(--bg-surface-2)', borderBottom: '1px solid var(--border-subtle)' }}>
                              <td colSpan={5} style={{ padding: '10px 20px', paddingLeft: 46 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--text-primary)' }}>
                                  <ChevronDown size={14} style={{ transition: 'transform 0.15s', transform: dOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                                  <Globe size={14} style={{ color: 'var(--brand-500)' }} />
                                  {domain}
                                  <span className="domain-count-badge" style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--brand-600)', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: 12, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                    {list.length} feed
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                          if (dOpen) list.forEach(s => rows.push(renderRow(s, 72)));
                        });
                      });
                      return rows;
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: USERS */}
          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Regional Admin Quota Info Banner */}
              {isRegionalAdmin && (() => {
                const myMaxUsers = user?.max_users || parseInt(localStorage.getItem(`bis_max_users_${user?.email || user?.id}`) || '10', 10);
                const regCount = users.filter(u => u.role !== 'super_admin' && (isSuperAdmin || u.region === userRegion)).length;
                const isFullQuota = regCount >= myMaxUsers;
                return (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(147,51,234,0.08))',
                    border: '1px solid rgba(147,51,234,0.25)',
                    borderRadius: 16, padding: '14px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ padding: 10, borderRadius: 12, background: '#f3e8ff', color: '#9333ea' }}>
                        <ShieldCheck size={22} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>
                          🏢 Admin Phân Vùng: {userRegion} (Gói Enterprise)
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          Bạn có quyền khởi tạo & quản trị tối đa <b>{myMaxUsers} tài khoản thành viên</b> thuộc phân vùng {userRegion}. Các thành viên sẽ tự động kế thừa Full Data Pack.
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: isFullQuota ? '#ef4444' : '#10b981' }}>
                          👥 {regCount} / {myMaxUsers} Thành Viên
                        </div>
                        {isFullQuota && (
                          <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 800, background: '#fef2f2', padding: '2px 8px', borderRadius: 6, border: '1px solid #fca5a5', display: 'inline-block', marginTop: 4 }}>
                            ⚠️ Đã đạt hạn ngạch tối đa ({myMaxUsers})
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowBuySlotModal(true)}
                        style={{
                          padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 800,
                          background: 'linear-gradient(135deg, #9333ea, #7e22ce)', color: 'white',
                          border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(147,51,234,0.3)',
                          display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                        }}
                      >
                        ➕ Mua Thêm Slot (+10 User / 50k)
                      </button>
                    </div>
                  </div>
                );
              })()}
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
                      <th style={{ padding: '12px 20px' }}>Gói Dữ Liệu &amp; Hạn Dùng</th>
                      <th style={{ padding: '12px 20px' }}>Theme UI Sở Hữu</th>
                      <th style={{ padding: '12px 20px' }}>Trạng Thái</th>
                      <th style={{ padding: '12px 20px' }}>Ngày Tạo</th>
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: u.role === 'super_admin' || u.active_package === 'full' ? '#059669' : u.active_package === 'enterprise' || u.role === 'admin' ? '#9333ea' : u.active_package === 'combo2' || u.active_package === 'single' ? '#2563eb' : '#64748b' }}>
                                {u.role === 'super_admin' ? '👑 FULL DATA (SUPER ADMIN)' : u.active_package === 'enterprise' || u.role === 'admin' ? `🏢 Gói Enterprise (Max ${u.max_users || 10} User)` : u.active_package === 'full' ? '👑 Full Data Pack' : u.active_package === 'single' ? `🎯 Gói 1 Nguồn (${({ adb: 'ADB', worldbank: 'World Bank', gov: 'Đấu Thầu' })[(u.selected_sources || ['adb'])[0]] || '1 Nguồn'})` : u.active_package === 'combo2' ? `⚡ Combo 2 (${(u.selected_sources || ['adb', 'worldbank']).map(k => ({ adb: 'ADB', worldbank: 'WB', gov: 'Đấu Thầu' })[k] || k).join('+')})` : '📰 Báo Chí Miễn Phí'}
                                {u.has_ai && <span style={{ marginLeft: 6, color: '#9333ea', background: '#f3e8ff', padding: '1px 6px', borderRadius: 8, fontSize: 9.5, border: '1px solid #e9d5ff' }}>🤖 AI</span>}
                              </span>
                              <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                                📅 {u.active_package === 'free' || u.role === 'super_admin' ? 'Vĩnh viễn' : (u.package_expiration || 'Vĩnh viễn')}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 180 }}>
                              <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 6, background: '#f1f5f9', color: '#475569' }}>Mặc định</span>
                              {(u.purchased_themes || []).map(tKey => (
                                <span key={tKey} style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 6px', borderRadius: 6, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                                  {tKey === 'classic' ? 'Win98' : tKey === 'sapphire' ? 'Sapphire' : tKey === 'luxury' ? 'Luxury' : tKey === 'anime' ? 'Anime 🌸' : tKey}
                                </span>
                              ))}
                              {u.role === 'super_admin' && <span style={{ fontSize: 9.5, fontWeight: 800, color: '#b45309', background: '#fffbeb', padding: '1px 6px', borderRadius: 6, border: '1px solid #fde68a' }}>👑 All Themes</span>}
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
                                onClick={() => setViewingUser(u)}
                                style={{ color: '#8b5cf6', padding: '6px 10px' }}
                                title="Xem chi tiết tài khoản"
                              >
                                <Eye size={14} /> Chi tiết
                              </button>
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
      {editingUser && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: 20,
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

              {/* Package & Theme Control Section (Super Admin Only) */}
              {isSuperAdmin && (
                <div style={{ gridColumn: 'span 2', background: 'var(--bg-surface-2)', padding: 16, borderRadius: 16, border: '1.5px solid rgba(99, 102, 241, 0.3)' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Zap size={16} style={{ color: '#a855f7' }} />
                    <span>Quản Lý Gói Dịch Vụ &amp; UI Themes Đã Cấp</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                    <div>
                      <label className="form-label">Gói Nguồn Dữ Liệu</label>
                      <select
                        className="form-input"
                        value={editingUser.active_package || 'free'}
                        onChange={e => {
                          const pkg = e.target.value;
                          let defaultExp = editingUser.package_expiration;
                          if (pkg === 'free') defaultExp = 'Vĩnh viễn';
                          else if (!defaultExp || defaultExp === 'Vĩnh viễn') defaultExp = '12/05/2026 - 12/05/2027';
                          setEditingUser({ ...editingUser, active_package: pkg, package_expiration: defaultExp });
                        }}
                      >
                        <option value="free">📰 Báo Chí Miễn Phí</option>
                        <option value="single">🎯 Mua Lẻ 1 Nguồn Dữ Liệu</option>
                        <option value="combo2">⚡ Combo 2 Nguồn Dữ Liệu</option>
                        <option value="full">👑 Full Data Pack (Trọn Bộ 3 Nguồn)</option>
                        <option value="enterprise">🏢 Gói Enterprise (Full Data + Quản Trị 10 User)</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Hạn Sử Dụng Gói</span>
                      </label>
                      <input
                        className="form-input"
                        value={editingUser.package_expiration || ''}
                        onChange={e => setEditingUser({ ...editingUser, package_expiration: e.target.value })}
                        placeholder="VD: 07/08/2026 - 07/09/2026 hoặc Vĩnh viễn"
                      />
                      {/* Quick Presets for Duration */}
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            const pad = (n) => String(n).padStart(2, '0');
                            const fmt = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
                            const end = new Date(now); end.setMonth(end.getMonth() + 1);
                            setEditingUser({ ...editingUser, package_expiration: `${fmt(now)} - ${fmt(end)}` });
                          }}
                          style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.25)', cursor: 'pointer' }}
                        >
                          ⚡ 1 Tháng
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            const pad = (n) => String(n).padStart(2, '0');
                            const fmt = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
                            const end = new Date(now); end.setFullYear(end.getFullYear() + 1);
                            setEditingUser({ ...editingUser, package_expiration: `${fmt(now)} - ${fmt(end)}` });
                          }}
                          style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.25)', cursor: 'pointer' }}
                        >
                          📅 1 Năm
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingUser({ ...editingUser, package_expiration: 'Vĩnh viễn' })}
                          style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                        >
                          ♾️ Vĩnh viễn
                        </button>
                      </div>
                    </div>

                    {/* Single Source Selection Sub-panel */}
                    {editingUser.active_package === 'single' && (
                      <div style={{ gridColumn: 'span 2', background: 'rgba(59, 130, 246, 0.08)', padding: 12, borderRadius: 12, border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                        <label className="form-label" style={{ fontWeight: 800, color: '#2563eb', marginBottom: 8, display: 'block' }}>
                          🎯 Chọn 1 Nguồn Dữ Liệu Được Cấp Quyền Cho User:
                        </label>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                          {[
                            { key: 'adb', label: '🏛️ Dự Án ADB Châu Á' },
                            { key: 'worldbank', label: '🌐 Dự Án World Bank' },
                            { key: 'gov', label: '📋 Thông Báo Đấu Thầu Công' },
                          ].map(src => (
                            <label key={src.key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 700, fontSize: 12.5, color: 'var(--text-primary)' }}>
                              <input
                                type="radio"
                                name="single_source_choice"
                                checked={(editingUser.selected_sources || ['adb'])[0] === src.key}
                                onChange={() => setEditingUser({ ...editingUser, selected_sources: [src.key] })}
                                style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                              />
                              {src.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Combo 2 Sources Selection Sub-panel */}
                    {editingUser.active_package === 'combo2' && (
                      <div style={{ gridColumn: 'span 2', background: 'rgba(59, 130, 246, 0.08)', padding: 12, borderRadius: 12, border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <label className="form-label" style={{ fontWeight: 800, color: '#2563eb', margin: 0 }}>
                            ⚡ Chọn 2 Nguồn Dữ Liệu Trong Gói Combo 2:
                          </label>
                          <span style={{ fontSize: 11, fontWeight: 800, color: (editingUser.selected_sources || []).length === 2 ? '#10b981' : '#f59e0b' }}>
                            {(editingUser.selected_sources || []).length === 2 ? '✓ Đã chọn 2/2 nguồn' : `⚠️ Vui lòng chọn 2 nguồn (Hiện tại: ${(editingUser.selected_sources || []).length}/2)`}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                          {[
                            { key: 'adb', label: '🏛️ Dự Án ADB Châu Á' },
                            { key: 'worldbank', label: '🌐 Dự Án World Bank' },
                            { key: 'gov', label: '📋 Thông Báo Đấu Thầu Công' },
                          ].map(src => {
                            const selected = (editingUser.selected_sources || ['adb', 'worldbank']).includes(src.key);
                            return (
                              <label key={src.key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 700, fontSize: 12.5, color: 'var(--text-primary)' }}>
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={e => {
                                    const current = editingUser.selected_sources || ['adb', 'worldbank'];
                                    let updated;
                                    if (e.target.checked) {
                                      if (current.length >= 2) {
                                        updated = [current[1] || current[0], src.key];
                                      } else {
                                        updated = [...current, src.key];
                                      }
                                    } else {
                                      updated = current.filter(k => k !== src.key);
                                    }
                                    setEditingUser({ ...editingUser, selected_sources: updated });
                                  }}
                                  style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                                />
                                {src.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Enterprise Max Users Sub-panel */}
                    {(editingUser.active_package === 'enterprise' || editingUser.role === 'admin') && (
                      <div style={{ gridColumn: 'span 2', background: 'rgba(147, 51, 234, 0.08)', padding: 12, borderRadius: 12, border: '1px solid rgba(147, 51, 234, 0.25)' }}>
                        <label className="form-label" style={{ fontWeight: 800, color: '#9333ea', marginBottom: 6, display: 'block' }}>
                          👥 Hạn Ngạch Số Lượng User Tối Đa Của Phân Vùng (Nâng Cấp Thêm Slot User):
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input
                            type="number"
                            min={1}
                            max={500}
                            className="form-input"
                            style={{ width: 140, fontWeight: 800, fontSize: 15, color: '#9333ea' }}
                            value={editingUser.max_users || 10}
                            onChange={e => setEditingUser({ ...editingUser, max_users: Math.max(1, parseInt(e.target.value, 10) || 10) })}
                          />
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            thành viên (Mặc định: 10 user. Điều chỉnh khi tài khoản Enterprise mua thêm slot).
                          </span>
                        </div>
                      </div>
                    )}

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#9333ea' }}>
                        <input
                          type="checkbox"
                          checked={editingUser.has_ai === true}
                          onChange={e => setEditingUser({ ...editingUser, has_ai: e.target.checked })}
                          style={{ width: 16, height: 16, accentColor: '#a855f7' }}
                        />
                        🤖 Kích hoạt Trợ Lý AI Gemini 2.0 (Hỏi-đáp 24/7)
                      </label>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="form-label" style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
                        🎨 Các Gói Theme UI Đã Mở Khóa / Cấp Quyền Cho User:
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12 }}>
                        {[
                          { key: 'classic', label: 'Classic Retro PC (Win98)' },
                          { key: 'sapphire', label: 'Royal Sapphire Executive' },
                          { key: 'luxury', label: 'Bloomberg Luxury 24K' },
                          { key: 'anime', label: 'Anime Twilight Sakura 🌸' },
                        ].map(t => {
                          const isChecked = (editingUser.purchased_themes || []).includes(t.key);
                          return (
                            <label key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600 }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  const current = editingUser.purchased_themes || [];
                                  const updated = e.target.checked
                                    ? [...current, t.key]
                                    : current.filter(k => k !== t.key);
                                  setEditingUser({ ...editingUser, purchased_themes: updated });
                                }}
                                style={{ width: 15, height: 15, accentColor: '#ec4899' }}
                              />
                              {t.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
        </div>,
        document.body
      )}

      {/* ── User Details Modal (Super Admin View) ── */}
      {viewingUser && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: 20,
        }}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 24, padding: '28px 32px', width: '100%', maxWidth: 640,
            boxShadow: '0 24px 60px rgba(0,0,0,0.35)', position: 'relative',
            maxHeight: '90vh', overflowY: 'auto', animation: 'fadeIn 0.2s ease-out',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: viewingUser.role === 'admin' || viewingUser.role === 'super_admin' ? 'linear-gradient(135deg, #f59e0b, #ec4899)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 900, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}>
                  {(viewingUser.display_name || viewingUser.email).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {viewingUser.display_name || viewingUser.email}
                  </h3>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{viewingUser.email}</span>
                </div>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 6, borderRadius: 8 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Badges Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              <span style={{
                fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20,
                background: viewingUser.role === 'super_admin' ? '#fef3c7' : viewingUser.role === 'admin' ? '#eff6ff' : viewingUser.role === 'staff' ? '#f0fdf4' : '#f1f5f9',
                color: viewingUser.role === 'super_admin' ? '#92400e' : viewingUser.role === 'admin' ? '#1d4ed8' : viewingUser.role === 'staff' ? '#166534' : '#475569',
                border: `1px solid ${viewingUser.role === 'super_admin' ? '#fde68a' : viewingUser.role === 'admin' ? '#bfdbfe' : viewingUser.role === 'staff' ? '#bbf7d0' : '#e2e8f0'}`,
              }}>
                {viewingUser.role === 'super_admin' ? '👑 SUPER ADMIN' : viewingUser.role === 'admin' ? '🔰 ADMIN PHÂN VÙNG' : viewingUser.role === 'staff' ? '🧑‍💼 NHÂN VIÊN' : '👤 NGƯỜI DÙNG'}
              </span>

              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                📍 {viewingUser.region || 'Toàn quốc'}
              </span>

              <span style={{
                fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20,
                background: viewingUser.is_active !== false ? '#ecfdf5' : '#fef2f2',
                color: viewingUser.is_active !== false ? '#047857' : '#b91c1c',
                border: `1px solid ${viewingUser.is_active !== false ? '#a7f3d0' : '#fca5a5'}`,
              }}>
                {viewingUser.is_active !== false ? '🟢 HOẠT ĐỘNG' : '🔴 ĐÃ KHÓA'}
              </span>
            </div>

            {/* Grid Info Sections */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {/* Section 1: Gói Dữ Liệu & Hạn Dùng */}
              <div style={{ background: 'var(--bg-surface-2)', padding: 16, borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
                  ⚡ GÓI DỮ LIỆU & HẠN DÙNG
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: viewingUser.role === 'super_admin' || viewingUser.active_package === 'full' ? '#10b981' : viewingUser.active_package === 'enterprise' || viewingUser.role === 'admin' ? '#9333ea' : viewingUser.active_package === 'combo2' || viewingUser.active_package === 'single' ? '#3b82f6' : 'var(--text-primary)' }}>
                  {viewingUser.role === 'super_admin' ? '👑 FULL DATA (SUPER ADMIN)' : viewingUser.active_package === 'enterprise' || viewingUser.role === 'admin' ? `🏢 Gói Enterprise (Max ${viewingUser.max_users || 10} User)` : viewingUser.active_package === 'full' ? '👑 Full Data Pack (3 Nguồn)' : viewingUser.active_package === 'single' ? `🎯 Gói 1 Nguồn (${({ adb: 'ADB', worldbank: 'World Bank', gov: 'Đấu Thầu' })[(viewingUser.selected_sources || ['adb'])[0]] || '1 Nguồn'})` : viewingUser.active_package === 'combo2' ? `⚡ Combo 2 Nguồn (${(viewingUser.selected_sources || ['adb', 'worldbank']).map(k => ({ adb: 'ADB', worldbank: 'World Bank', gov: 'Đấu Thầu' })[k] || k).join(' + ')})` : '📰 Báo Chí Miễn Phí'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📅 Hạn dùng:</span>
                  <b style={{ color: 'var(--text-primary)' }}>
                    {viewingUser.active_package === 'free' || viewingUser.role === 'super_admin' ? 'Vĩnh viễn' : (viewingUser.package_expiration || 'Vĩnh viễn')}
                  </b>
                </div>
                <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: viewingUser.has_ai ? '#f3e8ff' : 'var(--bg-surface)', color: viewingUser.has_ai ? '#9333ea' : 'var(--text-muted)', border: `1px solid ${viewingUser.has_ai ? '#e9d5ff' : 'var(--border-subtle)'}` }}>
                  🤖 AI Gemini 2.0: {viewingUser.has_ai ? 'Đã kích hoạt' : 'Chưa đăng ký'}
                </div>
              </div>

              {/* Section 2: Gói Theme UI Sở Hữu */}
              <div style={{ background: 'var(--bg-surface-2)', padding: 16, borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
                  🎨 GÓI THEME UI ĐÃ MỞ KHÓA
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>
                    Mặc định
                  </span>
                  {(viewingUser.purchased_themes || []).map(tKey => (
                    <span key={tKey} style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                      {tKey === 'classic' ? 'Win98 Retro' : tKey === 'sapphire' ? 'Royal Sapphire' : tKey === 'luxury' ? 'Bloomberg Luxury' : tKey === 'anime' ? 'Anime Sakura 🌸' : tKey}
                    </span>
                  ))}
                  {viewingUser.role === 'super_admin' && (
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                      👑 Trọn bộ Theme (Super Admin)
                    </span>
                  )}
                </div>
              </div>

              {/* Section 3: Granular Permissions */}
              <div style={{ gridColumn: 'span 2', background: 'var(--bg-surface-2)', padding: 16, borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 }}>
                  🔑 PHÂN QUYỀN TRUY CẬP MÔ-ĐỤN
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 12 }}>
                  {[
                    { key: 'can_view_press', label: '📰 Xem Tin Báo Chí' },
                    { key: 'can_view_bidding', label: '📋 Xem Gói Thầu GOV' },
                    { key: 'can_view_oda', label: '🌐 Xem Dự Án ODA & WB' },
                    { key: 'can_manage_keywords', label: '🏷️ Đăng Ký Từ Khóa Lọc' },
                    { key: 'can_export_data', label: '📥 Xuất Báo Cáo Data' },
                  ].map(p => {
                    const hasPerm = viewingUser.permissions?.[p.key] !== false;
                    return (
                      <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 6, color: hasPerm ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        <span style={{ fontSize: 14 }}>{hasPerm ? '🟢' : '⚪'}</span>
                        <span style={{ fontWeight: hasPerm ? 700 : 400, textDecoration: hasPerm ? 'none' : 'line-through' }}>{p.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 4: System Info */}
              <div style={{ gridColumn: 'span 2', background: 'var(--bg-surface-2)', padding: 16, borderRadius: 16, border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Email Digest: </span>
                  <b>{viewingUser.email_digest_enabled ? `📧 Đã bật (${viewingUser.digest_hour ?? 7}h)` : '🔕 Tắt'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Ngày tạo: </span>
                  <b>{viewingUser.created_at ? new Date(viewingUser.created_at).toLocaleDateString('vi-VN') : '-'}</b>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => {
                  const uToEdit = viewingUser;
                  setViewingUser(null);
                  handleOpenEditUser(uToEdit);
                }}
                className="btn btn-primary"
                style={{ padding: '10px 20px', borderRadius: 12, gap: 6, fontWeight: 800 }}
              >
                <Edit size={15} /> Chỉnh Sửa Tài Khoản Này
              </button>
              <button
                onClick={() => setViewingUser(null)}
                className="btn btn-ghost"
                style={{ padding: '10px 20px', borderRadius: 12 }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* ── Edit Source Modal ── */}
      {editingSource && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: 20,
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
        </div>,
        document.body
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

      {/* BUY SLOT MODAL FOR REGIONAL ADMIN */}
      {showBuySlotModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: 20,
        }}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 24, padding: 32, width: '100%', maxWidth: 480,
            boxShadow: '0 24px 60px rgba(0,0,0,0.35)', position: 'relative',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ padding: 10, borderRadius: 12, background: '#f3e8ff', color: '#9333ea' }}>
                  <Zap size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    Nâng Cấp Mua Thêm Slot User
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Mở rộng quy mô thành viên cho {userRegion}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowBuySlotModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: 'linear-gradient(135deg, rgba(147,51,234,0.06), rgba(37,99,235,0.06))', padding: 16, borderRadius: 16, border: '1px solid rgba(147,51,234,0.2)', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Gói nâng cấp:</span>
                <span style={{ fontWeight: 800, color: '#9333ea' }}>➕ Mua Thêm +10 Slot User</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Chi phí nâng cấp:</span>
                <span style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: 16 }}>50.000đ / tháng</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px dashed var(--border-subtle)', paddingTop: 8, marginTop: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Hạn ngạch hiện tại:</span>
                <b style={{ color: 'var(--text-primary)' }}>{user?.max_users || parseInt(localStorage.getItem(`bis_max_users_${user?.email || user?.id}`) || '10', 10)} User</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Hạn ngạch sau nâng cấp:</span>
                <b style={{ color: '#10b981' }}>{(user?.max_users || parseInt(localStorage.getItem(`bis_max_users_${user?.email || user?.id}`) || '10', 10)) + 10} User</b>
              </div>
            </div>

            <form onSubmit={e => {
              e.preventDefault();
              setSlotSubmitting(true);
              setTimeout(() => {
                const uKey = user?.email || user?.id || 'default';
                const currentMax = parseInt(localStorage.getItem(`bis_max_users_${uKey}`) || '10', 10);
                const newMax = currentMax + 10;
                localStorage.setItem(`bis_max_users_${uKey}`, String(newMax));
                setUsers(prev => prev.map(u => (u.email === user?.email || u.id === user?.id) ? { ...u, max_users: newMax } : u));
                setSlotSubmitting(false);
                setShowBuySlotModal(false);
                showAlert('success', `⚡ Đã nâng cấp mua thêm +10 slot thành viên thành công! Hạn ngạch mới: ${newMax} User.`);
              }, 1200);
            }}>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Số điện thoại / Zalo liên hệ xác nhận *</label>
                <input
                  className="form-input"
                  type="tel"
                  placeholder="0912 xxx xxx"
                  value={slotPhone}
                  onChange={e => setSlotPhone(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowBuySlotModal(false)}>
                  Hủy Bỏ
                </button>
                <button type="submit" className="btn btn-primary" disabled={slotSubmitting} style={{ background: 'linear-gradient(135deg, #9333ea, #7e22ce)', border: 'none', padding: '10px 20px', borderRadius: 12, fontWeight: 800 }}>
                  {slotSubmitting ? 'Đang Xử Lý...' : 'Xác Nhận Đăng Ký (50.000đ)'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
