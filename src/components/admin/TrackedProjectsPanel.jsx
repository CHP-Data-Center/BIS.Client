// src/components/admin/TrackedProjectsPanel.jsx
// Tab quản trị: super admin xem/sửa/xóa MỌI dự án theo dõi.
//
// Khách hàng chốt 16/09/2026: bỏ bước phê duyệt — người dùng thêm/sửa dự án là hiện ngay, còn
// super admin có tab này để nhìn toàn bộ ở một chỗ và can thiệp khi cần.
import { useCallback, useEffect, useState } from 'react';
import { FolderKanban, Loader2, RefreshCw, Search, Trash2, Edit, User as UserIcon } from 'lucide-react';
import { adminService } from '../../services/admin';
import { potentialService } from '../../services/potential';
import { useLang } from '../../context/LanguageContext';
import EditProjectModal from '../EditProjectModal';
import ConfirmModal from '../common/ConfirmModal';

const SIZE = 20;

const STATUS_META = {
  watching: { key: 'projects.statusWatching', bg: '#eff6ff', fg: '#1d4ed8' },
  active: { key: 'projects.statusActive', bg: '#ecfdf5', fg: '#047857' },
  completed: { key: 'projects.statusCompleted', bg: '#f5f3ff', fg: '#6d28d9' },
  closed: { key: 'projects.statusClosed', bg: '#f8fafc', fg: '#64748b' },
};

/** "2026-10-01" → "01/10/2026" (cột DATE, không giờ — không dựng Date để khỏi lệch múi giờ). */
const fmtNgay = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '—';
};

export default function TrackedProjectsPanel({ onMessage }) {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [sectors, setSectors] = useState([]);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllProjects({ q, status: statusFilter, page, size: SIZE });
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      onMessage?.('error', e.response?.data?.detail || t('adminProjects.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [q, statusFilter, page, onMessage, t]);

  // Gõ tới đâu tìm tới đó, nhưng chờ người dùng ngừng gõ rồi mới gọi API.
  useEffect(() => {
    const hen = setTimeout(load, 250);
    return () => clearTimeout(hen);
  }, [load]);

  // Danh mục lĩnh vực cho ô chọn trong form sửa.
  useEffect(() => {
    potentialService
      .getSectors()
      .then((ds) => setSectors(ds || []))
      .catch(() => setSectors([]));
  }, []);

  const xoa = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await adminService.deleteAnyProject(deleting.id);
      onMessage?.('success', t('adminProjects.deleted', { name: deleting.name }));
      setDeleting(null);
      load();
    } catch (e) {
      onMessage?.('error', e.response?.data?.detail || t('adminProjects.deleteFailed'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const soTrang = Math.max(1, Math.ceil(total / SIZE));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 220 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
          <input
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
            placeholder={t('adminProjects.searchPlaceholder')}
            className="form-input"
            style={{ width: '100%', padding: '8px 10px 8px 32px', fontSize: 12.5, boxSizing: 'border-box' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
          className="form-input"
          style={{ fontSize: 12.5, padding: '8px 10px', minWidth: 160 }}
        >
          <option value="">{t('projects.allStatuses')}</option>
          {Object.entries(STATUS_META).map(([value, meta]) => (
            <option key={value} value={value}>{t(meta.key)}</option>
          ))}
        </select>
        <button type="button" className="btn" onClick={load} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} /> {t('common.refresh')}
        </button>
      </div>

      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 20, overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,0.03)',
      }}>
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)',
          fontWeight: 800, fontSize: 15, background: 'var(--bg-surface-2)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <FolderKanban size={16} style={{ color: '#3b82f6' }} />
          <span>{t('adminProjects.title')} ({total})</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{
                background: 'var(--bg-surface-2)', borderBottom: '1px solid var(--border-subtle)',
                textAlign: 'left', color: 'var(--text-muted)', fontSize: 11, fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                <th style={{ padding: '12px 20px' }}>{t('adminProjects.project')}</th>
                <th style={{ padding: '12px 20px' }}>{t('adminProjects.owner')}</th>
                <th style={{ padding: '12px 20px' }}>{t('adminProjects.location')}</th>
                <th style={{ padding: '12px 20px' }}>{t('potential.fieldSector')}</th>
                <th style={{ padding: '12px 20px' }}>{t('projects.timeRange')}</th>
                <th style={{ padding: '12px 20px' }}>{t('projects.status')}</th>
                <th style={{ padding: '12px 20px' }}>{t('adminProjects.links')}</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>{t('adminProjects.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} style={{ padding: 20, color: 'var(--text-muted)' }}>
                    <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> {t('common.loading')}
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 20, color: 'var(--text-muted)' }}>{t('adminProjects.empty')}</td>
                </tr>
              )}
              {!loading && items.map((p) => {
                const meta = STATUS_META[p.status || 'watching'] || STATUS_META.watching;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-primary)', maxWidth: 320 }}>
                      {p.name}
                      {p.investor && (
                        <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-muted)' }}>{p.investor}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <UserIcon size={12} /> {p.owner_name || p.owner_email || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>{p.province || '—'}</td>
                    <td style={{ padding: '12px 20px' }}>{p.sector_name || p.sector || '—'}</td>
                    <td style={{ padding: '12px 20px', whiteSpace: 'nowrap' }}>
                      {p.start_date || p.end_date ? `${fmtNgay(p.start_date)} → ${fmtNgay(p.end_date)}` : '—'}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{
                        display: 'inline-block', fontWeight: 800, fontSize: 11,
                        padding: '2px 8px', borderRadius: 5, background: meta.bg, color: meta.fg,
                      }}>
                        {t(meta.key)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>{p.potential_link_count || 0}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => setEditing(p)}
                        title={t('adminProjects.edit')}
                        className="btn"
                        style={{ padding: '5px 8px', marginRight: 6 }}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(p)}
                        title={t('common.delete')}
                        className="btn"
                        style={{ padding: '5px 8px', color: '#b91c1c' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {soTrang > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
            padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', fontSize: 12.5,
          }}>
            <button type="button" className="btn" disabled={page <= 1} onClick={() => setPage((x) => Math.max(1, x - 1))}>
              ‹
            </button>
            <span>{page} / {soTrang}</span>
            <button type="button" className="btn" disabled={page >= soTrang} onClick={() => setPage((x) => Math.min(soTrang, x + 1))}>
              ›
            </button>
          </div>
        )}
      </div>

      {editing && (
        <EditProjectModal
          project={editing}
          sectors={sectors}
          // Endpoint của người dùng trả 403 khi sửa dự án người khác — tab này đi đường quản trị.
          onSave={(id, patch) => adminService.updateAnyProject(id, patch)}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            onMessage?.('success', t('adminProjects.updated', { name: updated?.name || editing.name }));
            setEditing(null);
            load();
          }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleting}
        title={t('adminProjects.deleteTitle')}
        message={t('adminProjects.deleteMsg')}
        itemName={deleting?.name || ''}
        itemSub={deleting?.owner_email || ''}
        loading={deleteLoading}
        onConfirm={xoa}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
