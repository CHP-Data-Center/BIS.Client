// src/pages/InvestorsPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  MapPin,
  FileText,
  Phone,
  Tag,
  ExternalLink,
  Pencil,
  Trash2,
  Layers,
  ShoppingBag,
  Newspaper,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  ChevronRight,
  Info,
} from 'lucide-react';
import { investorsService } from '../services/investors';
import { useLang } from '../context/LanguageContext';
import AddInvestorModal from '../components/AddInvestorModal';
import EditInvestorModal from '../components/EditInvestorModal';
import ConfirmModal from '../components/common/ConfirmModal';
import NewsCard from '../components/NewsCard';

const INVESTOR_TYPE_LABELS = {
  ban_qlda: 'Ban QLDA',
  so_nganh: 'Sở / Ban / Ngành',
  tap_doan_tct: 'Tập đoàn / TCT',
  ubnd: 'UBND',
  benh_vien_truong_hoc: 'BV / Trường học',
  khac: 'Đơn vị khác',
};

const STATUS_META = {
  watching: { label: 'Đang theo dõi', bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' },
  priority: { label: 'Ưu tiên cao', bg: '#fef3c7', fg: '#b45309', border: '#fde68a' },
  inactive: { label: 'Tạm ngưng', bg: '#f1f5f9', fg: '#64748b', border: '#e2e8f0' },
};

export default function InvestorsPage() {
  const { t } = useLang();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [selectedInvestorId, setSelectedInvestorId] = useState(null);

  // Profile 360 state
  const [profile360, setProfile360] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('packages'); // 'packages' | 'articles' | 'projects' | 'notes'
  const [pkgFilterKind, setPkgFilterKind] = useState('all'); // 'all' | 'notice' | 'plan'
  const [pkgSearch, setPkgSearch] = useState('');

  // Search & Filters on left sidebar
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState(null);
  const [deletingInvestor, setDeletingInvestor] = useState(null);

  // Load summary and list
  const loadData = async (keepSelection = true) => {
    setLoading(true);
    try {
      const summary = await investorsService.getSummary();
      setSummaryData(summary);

      if (summary?.items?.length > 0) {
        if (!keepSelection || !selectedInvestorId) {
          setSelectedInvestorId(summary.items[0].id);
        } else {
          // Check if selected still exists
          const exists = summary.items.some((it) => it.id === selectedInvestorId);
          if (!exists) {
            setSelectedInvestorId(summary.items[0].id);
          }
        }
      } else {
        setSelectedInvestorId(null);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu chủ đầu tư:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, []);

  // Load Profile 360 when selected investor changes
  useEffect(() => {
    if (!selectedInvestorId) {
      setProfile360(null);
      return;
    }

    let isMounted = true;
    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const res = await investorsService.getProfile360(selectedInvestorId);
        if (isMounted) {
          setProfile360(res);
        }
      } catch (err) {
        console.error('Lỗi tải hồ sơ 360:', err);
      } finally {
        if (isMounted) setProfileLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [selectedInvestorId]);

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deletingInvestor) return;
    try {
      await investorsService.deleteInvestor(deletingInvestor.id);
      setDeletingInvestor(null);
      await loadData(false);
    } catch (err) {
      console.error('Lỗi xóa CĐT:', err);
    }
  };

  // Filtered investors for left sidebar
  const visibleInvestors = useMemo(() => {
    if (!summaryData?.items) return [];
    return summaryData.items.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (provinceFilter && item.province !== provinceFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(q);
        const matchAlias = item.aliases?.toLowerCase().includes(q);
        const matchProvince = item.province?.toLowerCase().includes(q);
        if (!matchName && !matchAlias && !matchProvince) return false;
      }
      return true;
    });
  }, [summaryData, searchQuery, statusFilter, provinceFilter]);

  // Unique provinces list for filter
  const provincesList = useMemo(() => {
    if (!summaryData?.items) return [];
    const set = new Set();
    summaryData.items.forEach((item) => {
      if (item.province?.trim()) set.add(item.province.trim());
    });
    return Array.from(set).sort();
  }, [summaryData]);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    if (!profile360?.procurement_packages) return [];
    return profile360.procurement_packages.filter((pkg) => {
      if (pkgFilterKind !== 'all' && pkg.kind !== pkgFilterKind) return false;
      if (pkgSearch.trim()) {
        const q = pkgSearch.toLowerCase();
        const matchTitle = pkg.title?.toLowerCase().includes(q);
        const matchId = pkg.id?.toLowerCase().includes(q);
        const matchSector = pkg.sector?.toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchSector) return false;
      }
      return true;
    });
  }, [profile360, pkgFilterKind, pkgSearch]);

  const selectedInvestor = useMemo(() => {
    return summaryData?.items?.find((it) => it.id === selectedInvestorId) || profile360?.investor;
  }, [summaryData, selectedInvestorId, profile360]);

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      {/* Top Header Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            }}
          >
            <Building2 size={26} />
          </div>
          <div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'var(--text-main, #0f172a)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Theo dõi Chủ đầu tư
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #64748b)', margin: '4px 0 0 0' }}>
              Giám sát 360° hồ sơ gói thầu e-GP, tin tức truyền thông và dự án trọng điểm
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border, #cbd5e1)',
              backgroundColor: 'var(--bg-surface, #ffffff)',
              color: 'var(--text-main, #0f172a)',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={18} />
            Thêm Chủ đầu tư
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '14px',
            backgroundColor: 'var(--bg-surface, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>
              Tổng Chủ đầu tư
            </div>
            <div style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
              {summaryData?.total_investors ?? 0}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '16px 20px',
            borderRadius: '14px',
            backgroundColor: 'var(--bg-surface, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Tag size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>
              Ưu tiên cao
            </div>
            <div style={{ fontSize: '1.375rem', fontWeight: 700, color: '#d97706' }}>
              {summaryData?.priority_count ?? 0}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '16px 20px',
            borderRadius: '14px',
            backgroundColor: 'var(--bg-surface, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShoppingBag size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>
              Gói thầu e-GP khớp
            </div>
            <div style={{ fontSize: '1.375rem', fontWeight: 700, color: '#059669' }}>
              {summaryData?.total_procurements_matched ?? 0}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '16px 20px',
            borderRadius: '14px',
            backgroundColor: 'var(--bg-surface, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#f5f3ff',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Newspaper size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>
              Tin tức liên quan
            </div>
            <div style={{ fontSize: '1.375rem', fontWeight: 700, color: '#7c3aed' }}>
              {summaryData?.total_articles_matched ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="projects-layout-grid">
        {/* Left Sidebar: List of Investors */}
        <div
          className="projects-sidebar-sticky"
          style={{
            background: 'var(--bg-surface, #ffffff)',
            borderRadius: '16px',
            padding: '18px',
            border: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
            minWidth: 0,
          }}
        >
          {/* Header of Sidebar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border, #e2e8f0)',
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
              Danh sách ({visibleInvestors.length}/{summaryData?.total_investors ?? 0})
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted, #64748b)',
                backgroundColor: 'var(--bg-subtle, #f8fafc)',
                padding: '3px 8px',
                borderRadius: '8px',
                fontWeight: 600,
              }}
            >
              CĐT
            </span>
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted, #94a3b8)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, viết tắt, tỉnh..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '8px',
                border: '1px solid var(--border, #cbd5e1)',
                backgroundColor: 'var(--bg-surface-2, #f8fafc)',
                color: 'var(--text-main, #0f172a)',
                fontSize: '0.8125rem',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {/* Filters row */}
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '6px 8px',
                borderRadius: '8px',
                border: '1px solid var(--border, #cbd5e1)',
                backgroundColor: 'var(--bg-surface-2, #f8fafc)',
                color: 'var(--text-main, #0f172a)',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="priority">Ưu tiên cao</option>
              <option value="watching">Đang theo dõi</option>
              <option value="inactive">Tạm ngưng</option>
            </select>

            {provincesList.length > 0 && (
              <select
                value={provinceFilter}
                onChange={(e) => setProvinceFilter(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '6px 8px',
                  borderRadius: '8px',
                  border: '1px solid var(--border, #cbd5e1)',
                  backgroundColor: 'var(--bg-surface-2, #f8fafc)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                <option value="">Tất cả tỉnh</option>
                {provincesList.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* List items */}
          <div
            className="projects-list-scroll"
            style={{
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingRight: '2px',
            }}
          >
            {loading && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                <span style={{ fontSize: '0.8125rem' }}>Đang tải danh sách...</span>
              </div>
            )}

            {!loading && visibleInvestors.length === 0 && (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: 'var(--text-muted, #64748b)',
                  backgroundColor: 'var(--bg-subtle, #f8fafc)',
                  borderRadius: '12px',
                  border: '1px dashed var(--border, #e2e8f0)',
                }}
              >
                <Building2 size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 500 }}>Chưa có chủ đầu tư nào phù hợp</p>
              </div>
            )}

            {!loading &&
              visibleInvestors.map((inv) => {
                const isSelected = inv.id === selectedInvestorId;
                const statusMeta = STATUS_META[inv.status] || STATUS_META.watching;
                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvestorId(inv.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: `1.5px solid ${isSelected ? '#2563eb' : 'var(--border, #e2e8f0)'}`,
                      backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.04)' : 'var(--bg-surface, #ffffff)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    {/* Top row: Status tag + Actions */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '6px',
                          backgroundColor: statusMeta.bg,
                          color: statusMeta.fg,
                        }}
                      >
                        {statusMeta.label}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingInvestor(inv);
                          }}
                          title="Chỉnh sửa"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '3px',
                            color: 'var(--text-muted, #64748b)',
                            borderRadius: '4px',
                          }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingInvestor(inv);
                          }}
                          title="Xóa"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '3px',
                            color: '#ef4444',
                            borderRadius: '4px',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Investor Name */}
                    <div
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: isSelected ? '#1d4ed8' : 'var(--text-main, #0f172a)',
                        lineHeight: 1.35,
                        marginBottom: '6px',
                        wordBreak: 'break-word',
                      }}
                    >
                      {inv.name}
                    </div>

                    {/* Metadata tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                      {inv.province && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '0.6875rem',
                            color: 'var(--text-muted, #64748b)',
                          }}
                        >
                          <MapPin size={11} />
                          {inv.province}
                        </span>
                      )}
                      {inv.investor_type && (
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            color: 'var(--text-muted, #64748b)',
                            backgroundColor: 'var(--bg-subtle, #f1f5f9)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {INVESTOR_TYPE_LABELS[inv.investor_type] || inv.investor_type}
                        </span>
                      )}
                    </div>

                    {/* Counter badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.6875rem' }}>
                      <span
                        style={{
                          backgroundColor: '#ecfdf5',
                          color: '#047857',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          fontWeight: 600,
                        }}
                      >
                        🛒 {inv.procurement_count} gói
                      </span>
                      <span
                        style={{
                          backgroundColor: '#f5f3ff',
                          color: '#6d28d9',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          fontWeight: 600,
                        }}
                      >
                        📰 {inv.article_count} tin
                      </span>
                      {inv.project_count > 0 && (
                        <span
                          style={{
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            fontWeight: 600,
                          }}
                        >
                          📁 {inv.project_count} DA
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right Area: Investor 360° Profile Hub */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          {!selectedInvestor ? (
            <div
              style={{
                backgroundColor: 'var(--bg-surface, #ffffff)',
                borderRadius: '16px',
                border: '1px solid var(--border, #e2e8f0)',
                padding: '64px 24px',
                textAlign: 'center',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Building2 size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--text-main, #0f172a)' }}>
                Chưa chọn Chủ đầu tư
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #64748b)', maxWidth: '440px', margin: '0 auto 20px' }}>
                Chọn một chủ đầu tư từ danh sách bên trái hoặc thêm mới để xem toàn bộ gói thầu e-GP, tin bài báo chí và dự án liên kết.
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={18} />
                Thêm Chủ đầu tư đầu tiên
              </button>
            </div>
          ) : (
            <>
              {/* Profile Header Banner */}
              <div
                style={{
                  backgroundColor: 'var(--bg-surface, #ffffff)',
                  borderRadius: '16px',
                  border: '1px solid var(--border, #e2e8f0)',
                  padding: '24px',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {/* Title row */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '8px',
                          backgroundColor: STATUS_META[selectedInvestor.status]?.bg || '#eff6ff',
                          color: STATUS_META[selectedInvestor.status]?.fg || '#1d4ed8',
                          border: `1px solid ${STATUS_META[selectedInvestor.status]?.border || '#bfdbfe'}`,
                        }}
                      >
                        {STATUS_META[selectedInvestor.status]?.label || 'Đang theo dõi'}
                      </span>
                      {selectedInvestor.investor_type && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '3px 10px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-subtle, #f1f5f9)',
                            color: 'var(--text-muted, #475569)',
                          }}
                        >
                          {INVESTOR_TYPE_LABELS[selectedInvestor.investor_type] || selectedInvestor.investor_type}
                        </span>
                      )}
                    </div>
                    <h2
                      style={{
                        fontSize: '1.375rem',
                        fontWeight: 800,
                        color: 'var(--text-main, #0f172a)',
                        margin: 0,
                        lineHeight: 1.35,
                      }}
                    >
                      {selectedInvestor.name}
                    </h2>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setEditingInvestor(selectedInvestor)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border, #cbd5e1)',
                        backgroundColor: 'var(--bg-surface, #ffffff)',
                        color: 'var(--text-main, #0f172a)',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Pencil size={15} />
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingInvestor(selectedInvestor)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px solid #fecaca',
                        backgroundColor: '#fef2f2',
                        color: '#b91c1c',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={15} />
                      Xóa
                    </button>
                  </div>
                </div>

                {/* Meta details grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-subtle, #f8fafc)',
                    border: '1px solid var(--border, #e2e8f0)',
                  }}
                >
                  {selectedInvestor.province && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem' }}>
                      <MapPin size={16} color="#64748b" />
                      <span style={{ color: 'var(--text-muted, #64748b)' }}>Địa phương:</span>
                      <strong style={{ color: 'var(--text-main, #0f172a)' }}>{selectedInvestor.province}</strong>
                    </div>
                  )}
                  {selectedInvestor.tax_code && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem' }}>
                      <FileText size={16} color="#64748b" />
                      <span style={{ color: 'var(--text-muted, #64748b)' }}>MST / Mã e-GP:</span>
                      <strong style={{ color: 'var(--text-main, #0f172a)' }}>{selectedInvestor.tax_code}</strong>
                    </div>
                  )}
                  {selectedInvestor.contact_info && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem' }}>
                      <Phone size={16} color="#64748b" />
                      <span style={{ color: 'var(--text-muted, #64748b)' }}>Liên hệ:</span>
                      <strong style={{ color: 'var(--text-main, #0f172a)' }}>{selectedInvestor.contact_info}</strong>
                    </div>
                  )}
                  {selectedInvestor.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem' }}>
                      <Building2 size={16} color="#64748b" />
                      <span style={{ color: 'var(--text-muted, #64748b)' }}>Trụ sở:</span>
                      <span style={{ color: 'var(--text-main, #0f172a)', wordBreak: 'break-word' }}>
                        {selectedInvestor.address}
                      </span>
                    </div>
                  )}
                </div>

                {/* Aliases chips */}
                {selectedInvestor.aliases && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>
                      Tên viết tắt / đối sánh:
                    </span>
                    {selectedInvestor.aliases.split(/[\n,;]+/).map(
                      (item, idx) =>
                        item.trim() && (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #dbeafe',
                              fontWeight: 500,
                            }}
                          >
                            {item.trim()}
                          </span>
                        )
                    )}
                  </div>
                )}
              </div>

              {/* Tabs Navigation */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderBottom: '1px solid var(--border, #e2e8f0)',
                  paddingBottom: '2px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('packages')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: `2px solid ${activeTab === 'packages' ? '#2563eb' : 'transparent'}`,
                    color: activeTab === 'packages' ? '#2563eb' : 'var(--text-muted, #64748b)',
                    fontWeight: activeTab === 'packages' ? 700 : 500,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  <ShoppingBag size={18} />
                  Gói thầu e-GP
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '2px 7px',
                      borderRadius: '12px',
                      backgroundColor: activeTab === 'packages' ? '#eff6ff' : 'var(--bg-subtle, #f1f5f9)',
                      color: activeTab === 'packages' ? '#1d4ed8' : 'var(--text-muted, #64748b)',
                    }}
                  >
                    {(profile360?.total_notices ?? 0) + (profile360?.total_plans ?? 0)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('articles')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: `2px solid ${activeTab === 'articles' ? '#2563eb' : 'transparent'}`,
                    color: activeTab === 'articles' ? '#2563eb' : 'var(--text-muted, #64748b)',
                    fontWeight: activeTab === 'articles' ? 700 : 500,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  <Newspaper size={18} />
                  Tin tức truyền thông
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '2px 7px',
                      borderRadius: '12px',
                      backgroundColor: activeTab === 'articles' ? '#eff6ff' : 'var(--bg-subtle, #f1f5f9)',
                      color: activeTab === 'articles' ? '#1d4ed8' : 'var(--text-muted, #64748b)',
                    }}
                  >
                    {profile360?.total_articles ?? 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('projects')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: `2px solid ${activeTab === 'projects' ? '#2563eb' : 'transparent'}`,
                    color: activeTab === 'projects' ? '#2563eb' : 'var(--text-muted, #64748b)',
                    fontWeight: activeTab === 'projects' ? 700 : 500,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  <FolderKanban size={18} />
                  Dự án nội bộ
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '2px 7px',
                      borderRadius: '12px',
                      backgroundColor: activeTab === 'projects' ? '#eff6ff' : 'var(--bg-subtle, #f1f5f9)',
                      color: activeTab === 'projects' ? '#1d4ed8' : 'var(--text-muted, #64748b)',
                    }}
                  >
                    {profile360?.total_projects ?? 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: `2px solid ${activeTab === 'notes' ? '#2563eb' : 'transparent'}`,
                    color: activeTab === 'notes' ? '#2563eb' : 'var(--text-muted, #64748b)',
                    fontWeight: activeTab === 'notes' ? 700 : 500,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  <FileText size={18} />
                  Ghi chú & Đánh giá
                </button>
              </div>

              {/* Tab 1: Procurement Packages */}
              {activeTab === 'packages' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Controls: Search + Filter Notice/Plan */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setPkgFilterKind('all')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          border: pkgFilterKind === 'all' ? '1px solid #2563eb' : '1px solid var(--border, #cbd5e1)',
                          backgroundColor: pkgFilterKind === 'all' ? '#eff6ff' : 'var(--bg-surface, #ffffff)',
                          color: pkgFilterKind === 'all' ? '#1d4ed8' : 'var(--text-muted, #64748b)',
                          cursor: 'pointer',
                        }}
                      >
                        Tất cả ({(profile360?.total_notices ?? 0) + (profile360?.total_plans ?? 0)})
                      </button>

                      <button
                        type="button"
                        onClick={() => setPkgFilterKind('notice')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          border: pkgFilterKind === 'notice' ? '1px solid #059669' : '1px solid var(--border, #cbd5e1)',
                          backgroundColor: pkgFilterKind === 'notice' ? '#ecfdf5' : 'var(--bg-surface, #ffffff)',
                          color: pkgFilterKind === 'notice' ? '#047857' : 'var(--text-muted, #64748b)',
                          cursor: 'pointer',
                        }}
                      >
                        Thông báo mời thầu (TBMT: {profile360?.total_notices ?? 0})
                      </button>

                      <button
                        type="button"
                        onClick={() => setPkgFilterKind('plan')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          border: pkgFilterKind === 'plan' ? '1px solid #7c3aed' : '1px solid var(--border, #cbd5e1)',
                          backgroundColor: pkgFilterKind === 'plan' ? '#f5f3ff' : 'var(--bg-surface, #ffffff)',
                          color: pkgFilterKind === 'plan' ? '#6d28d9' : 'var(--text-muted, #64748b)',
                          cursor: 'pointer',
                        }}
                      >
                        Kế hoạch LCNT (KHLCNT: {profile360?.total_plans ?? 0})
                      </button>
                    </div>

                    <div style={{ position: 'relative', width: '260px' }}>
                      <Search
                        size={14}
                        style={{
                          position: 'absolute',
                          left: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-muted, #94a3b8)',
                        }}
                      />
                      <input
                        type="search"
                        value={pkgSearch}
                        onChange={(e) => setPkgSearch(e.target.value)}
                        placeholder="Tìm theo mã gói, tên gói..."
                        style={{
                          width: '100%',
                          padding: '6px 10px 6px 30px',
                          borderRadius: '8px',
                          border: '1px solid var(--border, #cbd5e1)',
                          backgroundColor: 'var(--bg-surface, #ffffff)',
                          color: 'var(--text-main, #0f172a)',
                          fontSize: '0.8125rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {profileLoading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
                      <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                      <p style={{ margin: 0, fontSize: '0.875rem' }}>Đang đối sánh gói thầu e-GP...</p>
                    </div>
                  ) : filteredPackages.length === 0 ? (
                    <div
                      style={{
                        padding: '48px 24px',
                        textAlign: 'center',
                        backgroundColor: 'var(--bg-surface, #ffffff)',
                        borderRadius: '12px',
                        border: '1px dashed var(--border, #e2e8f0)',
                        color: 'var(--text-muted, #64748b)',
                      }}
                    >
                      <ShoppingBag size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                      <p style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 4px' }}>
                        Không có gói thầu nào khớp với bộ lọc
                      </p>
                      <p style={{ fontSize: '0.8125rem', margin: 0 }}>
                        Các gói thầu mới được crawl từ Hệ thống mạng đấu thầu quốc gia sẽ tự động hiển thị tại đây.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {filteredPackages.map((pkg) => {
                        const isNotice = pkg.kind === 'notice';
                        return (
                          <div
                            key={pkg.id}
                            style={{
                              backgroundColor: 'var(--bg-surface, #ffffff)',
                              borderRadius: '12px',
                              border: '1px solid var(--border, #e2e8f0)',
                              padding: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '12px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span
                                  style={{
                                    fontSize: '0.6875rem',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: isNotice ? '#ecfdf5' : '#f5f3ff',
                                    color: isNotice ? '#047857' : '#6d28d9',
                                    border: `1px solid ${isNotice ? '#a7f3d0' : '#ddd6fe'}`,
                                  }}
                                >
                                  {isNotice ? 'TBMT' : 'KHLCNT'}
                                </span>
                                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#2563eb' }}>
                                  {pkg.id}
                                </span>
                                {pkg.sector && (
                                  <span
                                    style={{
                                      fontSize: '0.6875rem',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      backgroundColor: 'var(--bg-subtle, #f1f5f9)',
                                      color: 'var(--text-muted, #475569)',
                                    }}
                                  >
                                    {pkg.sector}
                                  </span>
                                )}
                              </div>

                              {pkg.url && (
                                <a
                                  href={pkg.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: '#2563eb',
                                    textDecoration: 'none',
                                  }}
                                >
                                  Xem trên e-GP <ExternalLink size={12} />
                                </a>
                              )}
                            </div>

                            <div
                              style={{
                                fontSize: '0.9375rem',
                                fontWeight: 600,
                                color: 'var(--text-main, #0f172a)',
                                lineHeight: 1.4,
                              }}
                            >
                              {pkg.title}
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: '16px',
                                fontSize: '0.75rem',
                                color: 'var(--text-muted, #64748b)',
                                borderTop: '1px solid var(--border, #f1f5f9)',
                                paddingTop: '8px',
                                marginTop: '4px',
                              }}
                            >
                              {pkg.publish_date && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Calendar size={12} /> Đăng: {pkg.publish_date}
                                </span>
                              )}
                              {pkg.close_date && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b45309' }}>
                                  <Clock size={12} /> Đóng thầu: {pkg.close_date}
                                </span>
                              )}
                              {pkg.status && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={12} color="#059669" /> Trạng thái: {pkg.status}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Articles */}
              {activeTab === 'articles' && (
                <div>
                  {profileLoading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
                      <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                      <p style={{ margin: 0, fontSize: '0.875rem' }}>Đang tổng hợp tin tức liên quan...</p>
                    </div>
                  ) : !profile360?.articles || profile360.articles.length === 0 ? (
                    <div
                      style={{
                        padding: '48px 24px',
                        textAlign: 'center',
                        backgroundColor: 'var(--bg-surface, #ffffff)',
                        borderRadius: '12px',
                        border: '1px dashed var(--border, #e2e8f0)',
                        color: 'var(--text-muted, #64748b)',
                      }}
                    >
                      <Newspaper size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                      <p style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 4px' }}>
                        Chưa tìm thấy bài viết liên quan
                      </p>
                      <p style={{ fontSize: '0.8125rem', margin: 0 }}>
                        Các bài báo nhắc đến tên hoặc tên viết tắt của chủ đầu tư sẽ được cập nhật liên tục tại đây.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {profile360.articles.map((art, idx) => (
                        <NewsCard key={art.id || idx} article={art} index={idx} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Related Tracked Projects */}
              {activeTab === 'projects' && (
                <div>
                  {profileLoading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
                      <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    </div>
                  ) : !profile360?.related_projects || profile360.related_projects.length === 0 ? (
                    <div
                      style={{
                        padding: '48px 24px',
                        textAlign: 'center',
                        backgroundColor: 'var(--bg-surface, #ffffff)',
                        borderRadius: '12px',
                        border: '1px dashed var(--border, #e2e8f0)',
                        color: 'var(--text-muted, #64748b)',
                      }}
                    >
                      <FolderKanban size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                      <p style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 4px' }}>
                        Chưa có dự án nào gán chủ đầu tư này
                      </p>
                      <p style={{ fontSize: '0.8125rem', margin: 0 }}>
                        Bạn có thể tạo hoặc sửa thông tin dự án tại mục Dự án theo dõi và điền tên Chủ đầu tư này.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                      {profile360.related_projects.map((proj) => (
                        <div
                          key={proj.id}
                          style={{
                            backgroundColor: 'var(--bg-surface, #ffffff)',
                            borderRadius: '12px',
                            border: '1px solid var(--border, #e2e8f0)',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                backgroundColor: '#eff6ff',
                                color: '#1d4ed8',
                              }}
                            >
                              {proj.status || 'watching'}
                            </span>
                            {proj.sector_name && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                                {proj.sector_name}
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                            {proj.name}
                          </div>

                          {proj.work_items && (
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)' }}>
                              <strong>Hạng mục:</strong> {proj.work_items}
                            </div>
                          )}

                          <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border, #f1f5f9)' }}>
                            <button
                              type="button"
                              onClick={() => navigate('/projects')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                color: '#2563eb',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                              }}
                            >
                              Xem trong Dự án theo dõi <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Internal Notes */}
              {activeTab === 'notes' && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    borderRadius: '12px',
                    border: '1px solid var(--border, #e2e8f0)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main, #0f172a)' }}>
                      Ghi chú & Đánh giá nội bộ
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingInvestor(selectedInvestor)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#2563eb',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <Pencil size={14} /> Chỉnh sửa ghi chú
                    </button>
                  </div>

                  {selectedInvestor.notes ? (
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-subtle, #f8fafc)',
                        border: '1px solid var(--border, #e2e8f0)',
                        fontSize: '0.9375rem',
                        lineHeight: 1.6,
                        color: 'var(--text-main, #0f172a)',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {selectedInvestor.notes}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '32px',
                        textAlign: 'center',
                        color: 'var(--text-muted, #64748b)',
                        backgroundColor: 'var(--bg-subtle, #f8fafc)',
                        borderRadius: '8px',
                      }}
                    >
                      <Info size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                      <p style={{ margin: 0, fontSize: '0.875rem' }}>Chưa có ghi chú nội bộ cho chủ đầu tư này.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Investor Modal */}
      {showAddModal && (
        <AddInvestorModal
          onClose={() => setShowAddModal(false)}
          onCreated={(newInv) => {
            loadData(false);
            setSelectedInvestorId(newInv.id);
          }}
        />
      )}

      {/* Edit Investor Modal */}
      {editingInvestor && (
        <EditInvestorModal
          investor={editingInvestor}
          onClose={() => setEditingInvestor(null)}
          onSaved={() => {
            loadData(true);
          }}
        />
      )}

      {/* Confirm Delete Modal */}
      {deletingInvestor && (
        <ConfirmModal
          isOpen={true}
          title="Xác nhận xóa Chủ đầu tư"
          message={`Bạn có chắc muốn xóa chủ đầu tư "${deletingInvestor.name}" khỏi danh sách theo dõi? Toàn bộ liên kết và ghi chú sẽ bị hủy bỏ.`}
          itemName={deletingInvestor.name}
          confirmText="Xóa theo dõi"
          cancelText="Hủy"
          type="danger"
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeletingInvestor(null)}
        />
      )}
    </div>
  );
}
