// src/components/WorldBankView.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Globe, Building2, ShoppingBag, Search, Filter, RotateCcw, ArrowUpDown, ChevronUp, ChevronDown,
  Bookmark, BookmarkCheck, ExternalLink, Download, LayoutGrid, List,
  DollarSign, Layers, CheckCircle2, AlertCircle, RefreshCw, X, ChevronLeft, ChevronRight, FileText
} from 'lucide-react';
import { worldBankService } from '../services/worldbank';
import { odaService } from '../services/oda';

const DEFAULT_PAGE_SIZE = 20;

const CONFIG_MAP = {
  worldbank: {
    title: 'World Bank Projects & Operations',
    subtitle: 'Quản lý, tìm kiếm và tra cứu dữ liệu dự án Ngân hàng Thế giới (World Bank) toàn cầu',
    icon: Globe,
    brandColor: '#10b981',
    bannerBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.05))',
    bannerBorder: '1px solid rgba(16, 185, 129, 0.2)',
    exportBtnBg: 'linear-gradient(135deg, #10b981, #047857)',
    savedKey: 'saved_worldbank_projects',
    entityLabel: 'dự án',
    orgLabel: 'Quốc Gia',
    amountLabel: 'Cam Kết (USD)',
    date1Label: 'Ngày Phê Duyệt',
    date2Label: 'Cập Nhật Cuối',
    stageLabel: 'Giai Đoạn Cuối',
    headers: [
      { key: 'bookmark', display: 'Lưu', sortable: false, width: '60px' },
      { key: 'project_name', display: 'Tên Dự Án (Project Title)', sortable: true },
      { key: 'countryshortname', display: 'Quốc Gia', sortable: true, width: '130px' },
      { key: 'id', display: 'Mã Dự Án (ID)', sortable: true, width: '110px' },
      { key: 'totalCommitmentAmount', display: 'Cam Kết (USD)', sortable: true, width: '150px' },
      { key: 'projectstatusdisplay', display: 'Trạng Thái', sortable: true, width: '120px' },
      { key: 'boardapprovaldate', display: 'Ngày Phê Duyệt', sortable: true, width: '130px' },
      { key: 'proj_last_upd_date', display: 'Cập Nhật Cuối', sortable: true, width: '130px' },
      { key: 'last_stage_reached_name', display: 'Giai Đoạn Cuối', sortable: true, width: '150px' },
    ],
    // Trang project-detail WB bị 403 (WB chặn hotlink direct) → forward sang WB search theo id.
    getUrl: (id) => `https://www.worldbank.org/en/search?q=${encodeURIComponent(id)}`,
  },
  adb: {
    title: 'ADB Projects & Operations',
    subtitle: 'Quản lý, tìm kiếm và tra cứu dữ liệu dự án Ngân hàng Phát triển Châu Á (ADB)',
    icon: Building2,
    brandColor: '#f59e0b',
    bannerBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(217, 119, 6, 0.05))',
    bannerBorder: '1px solid rgba(245, 158, 11, 0.2)',
    exportBtnBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
    savedKey: 'saved_adb_projects',
    entityLabel: 'dự án',
    orgLabel: 'Quốc Gia / Khu Vực',
    amountLabel: 'Cam Kết (USD)',
    date1Label: 'Ngày Phê Duyệt',
    date2Label: 'Cập Nhật Cuối',
    stageLabel: 'Giai Đoạn / Lĩnh Vực',
    headers: [
      { key: 'bookmark', display: 'Lưu', sortable: false, width: '60px' },
      { key: 'project_name', display: 'Tên Dự Án (ADB Project)', sortable: true },
      { key: 'countryshortname', display: 'Quốc Gia', sortable: true, width: '140px' },
      { key: 'id', display: 'Mã Dự Án (ID)', sortable: true, width: '110px' },
      { key: 'totalCommitmentAmount', display: 'Cam Kết (USD)', sortable: true, width: '150px' },
      { key: 'projectstatusdisplay', display: 'Trạng Thái', sortable: true, width: '120px' },
      { key: 'boardapprovaldate', display: 'Ngày Phê Duyệt', sortable: true, width: '130px' },
      { key: 'proj_last_upd_date', display: 'Cập Nhật Cuối', sortable: true, width: '130px' },
      { key: 'last_stage_reached_name', display: 'Lĩnh Vực / Giai Đoạn', sortable: true, width: '150px' },
    ],
    getUrl: (id) => `https://www.adb.org/projects?searchstax[query]=${encodeURIComponent(id)}`,
  },
  procurement: {
    title: 'Mua Sắm Công & Đấu Thầu Quốc Gia',
    subtitle: 'Quản lý, tìm kiếm và tra cứu thông báo mời thầu (TBMT) và kế hoạch lựa chọn nhà thầu (KHLCNT)',
    icon: ShoppingBag,
    brandColor: '#8b5cf6',
    bannerBg: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(124, 58, 237, 0.05))',
    bannerBorder: '1px solid rgba(139, 92, 246, 0.2)',
    exportBtnBg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    savedKey: 'saved_procurement_items',
    entityLabel: 'mục thầu',
    orgLabel: 'Bên Mời Thầu',
    amountLabel: 'Gói Thầu',
    date1Label: 'Ngày Đăng Tải',
    date2Label: 'Hạn Đóng Thầu',
    stageLabel: 'Phân Loại',
    headers: [
      { key: 'bookmark', display: 'Lưu', sortable: false, width: '60px' },
      { key: 'project_name', display: 'Tên Thông Báo / Kế Hoạch', sortable: true },
      { key: 'countryshortname', display: 'Bên Mời Thầu', sortable: true, width: '170px' },
      { key: 'id', display: 'Mã TBMT/KHLCNT', sortable: true, width: '130px' },
      { key: 'totalCommitmentAmount', display: 'Gói Thầu', sortable: true, width: '110px' },
      { key: 'projectstatusdisplay', display: 'Trạng Thái', sortable: true, width: '120px' },
      { key: 'boardapprovaldate', display: 'Ngày Đăng Tải', sortable: true, width: '140px' },
      { key: 'proj_last_upd_date', display: 'Đóng Thầu', sortable: true, width: '140px' },
      { key: 'last_stage_reached_name', display: 'Phân Loại / Lĩnh Vực', sortable: true, width: '160px' },
    ],
    getUrl: (id) => `https://dauthau.asia/tim-kiem/?q=${encodeURIComponent(id)}`,
  },
};

