// src/pages/AdminPage.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck, RefreshCw, Users, Database, ShieldAlert, Mail, Plus, Trash2, Sparkles, FolderKanban,
  CheckCircle2, AlertCircle, Loader2, Globe, Zap, Activity,
  Search, Check, X, Edit, CheckCircle, XCircle, Building2,
  ChevronDown, Eye, Pause, Play, Key, History, Copy
} from 'lucide-react';

// Nhóm nguồn theo tên miền (cha–con). Lấy URL từ nhiều field có thể có.
const getSourceUrl = (s) => s.url || s.rss_url || s.base_url || '';
const getSourceDomain = (s) => {
  try {
    return new URL(getSourceUrl(s)).hostname.replace(/^www\./, '');
  } catch {
    return tUI('ui.khac');
  }
};
import { adminService } from '../services/admin';
import { orgService } from '../services/organizations';
import { useAuth } from '../context/AuthContext';
import { useCrawl } from '../context/CrawlContext';
import { useLang } from '../context/LanguageContext';
import OrganizationsPanel from '../components/admin/OrganizationsPanel';
import MyRegionPanel from '../components/admin/MyRegionPanel';
import KeywordSuggestionsPanel from '../components/admin/KeywordSuggestionsPanel';
import TrackedProjectsPanel from '../components/admin/TrackedProjectsPanel';
import ConfirmModal from '../components/common/ConfirmModal';
import { tUI } from '../locales';


function formatUserPackage(u, lang = 'vi') {
  if (!u) return '';
  if (u.role === 'super_admin') return '👑 FULL DATA (SUPER ADMIN)';
  if (u.active_package === 'enterprise' || u.role === 'admin') {
    const max = u.max_users || 10;
    if (lang === 'ja') return `🏢 エンタープライズプラン (最大${max}名)`;
    if (lang === 'en') return `🏢 Enterprise Plan (Max ${max} Users)`;
    return `🏢 Gói Enterprise (Max ${max} User)`;
  }
  if (u.active_package === 'full') {
    if (lang === 'ja') return '💎 フルデータパック';
    if (lang === 'en') return '💎 Full Data Pack';
    return '💎 Full Data Pack';
  }
  if (u.active_package === 'single') {
    const srcMap = {
      adb: 'ADB',
      worldbank: 'World Bank',
      gov: lang === 'ja' ? '公共調達' : (lang === 'en' ? 'Gov Bidding' : 'Đấu Thầu')
    };
    const sName = srcMap[(u.selected_sources || ['adb'])[0]] || '1 Source';
    if (lang === 'ja') return `📦 1ソースプラン (${sName})`;
    if (lang === 'en') return `📦 1-Source Plan (${sName})`;
    return `📦 Gói 1 Nguồn (${sName})`;
  }
  if (u.active_package === 'combo2') {
    const srcMap = {
      adb: 'ADB',
      worldbank: 'WB',
      gov: lang === 'ja' ? '公共調達' : (lang === 'en' ? 'Gov' : 'Đấu Thầu')
    };
    const sNames = (u.selected_sources || ['adb', 'worldbank']).map(k => srcMap[k] || k).join('+');
    if (lang === 'ja') return `⚡ 2ソースコンボ (${sNames})`;
    if (lang === 'en') return `⚡ 2-Source Combo (${sNames})`;
    return `⚡ Combo 2 (${sNames})`;
  }
  if (lang === 'ja') return '📰 無料ニュースプラン';
  if (lang === 'en') return '📰 Free News Plan';
  return '📰 Báo Chí Miễn Phí';
}

function formatUserExpiration(exp, role, activePackage, lang = 'vi') {
  const isPerm = activePackage === 'free' || role === 'super_admin' || !exp || exp.includes('Vcnh') || exp.includes('Vĩnh') || exp.includes('Vinh') || exp.toLowerCase().includes('permanent');
  if (isPerm) {
    if (lang === 'ja') return '無期限';
    if (lang === 'en') return 'Permanent';
    return 'Vĩnh viễn';
  }
  return exp;
}

function formatOrgName(name, lang = 'vi') {
  if (!name) return '';
  if (name === 'Tổ chức Toàn quốc' || name === 'Toàn quốc') {
    if (lang === 'ja') return '全国組織';
    if (lang === 'en') return 'Nationwide Org';
    return 'Tổ chức Toàn quốc';
  }
  if (name === 'TEST_To chuc Mien Bắc' || name === 'TEST_To chuc Mien Bac') {
    if (lang === 'ja') return 'TEST_北部組織';
    if (lang === 'en') return 'TEST_Northern Org';
    return name;
  }
  if (name.startsWith('Tổ chức ') || name.startsWith('To chuc ')) {
    const regionPart = name.replace('Tổ chức ', '').replace('To chuc ', '').trim();
    const regionMapJa = { 'Toàn quốc': '全国', 'Miền Bắc': '北部', 'Mien Bac': '北部', 'Miền Trung': '中部', 'Mien Trung': '中部', 'Miền Nam': '南部', 'Mien Nam': '南部', 'Hà Nội': 'ハノイ', 'TP.HCM': 'ホーチミン', 'Đà Nẵng': 'ダナン', 'Hải Phòng': 'ハイフォン', 'Cần Thơ': 'カントー', 'Quảng Ninh': 'クアンニン', 'Bình Dương': 'ビンズオン', 'Đồng Nai': 'ドンナイ' };
    const regionMapEn = { 'Toàn quốc': 'Nationwide', 'Miền Bắc': 'Northern', 'Mien Bac': 'Northern', 'Miền Trung': 'Central', 'Mien Trung': 'Central', 'Miền Nam': 'Southern', 'Mien Nam': 'Southern', 'Hà Nội': 'Hanoi', 'TP.HCM': 'HCMC', 'Đà Nẵng': 'Da Nang', 'Hải Phòng': 'Hai Phong', 'Cần Thơ': 'Can Tho', 'Quảng Ninh': 'Quang Ninh', 'Bình Dương': 'Binh Duong', 'Đồng Nai': 'Dong Nai' };
    if (lang === 'ja') return `${regionMapJa[regionPart] || regionPart}組織`;
    if (lang === 'en') return `${regionMapEn[regionPart] || regionPart} Org`;
  }
  return name;
}

function formatRegionName(r, lang = 'vi') {
  if (!r) return '';
  const regMap = {
    'Toàn quốc': lang === 'ja' ? '全国' : (lang === 'en' ? 'Nationwide' : 'Toàn quốc'),
    'Miền Bắc': lang === 'ja' ? '北部' : (lang === 'en' ? 'Northern' : 'Miền Bắc'),
    'Miền Trung': lang === 'ja' ? '中部' : (lang === 'en' ? 'Central' : 'Miền Trung'),
    'Miền Nam': lang === 'ja' ? '南部' : (lang === 'en' ? 'Southern' : 'Miền Nam'),
    'Hà Nội': lang === 'ja' ? 'ハノイ' : (lang === 'en' ? 'Hanoi' : 'Hà Nội'),
    'TP.HCM': lang === 'ja' ? 'ホーチミン' : (lang === 'en' ? 'HCMC' : 'TP.HCM'),
    'Đà Nẵng': lang === 'ja' ? 'ダナン' : (lang === 'en' ? 'Da Nang' : 'Đà Nẵng'),
    'Hải Phòng': lang === 'ja' ? 'ハイフォン' : (lang === 'en' ? 'Hai Phong' : 'Hải Phòng'),
    'Cần Thơ': lang === 'ja' ? 'カントー' : (lang === 'en' ? 'Can Tho' : 'Cần Thơ'),
    'Quảng Ninh': lang === 'ja' ? 'クアンニン' : (lang === 'en' ? 'Quang Ninh' : 'Quảng Ninh'),
    'Bình Dương': lang === 'ja' ? 'ビンズオン' : (lang === 'en' ? 'Binh Duong' : 'Bình Dương'),
    'Đồng Nai': lang === 'ja' ? 'ドンナイ' : (lang === 'en' ? 'Dong Nai' : 'Đồng Nai'),
  };
  return regMap[r] || r;
}

function formatDisplayName(name, lang = 'vi') {
  if (!name) return '';
  if (name === 'Quản trị Phân Vùng') {
    if (lang === 'ja') return '地域管理者';
    if (lang === 'en') return 'Regional Admin';
    return 'Quản trị Phân Vùng';
  }
  if (name === 'Quản trị Tối cao' || name === 'Super Admin') {
    if (lang === 'ja') return '最高管理者';
    if (lang === 'en') return 'Super Admin';
    return 'Quản trị Tối cao';
  }
  return name;
}

