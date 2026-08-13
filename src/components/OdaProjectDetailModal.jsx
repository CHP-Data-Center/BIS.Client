// src/components/OdaProjectDetailModal.jsx
// Modal chi tiết dự án ODA (World Bank / ADB) — hiển thị NGAY TRONG APP từ dữ liệu đã crawl,
// nên KHÔNG bao giờ 403. WB dùng dữ liệu API v3 (financers, milestones, cơ quan thực hiện…)
// trình bày như trang project-detail thật; ADB dùng layout gọn.
import { useState } from 'react';
import { X, ExternalLink, Building2, Globe2, Landmark, CalendarDays, Wallet, FileText, Users, Layers } from 'lucide-react';
import { worldBankProjectUrl } from '../utils/wbUrl';

const SOURCE_META = {
  worldbank: { brand: '#10b981', Icon: Globe2, label: 'World Bank', dataNote: 'Dữ liệu từ World Bank API' },
  adb: { brand: '#f59e0b', Icon: Building2, label: 'ADB', dataNote: 'Dữ liệu từ ADB' },
};

const fmtDate = (d) => {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return d; }
};
const fmtM = (usd) => (usd == null || usd === 0 ? null : `US$ ${(usd / 1e6).toFixed(2)} triệu`);

function Row({ label, value }) {
  if (value == null || value === '' || value === 'N/A') return null;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: '1px dashed var(--border-subtle)' }}>
      <div style={{ flex: '0 0 150px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', wordBreak: 'break-word' }}>{value}</div>
    </div>
  );
}

function SectionTitle({ children, icon: Ic }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: 0.3, margin: '18px 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
      {Ic && <Ic size={14} />} {children}
    </div>
  );
}

