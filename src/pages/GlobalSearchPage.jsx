// src/pages/GlobalSearchPage.jsx
// Tìm kiếm TOÀN CỤC từ ô search header: 1 từ khóa quét CẢ 4 kho đã crawl
// (Báo chí, Mua sắm công TBMT/KHLCNT, World Bank, ADB) — kết quả chia từng mục,
// khớp tiêu đề HOẶC nội dung (server đã tách từ + tìm cả bản dịch EN/JA).
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Newspaper, ShoppingBag, Globe, Building2, Search, ExternalLink, ChevronRight } from 'lucide-react';
import { articlesService } from '../services/articles';
import { odaService } from '../services/oda';
import { useLang } from '../context/LanguageContext';

const SECTION_STYLE = {
  press: { icon: Newspaper, color: '#3b82f6', to: (q) => `/news/press?q=${encodeURIComponent(q)}` },
  proc: { icon: ShoppingBag, color: '#8b5cf6', to: (q) => `/news/tbmt?q=${encodeURIComponent(q)}` },
  wb: { icon: Globe, color: '#10b981', to: (q) => `/news/worldbank?q=${encodeURIComponent(q)}` },
  adb: { icon: Building2, color: '#f59e0b', to: (q) => `/news/adb?q=${encodeURIComponent(q)}` },
};

function Section({ kind, title, total, toAll, children, t }) {
  const meta = SECTION_STYLE[kind];
  const Icon = meta.icon;
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 18px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: `${meta.color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} style={{ color: meta.color }} />
        </span>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
        <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, background: `${meta.color}14`, padding: '2px 10px', borderRadius: 20 }}>{total}</span>
        {total > 0 && (
          <Link to={toAll} style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: meta.color, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
            {t('search.viewAll')} <ChevronRight size={13} />
          </Link>
        )}
      </div>
      {total === 0
        ? <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '4px 2px' }}>{t('search.empty')}</div>
        : children}
    </div>
  );
}

function Row({ title, sub, href, to }) {
  const nav = useNavigate();
  const inner = (
    <>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        {sub && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
      </div>
      {href && <ExternalLink size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
    </>
  );
  const style = { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', borderBottom: '1px dashed var(--border-subtle)', cursor: 'pointer', textDecoration: 'none' };
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer" style={style}>{inner}</a>
    : <div style={style} onClick={() => nav(to)}>{inner}</div>;
}

export default function GlobalSearchPage() {
  const [searchParams] = useSearchParams();
  const q = (searchParams.get('q') || '').trim();
  const { lang, t } = useLang();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ press: null, proc: null, wb: null, adb: null });

  useEffect(() => {
    if (!q) { setLoading(false); return; }
    let alive = true;
    setLoading(true);
    // 4 kho quét SONG SONG — server đã tìm tiêu đề + nội dung + bản dịch.
    Promise.allSettled([
      articlesService.getArticles({ q, only_my_keywords: false, size: 8, ...(lang !== 'vi' ? { lang } : {}) }),
      odaService.getProcurement({ q, size: 8 }),
      odaService.getProjects({ q, source: 'worldbank', size: 6 }),
      odaService.getProjects({ q, source: 'adb', size: 6 }),
    ]).then(([a, p, w, d]) => {
      if (!alive) return;
      setData({
        press: a.status === 'fulfilled' ? a.value : { items: [], total: 0 },
        proc: p.status === 'fulfilled' ? p.value : { items: [], total: 0 },
        wb: w.status === 'fulfilled' ? w.value : { items: [], total: 0 },
        adb: d.status === 'fulfilled' ? d.value : { items: [], total: 0 },
      });
      setLoading(false);
    });
    return () => { alive = false; };
  }, [q, lang]);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '18px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Search size={20} style={{ color: 'var(--brand-500)' }} />
        <h1 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          {t('search.title')}: “{q}”
        </h1>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>{t('common.loading')}</div>
      ) : (
        <>
          <Section kind="press" title={t('search.press')} total={data.press?.total || 0} toAll={SECTION_STYLE.press.to(q)} t={t}>
            {(data.press?.items || []).map((a) => (
              <Row key={a.id} title={a.title} sub={a.excerpt} to={`/article/${a.id}`} />
            ))}
          </Section>

          <Section kind="proc" title={t('search.proc')} total={data.proc?.total || 0} toAll={SECTION_STYLE.proc.to(q)} t={t}>
            {(data.proc?.items || []).map((p) => (
              <Row
                key={p.id}
                title={`${p.kind === 'plan' ? '[KHLCNT]' : '[TBMT]'} ${p.title}`}
                sub={[p.id, p.procuring_entity, p.publish_date].filter(Boolean).join(' · ')}
                href={p.url || `https://dauthau.asia/tim-kiem/?q=${encodeURIComponent(p.id)}`}
              />
            ))}
          </Section>

          <Section kind="wb" title="World Bank" total={data.wb?.total || 0} toAll={SECTION_STYLE.wb.to(q)} t={t}>
            {(data.wb?.items || []).map((p) => (
              <Row
                key={p.id}
                title={p.title}
                sub={[p.external_id, p.country, p.amount].filter(Boolean).join(' · ')}
                to={`/news/worldbank?q=${encodeURIComponent(p.external_id || p.title)}`}
              />
            ))}
          </Section>

          <Section kind="adb" title="ADB" total={data.adb?.total || 0} toAll={SECTION_STYLE.adb.to(q)} t={t}>
            {(data.adb?.items || []).map((p) => (
              <Row
                key={p.id}
                title={p.title}
                sub={[p.external_id, p.country, p.amount].filter(Boolean).join(' · ')}
                to={`/news/adb?q=${encodeURIComponent(p.external_id || p.title)}`}
              />
            ))}
          </Section>
        </>
      )}
    </div>
  );
}
