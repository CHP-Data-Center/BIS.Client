// src/components/ProjectImportModal.jsx
// Hai đường đưa dự án vào danh sách theo dõi:
//   · Excel  — tải file .xlsx, xem trước, kiểm tra và chỉnh sửa từng dòng trước khi nhập
//   · Profile — máy đoán từ hồ sơ năng lực   -> CHỈ GỢI Ý, người dùng chọn rồi mới tạo
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X, FileSpreadsheet, FileText, UploadCloud, Loader2, Check,
  AlertTriangle, Plus, Quote, Pencil, Trash2, ArrowLeft,
  CheckSquare, Square, Search, Eye
} from 'lucide-react';
import { projectsService } from '../services/projects';
import { potentialService } from '../services/potential';
import { useLang } from '../context/LanguageContext';

const MAX_BYTES = 5 * 1024 * 1024; // khớp trần phía backend
const EXCEL_ACCEPT = '.xlsx';
const PROFILE_ACCEPT = '.pdf,.docx,.txt,.md';

const STATUS_OPTIONS = [
  { value: 'watching', labelKey: 'projects.statusWatching', defaultLabel: 'Đang theo dõi' },
  { value: 'active', labelKey: 'projects.statusActive', defaultLabel: 'Đang triển khai' },
  { value: 'completed', labelKey: 'projects.statusCompleted', defaultLabel: 'Hoàn thành' },
  { value: 'closed', labelKey: 'projects.statusClosed', defaultLabel: 'Đã đóng' },
];

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

