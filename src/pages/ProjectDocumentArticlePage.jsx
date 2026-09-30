// src/pages/ProjectDocumentArticlePage.jsx
// Trang đọc một tài liệu dự án dưới DẠNG BÀI TIN: tiêu đề, thông tin, nội dung theo đoạn,
// file gốc tải về. Quyền xem do máy chủ lọc (của mình / cùng tổ chức đang hoạt động / công khai)
// — không xem được thì trả 404 y như danh sách.
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Download, FileText, Loader2, Lock, Building2, Globe2, MapPin,
  Paperclip, Trash2, AlertCircle, Sparkles, FolderKanban,
} from 'lucide-react';
import { projectDocumentsService, documentToItem, apiErrorMessage } from '../services/projectDocuments';
import { useLang } from '../context/LanguageContext';

function fmtDate(iso) {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
}

const PRIVACY = {
  private: { key: 'potential.privacyOnlyMe', label: 'Chỉ mình tôi', icon: Lock, color: '#7c3aed', bg: 'rgba(139, 92, 246, 0.12)' },
  organization: { key: 'potential.privacyOrg', label: 'Nội bộ tổ chức', icon: Building2, color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)' },
  public: { key: 'potential.privacyPublic', label: 'Công khai', icon: Globe2, color: '#059669', bg: 'rgba(16, 185, 129, 0.12)' },
};

