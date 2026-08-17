// src/pages/ProcurementDetailPage.jsx
// Trang chi tiết gói thầu (TBMT / KHLCNT) — hiển thị NGAY TRONG APP từ dữ liệu đã crawl
// (details_json của muasamcong), thay vì đá người dùng sang cổng ngoài.
// Cùng bố cục với trang chi tiết ADB / World Bank.
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, ExternalLink, Bookmark, BookmarkCheck, Share2, ChevronRight,
  Loader2, Building2, Wallet, Landmark, Layers, FileText, CheckCircle2, Tag,
  MapPin, Gavel, Clock, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { odaService } from '../services/oda';
import { useLang } from '../context/LanguageContext';

const BRAND = '#0ea5e9';           // xanh dương — phân biệt với ADB (cam) / WB (xanh lá)
const SAVED_KEY = 'saved_procurement_items';  // dùng chung với danh sách ở WorldBankView

/** '2026-08-20 14:00' | '2026-08-20' → '20/08/2026 14:00'. Chuỗi lạ giữ nguyên. */
function fmtDate(value) {
  if (!value) return null;
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2}))?/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}${m[4] ? ` ${m[4]}` : ''}`;
  return String(value);
}

/** Số tiền → '12.500.000.000 VND (12,5 tỷ)'. Không phải số dương thì bỏ qua. */
function fmtMoney(value, unit = 'VND') {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  const full = `${n.toLocaleString('vi-VN')} ${unit || 'VND'}`;
  if (n >= 1e9) return `${full} (${(n / 1e9).toFixed(2).replace('.', ',')} tỷ)`;
  if (n >= 1e6) return `${full} (${(n / 1e6).toFixed(1).replace('.', ',')} triệu)`;
  return full;
}

/** Số ngày còn lại tới hạn đóng thầu (âm = đã đóng). null nếu không đọc được ngày. */
function daysUntil(value) {
  if (!value) return null;
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function Row({ label, value, mono = false }) {
  if (value == null || value === '' || value === 'N/A') return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', fontFamily: mono ? 'monospace' : undefined, wordBreak: 'break-word' }}>
        {value}
      </span>
    </div>
  );
}

function Section({ title, icon: Ic, children }) {
  return (
    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed var(--border-subtle)' }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        {Ic && <Ic size={15} color={BRAND} />} {title}
      </div>
      {children}
    </div>
  );
}

const GRID = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px 24px' };

/** Bảng đơn giản: cột định nghĩa qua `cols` = [{key, label, width?, render?}]. */
function SimpleTable({ cols, rows }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflowX: 'auto' }}>
      <div style={{ display: 'flex', background: 'var(--bg-surface-2)', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '8px 12px', minWidth: 520 }}>
        {cols.map((c) => (
          <div key={c.key} style={{ flex: c.width ? `0 0 ${c.width}` : 1, textAlign: c.align || 'left' }}>{c.label}</div>
        ))}
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', padding: '9px 12px', fontSize: 13, borderTop: '1px solid var(--border-subtle)', minWidth: 520 }}>
          {cols.map((c) => (
            <div key={c.key} style={{ flex: c.width ? `0 0 ${c.width}` : 1, textAlign: c.align || 'left', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
              {(c.render ? c.render(r) : r[c.key]) ?? '—'}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ProcurementDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useLang();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [related, setRelated] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Tải chi tiết: lần 1 nhanh (dữ liệu đã có trong DB) → nếu thiếu thì mới lấy từ cổng gốc.
  const load = useCallback(async (withEnrich) => {
    try {
      const data = await odaService.getProcurementDetail(id, { enrich: withEnrich });
      setItem(data);
      return data;
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true);
      return null;
    }
  }, [id]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotFound(false);
    load(false).then(async (data) => {
      if (!alive) return;
      setLoading(false);
      // Chưa có chi tiết nhưng có link nguồn → lấy nền, người dùng vẫn đọc được phần đã có.
      if (data?.detail_status === 'missing') {
        setEnriching(true);
        await load(true);
        if (alive) setEnriching(false);
      }
    });
    return () => { alive = false; };
  }, [load]);

  // Trạng thái đã lưu (localStorage, dùng chung với danh sách).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
      setBookmarked(saved.some((p) => String(p.id) === String(id)));
    } catch { /* localStorage hỏng → coi như chưa lưu */ }
  }, [id]);

  // Gói thầu liên quan: cùng bên mời thầu, bỏ chính nó.
  useEffect(() => {
    if (!item?.procuring_entity) return;
    odaService.getProcurement({ q: item.procuring_entity, size: 6 })
      .then((res) => setRelated((res?.items || []).filter((p) => p.id !== item.id).slice(0, 5)))
      .catch(() => {});
  }, [item?.id, item?.procuring_entity]);

  const handleBookmark = () => {
    if (!item) return;
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); } catch { saved = []; }
    const exists = saved.some((p) => String(p.id) === String(item.id));
    const next = exists
      ? saved.filter((p) => String(p.id) !== String(item.id))
      : [...saved, {
          id: item.id,
          project_name: item.title,
          countryshortname: item.procuring_entity,
          totalCommitmentAmount: item.package_count || 0,
          projectstatusdisplay: item.status,
          boardapprovaldate: item.publish_date,
          proj_last_upd_date: item.close_date,
          last_stage_reached_name: item.kind === 'notice' ? 'TBMT (Mời thầu)' : 'KHLCNT (Kế hoạch)',
          rawUrl: item.url,
          saved_at: new Date().toISOString(),
        }];
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    setBookmarked(!exists);
    showToast(exists ? t('proc.unsaved') : t('proc.saved'), exists ? 'info' : 'success');
  };

  const handleShare = () => {
    if (navigator.share && item) {
      navigator.share({ title: item.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => showToast(t('proc.copied'), 'success'))
        .catch(() => {});
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
        <Loader2 size={32} style={{ color: BRAND, animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{t('proc.loading')}</span>
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <div className="empty-icon">⚠️</div>
        <div className="empty-title">{t('proc.notFound')}</div>
        <div className="empty-sub">{t('proc.notFoundSub')}</div>
        <button className="btn btn-primary" onClick={() => nav(-1)} style={{ marginTop: 20 }}>
          <ArrowLeft size={14} /> {t('proc.back')}
        </button>
      </div>
    );
  }

  const isNotice = item.kind === 'notice';
  const d = item.details || {};
  const listPath = isNotice ? '/news/tbmt' : '/news/khlcnt';
  const listLabel = isNotice ? t('projects.procTitle') : t('projects.planTitle');
  const sourceUrl = item.url || `https://muasamcong.mpi.gov.vn/web/guest/ket-qua-tim-kiem?keyword=${encodeURIComponent(item.id)}`;
  const title = d.name || item.title;
  const price = fmtMoney(d.bid_price, d.price_unit) || fmtMoney(d.invest_total, d.invest_total_unit);
  const left = daysUntil(d.close_date || item.close_date);
  const lots = d.lots || [];
  const packages = d.packages || [];
  const decision = d.decision || null;
  const yesNo = (v) => (v === true ? t('proc.yes') : v === false ? t('proc.no') : null);

  const tags = [
    isNotice ? 'TBMT' : 'KHLCNT',
    item.id,
    d.field || item.sector,
    d.bid_form,
    item.procuring_entity,
  ].filter(Boolean);

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999, padding: '12px 20px', borderRadius: 12,
          background: toast.type === 'success' ? '#10b981' : '#3b82f6', color: 'white',
          fontWeight: 600, fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <CheckCircle2 size={16} /> {toast.msg}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <a onClick={() => nav('/dashboard')} style={{ cursor: 'pointer' }}>{t('nav.dashboard')}</a>
        <ChevronRight size={12} className="breadcrumb-sep" />
        <a onClick={() => nav(listPath)} style={{ cursor: 'pointer' }}>{listLabel}</a>
        <ChevronRight size={12} className="breadcrumb-sep" />
        <span style={{ color: 'var(--text-primary)', fontWeight: 600, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.id}
        </span>
      </div>

      <div className="article-layout">
        {/* CỘT TRÁI */}
        <div>
          <article className="article-card">
            {/* Hero */}
            <div style={{
              minHeight: 130,
              background: 'linear-gradient(135deg, rgba(14,165,233,0.14), rgba(2,132,199,0.08))',
              border: '1px solid rgba(14,165,233,0.25)',
              borderRadius: 'var(--radius-lg)', padding: '20px 24px',
              marginBottom: 'var(--space-6)', position: 'relative', overflow: 'hidden',
            }}>
              <Gavel size={140} style={{ position: 'absolute', right: -20, bottom: -30, opacity: 0.08, color: BRAND, pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', zIndex: 1, position: 'relative' }}>
                <span style={{ backgroundColor: BRAND, color: 'white', padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Gavel size={13} /> {isNotice ? t('projects.procTitle') : t('projects.planTitle')}
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#0369a1', background: 'rgba(14,165,233,0.15)', padding: '3px 9px', borderRadius: 8, border: '1px solid rgba(14,165,233,0.3)' }}>
                  {item.id}
                </span>
                {(item.status || d.status) && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                    {item.status || d.status}
                  </span>
                )}
                {left != null && (
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 12,
                    background: left < 0 ? '#f3f4f6' : left <= 3 ? '#fee2e2' : '#ecfdf5',
                    color: left < 0 ? '#4b5563' : left <= 3 ? '#b91c1c' : '#047857',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}>
                    <Clock size={12} /> {left < 0 ? t('proc.closed') : `${left} ${t('proc.daysLeft')}`}
                  </span>
                )}
              </div>

              {price && (
                <div style={{ marginTop: 12, zIndex: 1, position: 'relative' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {d.bid_price ? t('proc.bidPrice') : t('proc.investTotal')}
                  </span>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0369a1', lineHeight: 1.25 }}>{price}</div>
                </div>
              )}
            </div>

            <h1 className="article-title" style={{ fontSize: 23, lineHeight: 1.35, marginBottom: 16 }}>{title}</h1>

            {/* Đang lấy thêm chi tiết từ cổng gốc */}
            {enriching && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.25)', marginBottom: 16, fontSize: 13, color: '#0369a1', fontWeight: 600 }}>
                <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> {t('proc.enriching')}
              </div>
            )}

            {/* Không lấy được chi tiết */}
            {!enriching && item.detail_status !== 'ready' && (
              <div style={{ padding: '14px 18px', borderRadius: 12, background: '#fffbeb', border: '1.5px solid #fde68a', color: '#b45309', marginBottom: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={15} /> {t('proc.noDetail')}
                </div>
                <div style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.6 }}>{t('proc.noDetailSub')}</div>
                {item.detail_status === 'missing' && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                    onClick={async () => { setEnriching(true); await load(true); setEnriching(false); }}
                  >
                    <RefreshCw size={13} /> {t('proc.retryDetail')}
                  </button>
                )}
              </div>
            )}

            {/* Khối nội dung chi tiết */}
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)', padding: '24px 28px', marginBottom: 'var(--space-6)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
            }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1.5px solid var(--border-subtle)', paddingBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(14,165,233,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Landmark size={18} color={BRAND} />
                </div>
                <div>
                  <div style={{ lineHeight: 1.2 }}>{t('proc.keyInfo')}</div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginTop: 2 }}>{t('proc.sourceNote')}</div>
                </div>
              </div>

              <div style={GRID}>
                <Row label={isNotice ? t('proc.notifyNo') : t('proc.planNo')} value={d.notify_no || d.plan_no || item.id} mono />
                <Row label={t('proc.version')} value={d.version} />
                <Row label={t('proc.bidNo')} value={d.bid_no} mono />
                <Row label={t('proc.procuringEntity')} value={d.procuring_entity || item.procuring_entity} />
                <Row label={t('proc.investor')} value={d.investor} />
                <Row label={t('proc.publicDate')} value={fmtDate(d.public_date || item.publish_date)} />
                <Row label={t('proc.closeDate')} value={fmtDate(d.close_date || item.close_date)} />
                <Row label={t('proc.openDate')} value={fmtDate(d.open_date)} />
                <Row label={t('proc.status')} value={item.status || d.status} />
                <Row label={t('proc.field')} value={d.field || item.sector} />
                <Row label={t('proc.packageCount')} value={d.package_count ?? item.package_count} />
                <Row label={t('proc.planName')} value={d.plan_name} />
                <Row label={t('proc.planType')} value={d.plan_type} />
              </div>

              {/* Điều kiện dự thầu (chỉ TBMT có) */}
              {(d.bid_form || d.bid_mode || d.contract_type || d.contract_period || d.validity
                || d.guarantee_value || d.capital_detail || d.domestic != null) && (
                <Section title={t('proc.moreInfo')} icon={Wallet}>
                  <div style={GRID}>
                    <Row label={t('proc.bidForm')} value={d.bid_form} />
                    <Row label={t('proc.bidMode')} value={d.bid_mode} />
                    <Row label={t('proc.contractType')} value={d.contract_type} />
                    <Row label={t('proc.contractPeriod')} value={d.contract_period} />
                    <Row label={t('proc.validity')} value={d.validity} />
                    <Row label={t('proc.guarantee')} value={fmtMoney(d.guarantee_value)} />
                    <Row label={t('proc.capital')} value={d.capital_detail} />
                    <Row label={t('proc.domestic')} value={yesNo(d.domestic)} />
                    <Row label={t('proc.internet')} value={yesNo(d.internet)} />
                  </div>
                </Section>
              )}

              {/* Địa điểm */}
              {(d.issue_location || d.receive_location || d.open_location || (d.locations || []).length > 0) && (
                <Section title={t('proc.locations')} icon={MapPin}>
                  <div style={GRID}>
                    <Row label={t('proc.locations')} value={(d.locations || []).join(', ') || null} />
                    <Row label={t('proc.issueLocation')} value={d.issue_location} />
                    <Row label={t('proc.receiveLocation')} value={d.receive_location} />
                    <Row label={t('proc.openLocation')} value={d.open_location} />
                  </div>
                </Section>
              )}

              {/* Nội dung chính */}
              {d.description && (
                <Section title={t('proc.overview')} icon={FileText}>
                  <p style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-line' }}>
                    {d.description}
                  </p>
                </Section>
              )}

              {/* Các phần / lô (TBMT) */}
              {lots.length > 0 && (
                <Section title={`${t('proc.lots')} (${lots.length})`} icon={Layers}>
                  <SimpleTable
                    cols={[
                      { key: 'no', label: '#', width: '60px' },
                      { key: 'name', label: t('proc.lotName') },
                      { key: 'price', label: t('proc.price'), width: '190px', align: 'right', render: (r) => fmtMoney(r.price, d.price_unit) },
                    ]}
                    rows={lots}
                  />
                </Section>
              )}

              {/* Danh sách gói thầu (KHLCNT) */}
              {packages.length > 0 && (
                <Section title={`${t('proc.packages')} (${packages.length})`} icon={Layers}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {packages.map((p, i) => (
                      <div key={p.bid_no || i} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', background: 'var(--bg-surface-2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {p.bid_no ? <code style={{ fontSize: 11.5, marginRight: 6, color: '#0369a1' }}>{p.bid_no}</code> : null}
                            {p.name}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#0369a1', whiteSpace: 'nowrap' }}>
                            {fmtMoney(p.price, p.price_unit) || '—'}
                          </span>
                        </div>
                        <div style={{ ...GRID, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px 18px' }}>
                          <Row label={t('proc.field')} value={p.field} />
                          <Row label={t('proc.bidForm')} value={p.bid_form} />
                          <Row label={t('proc.bidMode')} value={p.bid_mode} />
                          <Row label={t('proc.contractType')} value={p.contract_type} />
                          <Row label={t('proc.contractPeriod')} value={p.period} />
                          <Row label={t('proc.duration')} value={p.duration} />
                          <Row label={t('proc.start')} value={p.start} />
                          <Row label={t('proc.capital')} value={p.capital_detail} />
                        </div>
                        {p.description && (
                          <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-secondary)', margin: '8px 0 0', whiteSpace: 'pre-line' }}>
                            {p.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Quyết định phê duyệt */}
              {decision && (
                <Section title={t('proc.decision')} icon={CheckCircle2}>
                  <div style={GRID}>
                    <Row label={t('proc.decisionNo')} value={decision.no} mono />
                    <Row label={t('proc.decisionDate')} value={fmtDate(decision.date)} />
                    <Row label={t('proc.decisionAgency')} value={decision.agency} />
                    <Row label={t('proc.decisionFile')} value={decision.file} />
                  </div>
                </Section>
              )}
            </div>

            {/* Thanh hành động */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary"
                 style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                <ExternalLink size={15} /> {t('proc.openSource')}
              </a>
              <button
                className="btn btn-secondary"
                onClick={handleBookmark}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: bookmarked ? BRAND : undefined, color: bookmarked ? 'white' : undefined }}
              >
                {bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                {bookmarked ? t('proc.savedLabel') : t('proc.save')}
              </button>
              <button className="btn btn-secondary" onClick={handleShare} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Share2 size={15} /> {t('proc.share')}
              </button>
              <button className="btn btn-secondary" onClick={() => nav(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                <ArrowLeft size={15} /> {t('proc.back')}
              </button>
            </div>
          </article>
        </div>

        {/* CỘT PHẢI */}
        <div>
          <div className="article-sidebar-card">
            <div className="article-sidebar-title">
              <Building2 size={15} color={BRAND} /> {t('proc.aboutTitle')}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 12px' }}>
              {t('proc.aboutText')}
            </p>
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
               style={{ fontSize: 12, fontWeight: 700, color: BRAND, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {t('proc.openSource')} <ExternalLink size={12} />
            </a>
          </div>

          {(item.publish_date || item.close_date) && (
            <div className="article-sidebar-card">
              <div className="article-sidebar-title">
                <Calendar size={15} color={BRAND} /> {t('proc.publicDate')} / {t('proc.closeDate')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Row label={t('proc.publicDate')} value={fmtDate(d.public_date || item.publish_date)} />
                <Row label={t('proc.closeDate')} value={fmtDate(d.close_date || item.close_date)} />
                <Row label={t('proc.openDate')} value={fmtDate(d.open_date)} />
              </div>
            </div>
          )}

          {tags.length > 0 && (
            <div className="article-sidebar-card">
              <div className="article-sidebar-title">
                <Tag size={15} color={BRAND} /> {t('proc.tags')}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    onClick={() => nav(`${listPath}?q=${encodeURIComponent(tag)}`)}
                    style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 12, background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer' }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {related.length > 0 && (
            <div className="article-sidebar-card">
              <div className="article-sidebar-title">
                <FileText size={15} color={BRAND} /> {t('proc.related')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {related.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => nav(`/procurement/${encodeURIComponent(rel.id)}`)}
                    style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = BRAND)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8, background: 'rgba(14,165,233,0.12)', color: '#0369a1' }}>
                        {rel.kind === 'notice' ? 'TBMT' : 'KHLCNT'}
                      </span>
                      <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{rel.id}</span>
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {rel.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
