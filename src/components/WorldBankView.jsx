// src/components/WorldBankView.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Globe, Search, Filter, RotateCcw, ArrowUpDown, ChevronUp, ChevronDown,
  Bookmark, BookmarkCheck, ExternalLink, Download, LayoutGrid, List,
  DollarSign, Layers, CheckCircle2, Copy, AlertCircle, RefreshCw, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { worldBankService } from '../services/worldbank';

const DEFAULT_PAGE_SIZE = 20;

const HEADERS_CONFIG = [
  { key: 'bookmark', display: 'Lưu', sortable: false, width: '60px' },
  { key: 'project_name', display: 'Tên Dự Án (Project Title)', sortable: true },
  { key: 'countryshortname', display: 'Quốc Gia', sortable: true, width: '130px' },
  { key: 'id', display: 'Mã Dự Án (ID)', sortable: true, width: '110px' },
  { key: 'totalCommitmentAmount', display: 'Cam Kết (USD)', sortable: true, width: '150px' },
  { key: 'projectstatusdisplay', display: 'Trạng Thái', sortable: true, width: '120px' },
  { key: 'boardapprovaldate', display: 'Ngày Phê Duyệt', sortable: true, width: '130px' },
  { key: 'proj_last_upd_date', display: 'Cập Nhật Cuối', sortable: true, width: '130px' },
  { key: 'last_stage_reached_name', display: 'Giai Đoạn Cuối', sortable: true, width: '150px' },
];

