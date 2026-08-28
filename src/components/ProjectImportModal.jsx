// src/components/ProjectImportModal.jsx
// Hai đường đưa dự án vào danh sách theo dõi:
//   · Excel  — người dùng đã khai từng dòng  -> TẠO THẲNG
//   · Profile — máy đoán từ hồ sơ năng lực   -> CHỈ GỢI Ý, người dùng chọn rồi mới tạo
import { useState, useEffect, useRef } from 'react';
import {
  X, FileSpreadsheet, FileText, UploadCloud, Loader2, Check,
  AlertTriangle, Plus, Quote,
} from 'lucide-react';
import { projectsService } from '../services/projects';
import { useLang } from '../context/LanguageContext';

const MAX_BYTES = 5 * 1024 * 1024; // khớp trần phía backend
const EXCEL_ACCEPT = '.xlsx';
const PROFILE_ACCEPT = '.pdf,.docx,.txt,.md';

/** Ô chọn file dùng chung cho cả hai tab. */
function FilePicker({ accept, file, onPick, hint, disabled }) {
  const inputRef = useRef(null);
  const { t } = useLang();

  return (
    <div>
      <input
        ref={inputRef} type="file" accept={accept} style={{ display: 'none' }}
        onChange={(e) => onPick(e.target.files?.[0] || null)}
      />
      <button
        type="button" disabled={disabled}
        onClick={() => inputRef.current?.click()}
        style={{
          width: '100%', padding: '22px 18px', borderRadius: 14, cursor: disabled ? 'default' : 'pointer',
          border: `2px dashed ${file ? 'var(--brand-400)' : 'var(--border)'}`,
          background: file ? 'var(--brand-50)' : 'var(--bg-surface-2)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          color: 'var(--text-secondary)', transition: 'all .15s ease',
        }}
      >
        <UploadCloud size={26} style={{ color: file ? 'var(--brand-600)' : 'var(--text-muted)' }} />
        <span style={{
          fontSize: 13.5, fontWeight: 800,
          color: file ? 'var(--brand-700)' : 'var(--text-primary)',
          wordBreak: 'break-all',
        }}>
          {file ? file.name : hint}
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
          {file
            ? `${(file.size / 1024).toFixed(0)} KB`
            : t('projects.noFilePicked')}
        </span>
      </button>
    </div>
  );
}

