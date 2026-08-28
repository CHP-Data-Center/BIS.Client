// src/pages/PotentialProjectsPage.jsx
// Dự án tiềm năng theo lĩnh vực + cấu hình lĩnh vực người dùng theo dõi.
import { useState, useEffect, useCallback } from 'react';
import {
  Target, Settings2, Loader2, ExternalLink, Plus, Check, X,
  Building2, Calendar, Coins, MapPin, Filter, RefreshCw, AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { potentialService, itemKey } from '../services/potential';
import { projectsService } from '../services/projects';
import { useLang } from '../context/LanguageContext';

const PAGE_SIZE = 20;

// Màu theo loại nguồn — tách khỏi màu thương hiệu để "loại nguồn" đọc được ngay.
const KIND_STYLE = {
  procurement: { bg: '#eff6ff', fg: '#1d4ed8', dark: '#3b82f6' },
  oda: { bg: '#ecfdf5', fg: '#047857', dark: '#10b981' },
  article: { bg: '#fffbeb', fg: '#b45309', dark: '#f59e0b' },
};

function kindLabel(t, kind) {
  return {
    procurement: t('potential.kindProcurement'),
    oda: t('potential.kindOda'),
    article: t('potential.kindArticle'),
  }[kind] || kind;
}

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Chip lĩnh vực — bấm để bật/tắt bộ lọc. */
function SectorChip({ sector, active, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(sector.slug)}
      aria-pressed={active}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '7px 14px', borderRadius: 999, cursor: 'pointer',
        fontSize: 13, fontWeight: 700, transition: 'all .15s ease',
        background: active ? 'var(--brand-500)' : 'var(--bg-surface-2)',
        color: active ? '#fff' : 'var(--text-secondary)',
        border: `1.5px solid ${active ? 'var(--brand-500)' : 'var(--border)'}`,
      }}
    >
      {sector.name}
      <span style={{
        fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 999,
        background: active ? 'rgba(255,255,255,.22)' : 'var(--bg-surface)',
        color: active ? '#fff' : 'var(--text-muted)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {sector.total}
      </span>
    </button>
  );
}

/** Một dự án tiềm năng. */
function PotentialCard({ item, onTrack, tracking, tracked }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const ks = KIND_STYLE[item.kind] || KIND_STYLE.article;

  // Gói thầu và bài viết xem được ngay trong app; dự án ODA có URL ngoài.
  const openInApp =
    item.kind === 'procurement' ? `/procurement/${encodeURIComponent(item.ref)}` : null;

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
          background: ks.bg, color: ks.fg, flex: 'none',
        }}>
          {kindLabel(t, item.kind)}
        </span>
        {item.stage && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
            background: 'var(--bg-surface-2)', color: 'var(--text-muted)',
            border: '1px solid var(--border)', flex: 'none',
          }}>
            {item.stage}
          </span>
        )}
        {item.published_at && (
          <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--text-muted)', flex: 'none' }}>
            {fmtDate(item.published_at)}
          </span>
        )}
      </div>

      <h3 style={{
        margin: 0, fontSize: 15.5, fontWeight: 800, lineHeight: 1.45,
        color: 'var(--text-primary)',
      }}>
        {item.title}
      </h3>

      {/* Chi tiết — chỉ hiện trường THẬT SỰ có dữ liệu, không dựng ô trống */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
        {item.investor && (
          <div style={{ display: 'flex', gap: 8, color: 'var(--text-secondary)' }}>
            <Building2 size={14} style={{ flex: 'none', marginTop: 2, color: 'var(--text-muted)' }} />
            <span><strong style={{ fontWeight: 700 }}>{t('potential.investor')}:</strong> {item.investor}</span>
          </div>
        )}
        {item.amount && (
          <div style={{ display: 'flex', gap: 8, color: 'var(--text-secondary)' }}>
            <Coins size={14} style={{ flex: 'none', marginTop: 2, color: 'var(--text-muted)' }} />
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              <strong style={{ fontWeight: 700 }}>{t('potential.value')}:</strong> {item.amount}
            </span>
          </div>
        )}
        {item.province && (
          <div style={{ display: 'flex', gap: 8, color: 'var(--text-secondary)' }}>
            <MapPin size={14} style={{ flex: 'none', marginTop: 2, color: 'var(--text-muted)' }} />
            <span>{item.province}</span>
          </div>
        )}
        {item.expected_date && (
          <div style={{ display: 'flex', gap: 8, color: 'var(--text-secondary)' }}>
            <Calendar size={14} style={{ flex: 'none', marginTop: 2, color: 'var(--text-muted)' }} />
            <span>
              <strong style={{ fontWeight: 700 }}>{t('potential.expectedDate')}:</strong> {item.expected_date}
            </span>
          </div>
        )}
        {item.close_date && (
          <div style={{ display: 'flex', gap: 8, color: 'var(--text-secondary)' }}>
            <Calendar size={14} style={{ flex: 'none', marginTop: 2, color: '#ef4444' }} />
            <span>
              <strong style={{ fontWeight: 700 }}>{t('potential.closeDate')}:</strong> {item.close_date}
            </span>
          </div>
        )}
      </div>

      {item.sector_names?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {item.sector_names.map((s) => (
            <span key={s} style={{
              fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 6,
              background: 'var(--brand-50)', color: 'var(--brand-700)',
            }}>
              {s}
            </span>
          ))}
        </div>
      )}

      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4,
        borderTop: '1px solid var(--border-subtle)', marginTop: 'auto',
      }}>
        <button
          type="button"
          onClick={() => onTrack(item)}
          disabled={tracking || tracked}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
            border: '1px solid var(--brand-500)',
            background: tracked ? 'var(--brand-50)' : 'var(--brand-500)',
            color: tracked ? 'var(--brand-700)' : '#fff',
            cursor: tracked || tracking ? 'default' : 'pointer',
            opacity: tracking ? 0.6 : 1,
          }}
        >
          {tracked ? <Check size={14} /> : tracking ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
          {tracked ? t('potential.tracked') : t('potential.track')}
        </button>

        {openInApp ? (
          <button
            type="button"
            onClick={() => navigate(openInApp)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
              border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            <ExternalLink size={14} /> {t('potential.viewSource')}
          </button>
        ) : item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
              border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
              color: 'var(--text-secondary)', textDecoration: 'none',
            }}
          >
            <ExternalLink size={14} /> {item.source_name || t('potential.viewSource')}
          </a>
        ) : null}
      </div>
    </div>
  );
}

