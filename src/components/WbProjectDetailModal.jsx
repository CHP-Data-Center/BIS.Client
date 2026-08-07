// Modal chi tiết dự án World Bank — hiển thị NGAY TRONG APP từ dữ liệu đã crawl, nên KHÔNG
// bao giờ 403 (trang project-detail của WB hay bị Akamai chặn tạm thời khi bấm nhiều).
// Vẫn có nút "Xem trên World Bank" cho ai muốn mở trang gốc.
import { X, ExternalLink, Building2, Globe2, Landmark, CalendarDays, Wallet, FileText } from 'lucide-react';
import { worldBankProjectUrl } from '../utils/wbUrl';

function Row({ label, value }) {
  if (value == null || value === '' || value === 'N/A') return null;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: '1px dashed var(--border-subtle)' }}>
      <div style={{ flex: '0 0 150px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', wordBreak: 'break-word' }}>{value}</div>
    </div>
  );
}

export default function WbProjectDetailModal({ item, onClose }) {
  if (!item) return null;

  const wbUrl = worldBankProjectUrl(item.url || item.external_id || item.id);
  const objective = item.development_objective || item.ai_summary;
  const fmtDate = (d) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch { return d; }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)', borderRadius: 16, width: 'min(760px, 100%)',
          maxHeight: '88vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Globe2 size={20} color="white" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 8px', borderRadius: 8 }}>
                {item.external_id || item.id}
              </span>
              {item.projectstatusdisplay && (
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{item.projectstatusdisplay}</span>
              )}
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: '6px 0 0', lineHeight: 1.35 }}>
              {item.project_name}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto' }}>
          {objective && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={13} /> Mục tiêu / Tóm tắt
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>{objective}</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
            <Row label={<><Globe2 size={12} style={{ verticalAlign: -1 }} /> Quốc gia</>} value={item.countryshortname} />
            <Row label="Khu vực" value={item.region} />
            <Row label="Lĩnh vực" value={item.sector} />
            <Row label={<><Wallet size={12} style={{ verticalAlign: -1 }} /> Cam kết (USD)</>} value={item.amount_display} />
            <Row label="Tổng vốn dự án" value={item.total_cost} />
            <Row label="Công cụ vay" value={item.lending_instrument} />
            <Row label="Năm tài khóa" value={item.fiscal_year} />
            <Row label="Giai đoạn" value={item.last_stage_reached_name} />
            <Row label={<><CalendarDays size={12} style={{ verticalAlign: -1 }} /> Ngày phê duyệt</>} value={fmtDate(item.boardapprovaldate)} />
            <Row label="Cập nhật cuối" value={fmtDate(item.proj_last_upd_date)} />
            <Row label="Ngày đóng" value={fmtDate(item.closing_date)} />
            <Row label={<><Landmark size={12} style={{ verticalAlign: -1 }} /> Bên vay</>} value={item.borrower} />
            <Row label={<><Building2 size={12} style={{ verticalAlign: -1 }} /> Cơ quan thực hiện</>} value={item.implementing_agency} />
            <Row label="Chủ nhiệm dự án" value={item.team_leader} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Dữ liệu từ World Bank API · bấm để mở trang gốc
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={wbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, textDecoration: 'none' }}
            >
              Xem trên World Bank <ExternalLink size={13} />
            </a>
            <button onClick={onClose} className="btn btn-primary btn-sm" style={{ fontSize: 12, background: '#10b981', border: 'none' }}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
