// src/pages/ProjectsPage.jsx
import { useState, useEffect } from 'react';
import {
  FolderKanban, Plus, Trash2, Calendar, Clock, Filter,
  Sparkles, Loader2, ArrowRight, Tag, Layers, ExternalLink, ChevronRight,
  UploadCloud, Building2, ShoppingBag, Newspaper, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projectsService } from '../services/projects';
import { potentialService } from '../services/potential';
import { useLang } from '../context/LanguageContext';
import ConfirmModal from '../components/common/ConfirmModal';
import ProjectImportModal from '../components/ProjectImportModal';
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

  // New project modal / form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [name, setName] = useState('');
  const [keywordFilter, setKeywordFilter] = useState('');
  const [investor, setInvestor] = useState('');
  const [sector, setSector] = useState('');
  const [province, setProvince] = useState('');
  const [status, setStatus] = useState('watching');
  const [createLoading, setCreateLoading] = useState(false);

  // Confirm delete
  const [deletingProject, setDeletingProject] = useState(null);
  const [msg, setMsg] = useState(null);

  const showAlert = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await projectsService.getProjects();
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
      const updatedList = await projectsService.getProjects();
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
    const updated = await projectsService.getProjects().catch(() => null);
    if (updated) {
      setProjects(updated);
      if (!selectedProjectId && updated.length > 0) setSelectedProjectId(updated[0].id);
    }
    loadSummary();
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

        <div style={{ zIndex: 1, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowImportModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 20px', borderRadius: 14,
              background: 'rgba(255,255,255,0.1)', color: 'white',
              fontWeight: 800, fontSize: 13.5,
              border: '1px solid rgba(255,255,255,0.22)', cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <UploadCloud size={18} /> {t('projects.tabImport')} / Profile
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
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        {/* Left Sidebar: Project List */}
        <div style={{
          background: 'var(--bg-surface)', borderRadius: 20, padding: 20,
          border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)', height: 'fit-content',
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
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{
                        fontSize: 14, fontWeight: 800,
                        color: isSelected ? 'var(--brand-700)' : 'var(--text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
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

                      {/* Nhịp tin — chỉ hiện khi có số liệu thật, không hiện "0 tin mới" cho mọi dòng */}
                      {sm && (sm.new_articles > 0 || sm.procurement_matches > 0) && (
                        <div style={{ display: 'flex', gap: 10, marginTop: 5, fontSize: 11, fontWeight: 700 }}>
                          {sm.new_articles > 0 && (
                            <span style={{ color: '#047857', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Newspaper size={11} /> {sm.new_articles} {t('projects.newArticles')}
                            </span>
                          )}
                          {sm.procurement_matches > 0 && (
                            <span style={{ color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <ShoppingBag size={11} /> {sm.procurement_matches}
                            </span>
                          )}
                        </div>
                      )}
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
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
              }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
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
                    </div>
                  )}
                </div>

                {timelineData && (
                  <div style={{
                    fontSize: 13, fontWeight: 800, padding: '6px 16px', borderRadius: 20,
                    background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)',
                  }}>
                    {timelineData.total || timelineData.items?.length || 0} {t('projects.articlesFound')}
                  </div>
                )}
              </div>

              {/* Gói thầu khớp chủ đầu tư — LUÔN kèm ví dụ bấm xem được, vì đối sánh tên
                  cơ quan là đối sánh mờ; một con số trơ trọi thì người dùng không kiểm được. */}
              {selectedSummary?.procurement_matches > 0 && (
                <div style={{
                  marginBottom: 20, padding: 14, borderRadius: 14,
                  background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                    fontSize: 13, fontWeight: 800, color: 'var(--text-primary)',
                  }}>
                    <ShoppingBag size={15} style={{ color: '#1d4ed8' }} />
                    {selectedSummary.procurement_matches} {t('projects.matchedTenders')}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(selectedSummary.procurement_samples || []).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => nav(`/procurement/${encodeURIComponent(s.id)}`)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                          padding: '8px 11px', borderRadius: 10, cursor: 'pointer',
                          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                          fontSize: 12.5, color: 'var(--text-secondary)', width: '100%',
                        }}
                      >
                        <span style={{
                          fontSize: 10.5, fontWeight: 800, padding: '2px 7px', borderRadius: 5,
                          background: '#eff6ff', color: '#1d4ed8', flex: 'none',
                        }}>
                          {s.id}
                        </span>
                        <span style={{
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {s.title}
                        </span>
                        <ChevronRight size={14} style={{ marginLeft: 'auto', flex: 'none' }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline Items */}
              {timelineLoading ? (
                <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Loader2 size={28} className="spin" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{tUI('ui.dang-quet-tin-tuc-theo-dong-thoi-gian')}</div>
                </div>
              ) : !timelineData?.items || timelineData.items.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🗞️</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{tUI('ui.chua-tim-thay-tin-tuc-khop-bo-tu-khoa-nay')}</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>{tUI('ui.du-lieu-tin-tuc-moi-se-tu-dong-cap-nhat-khi-craw')}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {timelineData.items.map((art, idx) => (
                    <div
                      key={art.id || idx}
                      onClick={() => nav(`/article/${art.id}`)}
                      style={{
                        padding: 18, borderRadius: 16, background: 'var(--bg-surface-2)',
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
                      {art.image_url && (
                        <img
                          src={art.image_url}
                          alt=""
                          style={{ width: 100, height: 75, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 8,
                            background: art.source_type === 'gov' ? '#dcfce7' : '#dbeafe',
                            color: art.source_type === 'gov' ? '#15803d' : '#1d4ed8',
                          }}>
                            {art.source_name || (art.source_type === 'gov' ? 'Mua sắm công' : 'Báo chí')}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={12} /> {art.published_at ? new Date(art.published_at).toLocaleDateString('vi-VN') : 'Mới cập nhật'}
                          </span>
                        </div>

                        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px', lineHeight: 1.4 }}>
                          {art.title}
                        </h3>

                        {art.excerpt && (
                          <p style={{
                            fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5,
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>
                            {art.excerpt}
                          </p>
                        )}
                      </div>
                      <ChevronRight size={18} style={{ color: 'var(--text-muted)', alignSelf: 'center' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Centered Modal: Create Project */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
        onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              width: '100%', maxWidth: 480, background: 'var(--bg-surface)',
              borderRadius: 24, padding: 28, border: '1px solid var(--border)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
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
                <input
                  type="text"
                  className="form-input"
                  placeholder={tUI('ui.vi-du-cao-toc-bot-metro')}
                  value={keywordFilter}
                  onChange={(e) => setKeywordFilter(e.target.value)}
                />
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
        </div>
      )}

      {/* Tải Excel / Profile */}
      <ProjectImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={handleImported}
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
