// src/pages/ProjectsPage.jsx
import { useState, useEffect } from 'react';
import { 
  FolderKanban, Plus, Trash2, Calendar, Clock, Filter, 
  Sparkles, Loader2, ArrowRight, Tag, Layers, ExternalLink, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projectsService } from '../services/projects';
import { useLang } from '../context/LanguageContext';
import ConfirmModal from '../components/common/ConfirmModal';

export default function ProjectsPage() {
  const { t } = useLang();
  const nav = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  
  // Timeline state
  const [timelineData, setTimelineData] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // New project modal / form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [keywordFilter, setKeywordFilter] = useState('');
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

  useEffect(() => {
    loadProjects();
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
        keyword_filter: keywordFilter.trim(),
      });
      setName('');
      setKeywordFilter('');
      setShowCreateModal(false);
      showAlert('success', `Đã tạo dự án theo dõi "${created.name}"!`);
      const updatedList = await projectsService.getProjects();
      setProjects(updatedList || []);
      setSelectedProjectId(created.id);
    } catch (e) {
      showAlert('error', e.response?.data?.detail || 'Không thể tạo dự án mới.');
    } finally {
      setCreateLoading(false);
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

        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            zIndex: 1, display: 'flex', alignItems: 'center', gap: 8,
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
            <span>{t('projects.projectList')} ({projects.length})</span>
            <Layers size={16} style={{ color: 'var(--brand-500)' }} />
          </div>

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
              {projects.map((p) => {
                const isSelected = p.id === selectedProjectId;
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
                      {p.keyword_filter && (
                        <div style={{
                          fontSize: 11, color: 'var(--text-muted)', marginTop: 3,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          🔑 {p.keyword_filter}
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

              {/* Timeline Items */}
              {timelineLoading ? (
                <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Loader2 size={28} className="spin" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Đang quét tin tức theo dòng thời gian...</div>
                </div>
              ) : !timelineData?.items || timelineData.items.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🗞️</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Chưa tìm thấy tin tức khớp bộ từ khóa này</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Dữ liệu tin tức mới sẽ tự động cập nhật khi crawler quét bài viết mới.</div>
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
                  placeholder="Ví dụ: Dự án Cao tốc Bắc - Nam"
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
                  placeholder="Ví dụ: cao tốc, BOT, metro"
                  value={keywordFilter}
                  onChange={(e) => setKeywordFilter(e.target.value)}
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