/** Tab 1 — Excel: tạo thẳng dự án theo dõi. */
function ExcelTab({ onDone }) {
  const { t } = useLang();
  const [tpl, setTpl] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    projectsService.getImportTemplate().then(setTpl).catch(() => setTpl(null));
  }, []);

  const pick = (f) => {
    setResult(null);
    setErr(f && f.size > MAX_BYTES ? t('projects.fileTooBig') : null);
    setFile(f && f.size > MAX_BYTES ? null : f);
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await projectsService.importExcel(file);
      setResult(res);
      if (res.row_created > 0) onDone();
    } catch (e) {
      setErr(e.response?.data?.detail || 'Không nhập được file này.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
        {t('projects.importDesc')}
      </p>

      {tpl && (
        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 440 }}>
            <thead>
              <tr>
                {['', t('projects.nameLabel'), t('projects.note')].map((h, i) => (
                  <th key={i} style={{
                    textAlign: 'left', padding: '8px 12px', fontSize: 11,
                    letterSpacing: '.05em', textTransform: 'uppercase',
                    color: 'var(--text-muted)', background: 'var(--bg-surface-2)',
                    borderBottom: '1px solid var(--border)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tpl.columns.map((c) => (
                <tr key={c.column}>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {c.column}
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{c.header}</strong>
                    {c.required && (
                      <span style={{
                        marginLeft: 7, fontSize: 10, fontWeight: 800, padding: '1px 6px',
                        borderRadius: 5, background: '#fee2e2', color: '#b91c1c',
                      }}>
                        {t('projects.colRequired')}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    {c.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FilePicker accept={EXCEL_ACCEPT} file={file} onPick={pick} disabled={busy}
        hint={t('projects.importPick')} />

      {err && (
        <div style={{
          display: 'flex', gap: 9, padding: '11px 14px', borderRadius: 11,
          background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
          fontSize: 13, fontWeight: 600,
        }}>
          <AlertTriangle size={16} style={{ flex: 'none', marginTop: 1 }} /> {err}
        </div>
      )}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(112px,1fr))', gap: 10 }}>
            {[
              { label: t('projects.importCreated'), value: result.row_created, color: '#10b981' },
              { label: t('projects.importSkipped'), value: result.row_skipped, color: '#f59e0b' },
              { label: t('projects.importFailed'), value: result.row_failed, color: '#ef4444' },
              { label: t('projects.importTotal'), value: result.row_total, color: 'var(--text-muted)' },
            ].map((s) => (
              <div key={s.label} style={{
                padding: '12px 14px', borderRadius: 12, background: 'var(--bg-surface-2)',
                border: '1px solid var(--border)',
              }}>
                <div style={{
                  fontSize: 22, fontWeight: 900, color: s.color, fontVariantNumeric: 'tabular-nums',
                }}>{s.value}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 700 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {result.errors?.length > 0 && (
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 7 }}>
                {t('projects.importErrors')}
              </div>
              <div style={{
                maxHeight: 170, overflowY: 'auto', borderRadius: 11,
                border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
              }}>
                {result.errors.map((e, i) => (
                  <div key={i} style={{
                    padding: '8px 13px', fontSize: 12.5, color: 'var(--text-secondary)',
                    borderBottom: i < result.errors.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}>
                    <strong style={{ color: '#b91c1c' }}>{t('projects.importRow')} {e.row}</strong>
                    {' — '}{e.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <button
        type="button" onClick={run} disabled={!file || busy}
        style={{
          padding: '13px 20px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 800,
          background: !file || busy ? 'var(--bg-surface-2)' : 'var(--brand-500)',
          color: !file || busy ? 'var(--text-muted)' : '#fff',
          cursor: !file || busy ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {busy ? <Loader2 size={16} className="spin" /> : <FileSpreadsheet size={16} />}
        {t('projects.importRun')}
      </button>
    </div>
  );
}

/** Tab 2 — Profile: máy gợi ý, người dùng chọn. */
function ProfileTab({ onDone }) {
  const { t } = useLang();
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [res, setRes] = useState(null);
  const [picked, setPicked] = useState(() => new Set());
  const [err, setErr] = useState(null);
  const [added, setAdded] = useState(null);

  const pick = (f) => {
    setRes(null); setPicked(new Set()); setAdded(null);
    setErr(f && f.size > MAX_BYTES ? t('projects.fileTooBig') : null);
    setFile(f && f.size > MAX_BYTES ? null : f);
  };

  const run = async () => {
    if (!file) return;
    setBusy(true); setErr(null); setAdded(null);
    try {
      const data = await projectsService.extractFromProfile(file);
      setRes(data);
      // Mặc định chọn hết: người dùng bỏ bớt nhanh hơn tick từng cái.
      setPicked(new Set(data.candidates.map((_, i) => i)));
    } catch (e) {
      setErr(e.response?.data?.detail || 'Không đọc được file này.');
    } finally {
      setBusy(false);
    }
  };

  const toggle = (i) =>
    setPicked((cur) => {
      const next = new Set(cur);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });

  const addSelected = async () => {
    if (!res || picked.size === 0) return;
    setAdding(true);
    let ok = 0, skip = 0;
    for (const i of picked) {
      const c = res.candidates[i];
      try {
        await projectsService.createProject({
          name: c.name.slice(0, 255),
          keyword_filter: (c.keyword_filter || c.name).slice(0, 512),
          investor: c.investor || undefined,
          sector: c.sector || undefined,
          origin: undefined,
        });
        ok += 1;
      } catch (e) {
        // 409 = đã theo dõi rồi, không phải lỗi người dùng cần sửa.
        if (e.response?.status === 409) skip += 1;
      }
    }
    setAdding(false);
    setAdded({ ok, skip });
    if (ok > 0) onDone();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
        {t('projects.profileDesc')}
      </p>

      <FilePicker accept={PROFILE_ACCEPT} file={file} onPick={pick} disabled={busy}
        hint={t('projects.profilePick')} />

      {err && (
        <div style={{
          display: 'flex', gap: 9, padding: '11px 14px', borderRadius: 11,
          background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
          fontSize: 13, fontWeight: 600,
        }}>
          <AlertTriangle size={16} style={{ flex: 'none', marginTop: 1 }} /> {err}
        </div>
      )}

      {!res && (
        <button
          type="button" onClick={run} disabled={!file || busy}
          style={{
            padding: '13px 20px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 800,
            background: !file || busy ? 'var(--bg-surface-2)' : 'var(--brand-500)',
            color: !file || busy ? 'var(--text-muted)' : '#fff',
            cursor: !file || busy ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {busy ? <Loader2 size={16} className="spin" /> : <FileText size={16} />}
          {t('projects.profileRun')}
        </button>
      )}

      {res && (
        <>
          {/* Ghi chú của backend (vd PDF scan ảnh cần OCR) — hiện lên, đừng để màn hình trắng */}
          {res.note && res.candidates.length === 0 && (
            <div style={{
              display: 'flex', gap: 9, padding: '12px 14px', borderRadius: 11,
              background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e',
              fontSize: 13, lineHeight: 1.6,
            }}>
              <AlertTriangle size={16} style={{ flex: 'none', marginTop: 2 }} />
              <span>{res.note}</span>
            </div>
          )}

          {res.candidates.length === 0 ? (
            !res.note && (
              <div style={{ padding: 26, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13.5 }}>
                {t('projects.profileNone')}
              </div>
            )
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {t('projects.profileFound', { count: res.candidates.length })}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPicked(picked.size === res.candidates.length
                      ? new Set()
                      : new Set(res.candidates.map((_, i) => i)))
                  }
                  style={{
                    marginLeft: 'auto', border: 'none', background: 'none', cursor: 'pointer',
                    fontSize: 12.5, fontWeight: 700, color: 'var(--brand-600)',
                  }}
                >
                  {picked.size === res.candidates.length
                    ? t('projects.deselectAll')
                    : t('projects.selectAll')}
                </button>
              </div>

              <div style={{
                maxHeight: 330, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {res.candidates.map((c, i) => {
                  const on = picked.has(i);
                  return (
                    <label
                      key={`${c.name}-${i}`}
                      style={{
                        display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 12,
                        cursor: 'pointer', alignItems: 'flex-start',
                        background: on ? 'var(--brand-50)' : 'var(--bg-surface-2)',
                        border: `1.5px solid ${on ? 'var(--brand-400)' : 'transparent'}`,
                      }}
                    >
                      <input
                        type="checkbox" checked={on} onChange={() => toggle(i)}
                        style={{ width: 16, height: 16, marginTop: 3, accentColor: 'var(--brand-500)', cursor: 'pointer' }}
                      />
                      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <div style={{
                          fontSize: 13.5, fontWeight: 800,
                          color: on ? 'var(--brand-700)' : 'var(--text-primary)',
                        }}>
                          {c.name}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {c.sector_name && (
                            <span style={{
                              fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                              background: 'var(--bg-surface)', color: 'var(--text-secondary)',
                              border: '1px solid var(--border)',
                            }}>{c.sector_name}</span>
                          )}
                          {c.investor && (
                            <span style={{
                              fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                              background: 'var(--bg-surface)', color: 'var(--text-secondary)',
                              border: '1px solid var(--border)',
                            }}>{c.investor}</span>
                          )}
                          {c.occurrences > 1 && (
                            <span style={{ fontSize: 10.5, color: 'var(--text-muted)', padding: '2px 4px' }}>
                              {c.occurrences} {t('projects.profileMentions')}
                            </span>
                          )}
                        </div>
                        {c.evidence && (
                          <div style={{
                            display: 'flex', gap: 6, fontSize: 11.5, color: 'var(--text-muted)',
                            lineHeight: 1.5, fontStyle: 'italic',
                          }}>
                            <Quote size={11} style={{ flex: 'none', marginTop: 3 }} />
                            <span>{c.evidence}</span>
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {added && (
                <div style={{
                  display: 'flex', gap: 9, padding: '11px 14px', borderRadius: 11,
                  background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857',
                  fontSize: 13, fontWeight: 600,
                }}>
                  <Check size={16} style={{ flex: 'none', marginTop: 1 }} />
                  Đã thêm {added.ok} dự án
                  {added.skip > 0 && ` · ${added.skip} dự án đã có sẵn`}
                </div>
              )}

              <button
                type="button" onClick={addSelected} disabled={picked.size === 0 || adding}
                style={{
                  padding: '13px 20px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 800,
                  background: picked.size === 0 || adding ? 'var(--bg-surface-2)' : 'var(--brand-500)',
                  color: picked.size === 0 || adding ? 'var(--text-muted)' : '#fff',
                  cursor: picked.size === 0 || adding ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {adding ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                {t('projects.profileAddSelected', { count: picked.size })}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function ProjectImportModal({ open, onClose, onImported }) {
  const { t } = useLang();
  const [tab, setTab] = useState('excel');

  useEffect(() => { if (open) setTab('excel'); }, [open]);

  if (!open) return null;

  const TABS = [
    { id: 'excel', label: t('projects.tabImport'), icon: <FileSpreadsheet size={15} /> },
    { id: 'profile', label: t('projects.tabProfile'), icon: <FileText size={15} /> },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,.65)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={tab === 'excel' ? t('projects.importTitle') : t('projects.profileTitle')}
        style={{
          width: '100%', maxWidth: 620, maxHeight: '88vh', overflowY: 'auto',
          background: 'var(--bg-surface)', borderRadius: 22, padding: 26,
          border: '1px solid var(--border)', boxShadow: '0 20px 50px rgba(0,0,0,.3)',
          display: 'flex', flexDirection: 'column', gap: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>
            {tab === 'excel' ? t('projects.importTitle') : t('projects.profileTitle')}
          </h3>
          <button
            type="button" onClick={onClose} aria-label={t('common.cancel')}
            style={{
              marginLeft: 'auto', border: 'none', background: 'var(--bg-surface-2)',
              borderRadius: 10, width: 32, height: 32, cursor: 'pointer', flex: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <X size={17} />
          </button>
        </div>

        <div style={{
          display: 'flex', gap: 6, padding: 4, borderRadius: 12,
          background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
        }}>
          {TABS.map((x) => (
            <button
              key={x.id} type="button" onClick={() => setTab(x.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '9px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 800,
                background: tab === x.id ? 'var(--bg-surface)' : 'transparent',
                color: tab === x.id ? 'var(--brand-700)' : 'var(--text-muted)',
                boxShadow: tab === x.id ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
              }}
            >
              {x.icon} {x.label}
            </button>
          ))}
        </div>

        {tab === 'excel'
          ? <ExcelTab onDone={onImported} />
          : <ProfileTab onDone={onImported} />}
      </div>
    </div>
  );
}