/** Modal chỉnh sửa một dòng dữ liệu trong danh sách xem trước Excel */
function RowEditModal({ row, sectors, onSave, onClose }) {
  const { t } = useLang();
  const [name, setName] = useState(row?.name || '');
  const [keywordFilter, setKeywordFilter] = useState(row?.keyword_filter || '');
  const [investor, setInvestor] = useState(row?.investor || '');
  const [sector, setSector] = useState(row?.sector || '');
  const [province, setProvince] = useState(row?.province || '');
  const [status, setStatus] = useState(row?.status || 'watching');
  const [workItems, setWorkItems] = useState(row?.work_items || '');
  const [totalInvestment, setTotalInvestment] = useState(row?.total_investment || '');
  const [capitalSource, setCapitalSource] = useState(row?.capital_source || '');
  const [progress, setProgress] = useState(row?.progress || '');
  const [note, setNote] = useState(row?.note || '');
  const [err, setErr] = useState('');

  if (!row) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErr('Vui lòng nhập tên dự án.');
      return;
    }
    const foundSec = sectors.find((s) => s.slug === sector);
    onSave({
      ...row,
      name: name.trim(),
      keyword_filter: keywordFilter.trim() || null,
      investor: investor.trim() || null,
      sector: sector || null,
      sector_name: foundSec ? foundSec.name : row.sector_name,
      province: province.trim() || null,
      status: status || 'watching',
      work_items: workItems.trim() || null,
      total_investment: totalInvestment.trim() || null,
      capital_source: capitalSource.trim() || null,
      progress: progress.trim() || null,
      note: note.trim() || null,
      error: null, // cleared
    });
    onClose();
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 1000005, background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(580px, 94vw)', background: 'var(--bg-surface)',
          borderRadius: 20, padding: 24, border: '1px solid var(--border)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)', display: 'flex',
          flexDirection: 'column', gap: 16, maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Pencil size={18} style={{ color: 'var(--brand-600)' }} />
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>
              Chỉnh sửa dòng {row.row_idx}
            </h4>
          </div>
          <button
            type="button" onClick={onClose}
            style={{
              border: 'none', background: 'var(--bg-surface-2)', borderRadius: 8,
              width: 28, height: 28, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {err && (
          <div style={{
            padding: '8px 12px', borderRadius: 8, background: '#fef2f2',
            border: '1px solid #fecaca', color: '#b91c1c', fontSize: 12.5, fontWeight: 600,
          }}>
            {err}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
              Tên dự án <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text" required
              value={name} onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%', padding: '8px 11px', borderRadius: 8, fontSize: 12.5,
                border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
                color: 'var(--text-primary)', boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
              Từ khóa theo dõi
            </label>
            <input
              type="text"
              value={keywordFilter} onChange={(e) => setKeywordFilter(e.target.value)}
              placeholder="Bỏ trống thì hệ thống tự rút từ tên dự án"
              style={{
                width: '100%', padding: '8px 11px', borderRadius: 8, fontSize: 12.5,
                border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
                color: 'var(--text-primary)', boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
              Chủ đầu tư / Bên mời thầu
            </label>
            <input
              type="text"
              value={investor} onChange={(e) => setInvestor(e.target.value)}
              placeholder="Ban QLDA..."
              style={{
                width: '100%', padding: '8px 11px', borderRadius: 8, fontSize: 12.5,
                border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
                color: 'var(--text-primary)', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
                Lĩnh vực
              </label>
              <select
                value={sector} onChange={(e) => setSector(e.target.value)}
                style={{
                  width: '100%', padding: '8px 11px', borderRadius: 8, fontSize: 12.5,
                  border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
                  color: 'var(--text-primary)', boxSizing: 'border-box',
                }}
              >
                <option value="">— Chưa chọn —</option>
                {sectors.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
                Trạng thái
              </label>
              <select
                value={status} onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%', padding: '8px 11px', borderRadius: 8, fontSize: 12.5,
                  border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
                  color: 'var(--text-primary)', boxSizing: 'border-box',
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey) || opt.defaultLabel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
              Vị trí / Địa phương
            </label>
            <input
              type="text"
              value={province} onChange={(e) => setProvince(e.target.value)}
              placeholder="Hà Nội, TP.HCM, Toàn quốc..."
              style={{
                width: '100%', padding: '8px 11px', borderRadius: 8, fontSize: 12.5,
                border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
                color: 'var(--text-primary)', boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
              Hạng mục công việc / Gói thầu quan tâm
            </label>
            <textarea
              rows={2}
              value={workItems} onChange={(e) => setWorkItems(e.target.value)}
              placeholder="Ví dụ: Cọc khoan nhồi, xây lắp cầu chính, tư vấn giám sát..."
              style={{
                width: '100%', padding: '8px 11px', borderRadius: 8, fontSize: 12.5,
                border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
                color: 'var(--text-primary)', resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>
                Tổng mức đầu tư
              </label>
              <input
                type="text"
                value={totalInvestment} onChange={(e) => setTotalInvestment(e.target.value)}
                placeholder="1.200 tỷ VNĐ..."
                style={{
                  width: '100%', padding: '7px 9px', borderRadius: 8, fontSize: 12,
                  border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
                  color: 'var(--text-primary)', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>
                Nguồn vốn
              </label>
              <input
                type="text"
                value={capitalSource} onChange={(e) => setCapitalSource(e.target.value)}
                placeholder="Ngân sách, ODA..."
                style={{
                  width: '100%', padding: '7px 9px', borderRadius: 8, fontSize: 12,
                  border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
                  color: 'var(--text-primary)', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>
                Tiến độ / Giai đoạn
              </label>
              <input
                type="text"
                value={progress} onChange={(e) => setProgress(e.target.value)}
                placeholder="Đang đấu thầu..."
                style={{
                  width: '100%', padding: '7px 9px', borderRadius: 8, fontSize: 12,
                  border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
                  color: 'var(--text-primary)', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
              Ghi chú
            </label>
            <textarea
              rows={2}
              value={note} onChange={(e) => setNote(e.target.value)}
              style={{
                width: '100%', padding: '8px 11px', borderRadius: 8, fontSize: 12.5,
                border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
                color: 'var(--text-primary)', resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button
              type="button" onClick={onClose}
              style={{
                padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--bg-surface-2)', color: 'var(--text-primary)',
                fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 18px', borderRadius: 8, border: 'none',
                background: 'var(--brand-500, #2563eb)', color: '#fff',
                fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
              }}
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/** Tab 1 — Excel: 2 bước (Bước 1: Tải file -> Bước 2: Kiểm tra, chỉnh sửa và xác nhận nhập). */
function ExcelTab({ onDone, onStepChange }) {
  const { t } = useLang();
  const [tpl, setTpl] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [file, setFile] = useState(null);
  const [step, setStep] = useState('upload'); // 'upload' | 'preview'
  const [busy, setBusy] = useState(false);
  const [downloadingTpl, setDownloadingTpl] = useState(false);
  const [preview, setPreview] = useState(null);
  const [rows, setRows] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState(() => new Set());
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'valid' | 'duplicate' | 'error'
  const [editingRow, setEditingRow] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    projectsService.getImportTemplate().then(setTpl).catch(() => setTpl(null));
    potentialService.getSectors().then(setSectors).catch(() => setSectors([]));
  }, []);

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  const handleDownloadSample = async () => {
    setDownloadingTpl(true);
    try {
      await projectsService.downloadSampleExcel();
    } catch (e) {
      console.error('Download sample error:', e);
      setErr('Không thể tải file mẫu Excel. Vui lòng thử lại.');
    } finally {
      setDownloadingTpl(false);
    }
  };

  const pick = (f) => {
    setPreview(null);
    setRows([]);
    setImportResult(null);
    setErr(f && f.size > MAX_BYTES ? t('projects.fileTooBig') : null);
    setFile(f && f.size > MAX_BYTES ? null : f);
  };

  // Bước 1 -> Bước 2: Xem trước file Excel
  const handlePreview = async () => {
    if (!file) return;
    setBusy(true);
    setErr(null);
    setImportResult(null);
    try {
      const res = await projectsService.previewImportExcel(file);
      setPreview(res);
      const rowList = (res.rows || []).map((r, i) => ({ ...r, _uid: i }));
      setRows(rowList);
      // Mặc định chọn các dòng hợp lệ (không lỗi, không trùng)
      const validSet = new Set(
        rowList.filter((r) => !r.error && !r.is_duplicate).map((r) => r._uid)
      );
      setSelectedIndices(validSet);
      setStep('preview');
    } catch (e) {
      setErr(e.response?.data?.detail || 'Không đọc được file Excel này. Vui lòng kiểm tra lại định dạng.');
    } finally {
      setBusy(false);
    }
  };

  // Xác nhận nhập các dòng đã chọn vào database
  const handleConfirmImport = async () => {
    const chosenRows = rows.filter((r) => selectedIndices.has(r._uid));
    if (chosenRows.length === 0) {
      setErr('Vui lòng chọn ít nhất 1 dự án để nhập.');
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      const items = chosenRows.map((r) => ({
        name: r.name,
        keyword_filter: r.keyword_filter || undefined,
        investor: r.investor || undefined,
        sector: r.sector || undefined,
        province: r.province || undefined,
        status: r.status || 'watching',
        note: r.note || undefined,
        work_items: r.work_items || undefined,
        total_investment: r.total_investment || undefined,
        capital_source: r.capital_source || undefined,
        progress: r.progress || undefined,
      }));

      const res = await projectsService.confirmImportExcel(items, preview?.filename || file?.name);
      setImportResult(res);
      if (res.row_created > 0) {
        onDone();
      }
    } catch (e) {
      setErr(e.response?.data?.detail || 'Lỗi khi nhập dữ liệu vào hệ thống.');
    } finally {
      setBusy(false);
    }
  };

  const handleRowSave = (updatedRow) => {
    setRows((prev) =>
      prev.map((r) => (r._uid === updatedRow._uid ? updatedRow : r))
    );
    // Tự động chọn dòng nếu nó đã hợp lệ
    if (!updatedRow.error) {
      setSelectedIndices((cur) => {
        const next = new Set(cur);
        next.add(updatedRow._uid);
        return next;
      });
    }
  };

  const handleRowDelete = (uid) => {
    setRows((prev) => prev.filter((r) => r._uid !== uid));
    setSelectedIndices((cur) => {
      const next = new Set(cur);
      next.delete(uid);
      return next;
    });
  };

  const toggleSelect = (uid) => {
    setSelectedIndices((cur) => {
      const next = new Set(cur);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  // Tính số lượng thống kê hiện tại
  const countTotal = rows.length;
  const countValid = rows.filter((r) => !r.error && !r.is_duplicate).length;
  const countDup = rows.filter((r) => r.is_duplicate).length;
  const countErr = rows.filter((r) => Boolean(r.error)).length;

  const filteredRows = rows.filter((r) => {
    if (filterTab === 'valid' && (r.error || r.is_duplicate)) return false;
    if (filterTab === 'duplicate' && !r.is_duplicate) return false;
    if (filterTab === 'error' && !r.error) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inName = (r.name || '').toLowerCase().includes(q);
      const inInvestor = (r.investor || '').toLowerCase().includes(q);
      const inProvince = (r.province || '').toLowerCase().includes(q);
      const inWork = (r.work_items || '').toLowerCase().includes(q);
      if (!inName && !inInvestor && !inProvince && !inWork) return false;
    }
    return true;
  });

  const toggleSelectAllFiltered = () => {
    const selectable = filteredRows.filter((r) => !r.error);
    const allSelected = selectable.length > 0 && selectable.every((r) => selectedIndices.has(r._uid));
    setSelectedIndices((cur) => {
      const next = new Set(cur);
      if (allSelected) {
        selectable.forEach((r) => next.delete(r._uid));
      } else {
        selectable.forEach((r) => next.add(r._uid));
      }
      return next;
    });
  };

  // ========================== GIAO DIỆN BƯỚC 1 ==========================
  if (step === 'upload') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
          {t('projects.importDesc')}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: 20,
          alignItems: 'start',
        }}>
          {/* Cột 1: Quy cách cột dữ liệu & Tải file mẫu */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                Quy cách các cột dữ liệu theo dõi:
              </span>
              <button
                type="button"
                onClick={handleDownloadSample}
                disabled={downloadingTpl}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 8,
                  background: 'var(--brand-50, #eff6ff)',
                  color: 'var(--brand-700, #1d4ed8)',
                  border: '1px solid var(--brand-300, #93c5fd)',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Tải file mẫu Excel (.xlsx) có sẵn dữ liệu mẫu thực tế"
              >
                {downloadingTpl ? <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> : <FileSpreadsheet size={14} />}
                Tải file Excel mẫu (.xlsx)
              </button>
            </div>

            {tpl && (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 12, maxHeight: 330, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 360 }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      {['Cột', t('projects.nameLabel'), t('projects.note')].map((h, i) => (
                        <th key={i} style={{
                          textAlign: 'left', padding: '8px 10px', fontSize: 11,
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
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontWeight: 800 }}>
                          {c.column}
                        </td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{c.header}</strong>
                          {c.required && (
                            <span style={{
                              marginLeft: 6, fontSize: 9.5, fontWeight: 800, padding: '1px 5px',
                              borderRadius: 4, background: '#fee2e2', color: '#b91c1c',
                            }}>
                              {t('projects.colRequired')}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: 11.5 }}>
                          {c.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Cột 2: Chọn file, Báo lỗi & Nút kiểm tra xem trước */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

            <button
              type="button" onClick={handlePreview} disabled={!file || busy}
              style={{
                padding: '13px 20px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 800,
                background: !file || busy ? 'var(--bg-surface-2)' : 'var(--brand-500)',
                color: !file || busy ? 'var(--text-muted)' : '#fff',
                cursor: !file || busy ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: file && !busy ? '0 4px 14px rgba(37,99,235,0.3)' : 'none',
              }}
            >
              {busy ? <Loader2 size={16} className="spin" /> : <Eye size={16} />}
              Kiểm tra & Xem trước dữ liệu
            </button>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
              Hệ thống sẽ quét đối chiếu và hiển thị danh sách để bạn kiểm tra, chỉnh sửa từng trường trước khi lưu.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================== GIAO DIỆN BƯỚC 2: XEM TRƯỚC & CHỈNH SỬA ==========================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Thanh tiêu đề và nút quay lại */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => setStep('upload')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--bg-surface-2)', color: 'var(--text-primary)',
              fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <ArrowLeft size={14} /> Chọn file khác
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            File: <strong style={{ color: 'var(--text-primary)' }}>{file?.name}</strong>
          </span>
        </div>

        {/* Thống kê nhanh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}>
            Tổng: {countTotal}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
            Hợp lệ: {countValid}
          </span>
          {countDup > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
              Trùng: {countDup}
            </span>
          )}
          {countErr > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
              Lỗi: {countErr}
            </span>
          )}
        </div>
      </div>

      {/* Thông báo lỗi nếu có */}
      {err && (
        <div style={{
          display: 'flex', gap: 9, padding: '10px 14px', borderRadius: 10,
          background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
          fontSize: 12.5, fontWeight: 600,
        }}>
          <AlertTriangle size={16} style={{ flex: 'none', marginTop: 1 }} /> {err}
        </div>
      )}

      {/* Kết quả sau khi xác nhận nhập */}
      {importResult && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 10, padding: 14,
          borderRadius: 12, background: '#ecfdf5', border: '1px solid #a7f3d0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#047857', fontWeight: 800, fontSize: 14 }}>
            <Check size={18} /> Đã nhập thành công vào danh sách theo dõi!
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#065f46' }}>
            <span>Đã tạo mới: <strong>{importResult.row_created}</strong></span>
            <span>Đã bỏ qua (trùng): <strong>{importResult.row_skipped}</strong></span>
            {importResult.row_failed > 0 && (
              <span style={{ color: '#b91c1c' }}>Lỗi: <strong>{importResult.row_failed}</strong></span>
            )}
          </div>
        </div>
      )}

      {/* Thanh công cụ: Lọc & Tìm kiếm dòng */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 10, padding: '8px 12px', borderRadius: 12,
        background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
      }}>
        {/* Bộ lọc tab */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { id: 'all', label: `Tất cả (${countTotal})` },
            { id: 'valid', label: `Hợp lệ (${countValid})` },
            { id: 'duplicate', label: `Trùng lặp (${countDup})` },
            { id: 'error', label: `Lỗi (${countErr})` },
          ].map((tabItem) => (
            <button
              key={tabItem.id}
              type="button"
              onClick={() => setFilterTab(tabItem.id)}
              style={{
                padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
                background: filterTab === tabItem.id ? 'var(--bg-surface)' : 'transparent',
                color: filterTab === tabItem.id ? 'var(--brand-700)' : 'var(--text-muted)',
                boxShadow: filterTab === tabItem.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {tabItem.label}
            </button>
          ))}
        </div>

        {/* Tìm kiếm & Chọn tất cả */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: 180 }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Tìm dự án, chủ đầu tư..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '5px 8px 5px 28px', borderRadius: 8,
                fontSize: 12, border: '1px solid var(--border)',
                background: 'var(--bg-surface)', color: 'var(--text-primary)',
              }}
            />
          </div>

          <button
            type="button"
            onClick={toggleSelectAllFiltered}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--bg-surface)', color: 'var(--text-primary)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <CheckSquare size={13} style={{ color: 'var(--brand-600)' }} />
            Chọn / Bỏ chọn lọc
          </button>

          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-700)' }}>
            Đã chọn: {selectedIndices.size}/{countTotal}
          </span>
        </div>
      </div>

      {/* Bảng danh sách dòng dữ liệu xem trước */}
      <div style={{
        overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 12,
        maxHeight: 360, overflowY: 'auto', background: 'var(--bg-surface)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 780 }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--bg-surface-2)' }}>
            <tr>
              <th style={{ width: 36, padding: '8px 10px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={
                    filteredRows.filter(r => !r.error).length > 0 &&
                    filteredRows.filter(r => !r.error).every(r => selectedIndices.has(r._uid))
                  }
                  onChange={toggleSelectAllFiltered}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th style={{ width: 44, padding: '8px 8px', borderBottom: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)' }}>
                Dòng
              </th>
              <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', textAlign: 'left', minWidth: 200, color: 'var(--text-primary)' }}>
                Tên dự án
              </th>
              <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', textAlign: 'left', minWidth: 140, color: 'var(--text-muted)' }}>
                Từ khóa
              </th>
              <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', textAlign: 'left', minWidth: 160, color: 'var(--text-muted)' }}>
                Chủ đầu tư
              </th>
              <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', textAlign: 'left', width: 90, color: 'var(--text-muted)' }}>
                Lĩnh vực
              </th>
              <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', textAlign: 'left', width: 90, color: 'var(--text-muted)' }}>
                Địa phương
              </th>
              <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', textAlign: 'left', minWidth: 130, color: 'var(--text-muted)' }}>
                Thông tin khác
              </th>
              <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', textAlign: 'left', width: 90, color: 'var(--text-muted)' }}>
                Trạng thái
              </th>
              <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', textAlign: 'center', width: 70, color: 'var(--text-muted)' }}>
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Không có dòng dữ liệu nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => {
                const isSelected = selectedIndices.has(r._uid);
                const hasErr = Boolean(r.error);
                return (
                  <tr
                    key={r._uid}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: hasErr
                        ? '#fef2f2'
                        : isSelected
                        ? 'var(--brand-50, #eff6ff)'
                        : 'transparent',
                      transition: 'background 0.1s ease',
                    }}
                  >
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        disabled={hasErr}
                        checked={isSelected}
                        onChange={() => toggleSelect(r._uid)}
                        style={{ cursor: hasErr ? 'not-allowed' : 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '8px 8px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700 }}>
                      {r.row_idx}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{
                          fontWeight: 700,
                          color: hasErr ? '#b91c1c' : 'var(--text-primary)',
                        }}>
                          {r.name || <em style={{ color: '#ef4444' }}>[Chưa có tên dự án]</em>}
                        </span>
                        {r.work_items && (
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                            📋 <strong>Hạng mục:</strong> {r.work_items}
                          </span>
                        )}
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                          {r.is_duplicate && (
                            <span style={{
                              fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 4,
                              background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a',
                            }}>
                              Đã có trong hệ thống
                            </span>
                          )}
                          {hasErr && (
                            <span style={{
                              fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 4,
                              background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5',
                            }}>
                              {r.error}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                      {r.keyword_filter ? (
                        <span>{r.keyword_filter}</span>
                      ) : (
                        <em style={{ color: 'var(--text-muted)' }}>Tự động rút</em>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                      {r.investor || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      {r.sector_name || r.sector ? (
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: '2px 6px', borderRadius: 5,
                          background: 'var(--bg-surface-2)', color: 'var(--text-secondary)',
                          border: '1px solid var(--border)',
                        }}>
                          {r.sector_name || r.sector}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                      {r.province || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: 11 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {r.total_investment && (
                          <span style={{ color: '#047857', fontWeight: 700 }}>
                            💰 {r.total_investment}
                          </span>
                        )}
                        {r.capital_source && (
                          <span style={{ color: 'var(--text-secondary)' }}>
                            🏛️ {r.capital_source}
                          </span>
                        )}
                        {r.progress && (
                          <span style={{ color: '#1d4ed8', fontWeight: 600 }}>
                            ⏱️ {r.progress}
                          </span>
                        )}
                        {r.note && (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            📝 {r.note}
                          </span>
                        )}
                        {!r.total_investment && !r.capital_source && !r.progress && !r.note && (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{
                        fontSize: 10.5, fontWeight: 700, padding: '2px 6px', borderRadius: 5,
                        background: 'var(--bg-surface-2)', color: 'var(--text-muted)',
                      }}>
                        {r.status || 'watching'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => setEditingRow(r)}
                          title="Sửa thông tin dòng"
                          style={{
                            border: 'none', background: 'transparent', cursor: 'pointer',
                            padding: 4, borderRadius: 6, color: 'var(--brand-600)',
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRowDelete(r._uid)}
                          title="Xóa dòng khỏi danh sách xem trước"
                          style={{
                            border: 'none', background: 'transparent', cursor: 'pointer',
                            padding: 4, borderRadius: 6, color: '#ef4444',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Thanh hành động cuối */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
        <button
          type="button"
          onClick={() => setStep('upload')}
          disabled={busy}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '11px 18px', borderRadius: 12, border: '1px solid var(--border)',
            background: 'var(--bg-surface-2)', color: 'var(--text-primary)',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} /> Quay lại
        </button>

        <button
          type="button"
          onClick={handleConfirmImport}
          disabled={selectedIndices.size === 0 || busy}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', borderRadius: 12, border: 'none',
            fontSize: 14, fontWeight: 800,
            background: selectedIndices.size === 0 || busy ? 'var(--bg-surface-2)' : 'var(--brand-500, #2563eb)',
            color: selectedIndices.size === 0 || busy ? 'var(--text-muted)' : '#fff',
            cursor: selectedIndices.size === 0 || busy ? 'default' : 'pointer',
            boxShadow: selectedIndices.size > 0 && !busy ? '0 4px 14px rgba(37,99,235,0.3)' : 'none',
          }}
        >
          {busy ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
          Xác nhận nhập {selectedIndices.size} dự án đã chọn
        </button>
      </div>

      {/* Modal chỉnh sửa dòng */}
      {editingRow && (
        <RowEditModal
          row={editingRow}
          sectors={sectors}
          onSave={handleRowSave}
          onClose={() => setEditingRow(null)}
        />
      )}
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
  const [excelStep, setExcelStep] = useState('upload');

  useEffect(() => {
    if (open) {
      setTab('excel');
      setExcelStep('upload');
    }
  }, [open]);

  if (!open) return null;

  const isWide = tab === 'excel' && excelStep === 'preview';

  const TABS = [
    { id: 'excel', label: t('projects.tabImport'), icon: <FileSpreadsheet size={15} /> },
    { id: 'profile', label: t('projects.tabProfile'), icon: <FileText size={15} /> },
  ];

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1000000,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        boxSizing: 'border-box',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={tab === 'excel' ? t('projects.importTitle') : t('projects.profileTitle')}
        style={{
          width: isWide ? 'min(1150px, 96vw)' : 'min(980px, 95vw)',
          maxWidth: isWide ? 1150 : 980,
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--bg-surface)',
          borderRadius: 24,
          padding: 26,
          border: '1px solid var(--border)',
          boxShadow: '0 25px 60px rgba(0,0,0,.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          margin: 'auto',
          transition: 'all 0.2s ease',
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
          ? <ExcelTab onDone={onImported} onStepChange={setExcelStep} />
          : <ProfileTab onDone={onImported} />}
      </div>
    </div>,
    document.body
  );
}
