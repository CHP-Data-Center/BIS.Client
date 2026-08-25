import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Check,
  CheckCheck,
  X,
  RefreshCw,
  Loader2,
  Tag,
  ChevronDown,
  ExternalLink,
  Eye,
  Calendar,
  Building2,
  FileText,
  Globe,
} from 'lucide-react';
import { keywordSuggestionsService } from '../../services/keywordSuggestions';
import { useLang } from '../../context/LanguageContext';

const STATUS_TABS = [
  { id: 'pending', labelKey: 'suggest.pending' },
  { id: 'approved', labelKey: 'suggest.approved' },
  { id: 'rejected', labelKey: 'suggest.rejected' },
];

function highlightKeyword(text, keyword) {
  if (!text || !keyword || !keyword.trim()) return text;
  const kwClean = keyword.trim();
  try {
    const escaped = kwClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === kwClean.toLowerCase() ? (
        <mark
          key={i}
          style={{
            backgroundColor: 'rgba(168, 85, 247, 0.18)',
            color: '#9333ea',
            fontWeight: 800,
            padding: '1px 4px',
            borderRadius: 4,
          }}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  } catch {
    return text;
  }
}

export default function KeywordSuggestionsPanel({ onMessage }) {
  const { t } = useLang();
  const nav = useNavigate();
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [batchAction, setBatchAction] = useState(null); // 'approveAll' | 'rejectAll' | null

  // Expand / Accordion & matching articles cache
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [articlesCache, setArticlesCache] = useState({});
  const [loadingArticles, setLoadingArticles] = useState({});
  const [selectedArticle, setSelectedArticle] = useState(null);

  const load = useCallback(async (st = status) => {
    setLoading(true);
    try {
      setItems(await keywordSuggestionsService.list(st));
    } catch {
      onMessage?.(t('suggest.loadError'), 'error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [status, onMessage, t]);

  useEffect(() => {
    load(status);
  }, [status, load]);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedArticle) {
        setSelectedArticle(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedArticle]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await keywordSuggestionsService.generate();
      onMessage?.(
        res.created > 0 ? `${t('suggest.generated')}: ${res.created}` : t('suggest.noNew'),
        res.created > 0 ? 'success' : 'info',
      );
      await load('pending');
      setStatus('pending');
    } catch {
      onMessage?.(t('suggest.generateError'), 'error');
    } finally {
      setGenerating(false);
    }
  };

  const act = async (id, action) => {
    setBusyId(id);
    try {
      await keywordSuggestionsService[action](id);
      onMessage?.(action === 'approve' ? t('suggest.approved') : t('suggest.rejected'), 'success');
      setItems((prev) => prev.filter((x) => x.id !== id));
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch {
      onMessage?.(t('suggest.actionError'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleApproveAll = async () => {
    if (items.length === 0 || batchAction) return;
    const count = items.length;
    const ok = window.confirm(t('suggest.approveAllConfirm') || `Duyệt tất cả ${count} từ khóa?`);
    if (!ok) return;

    setBatchAction('approveAll');
    try {
      const res = await keywordSuggestionsService.approveAll();
      const approvedCount = res?.count ?? count;
      onMessage?.(
        t('suggest.approvedAllSuccess', { count: approvedCount }) || `Đã duyệt ${approvedCount} từ khóa thành công`,
        'success'
      );
      await load('pending');
      setExpandedIds(new Set());
    } catch {
      onMessage?.(t('suggest.actionError'), 'error');
    } finally {
      setBatchAction(null);
    }
  };

  const handleRejectAll = async () => {
    if (items.length === 0 || batchAction) return;
    const count = items.length;
    const ok = window.confirm(t('suggest.rejectAllConfirm') || `Bỏ qua tất cả ${count} từ khóa?`);
    if (!ok) return;

    setBatchAction('rejectAll');
    try {
      const res = await keywordSuggestionsService.rejectAll();
      const rejectedCount = res?.count ?? count;
      onMessage?.(
        t('suggest.rejectedAllSuccess', { count: rejectedCount }) || `Đã bỏ qua ${rejectedCount} từ khóa`,
        'info'
      );
      await load('pending');
      setExpandedIds(new Set());
    } catch {
      onMessage?.(t('suggest.actionError'), 'error');
    } finally {
      setBatchAction(null);
    }
  };

  const toggleExpand = async (suggestionId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(suggestionId)) {
        next.delete(suggestionId);
      } else {
        next.add(suggestionId);
      }
      return next;
    });

    if (!articlesCache[suggestionId]) {
      setLoadingArticles((prev) => ({ ...prev, [suggestionId]: true }));
      try {
        const articles = await keywordSuggestionsService.getArticles(suggestionId);
        setArticlesCache((prev) => ({ ...prev, [suggestionId]: articles || [] }));
      } catch (err) {
        console.error('Error loading articles for suggestion:', err);
        setArticlesCache((prev) => ({ ...prev, [suggestionId]: [] }));
      } finally {
        setLoadingArticles((prev) => ({ ...prev, [suggestionId]: false }));
      }
    }
  };

  const handleOpenDetailModal = (article, currentTerm) => {
    setSelectedArticle({ ...article, currentTerm });
  };

  const handleNavigateToArticle = (article) => {
    if (!article) return;
    if (article.kind === 'article') {
      nav(`/article/${article.id}`);
    } else if (article.kind === 'procurement') {
      nav(`/procurement/${article.id}`);
    } else if (article.kind === 'oda') {
      const isAdb = article.source_type === 'adb' || article.source?.toLowerCase().includes('adb');
      nav(isAdb ? `/adb/project/${article.id}` : `/worldbank/project/${article.id}`);
    } else if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  };

  const getSourceBadgeStyle = (kind, sourceType) => {
    if (kind === 'procurement' || sourceType === 'gov') {
      return { background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.25)' };
    }
    if (kind === 'oda' || sourceType === 'worldbank' || sourceType === 'adb') {
      return { background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.25)' };
    }
    return { background: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.25)' };
  };

  return (
    <div>
      {/* ── Top Header & Actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(147, 51, 234, 0.3))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7'
            }}>
              <Sparkles size={16} />
            </div>
            <span>{t('suggest.title')}</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
            {t('suggest.hint')}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {status === 'pending' && items.length > 0 && (
            <>
              <button
                className="btn btn-sm"
                onClick={handleApproveAll}
                disabled={Boolean(batchAction) || loading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', fontSize: 12.5, fontWeight: 700, borderRadius: 8,
                  cursor: 'pointer', border: 'none', background: '#16a34a', color: '#fff',
                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                  transition: 'all 0.2s',
                }}
                title={t('suggest.approveAll')}
              >
                {batchAction === 'approveAll' ? <Loader2 size={14} className="spin" /> : <CheckCheck size={15} />}
                {t('suggest.approveAll')} ({items.length})
              </button>

              <button
                className="btn btn-sm"
                onClick={handleRejectAll}
                disabled={Boolean(batchAction) || loading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', fontSize: 12.5, fontWeight: 700, borderRadius: 8,
                  cursor: 'pointer', border: '1px solid var(--border)',
                  background: 'var(--bg-surface-2)', color: 'var(--text-secondary)',
                  transition: 'all 0.2s',
                }}
                title={t('suggest.rejectAll')}
              >
                {batchAction === 'rejectAll' ? <Loader2 size={14} className="spin" /> : <X size={15} />}
                {t('suggest.rejectAll')}
              </button>
            </>
          )}

          <button
            className="btn btn-primary btn-sm"
            onClick={handleGenerate}
            disabled={generating || Boolean(batchAction)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', fontSize: 12.5, fontWeight: 700, borderRadius: 8
            }}
          >
            {generating ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
            {generating ? t('suggest.generating') : t('suggest.generate')}
          </button>
        </div>
      </div>

      {/* ── Status Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setStatus(tab.id);
              setExpandedIds(new Set());
            }}
            style={{
              padding: '6px 14px', fontSize: 12.5, fontWeight: 700, borderRadius: 20, cursor: 'pointer',
              border: status === tab.id ? '1px solid var(--brand-500)' : '1px solid var(--border)',
              background: status === tab.id ? 'var(--brand-500)' : 'var(--bg-surface-2)',
              color: status === tab.id ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>{t(tab.labelKey)}</span>
            {status === tab.id && items.length > 0 && (
              <span style={{
                background: status === tab.id ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-surface)',
                color: status === tab.id ? '#fff' : 'var(--text-muted)',
                padding: '1px 6px', borderRadius: 10, fontSize: 11, fontWeight: 800,
              }}>
                {items.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── List Content ── */}
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px', color: 'var(--brand-500)' }} />
          <div>{t('common.loading')}</div>
        </div>
      ) : items.length === 0 ? (
        <div style={{
          padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13,
          background: 'var(--bg-surface)', borderRadius: 12, border: '1px dashed var(--border)'
        }}>
          <Tag size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
          <div>{t('suggest.empty')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((s) => {
            const isExpanded = expandedIds.has(s.id);
            const isArtLoading = Boolean(loadingArticles[s.id]);
            const arts = articlesCache[s.id] || [];

            return (
              <div
                key={s.id}
                style={{
                  border: isExpanded ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid var(--border)',
                  borderRadius: 12,
                  background: 'var(--bg-surface)',
                  boxShadow: isExpanded ? '0 4px 16px rgba(168, 85, 247, 0.08)' : '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  overflow: 'hidden',
                }}
              >
                {/* Main Row */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    cursor: 'pointer',
                    background: isExpanded ? 'var(--bg-surface-2)' : 'transparent',
                    transition: 'background-color 0.15s ease',
                  }}
                  onClick={() => toggleExpand(s.id)}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'rgba(168, 85, 247, 0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#a855f7', flexShrink: 0,
                  }}>
                    <Tag size={16} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {s.term}
                      </span>
                      {s.source_kind && (
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                          textTransform: 'uppercase', letterSpacing: 0.4,
                          ...getSourceBadgeStyle(s.source_kind, s.source_kind)
                        }}>
                          {s.source_kind === 'procurement' ? 'Mua sắm công' : s.source_kind === 'article' ? 'Báo chí' : s.source_kind}
                        </span>
                      )}
                    </div>
                    {s.sample_title && (
                      <div style={{
                        fontSize: 12, color: 'var(--text-muted)', marginTop: 3,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {s.sample_title}
                      </div>
                    )}
                  </div>

                  {/* Occurrences count badge */}
                  <span style={{
                    fontSize: 11.5, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                    background: isExpanded ? 'rgba(168, 85, 247, 0.15)' : 'var(--bg-surface-2)',
                    color: isExpanded ? '#a855f7' : 'var(--text-secondary)',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    border: '1px solid var(--border-subtle)',
                  }}>
                    {s.occurrences} {t('suggest.newsCount')}
                  </span>

                  {/* Action buttons (only in pending status) */}
                  {status === 'pending' && (
                    <div
                      style={{ display: 'flex', gap: 6, flexShrink: 0 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => act(s.id, 'approve')}
                        disabled={busyId === s.id || Boolean(batchAction)}
                        title={t('suggest.approve')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 8,
                          cursor: 'pointer', border: 'none', background: '#16a34a', color: '#fff',
                          boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)',
                          transition: 'opacity 0.15s ease',
                        }}
                      >
                        {busyId === s.id ? <Loader2 size={13} className="spin" /> : <Check size={13} />}
                        {t('suggest.approve')}
                      </button>
                      <button
                        onClick={() => act(s.id, 'reject')}
                        disabled={busyId === s.id || Boolean(batchAction)}
                        title={t('suggest.reject')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '6px 10px', fontSize: 12, fontWeight: 700, borderRadius: 8,
                          cursor: 'pointer', border: '1px solid var(--border)',
                          background: 'var(--bg-surface-2)', color: 'var(--text-secondary)',
                        }}
                      >
                        <X size={13} /> {t('suggest.reject')}
                      </button>
                    </div>
                  )}

                  {/* Dropdown chevron toggle */}
                  <div
                    style={{
                      width: 28, height: 28, borderRadius: 6,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-muted)',
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease, background-color 0.15s ease',
                      flexShrink: 0,
                    }}
                    title={isExpanded ? t('suggest.hideArticles') : t('suggest.viewArticles')}
                  >
                    <ChevronDown size={17} />
                  </div>
                </div>

                {/* Expanded Accordion: List of matching articles */}
                {isExpanded && (
                  <div style={{
                    padding: '12px 16px 16px',
                    borderTop: '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface-2)',
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      marginBottom: 10, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={14} style={{ color: '#a855f7' }} />
                        <span>{t('suggest.viewArticles')} &quot;{s.term}&quot;</span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {isArtLoading ? t('suggest.loadingArticles') : `${arts.length} ${t('suggest.newsCount')}`}
                      </span>
                    </div>

                    {isArtLoading ? (
                      <div style={{
                        padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)',
                        fontSize: 12.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                      }}>
                        <Loader2 size={16} className="spin" style={{ color: '#a855f7' }} />
                        <span>{t('suggest.loadingArticles')}</span>
                      </div>
                    ) : arts.length === 0 ? (
                      <div style={{
                        padding: '16px', textAlign: 'center', color: 'var(--text-muted)',
                        fontSize: 12.5, background: 'var(--bg-surface)', borderRadius: 8,
                        border: '1px dashed var(--border)'
                      }}>
                        {t('suggest.noArticlesFound')}
                      </div>
                    ) : (
                      <div
                        className="custom-modal-scroll"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          maxHeight: '340px',
                          overflowY: 'auto',
                          paddingRight: 4,
                        }}
                      >
                        {arts.map((art, idx) => (
                          <div
                            key={art.id || idx}
                            onClick={() => handleOpenDetailModal(art, s.term)}
                            style={{
                              padding: '10px 14px',
                              borderRadius: 8,
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 5,
                              transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
                              e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.04)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'none';
                              e.currentTarget.style.borderColor = 'var(--border)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{
                                  fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                                  ...getSourceBadgeStyle(art.kind, art.source_type)
                                }}>
                                  {art.source || (art.kind === 'procurement' ? 'Mua sắm công' : 'Tin tức')}
                                </span>

                                {art.published_at && (
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <Calendar size={11} /> {art.published_at}
                                  </span>
                                )}
                              </div>

                              <button
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  fontSize: 11.5, fontWeight: 700, color: 'var(--brand-500)',
                                  background: 'transparent', border: 'none', cursor: 'pointer',
                                  padding: '2px 6px', borderRadius: 4,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDetailModal(art, s.term);
                                }}
                              >
                                <Eye size={12} /> {t('suggest.viewDetail')}
                              </button>
                            </div>

                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                              {highlightKeyword(art.title, s.term)}
                            </div>

                            {art.excerpt && (
                              <div style={{
                                fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4,
                                overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                              }}>
                                {highlightKeyword(art.excerpt, s.term)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Rich Article Detail Modal (Centered via Portal directly to body) ── */}
      {selectedArticle && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedArticle(null);
          }}
        >
          <div
            className="custom-modal-scroll"
            style={{
              width: '100%', maxWidth: 680, maxHeight: '88vh',
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 16, boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              animation: 'fadeIn 0.18s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: 'rgba(168, 85, 247, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#a855f7',
                }}>
                  {selectedArticle.kind === 'procurement' ? <Building2 size={16} /> : selectedArticle.kind === 'oda' ? <Globe size={16} /> : <FileText size={16} />}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {t('suggest.articleDetailTitle')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {selectedArticle.kind === 'procurement' ? 'Mua Sắm Công' : selectedArticle.kind === 'oda' ? 'Dự Án ODA' : 'Tin Tức Báo Chí'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedArticle(null)}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none',
                  background: 'transparent', color: 'var(--text-muted)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 6,
                  ...getSourceBadgeStyle(selectedArticle.kind, selectedArticle.source_type)
                }}>
                  {selectedArticle.source || (selectedArticle.kind === 'procurement' ? 'Mua sắm công' : 'Tin tức')}
                </span>

                {selectedArticle.published_at && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Calendar size={13} /> {selectedArticle.published_at}
                  </span>
                )}

                {selectedArticle.status && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    background: 'var(--bg-surface-2)', color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    {selectedArticle.status}
                  </span>
                )}
              </div>

              {/* Title */}
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.45 }}>
                {highlightKeyword(selectedArticle.title, selectedArticle.currentTerm)}
              </div>

              {/* Procuring Entity */}
              {selectedArticle.procuring_entity && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-secondary)'
                }}>
                  <Building2 size={15} style={{ color: 'var(--brand-500)', flexShrink: 0 }} />
                  <span><strong>Cơ quan / Bên mời thầu:</strong> {selectedArticle.procuring_entity}</span>
                </div>
              )}

              {/* Excerpt / Markdown content */}
              {(selectedArticle.content_md || selectedArticle.excerpt) && (
                <div style={{
                  padding: '14px 16px', borderRadius: 10,
                  background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
                  fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {highlightKeyword(selectedArticle.content_md || selectedArticle.excerpt, selectedArticle.currentTerm)}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-2)', flexWrap: 'wrap', gap: 10,
            }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedArticle.url && (
                  <button
                    className="btn btn-sm"
                    onClick={() => window.open(selectedArticle.url, '_blank', 'noopener,noreferrer')}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: 12.5, fontWeight: 700, padding: '6px 12px',
                      background: 'var(--bg-surface)', border: '1px solid var(--border)',
                      color: 'var(--text-primary)', borderRadius: 8, cursor: 'pointer',
                    }}
                  >
                    <ExternalLink size={14} />
                    {t('suggest.openSource')}
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    handleNavigateToArticle(selectedArticle);
                    setSelectedArticle(null);
                  }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 12.5, fontWeight: 700, padding: '6px 14px', borderRadius: 8,
                  }}
                >
                  <Eye size={14} />
                  {t('suggest.openFullPage')}
                </button>

                <button
                  className="btn btn-sm"
                  onClick={() => setSelectedArticle(null)}
                  style={{
                    fontSize: 12.5, fontWeight: 700, padding: '6px 14px',
                    background: 'var(--bg-surface-3)', border: '1px solid var(--border)',
                    color: 'var(--text-secondary)', borderRadius: 8, cursor: 'pointer',
                  }}
                >
                  {t('suggest.close')}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

