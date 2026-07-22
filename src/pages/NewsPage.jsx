// src/pages/NewsPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronRight, Calendar, Tag, ExternalLink, Cpu, Bookmark, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import {
  getArticlesBySource,
  SOURCES,
  mockWbProjects,
  mockAdbProjects,
  mockProcurementNotices,
  mockProcurementPlans
} from '../data/mockData';
import NewsCard from '../components/NewsCard';

// Additional project translations and AI summaries for ADB
const ADB_PROJECT_EXTRAS = {
  'P48375': {
    titleVi: 'Dự án Chuyển dịch Năng lượng Sạch Việt Nam',
    aiSummary: 'Thúc đẩy phát triển điện gió và mặt trời vùng ĐBSCL, hỗ trợ kỹ thuật và tín dụng xanh.'
  },
  'P48376': {
    titleVi: 'Dự án Phát triển Đô thị và Quản lý Lũ lụt tại TP. Hồ Chí Minh',
    aiSummary: 'Giải quyết ngập úng đô thị lưu vực Tham Lương - Bến Cát bằng nguồn vốn ODA.'
  },
  'P48377': {
    titleVi: 'Sáng kiến Phổ cập Tài chính Số cho Cộng đồng Nông thôn Campuchia',
    aiSummary: 'Số hóa dịch vụ tài chính nông thôn, hỗ trợ tín dụng vi mô cho hộ nghèo.'
  },
  'P48378': {
    titleVi: 'Quỹ Phục hồi Khí hậu Châu Á 2026',
    aiSummary: 'Tài trợ ứng phó thiên tai khẩn cấp và bảo vệ các quốc đảo nhỏ vùng biển.'
  },
  'P48379': {
    titleVi: 'Dự án Kết nối Giao thông Hành lang Kinh tế Mekong mở rộng',
    aiSummary: 'Nâng cấp kết nối logistics đường bộ liên bang biên giới Việt Nam - Lào - Campuchia.'
  },
  'P48380': {
    titleVi: 'Dự án An ninh Nguồn nước Quốc gia Philippines',
    aiSummary: 'Cải thiện hệ thống trữ nước ngọt ứng phó hiện tượng El Nino tại các đảo xa.'
  }
};

// Additional project translations and AI summaries for World Bank
const WB_PROJECT_EXTRAS = {
  'P513206': {
    titleVi: 'Dự án Dinh dưỡng Đa ngành Philippines - Hướng tới Tương lai của Trẻ em',
    aiSummary: 'Can thiệp y tế học đường học đường quy mô lớn nhằm giảm tỷ lệ còi cọc trẻ em.'
  },
  'P510631': {
    titleVi: 'Kế hoạch Quản lý và Phòng chống Lũ lụt Lưu vực Sông Chao Phraya Giai đoạn 2',
    aiSummary: 'Xây dựng hồ chứa cắt lũ bảo vệ thủ đô Bangkok và vùng phụ cận hạ lưu.'
  },
  'P507827': {
    titleVi: 'Dự án Nâng cao Năng lực Cạnh tranh cho Doanh nghiệp vừa và nhỏ Philippines (SME COMPETE +)',
    aiSummary: 'Thúc đẩy số hóa doanh nghiệp, hỗ trợ tiếp cận các chuỗi cung ứng xuất khẩu.'
  },
  'P17123': {
    titleVi: 'Dự án Quản trị và Phát triển Kỹ năng Ngành Đường sắt & Cảng biển Nam Phi',
    aiSummary: 'Cải tổ thể chế cảng biển quốc gia và đào tạo kỹ năng vận hành đường sắt đường thủy.'
  },
  'P513635': {
    titleVi: 'Dự án Đối tác Toàn diện cho Cộng đồng Cải cách Ruộng đất Philippines',
    aiSummary: 'Liên kết chuỗi giá trị nông nghiệp, hỗ trợ kỹ thuật giúp nông hộ tăng thu nhập.'
  },
  'P514469': {
    titleVi: 'Dự án Cơ sở Khử Cacbon Công nghiệp và Năng lực Cạnh tranh Indonesia',
    aiSummary: 'Hỗ trợ kỹ thuật giảm phát thải carbon cho ngành công nghiệp nặng và thép.'
  },
  'P515372': {
    titleVi: 'Dự án Nguồn nước ngầm cho Nông nghiệp Bền vững Indonesia',
    aiSummary: 'Ứng dụng công nghệ tưới nước ngầm thông minh phòng tránh sụt lún đất sạt lở.'
  },
  'P515373': {
    titleVi: 'Dự án An ninh Lương thực và Tưới tiêu Hiện đại hóa Nông nghiệp Indonesia',
    aiSummary: 'Hiện đại hóa kênh mương nội đồng và hồ trữ nước cho các vựa lúa Java.'
  },
  'P512525': {
    titleVi: 'Dự án Phát triển Tài chính và Tăng trưởng Toàn diện Tajikistan (FINGROW)',
    aiSummary: 'Hỗ trợ người dân tiếp cận thanh toán điện tử công cộng vùng biên giới.'
  },
  'P508107': {
    titleVi: 'Chương trình Cải thiện Kết nối Giao thông Đường bộ Quốc gia Indonesia',
    aiSummary: 'Nâng cấp đường quốc lộ liên đảo thúc đẩy giao thương vùng hải đảo xa xôi.'
  },
  'P508202': {
    titleVi: 'Dự án Phục hồi Rừng và Nông nghiệp Thông minh thích ứng Khí hậu Amazon (Brazil)',
    aiSummary: 'Bảo vệ lá phổi xanh Amazon, thúc đẩy tín chỉ carbon và nông nghiệp hữu cơ bản địa.'
  },
  'P512159': {
    titleVi: 'Chương trình Tài trợ Bảo hiểm Y tế Quốc gia Chất lượng và Đáng tin cậy Indonesia (JKN-KUAT)',
    aiSummary: 'Tối ưu hóa quỹ bảo hiểm y tế bao phủ toàn dân Indonesia hướng tới bền vững.'
  }
};