export default function WorldBankView() {
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
  const [searchTerm, setSearchTerm] = useState('');
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
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Show Toast
  const showToast = (msg, type = 'info') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load Initial Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await worldBankService.fetchProjects();
      setAllProjects(data);

      const savedList = worldBankService.getSavedProjects();
      setSavedIds(new Set(savedList.map((p) => p.id)));
    } catch (err) {
      console.error('World Bank load error:', err);
      setError(err.message || 'Không thể tải dữ liệu dự án World Bank');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle Refresh & Trigger Server Ingest into DB
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      showToast('Đang cào dữ liệu mới từ World Bank và lưu vào Cơ sở dữ liệu...', 'info');
      await worldBankService.crawlProjects(500);
      const data = await worldBankService.fetchProjects();
      setAllProjects(data);
      const savedList = worldBankService.getSavedProjects();
      setSavedIds(new Set(savedList.map((p) => p.id)));
      showToast(`Đã đồng bộ ${data.length} dự án vào Cơ sở dữ liệu thành công!`, 'success');
    } catch (err) {
      console.error('World Bank refresh error:', err);
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Save / Bookmark
  const handleToggleSave = (project, e) => {
    if (e) e.stopPropagation();
    const { isSaved } = worldBankService.toggleSaveProject(project);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.add(project.id);
      else next.delete(project.id);
      return next;
    });
    showToast(
      isSaved
        ? `Đã lưu dự án "${project.project_name?.slice(0, 30)}..."`
        : `Đã bỏ lưu dự án "${project.id}"`,
      isSaved ? 'success' : 'info'
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
      // Saved filter
      if (onlySaved && !savedIds.has(p.id)) return false;

      // Text search
      if (term) {
        const titleMatch = p.project_name?.toLowerCase().includes(term);
        const idMatch = p.id?.toLowerCase().includes(term);
        const countryMatch = p.countryshortname?.toLowerCase().includes(term);
        if (!titleMatch && !idMatch && !countryMatch) return false;
      }

      // Multi-select filters
      if (selectedCountries.length > 0 && !selectedCountries.includes(p.countryshortname)) {
        return false;
      }
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(p.projectstatusdisplay)) {
        return false;
      }
      if (selectedStages.length > 0 && !selectedStages.includes(p.last_stage_reached_name)) {
        return false;
      }

      // Date Range Filters
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
    allProjects,
    searchTerm,
    selectedCountries,
    selectedStatuses,
    selectedStages,
    approvalDateFrom,
    approvalDateTo,
    updatedDateFrom,
    updatedDateTo,
    onlySaved,
    savedIds,
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

  // Paginated Projects
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
    searchTerm,
    selectedCountries,
    selectedStatuses,
    selectedStages,
    approvalDateFrom,
    approvalDateTo,
    updatedDateFrom,
    updatedDateTo,
    onlySaved,
    pageSize,
  ]);

  // Sort toggle handler
  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  // Reset Filters
  const handleClearFilters = () => {
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
      (sum, p) => sum + (p.totalCommitmentAmount || 0),
      0
    );
    const countryCount = new Set(filteredProjects.map((p) => p.countryshortname).filter(Boolean)).size;

    return {
      totalProjects: filteredProjects.length,
      totalCommitmentUSD,
      countryCount,
      savedCount: savedIds.size,
    };
  }, [filteredProjects, savedIds]);

  // Formatters
  const formatCurrency = (amount) => {
    if (!amount || amount <= 0) return 'N/A';
    if (amount >= 1e9) {
      return `$${(amount / 1e9).toFixed(2)} Billion`;
    }
    if (amount >= 1e6) {
      return `$${(amount / 1e6).toFixed(1)} Million`;
    }
    return `$${amount.toLocaleString('en-US')}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('active') || s.includes('implementation')) {
      return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', label: status || 'Active' };
    }
    if (s.includes('closed') || s.includes('completed')) {
      return { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb', label: status || 'Closed' };
    }
    if (s.includes('pipeline') || s.includes('concept')) {
      return { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: status || 'Pipeline' };
    }
    return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', label: status || 'N/A' };
  };

  // Export CSV Functionality
  const handleExportCSV = () => {
    if (filteredProjects.length === 0) {
      showToast('Không có dữ liệu để xuất CSV', 'warning');
      return;
    }

    const headers = [
      'Project ID',
      'Project Name',
      'Country',
      'Commitment Amount (USD)',
      'Status',
      'Approval Date',
      'Last Updated Date',
      'Last Stage Reached',
      'URL',
    ];

    const csvRows = [
      headers.join(','),
      ...filteredProjects.map((p) => {
        const row = [
          `"${p.id}"`,
          `"${(p.project_name || '').replace(/"/g, '""')}"`,
          `"${p.countryshortname || ''}"`,
          `"${p.totalCommitmentAmount || 0}"`,
          `"${p.projectstatusdisplay || ''}"`,
          `"${p.boardapprovaldate || ''}"`,
          `"${p.proj_last_upd_date || ''}"`,
          `"${p.last_stage_reached_name || ''}"`,
          `"https://projects.worldbank.org/en/projects-operations/project-detail/${p.id}"`,
        ];
        return row.join(',');
      }),
    ];

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `WorldBank_Projects_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Đã xuất ${filteredProjects.length} dự án ra tệp CSV`, 'success');
  };

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 128px)', maxHeight: 'calc(100vh - 128px)', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: 12,
            background: toastMessage.type === 'success' ? '#10b981' : toastMessage.type === 'warning' ? '#f59e0b' : '#3b82f6',
            color: 'white',
            fontWeight: 600,
            fontSize: 13,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <CheckCircle2 size={16} />
          {toastMessage.msg}
        </div>
      )}

      {/* Header Banner (Compact to save vertical screen space) */}
      <div
        style={{
          flex: '0 0 auto',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.05))',
          border: '1px solid rgba(16, 185, 129, 0.2)',
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
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
            }}
          >
            <Globe size={18} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              World Bank Projects & Operations
            </h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              Quản lý, tìm kiếm và tra cứu dữ liệu dự án Ngân hàng Thế giới (World Bank) toàn cầu
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
            style={{ gap: 6, display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #10b981, #047857)', border: 'none', fontSize: 12, padding: '4px 10px' }}
          >
            <Download size={14} />
            Xuất Excel / CSV
          </button>
        </div>
      </div>

      {/* 2-COLUMN LAYOUT: Sidebar (Filters + Stats) | Main Content (Table) */}
      <div style={{ display: 'flex', gap: 14, flex: '1 1 0%', minHeight: 0, overflow: 'hidden' }}>

        {/* LEFT SIDEBAR FILTERS (Width 300px, Full height inner scroll) */}
        <aside style={{ flex: '0 0 300px', width: 300, display: 'flex', flexDirection: 'column', gap: 10, height: '100%', overflowY: 'auto', paddingRight: 2 }}>

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
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tổng Dự Án</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>{stats.totalProjects.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Quốc Gia</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#3b82f6' }}>{stats.countryCount}</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                <DollarSign size={11} color="#10b981" /> Tổng Cam Kết (USD)
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>{formatCurrency(stats.totalCommitmentUSD)}</div>
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
                <Filter size={14} color="var(--brand-500)" />
                Bộ Lọc Dự Án
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
                padding: '6px 12px',
                borderRadius: 8,
                border: onlySaved ? 'none' : '1px solid var(--border)',
                background: onlySaved ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--bg-surface-2)',
                color: onlySaved ? 'white' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              <Bookmark size={13} />
              {onlySaved ? 'Đang hiện: Dự án đã lưu' : 'Chỉ dự án đã lưu'}
              {savedIds.size > 0 && (
                <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.3)', padding: '1px 6px', borderRadius: 10 }}>
                  {savedIds.size}
                </span>
              )}
            </button>

            {/* Search Bar with dedicated Search Button */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: 30, paddingRight: 26, fontSize: 12, height: 36, width: '100%' }}
                  placeholder="Tìm Tên, ID, Quốc gia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setCurrentPage(1);
                    }
                  }}
                />
                {searchTerm && (
                  <X
                    size={13}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-muted)' }}
                    onClick={() => setSearchTerm('')}
                  />
                )}
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setCurrentPage(1)}
                style={{
                  height: 36,
                  padding: '0 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  whiteSpace: 'nowrap',
                  borderRadius: 8,
                }}
                title="Bấm để tìm kiếm"
              >
                <Search size={13} />
                Tìm kiếm
              </button>
            </div>

            {/* Country Dropdown Filter */}
            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Quốc gia:</label>
              <div
                className="form-input"
                onClick={() => setCountryDropdownOpen((v) => !v)}
                style={{
                  minHeight: 38,
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: selectedCountries.length ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: selectedCountries.length ? 600 : 400,
                }}
              >
                <span>
                  {selectedCountries.length > 0 ? `Quốc gia (${selectedCountries.length})` : 'Tất cả Quốc gia'}
                </span>
                <ChevronDown size={14} />
              </div>

              {countryDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    marginTop: 4,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    padding: 8,
                    maxHeight: 220,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Lọc quốc gia..."
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
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Giai đoạn:</label>
              <select
                className="form-input"
                style={{ minHeight: 38, padding: '6px 10px', fontSize: 12, lineHeight: 1.4 }}
                value={selectedStages[0] || ''}
                onChange={(e) => setSelectedStages(e.target.value ? [e.target.value] : [])}
              >
                <option value="">Tất cả Giai Đoạn</option>
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
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Phê Duyệt:</span>
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
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Cập Nhật:</span>
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

        {/* RIGHT MAIN CONTENT AREA (Flex 1, Height 100%) */}
        <main
          style={{
            flex: '1 1 0%',
            minWidth: 0,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          {/* Results Control Header (Fixed top of card) */}
          <div style={{ flex: '0 0 auto', padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
              Hiển thị <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{filteredProjects.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> - <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{Math.min(currentPage * pageSize, filteredProjects.length)}</span> trên tổng <span style={{ color: 'var(--brand-600)', fontWeight: 800 }}>{filteredProjects.length.toLocaleString()}</span> dự án
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* View Mode Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-surface-2)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
                <button
                  onClick={() => setViewMode('table')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    border: 'none',
                    background: viewMode === 'table' ? 'var(--bg-surface)' : 'transparent',
                    color: viewMode === 'table' ? 'var(--brand-600)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  <List size={13} /> Bảng
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    border: 'none',
                    background: viewMode === 'grid' ? 'var(--bg-surface)' : 'transparent',
                    color: viewMode === 'grid' ? 'var(--brand-600)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
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

          {/* INNER SCROLLABLE CONTENT (Table/Grid Body) */}
          <div style={{ flex: '1 1 auto', overflowY: 'auto', overflowX: 'auto', position: 'relative' }}>
            {/* Loading State */}
            {loading ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block', color: 'var(--brand-500)' }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Đang tải dữ liệu World Bank...</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Quá trình tải danh sách dự án có thể mất vài giây</div>
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
                <div className="empty-icon">🌍</div>
                <div className="empty-title">Không tìm thấy dự án nào</div>
                <div className="empty-sub">Hãy thử thay đổi từ khóa tìm kiếm hoặc xóa bớt các bộ lọc.</div>
                <button className="btn btn-secondary btn-sm" onClick={handleClearFilters} style={{ marginTop: 12 }}>
                  Xóa bộ lọc
                </button>
              </div>
            ) : viewMode === 'table' ? (
              /* TABLE VIEW */
              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface-2)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {HEADERS_CONFIG.map((h) => {
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
                          color: isSorted ? 'var(--brand-600)' : 'var(--text-secondary)',
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

                  return (
                    <tr
                      key={p.id || idx}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Save Button */}
                      <td style={{ textAlign: 'center', padding: '10px 14px' }}>
                        <button
                          onClick={(e) => handleToggleSave(p, e)}
                          title={isSaved ? 'Bỏ lưu dự án' : 'Lưu dự án'}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: isSaved ? '#10b981' : 'var(--text-muted)',
                            padding: 4,
                            borderRadius: 4,
                          }}
                        >
                          {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                        </button>
                      </td>

                      {/* Project Title */}
                      <td style={{ padding: '10px 14px', fontWeight: 600, minWidth: 260 }}>
                        <a
                          href={`https://projects.worldbank.org/en/projects-operations/project-detail/${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: 'var(--brand-600)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'flex-start',
                            gap: 6,
                            lineHeight: 1.4,
                          }}
                        >
                          <span>{p.project_name}</span>
                          <ExternalLink size={12} style={{ flexShrink: 0, marginTop: 3 }} />
                        </a>
                      </td>

                      {/* Country */}
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {p.countryshortname || 'N/A'}
                      </td>

                      {/* ID */}
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>
                        {p.id}
                      </td>

                      {/* Commitment Amount */}
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#10b981', whiteSpace: 'nowrap' }}>
                        {formatCurrency(p.totalCommitmentAmount)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 12,
                            background: statusInfo.bg,
                            color: statusInfo.color,
                            border: `1px solid ${statusInfo.border}`,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Approval Date */}
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: 12 }}>
                        {formatDate(p.boardapprovaldate)}
                      </td>

                      {/* Last Updated Date */}
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: 12 }}>
                        {formatDate(p.proj_last_upd_date)}
                      </td>

                      {/* Last Stage Reached */}
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

              return (
                <div
                  key={p.id}
                  style={{
                    background: 'var(--bg-surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    padding: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    gap: 12,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
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
                        href={`https://projects.worldbank.org/en/projects-operations/project-detail/${p.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'inherit', textDecoration: 'none' }}
                      >
                        {p.project_name}
                      </a>
                    </h4>

                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      🌍 <strong>Quốc gia:</strong> {p.countryshortname || 'N/A'}
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 800, color: '#10b981', marginBottom: 6 }}>
                      💵 Cam kết: {formatCurrency(p.totalCommitmentAmount)}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Phê duyệt: {formatDate(p.boardapprovaldate)}
                    </span>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={(e) => handleToggleSave(p, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: isSaved ? '#10b981' : 'var(--text-muted)',
                          padding: 4,
                        }}
                      >
                        {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                      </button>
                      <a
                        href={`https://projects.worldbank.org/en/projects-operations/project-detail/${p.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--brand-600)', padding: 4 }}
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

        {/* Pagination Footer (Fixed at bottom of main card) */}
        {totalPages > 1 && (
          <div style={{ flex: '0 0 auto', padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 15 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{ gap: 4 }}
            >
              <ChevronLeft size={14} /> Trước
            </button>

            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Trang <strong style={{ color: 'var(--text-primary)' }}>{currentPage}</strong> / {totalPages}
            </span>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{ gap: 4 }}
            >
              Sau <ChevronRight size={14} />
            </button>
          </div>
        )}
      </main>
    </div>
  </div>
);
}
