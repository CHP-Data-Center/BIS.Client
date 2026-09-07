// src/pages/ProjectsPage.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FolderKanban, Plus, Trash2, Calendar, Filter,
  Sparkles, Loader2, Layers, ChevronRight, ChevronLeft,
  UploadCloud, Building2, ShoppingBag, Newspaper, Search, FileSpreadsheet, Download,
  LayoutGrid, List, Maximize2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projectsService } from '../services/projects';
import { potentialService } from '../services/potential';
import { useLang } from '../context/LanguageContext';
import ConfirmModal from '../components/common/ConfirmModal';
import ProjectImportModal from '../components/ProjectImportModal';
import ProcurementListModal from '../components/ProcurementListModal';
import { tUI } from '../locales';

// Nhãn + màu trạng thái nghiệp vụ của dự án theo dõi.
const STATUS_META = {
  watching:  { key: 'projects.statusWatching',  bg: '#eff6ff', fg: '#1d4ed8' },
  active:    { key: 'projects.statusActive',    bg: '#ecfdf5', fg: '#047857' },
  completed: { key: 'projects.statusCompleted', bg: '#f5f3ff', fg: '#6d28d9' },
  closed:    { key: 'projects.statusClosed',    bg: '#f8fafc', fg: '#64748b' },
};

