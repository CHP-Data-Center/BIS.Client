// src/pages/WbProjectDetailPage.jsx
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  ArrowLeft, Calendar, Globe, ExternalLink, Bookmark, BookmarkCheck,
  Share2, ChevronRight, Loader2, Building2, Wallet, Landmark, Users,
  Layers, FileText, CheckCircle2, Tag, Cpu, RefreshCw
} from 'lucide-react';
import { worldBankService } from '../services/worldbank';
import { worldBankProjectUrl } from '../utils/wbUrl';
import { tUI } from '../locales';

const fmtDate = (d) => {
  if (!d) return 'N/A';
  try {
    return new Date(d).toLocaleDateString('vi-VN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
  } catch {
    return d;
  }
};

const fmtShortDate = (d) => {
  if (!d) return 'N/A';
  try {
    return new Date(d).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  } catch {
    return d;
  }
};

const fmtM = (usd) => {
  if (usd == null || usd === 0) return null;
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(2)} tỷ (B)`;
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(2)} triệu (M)`;
  return `$${usd.toLocaleString('en-US')}`;
};

const formatAmountDisplay = (amount) => {
  if (!amount || amount <= 0) return 'N/A';
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)} B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)} M`;
  return `$${amount.toLocaleString('en-US')}`;
};

const getStatusBadge = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('active') || s.includes('approved') || s.includes('đang')) {
    return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', label: status || 'Active' };
  }
  if (s.includes('closed') || s.includes('completed') || s.includes('đóng')) {
    return { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb', label: status || 'Closed' };
  }
  if (s.includes('pipeline') || s.includes('concept') || s.includes('proposed') || s.includes('kế hoạch')) {
    return { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: status || 'Pipeline' };
  }
  return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', label: status || 'Active' };
};

export default function WbProjectDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const location = useLocation();

  const [project, setProject] = useState(location.state?.project || null);
  const [loading, setLoading] = useState(!project);
  const [bookmarked, setBookmarked] = useState(false);
  const [relatedProjects, setRelatedProjects] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load project details if not passed via location state
  useEffect(() => {
    const stateProj = location.state?.project;
    if (stateProj && (String(stateProj.id) === String(id) || String(stateProj.external_id) === String(id))) {
      setProject(stateProj);
      setBookmarked(worldBankService.isProjectSaved(stateProj.id));
      setLoading(false);
    } else {
      setLoading(true);
      worldBankService.getProjectById(id)
        .then((found) => {
          if (found) {
            setProject(found);
            setBookmarked(worldBankService.isProjectSaved(found.id));
          }
        })
        .catch((err) => {
          console.warn('Failed to load project details:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [id, location.state]);

  // Load related projects (same country or overall recent projects)
  useEffect(() => {
    if (!project) return;
    worldBankService.fetchProjects()
      .then((all) => {
        const candidates = all.filter(p => String(p.id) !== String(project.id));
        // Priority: same country first
        const sameCountry = candidates.filter(p => p.countryshortname === project.countryshortname);
        const others = candidates.filter(p => p.countryshortname !== project.countryshortname);
        const combined = [...sameCountry, ...others].slice(0, 5);
        setRelatedProjects(combined);
      })
      .catch(() => {});
  }, [project?.id]);

  const handleBookmark = () => {
    if (!project) return;
    const res = worldBankService.toggleSaveProject(project);
    setBookmarked(res.isSaved);
    showToast(
      res.isSaved
        ? `Đã lưu dự án "${project.project_name?.slice(0, 30)}..."`
        : `Đã bỏ lưu dự án "${project.id}"`,
      res.isSaved ? 'success' : 'info'
    );
  };

  const handleShare = () => {
    if (navigator.share && project) {
      navigator.share({ title: project.project_name, url: window.location.href })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => showToast('Đã sao chép liên kết dự án vào bộ nhớ tạm!', 'success'))
        .catch(() => {});
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
        <Loader2 size={32} style={{ color: '#10b981', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{tUI('ui.dang-tai-chi-tiet-du-an-world-bank')}</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <div className="empty-icon">🌐</div>
        <div className="empty-title">{tUI('ui.khong-tim-thay-du-an')}</div>
        <div className="empty-sub">{tUI('ui.du-an-nay-khong-ton-tai-hoac-da-bi-go-khoi-co-so')}</div>
        <button className="btn btn-primary" onClick={() => nav('/worldbank')} style={{ marginTop: 20 }}>
          <ArrowLeft size={14} /> Quay lại danh sách World Bank
        </button>
      </div>
    );
  }

  const extId = project.external_id || project.id;
  const externalUrl = project.rawUrl || worldBankProjectUrl(project.url || extId);
  const statusInfo = getStatusBadge(project.projectstatusdisplay);
  const publishedDate = fmtDate(project.boardapprovaldate);
  const details = project.details || {};
  const dates = details.dates || {};
  const financing = details.financing || {};
  const financers = financing.financers || [];
  const sectors = details.sectors || [];
  const abstract = details.abstract || project.development_objective || project.ai_summary;

  // Tags list
  const tags = [
    'WorldBank',
    extId,
    project.countryshortname !== 'N/A' ? project.countryshortname : null,
    project.projectstatusdisplay,
    project.last_stage_reached_name !== 'N/A' ? project.last_stage_reached_name : null,
    project.sector !== 'N/A' ? project.sector : null,
    'ODA',
  ].filter(Boolean);

  return (
    <div>
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

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <a onClick={() => nav('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</a>
        <ChevronRight size={12} className="breadcrumb-sep" />
        <a onClick={() => nav('/worldbank')} style={{ cursor: 'pointer' }}>World Bank</a>
        <ChevronRight size={12} className="breadcrumb-sep" />
        <span style={{ color: 'var(--text-primary)', fontWeight: 600, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project.project_name?.slice(0, 45)}…
        </span>
      </div>

      {/* Main Layout (Left: Article Main, Right: Sidebar) */}
      <div className="article-layout">
        {/* LEFT COLUMN - MAIN PROJECT DETAILS */}
        <div>
          <article className="article-card">
            {/* Hero Cover Banner */}
            <div style={{
              minHeight: 140,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14), rgba(59, 130, 246, 0.08))',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-6)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Background Decorative Icon */}
              <Globe
                size={140}
                style={{
                  position: 'absolute', right: -20, bottom: -30,
                  opacity: 0.08, color: '#10b981', pointerEvents: 'none',
                }}
              />

              {/* Meta Badges Top Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', zIndex: 1 }}>
                <span
                  style={{
                    backgroundColor: '#10b981', color: 'white',
                    padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Globe size={13} /> World Bank
                </span>

                <span
                  style={{
                    fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
                    color: '#059669', background: 'rgba(16, 185, 129, 0.15)',
                    padding: '3px 9px', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  ID: {extId}
                </span>

                <span
                  style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                    background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}`,
                  }}
                >
                  {statusInfo.label}
                </span>

                {project.countryshortname && project.countryshortname !== 'N/A' && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '3px 10px', borderRadius: 8, border: '1px solid var(--border)' }}>
                    🏢 {project.countryshortname}
                  </span>
                )}
              </div>

              {/* Amount Highlight */}
              <div style={{ marginTop: 12, zIndex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{tUI('ui.cam-ket-tai-chinh-usd')}</span>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', lineHeight: 1.2 }}>
                  {formatAmountDisplay(project.totalCommitmentAmount)}
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="article-title" style={{ fontSize: 24, lineHeight: 1.35, marginBottom: 16 }}>
              {project.project_name}
            </h1>

            {/* Abstract / AI / PDO Summary Box */}
            {abstract && (
              <div style={{
                display: 'flex',
                gap: 12,
                padding: '18px 22px',
                background: 'var(--bg-surface-2)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--space-6)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '4px 11px', fontSize: 11, fontWeight: 700,
                        background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', borderRadius: 12,
                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                      }}
                    >
                      <Cpu size={12} /> Tóm Tắt & Mục Tiêu Phát Triển (PDO)
                    </span>
                  </div>
                  <p style={{ fontSize: 14.5, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>
                    {abstract}
                  </p>
                </div>
              </div>
            )}

            {/* Detailed Content Section (Main Card) */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px 28px',
              marginBottom: 'var(--space-6)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
            }}>
              <div style={{
                fontSize: 16, fontWeight: 800, color: 'var(--text-primary)',
                marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: '1.5px solid var(--border-subtle)', paddingBottom: 14,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981',
                  fontSize: 18, boxShadow: '0 2px 8px rgba(16,185,129,0.15)', flexShrink: 0,
                }}>
                  📖
                </div>
                <div>
                  <div style={{ lineHeight: 1.2 }}>{tUI('ui.noi-dung-chi-tiet-du-an-world-bank')}</div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginTop: 2 }}>
                    Thông tin toàn văn & phân tích kỹ thuật được trích xuất trực tiếp
                  </div>
                </div>
              </div>

              {/* Detailed Specs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px 24px', marginBottom: 20 }}>
                {project.countryshortname && project.countryshortname !== 'N/A' && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Globe size={16} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{tUI('ui.quoc-gia-khu-vuc')}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {project.countryshortname} {project.region ? `(${project.region})` : ''}
                      </div>
                    </div>
                  </div>
                )}

                {extId && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Tag size={16} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{tUI('ui.ma-du-an-external-id')}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                        {extId}
                      </div>
                    </div>
                  </div>
                )}

                {project.totalCommitmentAmount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Wallet size={16} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{tUI('ui.cam-ket-von-commitment')}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>
                        {formatAmountDisplay(project.totalCommitmentAmount)}
                      </div>
                    </div>
                  </div>
                )}

                {project.total_cost && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Wallet size={16} color="#3b82f6" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{tUI('ui.tong-kinh-phi-du-an')}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {project.total_cost}
                      </div>
                    </div>
                  </div>
                )}

                {project.projectstatusdisplay && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={16} color={statusInfo.color} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{tUI('ui.trang-thai-du-an')}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: statusInfo.color }}>
                        {project.projectstatusdisplay}
                      </div>
                    </div>
                  </div>
                )}

                {project.last_stage_reached_name && project.last_stage_reached_name !== 'N/A' && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Layers size={16} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{tUI('ui.giai-doan-cuoi')}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {project.last_stage_reached_name}
                      </div>
                    </div>
                  </div>
                )}

                {project.boardapprovaldate && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Calendar size={16} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{tUI('ui.ngay-phe-duyet')}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {fmtShortDate(project.boardapprovaldate)}
                      </div>
                    </div>
                  </div>
                )}

                {project.proj_last_upd_date && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <RefreshCw size={16} color="#6b7280" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{tUI('ui.cap-nhat-cuoi')}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {fmtShortDate(project.proj_last_upd_date)}
                      </div>
                    </div>
                  </div>
                )}

                {project.closing_date && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Calendar size={16} color="#ef4444" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{tUI('ui.ngay-dong-du-an')}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {fmtShortDate(project.closing_date)}
                      </div>
                    </div>
                  </div>
                )}

                {project.lending_instrument && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Landmark size={16} color="#8b5cf6" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{tUI('ui.cong-cu-vay-lending')}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {project.lending_instrument}
                      </div>
                    </div>
                  </div>
                )}

                {project.fiscal_year && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Calendar size={16} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{tUI('ui.nam-tai-khoa')}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {project.fiscal_year}
                      </div>
                    </div>
                  </div>
                )}

                {project.borrower && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Landmark size={16} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{tUI('ui.ben-vay-borrower')}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {project.borrower}
                      </div>
                    </div>
                  </div>
                )}

                {project.implementing_agency && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Building2 size={16} color="#3b82f6" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{tUI('ui.co-quan-thuc-hien')}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {project.implementing_agency}
                      </div>
                    </div>
                  </div>
                )}

                {project.team_leader && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Users size={16} color="#ec4899" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{tUI('ui.chu-nhiem-du-an-ttl')}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {project.team_leader}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Rich Financers Breakdown Table (If available in details) */}
              {(financers.length > 0 || financing.total || financing.ibrd || financing.ida) && (
                <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px dashed var(--border-subtle)' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Wallet size={15} color="#10b981" /> Cơ Cấu Tài Chính (Financing Structure)
                  </div>

                  {financers.length > 0 && (
                    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
                      <div style={{ display: 'flex', background: 'var(--bg-surface-2)', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '8px 12px' }}>
                        <div style={{ flex: 1 }}>{tUI('ui.nguon-tai-tro-doi-tac')}</div>
                        <div style={{ width: 160, textAlign: 'right' }}>{tUI('ui.so-tien-cam-ket')}</div>
                      </div>
                      {financers.map((f, i) => (
                        <div key={i} style={{ display: 'flex', padding: '8px 12px', fontSize: 13, borderTop: '1px solid var(--border-subtle)' }}>
                          <div style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 600 }}>{f.name}</div>
                          <div style={{ width: 160, textAlign: 'right', fontWeight: 700, color: '#10b981' }}>{fmtM(f.amount) || 'N/A'}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, background: 'var(--bg-surface-2)', padding: 12, borderRadius: 10 }}>
                    {financing.ibrd > 0 && <div><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>IBRD:</span> <strong style={{ color: 'var(--text-primary)' }}>{fmtM(financing.ibrd)}</strong></div>}
                    {financing.ida > 0 && <div><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>IDA:</span> <strong style={{ color: 'var(--text-primary)' }}>{fmtM(financing.ida)}</strong></div>}
                    {financing.grant > 0 && <div><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tUI('ui.grant-vien-tro')}</span> <strong style={{ color: 'var(--text-primary)' }}>{fmtM(financing.grant)}</strong></div>}
                    {financing.total > 0 && <div><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tUI('ui.tong-tai-chinh')}</span> <strong style={{ color: '#10b981' }}>{fmtM(financing.total)}</strong></div>}
                  </div>
                </div>
              )}

              {/* Rich Sectors Breakdown (If available) */}
              {sectors.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed var(--border-subtle)' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Layers size={15} color="#10b981" /> Phân Tích Lĩnh Vực (Sectors)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {sectors.map((s, i) => (
                      <span key={i} style={{ fontSize: 12, fontWeight: 600, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 20, padding: '5px 12px', color: 'var(--text-secondary)' }}>
                        {s.name}{s.percent ? ` · ${s.percent}%` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* System Metadata Box */}
              <div style={{
                background: 'var(--bg-surface-2)',
                borderRadius: 12,
                padding: '16px 20px',
                border: '1px solid var(--border-subtle)',
                marginTop: 24,
              }}>
                <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📌</span> Thông Tin Phân Tích Kỹ Thuật (System Metadata):
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li><strong>{tUI('ui.ten-du-an-day-du')}</strong> {project.project_name}</li>
                  <li><strong>{tUI('ui.nguon-trich-xuat')}</strong> World Bank Projects API & Operations / BIS Crawler</li>
                  <li><strong>{tUI('ui.ma-quan-ly-he-thong')}</strong> {extId}</li>
                  {publishedDate !== 'N/A' && <li><strong>{tUI('ui.thoi-gian-phe-duyet')}</strong> {publishedDate}</li>}
                  {externalUrl && (
                    <li>
                      <strong>{tUI('ui.lien-ket-bai-goc')}</strong>{' '}
                      <a href={externalUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#10b981', fontWeight: 700, textDecoration: 'underline' }}>
                        Trích xuất trực tiếp từ World Bank Official ↗
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Bottom Meta Bar */}
            <div style={{
              display: 'flex', gap: 20, flexWrap: 'wrap',
              padding: '12px 0',
              borderTop: '1px solid var(--border-subtle)',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: 'var(--space-6)',
              fontSize: 12, color: 'var(--text-muted)',
            }}>
              {publishedDate !== 'N/A' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Calendar size={12} /> Ngày phê duyệt: {publishedDate}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Globe size={12} /> Nguồn: World Bank API
              </span>
            </div>

            {/* Bottom Action Bar Buttons */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
              >
                <ExternalLink size={15} /> Xem bài gốc / World Bank ↗
              </a>

              <button
                className={`btn ${bookmarked ? 'btn-success' : 'btn-secondary'}`}
                onClick={handleBookmark}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  backgroundColor: bookmarked ? '#10b981' : undefined,
                  color: bookmarked ? 'white' : undefined,
                }}
              >
                {bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                {bookmarked ? 'Đã lưu dự án' : 'Lưu lại'}
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleShare}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <Share2 size={15} /> Chia sẻ
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => nav(-1)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}
              >
                <ArrowLeft size={15} /> Quay lại
              </button>
            </div>
          </article>
        </div>

        {/* RIGHT COLUMN - SIDEBAR */}
        <div>
          {/* Card 1: VỀ WORLD BANK */}
          <div className="article-sidebar-card">
            <div className="article-sidebar-title">
              <Globe size={15} color="#10b981" /> Về World Bank (WB)
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 12px' }}>
              Dữ liệu dự án ODA được hệ thống BIS Crawler thu thập và đồng bộ tự động từ Ngân hàng Thế giới (World Bank) phục vụ tra cứu chuyên sâu.
            </p>
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12, fontWeight: 700, color: '#10b981', textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
            >
              Xem trang gốc World Bank <ExternalLink size={12} />
            </a>
          </div>

          {/* Card 2: PHÂN LOẠI & TỪ KHÓA */}
          {tags.length > 0 && (
            <div className="article-sidebar-card">
              <div className="article-sidebar-title">
                <Tag size={15} color="#10b981" /> Từ khóa & Phân loại
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    onClick={() => nav(`/worldbank?q=${encodeURIComponent(tag)}`)}
                    style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 10px',
                      borderRadius: 12, background: 'var(--bg-surface-2)',
                      color: 'var(--text-secondary)', border: '1px solid var(--border)',
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3,
                    }}
                    title={`Lọc dự án với #${tag}`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Card 3: DỰ ÁN LIÊN QUAN */}
          {relatedProjects.length > 0 && (
            <div className="article-sidebar-card">
              <div className="article-sidebar-title">
                <FileText size={15} color="#10b981" /> Dự án liên quan
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {relatedProjects.map((rel) => {
                  const relStatus = getStatusBadge(rel.projectstatusdisplay);
                  return (
                    <div
                      key={rel.id}
                      onClick={() => nav(`/worldbank/project/${rel.id}`, { state: { project: rel } })}
                      style={{
                        padding: '10px 12px', borderRadius: 10,
                        background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
                        cursor: 'pointer', transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#10b981')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8, background: relStatus.bg, color: relStatus.color }}>
                          {relStatus.label}
                        </span>
                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                          {rel.id}
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {rel.project_name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>🏢 {rel.countryshortname}</span>
                        <span style={{ fontWeight: 700, color: '#10b981' }}>{formatAmountDisplay(rel.totalCommitmentAmount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