export default function WorldBankView({ type = 'worldbank', kind = null }) {
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const normType = (type === 'gov' || type === 'dauthau') ? 'procurement' : type;
  const config = CONFIG_MAP[normType] || CONFIG_MAP.worldbank;
  const HeaderIcon = config.icon;

  // Tiêu đề riêng khi tách TBMT / KHLCNT thành 2 trang (dùng chung component procurement).
  const pageTitle = kind === 'notice' ? 'Thông Báo Mời Thầu (TBMT)'
    : kind === 'plan' ? 'Kế Hoạch Lựa Chọn Nhà Thầu (KHLCNT)'
    : config.title;
  const pageSubtitle = kind
    ? `Tra cứu ${kind === 'notice' ? 'thông báo mời thầu (TBMT)' : 'kế hoạch lựa chọn nhà thầu (KHLCNT)'} — bấm mã để mở trang chi tiết trên Hệ thống mạng đấu thầu quốc gia`
    : config.subtitle;

  // === STATE ===
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [toastMessage, setToastMessage] = useState(null);

  // Pagination & Sort
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState('boardapprovaldate');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filters
  const [searchInput, setSearchInput] = useState(initialQ);
  const [searchTerm, setSearchTerm] = useState(initialQ);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedStages, setSelectedStages] = useState([]);
  const [approvalDateFrom, setApprovalDateFrom] = useState('');
  const [approvalDateTo, setApprovalDateTo] = useState('');
  const [updatedDateFrom, setUpdatedDateFrom] = useState('');
  const [updatedDateTo, setUpdatedDateTo] = useState('');
  const [onlySaved, setOnlySaved] = useState(false);

  // Dropdown open states
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Show Toast
  const showToast = (msg, toastType = 'info') => {
    setToastMessage({ msg, type: toastType });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper for saved items in localStorage
  const getSavedProjects = useCallback(() => {
    try {
      const raw = localStorage.getItem(config.savedKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, [config.savedKey]);

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data = [];
      if (normType === 'worldbank') {
        data = await worldBankService.fetchProjects();
      } else if (normType === 'adb') {
        const res = await odaService.getProjects({ source: 'adb', size: 5000 });
        const items = res?.items || [];
        data = items.map((p) => {
          const totalAmt = p.amount_usd || (typeof p.amount === 'string' ? parseFloat(p.amount.replace(/[^0-9.]/g, '')) : p.amount) || 0;
          return {
            id: p.external_id || String(p.id),
            project_name: p.title_vi ? `${p.title} (${p.title_vi})` : (p.title || 'N/A'),
            countryshortname: p.country || 'N/A',
            totalamt: totalAmt,
            totalCommitmentAmount: totalAmt,
            projectstatusdisplay: p.status || 'Active',
            boardapprovaldate: p.approval_date || null,
            proj_last_upd_date: p.last_updated_date || null,
            last_stage_reached_name: p.last_stage || p.sector || 'N/A',
            ai_summary: p.ai_summary || null,
            // id RSS ≠ project-number ADB → không dựng được URL /projects/{number}/main.
            // Không có link gốc thì forward sang TÌM KIẾM ADB theo tên dự án (không 404).
            rawUrl: p.url || `https://www.adb.org/projects?searchstax[query]=${encodeURIComponent(p.title || p.external_id || p.id)}`,
          };
        });
      } else if (normType === 'procurement') {
        const res = await odaService.getProcurement({ size: 5000, ...(kind ? { kind } : {}) });
        const items = res?.items || [];
        data = items.map((p) => {
          const pkgCount = p.package_count || 0;
          return {
            id: p.id,
            project_name: p.title || 'N/A',
            countryshortname: p.procuring_entity || 'Việt Nam',
            totalamt: pkgCount,
            totalCommitmentAmount: pkgCount,
            projectstatusdisplay: p.status || 'Đang đăng tải',
            boardapprovaldate: p.publish_date || null,
            proj_last_upd_date: p.close_date || null,
            last_stage_reached_name: p.kind === 'notice' ? 'TBMT (Mời thầu)' : 'KHLCNT (Kế hoạch)',
            sector: p.sector || 'Chưa phân loại',
            ai_summary: null,
            rawUrl: p.url || `https://dauthau.asia/tim-kiem/?q=${encodeURIComponent(p.id)}`,
          };
        });
      }
      setAllProjects(data);

      const savedList = getSavedProjects();
      setSavedIds(new Set(savedList.map((p) => p.id)));
    } catch (err) {
      console.error(`${normType} load error:`, err);
      setError(err.message || `Không thể tải dữ liệu ${config.title}`);
    } finally {
      setLoading(false);
    }
  }, [normType, config, getSavedProjects, kind]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Save / Bookmark Toggle
  const handleToggleSave = (project, e) => {
    if (e) e.stopPropagation();
    const saved = getSavedProjects();
    const existsIndex = saved.findIndex((p) => p.id === project.id);
    let updated;
    let isSavedNow;

    if (existsIndex >= 0) {
      updated = saved.filter((p) => p.id !== project.id);
      isSavedNow = false;
    } else {
      updated = [
        ...saved,
        {
          id: project.id,
          project_name: project.project_name,
          countryshortname: project.countryshortname,
          totalCommitmentAmount: project.totalCommitmentAmount,
          projectstatusdisplay: project.projectstatusdisplay,
          boardapprovaldate: project.boardapprovaldate,
          proj_last_upd_date: project.proj_last_upd_date,
          last_stage_reached_name: project.last_stage_reached_name,
          rawUrl: project.rawUrl || config.getUrl(project.id),
          saved_at: new Date().toISOString(),
        },
      ];
      isSavedNow = true;
    }

    localStorage.setItem(config.savedKey, JSON.stringify(updated));

    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isSavedNow) next.add(project.id);
      else next.delete(project.id);
      return next;
    });

    showToast(
      isSavedNow
        ? `Đã lưu ${config.entityLabel} "${project.project_name?.slice(0, 30)}..."`
        : `Đã bỏ lưu ${config.entityLabel} "${project.id}"`,
      isSavedNow ? 'success' : 'info'
    );
  };

  // Extract unique lists for filters
  const uniqueCountries = useMemo(() => {
    return [...new Set(allProjects.map((p) => p.countryshortname).filter(Boolean))].sort();
  }, [allProjects]);

  const uniqueStatuses = useMemo(() => {
    return [...new Set(allProjects.map((p) => p.projectstatusdisplay).filter(Boolean))].sort();
  }, [allProjects]);

  const uniqueStages = useMemo(() => {
    return [...new Set(allProjects.map((p) => p.last_stage_reached_name).filter(Boolean))].sort();
  }, [allProjects]);

  // Filtering Logic
  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const appFrom = approvalDateFrom ? new Date(approvalDateFrom).getTime() : 0;
    const appTo = approvalDateTo ? new Date(approvalDateTo).setHours(23, 59, 59, 999) : Infinity;
    const updFrom = updatedDateFrom ? new Date(updatedDateFrom).getTime() : 0;
    const updTo = updatedDateTo ? new Date(updatedDateTo).setHours(23, 59, 59, 999) : Infinity;

    return allProjects.filter((p) => {
      if (onlySaved && !savedIds.has(p.id)) return false;

      if (term) {
        const titleMatch = p.project_name?.toLowerCase().includes(term);
        const idMatch = p.id?.toLowerCase().includes(term);
        const countryMatch = p.countryshortname?.toLowerCase().includes(term);
        if (!titleMatch && !idMatch && !countryMatch) return false;
      }

      if (selectedCountries.length > 0 && !selectedCountries.includes(p.countryshortname)) {
        return false;
      }
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(p.projectstatusdisplay)) {
        return false;
      }
      if (selectedStages.length > 0 && !selectedStages.includes(p.last_stage_reached_name)) {
        return false;
      }

      if (p.boardapprovaldate) {
        const appTime = new Date(p.boardapprovaldate).getTime();
        if (appTime < appFrom || appTime > appTo) return false;
      } else if (approvalDateFrom || approvalDateTo) {
        return false;
      }

      if (p.proj_last_upd_date) {
        const updTime = new Date(p.proj_last_upd_date).getTime();
        if (updTime < updFrom || updTime > updTo) return false;
      } else if (updatedDateFrom || updatedDateTo) {
        return false;
      }

      return true;
    });
  }, [
    allProjects, searchTerm, selectedCountries, selectedStatuses, selectedStages,
    approvalDateFrom, approvalDateTo, updatedDateFrom, updatedDateTo, onlySaved, savedIds,
  ]);

  // Sorting Logic
  const sortedProjects = useMemo(() => {
    const list = [...filteredProjects];
    list.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (valA == null) valA = '';
      if (valB == null) valB = '';

      if (sortBy === 'totalCommitmentAmount') {
        const numA = Number(valA) || 0;
        const numB = Number(valB) || 0;
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }

      if (sortBy.includes('date')) {
        const dateA = valA ? new Date(valA).getTime() : 0;
        const dateB = valB ? new Date(valB).getTime() : 0;
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      const comp = strA.localeCompare(strB);
      return sortOrder === 'asc' ? comp : -comp;
    });
    return list;
  }, [filteredProjects, sortBy, sortOrder]);

  // Paginated Items
  const totalFiltered = sortedProjects.length;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedProjects.slice(start, start + pageSize);
  }, [sortedProjects, currentPage, pageSize]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm, selectedCountries, selectedStatuses, selectedStages,
    approvalDateFrom, approvalDateTo, updatedDateFrom, updatedDateTo, onlySaved, pageSize,
  ]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setSelectedCountries([]);
    setSelectedStatuses([]);
    setSelectedStages([]);
    setApprovalDateFrom('');
    setApprovalDateTo('');
    setUpdatedDateFrom('');
    setUpdatedDateTo('');
    setOnlySaved(false);
    setSortBy('boardapprovaldate');
    setSortOrder('desc');
    showToast('Đã xóa tất cả bộ lọc', 'info');
  };

  // Calculate Key Summary Statistics
  const stats = useMemo(() => {
    const totalCommitmentUSD = filteredProjects.reduce(
      (sum, p) => sum + (p.totalCommitmentAmount || 0), 0
    );
    const orgCount = new Set(filteredProjects.map((p) => p.countryshortname).filter(Boolean)).size;

    return {
      totalProjects: filteredProjects.length,
      totalCommitmentUSD,
      orgCount,
      savedCount: savedIds.size,
    };
  }, [filteredProjects, savedIds]);

  // Formatters
  const formatAmountDisplay = (amount) => {
    if (normType === 'procurement') {
      if (!amount || amount <= 0) return 'Thông báo';
      return `${amount} gói thầu`;
    }
    if (!amount || amount <= 0) return 'N/A';
    if (amount >= 1e9) {
      return `$${(amount / 1e9).toFixed(2)} B`;
    }
    if (amount >= 1e6) {
      return `$${(amount / 1e6).toFixed(1)} M`;
    }
    return `$${amount.toLocaleString('en-US')}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('active') || s.includes('approved') || s.includes('đang') || s.includes('mời thầu')) {
      return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', label: status || 'Active' };
    }
    if (s.includes('closed') || s.includes('completed') || s.includes('đóng')) {
      return { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb', label: status || 'Closed' };
    }
    if (s.includes('pipeline') || s.includes('concept') || s.includes('proposed') || s.includes('kế hoạch')) {
      return { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: status || 'Pipeline' };
    }
    return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', label: status || 'N/A' };
  };

  // Refresh
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      showToast(`Đang làm mới dữ liệu ${config.title}...`, 'info');
      if (normType === 'worldbank') {
        await worldBankService.crawlProjects(500);
      }
      await loadData();
      showToast(`Đã làm mới dữ liệu thành công!`, 'success');
    } catch (err) {
      console.error(`${normType} refresh error:`, err);
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredProjects.length === 0) {
      showToast('Không có dữ liệu để xuất CSV', 'warning');
      return;
    }

    const headers = [
      'ID', 'Name / Title', config.orgLabel, config.amountLabel,
      'Status', config.date1Label, config.date2Label, config.stageLabel, 'URL',
    ];

    const csvRows = [
      headers.join(','),
      ...filteredProjects.map((p) => {
        const itemUrl = p.rawUrl || config.getUrl(p.id);
        const row = [
          `"${p.id}"`,
          `"${(p.project_name || '').replace(/"/g, '""')}"`,
          `"${(p.countryshortname || '').replace(/"/g, '""')}"`,
          `"${p.totalCommitmentAmount || 0}"`,
          `"${p.projectstatusdisplay || ''}"`,
          `"${p.boardapprovaldate || ''}"`,
          `"${p.proj_last_upd_date || ''}"`,
          `"${p.last_stage_reached_name || ''}"`,
          `"${itemUrl}"`,
        ];
        return row.join(',');
      }),
    ];

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${normType.toUpperCase()}_Projects_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Đã xuất ${filteredProjects.length} ${config.entityLabel} ra tệp CSV`, 'success');
  };

  return (
    <div className="wb-container" style={{ width: '100%', height: 'calc(100vh - 128px)', maxHeight: 'calc(100vh - 128px)', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            padding: '12px 20px', borderRadius: 12,
            background: toastMessage.type === 'success' ? '#10b981' : toastMessage.type === 'warning' ? '#f59e0b' : '#3b82f6',
            color: 'white', fontWeight: 600, fontSize: 13,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <CheckCircle2 size={16} />
          {toastMessage.msg}
        </div>
      )}

      {/* Header Banner */}
      <div
        className="animate-stagger-1"
        style={{
          flex: '0 0 auto',
          background: config.bannerBg,
          border: config.bannerBorder,
          borderRadius: 14,
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: config.brandColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 12px ${config.brandColor}44`,
            }}
          >
            <HeaderIcon size={18} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {pageTitle}
            </h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              {pageSubtitle}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleRefresh}
            disabled={loading}
            style={{ gap: 6, display: 'flex', alignItems: 'center', fontSize: 12, padding: '4px 10px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm Mới Dữ Liệu
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleExportCSV}
            style={{ gap: 6, display: 'flex', alignItems: 'center', background: config.exportBtnBg, border: 'none', fontSize: 12, padding: '4px 10px' }}
          >
            <Download size={14} />
            Xuất Excel / CSV
          </button>
        </div>
      </div>

      {/* 2-COLUMN LAYOUT: Sidebar (Filters + Stats) | Main Content (Table) */}
      <div className="wb-layout" style={{ display: 'flex', gap: 14, flex: '1 1 0%', minHeight: 0, overflow: 'hidden' }}>

        {/* LEFT SIDEBAR FILTERS */}
        <aside className="wb-sidebar animate-stagger-2" style={{ flex: '0 0 300px', width: 300, display: 'flex', flexDirection: 'column', gap: 10, height: '100%', overflowY: 'auto', paddingRight: 2 }}>

          {/* Compact Stats Box */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 14,
              padding: 12,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>TỔNG {config.entityLabel.toUpperCase()}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>{stats.totalProjects.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{config.orgLabel.toUpperCase()}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: config.brandColor }}>{stats.orgCount}</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                {normType === 'procurement' ? (
                  <FileText size={11} color={config.brandColor} />
                ) : (
                  <DollarSign size={11} color={config.brandColor} />
                )}
                TỔNG {config.amountLabel.toUpperCase()}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: config.brandColor }}>{formatAmountDisplay(stats.totalCommitmentUSD)}</div>
            </div>
          </div>

          {/* Sidebar Filter Box */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 14,
              padding: 14,
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Filter size={14} color={config.brandColor} />
                Bộ Lọc Dữ Liệu
              </div>
              <button
                className="btn btn-ghost btn-xs"
                onClick={handleClearFilters}
                style={{ gap: 4, fontSize: 11, color: 'var(--text-muted)', padding: '2px 6px' }}
              >
                <RotateCcw size={11} /> Đặt lại
              </button>
            </div>

            {/* Saved Toggle Button */}
            <button
              onClick={() => setOnlySaved((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '9px 12px',
                borderRadius: 8,
                border: onlySaved ? 'none' : '1px solid var(--border)',
                background: onlySaved
                  ? 'linear-gradient(135deg, var(--brand-600), #2563eb)'
                  : 'var(--bg-surface-2)',
                color: onlySaved ? 'white' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                width: '100%',
                boxShadow: onlySaved ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {onlySaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
              {onlySaved ? `Đang hiện: ${config.entityLabel} đã lưu` : `Chỉ ${config.entityLabel} đã lưu`}
              {savedIds.size > 0 && (
                <span style={{ fontSize: 10, fontWeight: 800, background: onlySaved ? 'rgba(255,255,255,0.25)' : 'var(--brand-100)', color: onlySaved ? 'white' : 'var(--brand-700)', padding: '1px 6px', borderRadius: 10 }}>
                  {savedIds.size}
                </span>
              )}
            </button>

            {/* Search Bar */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: 30, paddingRight: 26, fontSize: 12, height: 36, width: '100%' }}
                  placeholder={`Tìm Tên, ID, ${config.orgLabel}...`}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSearchTerm(searchInput);
                      setCurrentPage(1);
                    }
                  }}
                />
                {searchInput && (
                  <X
                    size={13}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-muted)' }}
                    onClick={() => {
                      setSearchInput('');
                      setSearchTerm('');
                    }}
                  />
                )}
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setSearchTerm(searchInput);
                  setCurrentPage(1);
                }}
                style={{
                  height: 36, padding: '0 12px', fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', borderRadius: 8,
                  background: config.brandColor, border: 'none',
                }}
                title="Bấm để tìm kiếm"
              >
                <Search size={13} />
                Tìm kiếm
              </button>
            </div>

            {/* Org / Country Dropdown Filter */}
            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>{config.orgLabel}:</label>
              <div
                className="form-input"
                onClick={() => setCountryDropdownOpen((v) => !v)}
                style={{
                  minHeight: 38, padding: '6px 10px', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', cursor: 'pointer', fontSize: 12,
                  color: selectedCountries.length ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: selectedCountries.length ? 600 : 400,
                }}
              >
                <span>
                  {selectedCountries.length > 0 ? `${config.orgLabel} (${selectedCountries.length})` : `Tất cả ${config.orgLabel}`}
                </span>
                <ChevronDown size={14} />
              </div>

              {countryDropdownOpen && (
                <div
                  style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: 4,
                    background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)', padding: 8, maxHeight: 220,
                    display: 'flex', flexDirection: 'column',
                  }}
                >
                  <input
                    type="text"
                    placeholder={`Lọc ${config.orgLabel.toLowerCase()}...`}
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    style={{ width: '100%', padding: '4px 8px', fontSize: 11, marginBottom: 6, borderRadius: 6, border: '1px solid var(--border)' }}
                  />
                  <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {uniqueCountries
                      .filter((c) => c.toLowerCase().includes(countrySearch.toLowerCase()))
                      .map((c) => {
                        const isChecked = selectedCountries.includes(c);
                        return (
                          <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedCountries((prev) =>
                                  isChecked ? prev.filter((item) => item !== c) : [...prev, c]
                                );
                              }}
                            />
                            {c}
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Status Dropdown Filter */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Trạng thái:</label>
              <select
                className="form-input"
                style={{ minHeight: 38, padding: '6px 10px', fontSize: 12, lineHeight: 1.4 }}
                value={selectedStatuses[0] || ''}
                onChange={(e) => setSelectedStatuses(e.target.value ? [e.target.value] : [])}
              >
                <option value="">Tất cả Trạng Thái</option>
                {uniqueStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Stage Dropdown Filter */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>{config.stageLabel}:</label>
              <select
                className="form-input"
                style={{ minHeight: 38, padding: '6px 10px', fontSize: 12, lineHeight: 1.4 }}
                value={selectedStages[0] || ''}
                onChange={(e) => setSelectedStages(e.target.value ? [e.target.value] : [])}
              >
                <option value="">Tất cả {config.stageLabel}</option>
                {uniqueStages.map((stg) => (
                  <option key={stg} value={stg}>
                    {stg}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filters */}
            <div style={{ paddingTop: 8, borderTop: '1px dashed var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>{config.date1Label}:</span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input
                    type="date"
                    className="form-input"
                    style={{ fontSize: 11, padding: '3px 6px', minHeight: 32, flex: 1 }}
                    value={approvalDateFrom}
                    onChange={(e) => setApprovalDateFrom(e.target.value)}
                  />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>-</span>
                  <input
                    type="date"
                    className="form-input"
                    style={{ fontSize: 11, padding: '3px 6px', minHeight: 32, flex: 1 }}
                    value={approvalDateTo}
                    onChange={(e) => setApprovalDateTo(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>{config.date2Label}:</span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input
                    type="date"
                    className="form-input"
                    style={{ fontSize: 11, padding: '3px 6px', minHeight: 32, flex: 1 }}
                    value={updatedDateFrom}
                    onChange={(e) => setUpdatedDateFrom(e.target.value)}
                  />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>-</span>
                  <input
                    type="date"
                    className="form-input"
                    style={{ fontSize: 11, padding: '3px 6px', minHeight: 32, flex: 1 }}
                    value={updatedDateTo}
                    onChange={(e) => setUpdatedDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>

          </div>
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <main
          className="wb-main animate-stagger-3"
          style={{
            flex: '1 1 0%', minWidth: 0,
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            display: 'flex', flexDirection: 'column', height: '100%',
          }}
        >
          {/* Results Control Header */}
          <div style={{ flex: '0 0 auto', padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
              Hiển thị <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{filteredProjects.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> - <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{Math.min(currentPage * pageSize, filteredProjects.length)}</span> trên tổng <span style={{ color: config.brandColor, fontWeight: 800 }}>{filteredProjects.length.toLocaleString()}</span> {config.entityLabel}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* View Mode Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-surface-2)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
                <button
                  onClick={() => setViewMode('table')}
                  style={{
                    padding: '3px 8px', borderRadius: 6, border: 'none',
                    background: viewMode === 'table' ? 'var(--bg-surface)' : 'transparent',
                    color: viewMode === 'table' ? config.brandColor : 'var(--text-muted)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
                  }}
                >
                  <List size={13} /> Bảng
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '3px 8px', borderRadius: 6, border: 'none',
                    background: viewMode === 'grid' ? 'var(--bg-surface)' : 'transparent',
                    color: viewMode === 'grid' ? config.brandColor : 'var(--text-muted)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
                  }}
                >
                  <LayoutGrid size={13} /> Thẻ
                </button>
              </div>

              {/* Page size select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Trang:</span>
                <select
                  className="form-input"
                  style={{ fontSize: 11, padding: '2px 6px', height: 26, width: 55 }}
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          {/* INNER SCROLLABLE CONTENT */}
          <div style={{ flex: '1 1 auto', overflowY: 'auto', overflowX: 'auto', position: 'relative' }}>
            {loading ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block', color: config.brandColor }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Đang tải dữ liệu {config.title}...</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Quá trình tải danh sách có thể mất vài giây</div>
              </div>
            ) : error ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <AlertCircle size={36} color="#ef4444" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{error}</div>
                <button className="btn btn-secondary btn-sm" onClick={loadData} style={{ marginTop: 14 }}>
                  Thử lại
                </button>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="empty-state" style={{ minHeight: 250 }}>
                <div className="empty-icon">📭</div>
                <div className="empty-title">Không tìm thấy {config.entityLabel} nào</div>
                <div className="empty-sub">Hãy thử thay đổi từ khóa tìm kiếm hoặc xóa bớt các bộ lọc.</div>
                <button className="btn btn-secondary btn-sm" onClick={handleClearFilters} style={{ marginTop: 12 }}>
                  Xóa bộ lọc
                </button>
              </div>
            ) : viewMode === 'table' ? (
              /* TABLE VIEW */
              <div className="table-responsive" style={{ overflowX: 'auto', width: '100%' }}>
                <table className="table" style={{ width: '100%', minWidth: 980, borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface-2)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {config.headers.map((h) => {
                        const isSorted = sortBy === h.key;
                        return (
                          <th
                            key={h.key || h.display}
                            onClick={() => h.sortable && handleSort(h.key)}
                            style={{
                              padding: '12px 14px',
                              textAlign: h.key === 'bookmark' ? 'center' : 'left',
                              cursor: h.sortable ? 'pointer' : 'default',
                              userSelect: 'none',
                              fontWeight: 700,
                              color: isSorted ? config.brandColor : 'var(--text-secondary)',
                              whiteSpace: 'nowrap',
                              width: h.width || 'auto',
                            }}
                          >
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              {h.display}
                              {h.sortable && (
                                <span style={{ opacity: isSorted ? 1 : 0.4 }}>
                                  {isSorted ? (
                                    sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                  ) : (
                                    <ArrowUpDown size={12} />
                                  )}
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProjects.map((p, idx) => {
                      const isSaved = savedIds.has(p.id);
                      const statusInfo = getStatusBadge(p.projectstatusdisplay);
                      const itemUrl = p.rawUrl || config.getUrl(p.id);

                      return (
                        <tr
                          key={p.id || idx}
                          style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s ease' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          {/* Save Button */}
                          <td style={{ textAlign: 'center', padding: '10px 14px' }}>
                            <button
                              onClick={(e) => handleToggleSave(p, e)}
                              title={isSaved ? `Bỏ lưu ${config.entityLabel}` : `Lưu ${config.entityLabel}`}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: isSaved ? config.brandColor : 'var(--text-muted)', padding: 4, borderRadius: 4,
                              }}
                            >
                              {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                            </button>
                          </td>

                          {/* Title */}
                          <td style={{ padding: '10px 14px', fontWeight: 600, minWidth: 260 }}>
                            <a
                              href={itemUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: config.brandColor, textDecoration: 'none',
                                display: 'inline-flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.4,
                              }}
                            >
                              <span>{p.project_name}</span>
                              <ExternalLink size={12} style={{ flexShrink: 0, marginTop: 3 }} />
                            </a>
                          </td>

                          {/* Org / Country */}
                          <td
                            title={p.countryshortname || 'N/A'}
                            style={{
                              padding: '10px 14px',
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              lineHeight: 1.4,
                              fontWeight: 500,
                              color: 'var(--text-primary)',
                              maxWidth: normType === 'procurement' ? 170 : 130,
                              width: normType === 'procurement' ? 170 : 130,
                            }}
                          >
                            {p.countryshortname || 'N/A'}
                          </td>

                          {/* ID */}
                          <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>
                            {p.id}
                          </td>

                          {/* Amount */}
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: config.brandColor, whiteSpace: 'nowrap' }}>
                            {formatAmountDisplay(p.totalCommitmentAmount)}
                          </td>

                          {/* Status */}
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                            <span
                              style={{
                                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12,
                                background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}`,
                              }}
                            >
                              {statusInfo.label}
                            </span>
                          </td>

                          {/* Date 1 */}
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: 12 }}>
                            {formatDate(p.boardapprovaldate)}
                          </td>

                          {/* Date 2 */}
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: 12 }}>
                            {formatDate(p.proj_last_upd_date)}
                          </td>

                          {/* Stage */}
                          <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: 12 }}>
                            {p.last_stage_reached_name || 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* GRID CARD VIEW */
              <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {paginatedProjects.map((p) => {
                  const isSaved = savedIds.has(p.id);
                  const statusInfo = getStatusBadge(p.projectstatusdisplay);
                  const itemUrl = p.rawUrl || config.getUrl(p.id);

                  return (
                    <div
                      key={p.id}
                      style={{
                        background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
                        borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column',
                        justifyContent: 'space-between', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        transition: 'transform 0.2s, boxShadow 0.2s',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: statusInfo.bg, color: statusInfo.color }}>
                            {statusInfo.label}
                          </span>
                          <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                            {p.id}
                          </span>
                        </div>

                        <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.4 }}>
                          <a
                            href={itemUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'inherit', textDecoration: 'none' }}
                          >
                            {p.project_name}
                          </a>
                        </h4>

                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                          🏢 <strong>{config.orgLabel}:</strong> {p.countryshortname || 'N/A'}
                        </div>

                        <div style={{ fontSize: 13, fontWeight: 800, color: config.brandColor, marginBottom: 6 }}>
                          💵 {config.amountLabel}: {formatAmountDisplay(p.totalCommitmentAmount)}
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {config.date1Label}: {formatDate(p.boardapprovaldate)}
                        </span>

                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={(e) => handleToggleSave(p, e)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: isSaved ? config.brandColor : 'var(--text-muted)', padding: 4,
                            }}
                          >
                            {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                          </button>
                          <a
                            href={itemUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: config.brandColor, padding: 4 }}
                          >
                            <ExternalLink size={18} />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (() => {
            const pages = [];
            for (let i = 1; i <= totalPages; i++) {
              if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) pages.push(i);
              else if (pages[pages.length - 1] !== '...') pages.push('...');
            }

            return (
              <div className="pagination" style={{ flex: '0 0 auto', marginTop: 12, marginBottom: 12, justifyContent: 'center' }}>
                <button
                  className="page-btn"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  id="btn-wb-prev"
                  title="Trang trước"
                >
                  <ChevronLeft size={15} />
                </button>

                {pages.map((p, i) => (
                  p === '...'
                    ? <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>…</span>
                    : <button
                        key={p}
                        className={`page-btn ${p === currentPage ? 'active' : ''}`}
                        onClick={() => setCurrentPage(p)}
                        id={`btn-wb-page-${p}`}
                      >
                        {p}
                      </button>
                ))}

                <span className="page-info">
                  {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredProjects.length)} / {filteredProjects.length}
                </span>

                <button
                  className="page-btn"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  id="btn-wb-next"
                  title="Trang sau"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            );
          })()}
        </main>
      </div>
    </div>
  );
}
