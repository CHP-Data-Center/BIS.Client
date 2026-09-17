/**
 * Tài liệu dự án (MoM họp tiến độ 15/09/2026).
 *
 * Đăng tài liệu DOCX/PDF: tải file → máy trích tên dự án, vị trí, tóm tắt, ngày → người dùng
 * sửa, chọn dự án theo dõi và quyền riêng tư (Chỉ mình tôi / Tổ chức / Công khai) → bảng duyệt
 * → phê duyệt thì mới lưu thông tin + file.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  FileText, Upload, Loader2, X, Search, Download, Trash2, Pencil, Lock, Users, Globe2,
  MapPin, Calendar, AlertCircle, CheckCircle2, ArrowRight, Sparkles, FolderKanban, Check,
} from 'lucide-react';
import { projectDocumentsService } from '../services/projectDocuments';
import { projectsService } from '../services/projects';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/common/ConfirmModal';

const PAGE_SIZE = 12;
const VISIBILITY = [
  { value: 'private', icon: Lock, labelKey: 'docs.visPrivate', descKey: 'docs.visPrivateDesc', color: '#64748b' },
  { value: 'organization', icon: Users, labelKey: 'docs.visOrg', descKey: 'docs.visOrgDesc', color: '#2563eb' },
  { value: 'public', icon: Globe2, labelKey: 'docs.visPublic', descKey: 'docs.visPublicDesc', color: '#10b981' },
];
const visMeta = (v) => VISIBILITY.find((x) => x.value === v) || VISIBILITY[0];

function fmtDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '—';
}

function fmtSize(bytes) {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const errText = (e, fallback) => {
  const d = e?.response?.data?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d) && d[0]?.msg) return d[0].msg;
  return e?.userMessage || fallback;
};

function VisibilityBadge({ value }) {
  const { t } = useLang();
  const m = visMeta(value);
  const Icon = m.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
      padding: '2px 8px', borderRadius: 999, color: m.color, border: `1px solid ${m.color}55`,
      background: `${m.color}12`, whiteSpace: 'nowrap',
    }}>
      <Icon size={11} /> {t(m.labelKey)}
    </span>
  );
}

/** Ô chọn dự án đang theo dõi: gõ để lọc tên, mỗi dòng hiện vị trí / lĩnh vực / thời gian / trạng thái. */
function TrackedProjectPicker({ value, onChange }) {
  const { t } = useLang();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const ds = await projectsService.lookupProjects(q, 15);
        if (alive) setItems(ds || []);
      } catch {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    }, 250);
    return () => { alive = false; clearTimeout(timer); };
  }, [q, open]);

  if (value) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 9 }}>
        <FolderKanban size={15} style={{ marginTop: 2, color: '#2563eb', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{value.name}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '2px 12px' }}>
            <span><MapPin size={11} /> {value.province || '—'}</span>
            <span>{t('potential.fieldSector')}: {value.sector_name || value.sector || '—'}</span>
            <span><Calendar size={11} /> {fmtDate(value.start_date)} → {fmtDate(value.end_date)}</span>
            {value.status && <span>{t('projects.status')}: {t(`projects.status${value.status.charAt(0).toUpperCase()}${value.status.slice(1)}`)}</span>}
          </div>
        </div>
        <button type="button" className="btn" onClick={() => onChange(null)} style={{ padding: 4, background: 'transparent', border: 'none' }} title={t('docs.unlinkProject')}>
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
      <input
        className="form-input"
        value={q}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        placeholder={t('docs.pickProjectPlaceholder')}
        style={{ width: '100%', padding: '8px 10px 8px 30px', fontSize: 12.5, boxSizing: 'border-box' }}
      />
      {open && (
        <div className="card" style={{
          position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 4, zIndex: 5, maxHeight: 240,
          overflowY: 'auto', padding: 4, background: 'var(--bg-surface)', boxShadow: '0 10px 30px rgba(15,23,42,.18)',
        }}>
          {loading && <div style={{ padding: 8, fontSize: 12, color: 'var(--text-muted)' }}>{t('common.loading')}</div>}
          {!loading && items.length === 0 && (
            <div style={{ padding: 8, fontSize: 12, color: 'var(--text-muted)' }}>{t('potential.noProjectFound')}</div>
          )}
          {!loading && items.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(p); setOpen(false); setQ(''); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 9px', border: 'none', background: 'transparent', borderRadius: 7, cursor: 'pointer' }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '0 10px' }}>
                <span>{p.province || '—'}</span>
                <span>{p.sector_name || p.sector || '—'}</span>
                <span>{fmtDate(p.start_date)} → {fmtDate(p.end_date)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const EMPTY_FORM = {
  project_name: '', location: '', summary: '', doc_date: '', summary_date: '',
  visibility: 'private', tracked: null,
};

/**
 * Hộp đăng / sửa tài liệu. mode="create": upload → form → review. mode="edit": form → review.
 */
function DocumentModal({ mode, doc, hasOrg, onClose, onSaved }) {
  const { t } = useLang();
  const [step, setStep] = useState(mode === 'edit' ? 'form' : 'upload');
  const [file, setFile] = useState(null);
  const [useAi, setUseAi] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extractInfo, setExtractInfo] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(() => (mode === 'edit' && doc ? {
    project_name: doc.project_name || '',
    location: doc.location || '',
    summary: doc.summary || '',
    doc_date: doc.doc_date || '',
    summary_date: doc.summary_date || '',
    visibility: doc.visibility || 'private',
    tracked: doc.tracked_project_id ? { id: doc.tracked_project_id, name: doc.tracked_project_name || `#${doc.tracked_project_id}` } : null,
  } : EMPTY_FORM));
  const inputRef = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const chooseFile = (f) => {
    setError(null);
    if (!f) return;
    const name = f.name.toLowerCase();
    if (!name.endsWith('.docx') && !name.endsWith('.pdf')) {
      setError(t('docs.onlyDocxPdf'));
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      setError(t('docs.fileTooLarge'));
      return;
    }
    setFile(f);
  };

  const extract = async () => {
    if (!file) return;
    setExtracting(true);
    setError(null);
    try {
      const r = await projectDocumentsService.extract(file, { ai: useAi });
      setExtractInfo(r);
      setForm((f) => ({
        ...f,
        project_name: r.project_name || f.project_name || file.name.replace(/\.(docx|pdf)$/i, ''),
        location: r.location || f.location,
        summary: r.summary || f.summary,
        doc_date: r.doc_date || f.doc_date,
        summary_date: r.summary_date || f.summary_date,
      }));
      setStep('form');
    } catch (e) {
      setError(errText(e, t('docs.extractFailed')));
    } finally {
      setExtracting(false);
    }
  };

  const toReview = () => {
    if (!form.project_name.trim()) {
      setError(t('docs.nameRequired'));
      return;
    }
    if (form.visibility === 'organization' && !hasOrg) {
      setError(t('docs.orgRequired'));
      return;
    }
    setError(null);
    setStep('review');
  };

  const approve = async () => {
    setSaving(true);
    setError(null);
    try {
      let saved;
      if (mode === 'edit') {
        saved = await projectDocumentsService.update(doc.id, {
          project_name: form.project_name.trim(),
          location: form.location.trim() || null,
          summary: form.summary.trim() || null,
          doc_date: form.doc_date || null,
          summary_date: form.summary_date || null,
          visibility: form.visibility,
          tracked_project_id: form.tracked?.id || null,
        });
      } else {
        saved = await projectDocumentsService.create(file, {
          project_name: form.project_name.trim(),
          location: form.location.trim(),
          summary: form.summary.trim(),
          doc_date: form.doc_date,
          summary_date: form.summary_date,
          visibility: form.visibility,
          tracked_project_id: form.tracked?.id,
        });
      }
      onSaved(saved, mode);
    } catch (e) {
      setError(errText(e, t('docs.saveFailed')));
      setSaving(false);
    }
  };

  const label = { fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' };
  const input = { width: '100%', padding: '7px 9px', fontSize: 12.5, boxSizing: 'border-box' };
  const ghost = { background: 'var(--bg-surface-2)', border: '1px solid var(--border)' };
  const stepNo = { upload: 1, form: mode === 'edit' ? 1 : 2, review: mode === 'edit' ? 2 : 3 }[step];
  const stepTotal = mode === 'edit' ? 2 : 3;
  const vm = visMeta(form.visibility);
  const fileName = mode === 'edit' ? doc?.filename : file?.name;
  const fileSize = mode === 'edit' ? doc?.size_bytes : file?.size;

  const reviewRows = [
    ['docs.fieldProjectName', form.project_name],
    ['docs.fieldTracked', form.tracked?.name || '—'],
    ['docs.fieldLocation', form.location || '—'],
    ['docs.fieldSummary', form.summary || '—'],
    ['docs.fieldDocDate', fmtDate(form.doc_date)],
    ['docs.fieldSummaryDate', fmtDate(form.summary_date) === '—' && mode !== 'edit' ? t('docs.today') : fmtDate(form.summary_date)],
    ['docs.fieldVisibility', `${t(vm.labelKey)} — ${t(vm.descKey)}`],
    ['docs.fieldFile', fileName ? `${fileName} (${fmtSize(fileSize)})` : '—'],
  ];

  return createPortal(
    <div
      onClick={saving || extracting ? undefined : onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        role="dialog"
        aria-modal="true"
        style={{ width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', borderRadius: 14, padding: 18, gap: 12 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
              {t('docs.step', { n: stepNo, total: stepTotal })}
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
              {mode === 'edit' ? t('docs.editTitle') : t('docs.uploadTitle')}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
              {t({ upload: 'docs.stepUploadDesc', form: 'docs.stepFormDesc', review: 'docs.stepReviewDesc' }[step])}
            </p>
          </div>
          <button type="button" className="btn" onClick={onClose} disabled={saving || extracting} style={{ padding: 6, background: 'transparent', border: 'none', alignSelf: 'flex-start' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', minHeight: 0, flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {step === 'upload' && (
            <>
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); chooseFile(e.dataTransfer.files?.[0]); }}
                style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: '26px 16px', textAlign: 'center', cursor: 'pointer' }}
              >
                <Upload size={26} style={{ color: '#2563eb' }} />
                <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 6 }}>
                  {file ? file.name : t('docs.dropHere')}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  {file ? fmtSize(file.size) : t('docs.fileHint')}
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  style={{ display: 'none' }}
                  onChange={(e) => chooseFile(e.target.files?.[0])}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5 }}>
                <input type="checkbox" checked={useAi} onChange={(e) => setUseAi(e.target.checked)} style={{ marginTop: 2 }} />
                <span>
                  <strong><Sparkles size={12} /> {t('docs.useAi')}</strong>
                  <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: 11.5 }}>{t('docs.useAiHint')}</span>
                </span>
              </label>
            </>
          )}

          {step === 'form' && (
            <>
              {extractInfo && (
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', background: 'rgba(37,99,235,.06)', borderRadius: 8, padding: '7px 10px' }}>
                  {extractInfo.source === 'ai' ? t('docs.extractedAi') : t('docs.extractedRules')}
                  {extractInfo.note ? ` ${extractInfo.note}` : ''}
                </div>
              )}
              <div>
                <span style={label}>{t('docs.fieldTracked')}</span>
                <TrackedProjectPicker
                  value={form.tracked}
                  onChange={(p) => setForm((f) => ({
                    ...f,
                    tracked: p,
                    project_name: p && !f.project_name.trim() ? p.name : f.project_name,
                    location: p && !f.location.trim() ? (p.province || '') : f.location,
                  }))}
                />
                {form.tracked && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setForm((f) => ({ ...f, project_name: f.tracked.name, location: f.tracked.province || f.location }))}
                    style={{ ...ghost, marginTop: 6, fontSize: 11.5, padding: '4px 8px' }}
                  >
                    {t('docs.useTrackedName')}
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                <label style={{ gridColumn: '1 / -1' }}>
                  <span style={label}>{t('docs.fieldProjectName')} *</span>
                  <input className="form-input" style={input} maxLength={255} value={form.project_name} onChange={set('project_name')} />
                </label>
                <label>
                  <span style={label}>{t('docs.fieldLocation')}</span>
                  <input className="form-input" style={input} maxLength={255} value={form.location} onChange={set('location')} />
                </label>
                <label>
                  <span style={label}>{t('docs.fieldDocDate')}</span>
                  <input type="date" className="form-input" style={input} value={form.doc_date} onChange={set('doc_date')} />
                </label>
                <label>
                  <span style={label}>{t('docs.fieldSummaryDate')}</span>
                  <input type="date" className="form-input" style={input} value={form.summary_date} onChange={set('summary_date')} />
                </label>
                <div>
                  <span style={label}>{t('docs.fieldFile')}</span>
                  <div style={{ fontSize: 12.5, padding: '7px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={14} /> {fileName} ({fmtSize(fileSize)})
                  </div>
                </div>
                <label style={{ gridColumn: '1 / -1' }}>
                  <span style={label}>{t('docs.fieldSummary')}</span>
                  <textarea className="form-input" style={{ ...input, minHeight: 110, resize: 'vertical' }} maxLength={5000} value={form.summary} onChange={set('summary')} />
                </label>
              </div>
              <div>
                <span style={label}>{t('docs.fieldVisibility')}</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
                  {VISIBILITY.map((v) => {
                    const Icon = v.icon;
                    const active = form.visibility === v.value;
                    const disabled = v.value === 'organization' && !hasOrg;
                    return (
                      <button
                        key={v.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => setForm((f) => ({ ...f, visibility: v.value }))}
                        style={{
                          textAlign: 'left', padding: '9px 10px', borderRadius: 9, cursor: disabled ? 'not-allowed' : 'pointer',
                          opacity: disabled ? 0.5 : 1,
                          border: `1.5px solid ${active ? v.color : 'var(--border)'}`,
                          background: active ? `${v.color}14` : 'transparent', color: 'var(--text-primary)',
                        }}
                      >
                        <div style={{ fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, color: active ? v.color : 'inherit' }}>
                          <Icon size={14} /> {t(v.labelKey)} {active && <Check size={13} />}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {disabled ? t('docs.orgRequired') : t(v.descKey)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {step === 'review' && (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <tbody>
                  {reviewRows.map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ padding: '7px 8px', fontWeight: 700, width: 150, verticalAlign: 'top', borderTop: '1px solid var(--border)' }}>{t(k)}</td>
                      <td style={{ padding: '7px 8px', whiteSpace: 'pre-wrap', borderTop: '1px solid var(--border)' }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-muted)' }}>{t('docs.reviewNote')}</p>
            </>
          )}
        </div>

        {error && (
          <div style={{ fontSize: 12, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
          {step === 'upload' && (
            <>
              <button type="button" className="btn" style={ghost} onClick={onClose} disabled={extracting}>{t('common.cancel')}</button>
              <button type="button" className="btn btn-primary" disabled={!file || extracting} onClick={extract} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {extracting ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <ArrowRight size={14} />}
                {extracting ? t('docs.extracting') : t('docs.extract')}
              </button>
            </>
          )}
          {step === 'form' && (
            <>
              {mode === 'create'
                ? <button type="button" className="btn" style={ghost} onClick={() => { setError(null); setStep('upload'); }}>{t('docs.changeFile')}</button>
                : <button type="button" className="btn" style={ghost} onClick={onClose}>{t('common.cancel')}</button>}
              <button type="button" className="btn btn-primary" onClick={toReview} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ArrowRight size={14} /> {t('docs.toReview')}
              </button>
            </>
          )}
          {step === 'review' && (
            <>
              <button type="button" className="btn" style={ghost} disabled={saving} onClick={() => setStep('form')}>{t('potential.backToEdit')}</button>
              <button type="button" className="btn btn-primary" disabled={saving} onClick={approve} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {saving ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <CheckCircle2 size={14} />}
                {mode === 'edit' ? t('potential.approveSave') : t('docs.approvePublish')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ProjectDocumentsPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const trackedFilter = searchParams.get('project');
  const [q, setQ] = useState('');
  const [scope, setScope] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // {mode, doc}
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const hasOrg = Boolean(user?.organization_id);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { q: q.trim(), page, size: PAGE_SIZE, tracked_project_id: trackedFilter };
      if (scope === 'mine') params.mine = true;
      else if (scope !== 'all') params.visibility = scope;
      setData(await projectDocumentsService.list(params));
    } catch (e) {
      setError(errText(e, t('docs.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [q, scope, page, trackedFilter, t]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const download = async (doc) => {
    try {
      await projectDocumentsService.download(doc);
    } catch (e) {
      flash('error', errText(e, t('docs.downloadFailed')));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await projectDocumentsService.remove(deleting.id);
      setDeleting(null);
      flash('success', t('docs.deleted'));
      load();
    } catch (e) {
      flash('error', errText(e, t('docs.deleteFailed')));
    } finally {
      setDeleteBusy(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / PAGE_SIZE));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={22} style={{ color: '#2563eb' }} /> {t('nav.projectDocs')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>{t('docs.pageDesc')}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setModal({ mode: 'create' })} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Upload size={15} /> {t('docs.uploadButton')}
        </button>
      </div>

      {msg && (
        <div style={{ fontSize: 12.5, padding: '8px 12px', borderRadius: 9, color: msg.type === 'error' ? '#b91c1c' : '#047857', background: msg.type === 'error' ? 'rgba(220,38,38,.08)' : 'rgba(16,185,129,.1)' }}>
          {msg.text}
        </div>
      )}

      <div className="card" style={{ padding: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder={t('docs.searchPlaceholder')}
            style={{ width: '100%', padding: '8px 10px 8px 32px', fontSize: 12.5, boxSizing: 'border-box' }}
          />
        </div>
        <select className="form-input" value={scope} onChange={(e) => { setScope(e.target.value); setPage(1); }} style={{ padding: '8px 10px', fontSize: 12.5 }}>
          <option value="all">{t('docs.scopeAll')}</option>
          <option value="mine">{t('docs.scopeMine')}</option>
          <option value="private">{t('docs.visPrivate')}</option>
          <option value="organization">{t('docs.visOrg')}</option>
          <option value="public">{t('docs.visPublic')}</option>
        </select>
        {trackedFilter && (
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('docs.filteredByProject')}</span>
        )}
      </div>

      {error && (
        <div style={{ fontSize: 12.5, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13, padding: 16 }}>
          <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> {t('common.loading')}
        </div>
      )}

      {!loading && !error && data.items.length === 0 && (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileText size={30} />
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 8, color: 'var(--text-primary)' }}>{t('docs.empty')}</div>
          <div style={{ fontSize: 12.5, marginTop: 4 }}>{t('docs.emptyHint')}</div>
        </div>
      )}

      {!loading && data.items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {data.items.map((d) => (
            <div key={d.id} className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.35 }}>{d.project_name}</div>
                <VisibilityBadge value={d.visibility} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 14px', fontSize: 11.5, color: 'var(--text-secondary)' }}>
                <span><MapPin size={11} /> {d.location || '—'}</span>
                <span><Calendar size={11} /> {t('docs.fieldDocDate')}: {fmtDate(d.doc_date)}</span>
                <span>{t('docs.fieldSummaryDate')}: {fmtDate(d.summary_date)}</span>
              </div>
              {d.tracked_project_name && (
                <div style={{ fontSize: 11.5, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FolderKanban size={12} /> {d.tracked_project_name}
                </div>
              )}
              {d.summary && (
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'pre-wrap' }}>
                  {d.summary}
                </p>
              )}
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 0 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.filename}>
                    <FileText size={11} /> {d.filename} · {fmtSize(d.size_bytes)}
                  </div>
                  <div>{t('docs.postedBy', { name: d.is_owner ? t('docs.you') : (d.owner_name || '—') })} · {fmtDate(d.created_at)}</div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button type="button" className="btn" title={t('docs.download')} onClick={() => download(d)} style={{ padding: 6 }}>
                    <Download size={14} />
                  </button>
                  {d.is_owner && (
                    <>
                      <button type="button" className="btn" title={t('docs.edit')} onClick={() => setModal({ mode: 'edit', doc: d })} style={{ padding: 6 }}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="btn" title={t('docs.delete')} onClick={() => setDeleting(d)} style={{ padding: 6, color: '#dc2626' }}>
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
          <button type="button" className="btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
          <span>{page} / {totalPages}</span>
          <button type="button" className="btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
        </div>
      )}

      {modal && (
        <DocumentModal
          mode={modal.mode}
          doc={modal.doc}
          hasOrg={hasOrg}
          onClose={() => setModal(null)}
          onSaved={(_saved, mode) => {
            setModal(null);
            flash('success', mode === 'edit' ? t('docs.updated') : t('docs.published'));
            load();
          }}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(deleting)}
        title={t('docs.deleteTitle')}
        message={t('docs.deleteMessage')}
        itemName={deleting?.project_name}
        itemSub={deleting?.filename}
        confirmText={t('docs.delete')}
        cancelText={t('common.cancel')}
        type="danger"
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