export default function ProjectsPage() {
  const { t } = useLang();
  const nav = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Nhịp tin gần đây theo dự án (/projects/summary), khóa theo project id.
  const [summary, setSummary] = useState({});

  // Danh mục lĩnh vực cho ô chọn khi tạo/lọc.
  const [sectors, setSectors] = useState([]);

  // Bộ lọc danh sách
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');

  // Timeline state
  const [timelineData, setTimelineData] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Tối ưu hiển thị Timeline khi có nhiều bài (phân trang, lọc nguồn, chế độ xem)
  const [timelineFilterType, setTimelineFilterType] = useState('all'); // 'all' | 'news' | 'gov'
  const [timelineSearch, setTimelineSearch] = useState('');
  const [timelineViewMode, setTimelineViewMode] = useState(() => localStorage.getItem('bis_project_timeline_view_mode') || 'card');
  const [timelinePage, setTimelinePage] = useState(1);
  const [timelinePageSize, setTimelinePageSize] = useState(10);

  // New project modal / form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showProcurementModal, setShowProcurementModal] = useState(false);
  const [name, setName] = useState('');
  const [keywordFilter, setKeywordFilter] = useState('');
  const [investor, setInvestor] = useState('');
  const [sector, setSector] = useState('');
  const [province, setProvince] = useState('');
  const [status, setStatus] = useState('watching');
  const [createLoading, setCreateLoading] = useState(false);

  // Gợi ý từ khóa: form tạo (suggesting) và dự án đã có (regenId = id đang xử lý)
  const [suggesting, setSuggesting] = useState(false);
  const [regenId, setRegenId] = useState(null);

  // Confirm delete
  const [deletingProject, setDeletingProject] = useState(null);
  const [msg, setMsg] = useState(null);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [downloadingSample, setDownloadingSample] = useState(false);

  const showAlert = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleExportExcel = async () => {
    if (projects.length === 0) {
      showAlert('error', 'Chưa có dự án nào trong danh sách để xuất.');
      return;
    }
    setExportingExcel(true);
    try {
      await projectsService.exportProjectsExcel();
      showAlert('success', 'Đã xuất danh sách dự án thành công!');
    } catch (err) {
      console.error('Export error:', err);
      showAlert('error', 'Không thể xuất file Excel. Vui lòng thử lại.');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleDownloadSample = async () => {
    setDownloadingSample(true);
    try {
      await projectsService.downloadSampleExcel();
      showAlert('success', 'Đã tải file Excel mẫu thành công!');
    } catch (err) {
      console.error('Download sample error:', err);
      showAlert('error', 'Không thể tải file mẫu. Vui lòng thử lại.');
    } finally {
      setDownloadingSample(false);
    }
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await projectsService.getProjects(true);
      const list = data || [];
      setProjects(list);
      if (list.length > 0 && !selectedProjectId) {
        setSelectedProjectId(list[0].id);
      }
    } catch (e) {
      console.warn('Failed to load projects:', e);
      showAlert('error', 'Không thể tải danh sách dự án theo dõi.');
    } finally {
      setLoading(false);
    }
  };

  // Nhịp tin gần đây — tải RIÊNG và không chặn danh sách: endpoint này quét nhiều dữ liệu
  // hơn hẳn, để nó chậm thì cả trang chậm theo.
  const loadSummary = async () => {
    try {
      const res = await projectsService.getSummary(7, 50);
      const map = {};
      (res.items || []).forEach((row) => { map[row.project.id] = row; });
      setSummary(map);
    } catch {
      setSummary({});
    }
  };

  useEffect(() => {
    loadProjects();
    loadSummary();
    potentialService.getSectors().then(setSectors).catch(() => setSectors([]));
  }, []);

  // Fetch timeline when selected project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setTimelineData(null);
      return;
    }
    const loadTimeline = async () => {
      setTimelineLoading(true);
      try {
        const res = await projectsService.getTimeline(selectedProjectId, 100);
        setTimelineData(res);
      } catch (e) {
        console.warn('Failed to load project timeline:', e);
        showAlert('error', 'Không thể tải dòng thời gian dự án.');
      } finally {
        setTimelineLoading(false);
      }
    };
    loadTimeline();
  }, [selectedProjectId]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreateLoading(true);
    try {
      const created = await projectsService.createProject({
        name: name.trim(),
        // Bỏ trống từ khóa thì lấy chính tên dự án — người dùng không phải gõ hai lần.
        keyword_filter: keywordFilter.trim() || name.trim(),
        // Chỉ gửi trường có giá trị: gửi chuỗi rỗng sẽ ghi đè thành rỗng chứ không phải "bỏ qua".
        investor: investor.trim() || undefined,
        sector: sector || undefined,
        province: province.trim() || undefined,
        status: status || undefined,
      });
      setName(''); setKeywordFilter(''); setInvestor('');
      setSector(''); setProvince(''); setStatus('watching');
      setShowCreateModal(false);
      showAlert('success', `Đã tạo dự án theo dõi "${created.name}"!`);
      // force=true: getProjects() có cache localStorage 5 phút, không ép thì dự án vừa tạo chưa hiện.
      const updatedList = await projectsService.getProjects(true);
      setProjects(updatedList || []);
      setSelectedProjectId(created.id);
      loadSummary();
    } catch (e) {
      showAlert('error', e.response?.data?.detail || 'Không thể tạo dự án mới.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Sau khi nhập từ Excel / Profile: nạp lại cả danh sách lẫn nhịp tin.
  const handleImported = async () => {
    // force=true: bỏ qua cache localStorage 5 phút của getProjects(), không thì dự án vừa nhập chưa hiện.
    const updated = await projectsService.getProjects(true).catch(() => null);
    if (updated) {
      setProjects(updated);
      if (!selectedProjectId && updated.length > 0) setSelectedProjectId(updated[0].id);
    }
    loadSummary();
  };

  const nhanNguon = (source) =>
    t(source === 'ai' ? 'projects.keywordsAi' : 'projects.keywordsRules');

  // Gợi ý từ khóa cho form tạo — điền vào ô, người dùng vẫn sửa được trước khi lưu.
  const suggestKeywords = async () => {
    if (!name.trim()) return;
    setSuggesting(true);
    try {
      const res = await projectsService.extractKeywords(name.trim());
      if (!res.keyword_filter) {
        showAlert('error', 'Không rút được từ khóa từ tên này — hãy nhập tay.');
        return;
      }
      setKeywordFilter(res.keyword_filter);
      showAlert('success', t('projects.keywordsFilled', {
        count: res.keywords.length, source: nhanNguon(res.source),
      }));
    } catch (e) {
      showAlert('error', e.response?.data?.detail || 'Không gợi ý được từ khóa.');
    } finally {
      setSuggesting(false);
    }
  };

  // Gợi ý lại cho dự án ĐÃ CÓ — sửa những dự án từng bị nhét nguyên tiêu đề làm từ khóa.
  const regenKeywords = async (p) => {
    setRegenId(p.id);
    try {
      const res = await projectsService.extractKeywords(p.name);
      if (!res.keyword_filter) {
        showAlert('error', 'Không rút được từ khóa từ tên này.');
        return;
      }
      const updated = await projectsService.updateProject(p.id, { keyword_filter: res.keyword_filter });
      setProjects((cur) => cur.map((x) => (x.id === updated.id ? updated : x)));
      showAlert('success', t('projects.keywordsFilled', {
        count: res.keywords.length, source: nhanNguon(res.source),
      }));
      // Từ khóa đổi thì dòng thời gian đổi theo.
      setTimelineLoading(true);
      const tl = await projectsService.getTimeline(p.id, 100).catch(() => null);
      if (tl) setTimelineData(tl);
      loadSummary();
    } catch (e) {
      showAlert('error', e.response?.data?.detail || 'Không gợi ý lại được từ khóa.');
    } finally {
      setRegenId(null);
      setTimelineLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deletingProject) return;
    try {
      await projectsService.deleteProject(deletingProject.id);
      showAlert('success', `Đã xóa dự án "${deletingProject.name}".`);
      const updated = projects.filter(p => p.id !== deletingProject.id);
      setProjects(updated);
      if (selectedProjectId === deletingProject.id) {
        setSelectedProjectId(updated[0]?.id || null);
      }
    } catch (e) {
      showAlert('error', 'Không thể xóa dự án.');
    } finally {
      setDeletingProject(null);
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedSummary = summary[selectedProjectId];

  // Lọc phía client: danh sách dự án theo dõi của một người hiếm khi quá vài chục dòng,
  // gọi lại API cho mỗi ký tự gõ vào ô tìm là lãng phí.
  const norm = (s) => (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');
  const qn = norm(q.trim());
  const visibleProjects = projects.filter((p) => {
    if (statusFilter && (p.status || 'watching') !== statusFilter) return false;
    if (sectorFilter && p.sector !== sectorFilter) return false;
    if (qn && !norm(p.name).includes(qn) && !norm(p.investor).includes(qn)) return false;
    return true;
  });

  // Lấy danh sách gói thầu khớp của dự án được chọn (từ summary hoặc timelineData)
  const currentTenders = selectedSummary?.procurement_samples || timelineData?.procurement_samples || [];
  const currentTendersCount = selectedSummary?.procurement_matches !== undefined
    ? selectedSummary.procurement_matches
    : (timelineData?.procurement_matches !== undefined ? timelineData.procurement_matches : currentTenders.length);

  // Chuẩn hóa các gói thầu e-GP thành các item dòng thời gian để hiển thị khi người dùng lọc tab Mua sắm công
  const procurementTimelineItems = currentTenders.map(t => ({
    id: t.id,
    title: t.title,
    excerpt: t.procuring_entity ? `Bên mời thầu: ${t.procuring_entity}` : '',
    source_name: 'Đấu thầu Quốc gia (e-GP)',
    source_type: 'gov',
    published_at: t.publish_date,
    url: t.url || 'https://muasamcong.mpi.gov.vn/',
    is_procurement: true,
    procuring_entity: t.procuring_entity,
  }));

  // Lọc và phân trang bài viết + gói thầu Timeline của dự án
  const rawNewsArticles = (timelineData?.items || []).filter(a => a.source_type !== 'gov');
  const rawGovArticles = (timelineData?.items || []).filter(a => a.source_type === 'gov');

  const newsArticlesCount = rawNewsArticles.length;
  const allGovItems = [...rawGovArticles, ...procurementTimelineItems];
  const govArticlesCount = allGovItems.length;

  const rawCombinedItems = [...rawNewsArticles, ...allGovItems];

  const filteredTimelineArticles = rawCombinedItems.filter(a => {
    if (timelineFilterType === 'news' && (a.source_type === 'gov' || a.is_procurement)) return false;
    if (timelineFilterType === 'gov' && !(a.source_type === 'gov' || a.is_procurement)) return false;
    if (timelineSearch.trim()) {
      const qText = norm(timelineSearch.trim());
      const inId = a.id ? norm(a.id).includes(qText) : false;
      const inTitle = norm(a.title || '').includes(qText);
      const inExcerpt = norm(a.excerpt || '').includes(qText);
      const inSource = norm(a.source_name || '').includes(qText);
      const inEntity = a.procuring_entity ? norm(a.procuring_entity).includes(qText) : false;
      if (!inId && !inTitle && !inExcerpt && !inSource && !inEntity) return false;
    }
    return true;
  });

  const totalFilteredTimeline = filteredTimelineArticles.length;
  const totalTimelinePages = Math.max(1, Math.ceil(totalFilteredTimeline / timelinePageSize));
  const validTimelinePage = Math.min(timelinePage, totalTimelinePages);
  const pagedTimelineArticles = filteredTimelineArticles.slice(
    (validTimelinePage - 1) * timelinePageSize,
    validTimelinePage * timelinePageSize
  );

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 100px)' }}>
      {/* Toast message */}
      {msg && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 14, fontSize: 13.5, fontWeight: 700,
          background: msg.type === 'success' ? '#10b981' : '#ef4444', color: 'white',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        }}>
          {msg.text}
        </div>
      )}

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        borderRadius: 24, padding: '28px 32px', color: 'white',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 12px 36px rgba(15,23,42,0.25)',
        marginBottom: 24, border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, zIndex: 1 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 20,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(59,130,246,0.4)',
          }}>
            <FolderKanban size={30} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              {t('projects.title')}
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>
              {t('projects.subtitle')}
            </p>
          </div>
        </div>

        <div style={{ zIndex: 1, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleDownloadSample}
            disabled={downloadingSample}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '11px 16px', borderRadius: 14,
              background: 'rgba(255,255,255,0.08)', color: 'white',
              fontWeight: 700, fontSize: 13,
              border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            title="Tải file Excel mẫu chuẩn (.xlsx) để lập danh sách theo dõi"
          >
            {downloadingSample ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : <FileSpreadsheet size={16} />}
            Tải mẫu Excel
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exportingExcel}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '11px 16px', borderRadius: 14,
              background: 'rgba(255,255,255,0.08)', color: 'white',
              fontWeight: 700, fontSize: 13,
              border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            title="Xuất toàn bộ danh sách dự án đang theo dõi ra file Excel"
          >
            {exportingExcel ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Download size={16} />}
            Xuất Excel
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 18px', borderRadius: 14,
              background: 'rgba(255,255,255,0.12)', color: 'white',
              fontWeight: 800, fontSize: 13,
              border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <UploadCloud size={17} /> {t('projects.tabImport')} / Profile
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 22px', borderRadius: 14,
              background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
              color: 'white', fontWeight: 800, fontSize: 13.5, border: 'none',
              boxShadow: '0 6px 20px rgba(59,130,246,0.4)', cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <Plus size={18} /> {t('projects.createBtn')}
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="projects-layout-grid">
        {/* Left Sidebar: Project List */}
        <div style={{
          background: 'var(--bg-surface)', borderRadius: 20, padding: 20,
          border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)', height: 'fit-content',
          minWidth: 0,
        }}>
          <div style={{
            fontSize: 14, fontWeight: 900, color: 'var(--text-primary)',
            paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>{t('projects.projectList')} ({visibleProjects.length}/{projects.length})</span>
            <Layers size={16} style={{ color: 'var(--brand-500)' }} />
          </div>

          {/* Bộ lọc — chỉ hiện khi có đủ dự án để việc lọc thật sự có ích */}
          {projects.length > 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{
                  position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  type="search" value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder={t('projects.searchPlaceholder')}
                  style={{
                    width: '100%', padding: '8px 11px 8px 32px', borderRadius: 10, fontSize: 12.5,
                    border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    flex: 1, minWidth: 0, padding: '7px 9px', borderRadius: 10, fontSize: 12,
                    border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
                    color: 'var(--text-primary)', cursor: 'pointer',
                  }}
                >
                  <option value="">{t('projects.allStatuses')}</option>
                  {Object.entries(STATUS_META).map(([k, m]) => (
                    <option key={k} value={k}>{t(m.key)}</option>
                  ))}
                </select>
                <select
                  value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)}
                  style={{
                    flex: 1, minWidth: 0, padding: '7px 9px', borderRadius: 10, fontSize: 12,
                    border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
                    color: 'var(--text-primary)', cursor: 'pointer',
                  }}
                >
                  <option value="">{t('projects.allSectors')}</option>
                  {sectors.map((s) => (
                    <option key={s.slug} value={s.slug}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: 12 }}>{t('common.loading')}</div>
            </div>
          ) : projects.length === 0 ? (
            <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{t('projects.emptyTitle')}</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>{t('projects.emptySub')}</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {visibleProjects.length === 0 && (
                <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5 }}>
                  Không có dự án nào khớp bộ lọc.
                </div>
              )}
              {visibleProjects.map((p) => {
                const isSelected = p.id === selectedProjectId;
                const sm = summary[p.id];
                const st = STATUS_META[p.status || 'watching'] || STATUS_META.watching;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    style={{
                      padding: '12px 16px', borderRadius: 14, cursor: 'pointer',
                      background: isSelected ? 'var(--brand-50)' : 'var(--bg-surface-2)',
                      border: `1.5px solid ${isSelected ? 'var(--brand-400)' : 'transparent'}`,
                      transition: 'all 0.15s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <div style={{
                        fontSize: 14, fontWeight: 800,
                        color: isSelected ? 'var(--brand-700)' : 'var(--text-primary)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.35,
                      }}>
                        {p.name}
                      </div>

                      {/* Nhãn: trạng thái · lĩnh vực · nguồn gốc */}
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 5 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 5,
                          background: st.bg, color: st.fg,
                        }}>
                          {t(st.key)}
                        </span>
                        {p.sector_name && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                            background: 'var(--bg-surface)', color: 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                          }}>
                            {p.sector_name}
                          </span>
                        )}
                        {p.origin && p.origin !== 'manual' && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                            background: 'var(--bg-surface)', color: 'var(--text-muted)',
                            border: '1px solid var(--border)',
                          }}>
                            {t(p.origin === 'excel' ? 'projects.originExcel' : 'projects.originProfile')}
                          </span>
                        )}
                      </div>

                      {p.investor && (
                        <div style={{
                          fontSize: 11, color: 'var(--text-muted)', marginTop: 4,
                          display: 'flex', alignItems: 'center', gap: 5,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          <Building2 size={11} style={{ flex: 'none' }} /> {p.investor}
                        </div>
                      )}

                      {/* Thống kê bài viết và gói thầu tìm thấy — đồng bộ chính xác với số hiển thị */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, fontSize: 11.5, fontWeight: 700, flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Newspaper size={12} style={{ color: 'var(--brand-600)' }} />
                          {(isSelected && timelineData ? (timelineData.total ?? timelineData.items?.length) : (sm?.total_articles ?? 0)) || 0} bài viết
                          {sm?.new_articles > 0 && (
                            <span style={{
                              fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 10,
                              background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0',
                            }}>
                              +{sm.new_articles} mới
                            </span>
                          )}
                        </span>
                        {(sm?.procurement_matches > 0 || (isSelected && currentTendersCount > 0)) && (
                          <span style={{ color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ShoppingBag size={12} /> {isSelected && currentTendersCount > 0 ? currentTendersCount : sm.procurement_matches} gói thầu
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingProject(p);
                      }}
                      title={t('common.delete')}
                      style={{
                        background: 'transparent', border: 'none', color: '#ef4444',
                        cursor: 'pointer', padding: 6, borderRadius: 8, opacity: 0.7,
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Area: Timeline View */}
        <div style={{
          background: 'var(--bg-surface)', borderRadius: 20, padding: 24,
          border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          minWidth: 0, overflow: 'hidden',
        }}>
          {!selectedProject ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
              <FolderKanban size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 700 }}>{t('projects.selectProject')}</div>
            </div>
          ) : (
            <div>
              {/* Project Details Header */}
              <div style={{
                paddingBottom: 16, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14,
              }}>
                <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                  <h2 style={{
                    fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0,
                    wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.35
                  }}>
                    {selectedProject.name}
                  </h2>
                  {selectedProject.keyword_filter && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{t('projects.trackedKeywords')}:</span>
                      {selectedProject.keyword_filter.split(',').map((kw, idx) => (
                        <span key={idx} style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                          background: 'var(--brand-50)', color: 'var(--brand-700)',
                          border: '1px solid var(--brand-200)',
                        }}>
                          #{kw.trim()}
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={() => regenKeywords(selectedProject)}
                        disabled={regenId === selectedProject.id}
                        title={t('projects.keywordsHint')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                          border: '1px dashed var(--border)', background: 'transparent',
                          color: 'var(--text-secondary)', cursor: 'pointer',
                          opacity: regenId === selectedProject.id ? 0.6 : 1,
                        }}
                      >
                        {regenId === selectedProject.id
                          ? <Loader2 size={11} className="spin" style={{ animation: 'spin 0.8s linear infinite' }} />
                          : <Sparkles size={11} />}
                        {t('projects.regenKeywords')}
                      </button>
                    </div>
                  )}
                </div>

                {timelineData && (
                  <div style={{
                    fontSize: 13, fontWeight: 800, padding: '6px 16px', borderRadius: 20,
                    background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)',
                    flexShrink: 0,
                  }}>
                    {newsArticlesCount} bài viết {currentTendersCount > 0 ? `· ${currentTendersCount} gói thầu` : ''}
                  </div>
                )}
              </div>

              {/* Timeline Items Section */}
              {timelineLoading ? (
                <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Loader2 size={28} className="spin" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{tUI('ui.dang-quet-tin-tuc-theo-dong-thoi-gian')}</div>
                </div>
              ) : rawCombinedItems.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🗞️</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{tUI('ui.chua-tim-thay-tin-tuc-khop-bo-tu-khoa-nay')}</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>{tUI('ui.du-lieu-tin-tuc-moi-se-tu-dong-cap-nhat-khi-craw')}</div>
                </div>
              ) : (
                <div>
                  {/* Timeline Control Toolbar */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 10, padding: '10px 14px', marginBottom: 16,
                    background: 'var(--bg-surface-2)', borderRadius: 14, border: '1px solid var(--border-subtle)',
                  }}>
                    {/* Source Filter Tabs */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => { setTimelineFilterType('all'); setTimelinePage(1); }}
                        style={{
                          padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          border: timelineFilterType === 'all' ? '1px solid var(--brand-500)' : '1px solid transparent',
                          background: timelineFilterType === 'all' ? 'var(--brand-50, rgba(37,99,235,0.1))' : 'transparent',
                          color: timelineFilterType === 'all' ? 'var(--brand-600, #2563eb)' : 'var(--text-secondary)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Tất cả ({rawCombinedItems.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => { setTimelineFilterType('news'); setTimelinePage(1); }}
                        style={{
                          padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          border: timelineFilterType === 'news' ? '1px solid #3b82f6' : '1px solid transparent',
                          background: timelineFilterType === 'news' ? 'rgba(59,130,246,0.1)' : 'transparent',
                          color: timelineFilterType === 'news' ? '#2563eb' : 'var(--text-secondary)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        📰 Báo chí ({newsArticlesCount})
                      </button>

                      <button
                        type="button"
                        onClick={() => { setTimelineFilterType('gov'); setTimelinePage(1); }}
                        style={{
                          padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          border: timelineFilterType === 'gov' ? '1px solid #10b981' : '1px solid transparent',
                          background: timelineFilterType === 'gov' ? 'rgba(16,185,129,0.1)' : 'transparent',
                          color: timelineFilterType === 'gov' ? '#059669' : 'var(--text-secondary)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        🏛️ {currentTendersCount > 0 ? 'Gói thầu khớp CĐT' : 'Mua sắm công'} ({govArticlesCount})
                      </button>
                    </div>

                    {/* Controls: Search, View Mode, Page Size */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {/* Search in Timeline */}
                      <div style={{ position: 'relative', width: 170 }}>
                        <Search size={12} style={{
                          position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
                          color: 'var(--text-muted)', pointerEvents: 'none',
                        }} />
                        <input
                          type="search"
                          placeholder="Lọc bài viết, gói thầu..."
                          value={timelineSearch}
                          onChange={(e) => { setTimelineSearch(e.target.value); setTimelinePage(1); }}
                          style={{
                            width: '100%', height: 30, padding: '4px 8px 4px 28px', borderRadius: 8,
                            fontSize: 11.5, border: '1px solid var(--border)', background: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>

                      {/* View Mode Switch */}
                      <div style={{
                        display: 'flex', alignItems: 'center', background: 'var(--bg-surface)',
                        border: '1px solid var(--border)', borderRadius: 8, padding: 2,
                      }}>
                        <button
                          type="button"
                          onClick={() => {
                            setTimelineViewMode('card');
                            localStorage.setItem('bis_project_timeline_view_mode', 'card');
                          }}
                          title="Xem dạng thẻ"
                          style={{
                            background: timelineViewMode === 'card' ? 'var(--brand-50, rgba(37,99,235,0.12))' : 'transparent',
                            border: 'none', borderRadius: 6, padding: '4px 7px', cursor: 'pointer',
                            color: timelineViewMode === 'card' ? 'var(--brand-600, #2563eb)' : 'var(--text-muted)',
                            display: 'flex', alignItems: 'center',
                          }}
                        >
                          <LayoutGrid size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTimelineViewMode('compact');
                            localStorage.setItem('bis_project_timeline_view_mode', 'compact');
                          }}
                          title="Xem dòng tinh gọn"
                          style={{
                            background: timelineViewMode === 'compact' ? 'var(--brand-50, rgba(37,99,235,0.12))' : 'transparent',
                            border: 'none', borderRadius: 6, padding: '4px 7px', cursor: 'pointer',
                            color: timelineViewMode === 'compact' ? 'var(--brand-600, #2563eb)' : 'var(--text-muted)',
                            display: 'flex', alignItems: 'center',
                          }}
                        >
                          <List size={14} />
                        </button>
                      </div>

                      {/* Page Size Select */}
                      <select
                        value={timelinePageSize}
                        onChange={(e) => { setTimelinePageSize(Number(e.target.value)); setTimelinePage(1); }}
                        style={{
                          height: 30, padding: '2px 6px', borderRadius: 8, fontSize: 11.5,
                          border: '1px solid var(--border)', background: 'var(--bg-surface)',
                          color: 'var(--text-secondary)', cursor: 'pointer',
                        }}
                      >
                        <option value="10">10 bài/trang</option>
                        <option value="20">20 bài/trang</option>
                        <option value="50">50 bài/trang</option>
                      </select>
                    </div>
                  </div>

                  {/* Banner hiển thị thông tin chủ đầu tư & nút mở rộng popup khi đang xem tab Gói thầu khớp CĐT */}
                  {timelineFilterType === 'gov' && currentTendersCount > 0 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 16px', marginBottom: 16, borderRadius: 12,
                      background: 'linear-gradient(to right, rgba(37,99,235,0.06), rgba(37,99,235,0.02))',
                      border: '1px solid rgba(37,99,235,0.18)',
                      flexWrap: 'wrap', gap: 10,
                    }}>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ShoppingBag size={16} style={{ color: '#2563eb', flexShrink: 0 }} />
                        <span>
                          Đang hiển thị <strong>{govArticlesCount}</strong> gói thầu khớp chủ đầu tư: <strong>{selectedProject?.investor || selectedProject?.name}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowProcurementModal(true)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          fontSize: 12, fontWeight: 800, padding: '5px 12px', borderRadius: 8,
                          background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
                          cursor: 'pointer', transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                        onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
                      >
                        <Maximize2 size={13} /> Mở rộng toàn màn hình ({currentTendersCount})
                      </button>
                    </div>
                  )}

                  {/* Empty Filter Result */}
                  {totalFilteredTimeline === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>🔍</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>Không tìm thấy bài viết nào khớp bộ lọc.</div>
                      <button
                        type="button"
                        onClick={() => { setTimelineFilterType('all'); setTimelineSearch(''); }}
                        style={{
                          marginTop: 10, padding: '5px 12px', borderRadius: 8, border: 'none',
                          background: 'var(--brand-50)', color: 'var(--brand-600)', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        Đặt lại bộ lọc
                      </button>
                    </div>
                  ) : timelineViewMode === 'compact' ? (
                    /* ─── Compact List Mode ─── */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {pagedTimelineArticles.map((art, idx) => {
                        const isProc = art.is_procurement;
                        return (
                          <div
                            key={art.id || idx}
                            onClick={() => isProc ? nav(`/procurement/${encodeURIComponent(art.id)}`) : nav(`/article/${art.id}`)}
                            style={{
                              padding: '10px 14px', borderRadius: 12, background: 'var(--bg-surface-2)',
                              border: '1px solid var(--border-subtle)', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = 'var(--brand-400)';
                              e.currentTarget.style.background = 'var(--bg-surface)';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = 'var(--border-subtle)';
                              e.currentTarget.style.background = 'var(--bg-surface-2)';
                              e.currentTarget.style.transform = 'none';
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{
                                fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6, flexShrink: 0,
                                background: isProc ? '#eff6ff' : (art.source_type === 'gov' ? '#dcfce7' : '#dbeafe'),
                                color: isProc ? '#1d4ed8' : (art.source_type === 'gov' ? '#15803d' : '#1d4ed8'),
                              }}>
                                {isProc ? '🏛️ e-GP' : (art.source_name || (art.source_type === 'gov' ? 'Mua sắm công' : 'Báo chí'))}
                              </span>
                              {isProc && (
                                <span style={{
                                  fontSize: 10.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4,
                                  background: '#f1f5f9', color: '#1e40af', fontFamily: 'monospace', flexShrink: 0,
                                }}>
                                  {art.id}
                                </span>
                              )}
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                                {art.published_at ? (art.published_at.includes('-') ? art.published_at.slice(0, 10) : new Date(art.published_at).toLocaleDateString('vi-VN')) : ''}
                              </span>
                              <div style={{
                                fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0
                              }}>
                                {art.title}
                              </div>
                            </div>
                            <ChevronRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* ─── Card View Mode ─── */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {pagedTimelineArticles.map((art, idx) => {
                        const isProc = art.is_procurement;
                        return (
                          <div
                            key={art.id || idx}
                            onClick={() => isProc ? nav(`/procurement/${encodeURIComponent(art.id)}`) : nav(`/article/${art.id}`)}
                            style={{
                              padding: 16, borderRadius: 16, background: 'var(--bg-surface-2)',
                              border: '1px solid var(--border-subtle)', cursor: 'pointer',
                              transition: 'all 0.2s ease', position: 'relative',
                              display: 'flex', gap: 16, alignItems: 'flex-start',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = 'var(--brand-400)';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = 'var(--border-subtle)';
                              e.currentTarget.style.transform = 'none';
                            }}
                          >
                            {isProc ? (
                              <div style={{
                                width: 85, height: 65, borderRadius: 10,
                                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                color: '#1d4ed8', flexShrink: 0, border: '1px solid #bfdbfe', gap: 4,
                              }}>
                                <ShoppingBag size={22} />
                                <span style={{ fontSize: 9.5, fontWeight: 800 }}>GÓI THẦU</span>
                              </div>
                            ) : art.image_url ? (
                              <img
                                src={art.image_url}
                                alt=""
                                style={{ width: 95, height: 70, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                                onError={(e) => e.target.style.display = 'none'}
                              />
                            ) : null}

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                                <span style={{
                                  fontSize: 10.5, fontWeight: 800, padding: '2px 7px', borderRadius: 6,
                                  background: isProc ? '#eff6ff' : (art.source_type === 'gov' ? '#dcfce7' : '#dbeafe'),
                                  color: isProc ? '#1d4ed8' : (art.source_type === 'gov' ? '#15803d' : '#1d4ed8'),
                                }}>
                                  {isProc ? '🏛️ Đấu thầu Quốc gia (e-GP)' : (art.source_name || (art.source_type === 'gov' ? 'Mua sắm công' : 'Báo chí'))}
                                </span>
                                {isProc && (
                                  <span style={{
                                    fontSize: 10.5, fontWeight: 800, padding: '1px 7px', borderRadius: 4,
                                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                                    color: '#1e40af', fontFamily: 'monospace',
                                  }}>
                                    {art.id}
                                  </span>
                                )}
                                <span style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Calendar size={11} /> {art.published_at ? (art.published_at.includes('-') ? art.published_at.slice(0, 16) : new Date(art.published_at).toLocaleDateString('vi-VN')) : 'Mới cập nhật'}
                                </span>
                              </div>

                              <h3 style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 5px', lineHeight: 1.35, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                {art.title}
                              </h3>

                              {art.excerpt && (
                                <p style={{
                                  fontSize: 12.5, color: 'var(--text-muted)', margin: 0, lineHeight: 1.45,
                                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                  wordBreak: 'break-word', overflowWrap: 'anywhere'
                                }}>
                                  {art.excerpt}
                                </p>
                              )}
                            </div>
                            <ChevronRight size={18} style={{ color: 'var(--text-muted)', alignSelf: 'center', flexShrink: 0 }} />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pagination Toolbar */}
                  {totalTimelinePages > 1 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: 10, marginTop: 18, paddingTop: 14,
                      borderTop: '1px solid var(--border-subtle)',
                    }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Hiển thị <strong>{(validTimelinePage - 1) * timelinePageSize + 1}–{Math.min(validTimelinePage * timelinePageSize, totalFilteredTimeline)}</strong> trên <strong>{totalFilteredTimeline}</strong> bài viết
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <button
                          type="button"
                          disabled={validTimelinePage <= 1}
                          onClick={() => setTimelinePage(prev => Math.max(1, prev - 1))}
                          style={{
                            padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                            border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
                            cursor: validTimelinePage <= 1 ? 'not-allowed' : 'pointer',
                            opacity: validTimelinePage <= 1 ? 0.4 : 1, color: 'var(--text-primary)',
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          <ChevronLeft size={13} /> Trước
                        </button>

                        {Array.from({ length: totalTimelinePages }, (_, i) => i + 1)
                          .filter(p => p === 1 || p === totalTimelinePages || Math.abs(p - validTimelinePage) <= 1)
                          .reduce((acc, p, i, arr) => {
                            if (i > 0 && p - arr[i - 1] > 1) acc.push('ellipsis');
                            acc.push(p);
                            return acc;
                          }, [])
                          .map((item, idx) => {
                            if (item === 'ellipsis') {
                              return <span key={`ell-${idx}`} style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: 12 }}>...</span>;
                            }
                            const isActive = item === validTimelinePage;
                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() => setTimelinePage(item)}
                                style={{
                                  width: 30, height: 30, borderRadius: 8, fontSize: 12, fontWeight: 800,
                                  border: isActive ? '1.5px solid var(--brand-500)' : '1px solid var(--border)',
                                  background: isActive ? 'var(--brand-500)' : 'var(--bg-surface-2)',
                                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                                  cursor: 'pointer', transition: 'all 0.15s ease',
                                }}
                              >
                                {item}
                              </button>
                            );
                          })}

                        <button
                          type="button"
                          disabled={validTimelinePage >= totalTimelinePages}
                          onClick={() => setTimelinePage(prev => Math.min(totalTimelinePages, prev + 1))}
                          style={{
                            padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                            border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
                            cursor: validTimelinePage >= totalTimelinePages ? 'not-allowed' : 'pointer',
                            opacity: validTimelinePage >= totalTimelinePages ? 0.4 : 1, color: 'var(--text-primary)',
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          Sau <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Centered Modal: Create Project */}
      {showCreateModal && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 1000000,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            boxSizing: 'border-box',
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'var(--bg-surface)',
              borderRadius: 24,
              padding: 28,
              border: '1px solid var(--border)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
              margin: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 16px' }}>
              ➕ {t('projects.modalTitle')}
            </h3>

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">{t('projects.nameLabel')} *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={tUI('ui.vi-du-du-an-cao-toc-bac-nam')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">{t('projects.keywordsLabel')}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={tUI('ui.vi-du-cao-toc-bot-metro')}
                    value={keywordFilter}
                    onChange={(e) => setKeywordFilter(e.target.value)}
                    style={{ flex: 1, minWidth: 0 }}
                  />
                  <button
                    type="button"
                    onClick={suggestKeywords}
                    disabled={suggesting || !name.trim()}
                    title={t('projects.keywordsHint')}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, flex: 'none',
                      padding: '0 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
                      border: '1px solid var(--brand-400)', background: 'var(--brand-50)',
                      color: 'var(--brand-700)',
                      cursor: suggesting || !name.trim() ? 'default' : 'pointer',
                      opacity: suggesting || !name.trim() ? 0.55 : 1,
                    }}
                  >
                    {suggesting ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
                    {t('projects.suggestKeywords')}
                  </button>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 5, lineHeight: 1.5 }}>
                  {t('projects.keywordsHint')}
                </div>
              </div>

              <div>
                <label className="form-label">{t('projects.investor')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Ban QLDA giao thông Hà Nội"
                  value={investor}
                  onChange={(e) => setInvestor(e.target.value)}
                />
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 5, lineHeight: 1.5 }}>
                  Khai chủ đầu tư để hệ thống đối chiếu với bên mời thầu trên cổng đấu thầu.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                  <label className="form-label">{t('projects.sector')}</label>
                  <select
                    className="form-input"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                  >
                    <option value="">—</option>
                    {sectors.map((s) => (
                      <option key={s.slug} value={s.slug}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                  <label className="form-label">{t('projects.status')}</label>
                  <select
                    className="form-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {Object.entries(STATUS_META).map(([k, m]) => (
                      <option key={k} value={k}>{t(m.key)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">{t('projects.province')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Hà Nội"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowCreateModal(false)}
                  style={{ background: 'var(--bg-surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {createLoading ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                  {t('projects.createBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Tải Excel / Profile */}
      <ProjectImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={handleImported}
      />

      {/* Modal Popup Toàn bộ gói thầu khớp chủ đầu tư */}
      <ProcurementListModal
        open={showProcurementModal}
        onClose={() => setShowProcurementModal(false)}
        projectName={selectedProject?.name}
        investorName={selectedProject?.investor}
        tenders={currentTenders}
      />

      {/* Confirm Delete Modal */}
      {deletingProject && (
        <ConfirmModal
          isOpen={true}
          title={t('projects.deleteConfirmTitle')}
          message={t('projects.deleteConfirmMsg')}
          itemName={deletingProject?.name}
          confirmText={t('common.delete')}
          cancelText={t('common.cancel')}
          type="danger"
          onConfirm={handleDeleteProject}
          onClose={() => setDeletingProject(null)}
        />
      )}
    </div>
  );
}