// Reusable Collapsible Filter Section Component
function FilterSection({ label, collapsed, onToggle, children }) {
  return (
    <div className="filter-group">
      <div className="filter-group-header" onClick={onToggle} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        userSelect: 'none',
        marginBottom: '8px',
        color: 'var(--text-secondary)',
        transition: 'color var(--transition-fast)'
      }}>
        <label style={{ margin: 0, cursor: 'pointer', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
        {collapsed ? <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} /> : <ChevronUp size={13} style={{ color: 'var(--text-muted)' }} />}
      </div>
      {!collapsed && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function NewsPage() {
  const { source } = useParams();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [sortBy, setSortBy] = useState('date');

  // World Bank Filters
  const [wbSearch, setWbSearch] = useState('');
  const [wbCountry, setWbCountry] = useState('');
  const [wbStatus, setWbStatus] = useState('');
  const [wbStage, setWbStage] = useState('');
  const [wbApprovalFrom, setWbApprovalFrom] = useState('');
  const [wbApprovalTo, setWbApprovalTo] = useState('');
  const [wbUpdatedFrom, setWbUpdatedFrom] = useState('');
  const [wbUpdatedTo, setWbUpdatedTo] = useState('');

  // World Bank Collapsed Sections
  const [wbCollapsed, setWbCollapsed] = useState({
    country: false,
    status: false,
    stage: false,
    approval: true,
    updated: true,
  });

  const toggleWbCollapse = (key) => {
    setWbCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ADB Filters
  const [adbSearch, setAdbSearch] = useState('');
  const [adbCountry, setAdbCountry] = useState('');
  const [adbStatus, setAdbStatus] = useState('');
  const [adbSector, setAdbSector] = useState('');
  const [adbApprovalFrom, setAdbApprovalFrom] = useState('');
  const [adbApprovalTo, setAdbApprovalTo] = useState('');
  const [adbUpdatedFrom, setAdbUpdatedFrom] = useState('');
  const [adbUpdatedTo, setAdbUpdatedTo] = useState('');

  // ADB Collapsed Sections
  const [adbCollapsed, setAdbCollapsed] = useState({
    country: false,
    status: false,
    sector: false,
    approval: true,
    updated: true,
  });

  const toggleAdbCollapse = (key) => {
    setAdbCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Mua Sắm Công (Đấu Thầu) Tabs & Filters
  const [dtTab, setDtTab] = useState('notice'); // notice | plan
  const [dtSearch, setDtSearch] = useState('');

  // Bookmarks state (persisted in local storage or state)
  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem('iih_bookmarks');
    return saved ? JSON.parse(saved) : {};
  });

  const toggleBookmark = (id) => {
    setBookmarks(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem('iih_bookmarks', JSON.stringify(updated));
      return updated;
    });
  };

  const src = SOURCES[source];
  const allArticles = getArticlesBySource(source === 'all' ? null : source);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, [source, dtTab]);

  // World Bank dynamic dropdown options
  const wbCountries = Array.from(new Set(mockWbProjects.map(p => p.country))).sort();
  const wbStatuses = Array.from(new Set(mockWbProjects.map(p => p.status))).sort();
  const wbStages = Array.from(new Set(mockWbProjects.map(p => p.lastStage))).sort();

  // ADB dynamic dropdown options
  const adbCountries = Array.from(new Set(mockAdbProjects.map(p => p.country))).sort();
  const adbStatuses = Array.from(new Set(mockAdbProjects.map(p => p.status))).sort();
  const adbSectors = Array.from(new Set(mockAdbProjects.map(p => p.sector))).sort();

  // World Bank Filter Logic
  const filteredWb = mockWbProjects.filter(p => {
    const q = wbSearch.toLowerCase();
    const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.projectId.toLowerCase().includes(q);
    const matchesCountry = !wbCountry || p.country === wbCountry;
    const matchesStatus = !wbStatus || p.status === wbStatus;
    const matchesStage = !wbStage || p.lastStage === wbStage;
    
    let matchesApproval = true;
    if (wbApprovalFrom) matchesApproval = matchesApproval && p.approvalDate >= wbApprovalFrom;
    if (wbApprovalTo) matchesApproval = matchesApproval && p.approvalDate <= wbApprovalTo;

    let matchesUpdated = true;
    if (wbUpdatedFrom) matchesUpdated = matchesUpdated && p.lastUpdatedDate && p.lastUpdatedDate >= wbUpdatedFrom;
    if (wbUpdatedTo) matchesUpdated = matchesUpdated && p.lastUpdatedDate && p.lastUpdatedDate <= wbUpdatedTo;

    return matchesSearch && matchesCountry && matchesStatus && matchesStage && matchesApproval && matchesUpdated;
  });

  // ADB Filter Logic
  const filteredAdb = mockAdbProjects.filter(p => {
    const q = adbSearch.toLowerCase();
    const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.projectId.toLowerCase().includes(q);
    const matchesCountry = !adbCountry || p.country === adbCountry;
    const matchesStatus = !adbStatus || p.status === adbStatus;
    const matchesSector = !adbSector || p.sector === adbSector;
    
    let matchesApproval = true;
    if (adbApprovalFrom) matchesApproval = matchesApproval && p.approvalDate >= adbApprovalFrom;
    if (adbApprovalTo) matchesApproval = matchesApproval && p.approvalDate <= adbApprovalTo;

    let matchesUpdated = true;
    if (adbUpdatedFrom) matchesUpdated = matchesUpdated && p.lastUpdatedDate && p.lastUpdatedDate >= adbUpdatedFrom;
    if (adbUpdatedTo) matchesUpdated = matchesUpdated && p.lastUpdatedDate && p.lastUpdatedDate <= adbUpdatedTo;

    return matchesSearch && matchesCountry && matchesStatus && matchesSector && matchesApproval && matchesUpdated;
  });

  // Mua Sắm Công Filter Logic
  const filteredDtNotices = mockProcurementNotices.filter(n => {
    const q = dtSearch.toLowerCase();
    return !q || n.id.toLowerCase().includes(q) || n.title.toLowerCase().includes(q) || n.procuringEntity.toLowerCase().includes(q) || n.orgCode.toLowerCase().includes(q);
  });

  const filteredDtPlans = mockProcurementPlans.filter(p => {
    const q = dtSearch.toLowerCase();
    return !q || p.id.toLowerCase().includes(q) || p.title.toLowerCase().includes(q) || p.procuringEntity.toLowerCase().includes(q) || p.orgCode.toLowerCase().includes(q);
  });

  // Standard Articles Filter Logic (for All)
  const filteredArticles = allArticles.filter(a => {
    const q = search.toLowerCase();
    return !q || (a.titleVi || a.title).toLowerCase().includes(q)
      || (a.excerptVi || a.excerpt).toLowerCase().includes(q)
      || a.category?.toLowerCase().includes(q);
  });

  const sortedArticles = [...filteredArticles].sort((a, b) => {
    if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'amount') {
      const getNum = (amt) => {
        if (!amt) return 0;
        const clean = amt.replace(/[^0-9.]/g, '');
        return parseFloat(clean) || 0;
      };
      return getNum(b.amount) - getNum(a.amount);
    }
    if (sortBy === 'category') return (a.category || '').localeCompare(b.category || '');
    return 0;
  });

  const resetWbFilters = () => {
    setWbSearch('');
    setWbCountry('');
    setWbStatus('');
    setWbStage('');
    setWbApprovalFrom('');
    setWbApprovalTo('');
    setWbUpdatedFrom('');
    setWbUpdatedTo('');
  };

  const resetAdbFilters = () => {
    setAdbSearch('');
    setAdbCountry('');
    setAdbStatus('');
    setAdbSector('');
    setAdbApprovalFrom('');
    setAdbApprovalTo('');
    setAdbUpdatedFrom('');
    setAdbUpdatedTo('');
  };

  const renderDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return <span style={{ color: 'var(--text-muted)' }}>N/A</span>;
    const [date, time] = dateTimeStr.split(' ');
    const [y, m, d] = date.split('-');
    return (
      <div style={{ lineHeight: '1.4' }}>
        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{time}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{`${d}/${m}/${y}`}</div>
      </div>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return <span style={{ color: 'var(--text-muted)' }}>N/A</span>;
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  // Dynamic record counts helper
  const getRecordCount = () => {
    if (source === 'worldbank') return mockWbProjects.length;
    if (source === 'adb') return mockAdbProjects.length;
    if (source === 'dauthau') return mockProcurementNotices.length + mockProcurementPlans.length;
    return allArticles.length;
  };

  // Header style based on source
  const headerStyle = src
    ? { background: `linear-gradient(135deg, ${src.color}22, ${src.color}08)`, borderColor: `${src.color}33` }
    : { background: 'linear-gradient(135deg, var(--brand-50), var(--bg-surface-2))' };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span onClick={() => nav('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</span>
        <ChevronRight size={12} className="breadcrumb-sep" />
        <span>Nguồn Dữ Liệu</span>
        <ChevronRight size={12} className="breadcrumb-sep" />
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          {src?.fullName ?? 'Tất Cả Nguồn'}
        </span>
      </div>

      {/* Page Header Card */}
      <div style={{
        ...headerStyle,
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-5) var(--space-6)',
        marginBottom: 'var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-5)',
      }}>
        {src ? (
          <>
            <div style={{
              width: 52, height: 52,
              background: src.bg,
              borderRadius: 'var(--radius-lg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
              border: `1px solid ${src.color}44`,
              flexShrink: 0,
            }}>
              {src.icon}
            </div>
            <div>
              <h1 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 20, fontWeight: 800,
                color: 'var(--text-primary)', letterSpacing: -0.3,
              }}>
                {src.fullName}
              </h1>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
                {src.desc} · {getRecordCount()} bản ghi đã thu thập
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 600, color: src.color,
                  padding: '5px 12px',
                  background: `${src.color}15`,
                  borderRadius: 'var(--radius-full)',
                  border: `1px solid ${src.color}30`,
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={11} /> Trang chính thức
              </a>
            </div>
          </>
        ) : (
          <div>
            <h1 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 20, fontWeight: 800, color: 'var(--text-primary)',
            }}>
              🗂️ Tất Cả Nguồn Dữ Liệu
            </h1>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
              Tổng hợp từ ADB, World Bank và Đấu thầu Quốc gia · {allArticles.length} bài viết
            </div>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} style={{
              height: 64, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12,
              padding: '0 20px', display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div className="skeleton" style={{ width: 24, height: 16, borderRadius: 4 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 16, width: '60%', borderRadius: 4, marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 11, width: '30%', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Render Views based on source */
        (() => {
          // ── WORLD BANK PROJECT VIEW ─────────────────────────────────
          if (source === 'worldbank') {
            return (
              <div className="wb-layout">
                {/* Left filter sidebar */}
                <aside className="filter-sidebar">
                  <div className="filter-title">
                    <Filter size={15} />
                    <span>Bộ lọc dự án</span>
                  </div>

                  <div className="filter-group">
                    <label>Tên dự án / ID</label>
                    <div className="search-bar" style={{ width: '100%', margin: '6px 0 0 0' }}>
                      <Search size={14} className="search-icon" />
                      <input
                        type="text"
                        className="search-input"
                        style={{ width: '100%' }}
                        placeholder="Tìm tên hoặc ID..."
                        value={wbSearch}
                        onChange={e => setWbSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <FilterSection
                    label="Quốc gia"
                    collapsed={wbCollapsed.country}
                    onToggle={() => toggleWbCollapse('country')}
                  >
                    <select
                      className="filter-control"
                      value={wbCountry}
                      onChange={e => setWbCountry(e.target.value)}
                    >
                      <option value="">Chọn quốc gia...</option>
                      {wbCountries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </FilterSection>

                  <FilterSection
                    label="Trạng thái"
                    collapsed={wbCollapsed.status}
                    onToggle={() => toggleWbCollapse('status')}
                  >
                    <select
                      className="filter-control"
                      value={wbStatus}
                      onChange={e => setWbStatus(e.target.value)}
                    >
                      <option value="">Chọn trạng thái...</option>
                      {wbStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </FilterSection>

                  <FilterSection
                    label="Giai đoạn"
                    collapsed={wbCollapsed.stage}
                    onToggle={() => toggleWbCollapse('stage')}
                  >
                    <select
                      className="filter-control"
                      value={wbStage}
                      onChange={e => setWbStage(e.target.value)}
                    >
                      <option value="">Chọn giai đoạn...</option>
                      {wbStages.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </FilterSection>

                  <FilterSection
                    label="Ngày phê duyệt"
                    collapsed={wbCollapsed.approval}
                    onToggle={() => toggleWbCollapse('approval')}
                  >
                    <div className="date-range-inputs">
                      <div>
                        <span>Từ</span>
                        <input
                          type="date"
                          className="filter-control"
                          value={wbApprovalFrom}
                          onChange={e => setWbApprovalFrom(e.target.value)}
                        />
                      </div>
                      <div>
                        <span>Đến</span>
                        <input
                          type="date"
                          className="filter-control"
                          value={wbApprovalTo}
                          onChange={e => setWbApprovalTo(e.target.value)}
                        />
                      </div>
                    </div>
                  </FilterSection>

                  <FilterSection
                    label="Cập nhật cuối"
                    collapsed={wbCollapsed.updated}
                    onToggle={() => toggleWbCollapse('updated')}
                  >
                    <div className="date-range-inputs">
                      <div>
                        <span>Từ</span>
                        <input
                          type="date"
                          className="filter-control"
                          value={wbUpdatedFrom}
                          onChange={e => setWbUpdatedFrom(e.target.value)}
                        />
                      </div>
                      <div>
                        <span>Đến</span>
                        <input
                          type="date"
                          className="filter-control"
                          value={wbUpdatedTo}
                          onChange={e => setWbUpdatedTo(e.target.value)}
                        />
                      </div>
                    </div>
                  </FilterSection>

                  <button className="btn-reset-filters" onClick={resetWbFilters}>
                    <RotateCcw size={12} style={{ marginRight: 6, display: 'inline-block', verticalAlign: 'middle' }} />
                    Xóa tất cả bộ lọc
                  </button>
                </aside>

                {/* Right data table */}
                <div className="data-table-container">
                  <div className="table-results-header">
                    <span className="table-results-count">
                      Hiển thị {filteredWb.length > 0 ? `1 - ${filteredWb.length}` : '0'} của {filteredWb.length} dự án
                    </span>
                  </div>

                  <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th className="cell-save">Lưu</th>
                          <th>Project Title</th>
                          <th>Country</th>
                          <th>Project ID</th>
                          <th>Commitment Amount</th>
                          <th>Status</th>
                          <th>Approval Date</th>
                          <th>Last updated Date</th>
                          <th>Last Stage Reached</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredWb.length === 0 ? (
                          <tr>
                            <td colSpan="9" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                              Không tìm thấy dự án nào khớp với bộ lọc.
                            </td>
                          </tr>
                        ) : (
                          filteredWb.map(p => (
                            <tr key={p.id}>
                              <td className="cell-save">
                                <button
                                  className={`bookmark-btn ${bookmarks[p.id] ? 'active' : ''}`}
                                  onClick={() => toggleBookmark(p.id)}
                                  title="Lưu dự án"
                                >
                                  <Bookmark size={15} fill={bookmarks[p.id] ? 'currentColor' : 'none'} />
                                </button>
                              </td>
                              <td className="cell-project-title" onClick={() => nav(`/article/worldbank`)}>
                                <div className="project-title-text" style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13.5px', marginBottom: '2px' }}>
                                  {WB_PROJECT_EXTRAS[p.projectId]?.titleVi || p.title}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  {p.title}
                                </div>
                                <div style={{
                                  display: 'flex', alignItems: 'center', gap: '6px',
                                  fontSize: '11.5px', color: '#7c3aed', fontWeight: 500,
                                  marginTop: '6px', background: 'rgba(124,58,237,0.06)',
                                  padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                                  width: 'fit-content'
                                }}>
                                  <span className="ai-badge" style={{ padding: '1px 5px', fontSize: '9px', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                    <Cpu size={8} />AI
                                  </span>
                                  {WB_PROJECT_EXTRAS[p.projectId]?.aiSummary || 'Phân tích: Hỗ trợ cải tổ hạ tầng kỹ thuật và thích ứng biến đổi khí hậu.'}
                                </div>
                              </td>
                              <td>{p.country}</td>
                              <td>
                                <span className="cell-code">{p.projectId}</span>
                              </td>
                              <td className="cell-amount wb">{p.amount}</td>
                              <td>
                                <span className="status-badge pipeline">{p.status}</span>
                              </td>
                              <td className="cell-date">{formatDate(p.approvalDate)}</td>
                              <td className="cell-date">{formatDate(p.lastUpdatedDate)}</td>
                              <td>
                                <span className={`status-badge ${
                                  p.lastStage.toLowerCase().includes('concept') ? 'concept-review' :
                                  p.lastStage.toLowerCase().includes('appraisal') ? 'appraisal' : 'negotiation'
                                }`}>
                                  {p.lastStage}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          }

          // ── ADB PROJECT VIEW ────────────────────────────────────────
          if (source === 'adb') {
            return (
              <div className="wb-layout">
                {/* Left filter sidebar */}
                <aside className="filter-sidebar">
                  <div className="filter-title">
                    <Filter size={15} />
                    <span>Bộ lọc dự án ADB</span>
                  </div>

                  <div className="filter-group">
                    <label>Tên dự án / ID</label>
                    <div className="search-bar" style={{ width: '100%', margin: '6px 0 0 0' }}>
                      <Search size={14} className="search-icon" />
                      <input
                        type="text"
                        className="search-input"
                        style={{ width: '100%' }}
                        placeholder="Tìm tên hoặc ID..."
                        value={adbSearch}
                        onChange={e => setAdbSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <FilterSection
                    label="Quốc gia / Vùng"
                    collapsed={adbCollapsed.country}
                    onToggle={() => toggleAdbCollapse('country')}
                  >
                    <select
                      className="filter-control"
                      value={adbCountry}
                      onChange={e => setAdbCountry(e.target.value)}
                    >
                      <option value="">Chọn quốc gia...</option>
                      {adbCountries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </FilterSection>

                  <FilterSection
                    label="Lĩnh vực (Sector)"
                    collapsed={adbCollapsed.sector}
                    onToggle={() => toggleAdbCollapse('sector')}
                  >
                    <select
                      className="filter-control"
                      value={adbSector}
                      onChange={e => setAdbSector(e.target.value)}
                    >
                      <option value="">Chọn lĩnh vực...</option>
                      {adbSectors.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </FilterSection>

                  <FilterSection
                    label="Trạng thái"
                    collapsed={adbCollapsed.status}
                    onToggle={() => toggleAdbCollapse('status')}
                  >
                    <select
                      className="filter-control"
                      value={adbStatus}
                      onChange={e => setAdbStatus(e.target.value)}
                    >
                      <option value="">Chọn trạng thái...</option>
                      {adbStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </FilterSection>

                  <FilterSection
                    label="Ngày phê duyệt"
                    collapsed={adbCollapsed.approval}
                    onToggle={() => toggleAdbCollapse('approval')}
                  >
                    <div className="date-range-inputs">
                      <div>
                        <span>Từ</span>
                        <input
                          type="date"
                          className="filter-control"
                          value={adbApprovalFrom}
                          onChange={e => setAdbApprovalFrom(e.target.value)}
                        />
                      </div>
                      <div>
                        <span>Đến</span>
                        <input
                          type="date"
                          className="filter-control"
                          value={adbApprovalTo}
                          onChange={e => setAdbApprovalTo(e.target.value)}
                        />
                      </div>
                    </div>
                  </FilterSection>

                  <FilterSection
                    label="Cập nhật cuối"
                    collapsed={adbCollapsed.updated}
                    onToggle={() => toggleAdbCollapse('updated')}
                  >
                    <div className="date-range-inputs">
                      <div>
                        <span>Từ</span>
                        <input
                          type="date"
                          className="filter-control"
                          value={adbUpdatedFrom}
                          onChange={e => setAdbUpdatedFrom(e.target.value)}
                        />
                      </div>
                      <div>
                        <span>Đến</span>
                        <input
                          type="date"
                          className="filter-control"
                          value={adbUpdatedTo}
                          onChange={e => setAdbUpdatedTo(e.target.value)}
                        />
                      </div>
                    </div>
                  </FilterSection>

                  <button className="btn-reset-filters" onClick={resetAdbFilters}>
                    <RotateCcw size={12} style={{ marginRight: 6, display: 'inline-block', verticalAlign: 'middle' }} />
                    Xóa tất cả bộ lọc
                  </button>
                </aside>

                {/* Right data table */}
                <div className="data-table-container">
                  <div className="table-results-header">
                    <span className="table-results-count">
                      Hiển thị {filteredAdb.length > 0 ? `1 - ${filteredAdb.length}` : '0'} của {filteredAdb.length} dự án ADB
                    </span>
                  </div>

                  <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th className="cell-save">Lưu</th>
                          <th>Project Title</th>
                          <th>Country</th>
                          <th>Project ID</th>
                          <th>Commitment Amount</th>
                          <th>Status</th>
                          <th>Approval Date</th>
                          <th>Last updated Date</th>
                          <th>Sector</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAdb.length === 0 ? (
                          <tr>
                            <td colSpan="9" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                              Không tìm thấy dự án nào khớp với bộ lọc.
                            </td>
                          </tr>
                        ) : (
                          filteredAdb.map(p => (
                            <tr key={p.id}>
                              <td className="cell-save">
                                <button
                                  className={`bookmark-btn ${bookmarks[p.id] ? 'active' : ''}`}
                                  onClick={() => toggleBookmark(p.id)}
                                  title="Lưu dự án"
                                >
                                  <Bookmark size={15} fill={bookmarks[p.id] ? 'currentColor' : 'none'} />
                                </button>
                              </td>
                              <td className="cell-project-title" onClick={() => nav(`/article/adb`)}>
                                <div className="project-title-text" style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13.5px', marginBottom: '2px' }}>
                                  {ADB_PROJECT_EXTRAS[p.projectId]?.titleVi || p.title}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  {p.title}
                                </div>
                                <div style={{
                                  display: 'flex', alignItems: 'center', gap: '6px',
                                  fontSize: '11.5px', color: '#d97706', fontWeight: 500,
                                  marginTop: '6px', background: 'rgba(217,119,6,0.06)',
                                  padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                                  width: 'fit-content'
                                }}>
                                  <span className="ai-badge" style={{ padding: '1px 5px', fontSize: '9px', background: 'linear-gradient(135deg, #d97706, #fbbf24)', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                    <Cpu size={8} />AI
                                  </span>
                                  {ADB_PROJECT_EXTRAS[p.projectId]?.aiSummary || 'Phân tích: Hỗ trợ kỹ thuật và đầu tư cơ sở hạ tầng vùng.'}
                                </div>
                              </td>
                              <td>{p.country}</td>
                              <td>
                                <span className="cell-code">{p.projectId}</span>
                              </td>
                              <td className="cell-amount wb" style={{ color: 'var(--color-adb)' }}>{p.amount}</td>
                              <td>
                                <span className={`status-badge ${
                                  p.status.toLowerCase() === 'approved' ? 'pipeline' :
                                  p.status.toLowerCase() === 'active' ? 'negotiation' : 'appraisal'
                                }`}>{p.status}</span>
                              </td>
                              <td className="cell-date">{formatDate(p.approvalDate)}</td>
                              <td className="cell-date">{formatDate(p.lastUpdatedDate)}</td>
                              <td>
                                <span className="status-badge concept-review">{p.sector}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          }

          // ── MUA SẮM CÔNG VIEW ───────────────────────────────────────
          if (source === 'dauthau') {
            const dtData = dtTab === 'notice' ? filteredDtNotices : filteredDtPlans;
            return (
              <div className="data-table-container">
                {/* Tabs & Search inline header (COMPACT & BEAUTIFUL) */}
                <div className="procurement-tabs-header" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 'var(--space-4)'
                }}>
                  <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'center' }}>
                    <label className={`procurement-tab-radio ${dtTab === 'notice' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="procurement-tab"
                        checked={dtTab === 'notice'}
                        onChange={() => setDtTab('notice')}
                      />
                      Thông báo mời thầu
                    </label>
                    <label className={`procurement-tab-radio ${dtTab === 'plan' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="procurement-tab"
                        checked={dtTab === 'plan'}
                        onChange={() => setDtTab('plan')}
                      />
                      Kế hoạch lựa chọn nhà thầu
                    </label>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div className="search-bar" style={{ width: 280, margin: 0 }}>
                      <Search size={14} className="search-icon" />
                      <input
                        type="text"
                        className="search-input"
                        style={{ width: '100%' }}
                        placeholder="Tìm kiếm nhanh..."
                        value={dtSearch}
                        onChange={e => setDtSearch(e.target.value)}
                      />
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      Hiển thị {dtData.length} bản ghi
                    </div>
                  </div>
                </div>

                {/* Table Data */}
                <div className="data-table-wrapper">
                  <table className="data-table">
                    {dtTab === 'notice' ? (
                      /* Thông báo mời thầu */
                      <>
                        <thead>
                          <tr>
                            <th className="cell-save">Lưu</th>
                            <th>Mã TBMT</th>
                            <th>Tên dự án</th>
                            <th>Mã đơn vị</th>
                            <th>Bên mời thầu</th>
                            <th>Ngày đăng tải</th>
                            <th>Đóng thầu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dtData.length === 0 ? (
                            <tr>
                              <td colSpan="7" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                                Không tìm thấy thông báo mời thầu nào.
                              </td>
                            </tr>
                          ) : (
                            dtData.map(n => (
                              <tr key={n.id}>
                                <td className="cell-save">
                                  <button
                                    className={`bookmark-btn ${bookmarks[n.id] ? 'active' : ''}`}
                                    onClick={() => toggleBookmark(n.id)}
                                    title="Lưu thông báo"
                                  >
                                    <Bookmark size={15} fill={bookmarks[n.id] ? 'currentColor' : 'none'} />
                                  </button>
                                </td>
                                <td>
                                  <span className="cell-code">{n.id}</span>
                                </td>
                                <td className="cell-project-title" onClick={() => nav(`/article/dauthau`)}>
                                  <span className="project-title-text">{n.title}</span>
                                </td>
                                <td>
                                  <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{n.orgCode}</span>
                                </td>
                                <td style={{ maxWidth: 300, color: 'var(--text-secondary)' }}>{n.procuringEntity}</td>
                                <td>{renderDateTime(n.publishDate)}</td>
                                <td>{renderDateTime(n.closeDate)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </>
                    ) : (
                      /* Kế hoạch lựa chọn nhà thầu */
                      <>
                        <thead>
                          <tr>
                            <th className="cell-save">Lưu</th>
                            <th>Mã KHLCNT</th>
                            <th>Tên dự án</th>
                            <th>Mã đơn vị</th>
                            <th>Bên mời thầu</th>
                            <th>Ngày đăng tải</th>
                            <th style={{ textAlign: 'center' }}>Số lượng gói thầu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dtData.length === 0 ? (
                            <tr>
                              <td colSpan="7" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                                Không tìm thấy kế hoạch lựa chọn nhà thầu nào.
                              </td>
                            </tr>
                          ) : (
                            dtData.map(p => (
                              <tr key={p.id}>
                                <td className="cell-save">
                                  <button
                                    className={`bookmark-btn ${bookmarks[p.id] ? 'active' : ''}`}
                                    onClick={() => toggleBookmark(p.id)}
                                    title="Lưu kế hoạch"
                                  >
                                    <Bookmark size={15} fill={bookmarks[p.id] ? 'currentColor' : 'none'} />
                                  </button>
                                </td>
                                <td>
                                  <span className="cell-code">{p.id}</span>
                                </td>
                                <td className="cell-project-title" onClick={() => nav(`/article/dauthau`)}>
                                  <span className="project-title-text">{p.title}</span>
                                </td>
                                <td>
                                  <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{p.orgCode}</span>
                                </td>
                                <td style={{ maxWidth: 300, color: 'var(--text-secondary)' }}>{p.procuringEntity}</td>
                                <td>{renderDateTime(p.publishDate)}</td>
                                <td className="cell-package-count">
                                  <span style={{
                                    padding: '4px 10px', background: 'var(--bg-surface-2)',
                                    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                                    fontWeight: 700, color: 'var(--brand-600)'
                                  }}>
                                    {p.packageCount}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </>
                    )}
                  </table>
                </div>
              </div>
            );
          }

          // ── DEFAULT CARD VIEWS (For News, or All Sources) ──────────
          return (
            <>
              {/* Toolbar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                marginBottom: 'var(--space-5)', flexWrap: 'wrap',
              }}>
                {/* Search */}
                <div className="search-bar" style={{ width: 'auto', flex: '1 1 200px', maxWidth: 340 }}>
                  <Search size={14} className="search-icon" />
                  <input
                    id="input-news-search"
                    className="search-input"
                    style={{ width: '100%' }}
                    placeholder="Tìm kiếm trong nguồn này..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
                  {/* Sort */}
                  <select
                    id="select-sort"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    style={{
                      padding: '7px 12px', fontSize: 12, fontWeight: 600,
                      border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-surface)', color: 'var(--text-primary)',
                      cursor: 'pointer', outline: 'none',
                    }}
                  >
                    <option value="date">Mới nhất</option>
                    <option value="amount">Giá trị</option>
                    <option value="category">Lĩnh vực</option>
                  </select>

                  {/* View toggle */}
                  <div style={{
                    display: 'flex',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                  }}>
                    {['grid', 'list'].map(m => (
                      <button
                        key={m}
                        id={`btn-view-${m}`}
                        onClick={() => setViewMode(m)}
                        style={{
                          padding: '7px 14px', fontSize: 12, fontWeight: 600,
                          background: viewMode === m ? 'var(--brand-600)' : 'var(--bg-surface)',
                          color: viewMode === m ? 'white' : 'var(--text-secondary)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {m === 'grid' ? '⊞ Grid' : '☰ List'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Results Count */}
              {search && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Tìm thấy <strong style={{ color: 'var(--text-primary)' }}>{sortedArticles.length}</strong> kết quả cho "{search}"
                </div>
              )}

              {sortedArticles.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔍</div>
                  <div className="empty-title">Không tìm thấy kết quả</div>
                  <div className="empty-sub">Thử tìm với từ khóa khác</div>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="news-grid">
                  {sortedArticles.map((a, i) => <NewsCard key={a.id} article={a} index={i} />)}
                </div>
              ) : (
                <div className="news-table-wrapper">
                  {sortedArticles.map((a, idx) => {
                    const s = SOURCES[a.source];
                    const hasCover = a.source !== 'adb' && a.source !== 'worldbank' && a.source !== 'dauthau';
                    return (
                      <div
                        key={a.id}
                        className="news-table-row"
                        onClick={() => nav(`/article/${a.id}`)}
                        id={`list-row-${a.id}`}
                        style={{ display: 'flex', gap: 'var(--space-5)', padding: '16px var(--space-6)' }}
                      >
                        {/* Index Number */}
                        <div className="news-table-num" style={{ alignSelf: 'center', margin: 0 }}>{String(idx + 1).padStart(2, '0')}</div>
                        
                        {/* Cover Image / Emoji gradient (Only render if hasCover is true) */}
                        {hasCover ? (
                          <div style={{
                            width: 80, height: 80, borderRadius: 'var(--radius-md)',
                            background: a.gradient 
                              ? `linear-gradient(135deg, ${a.gradient[0]}, ${a.gradient[1]})` 
                              : s.bg,
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 32, flexShrink: 0,
                            overflow: 'hidden',
                            border: '1px solid var(--border-subtle)'
                          }}>
                            {a.coverUrl ? (
                              <img src={a.coverUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                            ) : (
                              a.coverEmoji || '📰'
                            )}
                          </div>
                        ) : (
                          /* Spacing placeholder to keep alignment synchronized with cover items */
                          <div style={{ width: 80, height: 80, flexShrink: 0 }} />
                        )}

                        {/* Content Area */}
                        <div className="news-table-content" style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                          {/* Title */}
                          <div className="news-table-title" style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'normal', overflow: 'visible', marginBottom: 0, lineHeight: 1.4 }}>
                            {a.titleVi || a.title}
                          </div>

                          {/* Source & Meta Tags */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: 'var(--radius-full)',
                              background: s.color, color: 'white', fontSize: '10px', fontWeight: 700,
                              display: 'inline-flex', alignItems: 'center', gap: '3px'
                            }}>
                              <span>{s.icon}</span>{s.name}
                            </span>
                            {a.category && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '11px', color: 'var(--text-muted)' }}>
                                <Tag size={10} />{a.category}
                              </span>
                            )}
                          </div>

                          {/* Metadata Grid (if database project card) */}
                          {!hasCover && (
                            <div style={{
                              display: 'flex',
                              gap: '12px',
                              padding: '6px 10px',
                              background: 'var(--bg-surface-2)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '11px',
                              color: 'var(--text-secondary)',
                              flexWrap: 'wrap',
                              marginTop: '2px'
                            }}>
                              <div>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Mã: </span>
                                <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{a.id}</span>
                              </div>
                              <div>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Quốc gia: </span>
                                <span style={{ fontWeight: 700 }}>{a.country || 'Việt Nam'}</span>
                              </div>
                              {a.deadline && (
                                <div>
                                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Hạn cuối: </span>
                                  <span style={{ fontWeight: 700, color: '#ef4444' }}>{a.deadline}</span>
                                </div>
                              )}
                              {a.amount && (
                                <div>
                                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Quy mô: </span>
                                  <span style={{ fontWeight: 700, color: s.color }}>{a.amount}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Description Excerpt */}
                          <p style={{
                            fontSize: '12.5px',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.45,
                            margin: 0,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {a.excerptVi || a.excerpt}
                          </p>

                          {/* AI Summary strip */}
                          {a.aiSummary && (
                            <div style={{
                              background: 'rgba(168,85,247,0.04)',
                              border: '1px dashed rgba(168,85,247,0.2)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '6px 10px',
                              fontSize: '12px',
                              lineHeight: '1.4',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              gap: '6px',
                              alignItems: 'center',
                              marginTop: '2px'
                            }}>
                              <span className="ai-badge" style={{ padding: '1px 5px', fontSize: '9px', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '3px', animation: 'none' }}>
                                <Cpu size={8} />AI
                              </span>
                              <span>{a.aiSummary}</span>
                            </div>
                          )}
                        </div>

                        {/* Right column (Values & Dates) */}
                        <div className="news-table-right" style={{ alignSelf: 'flex-start', paddingTop: '4px', gap: '6px' }}>
                          {a.amount && (
                            <span style={{ fontSize: 12, fontWeight: 800, color: s.color, background: s.bg, padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: `1px solid ${s.color}30` }}>{a.amount}</span>
                          )}
                          {a.status && (
                            <span style={{
                              fontSize: 10, fontWeight: 700,
                              color: a.status === 'Đang mở thầu' ? '#10b981' : '#f59e0b',
                              background: a.status === 'Đang mở thầu' ? '#ecfdf5' : '#fffbeb',
                              padding: '2px 6px', borderRadius: 'var(--radius-sm)',
                              border: `1px solid ${a.status === 'Đang mở thầu' ? '#a7f3d0' : '#fde68a'}`
                            }}>{a.status}</span>
                          )}
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-muted)', marginTop: '4px' }}>
                            <Calendar size={10} />
                            {new Date(a.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()
      )}
    </div>
  );
}