// ── Body giàu cho World Bank (như trang detail thật) ──────────────────────────
function WbRichBody({ d, extId }) {
  const [more, setMore] = useState(false);
  const abstract = d.abstract || '';
  const showToggle = abstract.length > 420;
  const abstractText = more || !showToggle ? abstract : abstract.slice(0, 420) + '…';
  const dt = d.dates || {};
  const fin = d.financing || {};
  const financers = fin.financers || [];
  const sectors = d.sectors || [];

  return (
    <>
      {abstract && (
        <>
          <SectionTitle icon={FileText}>Tóm tắt (Abstract)</SectionTitle>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>
            {abstractText}{' '}
            {showToggle && (
              <button onClick={() => setMore((v) => !v)} style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 13 }}>
                {more ? 'Thu gọn' : 'Xem thêm +'}
              </button>
            )}
          </p>
        </>
      )}

      {d.pdo && d.pdo !== abstract && (
        <>
          <SectionTitle>Mục tiêu phát triển (PDO)</SectionTitle>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>{d.pdo}</p>
        </>
      )}

      <SectionTitle icon={Landmark}>Thông tin chính (Key Details)</SectionTitle>
      <div>
        <Row label="Mã dự án" value={extId} />
        <Row label="Trạng thái" value={d.status} />
        <Row label="Quốc gia" value={d.country} />
        <Row label="Khu vực" value={d.region} />
        <Row label="Chủ nhiệm dự án" value={d.team_leader} />
        <Row label="Bên vay" value={d.borrower} />
        <Row label="Cơ quan thực hiện" value={d.impagency} />
        <Row label="Công cụ vay" value={d.lending_instrument} />
        <Row label="Năm tài khóa" value={d.fiscal_year} />
        <Row label="Ngày công bố" value={fmtDate(dt.disclosure)} />
        <Row label="Ngày phê duyệt" value={fmtDate(dt.approval)} />
        <Row label="Ngày hiệu lực" value={fmtDate(dt.effective)} />
        <Row label="Ngày đóng" value={fmtDate(dt.closing)} />
      </div>

      {(financers.length > 0 || fin.total || fin.ida || fin.ibrd) && (
        <>
          <SectionTitle icon={Wallet}>Tài chính (Finances)</SectionTitle>
          {financers.length > 0 && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ display: 'flex', background: 'var(--bg-surface-2)', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '8px 12px' }}>
                <div style={{ flex: 1 }}>Nguồn tài trợ</div><div style={{ width: 150, textAlign: 'right' }}>Cam kết</div>
              </div>
              {financers.map((f, i) => (
                <div key={i} style={{ display: 'flex', padding: '8px 12px', fontSize: 13, borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ flex: 1, color: 'var(--text-primary)' }}>{f.name}</div>
                  <div style={{ width: 150, textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{fmtM(f.amount) || 'N/A'}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
            <Row label="Cam kết IBRD" value={fmtM(fin.ibrd) || (fin.ibrd === 0 ? 'US$ 0.00' : null)} />
            <Row label="Cam kết IDA" value={fmtM(fin.ida)} />
            <Row label="Viện trợ (Grant)" value={fmtM(fin.grant) || (fin.grant === 0 ? 'US$ 0.00' : null)} />
            <Row label="Tổng tài chính" value={fmtM(fin.total)} />
          </div>
        </>
      )}

      {sectors.length > 0 && (
        <>
          <SectionTitle icon={Layers}>Lĩnh vực (Sectors)</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {sectors.map((s, i) => (
              <span key={i} style={{ fontSize: 12, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 10px', color: 'var(--text-secondary)' }}>
                {s.name}{s.percent ? ` · ${s.percent}%` : ''}
              </span>
            ))}
          </div>
        </>
      )}
    </>
  );
}

// ── Body giàu cho ADB (mọi trường crawl từ trang dự án adb.org) ───────────────
// details = {fields: {nhãn EN: giá trị}, funding[], milestones{}, documents[]}.
// Nhãn EN phổ biến dịch sẵn sang VN; nhãn lạ giữ nguyên (trang ADB đổi không vỡ).
const ADB_LABEL_VI = {
  'Project Number': 'Mã dự án',
  'Country / Economy': 'Quốc gia',
  'Project Status': 'Trạng thái',
  'Project Type / Modality of Assistance': 'Loại dự án / Hình thức hỗ trợ',
  'Source of Funding / Amount': 'Nguồn vốn / Số tiền',
  'Strategic Agendas': 'Chương trình chiến lược',
  'Drivers of Change': 'Động lực thay đổi',
  'Sector / Subsector': 'Lĩnh vực / Phân ngành',
  'Gender': 'Yếu tố giới',
  'Geographical Location': 'Địa bàn',
  'Responsible ADB Officer': 'Cán bộ phụ trách',
  'Responsible ADB Department': 'Vụ/Ban phụ trách',
  'Responsible ADB Division': 'Phòng phụ trách',
  'Executing Agencies': 'Cơ quan thực hiện',
  'Concept Clearance': 'Thông qua ý tưởng',
  'Fact Finding': 'Khảo sát thực địa',
  'Last Review Mission': 'Đợt rà soát gần nhất',
  'Last PDS Update': 'Cập nhật PDS gần nhất',
  'Approval': 'Phê duyệt',
  'Description': 'Mô tả dự án',
  'Project Rationale and Linkage to Country/Regional Strategy': 'Cơ sở & liên kết chiến lược',
  'Impact': 'Tác động',
  'Description of Outcome': 'Kết quả (Outcome)',
  'Progress Toward Outcome': 'Tiến độ đạt kết quả',
  'Description of Project Outputs': 'Đầu ra dự án',
  'Status of Implementation Progress (Outputs, Activities, and Issues)': 'Tiến độ thực hiện',
  'During Project Design': 'Tham vấn khi thiết kế',
  'During Project Implementation': 'Tham vấn khi thực hiện',
  'Consulting Services': 'Dịch vụ tư vấn',
  'Procurement': 'Mua sắm / Đấu thầu',
  'Environmental Aspects': 'Môi trường',
  'Involuntary Resettlement': 'Tái định cư không tự nguyện',
  'Indigenous Peoples': 'Dân tộc bản địa',
  'Summary of Environmental and Social Aspects': 'Tóm tắt môi trường & xã hội',
  // Thông báo mời thầu ADB (dữ liệu bóc từ tiêu đề feed — xem adb_crawler.py)
  'Notice Type': 'Loại thông báo',
  'Financing Type': 'Hình thức tài trợ',
  'Financing Number': 'Số khoản vay / viện trợ',
  'Project': 'Dự án',
  'Contract / Package': 'Gói thầu / Hợp đồng',
  'Special Funds': 'Nguồn vốn đặc biệt',
  'Source': 'Nguồn dữ liệu',
};
const adbLabel = (en) => ADB_LABEL_VI[en] || en;

/** Đoạn văn dài có nút Xem thêm/Thu gọn. */
function LongText({ text }) {
  const [more, setMore] = useState(false);
  const showToggle = (text || '').length > 420;
  const shown = more || !showToggle ? text : text.slice(0, 420) + '…';
  return (
    <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-line' }}>
      {shown}{' '}
      {showToggle && (
        <button onClick={() => setMore((v) => !v)} style={{ background: 'none', border: 'none', color: '#f59e0b', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 13 }}>
          {more ? 'Thu gọn' : 'Xem thêm +'}
        </button>
      )}
    </p>
  );
}

function AdbRichBody({ d }) {
  const fields = d.fields || {};
  // Trường ngắn → bảng Thông tin chính; trường dài (mô tả/tiến độ…) → mục riêng.
  // Bỏ Project Name (đã ở header) và Source of Funding (đã có bảng Nguồn vốn).
  const skip = new Set(['Project Name', 'Source of Funding / Amount', 'Description']);
  const shortRows = [];
  const longSections = [];
  Object.entries(fields).forEach(([k, v]) => {
    if (skip.has(k) || !v) return;
    if (String(v).length > 200) longSections.push([k, v]);
    else shortRows.push([k, v]);
  });
  const ms = d.milestones;
  const closing = ms?.closing || {};

  return (
    <>
      {fields.Description && (
        <>
          <SectionTitle icon={FileText}>Mô tả dự án (Description)</SectionTitle>
          <LongText text={fields.Description} />
        </>
      )}

      <SectionTitle icon={Landmark}>Thông tin chính</SectionTitle>
      <div>
        {shortRows.map(([k, v]) => <Row key={k} label={adbLabel(k)} value={v} />)}
      </div>

      {(d.funding || []).length > 0 && (
        <>
          <SectionTitle icon={Wallet}>Nguồn vốn (Funding)</SectionTitle>
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'flex', background: 'var(--bg-surface-2)', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '8px 12px' }}>
              <div style={{ flex: 1 }}>Nguồn tài trợ</div><div style={{ width: 150, textAlign: 'right' }}>Số tiền</div>
            </div>
            {d.funding.map((f, i) => (
              <div key={i} style={{ display: 'flex', padding: '8px 12px', fontSize: 13, borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ flex: 1, color: 'var(--text-primary)' }}>{f.source}</div>
                <div style={{ width: 150, textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{f.amount}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {ms && (
        <>
          <SectionTitle icon={CalendarDays}>Mốc chính (Milestones)</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
            <Row label="Phê duyệt" value={ms.approval} />
            <Row label="Ký kết" value={ms.signing} />
            <Row label="Hiệu lực" value={ms.effectivity} />
            <Row label="Đóng (kế hoạch)" value={closing.original} />
            <Row label="Đóng (điều chỉnh)" value={closing.revised} />
            <Row label="Đóng (thực tế)" value={closing.actual} />
          </div>
        </>
      )}

      {longSections.map(([k, v]) => (
        <div key={k}>
          <SectionTitle>{adbLabel(k)}</SectionTitle>
          <LongText text={v} />
        </div>
      ))}

      {(d.documents || []).length > 0 && (
        <>
          <SectionTitle icon={FileText}>Tài liệu dự án</SectionTitle>
          <div>
            {d.documents.map((doc, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px dashed var(--border-subtle)', fontSize: 13 }}>
                <div style={{ flex: 1, color: 'var(--text-primary)' }}>{doc.title}</div>
                <div style={{ flex: '0 0 90px', textAlign: 'right', color: 'var(--text-muted)' }}>{doc.date}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

// ── Body gọn (ADB / khi chưa có details) ──────────────────────────────────────
function SimpleBody({ item }) {
  const objective = item.development_objective || item.ai_summary;
  return (
    <>
      {objective && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={13} /> Mục tiêu / Tóm tắt
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>{objective}</p>
        </div>
      )}
      <div>
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
        <Row label={<><Users size={12} style={{ verticalAlign: -1 }} /> Chủ nhiệm dự án</>} value={item.team_leader} />
      </div>
    </>
  );
}

export default function OdaProjectDetailModal({ item, source = 'worldbank', stageLabel = 'Giai đoạn', onClose }) { // eslint-disable-line no-unused-vars
  if (!item) return null;

  const meta = SOURCE_META[source] || SOURCE_META.worldbank;
  const Icon = meta.Icon;
  const extId = item.external_id || item.id;
  const externalUrl = source === 'adb'
    ? (item.rawUrl || item.url || `https://www.adb.org/projects/${extId}/main`)
    : worldBankProjectUrl(item.url || extId);
  const isWbRich = source === 'worldbank' && item.details;
  const isAdbRich = source === 'adb' && item.details;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--bg-surface)', borderRadius: 16, width: 'min(760px, 100%)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.35)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: meta.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={20} color="white" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: meta.brand, background: `${meta.brand}1a`, padding: '2px 8px', borderRadius: 8 }}>{extId}</span>
              {item.projectstatusdisplay && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{item.projectstatusdisplay}</span>}
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: '6px 0 0', lineHeight: 1.35 }}>{item.project_name}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }} title="Đóng"><X size={20} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '4px 20px 16px', overflowY: 'auto' }}>
          {isWbRich ? <WbRichBody d={item.details} extId={extId} />
            : isAdbRich ? <AdbRichBody d={item.details} />
            : <SimpleBody item={item} />}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{meta.dataNote} · bấm để mở trang gốc</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, textDecoration: 'none' }}>
              Xem trên {meta.label} <ExternalLink size={13} />
            </a>
            <button onClick={onClose} className="btn btn-primary btn-sm" style={{ fontSize: 12, background: meta.brand, border: 'none' }}>Đóng</button>
          </div>
        </div>
      </div>
    </div>
  );
}
