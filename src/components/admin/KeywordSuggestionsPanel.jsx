// src/components/admin/KeywordSuggestionsPanel.jsx
// Từ khóa do AI trích từ tin ĐÃ CRAWL, chờ admin duyệt.
// Duyệt -> thành từ khóa thật (crawl bắt đầu giữ tin khớp). Bỏ qua -> AI không gợi ý lại.
import { useCallback, useEffect, useState } from 'react';
import { Sparkles, Check, X, RefreshCw, Loader2, Tag } from 'lucide-react';
import { keywordSuggestionsService } from '../../services/keywordSuggestions';
import { useLang } from '../../context/LanguageContext';

const STATUS_TABS = [
  { id: 'pending', labelKey: 'suggest.pending' },
  { id: 'approved', labelKey: 'suggest.approved' },
  { id: 'rejected', labelKey: 'suggest.rejected' },
];

export default function KeywordSuggestionsPanel({ onMessage }) {
  const { t } = useLang();
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [busyId, setBusyId] = useState(null);

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

  useEffect(() => { load(status); }, [status, load]);

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
    } catch {
      onMessage?.(t('suggest.actionError'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
            <Sparkles size={16} style={{ color: '#a855f7' }} /> {t('suggest.title')}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
            {t('suggest.hint')}
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={generating}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {generating ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
          {generating ? t('suggest.generating') : t('suggest.generate')}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatus(tab.id)}
            style={{
              padding: '5px 12px', fontSize: 12, fontWeight: 700, borderRadius: 20, cursor: 'pointer',
              border: '1px solid var(--border)',
              background: status === tab.id ? 'var(--brand-500)' : 'var(--bg-surface-2)',
              color: status === tab.id ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          {t('common.loading')}
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          {t('suggest.empty')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((s) => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-surface)',
            }}>
              <Tag size={15} style={{ color: '#a855f7', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{s.term}</div>
                {s.sample_title && (
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.sample_title}
                  </div>
                )}
              </div>
              <span style={{
                fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
                background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', whiteSpace: 'nowrap',
              }}>
                {s.occurrences} {t('suggest.newsCount')}
              </span>
              {status === 'pending' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => act(s.id, 'approve')} disabled={busyId === s.id}
                          title={t('suggest.approve')}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer', border: 'none', background: '#16a34a', color: '#fff' }}>
                    <Check size={13} /> {t('suggest.approve')}
                  </button>
                  <button onClick={() => act(s.id, 'reject')} disabled={busyId === s.id}
                          title={t('suggest.reject')}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}>
                    <X size={13} /> {t('suggest.reject')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