export default function AdminPage() {
  const { lang, t } = useLang();
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

  // Login Logs & Password Reset states (FR-08)
  const [loginLogs, setLoginLogs] = useState([]);
  const [loginLogsTotal, setLoginLogsTotal] = useState(0);
  const [loginLogsPage, setLoginLogsPage] = useState(1);
  const [loginLogsSize, setLoginLogsSize] = useState(10);
  const [loginLogsLoading, setLoginLogsLoading] = useState(false);
  const [loginLogsSearch, setLoginLogsSearch] = useState('');

  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [resetPasswordMode, setResetPasswordMode] = useState('direct'); // 'direct' | 'email'
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [copiedPw, setCopiedPw] = useState(false);

  // New item forms
  const [newUser, setNewUser]           = useState({
    email: '',
    password: '',
    display_name: '',
    role: 'user',
    organization_id: null,
    region: userRegion || 'Toàn quốc',
    active_package: 'free',
    package_expiration: 'Vĩnh viễn',
    has_ai: false,
    can_view_dashboard: false,
    selected_sources: ['adb', 'worldbank'],
    permissions: {
      can_view_press: true,
      can_view_bidding: false,
      can_view_oda: false,
      can_view_dashboard: false,
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
  const [selectedSlotPackage, setSelectedSlotPackage] = useState(10);
  const [selectedSlotMonths, setSelectedSlotMonths] = useState(1);

  // ESC key listener to close active modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (editingUser) setEditingUser(null);
        if (viewingUser) setViewingUser(null);
        if (resetPasswordUser) setResetPasswordUser(null);
        if (editingSource) setEditingSource(null);
        if (showBuySlotModal) setShowBuySlotModal(false);
        if (deleteConfirm) setDeleteConfirm(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingUser, viewingUser, resetPasswordUser, editingSource, showBuySlotModal, deleteConfirm]);

  const showAlert = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4500);
  };

  const loadLoginLogs = async (page = loginLogsPage, size = loginLogsSize, query = loginLogsSearch) => {
    setLoginLogsLoading(true);
    try {
      const res = await adminService.getLoginLogs({ page, size, search: query || undefined });
      setLoginLogs(res?.items || []);
      setLoginLogsTotal(res?.total || 0);
      setLoginLogsPage(page);
      setLoginLogsSize(size);
    } catch (err) {
      showAlert('error', err.response?.data?.detail || t('admin.logsEmpty'));
    } finally {
      setLoginLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLoginLogs(loginLogsPage, loginLogsSize, loginLogsSearch);
    }
  }, [activeTab]);

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let pw = '';
    for (let i = 0; i < 12; i++) {
      pw += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPasswordVal(pw);
  };

  const handleExecuteResetPassword = async (e) => {
    e?.preventDefault();
    if (!resetPasswordUser) return;
    if (resetPasswordMode === 'direct' && !newPasswordVal.trim()) {
      showAlert('error', t('admin.newPasswordPlaceholder'));
      return;
    }
    setResetPasswordLoading(true);
    try {
      const payload = resetPasswordMode === 'email'
        ? { send_email: true }
        : { new_password: newPasswordVal.trim(), send_email: false };
      const res = await adminService.resetUserPassword(resetPasswordUser.id, payload);
      showAlert('success', res.sent_email ? t('admin.resetEmailSuccess') : t('admin.resetSuccess'));
      setResetPasswordUser(null);
      setNewPasswordVal('');
    } catch (err) {
      showAlert('error', err.response?.data?.detail || t('common.errorOccurred'));
    } finally {
      setResetPasswordLoading(false);
    }
  };


  const loadData = async () => {
    setLoading(true);
    try {
      const [u, s, pending, logs, bl, wl, orgs, loginLogsRes] = await Promise.all([
        adminService.getUsers().catch(() => []),
        adminService.getSources().catch(() => []),
        isSuperAdmin ? adminService.getPendingSources().catch(() => []) : Promise.resolve([]),
        adminService.getCrawlLogs().catch(() => []),
        adminService.getBlacklist().catch(() => []),
        adminService.getWhitelist().catch(() => []),
        // Danh sách MỌI phân vùng là API của super admin — admin phân vùng gọi sẽ 403,
        // và họ cũng chỉ cần vùng của mình (tab "Phân Vùng Của Tôi").
        isSuperAdmin ? orgService.listOrganizations().catch(() => []) : Promise.resolve([]),
        adminService.getLoginLogs({ page: 1, size: 10 }).catch(() => ({ items: [], total: 0 })),
      ]);
      setLoginLogs(loginLogsRes?.items || []);
      setLoginLogsTotal(loginLogsRes?.total || 0);
      setUsers((u || []).map(usr => {
        const uKey = usr.email || usr.id;
        const normalizedRole = (usr.role || 'user').toLowerCase();
        const activePkg = usr.permissions?.active_package || localStorage.getItem(`bis_active_package_${uKey}`) || (normalizedRole === 'super_admin' ? 'full' : normalizedRole === 'admin' ? 'enterprise' : 'free');
        const hasAi = usr.permissions?.has_ai ?? (localStorage.getItem(`bis_ai_package_${uKey}`) === 'true' || normalizedRole === 'super_admin');
        const canViewDash = usr.permissions?.can_view_dashboard ?? (localStorage.getItem(`bis_dashboard_access_${uKey}`) === 'true' || (activePkg === 'full' || activePkg === 'enterprise' || normalizedRole === 'super_admin' || normalizedRole === 'admin'));
        const pkgExp = usr.permissions?.package_expiration || localStorage.getItem(`bis_pkg_exp_${uKey}`) || (normalizedRole === 'super_admin' || activePkg === 'free' ? 'Vĩnh viễn' : '12/05/2026 - 12/05/2027');
        const themes = usr.permissions?.purchased_themes || JSON.parse(localStorage.getItem(`bis_purchased_themes_${uKey}`) || '[]');
        const selectedSrcs = usr.permissions?.selected_sources || JSON.parse(localStorage.getItem(`bis_selected_sources_${uKey}`) || '["adb", "worldbank"]');
        const expStr = localStorage.getItem(`bis_slot_exp_${uKey}`);
        const isCancelled = localStorage.getItem(`bis_slot_cancelled_${uKey}`) === 'true';
        let maxUsers = parseInt(usr.permissions?.max_users || localStorage.getItem(`bis_max_users_${uKey}`) || '10', 10);

        if (expStr && isCancelled) {
          const parts = expStr.split('/');
          if (parts.length === 3) {
            const expDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10), 23, 59, 59);
            if (Date.now() > expDate.getTime()) {
              maxUsers = 10;
              localStorage.setItem(`bis_max_users_${uKey}`, '10');
              localStorage.removeItem(`bis_slot_exp_${uKey}`);
              localStorage.removeItem(`bis_slot_cancelled_${uKey}`);
              localStorage.removeItem(`bis_extra_slots_${uKey}`);
            }
          }
        }

        return {
          ...usr,
          role: normalizedRole,
          active_package: activePkg,
          has_ai: hasAi,
          can_view_dashboard: canViewDash,
          package_expiration: pkgExp,
          purchased_themes: themes,
          selected_sources: selectedSrcs,
          max_users: maxUsers,
          slot_cancelled: isCancelled,
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

  // ODA Crawler Handlers
  //
  // Máy chủ CỐ Ý không để lỗi mạng của nguồn ngoài làm hỏng request: nó trả 200 kèm
  // {new: 0, updated: 0, error: "..."} để job nền không chết. Vì vậy chỉ bắt exception là
  // chưa đủ — không đọc `error` thì mọi lần nguồn sập vẫn hiện "cào thành công".
  const baoKetQuaCrawl = (res, nhan) => {
    if (res?.error) {
      showAlert('error', `${nhan} không lấy được dữ liệu: ${res.error}`);
      return;
    }
    showAlert('success', `${nhan} xong! Thêm mới ${res?.new ?? 0}, cập nhật ${res?.updated ?? 0}.`);
  };

  const handleCrawlWorldBank = async (rows = 100) => {
    setActionLoading(true);
    try {
      const res = await adminService.crawlWorldBank(rows);
      baoKetQuaCrawl(res, lang === 'ja' ? 'World Bank クロール' : (lang === 'en' ? 'Crawl World Bank' : 'Cào World Bank'));
      loadData();
    } catch (e) {
      showAlert('error', e.response?.data?.detail || 'Lỗi khi cào World Bank.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCrawlAdb = async () => {
    setActionLoading(true);
    try {
      baoKetQuaCrawl(await adminService.crawlAdb(), lang === 'ja' ? 'ADB クロール' : (lang === 'en' ? 'Crawl ADB' : 'Cào dữ liệu ADB'));
      loadData();
    } catch (e) {
      showAlert('error', e.response?.data?.detail || 'Lỗi khi cào ADB.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCrawlDauthau = async (kind = 'all', q = '', pages = 1) => {
    setActionLoading(true);
    try {
      baoKetQuaCrawl(await adminService.crawlDauthau(kind, q, pages), lang === 'ja' ? `dauthau.asia クロール (${kind})` : (lang === 'en' ? `Crawl dauthau.asia (${kind})` : `Cào dauthau.asia (${kind})`));
      loadData();
    } catch (e) {
      showAlert('error', e.response?.data?.detail || 'Lỗi khi cào dauthau.asia.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCrawlMuasamcong = async () => {
    setActionLoading(true);
    try {
      baoKetQuaCrawl(await adminService.crawlMuasamcong(), lang === 'ja' ? '公共調達 クロール (Playwright)' : (lang === 'en' ? 'Crawl Public Procurement (Playwright)' : 'Cào Mua sắm công (Playwright)'));
      loadData();
    } catch (e) {
      showAlert('error', e.response?.data?.detail || 'Lỗi khi cào Muasamcong.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveMuasamcongUrls = async (kind = 'notice', limit = 50) => {
    setActionLoading(true);
    try {
      const res = await adminService.resolveMuasamcongUrls(kind, limit);
      showAlert('success', `Backfill URL thành công: đã check ${res?.checked || 0}, resolved ${res?.resolved || 0}, còn lại ${res?.remaining || 0}.`);
    } catch (e) {
      showAlert('error', e.response?.data?.detail || 'Lỗi khi backfill URL.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnrichProcurementDetails = async (limit = 20) => {
    setActionLoading(true);
    try {
      const res = await adminService.enrichProcurementDetails(limit);
      showAlert('success', `Enrich details thành công: checked ${res?.checked || 0}, enriched ${res?.enriched || 0}, còn lại ${res?.remaining || 0}.`);
    } catch (e) {
      showAlert('error', e.response?.data?.detail || 'Lỗi khi enrich chi tiết.');
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
      showAlert('error', `⚠️ Bạn đã đạt giới hạn tối đa ${myMaxUsers} tài khoản thành viên của Gói Enterprise Tổ Chức. Vui lòng liên hệ Super Admin để nâng cấp mua thêm slot!`);
      return;
    }

    setActionLoading(true);
    try {
      const pkg = newUser.active_package || 'free';
      const canViewDash = newUser.can_view_dashboard ?? (pkg === 'full' || pkg === 'enterprise');
      const perms = {
        can_view_press: true,
        can_view_bidding: pkg === 'free' ? false : (pkg === 'full' || pkg === 'enterprise' ? true : (newUser.selected_sources || []).includes('gov')),
        can_view_oda: pkg === 'free' ? false : (pkg === 'full' || pkg === 'enterprise' ? true : ((newUser.selected_sources || []).includes('adb') || (newUser.selected_sources || []).includes('worldbank'))),
        can_view_dashboard: canViewDash,
        can_manage_keywords: true,
        can_export_data: true,
        active_package: pkg,
        selected_sources: newUser.selected_sources || ['adb', 'worldbank'],
        package_expiration: newUser.package_expiration || 'Vĩnh viễn',
        has_ai: newUser.has_ai || false,
      };

      const payload = {
        ...newUser,
        organization_id: newUser.organization_id || null,
        region: isRegionalAdmin ? userRegion : newUser.region,
        permissions: perms,
      };
      const created = await adminService.createUser(payload);
      const uKey = created.email || created.id;
      localStorage.setItem(`bis_active_package_${uKey}`, pkg);
      localStorage.setItem(`bis_ai_package_${uKey}`, newUser.has_ai ? 'true' : 'false');
      localStorage.setItem(`bis_dashboard_access_${uKey}`, canViewDash ? 'true' : 'false');
      localStorage.setItem(`bis_pkg_exp_${uKey}`, newUser.package_expiration || 'Vĩnh viễn');
      localStorage.setItem(`bis_selected_sources_${uKey}`, JSON.stringify(newUser.selected_sources || ['adb', 'worldbank']));

      const mergedCreated = {
        ...created,
        active_package: pkg,
        has_ai: newUser.has_ai || false,
        can_view_dashboard: canViewDash,
        package_expiration: newUser.package_expiration || 'Vĩnh viễn',
        selected_sources: newUser.selected_sources || ['adb', 'worldbank'],
        permissions: perms,
      };
      setUsers(prev => [...prev, mergedCreated]);
      setNewUser({
        email: '',
        password: '',
        display_name: '',
        role: 'user',
        organization_id: null,
        region: userRegion || 'Toàn quốc',
        active_package: 'free',
        package_expiration: 'Vĩnh viễn',
        has_ai: false,
        can_view_dashboard: false,
        selected_sources: ['adb', 'worldbank'],
        permissions: {
          can_view_press: true,
          can_view_bidding: false,
          can_view_oda: false,
          can_view_dashboard: false,
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
      title: tUI('ui.xoa-tai-khoan-nguoi-dung'),
      message: lang === 'ja' ? 'このアカウントをシステムから削除してもよろしいですか？' : (lang === 'en' ? 'Are you sure you want to delete this account from the system?' : 'Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống?'),
      itemName: u.email,
      itemSub: u.display_name ? `${lang === 'ja' ? '氏名: ' : (lang === 'en' ? 'Name: ' : 'Họ tên: ')}${formatDisplayName(u.display_name, lang)}` : ''
    });
  };

  const handleOpenEditUser = (u) => {
    const rawRole = (u.role || 'user').toLowerCase();
    const validRoles = ['super_admin', 'admin', 'staff', 'user'];
    const role = validRoles.includes(rawRole) ? rawRole : 'user';

    setEditingUser({
      id: u.id,
      email: u.email || '',
      display_name: formatDisplayName(u.display_name, lang) || '',
      role: role,
      organization_id: u.organization_id || null,
      region: u.region || userRegion || 'Toàn quốc',
      permissions: u.permissions || {
        can_view_press: true,
        can_view_bidding: u.active_package === 'free' ? false : true,
        can_view_oda: u.active_package === 'free' ? false : true,
        can_view_dashboard: u.active_package === 'full' || u.active_package === 'enterprise' || role === 'super_admin' || role === 'admin',
        can_manage_keywords: true,
        can_export_data: true,
      },
      password: '',
      is_active: u.is_active ?? true,
      email_digest_enabled: u.email_digest_enabled ?? true,
      digest_hour: u.digest_hour ?? 7,
      timezone: u.timezone || 'Asia/Ho_Chi_Minh',
      active_package: u.active_package || (role === 'admin' ? 'enterprise' : 'free'),
      has_ai: u.has_ai ?? false,
      can_view_dashboard: u.can_view_dashboard ?? u.permissions?.can_view_dashboard ?? (u.active_package === 'full' || u.active_package === 'enterprise' || role === 'super_admin' || role === 'admin'),
      package_expiration: u.package_expiration || (u.active_package === 'free' || role === 'super_admin' ? 'Vĩnh viễn' : '12/05/2026 - 12/05/2027'),
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
      const pkg = editingUser.active_package || 'free';
      const canViewDash = editingUser.can_view_dashboard ?? (pkg === 'full' || pkg === 'enterprise');
      const perms = {
        ...(editingUser.permissions || {}),
        can_view_press: editingUser.permissions?.can_view_press ?? true,
        can_view_bidding: pkg === 'free' ? false : (pkg === 'full' || pkg === 'enterprise' ? true : (editingUser.selected_sources || []).includes('gov')),
        can_view_oda: pkg === 'free' ? false : (pkg === 'full' || pkg === 'enterprise' ? true : ((editingUser.selected_sources || []).includes('adb') || (editingUser.selected_sources || []).includes('worldbank'))),
        can_view_dashboard: canViewDash,
        active_package: editingUser.active_package,
        selected_sources: editingUser.selected_sources,
        package_expiration: editingUser.package_expiration,
        has_ai: editingUser.has_ai,
        purchased_themes: editingUser.purchased_themes,
        max_users: editingUser.max_users,
      };

      const payload = {
        email: editingUser.email,
        display_name: editingUser.display_name,
        role: editingUser.role,
        organization_id: editingUser.organization_id || null,
        region: editingUser.region,
        permissions: perms,
        is_active: editingUser.is_active,
        email_digest_enabled: editingUser.email_digest_enabled,
        digest_hour: parseInt(editingUser.digest_hour, 10),
        timezone: editingUser.timezone,
      };
      if (editingUser.password && editingUser.password.trim() !== '') {
        payload.password = editingUser.password.trim();
      }

      // KHÔNG bọc lời gọi này trong try/catch riêng: bắt lỗi rồi lấy chính dữ liệu vừa
      // nhập làm "kết quả" khiến màn hình báo đã lưu trong khi máy chủ đã từ chối, và
      // giá trị cũ quay lại ngay lần Làm Mới Data kế tiếp. Lỗi phải rơi xuống catch dưới.
      const updated = await adminService.updateUser(editingUser.id, payload);

      // Ghi các giá trị gói dịch vụ xuống trình duyệt SAU khi máy chủ nhận — ghi trước
      // thì một lần lưu hỏng vẫn để lại gói mới trên máy quản trị viên.
      const uKey = editingUser.email || editingUser.id;
      localStorage.setItem(`bis_active_package_${uKey}`, editingUser.active_package);
      localStorage.setItem(`bis_ai_package_${uKey}`, editingUser.has_ai ? 'true' : 'false');
      localStorage.setItem(`bis_dashboard_access_${uKey}`, canViewDash ? 'true' : 'false');
      localStorage.setItem(`bis_pkg_exp_${uKey}`, editingUser.package_expiration || 'Vĩnh viễn');
      localStorage.setItem(`bis_purchased_themes_${uKey}`, JSON.stringify(editingUser.purchased_themes || []));
      localStorage.setItem(`bis_selected_sources_${uKey}`, JSON.stringify(editingUser.selected_sources || ['adb', 'worldbank']));
      localStorage.setItem(`bis_max_users_${uKey}`, String(editingUser.max_users || 10));

      const mergedUser = {
        ...updated,
        active_package: editingUser.active_package,
        has_ai: editingUser.has_ai,
        can_view_dashboard: canViewDash,
        package_expiration: editingUser.package_expiration,
        purchased_themes: editingUser.purchased_themes,
        selected_sources: editingUser.selected_sources,
        max_users: editingUser.max_users || 10,
        permissions: perms,
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

  // Tạm ngưng / kích hoạt lại nguồn (FR-02 Phụ lục B: Admin thêm/xóa/{lang === 'ja' ? '一時停止' : (lang === 'en' ? 'PAUSED' : 'TẠM NGƯNG')} nguồn).
  // Máy chủ đã nhận `is_active` ở PUT /admin/sources/{id}; trước đây giao diện không có nút.
  const handleToggleSourceActive = async (s) => {
    const bat = s.is_active === false;
    setActionLoading(true);
    try {
      const updated = await adminService.updateSource(s.id, { is_active: bat });
      setSources(prev => prev.map(x => (x.id === s.id ? { ...x, ...updated } : x)));
      showAlert('success', bat
        ? (lang === 'ja' ? `ソース「${s.name}」を再開しました。次回の収集から反映されます。` : (lang === 'en' ? `Reactivated source "${s.name}". Will be collected next crawl.` : `Đã kích hoạt lại nguồn "${s.name}". Nguồn được thu thập từ lượt kế tiếp.`))
        : (lang === 'ja' ? `ソース「${s.name}」を一時停止しました。` : (lang === 'en' ? `Paused source "${s.name}".` : `Đã tạm ngưng nguồn "${s.name}". Các lượt thu thập sau sẽ bỏ qua nguồn này.`)));
    } catch (err) {
      showAlert('error', err?.response?.data?.detail || (lang === 'ja' ? 'ソース状態の変更に失敗しました。' : (lang === 'en' ? 'Failed to update source status.' : 'Không đổi được trạng thái nguồn.')));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSource = (s) => {
    setDeleteConfirm({
      type: 'source',
      item: s,
      title: tUI('ui.xoa-nguon-tin'),
      message: lang === 'ja' ? 'このソースをシステムから削除してもよろしいですか？' : (lang === 'en' ? 'Are you sure you want to delete this source from the system?' : 'Bạn có chắc chắn muốn xóa nguồn tin này khỏi hệ thống?'),
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
      } else if (type === 'cancel_extra_slots') {
        const uKey = user?.email || user?.id || 'default';
        const expDate = localStorage.getItem(`bis_slot_exp_${uKey}`);
        const currentMax = user?.max_users || parseInt(localStorage.getItem(`bis_max_users_${uKey}`) || '10', 10);
        localStorage.setItem(`bis_slot_cancelled_${uKey}`, 'true');
        setUsers(prev => prev.map(u => (u.email === user?.email || u.id === user?.id) ? { ...u, slot_cancelled: true } : u));
        showAlert('success', `⚡ Đã hủy tự động gia hạn thành công! Bạn vẫn được tiếp tục sử dụng đầy đủ ${currentMax} User cho đến hết ngày ${expDate || 'hạn tháng hiện tại'}.`);
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
    { id: 'crawl',     label: t('admin.sourcesTab'), icon: <Database size={16} />, badge: sources.length },
    { id: 'users',     label: t('admin.usersTab'),  icon: <Users size={16} />,    badge: users.length },
    { id: 'logs',      label: t('admin.logsTab'),   icon: <History size={16} />,  badge: loginLogsTotal },
    // Đa tổ chức (ADR-005): super admin quản MỌI phân vùng; admin phân vùng chỉ vùng mình
    // (đổi tên + phạm vi dữ liệu) — gộp chung 1 tab để không phải nhảy qua lại.
    ...(isSuperAdmin ? [{ id: 'orgs', label: t('admin.orgsTab'), icon: <Building2 size={16} /> }] : []),
    // Người dùng thêm/sửa dự án là hiện ngay (không phê duyệt) — tab này để super admin nhìn
    // toàn bộ ở một chỗ và sửa/xóa khi cần.
    ...(isSuperAdmin ? [{ id: 'projects', label: t('admin.projectsTab'), icon: <FolderKanban size={16} /> }] : []),
    ...(isRegionalAdmin ? [{ id: 'myRegion', label: t('admin.myRegionTab'), icon: <Building2 size={16} /> }] : []),
    { id: 'filters',   label: t('admin.keywordsTab'), icon: <ShieldAlert size={16} />, badge: blacklist.length + whitelist.length },
    { id: 'suggest',   label: t('admin.suggestTab'),  icon: <Sparkles size={16} /> },
    // Bản tin CHUNG toàn hệ thống: nội dung không theo phạm vi tổ chức và gửi tới danh
    // sách email tự nhập -> chỉ super admin (khớp require_super_admin ở /admin/digest).
    ...(isSuperAdmin ? [{ id: 'digest', label: t('admin.digestTab'), icon: <Mail size={16} /> }] : []),
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
              {t('admin.title')}
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6, maxWidth: 520, lineHeight: 1.5 }}>
              {t('admin.subtitle')}
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
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> {t('admin.refreshData')}
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
              {isCrawling ? t('admin.crawling') : `⚡ ${t('admin.triggerCrawl')}`}
            </button>
          </div>
        </div>

        {/* System Stats Bar */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
          marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          {[
            { label: t('admin.sourcesTab'), val: sources.length, icon: <Database size={15} style={{ color: '#818cf8' }} />, sub: t('admin.sourceCount') },
            { label: t('admin.usersTab'), val: users.length, icon: <Users size={15} style={{ color: '#38bdf8' }} />, sub: t('admin.userCount') },
            { label: t('admin.keywordsTab'), val: blacklist.length + whitelist.length, icon: <ShieldAlert size={15} style={{ color: '#f472b6' }} />, sub: `${blacklist.length} ${tUI('ui.cam-tu')} · ${whitelist.length} ${tUI('ui.uu-tien-tu')}` },
            { label: 'STATUS', val: isCrawling ? t('admin.crawling') : t('admin.online'), icon: <Activity size={15} style={{ color: isCrawling ? '#818cf8' : '#4ade80' }} />, sub: isCrawling ? t('admin.crawling') : t('admin.crawlerEvery4h') },
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
      {msg && (() => {
        // 'info' phải có kiểu riêng: gộp chung với lỗi thì thông báo bình thường
        // ("chưa có gợi ý mới") hiện trên nền đỏ như một sự cố.
        const kieu = {
          success: { bg: '#f0fdf4', vien: '#86efac', chu: '#15803d' },
          info: { bg: '#eff6ff', vien: '#bfdbfe', chu: '#1d4ed8' },
          error: { bg: '#fff1f2', vien: '#fca5a5', chu: '#b91c1c' },
        }[msg.type] || { bg: '#fff1f2', vien: '#fca5a5', chu: '#b91c1c' };
        return (
          <div style={{
            padding: '14px 18px', borderRadius: 14, fontSize: 13.5, fontWeight: 700, marginBottom: 24,
            background: kieu.bg,
            border: `1.5px solid ${kieu.vien}`,
            color: kieu.chu,
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {msg.text}
          </div>
        );
      })()}

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
          <span style={{ fontWeight: 600, fontSize: 14 }}>...</span>
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
                    📥 {lang === 'ja' ? `Super Admin承認待ちの提案ソース (${pendingSources.length})` : (lang === 'en' ? `Pending Source Suggestions (${pendingSources.length})` : `Nguồn Tin Đề Xuất Chờ Super Admin Duyệt (${pendingSources.length})`)}
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
                              {lang === 'ja' ? '地域' : (lang === 'en' ? 'Region' : 'Phân vùng')}: {ps.region || (lang === 'ja' ? '未定義' : (lang === 'en' ? 'Undefined' : 'Không xác định'))}
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
                            <CheckCircle size={14} /> {lang === 'ja' ? '承認' : (lang === 'en' ? 'Approve' : 'Duyệt Nguồn')}
                          </button>
                          <button
                            className="btn btn-sm"
                            onClick={() => handleRejectSource(ps.id)}
                            style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '6px 14px', fontWeight: 800, gap: 4 }}
                          >
                            <XCircle size={14} /> {lang === 'ja' ? '拒否' : (lang === 'en' ? 'Reject' : 'Từ Chối')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ODA & Procurement Crawlers Control Panel */}
              <div style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 20, padding: '22px 24px', boxShadow: '0 6px 24px rgba(0,0,0,0.03)',
              }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(168, 85, 247, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
                    <Zap size={18} />
                  </div>
                  {t('admin.crawlerTools')}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => handleCrawlWorldBank(200)}
                    disabled={actionLoading}
                    className="btn"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', padding: '12px 16px', borderRadius: 14, fontWeight: 800, fontSize: 13, gap: 8, justifyContent: 'center' }}
                  >
                    {t('admin.crawlWb', '🌐 Crawl World Bank')}
                  </button>

                  <button
                    type="button"
                    onClick={handleCrawlAdb}
                    disabled={actionLoading}
                    className="btn"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', padding: '12px 16px', borderRadius: 14, fontWeight: 800, fontSize: 13, gap: 8, justifyContent: 'center' }}
                  >
                    {t('admin.crawlAdb', '🏢 Crawl ADB (RSS)')}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCrawlDauthau('all', '', 2)}
                    disabled={actionLoading}
                    className="btn"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none', padding: '12px 16px', borderRadius: 14, fontWeight: 800, fontSize: 13, gap: 8, justifyContent: 'center' }}
                  >
                    {t('admin.crawlDauthau', '📋 Crawl dauthau.asia')}
                  </button>

                  <button
                    type="button"
                    onClick={handleCrawlMuasamcong}
                    disabled={actionLoading}
                    className="btn"
                    style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)', color: 'white', border: 'none', padding: '12px 16px', borderRadius: 14, fontWeight: 800, fontSize: 13, gap: 8, justifyContent: 'center' }}
                  >
                    {t('admin.crawlMuasamcong', '⚡ Crawl Muasamcong (Playwright)')}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResolveMuasamcongUrls('notice', 50)}
                    disabled={actionLoading}
                    className="btn"
                    style={{ background: 'var(--bg-surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 14, fontWeight: 700, fontSize: 12.5, gap: 8, justifyContent: 'center' }}
                  >
                    {t('admin.backfillMuasamcong', '🔗 Backfill URL Muasamcong')}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEnrichProcurementDetails(20)}
                    disabled={actionLoading}
                    className="btn"
                    style={{ background: 'var(--bg-surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 14, fontWeight: 700, fontSize: 12.5, gap: 8, justifyContent: 'center' }}
                  >
                    {t('admin.enrichProcurement', '✨ Enrich Procurement Details')}
                  </button>
                </div>
              </div>

              {/* Add Source Form Card */}
              <div style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 20, padding: '22px 24px', boxShadow: '0 6px 24px rgba(0,0,0,0.03)',
              }}>

                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-600, #2563eb)' }}>
                    <Plus size={16} />
                  </div>
                  {isSuperAdmin ? t('admin.addSource') : `${tUI('ui.de-xuat-nguon-crawl-moi')} (${userRegion || tUI('ui.to-chuc')})`}
                </div>

                <form onSubmit={handleCreateSource} className="responsive-grid-form" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 1fr', gap: 14, alignItems: 'end' }}>
                  <div>
                    <label className="form-label">{t('admin.sourceName')} *</label>
                    <input className="form-input" placeholder={lang === 'ja' ? '例: 日本経済新聞、ロイター...' : (lang === 'en' ? 'e.g. Reuters, Nikkei...' : 'vd: VnExpress Kinh Doanh')} value={newSource.name} onChange={e => setNewSource({ ...newSource, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="form-label">{t('admin.sourceType')} *</label>
                    <select className="form-input" value={newSource.source_type} onChange={e => setNewSource({ ...newSource, source_type: e.target.value })}>
                      <option value="press">{tUI('ui.bao-chi-press')}</option>
                      <option value="gov">{tUI('ui.dau-thau-gov')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">{t('admin.sourceUrl')} *</label>
                    <input className="form-input" placeholder={tUI('ui.link-rss-hoac-trang-chuyen-muc-tin-tuc')} title={tUI('ui.dan-link-rss-vd-https-vnexpress-net-rss-kinh-doa')} value={newSource.url} onChange={e => setNewSource({ ...newSource, url: e.target.value })} required />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading} style={{ gap: 6, height: 42, justifyContent: 'center' }}>
                    {actionLoading ? <Loader2 size={15} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Plus size={15} />}
                    {isSuperAdmin ? t('admin.addSourceBtn') : tUI('ui.gui-de-xuat')}
                  </button>
                </form>
                {/* Trước đây form này ngầm coi mọi link là RSS: dán trang chủ báo vào thì nguồn
                    ra 0 bài mà nhật ký crawl vẫn ghi "thành công". Nay máy chủ tự nhận diện. */}
                <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {lang === 'ja'
                    ? 'RSSリンクまたはニュースカテゴリURLを入力可能 — システムが自動認識します。自動アクセスをブロックするサイト（JavaScript必須）はクロールログに理由とともにエラーが記録されます。'
                    : (lang === 'en'
                      ? 'Paste RSS feed or news category page URL — system auto-detects. Sites blocking automated access (requiring JavaScript) will report errors with details in the crawl log.'
                      : 'Có thể dán link RSS hoặc trang chuyên mục tin tức — hệ thống tự nhận diện. Trang chặn truy cập tự động (yêu cầu chạy JavaScript) sẽ báo lỗi kèm lý do trong nhật ký crawl.')}
                </p>
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
                    {t('admin.sourceList')} ({sources.length})
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        value={sourceSearch}
                        onChange={e => setSourceSearch(e.target.value)}
                        placeholder={tUI('ui.tim-nguon-theo-ten-url')}
                        className="form-input"
                        style={{ paddingLeft: 30, height: 34, fontSize: 12, width: 230 }}
                      />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '3px 10px', borderRadius: 20, border: '1px solid #a7f3d0' }}>
                      🟢 {t('admin.online')}
                    </span>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface-2)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '12px 20px' }}>{t('admin.sourceName')}</th>
                      <th style={{ padding: '12px 20px' }}>{t('admin.sourceType')}</th>
                      <th style={{ padding: '12px 20px' }}>URL / Target</th>
                      <th style={{ padding: '12px 20px' }}>{t('admin.lastCrawled')}</th>
                      <th style={{ padding: '12px 20px', textAlign: 'right' }}>{t('admin.actions')}</th>
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
                                ? (lang === 'ja' ? 'ニュースソースがありません。上で追加してください。' : (lang === 'en' ? 'No sources yet. Add one above.' : 'Chưa có nguồn tin nào. Thêm nguồn đầu tiên ở trên.'))
                                : (lang === 'ja' ? '一致するソースが見つかりません。' : (lang === 'en' ? 'No matching sources found.' : 'Không tìm thấy nguồn phù hợp.'))}
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
                                {s.is_active === false && (
                                  <span style={{
                                    fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
                                    background: 'rgba(245, 158, 11, 0.14)', color: '#b45309',
                                    border: '1px solid rgba(245, 158, 11, 0.3)', whiteSpace: 'nowrap',
                                  }}>
                                    {lang === 'ja' ? '一時停止' : (lang === 'en' ? 'PAUSED' : 'TẠM NGƯNG')}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <span className={`source-type-badge ${isGov ? 'gov' : 'press'}`} style={{
                                fontSize: 10.5, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                                background: isGov ? 'rgba(139, 92, 246, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                                color: isGov ? 'var(--color-dau-thau, #8b5cf6)' : 'var(--brand-500, #3b82f6)',
                                border: `1px solid ${isGov ? 'rgba(139, 92, 246, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`,
                              }}>
                                {isGov ? (lang === 'ja' ? '公共調達 (GOV)' : (lang === 'en' ? 'BIDDING (GOV)' : 'ĐẤU THẦU (GOV)')) : (lang === 'ja' ? '報道 (PRESS)' : (lang === 'en' ? 'NEWS (PRESS)' : 'BÁO CHÍ (PRESS)'))}
                              </span>
                            </td>
                            <td style={{ padding: '14px 20px', color: 'var(--text-muted)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <a href={getSourceUrl(s)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-600)', textDecoration: 'none', fontWeight: 600 }}>
                                {getSourceUrl(s)}
                              </a>
                            </td>
                            <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 12 }}>
                              {s.last_crawled_at ? new Date(s.last_crawled_at).toLocaleString(lang === 'ja' ? 'ja-JP' : (lang === 'en' ? 'en-US' : 'vi-VN')) : (lang === 'ja' ? '初期化直後' : (lang === 'en' ? 'Just Initialized' : 'Vừa khởi tạo'))}
                            </td>
                            <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                                {(() => {
                                  // Nguồn dùng chung (không có người đề xuất) chỉ Super Admin được bật/tắt:
                                  // tắt một nguồn như vậy là dừng thu thập cho TOÀN hệ thống.
                                  const khongDuocDoi = !isSuperAdmin && !s.created_by_user_id;
                                  return (
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => handleToggleSourceActive(s)}
                                  disabled={actionLoading || khongDuocDoi}
                                  style={{
                                    color: khongDuocDoi ? 'var(--text-muted)' : (s.is_active === false ? '#059669' : '#b45309'),
                                    padding: '6px 10px', cursor: khongDuocDoi ? 'not-allowed' : 'pointer',
                                  }}
                                  title={khongDuocDoi
                                    ? (lang === 'ja' ? '共用ソース — Super Adminのみ一時停止可能' : (lang === 'en' ? 'Shared source — Super Admin only' : 'Nguồn dùng chung — chỉ Super Admin được tạm ngưng'))
                                    : (s.is_active === false
                                      ? (lang === 'ja' ? '再開: 次回の収集から反映' : (lang === 'en' ? 'Reactivate: collected from next run' : 'Kích hoạt lại: nguồn được thu thập từ lượt kế tiếp'))
                                      : (lang === 'ja' ? '一時停止: 次回以降の収集をスキップ' : (lang === 'en' ? 'Pause: skip in future runs' : 'Tạm ngưng: các lượt thu thập sau bỏ qua nguồn này')))}
                                >
                                  {s.is_active === false ? <><Play size={14} /> {tUI('ui.kich-hoat')}</> : <><Pause size={14} /> {tUI('ui.tam-ngung')}</>}
                                </button>
                                  );
                                })()}
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => handleOpenEditSource(s)}
                                  style={{ color: 'var(--brand-600, #2563eb)', padding: '6px 10px' }}
                                  title={tUI('ui.chinh-sua-nguon-tin')}
                                >
                                  <Edit size={14} /> {lang === 'ja' ? '編集' : (lang === 'en' ? 'Edit' : 'Sửa')}
                                </button>
                                {isSuperAdmin ? (
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => handleDeleteSource(s)}
                                    title={tUI('ui.xoa-nguon')}
                                    style={{ color: '#ef4444', padding: '6px 10px' }}
                                  >
                                    <Trash2 size={14} /> {lang === 'ja' ? '削除' : (lang === 'en' ? 'Delete' : 'Xóa')}
                                  </button>
                                ) : (
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tUI('ui.chi-super-admin-duoc-xoa')}</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      };

                      // Cây 2 tầng: Loại nguồn → Tên miền → feed.
                      const TYPE_META = {
                        gov:   { label: tUI('ui.dau-thau-gov'),  icon: '📋', color: 'var(--color-dau-thau, #8b5cf6)', bg: 'rgba(139, 92, 246, 0.08)', border: 'rgba(139, 92, 246, 0.2)' },
                        press: { label: tUI('ui.bao-chi-press'), icon: '📰', color: 'var(--brand-500, #3b82f6)', bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.2)' },
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
                                  {typeList.length} {tUI('ui.nguon-dv')}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>· {tOpen ? tUI('ui.thu-gon') : tUI('ui.xo-ra')}</span>
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
                const uKey = user?.email || user?.id || 'default';
                const myMaxUsers = user?.max_users || parseInt(localStorage.getItem(`bis_max_users_${uKey}`) || '10', 10);
                const slotExpDate = localStorage.getItem(`bis_slot_exp_${uKey}`);
                const isCancelled = localStorage.getItem(`bis_slot_cancelled_${uKey}`) === 'true';
                const regCount = users.filter(u => u.role !== 'super_admin' && (isSuperAdmin || u.region === userRegion)).length;
                const isFullQuota = regCount >= myMaxUsers;
                const extraSlotCount = myMaxUsers > 10 ? myMaxUsers - 10 : 0;
                return (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(147,51,234,0.08))',
                    border: '1px solid rgba(147,51,234,0.25)',
                    borderRadius: 16, padding: '16px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 280 }}>
                      <div style={{ padding: 10, borderRadius: 12, background: '#f3e8ff', color: '#9333ea', flexShrink: 0 }}>
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span>🏢 {t('ui.admin-phan-vung')}: {userRegion === 'Toàn quốc' ? t('common.nationwide') : userRegion} ({t('upgrade.tableEnterprise')})</span>
                          {extraSlotCount > 0 && !isCancelled && (
                            <span style={{ fontSize: 11, fontWeight: 700, background: '#f3e8ff', color: '#9333ea', padding: '2px 8px', borderRadius: 12, border: '1px solid rgba(147,51,234,0.3)' }}>
                              ⚡ {lang === 'ja' ? `+${extraSlotCount}スロット追加購入済` : (lang === 'en' ? `+${extraSlotCount} Extra Slots Purchased` : `Mua thêm +${extraSlotCount} Slot User`)}
                            </span>
                          )}
                          {isCancelled && (
                            <span style={{ fontSize: 11, fontWeight: 700, background: '#fff7ed', color: '#ea580c', padding: '2px 8px', borderRadius: 12, border: '1px solid #ffedd5' }}>
                              ⚠️ {lang === 'ja' ? `自動更新キャンセル済 (有効期限: ${slotExpDate || '月末まで'})` : (lang === 'en' ? `Auto-renewal cancelled (Valid until ${slotExpDate || 'month end'})` : `Đã hủy gia hạn tự động (Hạn dùng đến ${slotExpDate || 'cuối tháng'})`)}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.45 }}>
                          {lang === 'ja' ? '最大管理者権限' : (lang === 'en' ? 'Max Admin Quota' : 'Quyền quản trị tối đa')} <b>{myMaxUsers} {lang === 'ja' ? 'メンバー' : (lang === 'en' ? 'members' : 'tài khoản thành viên')}</b> ({lang === 'ja' ? '基本10ユーザー' : (lang === 'en' ? 'Default: 10 base users' : 'Mặc định: 10 user base')}{extraSlotCount > 0 ? ` + ${extraSlotCount} ${lang === 'ja' ? 'アップグレード' : (lang === 'en' ? 'upgraded slots' : 'slot nâng cấp')} ${slotExpDate ? `· ${lang === 'ja' ? '有効期限' : (lang === 'en' ? 'Valid until' : 'Hạn dùng đến')} ${slotExpDate}` : ''}` : ''}).
                          {isCancelled
                            ? (lang === 'ja' ? ` ${slotExpDate || '請求期日'}まで${myMaxUsers}ユーザーを引き続き全機能でご利用いただけます。期日以降は基本10ユーザーに戻ります。` : (lang === 'en' ? ` You can continue to use all ${myMaxUsers} users until ${slotExpDate || 'due date'}. After this, quota resets to 10 users.` : ` Bạn vẫn được sử dụng đầy đủ ${myMaxUsers} User cho đến hết ngày ${slotExpDate || 'hạn thanh toán'}. Sau ngày này, hạn ngạch mới trả về 10 User mặc định.`))
                            : (lang === 'ja' ? ' メンバーはフルデータパックを自動継承します。' : (lang === 'en' ? ' Members automatically inherit Full Data Pack.' : ' Các thành viên tự động kế thừa Full Data Pack.'))}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right', paddingRight: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: isFullQuota ? '#ef4444' : '#10b981' }}>
                          👥 {regCount} / {myMaxUsers} {lang === 'ja' ? 'メンバー' : (lang === 'en' ? 'Members' : 'Thành Viên')}
                        </div>
                        {isFullQuota && (
                          <span style={{ fontSize: 10.5, color: '#ef4444', fontWeight: 800, background: '#fef2f2', padding: '2px 8px', borderRadius: 6, border: '1px solid #fca5a5', display: 'inline-block', marginTop: 3 }}>
                            ⚠️ {lang === 'ja' ? `上限到達 (${myMaxUsers})` : (lang === 'en' ? `Limit Reached (${myMaxUsers})` : `Đã đạt giới hạn (${myMaxUsers})`)}
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
                        ➕ {lang === 'ja' ? 'スロット追加購入 (+10名/50k)' : (lang === 'en' ? 'Buy Extra Slots (+10 Users / 50k)' : 'Mua Thêm Slot (+10 User / 50k)')}
                      </button>

                      {extraSlotCount > 0 && !isCancelled && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm({
                            type: 'cancel_extra_slots',
                            title: tUI('ui.huy-gia-han-mua-them-slot-user'),
                            message: lang === 'ja' ? `ユーザースロット追加購入プラン（+50,000đ/月/10名）の自動更新をキャンセルしますか？${slotExpDate || '現請求期日'}まで${myMaxUsers}ユーザーを引き続きご利用いただけます。` : (lang === 'en' ? `Are you sure you want to cancel auto-renewal for extra slots (+50,000 VND/mo/10 users)? You will keep ${myMaxUsers} users until ${slotExpDate || 'due date'}.` : `Bạn có chắc chắn muốn hủy tự động gia hạn gói mua thêm slot (+50.000đ/tháng/10 user)? Bạn vẫn tiếp tục được sử dụng đầy đủ ${myMaxUsers} User cho tới hết ngày ${slotExpDate || 'hạn thanh toán hiện tại'}.`),
                            itemName: t('admin.orgNameItem', { name: userRegion }),
                            itemSub: lang === 'ja' ? `現在の割当: ${myMaxUsers}名 (${slotExpDate || '期日'}まで維持)` : (lang === 'en' ? `Current quota: ${myMaxUsers} Users (Maintained until ${slotExpDate || 'due date'})` : `Hạn ngạch hiện tại: ${myMaxUsers} User (Vẫn giữ nguyên sử dụng tới hết ${slotExpDate || 'hạn dùng'})`),
                            confirmText: lang === 'ja' ? '解約を確定' : (lang === 'en' ? 'Confirm Cancellation' : 'Xác Nhận Hủy Gia Hạn'),
                          })}
                          style={{
                            padding: '8px 12px', borderRadius: 10, fontSize: 11.5, fontWeight: 700,
                            background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                            border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease',
                          }}
                          title={tUI('ui.huy-tu-dong-tinh-tien-gia-han-cho-cac-thang-tiep')}
                        >
                          ❌ {lang === 'ja' ? '追加登録をキャンセル' : (lang === 'en' ? 'Cancel Add-on' : 'Hủy Đăng Ký Mua Thêm')}
                        </button>
                      )}

                      {isCancelled && (
                        <button
                          type="button"
                          onClick={() => {
                            localStorage.removeItem(`bis_slot_cancelled_${uKey}`);
                            setUsers(prev => prev.map(u => (u.email === user?.email || u.id === user?.id) ? { ...u, slot_cancelled: false } : u));
                            showAlert('success', '⚡ Đã khôi phục gia hạn tự động mua thêm slot thành công!');
                          }}
                          style={{
                            padding: '8px 12px', borderRadius: 10, fontSize: 11.5, fontWeight: 700,
                            background: 'rgba(16,185,129,0.1)', color: '#10b981',
                            border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease',
                          }}
                          title={tUI('ui.bat-lai-tinh-nang-tu-dong-gia-han-hang-thang')}
                        >
                          🔄 {lang === 'ja' ? '自動更新を復元' : (lang === 'en' ? 'Restore Auto-renewal' : 'Khôi Phục Gia Hạn Tự Động')}
                        </button>
                      )}
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
                  {lang === 'ja' ? '新規ユーザーアカウント作成' : (lang === 'en' ? 'Create New User Account' : 'Tạo Tài Khoản Người Dùng Mới')}
                </div>

                <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, alignItems: 'end' }}>
                  <div>
                    <label className="form-label">{tUI('ui.email-tai-khoan')}</label>
                    <input className="form-input" type="email" placeholder="user@ckjvn.vn" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                  </div>
                  <div>
                    <label className="form-label">{tUI('ui.mat-khau-khoi-tao')}</label>
                    <input className="form-input" type="password" placeholder="••••••••" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                  </div>
                  <div>
                    <label className="form-label">{tUI('ui.ho-va-ten-hien-thi')}</label>
                    <input className="form-input" placeholder={tUI('ui.nguyen-van-a')} value={newUser.display_name} onChange={e => setNewUser({ ...newUser, display_name: e.target.value })} />
                  </div>

                  <div>
                    <label className="form-label">{tUI('ui.phan-quyen-vai-tro')}</label>
                    <select
                      className="form-input"
                      value={newUser.role}
                      disabled={isRegionalAdmin}
                      onChange={e => {
                        const newRole = e.target.value;
                        if (newRole === 'user') {
                          setNewUser({ ...newUser, role: 'user', organization_id: null, region: newUser.region || 'Toàn quốc' });
                        } else if (newRole === 'staff') {
                          const firstOrg = organizations[0];
                          setNewUser({
                            ...newUser,
                            role: 'staff',
                            organization_id: newUser.organization_id || (firstOrg ? firstOrg.id : null),
                            region: newUser.organization_id ? newUser.region : (firstOrg ? firstOrg.name : newUser.region),
                          });
                        } else {
                          setNewUser({ ...newUser, role: newRole });
                        }
                      }}
                    >
                      {isSuperAdmin && <option value="super_admin">{tUI('ui.super-admin-quan-tri-toi-cao')}</option>}
                      {isSuperAdmin && <option value="admin">{tUI('ui.admin-phan-vung')}</option>}
                      <option value="staff">{tUI('ui.nhan-vien-staff')}</option>
                      <option value="user">{tUI('ui.nguoi-dung-user')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">{tUI('ui.phan-vung-hoat-dong')}</label>
                    {isAddingNewRegion ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          className="form-input"
                          placeholder={tUI('ui.nhap-ten-phan-vung-moi')}
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
                          title={tUI('ui.xac-nhan')}
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
                          title={tUI('ui.huy')}
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
                              role: newUser.role === 'user' ? 'staff' : newUser.role,
                              region: selectedOrg ? selectedOrg.name : newUser.region,
                            });
                          } else if (val === '__add_new__') {
                            setIsAddingNewRegion(true);
                            setNewCustomRegionInput('');
                          } else {
                            setNewUser({
                              ...newUser,
                              organization_id: null,
                              role: newUser.role === 'staff' ? 'user' : newUser.role,
                              region: val,
                            });
                          }
                        }}
                      >
                        {organizations.length > 0 && (
                          <optgroup label={lang === 'ja' ? '🏢 正式な組織' : (lang === 'en' ? '🏢 Official Organizations' : '🏢 Tổ chức chính thức')}>
                            {organizations.map(o => (
                              <option key={`org_${o.id}`} value={`org_${o.id}`}>🏢 {formatOrgName(o.name, lang)}</option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label={lang === 'ja' ? '📍 デフォルト地域' : (lang === 'en' ? '📍 Default Geographic Regions' : '📍 Vùng địa lý mặc định')}>
                          {allRegions.map(r => (
                            <option key={r} value={r}>📍 {formatRegionName(r, lang)}</option>
                          ))}
                        </optgroup>
                        <option value="__add_new__">{tUI('ui.them-phan-vung-moi')}</option>
                      </select>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={actionLoading} style={{ gap: 6, height: 42, justifyContent: 'center' }}>
                    {actionLoading ? <Loader2 size={15} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Plus size={15} />}
                    {lang === 'ja' ? '新規アカウント作成' : (lang === 'en' ? 'Create New Account' : 'Tạo Tài Khoản Mới')}
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
                  <span>{lang === 'ja' ? `ユーザー一覧 (${users.length})` : (lang === 'en' ? `User List (${users.length})` : `Danh Sách Người Dùng (${users.length})`)}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{tUI('ui.tu-dong-cap-quyen-jwt')}</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 1080 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-surface-2)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                        <th style={{ padding: '12px 20px' }}>{tUI('ui.ho-amp-ten')}</th>
                        <th style={{ padding: '12px 20px' }}>Email</th>
                        <th style={{ padding: '12px 20px' }}>{tUI('ui.vai-tro')}</th>
                        <th style={{ padding: '12px 20px' }}>{tUI('ui.goi-du-lieu-amp-han-dung')}</th>
                        <th style={{ padding: '12px 20px' }}>{tUI('ui.theme-ui-so-huu')}</th>
                        <th style={{ padding: '12px 20px' }}>{tUI('ui.trang-thai')}</th>
                        <th style={{ padding: '12px 20px' }}>{tUI('ui.ngay-tao')}</th>
                        <th style={{ padding: '12px 20px', textAlign: 'right' }}>{tUI('ui.hanh-dong')}</th>
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
                                {formatDisplayName(u.display_name, lang) || u.email}
                                {isMe && (
                                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-600, #2563eb)', marginLeft: 6 }}>
                                    ({lang === 'ja' ? 'あなた' : (lang === 'en' ? 'you' : 'bạn')})
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{u.email}</td>
                          <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span style={{
                                fontSize: 10.5, fontWeight: 800, padding: '3px 10px', borderRadius: 20, width: 'fit-content',
                                background: u.role === 'super_admin' ? '#fef3c7' : u.role === 'admin' ? '#eff6ff' : u.role === 'staff' ? '#f0fdf4' : '#f1f5f9',
                                color: u.role === 'super_admin' ? '#92400e' : u.role === 'admin' ? '#1d4ed8' : u.role === 'staff' ? '#166534' : '#475569',
                                border: `1px solid ${u.role === 'super_admin' ? '#fde68a' : u.role === 'admin' ? '#bfdbfe' : u.role === 'staff' ? '#bbf7d0' : '#e2e8f0'}`,
                                display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                              }}>
                                {u.role === 'super_admin' ? ('👑 ' + t('role.superAdminShort')) : u.role === 'admin' ? ('🔰 ' + t('role.regionAdmin')) : u.role === 'staff' ? ('🧑‍💼 ' + t('role.staff')) : ('👤 ' + t('role.user'))}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {u.organization_id ? `🏢 ${formatOrgName(organizations.find(o => o.id === u.organization_id)?.name, lang) || u.region || tUI('ui.to-chuc')}` : `📍 ${u.region === 'Toàn quốc' || !u.region ? t('common.nationwide') : u.region}`}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: u.role === 'super_admin' || u.active_package === 'full' ? '#059669' : u.active_package === 'enterprise' || u.role === 'admin' ? '#9333ea' : u.active_package === 'combo2' || u.active_package === 'single' ? '#2563eb' : '#64748b', whiteSpace: 'nowrap' }}>
                                {formatUserPackage(u, lang)}
                                {u.has_ai && <span style={{ marginLeft: 6, color: '#9333ea', background: '#f3e8ff', padding: '1px 6px', borderRadius: 8, fontSize: 9.5, border: '1px solid #e9d5ff', whiteSpace: 'nowrap' }}>🤖 AI</span>}
                              </span>
                              <span style={{ fontSize: 10.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                📅 {formatUserExpiration(u.package_expiration, u.role, u.active_package, lang)}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 180 }}>
                              <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 6, background: '#f1f5f9', color: '#475569', whiteSpace: 'nowrap' }}>{tUI('ui.mac-dinh')}</span>
                              {(u.purchased_themes || []).map(tKey => (
                                <span key={tKey} style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 6px', borderRadius: 6, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', whiteSpace: 'nowrap' }}>
                                  {tKey === 'classic' ? 'Win98' : tKey === 'sapphire' ? 'Sapphire' : tKey === 'luxury' ? 'Luxury' : tKey === 'anime' ? 'Anime 🌸' : tKey}
                                </span>
                              ))}
                              {u.role === 'super_admin' && <span style={{ fontSize: 9.5, fontWeight: 800, color: '#b45309', background: '#fffbeb', padding: '1px 6px', borderRadius: 6, border: '1px solid #fde68a', whiteSpace: 'nowrap' }}>👑 All Themes</span>}
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              fontSize: 10.5, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                              background: isActive ? '#ecfdf5' : '#fef2f2',
                              color: isActive ? '#047857' : '#b91c1c',
                              border: `1px solid ${isActive ? '#a7f3d0' : '#fca5a5'}`,
                              display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                            }}>
                              {isActive ? (lang === 'ja' ? '🟢 有効' : lang === 'en' ? '🟢 ACTIVE' : '🟢 HOẠT ĐỘNG') : (lang === 'ja' ? '🔴 停止中' : lang === 'en' ? '🔴 LOCKED' : '🔴 ĐÃ KHÓA')}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '-'}
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setViewingUser(u)}
                                style={{ color: '#8b5cf6', padding: '6px 10px' }}
                                title={tUI('ui.xem-chi-tiet-tai-khoan')}
                              >
                                <Eye size={14} /> {lang === 'ja' ? '詳細' : (lang === 'en' ? 'Details' : 'Chi tiết')}
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleOpenEditUser(u)}
                                style={{ color: '#2563eb', padding: '6px 10px' }}
                                title={tUI('ui.chinh-sua-tai-khoan')}
                              >
                                <Edit size={14} /> {lang === 'ja' ? '編集' : (lang === 'en' ? 'Edit' : 'Sửa')}
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => {
                                  setResetPasswordUser(u);
                                  setResetPasswordMode('direct');
                                  setNewPasswordVal('');
                                  setCopiedPw(false);
                                }}
                                style={{ color: '#059669', padding: '6px 10px' }}
                                title={t('admin.resetPassword')}
                              >
                                <Key size={14} /> {t('admin.resetPassword')}
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleDeleteUser(u)}
                                style={{ color: '#ef4444', padding: '6px 10px' }}
                                title={tUI('ui.xoa-tai-khoan')}
                              >
                                <Trash2 size={14} /> {lang === 'ja' ? '削除' : (lang === 'en' ? 'Delete' : 'Xóa')}
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
            </div>
          )}

          {/* TAB: NHẬT KÝ ĐĂNG NHẬP (FR-08) */}
          {activeTab === 'logs' && (
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 20, padding: 24, boxShadow: '0 6px 24px rgba(0,0,0,0.03)',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <History size={18} style={{ color: '#6366f1' }} /> {t('admin.logsTitle')}
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
                    {t('admin.logsSubtitle')}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ position: 'relative', width: 260 }}>
                    <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      className="form-input"
                      placeholder={t('admin.logsSearch')}
                      value={loginLogsSearch}
                      onChange={e => setLoginLogsSearch(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          setLoginLogsPage(1);
                          loadLoginLogs(1, loginLogsSize, loginLogsSearch);
                        }
                      }}
                      style={{ paddingLeft: 36, height: 38, fontSize: 12.5 }}
                    />
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => loadLoginLogs(loginLogsPage, loginLogsSize, loginLogsSearch)}
                    disabled={loginLogsLoading}
                    style={{ height: 38, gap: 6, padding: '0 14px' }}
                    title={t('admin.logsRefresh')}
                  >
                    <RefreshCw size={14} className={loginLogsLoading ? 'spin' : ''} />
                    {t('admin.logsRefresh')}
                  </button>
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle, #f8fafc)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, letterSpacing: '0.5px' }}>
                      <th style={{ padding: '12px 16px' }}>#</th>
                      <th style={{ padding: '12px 16px' }}>{t('admin.logsThUser')}</th>
                      <th style={{ padding: '12px 16px' }}>{t('admin.logsThIp')}</th>
                      <th style={{ padding: '12px 16px' }}>{t('admin.logsThUserAgent')}</th>
                      <th style={{ padding: '12px 16px' }}>{t('admin.logsThTime')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginLogsLoading ? (
                      <tr>
                        <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                          <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                          <div>{lang === 'ja' ? '読み込み中...' : (lang === 'en' ? 'Loading logs...' : 'Đang tải nhật ký...')}</div>
                        </td>
                      </tr>
                    ) : loginLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                          {t('admin.logsEmpty')}
                        </td>
                      </tr>
                    ) : (
                      loginLogs.map((log, idx) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}>
                          <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
                            {(loginLogsPage - 1) * loginLogsSize + idx + 1}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{log.user_name || log.user_email}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{log.user_email}</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: '#2563eb' }}>
                            {log.ip || '—'}
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 12, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.user_agent}>
                            {log.user_agent || '—'}
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                            {log.created_at ? new Date(log.created_at).toLocaleString(lang === 'ja' ? 'ja-JP' : (lang === 'en' ? 'en-US' : 'vi-VN')) : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination bar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)', fontSize: 13, color: 'var(--text-muted)',
              }}>
                {/* Left: Per page dropdown & showing summary */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{t('admin.logsPerPage')}</span>
                  <select
                    className="form-input"
                    value={loginLogsSize}
                    onChange={e => {
                      const newSize = parseInt(e.target.value, 10);
                      setLoginLogsSize(newSize);
                      setLoginLogsPage(1);
                      loadLoginLogs(1, newSize, loginLogsSearch);
                    }}
                    style={{ width: 85, height: 34, padding: '4px 8px', fontSize: 12.5, borderRadius: 8 }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  {loginLogsTotal > 0 && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {t('admin.logsShowing', {
                        from: (loginLogsPage - 1) * loginLogsSize + 1,
                        to: Math.min(loginLogsPage * loginLogsSize, loginLogsTotal),
                        total: loginLogsTotal,
                      })}
                    </span>
                  )}
                </div>

                {/* Right: Page navigation */}
                {Math.ceil(loginLogsTotal / loginLogsSize) > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={loginLogsPage <= 1 || loginLogsLoading}
                      onClick={() => {
                        const newPage = Math.max(1, loginLogsPage - 1);
                        setLoginLogsPage(newPage);
                        loadLoginLogs(newPage, loginLogsSize, loginLogsSearch);
                      }}
                      style={{ height: 34, padding: '0 12px', borderRadius: 8, fontSize: 12 }}
                    >
                      {t('common.previous')}
                    </button>
                    <span style={{ fontSize: 12.5, fontWeight: 700, padding: '0 8px', color: 'var(--text-primary)' }}>
                      {loginLogsPage} / {Math.max(1, Math.ceil(loginLogsTotal / loginLogsSize))}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={loginLogsPage >= Math.ceil(loginLogsTotal / loginLogsSize) || loginLogsLoading}
                      onClick={() => {
                        const newPage = Math.min(Math.ceil(loginLogsTotal / loginLogsSize), loginLogsPage + 1);
                        setLoginLogsPage(newPage);
                        loadLoginLogs(newPage, loginLogsSize, loginLogsSearch);
                      }}
                      style={{ height: 34, padding: '0 12px', borderRadius: 8, fontSize: 12 }}
                    >
                      {t('common.next')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: TỔ CHỨC (super admin) — ADR-005 */}
          {activeTab === 'orgs' && (
            <OrganizationsPanel sources={sources} allUsers={users} onMessage={showAlert} onUserUpdated={loadData} />
          )}

          {/* TAB: PHÂN VÙNG CỦA TÔI (admin phân vùng: đổi tên + phạm vi dữ liệu) — ADR-005 */}
          {activeTab === 'myRegion' && (
            <MyRegionPanel sources={sources} onMessage={showAlert} onRegionRenamed={loadData} />
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
                  <ShieldAlert size={20} /> {lang === 'ja' ? 'ブラックリスト（除外キーワード）' : (lang === 'en' ? 'Blacklist (Blocked Keywords)' : 'Blacklist (Từ Khóa Cấm Quét)')}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                  {lang === 'ja' ? 'このリストのキーワードを含むニュースは収集時に自動的に除外されます。' : (lang === 'en' ? 'Articles containing keywords in this list will be skipped during crawl.' : 'Các tin tức chứa từ khóa trong danh sách này sẽ bị tự động bỏ qua khi crawl.')}
                </p>
                <form onSubmit={handleAddBlacklist} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input className="form-input" placeholder={tUI('ui.nhap-tu-khoa-cam')} value={newBlacklist} onChange={e => setNewBlacklist(e.target.value)} />
                  <button type="submit" className="btn btn-primary" style={{ gap: 4, padding: '0 16px' }}>
                    <Plus size={15} /> {lang === 'ja' ? '追加' : (lang === 'en' ? 'Add' : 'Thêm')}
                  </button>
                </form>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {blacklist.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tUI('ui.chua-co-tu-khoa-nao')}</span>
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
                          title: tUI('ui.xoa-tu-khoa-blacklist'),
                          message: lang === 'ja' ? 'この除外キーワードを削除してもよろしいですか？' : (lang === 'en' ? 'Are you sure you want to delete this blocked keyword?' : 'Bạn có chắc chắn muốn xóa từ khóa cấm này?'),
                          itemName: b.term
                        })} 
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#e11d48', padding: 0, fontSize: 14, lineHeight: 1 }}
                        title={tUI('ui.xoa-khoi-blacklist')}
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
                  <CheckCircle2 size={20} /> {lang === 'ja' ? 'ホワイトリスト（優先キーワード）' : (lang === 'en' ? 'Whitelist (Priority Keywords)' : 'Whitelist (Từ Khóa Ưu Tiên)')}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                  {lang === 'ja' ? '優先キーワードを含むニュースには重要フラグが付与され、上位に表示されます。' : (lang === 'en' ? 'Articles containing priority keywords will be flagged as important and pinned to the top.' : 'Các tin tức chứa từ khóa ưu tiên sẽ được gắn cờ mốc quan trọng và đưa lên đầu.')}
                </p>
                <form onSubmit={handleAddWhitelist} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input className="form-input" placeholder={tUI('ui.nhap-tu-khoa-uu-tien')} value={newWhitelist} onChange={e => setNewWhitelist(e.target.value)} />
                  <button type="submit" className="btn btn-primary" style={{ gap: 4, padding: '0 16px' }}>
                    <Plus size={15} /> {lang === 'ja' ? '追加' : (lang === 'en' ? 'Add' : 'Thêm')}
                  </button>
                </form>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {whitelist.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tUI('ui.chua-co-tu-khoa-nao')}</span>
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
                          title: tUI('ui.xoa-tu-khoa-whitelist'),
                          message: lang === 'ja' ? 'この優先キーワードを削除してもよろしいですか？' : (lang === 'en' ? 'Are you sure you want to delete this priority keyword?' : 'Bạn có chắc chắn muốn xóa từ khóa ưu tiên này?'),
                          itemName: w.term
                        })} 
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#047857', padding: 0, fontSize: 14, lineHeight: 1 }}
                        title={tUI('ui.xoa-khoi-whitelist')}
                      >×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <TrackedProjectsPanel onMessage={showAlert} />
          )}

          {/* TAB 4: DIGEST */}
          {activeTab === 'suggest' && (
            <KeywordSuggestionsPanel onMessage={showAlert} />
          )}

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
                {lang === 'ja' ? 'システム全体のデイリーダイジェスト送信' : (lang === 'en' ? 'Send System-wide Daily Email Digest' : 'Gửi Email Digest Hàng Ngày Toàn Hệ Thống')}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto 24px', lineHeight: 1.6 }}>
                {lang === 'ja' ? 'システムは各ユーザーの個人キーワードに一致する最新記事をすべてスキャンし、メールで自動配信します。' : (lang === 'en' ? 'The system scans all latest articles matching each user\'s personal keywords and sends an email digest.' : 'Hệ thống sẽ quét tất cả bài viết mới nhất khớp với bộ từ khóa cá nhân của từng người dùng và tự động gửi bản tin qua Email.')}
              </p>
              <button
                className="btn btn-primary"
                onClick={handleRunDigestAll}
                disabled={actionLoading}
                style={{ gap: 8, padding: '12px 28px', fontSize: 14, fontWeight: 800, borderRadius: 14 }}
              >
                {actionLoading ? <Loader2 size={16} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Mail size={16} />}
                {lang === 'ja' ? '今すぐメールダイジェストを送信' : (lang === 'en' ? 'Trigger Email Digest Now' : 'Kích Hoạt Gửi Email Digest Ngay')}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Edit User Modal ── */}
      {editingUser && createPortal(
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setEditingUser(null); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            width: '100vw', height: '100vh', boxSizing: 'border-box',
            background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000000, padding: 20,
          }}
        >
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 24, width: '100%', maxWidth: 640,
            boxShadow: '0 24px 60px rgba(0,0,0,0.35)', position: 'relative',
            animation: 'fadeIn 0.2s ease-out', margin: 'auto',
            maxHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 28px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <Edit size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    {lang === 'ja' ? 'ユーザーアカウント編集' : (lang === 'en' ? 'Edit User Account' : 'Chỉnh Sửa Tài Khoản Người Dùng')}
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tUI('ui.cap-nhat-phan-quyen-mat-khau-va-cai-dat-ca-nhan')}</span>
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
            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
              <div className="custom-modal-scroll" style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, alignContent: 'start' }}>
                <div>
                  <label className="form-label">{tUI('ui.email-tai-khoan')}</label>
                <input
                  className="form-input"
                  type="email"
                  value={editingUser.email}
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">{tUI('ui.ho-va-ten-hien-thi')}</label>
                <input
                  className="form-input"
                  type="text"
                  value={editingUser.display_name}
                  onChange={e => setEditingUser({ ...editingUser, display_name: e.target.value })}
                  placeholder={tUI('ui.ho-va-ten')}
                />
              </div>

              <div>
                <label className="form-label">{tUI('ui.phan-quyen-vai-tro')}</label>
                <select
                  className="form-input"
                  value={editingUser.role || 'user'}
                  disabled={isRegionalAdmin}
                  onChange={e => {
                    const newRole = e.target.value;
                    if (newRole === 'user') {
                      setEditingUser({ ...editingUser, role: 'user', organization_id: null, region: editingUser.region || 'Toàn quốc' });
                    } else if (newRole === 'staff') {
                      const firstOrg = organizations[0];
                      setEditingUser({
                        ...editingUser,
                        role: 'staff',
                        organization_id: editingUser.organization_id || (firstOrg ? firstOrg.id : null),
                        region: editingUser.organization_id ? editingUser.region : (firstOrg ? firstOrg.name : editingUser.region),
                      });
                    } else {
                      setEditingUser({ ...editingUser, role: newRole });
                    }
                  }}
                >
                  {(isSuperAdmin || editingUser.role === 'super_admin') && (
                    <option value="super_admin">{tUI('ui.super-admin-quan-tri-toi-cao')}</option>
                  )}
                  {(isSuperAdmin || editingUser.role === 'admin') && (
                    <option value="admin">{tUI('ui.admin-phan-vung')}</option>
                  )}
                  <option value="staff">{tUI('ui.nhan-vien-staff')}</option>
                  <option value="user">{tUI('ui.nguoi-dung-user')}</option>
                  {/* Tài khoản đăng nhập Google mang vai trò 'personal'. Không liệt kê thì
                      ô chọn hiện trống và mọi lần lưu đều gửi lại một vai trò không có
                      trong danh sách. */}
                  {editingUser.role === 'personal' && (
                    <option value="personal">{tUI('admin.rolePersonal')}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="form-label">{tUI('ui.phan-vung-hoat-dong')}</label>
                {isAddingEditRegion ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      className="form-input"
                      placeholder={tUI('ui.nhap-ten-phan-vung-moi')}
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
                      title={tUI('ui.xac-nhan')}
                      style={{ padding: '0 10px', color: '#10b981', fontWeight: 800 }}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setIsAddingEditRegion(false)}
                      title={tUI('ui.huy')}
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
                          role: editingUser.role === 'user' ? 'staff' : editingUser.role,
                          region: selectedOrg ? selectedOrg.name : editingUser.region,
                        });
                      } else if (val === '__add_new__') {
                        setIsAddingEditRegion(true);
                      } else {
                        setEditingUser({
                          ...editingUser,
                          organization_id: null,
                          role: editingUser.role === 'staff' ? 'user' : editingUser.role,
                          region: val,
                        });
                      }
                    }}
                  >
                    {organizations.length > 0 && (
                      <optgroup label={lang === 'ja' ? '🏢 正式な組織' : (lang === 'en' ? '🏢 Official Organizations' : '🏢 Tổ chức chính thức')}>
                        {organizations.map(o => (
                          <option key={`org_${o.id}`} value={`org_${o.id}`}>🏢 {formatOrgName(o.name, lang)}</option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label={lang === 'ja' ? '📍 デフォルト地域' : (lang === 'en' ? '📍 Default Geographic Regions' : '📍 Vùng địa lý mặc định')}>
                      {allRegions.map(r => (
                        <option key={r} value={r}>📍 {formatRegionName(r, lang)}</option>
                      ))}
                    </optgroup>
                    <option value="__add_new__">{tUI('ui.them-phan-vung-moi')}</option>
                  </select>
                )}
              </div>

              <div>
                <label className="form-label">{tUI('ui.trang-thai-tai-khoan')}</label>
                <select
                  className="form-input"
                  value={editingUser.is_active ? 'true' : 'false'}
                  onChange={e => setEditingUser({ ...editingUser, is_active: e.target.value === 'true' })}
                >
                  <option value="true">{tUI('ui.hoat-dong')}</option>
                  <option value="false">{tUI('ui.da-khoa-tai-khoan')}</option>
                </select>
              </div>

              {/* Granular Staff Permissions Section */}
              <div style={{ gridColumn: 'span 2', background: 'var(--bg-surface-2)', padding: 16, borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
                <label className="form-label" style={{ marginBottom: 10, fontWeight: 800, display: 'block', color: 'var(--text-primary)' }}>
                  🔑 {lang === 'ja' ? 'ユーザーモジュールアクセス権限' : (lang === 'en' ? 'User Module Permissions' : 'Phân Quyền Mô-đun Xem/Sử Dụng Cho Người Dùng')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12.5 }}>
                  {[
                    { key: 'can_view_press', label: tUI('ui.xem-tin-bao-chi') },
                    { key: 'can_view_dashboard', label: lang === 'ja' ? '📊 ダッシュボード統計を見る' : (lang === 'en' ? '📊 View Analytics Dashboard' : '📊 Xem Dashboard Thống Kê') },
                    { key: 'can_view_bidding', label: tUI('ui.xem-goi-thau-gov') },
                    { key: 'can_view_oda', label: tUI('ui.xem-du-an-oda-wb') },
                    { key: 'can_manage_keywords', label: tUI('ui.dang-ky-tu-khoa-loc') },
                    { key: 'can_export_data', label: tUI('ui.xuat-bao-cao-data') },
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
                    <span>{tUI('ui.quan-ly-goi-dich-vu-amp-ui-themes-da-cap')}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                    <div>
                      <label className="form-label">{tUI('ui.goi-nguon-du-lieu')}</label>
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
                        <option value="free">{tUI('ui.bao-chi-mien-phi')}</option>
                        <option value="single">{tUI('ui.mua-le-1-nguon-du-lieu')}</option>
                        <option value="combo2">{tUI('ui.combo-2-nguon-du-lieu')}</option>
                        <option value="full">{tUI('ui.full-data-pack-tron-bo-3-nguon')}</option>
                        <option value="enterprise">{tUI('ui.goi-enterprise-full-data-quan-tri-10-user')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{tUI('ui.han-su-dung-goi')}</span>
                      </label>
                      <input
                        className="form-input"
                        value={editingUser.package_expiration || ''}
                        onChange={e => setEditingUser({ ...editingUser, package_expiration: e.target.value })}
                        placeholder={tUI('ui.vd-07-08-2026-07-09-2026-hoac-vinh-vien')}
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
                          ⚡ {lang === 'ja' ? '1ヶ月' : (lang === 'en' ? '1 Month' : '1 Tháng')}
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
                          📅 {lang === 'ja' ? '1年' : (lang === 'en' ? '1 Year' : '1 Năm')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingUser({ ...editingUser, package_expiration: 'Vĩnh viễn' })}
                          style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                        >
                          ♾️ {lang === 'ja' ? '無期限' : (lang === 'en' ? 'Permanent' : 'Vĩnh viễn')}
                        </button>
                      </div>
                    </div>

                    {/* Single Source Selection Sub-panel */}
                    {editingUser.active_package === 'single' && (
                      <div style={{ gridColumn: 'span 2', background: 'rgba(59, 130, 246, 0.08)', padding: 12, borderRadius: 12, border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                        <label className="form-label" style={{ fontWeight: 800, color: '#2563eb', marginBottom: 8, display: 'block' }}>
                          🎯 {lang === 'ja' ? 'ユーザーに付与するデータソースを1つ選択:' : (lang === 'en' ? 'Select 1 Data Source Granted to User:' : 'Chọn 1 Nguồn Dữ Liệu Được Cấp Quyền Cho User:')}
                        </label>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                          {[
                            { key: 'adb', label: tUI('ui.du-an-adb-chau-a') },
                            { key: 'worldbank', label: tUI('ui.du-an-world-bank') },
                            { key: 'gov', label: tUI('ui.thong-bao-dau-thau-cong') },
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
                            ⚡ {lang === 'ja' ? 'コンボ2プランのデータソースを2つ選択:' : (lang === 'en' ? 'Select 2 Data Sources in Combo 2:' : 'Chọn 2 Nguồn Dữ Liệu Trong Gói Combo 2:')}
                          </label>
                          <span style={{ fontSize: 11, fontWeight: 800, color: (editingUser.selected_sources || []).length === 2 ? '#10b981' : '#f59e0b' }}>
                            {(editingUser.selected_sources || []).length === 2 ? tUI('ui.da-chon-2-2-nguon') : `${tUI('ui.vui-long-chon-2-nguon')} (${(editingUser.selected_sources || []).length}/2)`}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                          {[
                            { key: 'adb', label: tUI('ui.du-an-adb-chau-a') },
                            { key: 'worldbank', label: tUI('ui.du-an-world-bank') },
                            { key: 'gov', label: tUI('ui.thong-bao-dau-thau-cong') },
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
                          {t('admin.orgUserQuota')}
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input
                            type="number"
                            step={10}
                            min={10}
                            max={500}
                            className="form-input"
                            style={{ width: 140, fontWeight: 800, fontSize: 15, color: '#9333ea' }}
                            value={editingUser.max_users || 10}
                            onChange={e => setEditingUser({ ...editingUser, max_users: Math.max(10, parseInt(e.target.value, 10) || 10) })}
                          />
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {lang === 'ja' ? 'メンバー (デフォルト: 10名。+10名ごと月額50,000đ、月額管理)' : lang === 'en' ? 'members (Default: 10 users. Each +10 slots is 50,000 VND/month)' : 'thành viên (Mặc định: 10 user. Mỗi +10 user nâng cấp là 50.000đ/tháng, quản lý theo tháng).'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(37, 99, 235, 0.05)', padding: 12, borderRadius: 12, border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#2563eb' }}>
                        <input
                          type="checkbox"
                          checked={editingUser.can_view_dashboard === true || (editingUser.can_view_dashboard === undefined && (editingUser.active_package === 'full' || editingUser.active_package === 'enterprise'))}
                          onChange={e => setEditingUser({
                            ...editingUser,
                            can_view_dashboard: e.target.checked,
                            permissions: {
                              ...(editingUser.permissions || {}),
                              can_view_dashboard: e.target.checked,
                            }
                          })}
                          style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                        />
                        📊 {lang === 'ja' ? 'ダッシュボード分析の閲覧を許可（総合レポート＆統計）' : (lang === 'en' ? 'Allow viewing Dashboard Analytics (Comprehensive reports & stats)' : 'Cho phép xem Dashboard Analytics (Báo cáo & Thống kê tổng hợp)')}
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#9333ea' }}>
                        <input
                          type="checkbox"
                          checked={editingUser.has_ai === true}
                          onChange={e => setEditingUser({ ...editingUser, has_ai: e.target.checked })}
                          style={{ width: 16, height: 16, accentColor: '#a855f7' }}
                        />
                        🤖 {lang === 'ja' ? 'AI Gemini 2.0 アシスタントを有効化（24時間対応）' : (lang === 'en' ? 'Activate AI Gemini 2.0 Assistant (24/7 Q&A)' : 'Kích hoạt Trợ Lý AI Gemini 2.0 (Hỏi-đáp 24/7)')}
                      </label>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="form-label" style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
                        🎨 {lang === 'ja' ? 'ユーザーに解放/付与されたUIテーマパッケージ:' : (lang === 'en' ? 'Unlocked UI Theme Packages for User:' : 'Các Gói Theme UI Đã Mở Khóa / Cấp Quyền Cho User:')}
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
                <label className="form-label">{tUI('ui.mat-khau-moi-dat-lai-mat-khau')}</label>
                <input
                  className="form-input"
                  type="password"
                  value={editingUser.password}
                  onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                  placeholder={tUI('ui.de-trong-neu-khong-muon-doi-mat-khau-mat-khau-ca')}
                />
              </div>

              <div>
                <label className="form-label">{tUI('ui.ban-tin-email-digest')}</label>
                <select
                  className="form-input"
                  value={editingUser.email_digest_enabled ? 'true' : 'false'}
                  onChange={e => setEditingUser({ ...editingUser, email_digest_enabled: e.target.value === 'true' })}
                >
                  <option value="true">{tUI('ui.bat-nhan-email-digest')}</option>
                  <option value="false">{tUI('ui.tat-email-digest')}</option>
                </select>
              </div>

              <div>
                <label className="form-label">{tUI('ui.gio-nhan-digest-0-23h')}</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  max={23}
                  value={editingUser.digest_hour}
                  onChange={e => setEditingUser({ ...editingUser, digest_hour: e.target.value })}
                />
              </div>

              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 28px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditingUser(null)}
                  style={{ padding: '10px 20px', borderRadius: 12 }}
                >
                  {lang === 'ja' ? 'キャンセル' : (lang === 'en' ? 'Cancel' : 'Hủy bỏ')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                  style={{ padding: '10px 24px', borderRadius: 12, gap: 8, fontWeight: 800 }}
                >
                  {actionLoading ? <Loader2 size={16} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Check size={16} />}
                  {lang === 'ja' ? '変更を保存' : (lang === 'en' ? 'Save Changes' : 'Lưu Thay Đổi')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── User Details Modal (Super Admin View) ── */}
      {viewingUser && createPortal(
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setViewingUser(null); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            width: '100vw', height: '100vh', boxSizing: 'border-box',
            background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000000, padding: 20,
          }}
        >
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 24, width: '100%', maxWidth: 640,
            boxShadow: '0 24px 60px rgba(0,0,0,0.35)', position: 'relative',
            maxHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column',
            overflow: 'hidden', animation: 'fadeIn 0.2s ease-out', margin: 'auto',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 28px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: viewingUser.role === 'admin' || viewingUser.role === 'super_admin' ? 'linear-gradient(135deg, #f59e0b, #ec4899)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 900, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}>
                  {(formatDisplayName(viewingUser.display_name, lang) || viewingUser.email).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {formatDisplayName(viewingUser.display_name, lang) || viewingUser.email}
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

            {/* Modal Body */}
            <div className="custom-modal-scroll" style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
              {/* Badges Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              <span style={{
                fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20,
                background: viewingUser.role === 'super_admin' ? '#fef3c7' : viewingUser.role === 'admin' ? '#eff6ff' : viewingUser.role === 'staff' ? '#f0fdf4' : '#f1f5f9',
                color: viewingUser.role === 'super_admin' ? '#92400e' : viewingUser.role === 'admin' ? '#1d4ed8' : viewingUser.role === 'staff' ? '#166534' : '#475569',
                border: `1px solid ${viewingUser.role === 'super_admin' ? '#fde68a' : viewingUser.role === 'admin' ? '#bfdbfe' : viewingUser.role === 'staff' ? '#bbf7d0' : '#e2e8f0'}`,
                whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                {viewingUser.role === 'super_admin' ? ('👑 ' + t('role.superAdminShort')) : viewingUser.role === 'admin' ? ('🔰 ' + t('role.regionAdmin')) : viewingUser.role === 'staff' ? ('🧑‍💼 ' + t('role.staff')) : ('👤 ' + t('role.user'))}
              </span>

              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
                {viewingUser.organization_id ? `🏢 ${formatOrgName(organizations.find(o => o.id === viewingUser.organization_id)?.name, lang) || viewingUser.region || tUI('ui.to-chuc')}` : `📍 ${viewingUser.region === 'Toàn quốc' || !viewingUser.region ? t('common.nationwide') : viewingUser.region}`}
              </span>

              <span style={{
                fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20,
                background: viewingUser.is_active !== false ? '#ecfdf5' : '#fef2f2',
                color: viewingUser.is_active !== false ? '#047857' : '#b91c1c',
                border: `1px solid ${viewingUser.is_active !== false ? '#a7f3d0' : '#fca5a5'}`,
                whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                {viewingUser.is_active !== false ? ('🟢 ' + t('common.active')) : ('🔴 ' + t('common.locked'))}
              </span>
            </div>

            {/* Grid Info Sections */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {/* Section 1: Gói Dữ Liệu & Hạn Dùng */}
              <div style={{ background: 'var(--bg-surface-2)', padding: 16, borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
                  ⚡ {lang === 'ja' ? 'データプラン＆有効期限' : (lang === 'en' ? 'DATA PLAN & VALIDITY' : 'GÓI DỮ LIỆU & HẠN DÙNG')}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: viewingUser.role === 'super_admin' || viewingUser.active_package === 'full' ? '#10b981' : viewingUser.active_package === 'enterprise' || viewingUser.role === 'admin' ? '#9333ea' : viewingUser.active_package === 'combo2' || viewingUser.active_package === 'single' ? '#3b82f6' : 'var(--text-primary)' }}>
                  {formatUserPackage(viewingUser, lang)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{tUI('ui.han-dung')}</span>
                  <b style={{ color: 'var(--text-primary)' }}>
                    {formatUserExpiration(viewingUser.package_expiration, viewingUser.role, viewingUser.active_package, lang)}
                  </b>
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: viewingUser.can_view_dashboard ? '#eff6ff' : 'var(--bg-surface)', color: viewingUser.can_view_dashboard ? '#2563eb' : 'var(--text-muted)', border: `1px solid ${viewingUser.can_view_dashboard ? '#bfdbfe' : 'var(--border-subtle)'}` }}>
                    📊 Dashboard: {viewingUser.can_view_dashboard ? (lang === 'ja' ? '閲覧許可' : (lang === 'en' ? 'Allowed' : 'Được phép xem')) : (lang === 'ja' ? '権限なし' : (lang === 'en' ? 'No Access' : 'Không có quyền'))}
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: viewingUser.has_ai ? '#f3e8ff' : 'var(--bg-surface)', color: viewingUser.has_ai ? '#9333ea' : 'var(--text-muted)', border: `1px solid ${viewingUser.has_ai ? '#e9d5ff' : 'var(--border-subtle)'}` }}>
                    🤖 AI Gemini: {viewingUser.has_ai ? (lang === 'ja' ? '有効化済' : (lang === 'en' ? 'Active' : 'Đã kích hoạt')) : (lang === 'ja' ? '未登録' : (lang === 'en' ? 'Not Registered' : 'Chưa đăng ký'))}
                  </div>
                </div>
              </div>

              {/* Section 2: Gói Theme UI Sở Hữu */}
              <div style={{ background: 'var(--bg-surface-2)', padding: 16, borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
                  🎨 {lang === 'ja' ? '所有UIテーマパッケージ' : (lang === 'en' ? 'UNLOCKED UI THEMES' : 'GÓI THEME UI ĐÃ MỞ KHÓA')}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>
                    {lang === 'ja' ? 'デフォルト' : (lang === 'en' ? 'Default' : 'Mặc định')}
                  </span>
                  {(viewingUser.purchased_themes || []).map(tKey => (
                    <span key={tKey} style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                      {tKey === 'classic' ? 'Win98 Retro' : tKey === 'sapphire' ? 'Royal Sapphire' : tKey === 'luxury' ? 'Bloomberg Luxury' : tKey === 'anime' ? 'Anime Sakura 🌸' : tKey}
                    </span>
                  ))}
                  {viewingUser.role === 'super_admin' && (
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                      {lang === 'ja' ? '👑 全テーマ (Super Admin)' : (lang === 'en' ? '👑 All Themes (Super Admin)' : '👑 Trọn bộ Theme (Super Admin)')}
                    </span>
                  )}
                </div>
              </div>

              {/* Section 3: Granular Permissions */}
              <div style={{ gridColumn: 'span 2', background: 'var(--bg-surface-2)', padding: 16, borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 }}>
                  🔑 {lang === 'ja' ? 'モジュールアクセス権限' : (lang === 'en' ? 'MODULE ACCESS PERMISSIONS' : 'PHÂN QUYỀN TRUY CẬP MÔ-ĐUN')}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 12 }}>
                  {[
                    { key: 'can_view_press', label: tUI('ui.xem-tin-bao-chi') },
                    { key: 'can_view_bidding', label: tUI('ui.xem-goi-thau-gov') },
                    { key: 'can_view_oda', label: tUI('ui.xem-du-an-oda-wb') },
                    { key: 'can_manage_keywords', label: tUI('ui.dang-ky-tu-khoa-loc') },
                    { key: 'can_export_data', label: tUI('ui.xuat-bao-cao-data') },
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
                  <b>{viewingUser.email_digest_enabled ? (lang === 'ja' ? `📧 有効 (${viewingUser.digest_hour ?? 7}時)` : lang === 'en' ? `📧 Enabled (${viewingUser.digest_hour ?? 7}:00)` : `📧 Đã bật (${viewingUser.digest_hour ?? 7}h)`) : (lang === 'ja' ? '🔕 無効' : lang === 'en' ? '🔕 Disabled' : '🔕 Tắt')}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>{tUI('ui.ngay-tao-2')} </span>
                  <b>{viewingUser.created_at ? new Date(viewingUser.created_at).toLocaleDateString('vi-VN') : '-'}</b>
                </div>
              </div>
            </div>

            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 28px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', flexShrink: 0 }}>
              <button
                onClick={() => {
                  const uToEdit = viewingUser;
                  setViewingUser(null);
                  handleOpenEditUser(uToEdit);
                }}
                className="btn btn-primary"
                style={{ padding: '10px 20px', borderRadius: 12, gap: 6, fontWeight: 800 }}
              >
                <Edit size={15} /> {lang === 'ja' ? 'このアカウントを編集' : (lang === 'en' ? 'Edit This Account' : 'Chỉnh Sửa Tài Khoản Này')}
              </button>
              <button
                onClick={() => setViewingUser(null)}
                className="btn btn-ghost"
                style={{ padding: '10px 20px', borderRadius: 12 }}
              >{lang === 'ja' ? '閉じる' : (lang === 'en' ? 'Close' : 'Đóng')}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Reset Password Modal (FR-08) ── */}
      {resetPasswordUser && createPortal(
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setResetPasswordUser(null); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            width: '100vw', height: '100vh', boxSizing: 'border-box',
            background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000000, padding: 20,
          }}
        >
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 24, width: '100%', maxWidth: 520,
            boxShadow: '0 24px 60px rgba(0,0,0,0.35)', position: 'relative',
            maxHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column',
            overflow: 'hidden', animation: 'fadeIn 0.2s ease-out', margin: 'auto',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}>
                  <Key size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {t('admin.resetPasswordTitle')}
                  </h3>
                  <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                    {resetPasswordUser.display_name} ({resetPasswordUser.email})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setResetPasswordUser(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 6, borderRadius: 8 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleExecuteResetPassword} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                {t('admin.resetPasswordDesc')}
              </p>

              {/* Mode Switcher */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'var(--bg-subtle, #f1f5f9)', padding: 4, borderRadius: 12 }}>
                <button
                  type="button"
                  onClick={() => setResetPasswordMode('direct')}
                  style={{
                    padding: '8px 12px', borderRadius: 9, fontSize: 12.5, fontWeight: 700,
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    background: resetPasswordMode === 'direct' ? 'white' : 'transparent',
                    color: resetPasswordMode === 'direct' ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: resetPasswordMode === 'direct' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  🔑 {t('admin.resetModeDirect')}
                </button>
                <button
                  type="button"
                  onClick={() => setResetPasswordMode('email')}
                  style={{
                    padding: '8px 12px', borderRadius: 9, fontSize: 12.5, fontWeight: 700,
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    background: resetPasswordMode === 'email' ? 'white' : 'transparent',
                    color: resetPasswordMode === 'email' ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: resetPasswordMode === 'email' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  ✉️ {t('admin.resetModeEmail')}
                </button>
              </div>

              {resetPasswordMode === 'direct' ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="form-label" style={{ margin: 0 }}>{lang === 'ja' ? '新しいパスワード' : (lang === 'en' ? 'New Password' : 'Mật khẩu mới')}</label>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={handleGeneratePassword}
                      style={{ fontSize: 11.5, color: '#2563eb', padding: '2px 8px', gap: 4 }}
                    >
                      <Sparkles size={13} /> {t('admin.generateRandomPassword')}
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={newPasswordVal}
                      onChange={e => setNewPasswordVal(e.target.value)}
                      placeholder={t('admin.newPasswordPlaceholder')}
                      style={{ fontFamily: 'monospace', fontSize: 13, paddingRight: 40 }}
                    />
                    {newPasswordVal && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(newPasswordVal);
                          setCopiedPw(true);
                          setTimeout(() => setCopiedPw(false), 2000);
                        }}
                        style={{
                          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', color: copiedPw ? '#10b981' : 'var(--text-muted)',
                          padding: 4,
                        }}
                        title={t('admin.copiedPassword')}
                      >
                        {copiedPw ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    )}
                  </div>
                  {copiedPw && (
                    <span style={{ fontSize: 11.5, color: '#10b981', marginTop: 4, display: 'inline-block' }}>
                      {t('admin.copiedPassword')}
                    </span>
                  )}
                </div>
              ) : (
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <div>{t('admin.sendEmailNotice')}</div>
                  <strong style={{ color: '#4f46e5', display: 'block', marginTop: 4 }}>{resetPasswordUser.email}</strong>
                </div>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setResetPasswordUser(null)}
                  style={{ padding: '8px 16px', borderRadius: 10 }}
                >
                  {lang === 'ja' ? 'キャンセル' : (lang === 'en' ? 'Cancel' : 'Hủy')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={resetPasswordLoading}
                  style={{ padding: '8px 20px', borderRadius: 10, gap: 6, fontWeight: 700 }}
                >
                  {resetPasswordLoading ? <Loader2 size={15} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Key size={15} />}
                  {t('admin.btnConfirmReset')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Edit Source Modal ── */}
      {editingSource && createPortal(
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setEditingSource(null); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            width: '100vw', height: '100vh', boxSizing: 'border-box',
            background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000000, padding: 20,
          }}
        >
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 24, width: '100%', maxWidth: 560,
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)', position: 'relative',
            maxHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column',
            overflow: 'hidden', animation: 'fadeIn 0.2s ease-out', margin: 'auto',
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 28px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <Edit size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    {lang === 'ja' ? '収集ソース編集' : (lang === 'en' ? 'Edit Crawl Source' : 'Chỉnh Sửa Nguồn Crawl Dữ Liệu')}
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {isSuperAdmin ? (lang === 'ja' ? '収集ソースの設定を直接更新' : (lang === 'en' ? 'Directly update crawl source configuration' : 'Cập nhật cấu hình nguồn crawl trực tiếp')) : (lang === 'ja' ? 'ソースを編集（Super Adminの再承認が必要）' : (lang === 'en' ? 'Edit source (requires Super Admin re-approval)' : 'Chỉnh sửa nguồn (cần Super Admin duyệt lại)'))}
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
            <form onSubmit={handleUpdateSource} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
              <div className="custom-modal-scroll" style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, alignContent: 'start' }}>
                <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">{tUI('ui.ten-nguon-tin')}</label>
                <input
                  className="form-input"
                  value={editingSource.name}
                  onChange={e => setEditingSource({ ...editingSource, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">{tUI('ui.loai-nguon')}</label>
                <select
                  className="form-input"
                  value={editingSource.source_type}
                  onChange={e => setEditingSource({ ...editingSource, source_type: e.target.value })}
                >
                  <option value="press">{tUI('ui.bao-chi-press')}</option>
                  <option value="gov">{tUI('ui.dau-thau-gov')}</option>
                </select>
              </div>

              <div>
                <label className="form-label">{tUI('ui.phuong-thuc-crawl')}</label>
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
                <label className="form-label">{tUI('ui.duong-dan-url-rss-endpoint')}</label>
                <input
                  className="form-input"
                  value={editingSource.url}
                  onChange={e => setEditingSource({ ...editingSource, url: e.target.value })}
                  required
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">{tUI('ui.phan-vung-ap-dung')}</label>
                {isAddingSourceEditRegion ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      className="form-input"
                      placeholder={tUI('ui.nhap-ten-phan-vung-moi')}
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
                      title={tUI('ui.xac-nhan')}
                      style={{ padding: '0 10px', color: '#10b981', fontWeight: 800 }}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setIsAddingSourceEditRegion(false)}
                      title={tUI('ui.huy')}
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
                      <option key={r} value={r}>📍 {formatRegionName(r, lang)}</option>
                    ))}
                    <option value="__add_new__">{tUI('ui.them-phan-vung-moi')}</option>
                  </select>
                )}
              </div>

              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 28px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditingSource(null)}
                  style={{ padding: '10px 20px', borderRadius: 12 }}
                >
                  {lang === 'ja' ? 'キャンセル' : (lang === 'en' ? 'Cancel' : 'Hủy bỏ')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                  style={{ padding: '10px 24px', borderRadius: 12, gap: 8, fontWeight: 800 }}
                >
                  {actionLoading ? <Loader2 size={16} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Check size={16} />}
                  {isSuperAdmin ? tUI('ui.luu-thay-doi') : tUI('ui.gui-de-xuat-cap-nhat')}
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
        title={deleteConfirm?.title || (lang === 'ja' ? '削除の確認' : (lang === 'en' ? 'Confirm Delete' : 'Xác Nhận Xóa'))}
        message={deleteConfirm?.message || ''}
        itemName={deleteConfirm?.itemName || ''}
        itemSub={deleteConfirm?.itemSub || ''}
        confirmText={deleteConfirm?.confirmText || (lang === 'ja' ? '削除を確認' : (lang === 'en' ? 'Confirm Delete' : 'Xác Nhận Xóa'))}
        cancelText={deleteConfirm?.cancelText || (lang === 'ja' ? 'キャンセル' : (lang === 'en' ? 'Cancel' : 'Hủy Bỏ'))}
        type={deleteConfirm?.type === 'cancel_extra_slots' ? 'warning' : (deleteConfirm?.modalType || 'danger')}
        loading={actionLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirm(null)}
      />

      {/* BUY SLOT MODAL FOR REGIONAL ADMIN */}
      {showBuySlotModal && createPortal(
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowBuySlotModal(false); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            width: '100vw', height: '100vh', boxSizing: 'border-box',
            background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000000, padding: 20,
          }}
        >
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 24, width: '100%', maxWidth: 540,
            boxShadow: '0 24px 60px rgba(0,0,0,0.35)', position: 'relative',
            maxHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column',
            overflow: 'hidden', animation: 'fadeIn 0.2s ease-out', margin: 'auto',
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 28px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ padding: 10, borderRadius: 12, background: '#f3e8ff', color: '#9333ea' }}>
                  <Zap size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    {lang === 'ja' ? 'ユーザースロット追加アップグレード' : (lang === 'en' ? 'Upgrade Additional User Slots' : 'Nâng Cấp Mua Thêm Slot User')}
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {lang === 'ja' ? `${userRegion}のメンバー規模を拡張（月額管理）` : (lang === 'en' ? `Expand member quota for ${userRegion} (Monthly billing)` : `Mở rộng quy mô thành viên cho ${userRegion} (Quản lý đăng ký theo tháng)`)}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowBuySlotModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={e => {
                e.preventDefault();
                setSlotSubmitting(true);
                setTimeout(() => {
                  const uKey = user?.email || user?.id || 'default';
                  const currentMax = user?.max_users || parseInt(localStorage.getItem(`bis_max_users_${uKey}`) || '10', 10);
                  const newMax = currentMax + selectedSlotPackage;
                  const expDate = new Date();
                  expDate.setMonth(expDate.getMonth() + selectedSlotMonths);
                  const expDateStr = expDate.toLocaleDateString('vi-VN');

                  localStorage.setItem(`bis_max_users_${uKey}`, String(newMax));
                  localStorage.setItem(`bis_slot_exp_${uKey}`, expDateStr);
                  localStorage.setItem(`bis_slot_months_${uKey}`, String(selectedSlotMonths));
                  localStorage.setItem(`bis_extra_slots_${uKey}`, String((parseInt(localStorage.getItem(`bis_extra_slots_${uKey}`) || '0', 10)) + selectedSlotPackage));

                  setUsers(prev => prev.map(u => (u.email === user?.email || u.id === user?.id) ? { ...u, max_users: newMax } : u));
                  setSlotSubmitting(false);
                  setShowBuySlotModal(false);
                  showAlert('success', lang === 'ja' ? `⚡ +${selectedSlotPackage}スロット (${selectedSlotMonths}ヶ月) のアップグレードが完了しました！新割当: ${newMax}名。` : (lang === 'en' ? `⚡ Successfully upgraded +${selectedSlotPackage} slots (${selectedSlotMonths} months)! New quota: ${newMax} Users.` : `⚡ Đã nâng cấp mua thêm +${selectedSlotPackage} slot thành viên (${selectedSlotMonths} tháng) thành công! Hạn ngạch mới: ${newMax} User.`));
                }, 1200);
              }}
              style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}
            >
              {/* Modal Content Scroll */}
              <div className="custom-modal-scroll" style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
                {/* 1. Chọn Số Lượng Slot Mua Thêm */}
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ fontWeight: 800, fontSize: 12, color: '#9333ea', marginBottom: 8, display: 'block' }}>
                    📦 {lang === 'ja' ? '追加購入するユーザースロット数を選択:' : (lang === 'en' ? 'SELECT EXTRA USER SLOTS TO PURCHASE:' : 'CHỌN SỐ LƯỢNG SLOT USER MUA THÊM:')}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {[
                      { count: 10, label: '+10 User Slot', priceStr: lang === 'ja' ? '50,000đ/月' : (lang === 'en' ? '50,000 VND/mo' : '50.000đ/tháng') },
                      { count: 20, label: '+20 User Slot', priceStr: lang === 'ja' ? '100,000đ/月' : (lang === 'en' ? '100,000 VND/mo' : '100.000đ/tháng') },
                      { count: 30, label: '+30 User Slot', priceStr: lang === 'ja' ? '150,000đ/月' : (lang === 'en' ? '150,000 VND/mo' : '150.000đ/tháng') },
                      { count: 50, label: '+50 User Slot', priceStr: lang === 'ja' ? '250,000đ/月' : (lang === 'en' ? '250,000 VND/mo' : '250.000đ/tháng') },
                    ].map(opt => {
                      const isSelected = selectedSlotPackage === opt.count;
                      return (
                        <button
                          key={opt.count}
                          type="button"
                          onClick={() => setSelectedSlotPackage(opt.count)}
                          style={{
                            padding: '10px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                            border: isSelected ? '2px solid #9333ea' : '1px solid var(--border-subtle)',
                            background: isSelected ? 'rgba(147, 51, 234, 0.1)' : 'var(--bg-surface-2)',
                            color: isSelected ? '#9333ea' : 'var(--text-primary)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: 13 }}>{opt.label}</div>
                          <div style={{ fontSize: 11, color: isSelected ? '#7e22ce' : 'var(--text-muted)', marginTop: 2 }}>{opt.priceStr}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Chọn Thời Gian Mua Theo Tháng */}
                <div style={{ marginBottom: 20 }}>
                  <label className="form-label" style={{ fontWeight: 800, fontSize: 12, color: '#9333ea', marginBottom: 8, display: 'block' }}>
                    ⏳ {lang === 'ja' ? '利用契約期間（月単位）を選択:' : (lang === 'en' ? 'SELECT SUBSCRIPTION DURATION (MONTHS):' : 'CHỌN THỜI GIAN THUÊ SỬ DỤNG (THEO THÁNG):')}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[
                      { months: 1, label: tUI('ui.1-thang'), tag: lang === 'ja' ? '標準' : (lang === 'en' ? 'Standard' : 'Tiêu chuẩn') },
                      { months: 3, label: tUI('ui.3-thang'), tag: lang === 'ja' ? '5% OFF' : (lang === 'en' ? '5% Off' : 'Giảm 5%') },
                      { months: 6, label: tUI('ui.6-thang'), tag: lang === 'ja' ? '10% OFF' : (lang === 'en' ? '10% Off' : 'Giảm 10%') },
                      { months: 12, label: tUI('ui.12-thang'), tag: lang === 'ja' ? '20% OFF' : (lang === 'en' ? '20% Off' : 'Giảm 20%') },
                    ].map(mOpt => {
                      const isSelected = selectedSlotMonths === mOpt.months;
                      return (
                        <button
                          key={mOpt.months}
                          type="button"
                          onClick={() => setSelectedSlotMonths(mOpt.months)}
                          style={{
                            padding: '8px 6px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                            border: isSelected ? '2px solid #9333ea' : '1px solid var(--border-subtle)',
                            background: isSelected ? 'rgba(147, 51, 234, 0.12)' : 'var(--bg-surface-2)',
                            color: isSelected ? '#9333ea' : 'var(--text-primary)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: 12 }}>{mOpt.label}</div>
                          <div style={{ fontSize: 9.5, color: isSelected ? '#7e22ce' : '#10b981', marginTop: 2, fontWeight: 700 }}>{mOpt.tag}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Calculation summary */}
                {(() => {
                  const uKey = user?.email || user?.id || 'default';
                  const currentMax = user?.max_users || parseInt(localStorage.getItem(`bis_max_users_${uKey}`) || '10', 10);
                  const newMax = currentMax + selectedSlotPackage;
                  const slotMultiplier = selectedSlotPackage / 10;
                  const discountFactor = selectedSlotMonths === 12 ? 0.8 : selectedSlotMonths === 6 ? 0.9 : selectedSlotMonths === 3 ? 0.95 : 1.0;
                  const monthlyPrice = Math.round(50000 * slotMultiplier * discountFactor);
                  const totalPrice = monthlyPrice * selectedSlotMonths;

                  return (
                    <div style={{ background: 'linear-gradient(135deg, rgba(147,51,234,0.06), rgba(37,99,235,0.06))', padding: 16, borderRadius: 16, border: '1px solid rgba(147,51,234,0.2)', marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12.5 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{tUI('ui.goi-bo-sung-chon')}</span>
                        <span style={{ fontWeight: 800, color: '#9333ea' }}>➕ {selectedSlotPackage} {lang === 'ja' ? 'スロット' : 'Slot User'} ({selectedSlotMonths} {lang === 'ja' ? 'ヶ月' : (lang === 'en' ? 'months' : 'tháng')})</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12.5 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{tUI('ui.han-ngach-sau-nang-cap')}</span>
                        <b style={{ color: '#10b981' }}>{currentMax} ➔ {newMax} User</b>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-subtle)', paddingTop: 10, marginTop: 8 }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 700 }}>{lang === 'ja' ? `お支払い合計金額 (${selectedSlotMonths}ヶ月):` : (lang === 'en' ? `Total Payment (${selectedSlotMonths} months):` : `Tổng tiền thanh toán (${selectedSlotMonths} tháng):`)}</span>
                        <span style={{ fontWeight: 900, color: '#9333ea', fontSize: 18 }}>{totalPrice.toLocaleString(lang === 'ja' ? 'ja-JP' : (lang === 'en' ? 'en-US' : 'vi-VN'))}đ</span>
                      </div>
                    </div>
                  );
                })()}

                <div style={{ marginBottom: 20 }}>
                  <label className="form-label">{tUI('ui.so-dien-thoai-zalo-lien-he-xac-nhan')}</label>
                  <input
                    className="form-input"
                    type="tel"
                    placeholder="0912 xxx xxx"
                    value={slotPhone}
                    onChange={e => setSlotPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 28px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', flexShrink: 0 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowBuySlotModal(false)}>
                  {lang === 'ja' ? 'キャンセル' : (lang === 'en' ? 'Cancel' : 'Hủy Bỏ')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={slotSubmitting} style={{ background: 'linear-gradient(135deg, #9333ea, #7e22ce)', border: 'none', padding: '10px 20px', borderRadius: 12, fontWeight: 800 }}>
                  {slotSubmitting ? (lang === 'ja' ? '処理中...' : (lang === 'en' ? 'Processing...' : 'Đang Xử Lý...')) : (lang === 'ja' ? `登録を確定 (${(Math.round(50000 * (selectedSlotPackage/10) * (selectedSlotMonths === 12 ? 0.8 : selectedSlotMonths === 6 ? 0.9 : selectedSlotMonths === 3 ? 0.95 : 1.0)) * selectedSlotMonths).toLocaleString('ja-JP')}đ)` : (lang === 'en' ? `Confirm Subscription (${(Math.round(50000 * (selectedSlotPackage/10) * (selectedSlotMonths === 12 ? 0.8 : selectedSlotMonths === 6 ? 0.9 : selectedSlotMonths === 3 ? 0.95 : 1.0)) * selectedSlotMonths).toLocaleString('en-US')} VND)` : `Xác Nhận Đăng Ký (${(Math.round(50000 * (selectedSlotPackage/10) * (selectedSlotMonths === 12 ? 0.8 : selectedSlotMonths === 6 ? 0.9 : selectedSlotMonths === 3 ? 0.95 : 1.0)) * selectedSlotMonths).toLocaleString('vi-VN')}đ)`))}
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
