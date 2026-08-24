// src/pages/BookmarksPage.jsx
import { useState, useEffect } from 'react';
import { Bookmark, Trash2, ExternalLink, Calendar, Loader2, Eye, LayoutGrid, List } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { articlesService } from '../services/articles';
import { useLang } from '../context/LanguageContext';
import NewsCard from '../components/NewsCard';
import { worldBankProjectUrl } from '../utils/wbUrl';
import { procurementDetailPath } from '../utils/procurementLink';
import { tUI } from '../locales';

function stripAccents(str = '') {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function isTagMatched(tag, query) {
  if (!query || !query.trim()) return false;
  const normTag = stripAccents(tag);
  const normQ = stripAccents(query.trim());
  return normTag.includes(normQ);
}

// Color & icon mapping for source tags
const SOURCE_STYLE = {
  adb:       { color: '#f59e0b', bg: '#fffbeb', icon: '🏦', name: 'ADB', label: tUI('ui.du-an-adb-2') },
  worldbank: { color: '#10b981', bg: '#ecfdf5', icon: '🌍', name: 'World Bank', label: 'World Bank' },
  dauthau:   { color: '#3b82f6', bg: '#eff6ff', icon: '📋', name: tUI('ui.mua-sam-cong'), label: tUI('ui.dau-thau') },
  gov:       { color: '#3b82f6', bg: '#eff6ff', icon: '📋', name: tUI('ui.mua-sam-cong'), label: tUI('ui.dau-thau') },
  press:     { color: '#3b82f6', bg: '#eff6ff', icon: '📰', name: tUI('ui.bao-chi-2'), label: tUI('ui.tin-tuc') },
  default:   { color: '#3b82f6', bg: '#eff6ff', icon: '📄', name: tUI('ui.nguon-tin'), label: tUI('ui.tin-tuc') },
};

function getSourceInfo(bm) {
  const name = bm.source_name || '';
  const type = bm.source_type || '';
  const lowerName = name.toLowerCase();

  if (lowerName.includes('báo')) {
    return { ...SOURCE_STYLE.press, name: name };
  }
  if (type === 'adb' || lowerName.includes('adb')) {
    return { ...SOURCE_STYLE.adb, name: name || 'ADB' };
  }
  if (type === 'worldbank' || lowerName.includes('world bank') || lowerName.includes('wb')) {
    return { ...SOURCE_STYLE.worldbank, name: name || 'World Bank' };
  }
  if (type === 'gov' || type === 'procurement' || lowerName.includes('thầu') || lowerName.includes('egp')) {
    return { ...SOURCE_STYLE.gov, name: name || 'Mua Sắm Công / Đấu Thầu' };
  }
  if (type === 'press' || name) {
    return { ...SOURCE_STYLE.press, name: name || 'Báo Chí' };
  }
  return { ...SOURCE_STYLE.default, name: tUI('ui.nguon-tin-2') };
}

function formatProjectAmount(val, sourceType) {
  if (val === null || val === undefined || val === '') return null;

  const isGov = sourceType === 'gov' || sourceType === 'procurement' || sourceType === 'dauthau';

  if (isGov) {
    if (typeof val === 'number' || (typeof val === 'string' && /^\d+$/.test(val.trim()))) {
      return `${val} gói thầu`;
    }
    return String(val);
  }

  // ODA projects (worldbank / adb)
  if (typeof val === 'number') {
    if (val >= 1000000000) return `$${(val / 1000000000).toFixed(1)} B USD`;
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)} M USD`;
    return `$${val.toLocaleString()} USD`;
  }
  if (typeof val === 'string') {
    if (val.includes('USD') || val.includes('M') || val.includes('B')) return val;
    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) {
      if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1)} B USD`;
      if (num >= 1000000) return `$${(num / 1000000).toFixed(1)} M USD`;
      return `$${num.toLocaleString()} USD`;
    }
  }
  return String(val);
}