/** Modal chọn lĩnh vực theo dõi. */
function SectorConfigModal({ open, onClose, sectors, watched, onSave, saving }) {
  const { t } = useLang();
  const [picked, setPicked] = useState(watched);

  useEffect(() => { setPicked(watched); }, [watched, open]);

  if (!open) return null;

  const toggle = (slug) =>
    setPicked((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t('potential.configTitle')}
        style={{
          background: 'var(--bg-surface)', borderRadius: 20, padding: 24,
          width: '100%', maxWidth: 540, maxHeight: '86vh', overflowY: 'auto',
          border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>
              {t('potential.configTitle')}
            </h2>
            <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {t('potential.configDesc')}
            </p>
          </div>
          <button
            type="button" onClick={onClose} aria-label="Đóng"
            style={{
              marginLeft: 'auto', border: 'none', background: 'var(--bg-surface-2)',
              borderRadius: 10, width: 32, height: 32, cursor: 'pointer', flex: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
            }}
          >
            <X size={17} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sectors.map((s) => {
            const on = picked.includes(s.slug);
            return (
              <label
                key={s.slug}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                  padding: '11px 14px', borderRadius: 12,
                  background: on ? 'var(--brand-50)' : 'var(--bg-surface-2)',
                  border: `1.5px solid ${on ? 'var(--brand-400)' : 'transparent'}`,
                }}
              >
                <input
                  type="checkbox" checked={on} onChange={() => toggle(s.slug)}
                  style={{ width: 17, height: 17, accentColor: 'var(--brand-500)', cursor: 'pointer' }}
                />
                <span style={{
                  fontSize: 14, fontWeight: 700,
                  color: on ? 'var(--brand-700)' : 'var(--text-primary)',
                }}>
                  {s.name}
                </span>
                <span style={{
                  marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {t('potential.sectorCount', { count: s.total })}
                </span>
              </label>
            );
          })}
        </div>

        <button
          type="button" onClick={() => onSave(picked)} disabled={saving}
          style={{
            padding: '12px 20px', borderRadius: 12, border: 'none',
            background: 'var(--brand-500)', color: '#fff', fontSize: 14, fontWeight: 800,
            cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {saving && <Loader2 size={16} className="spin" />}
          {t('potential.save')}
        </button>
      </div>
    </div>
  );
}

export default function PotentialProjectsPage() {
  const { t } = useLang();

  const [sectors, setSectors] = useState([]);
  const [watched, setWatched] = useState([]);
  const [filterSectors, setFilterSectors] = useState([]); // rỗng = dùng lĩnh vực đang theo dõi
  const [kind, setKind] = useState('');
  const [minAmount, setMinAmount] = useState('');

  const [data, setData] = useState({ items: [], total: 0, sectors_applied: [] });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [showConfig, setShowConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [trackingKey, setTrackingKey] = useState(null);
  const [trackedKeys, setTrackedKeys] = useState(() => new Set());
  const [msg, setMsg] = useState(null);

  const toast = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  // Danh mục lĩnh vực + lựa chọn của người dùng — /me/sectors trả kèm `available`
  // nên một lần gọi là đủ cho cả hai.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await potentialService.getWatchedSectors();
        if (!alive) return;
        setWatched(res.sectors || []);
        setSectors(res.available || []);
      } catch {
        if (alive) setSectors([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await potentialService.list({
        sectors: filterSectors,
        kinds: kind ? [kind] : undefined,
        minAmount: minAmount ? Number(minAmount) : undefined,
        page,
        size: PAGE_SIZE,
      });
      setData(res);
    } catch (e) {
      setErr(e.response?.data?.detail || 'Không tải được danh sách dự án tiềm năng.');
    } finally {
      setLoading(false);
    }
  }, [filterSectors, kind, minAmount, page]);

  useEffect(() => { load(); }, [load]);

  const toggleSector = (slug) => {
    setPage(1);
    setFilterSectors((cur) =>
      cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]
    );
  };

  const saveSectors = async (slugs) => {
    setSaving(true);
    try {
      const res = await potentialService.setWatchedSectors(slugs);
      setWatched(res.sectors || []);
      setSectors(res.available || []);
      setShowConfig(false);
      setPage(1);
      toast('success', t('potential.saved'));
      load();
    } catch (e) {
      toast('error', e.response?.data?.detail || 'Không lưu được lĩnh vực theo dõi.');
    } finally {
      setSaving(false);
    }
  };

  const trackItem = async (item) => {
    const key = itemKey(item);
    setTrackingKey(key);
    try {
      await projectsService.createProject({
        name: item.title.slice(0, 255),
        keyword_filter: item.title.slice(0, 512),
        investor: item.investor || undefined,
        sector: item.sectors?.[0] || undefined,
        province: item.province || undefined,
      });
      setTrackedKeys((cur) => new Set(cur).add(key));
      toast('success', `Đã thêm "${item.title.slice(0, 48)}…" vào danh sách theo dõi.`);
    } catch (e) {
      // 409 = đã theo dõi rồi: đánh dấu luôn cho khớp thực tế thay vì báo lỗi đỏ.
      if (e.response?.status === 409) {
        setTrackedKeys((cur) => new Set(cur).add(key));
        toast('success', 'Dự án này đã có trong danh sách theo dõi.');
      } else {
        toast('error', e.response?.data?.detail || 'Không thêm được vào danh sách theo dõi.');
      }
    } finally {
      setTrackingKey(null);
    }
  };

  const applied = data.sectors_applied || [];
  const totalPages = Math.max(1, Math.ceil((data.total || 0) / PAGE_SIZE));
  // Gói dịch vụ chỉ cho xem tin báo chí -> backend lọc sạch gói thầu & ODA.
  const lockedToArticles =
    !loading && !err && data.items.length > 0 && data.items.every((i) => i.kind === 'article');

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 100px)' }}>
      {msg && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 14, fontSize: 13.5, fontWeight: 700,
          background: msg.type === 'success' ? '#10b981' : '#ef4444', color: '#fff',
          boxShadow: '0 8px 24px rgba(0,0,0,.18)', maxWidth: 420,
        }}>
          {msg.text}
        </div>
      )}

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 55%, #0f172a 100%)',
        borderRadius: 24, padding: '28px 32px', color: '#fff', marginBottom: 24,
        border: '1px solid rgba(255,255,255,.1)', boxShadow: '0 12px 36px rgba(15,23,42,.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 20, flex: 'none',
            background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(16,185,129,.4)',
          }}>
            <Target size={30} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: '#fff' }}>
              {t('potential.title')}
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0', maxWidth: '58ch' }}>
              {t('potential.subtitle')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowConfig(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px',
            borderRadius: 14, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #10b981, #0d9488)',
            color: '#fff', fontWeight: 800, fontSize: 13.5,
            boxShadow: '0 6px 20px rgba(16,185,129,.4)',
          }}
        >
          <Settings2 size={18} /> {t('potential.configSectors')}
        </button>
      </div>

      {/* Bộ lọc */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 18, padding: 18, marginBottom: 20,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Filter size={15} style={{ color: 'var(--brand-500)' }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
            {t('projects.sector')}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {applied.length > 0
              ? `${t('potential.filteringBy')}: ${applied.length}`
              : t('potential.noFilter')}
          </span>
          {filterSectors.length > 0 && (
            <button
              type="button"
              onClick={() => { setFilterSectors([]); setPage(1); }}
              style={{
                marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5,
                border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 12.5, fontWeight: 700, color: 'var(--brand-600)',
              }}
            >
              <RefreshCw size={13} /> {t('potential.allSectors')}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {sectors.map((s) => (
            <SectorChip
              key={s.slug}
              sector={s}
              active={filterSectors.includes(s.slug)}
              onToggle={toggleSector}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>
              {t('potential.kindAll')}
            </span>
            <select
              value={kind}
              onChange={(e) => { setKind(e.target.value); setPage(1); }}
              style={{
                padding: '9px 12px', borderRadius: 10, fontSize: 13,
                border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
                color: 'var(--text-primary)', minWidth: 170, cursor: 'pointer',
              }}
            >
              <option value="">{t('potential.kindAll')}</option>
              <option value="procurement">{t('potential.kindProcurement')}</option>
              <option value="oda">{t('potential.kindOda')}</option>
              <option value="article">{t('potential.kindArticle')}</option>
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>
              {t('potential.minAmount')}
            </span>
            <input
              type="number" min="0" step="1000000000" value={minAmount}
              onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
              placeholder="0"
              style={{
                padding: '9px 12px', borderRadius: 10, fontSize: 13, width: 190,
                border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
                color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums',
              }}
            />
          </label>

          {minAmount && (
            <p style={{
              margin: 0, fontSize: 11.5, color: '#b45309', maxWidth: '42ch',
              display: 'flex', gap: 6, lineHeight: 1.5,
            }}>
              <AlertCircle size={13} style={{ flex: 'none', marginTop: 2 }} />
              {t('potential.minAmountHint')}
            </p>
          )}
        </div>
      </div>

      {/* Kết quả */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={26} className="spin" style={{ margin: '0 auto 10px' }} />
          <div style={{ fontSize: 13 }}>{t('common.loading')}</div>
        </div>
      ) : err ? (
        <div className="empty-state" style={{ minHeight: 260 }}>
          <div className="empty-icon">⚠️</div>
          <div className="empty-title">{err}</div>
        </div>
      ) : data.items.length === 0 ? (
        <div className="empty-state" style={{ minHeight: 300 }}>
          <div className="empty-icon">🎯</div>
          <div className="empty-title">{t('potential.empty')}</div>
          <div className="empty-sub">{t('potential.emptySub')}</div>
        </div>
      ) : (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 14, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>
              {t('potential.total', { count: data.total })}
            </span>
            {lockedToArticles && (
              <span style={{
                fontSize: 12, fontWeight: 700, color: '#b45309', background: '#fffbeb',
                border: '1px solid #fde68a', padding: '4px 10px', borderRadius: 999,
              }}>
                {t('potential.emptyLocked')}
              </span>
            )}
          </div>

          <div style={{
            display: 'grid', gap: 16,
            gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
          }}>
            {data.items.map((item) => (
              <PotentialCard
                key={itemKey(item)}
                item={item}
                onTrack={trackItem}
                tracking={trackingKey === itemKey(item)}
                tracked={trackedKeys.has(itemKey(item))}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              gap: 12, marginTop: 26,
            }}>
              <button
                type="button" disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  border: '1px solid var(--border)', background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.45 : 1,
                }}
              >
                ← Trước
              </button>
              <span style={{
                fontSize: 13, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums',
              }}>
                {page} / {totalPages}
              </span>
              <button
                type="button" disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  border: '1px solid var(--border)', background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  cursor: page >= totalPages ? 'default' : 'pointer',
                  opacity: page >= totalPages ? 0.45 : 1,
                }}
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}

      <SectorConfigModal
        open={showConfig}
        onClose={() => setShowConfig(false)}
        sectors={sectors}
        watched={watched}
        onSave={saveSectors}
        saving={saving}
      />
    </div>
  );
}