export default function ProjectDocumentArticlePage() {
  const { t } = useLang();
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await projectDocumentsService.get(id);
      setDoc(documentToItem(data));
    } catch (e) {
      setErr(apiErrorMessage(e, 'Không tìm thấy tài liệu, hoặc bạn không có quyền xem.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleDownload = async () => {
    setDownloading(true);
    setErr(null);
    try {
      await projectDocumentsService.download(doc);
    } catch (e) {
      setErr(apiErrorMessage(e, 'Không tải được file. Vui lòng thử lại.'));
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Xóa tài liệu "${doc.title}"? Thông tin và file gốc sẽ bị xóa khỏi hệ thống.`)) return;
    setDeleting(true);
    try {
      await projectDocumentsService.remove(doc.id);
      navigate('/potential-projects');
    } catch (e) {
      setErr(apiErrorMessage(e, 'Không xóa được tài liệu.'));
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 40, color: 'var(--text-muted)' }}>
        <Loader2 size={18} className="spin" />
        <span>{t('documents.loadingArticle')}</span>
      </div>
    );
  }

  if (err && !doc) {
    return (
      <div className="empty-state" style={{ minHeight: 320, background: 'var(--bg-surface)', borderRadius: 20, border: '1px solid var(--border)' }}>
        <div className="empty-icon">🔒</div>
        <div className="empty-title">{err}</div>
        <button type="button" className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => navigate('/potential-projects')}>
          {t('documents.backToList')}
        </button>
      </div>
    );
  }

  const privCfg = PRIVACY[doc.privacy] || PRIVACY.private;
  const PrivIcon = privCfg.icon;
  const isDocx = (doc.filename || '').toLowerCase().endsWith('.docx');
  const doan = (doc.article_body || '').split(/\n\s*\n/).map((d) => d.trim()).filter(Boolean);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '8px 0 40px' }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="btn"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, marginBottom: 16 }}
      >
        <ArrowLeft size={14} /> {t('common.back')}
      </button>

      {err && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)', marginBottom: 14,
          border: '1px solid rgba(239, 68, 68, 0.3)', color: '#dc2626', fontSize: 12.5,
          display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600,
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{err}</span>
        </div>
      )}

      <article className="card" style={{ padding: '28px 32px', borderRadius: 18, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999,
            background: 'rgba(5, 150, 105, 0.1)', color: '#059669', fontSize: 11.5, fontWeight: 800,
            border: '1px solid rgba(5, 150, 105, 0.25)',
          }}>
            <FileText size={13} /> {t('documents.articleTag')}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999,
            background: privCfg.bg, color: privCfg.color, fontSize: 11.5, fontWeight: 800,
          }}>
            <PrivIcon size={12} /> {t(privCfg.key)}
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={12} /> {fmtDate(doc.date || doc.summaryDate || doc.createdAt)}
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
            👤 {doc.is_owner ? t('documents.postedByYou') : t('documents.postedBy', { name: doc.authorName || 'BIS User' })}
          </span>
        </div>

        <h1 style={{ margin: '0 0 6px', fontSize: 27, lineHeight: 1.3, fontWeight: 900, color: 'var(--text-primary)' }}>
          {doc.article_title || doc.project_name}
        </h1>
        {doc.article_title && doc.article_title !== doc.project_name && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
            {t('nav.projects')}: <strong style={{ color: 'var(--text-secondary)' }}>{doc.project_name}</strong>
          </div>
        )}

        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '6px 18px', fontSize: 12.5, color: 'var(--text-secondary)',
          padding: '10px 14px', borderRadius: 12, background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
          margin: '12px 0 18px',
        }}>
          <span><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />{doc.location || t('documents.unknownLocation')}</span>
          <span>📅 <strong>{t('documents.docDate', { date: fmtDate(doc.doc_date) })}</strong></span>
          <span>🗓️ <strong>{t('documents.summaryDate', { date: fmtDate(doc.summary_date) })}</strong></span>
          {doc.tracked_project_name && (
            <span><FolderKanban size={12} style={{ display: 'inline', marginRight: 4 }} /><strong>{t('documents.trackedProject', { name: doc.tracked_project_name })}</strong></span>
          )}
        </div>

        {doc.matched_keywords?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '0 0 16px' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>🏷️ Từ khóa khớp:</span>
            {doc.matched_keywords.map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => navigate(`/news/all?q=${encodeURIComponent(kw)}`)}
                style={{
                  fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 999, cursor: 'pointer',
                  background: 'var(--brand-50, rgba(21, 155, 76, 0.1))', color: 'var(--brand-600, #0E7A39)',
                  border: '1px solid rgba(21, 155, 76, 0.25)',
                }}
              >
                {kw}
              </button>
            ))}
          </div>
        )}

        {doc.summary && (
          <p style={{ margin: '0 0 18px', fontSize: 15.5, lineHeight: 1.65, fontWeight: 600, color: 'var(--text-primary)' }}>
            {doc.summary}
          </p>
        )}

        {doan.length > 0 ? (
          <div style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-primary)' }}>
            {doan.map((p, i) => (
              <p key={i} style={{ margin: '0 0 14px' }}>{p}</p>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {t('documents.noArticleContent')}
          </p>
        )}

        {doc.article_source && (
          <div style={{
            marginTop: 18, fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Sparkles size={12} />
            <span>{doc.article_source === 'ai' ? t('documents.sourceAi') : doc.article_source === 'rules' ? t('documents.sourceRules') : t('documents.sourceManual')}</span>
          </div>
        )}

        {doc.filename && (
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Paperclip size={15} style={{ color: '#059669' }} /> {t('documents.originalDoc')}
            </h4>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              padding: '10px 14px', borderRadius: 10, background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span style={{
                  padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, flexShrink: 0,
                  background: isDocx ? 'rgba(37, 99, 235, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                  color: isDocx ? '#2563eb' : '#dc2626',
                }}>
                  {isDocx ? 'DOCX' : 'PDF'}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, overflowWrap: 'anywhere' }}>{doc.filename}</div>
                  {doc.size_bytes > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(doc.size_bytes / 1024).toFixed(1)} KB</div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="btn"
                style={{
                  fontSize: 12, padding: '6px 14px', borderRadius: 8, flexShrink: 0, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--brand-600)',
                }}
              >
                {downloading ? <Loader2 size={13} className="spin" /> : <Download size={13} />}
                <span>{downloading ? t('documents.downloading') : t('documents.download')}</span>
              </button>
            </div>
          </div>
        )}

        {doc.is_owner && (
          <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn"
              onClick={handleDelete}
              disabled={deleting}
              style={{
                fontSize: 12.5, padding: '8px 14px', borderRadius: 10, color: '#dc2626',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                border: '1px solid rgba(220, 38, 38, 0.35)',
              }}
            >
              {deleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
              <span>{t('documents.deleteDoc')}</span>
            </button>
          </div>
        )}
      </article>
    </div>
  );
}