function getStatusStyle(statusStr) {
  if (!statusStr) return { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb' };
  const lower = statusStr.toLowerCase();
  if (lower.includes('approved') || lower.includes('active') || lower.includes('duyệt')) {
    return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
  }
  if (lower.includes('pipeline') || lower.includes('proposed') || lower.includes('dự thảo')) {
    return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
  }
  if (lower.includes('thầu') || lower.includes('mới')) {
    return { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' };
  }
  return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
}

function getLocalBookmarks() {
  const localBms = [];

  try {
    const wbSaved = JSON.parse(localStorage.getItem('saved_worldbank_projects') || '[]');
    wbSaved.forEach((item) => {
      localBms.push({
        id: `wb_${item.id}`,
        article_id: `wb_${item.id}`,
        is_local_project: true,
        local_key: 'saved_worldbank_projects',
        original_id: item.id,
        project_code: item.id,
        article_title: item.project_name || `Dự án World Bank #${item.id}`,
        article_url: worldBankProjectUrl(item.rawUrl || item.id),
        article_image_url: null,
        source_name: 'World Bank',
        source_type: 'worldbank',
        country: item.countryshortname,
        status: item.projectstatusdisplay,
        amount: item.totalCommitmentAmount,
        stage: item.last_stage_reached_name,
        published_at: item.boardapprovaldate || item.saved_at,
        created_at: item.saved_at,
        matched_keywords: ['World Bank', item.last_stage_reached_name].filter(Boolean),
      });
    });
  } catch (e) {
    console.warn('Error reading saved_worldbank_projects:', e);
  }

  try {
    const adbSaved = JSON.parse(localStorage.getItem('saved_adb_projects') || '[]');
    adbSaved.forEach((item) => {
      localBms.push({
        id: `adb_${item.id}`,
        article_id: `adb_${item.id}`,
        is_local_project: true,
        local_key: 'saved_adb_projects',
        original_id: item.id,
        project_code: item.id,
        article_title: item.project_name || `Dự án ADB #${item.id}`,
        article_url: item.rawUrl || `https://www.adb.org/projects/${item.id}/main`,
        article_image_url: null,
        source_name: 'ADB',
        source_type: 'adb',
        country: item.countryshortname,
        status: item.projectstatusdisplay,
        amount: item.totalCommitmentAmount,
        stage: item.last_stage_reached_name,
        published_at: item.boardapprovaldate || item.saved_at,
        created_at: item.saved_at,
        matched_keywords: ['ADB', item.last_stage_reached_name].filter(Boolean),
      });
    });
  } catch (e) {
    console.warn('Error reading saved_adb_projects:', e);
  }

  try {
    const procSaved = JSON.parse(localStorage.getItem('saved_procurement_items') || '[]');
    procSaved.forEach((item) => {
      localBms.push({
        id: `proc_${item.id}`,
        article_id: `proc_${item.id}`,
        is_local_project: true,
        local_key: 'saved_procurement_items',
        original_id: item.id,
        project_code: item.id,
        article_title: item.project_name || `Thông báo thầu #${item.id}`,
        // Lưu url thật nếu có; không có thì lưu đường dẫn trang chi tiết TRONG APP để
        // mở lại vẫn xem được, thay vì một link ngoài chắc chắn hỏng.
        article_url: item.rawUrl || procurementDetailPath(item.id),
        article_image_url: null,
        source_name: 'Mua Sắm Công',
        source_type: 'gov',
        country: item.countryshortname,
        status: item.projectstatusdisplay,
        amount: item.totalCommitmentAmount,
        stage: item.last_stage_reached_name,
        published_at: item.boardapprovaldate || item.saved_at,
        created_at: item.saved_at,
        matched_keywords: ['Đấu Thầu', item.last_stage_reached_name].filter(Boolean),
      });
    });
  } catch (e) {
    console.warn('Error reading saved_procurement_items:', e);
  }

  return localBms;
}

export default function BookmarksPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const currentQ = searchParams.get('q') || '';
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [removing, setRemoving]   = useState(null);
  const [viewMode, setViewMode]   = useState('list'); // 'list' | 'grid'

  useEffect(() => {
    articlesService.getBookmarks()
      .then((serverBms) => {
        const localBms = getLocalBookmarks();
        const combined = [...(serverBms || []), ...localBms];
        combined.sort((a, b) => new Date(b.created_at || b.published_at || 0) - new Date(a.created_at || a.published_at || 0));
        setBookmarks(combined);
      })
      .catch(() => {
        setBookmarks(getLocalBookmarks());
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (articleId) => {
    setRemoving(articleId);
    try {
      const target = bookmarks.find((b) => b.article_id === articleId || b.id === articleId);
      if (target && target.is_local_project) {
        try {
          const raw = localStorage.getItem(target.local_key);
          if (raw) {
            const list = JSON.parse(raw);
            const updated = list.filter((p) => p.id !== target.original_id);
            localStorage.setItem(target.local_key, JSON.stringify(updated));
          }
        } catch (e) {
          console.error('Error removing local project bookmark:', e);
        }
      } else {
        await articlesService.removeBookmark(articleId);
      }
      setBookmarks((prev) => prev.filter((b) => b.article_id !== articleId && b.id !== articleId));
    } catch {
      // silent
    } finally {
      setRemoving(null);
    }
  };

  const handleViewDetail = (bm, e) => {
    if (e) e.stopPropagation();
    const isWbOrAdb = bm.source_type === 'worldbank' || bm.source_type === 'adb' || bm.local_key === 'saved_worldbank_projects' || bm.local_key === 'saved_adb_projects';
    if (isWbOrAdb) {
      const targetId = bm.original_id || bm.project_code || bm.article_id || bm.id;
      nav(`/worldbank/project/${targetId}`, { state: { project: bm } });
    } else {
      nav(`/article/${bm.article_id || bm.id}`);
    }
  };

  const mapBookmarkToArticle = (bm) => ({
    id: bm.article_id || bm.id,
    original_id: bm.original_id || bm.project_code,
    project_code: bm.project_code,
    title: bm.article_title || `Bài viết #${bm.article_id}`,
    url: bm.article_url,
    image_url: bm.article_image_url || bm.image_url,
    sources: bm.source_name ? [{ source_name: bm.source_name }] : [],
    source: bm.source_type || (bm.source_name?.toLowerCase().includes('thầu') ? 'gov' : 'press'),
    source_type: bm.source_type,
    excerpt: bm.excerpt,
    published_at: bm.published_at || bm.created_at,
    matched_keywords: bm.matched_keywords || [],
    is_bookmarked: true,
    is_local_project: bm.is_local_project,
    local_key: bm.local_key,
    amount: bm.amount ? formatProjectAmount(bm.amount, bm.source_type) : null,
  });

  const { t } = useLang();

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: '0 4px 14px rgba(245,158,11,0.35)',
            }}>
              <Bookmark size={20} color="white" />
            </div>
            {t('bookmarks.title')}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {t('bookmarks.subtitle')}
          </p>
        </div>

        {/* View Toggle */}
        {bookmarks.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-surface-2)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
            <button
              onClick={() => setViewMode('list')}
              title={t('bookmarks.listView')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, border: 'none',
                background: viewMode === 'list' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'list' ? 'var(--brand-600)' : 'var(--text-muted)',
                fontWeight: viewMode === 'list' ? 700 : 500, fontSize: 12, cursor: 'pointer',
                boxShadow: viewMode === 'list' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <List size={15} /> {t('bookmarks.listView')}
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title={t('bookmarks.gridView')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, border: 'none',
                background: viewMode === 'grid' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--brand-600)' : 'var(--text-muted)',
                fontWeight: viewMode === 'grid' ? 700 : 500, fontSize: 12, cursor: 'pointer',
                boxShadow: viewMode === 'grid' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <LayoutGrid size={15} /> {t('bookmarks.gridView')}
            </button>
          </div>
        )}
      </div>

      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
      }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{t('bookmarks.title')}</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-200)' }}>
            {bookmarks.length}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 8px', display: 'block' }} />
            {t('common.loading')}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="empty-state" style={{ minHeight: 200 }}>
            <div className="empty-icon">🔖</div>
            <div className="empty-title">{t('bookmarks.emptyTitle')}</div>
            <div className="empty-sub">{t('bookmarks.emptySub')}</div>
            <button className="btn btn-primary" onClick={() => nav('/news/all')} style={{ marginTop: 12 }}>
              {t('common.viewAll')}
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="bookmark-grid-container">
            {bookmarks.map((bm, i) => (
              <NewsCard key={bm.id} article={mapBookmarkToArticle(bm)} index={i} />
            ))}
          </div>
        ) : (
          <div>
            {bookmarks.map((bm, i) => {
              const srcInfo = getSourceInfo(bm);
              const imageUrl = bm.article_image_url || bm.image_url;
              const displayDate = bm.published_at
                ? new Date(bm.published_at).toLocaleDateString('vi-VN')
                : bm.created_at
                  ? new Date(bm.created_at).toLocaleDateString('vi-VN')
                  : null;
              const formattedAmt = formatProjectAmount(bm.amount, bm.source_type);
              const statusStyle = getStatusStyle(bm.status);
              const isProcurement = bm.source_type === 'gov' || bm.source_type === 'procurement' || bm.source_type === 'dauthau';

              return (
                <div
                  key={bm.id}
                  className="bookmark-row-card"
                  onClick={(e) => handleViewDetail(bm, e)}
                  style={{
                    borderBottom: i < bookmarks.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}
                >
                  {/* Article Image Container (Only if real photo exists) */}
                  {imageUrl ? (
                    <div className="bookmark-card-img" style={{ width: 120, height: 85, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-subtle)', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', marginTop: 2 }}>
                      <img
                        src={imageUrl}
                        alt={bm.article_title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                      />
                    </div>
                  ) : null}

                  {/* Main Content Info */}
                  <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                    {/* Header Badges & Actions Row */}
                    <div className="bookmark-card-header">
                      <div className="bookmark-badges">
                        {/* Source Tag */}
                        <span className="news-source-tag" style={{ background: srcInfo.color, fontWeight: 700 }}>
                          <span style={{ fontSize: 11 }}>{srcInfo.icon}</span>
                          {srcInfo.name}
                        </span>

                        {/* Status Badge */}
                        {bm.status && (
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 12,
                            background: statusStyle.bg, color: statusStyle.color,
                            border: `1px solid ${statusStyle.border}`,
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}>
                            ● {bm.status}
                          </span>
                        )}

                        {/* Project Code / ID Badge */}
                        {bm.project_code && (
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                            background: 'var(--bg-surface-2)', color: 'var(--text-secondary)',
                            border: '1px solid var(--border)', fontFamily: 'monospace',
                          }}>
                            ID: {bm.project_code}
                          </span>
                        )}

                        {/* Folder tag */}
                        {bm.folder && bm.folder !== 'default' && (
                          <span style={{
                            fontSize: 10.5, fontWeight: 600, background: 'var(--bg-surface-2)',
                            padding: '2px 8px', borderRadius: 10, border: '1px solid var(--border)',
                            color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}>
                            📁 {bm.folder}
                          </span>
                        )}

                        {/* Keyword tags */}
                        {bm.matched_keywords && bm.matched_keywords.length > 0 && bm.matched_keywords.map((kw) => {
                          const matched = isTagMatched(kw, currentQ);
                          return (
                            <span
                              key={kw}
                              onClick={() => nav(`/news/all?q=${encodeURIComponent(kw)}`)}
                              style={{
                                fontSize: 10.5,
                                fontWeight: matched ? 700 : 600,
                                padding: '1px 8px',
                                borderRadius: 10,
                                background: matched
                                  ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                                  : 'var(--brand-50)',
                                color: matched ? '#ffffff' : 'var(--brand-600)',
                                border: matched ? '1px solid #1d4ed8' : '1px solid var(--brand-200)',
                                cursor: 'pointer',
                                boxShadow: matched
                                  ? '0 2px 6px rgba(37, 99, 235, 0.35)'
                                  : 'none',
                                transition: 'all 0.15s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                              title={`Bấm để tìm bài viết với từ khóa #${kw}`}
                            >
                              {matched && <span style={{ fontSize: 9 }}>⚡</span>}
                              #{kw}
                            </span>
                          );
                        })}
                      </div>

                      {/* Actions */}
                      <div className="bookmark-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={(e) => handleViewDetail(bm, e)}
                          title={tUI('ui.xem-chi-tiet')}
                          style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Eye size={15} />
                        </button>
                        {bm.article_url && (
                          <a
                            className="btn btn-ghost btn-sm"
                            href={bm.article_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title={tUI('ui.xem-bai-goc')}
                            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center' }}
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(bm.article_id || bm.id);
                          }}
                          title={tUI('ui.bo-bookmark')}
                          id={`btn-remove-bm-${bm.article_id || bm.id}`}
                          disabled={removing === (bm.article_id || bm.id)}
                          style={{ padding: '6px 10px', color: '#ef4444' }}
                        >
                          {removing === (bm.article_id || bm.id)
                            ? <Loader2 size={15} style={{ animation: 'spin 0.6s linear infinite' }} />
                            : <Trash2 size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="bookmark-card-title" style={{
                      fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8,
                      lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden', transition: 'color 0.2s ease',
                    }}>
                      {bm.article_title || `Bài viết #${bm.article_id}`}
                    </div>

                    {/* Structured Metadata Bar for Projects */}
                    {bm.is_local_project ? (
                      <div className="bookmark-metadata-box">
                        {isProcurement ? (
                          /* Mua Sắm Công / Đấu Thầu Layout */
                          <>
                            {bm.country && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ color: 'var(--text-muted)' }}>{tUI('ui.ben-moi-thau')}</span>
                                <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{bm.country}</strong>
                              </div>
                            )}

                            {formattedAmt && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ color: 'var(--text-muted)' }}>{tUI('ui.so-luong-goi-thau')}</span>
                                <strong style={{ color: '#7c3aed', fontWeight: 800, background: '#f5f3ff', padding: '1px 8px', borderRadius: 4, border: '1px solid #ddd6fe' }}>
                                  {formattedAmt}
                                </strong>
                              </div>
                            )}

                            {bm.stage && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ color: 'var(--text-muted)' }}>{tUI('ui.phan-loai')}</span>
                                <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{bm.stage}</strong>
                              </div>
                            )}
                          </>
                        ) : (
                          /* World Bank / ADB Projects Layout */
                          <>
                            {bm.country && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ color: 'var(--text-muted)' }}>{tUI('ui.quoc-gia')}</span>
                                <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{bm.country}</strong>
                              </div>
                            )}

                            {formattedAmt && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ color: 'var(--text-muted)' }}>{tUI('ui.cam-ket-oda')}</span>
                                <strong style={{ color: '#059669', fontWeight: 800, background: '#ecfdf5', padding: '1px 8px', borderRadius: 4, border: '1px solid #a7f3d0' }}>
                                  {formattedAmt}
                                </strong>
                              </div>
                            )}

                            {bm.stage && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ color: 'var(--text-muted)' }}>{tUI('ui.giai-doan')}</span>
                                <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{bm.stage}</strong>
                              </div>
                            )}
                          </>
                        )}

                        {displayDate && (
                          <div className="bookmark-metadata-date">
                            <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>
                              {isProcurement ? 'Ngày đăng: ' : 'Phê duyệt: '}
                              {displayDate}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Excerpt & Date for News Articles */
                      <>
                        {bm.excerpt && (
                          <div style={{
                            fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6,
                            lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {bm.excerpt}
                          </div>
                        )}
                        {displayDate && (
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                            <Calendar size={12} />
                            <span>{displayDate}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
