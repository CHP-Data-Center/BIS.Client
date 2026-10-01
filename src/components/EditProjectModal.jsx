// src/components/EditProjectModal.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Loader2, Save, Pencil, Building2, MapPin, Layers, Briefcase, DollarSign, Calendar, FileText, Globe } from 'lucide-react';
import { projectsService } from '../services/projects';
import { useLang } from '../context/LanguageContext';
import { tUI } from '../locales';

const STATUS_OPTIONS = [
  { value: 'watching', labelKey: 'projects.statusWatching', defaultLabel: 'Đang theo dõi' },
  { value: 'active', labelKey: 'projects.statusActive', defaultLabel: 'Đang triển khai' },
  { value: 'completed', labelKey: 'projects.statusCompleted', defaultLabel: 'Hoàn thành' },
  { value: 'closed', labelKey: 'projects.statusClosed', defaultLabel: 'Đã đóng' },
];

/**
 * @param {Function} [onSave] - Hàm lưu thay cho đường mặc định (PATCH /projects/{id} của chính
 *   chủ dự án). Tab quản trị truyền `adminService.updateAnyProject` vào đây: super admin sửa dự
 *   án của người khác thì endpoint người dùng trả 403.
 */
export default function EditProjectModal({ project, sectors = [], onClose, onSaved, onSave }) {
  const { t, tCategory, tSector } = useLang();
  const [name, setName] = useState('');
  const [keywordFilter, setKeywordFilter] = useState('');
  const [investor, setInvestor] = useState('');
  const [investorUrl, setInvestorUrl] = useState('');
  const [sector, setSector] = useState('');
  const [province, setProvince] = useState('');
  const [status, setStatus] = useState('watching');
  const [workItems, setWorkItems] = useState('');
  const [totalInvestment, setTotalInvestment] = useState('');
  const [capitalSource, setCapitalSource] = useState('');
  const [progress, setProgress] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setKeywordFilter(project.keyword_filter || '');
      setInvestor(project.investor || '');
      setInvestorUrl(project.investor_url || '');
      setSector(project.sector || '');
      setProvince(project.province || '');
      setStatus(project.status || 'watching');
      setWorkItems(project.work_items || '');
      setTotalInvestment(project.total_investment || '');
      setCapitalSource(project.capital_source || '');
      setProgress(project.progress || '');
      setStartDate(project.start_date || '');
      setEndDate(project.end_date || '');
      setNote(project.note || '');
      setError(null);
    }
  }, [project]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (!project) return null;

  const suggestKeywords = async () => {
    if (!name.trim()) return;
    setSuggesting(true);
    setError(null);
    try {
      const res = await projectsService.extractKeywords(name.trim());
      if (res?.keyword_filter) {
        setKeywordFilter(res.keyword_filter);
      }
    } catch (e) {
      console.warn('Extract keywords failed:', e);
      setError('Không thể gợi ý từ khóa tự động. Hãy nhập thủ công.');
    } finally {
      setSuggesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên dự án.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      name: name.trim(),
      keyword_filter: keywordFilter.trim() || name.trim(),
      investor: investor.trim() || null,
      // Gửi nguyên thứ người dùng gõ — máy chủ tự chuẩn hóa ("acv.vn" → "https://acv.vn/")
      // và trả lỗi 400 kèm lý do nếu không dùng được. Không tự kiểm lại ở đây: hai bộ luật
      // sớm muộn sẽ lệch nhau.
      investor_url: investorUrl.trim() || null,
      sector: sector || null,
      province: province.trim() || null,
      status: status || 'watching',
      work_items: workItems.trim() || null,
      total_investment: totalInvestment.trim() || null,
      capital_source: capitalSource.trim() || null,
      progress: progress.trim() || null,
      // Ô <input type="date"> trả "" khi để trống — gửi null để xóa ngày, không gửi "".
      start_date: startDate || null,
      end_date: endDate || null,
      note: note.trim() || null,
    };

    try {
      const luu = onSave || projectsService.updateProject.bind(projectsService);
      const updated = await luu(project.id, payload);
      onSaved?.(updated);
      onClose();
    } catch (err) {
      console.error('Update project failed:', err);
      setError(err.response?.data?.detail || 'Không thể cập nhật thông tin dự án.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      onWheel={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
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
        overflow: 'hidden',
        overscrollBehavior: 'contain',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t('projects.editModalTitle')}
        style={{
          width: 'min(720px, 95vw)',
          maxWidth: 720,
          maxHeight: '90vh',
          background: 'var(--bg-surface)',
          borderRadius: 24,
          border: '1px solid var(--border)',
          boxShadow: '0 25px 60px rgba(0,0,0,.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          margin: 'auto',
        }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '22px 26px 18px',
          borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'var(--brand-50, #eff6ff)',
                color: 'var(--brand-600, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Pencil size={19} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17.5, fontWeight: 900, color: 'var(--text-primary)' }}>
                {t('projects.editModalTitle')}
              </h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {t('projects.editModalSub')}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            style={{
              border: 'none',
              background: 'var(--bg-surface-2)',
              borderRadius: 10,
              width: 32,
              height: 32,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Form wrapping body and footer */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', margin: 0 }}>
          {/* Scrollable Form Body */}
          <div
            className="custom-modal-scroll"
            style={{
              padding: '20px 26px',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}
          {/* Tên dự án */}
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 5, fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('projects.nameLabel')} <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('projects.nameLabel')}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-surface-2)',
                color: 'var(--text-primary)',
                fontSize: 13,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Từ khóa theo dõi */}
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 5, fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('projects.keywordsLabel')}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="form-input"
                value={keywordFilter}
                onChange={(e) => setKeywordFilter(e.target.value)}
                placeholder={tUI('ui.vi-du-cau-tran-hung-dao-thd')}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface-2)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={suggestKeywords}
                disabled={suggesting || !name.trim()}
                title={t('projects.keywordsHint')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, flex: 'none',
                  padding: '0 12px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  border: '1px solid var(--brand-400, #60a5fa)', background: 'var(--brand-50, #eff6ff)',
                  color: 'var(--brand-700, #1d4ed8)',
                  cursor: suggesting || !name.trim() ? 'default' : 'pointer',
                  opacity: suggesting || !name.trim() ? 0.55 : 1,
                }}
              >
                {suggesting ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />}
                {t('projects.suggestKeywords')}
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {t('projects.keywordsHint')}
            </div>
          </div>

          {/* 1. Tên Chủ đầu tư & 2. Vị trí */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                <Building2 size={13} style={{ color: 'var(--brand-600)' }} /> {t('projects.fieldInvestor').replace(':', '')}
              </label>
              <input
                type="text"
                className="form-input"
                value={investor}
                onChange={(e) => setInvestor(e.target.value)}
                placeholder={tUI('ui.vi-du-ban-qlda-dtxd-cong-trinh-giao-thong-tp-ha-')}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface-2)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Dùng đối chiếu tự động với các gói thầu e-GP trên Hệ thống Đấu thầu Quốc gia.
              </div>
            </div>

            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                <MapPin size={13} style={{ color: 'var(--brand-600)' }} /> {t('projects.fieldLocation').replace(':', '')}
              </label>
              <input
                type="text"
                className="form-input"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder={tUI('ui.vi-du-ha-noi-tp-hcm-toan-quoc')}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface-2)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Tỉnh/thành phố hoặc khu vực địa lý thực hiện dự án.
              </div>
            </div>
          </div>

          {/* Website chủ đầu tư — hệ thống crawl trang tin trên đó */}
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
              <Globe size={13} style={{ color: 'var(--brand-600)' }} /> {t('projects.investorWebsite')}
            </label>
            <input
              type="text"
              className="form-input"
              value={investorUrl}
              onChange={(e) => setInvestorUrl(e.target.value)}
              placeholder={tUI('ui.vi-du-vietnamairport-vn-hoac-trang-chuyen-muc-ti')}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-surface-2)',
                color: 'var(--text-primary)',
                fontSize: 13,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Hệ thống sẽ theo dõi trang tin trên website này. Tốt nhất dán link trang chuyên mục tin tức
              hoặc link RSS; trang chủ cũng được, hệ thống tự lọc lấy các bài viết.
            </div>
          </div>

          {/* 3. Lĩnh vực & Trạng thái */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                <Layers size={13} style={{ color: 'var(--brand-600)' }} /> {t('projects.fieldSector').replace(':', '')}
              </label>
              <select
                className="form-input"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface-2)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              >
                <option value="">{t('projects.selectSectorPlaceholder')}</option>
                {sectors.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {tCategory(s.name) || tSector(s.slug) || s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: 5, fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                {t('projects.fieldStatus').replace(':', '')}
              </label>
              <select
                className="form-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface-2)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  boxSizing: 'border-box',
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

          {/* 4. Hạng mục công việc */}
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
              <Briefcase size={13} style={{ color: 'var(--brand-600)' }} /> {t('projects.fieldWorkItems').replace(':', '')}
            </label>
            <textarea
              className="form-input"
              rows={2}
              value={workItems}
              onChange={(e) => setWorkItems(e.target.value)}
              placeholder={tUI('ui.vi-du-thi-cong-coc-khoan-nhoi-xay-lap-cau-chinh-')}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-surface-2)',
                color: 'var(--text-primary)',
                fontSize: 13,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Khai các hạng mục doanh nghiệp quan tâm đấu thầu hoặc theo dõi cơ hội thi công/cung ứng.
            </div>
          </div>

          {/* 5. Các thông tin liên quan khác của dự án: Tổng mức đầu tư, Nguồn vốn, Tiến độ */}
          <div style={{
            padding: '12px 14px', borderRadius: 14,
            background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
            display: 'flex', flexDirection: 'column', gap: 12
          }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <DollarSign size={14} style={{ color: 'var(--brand-600)' }} /> {t('projects.thOtherInfo')}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  {t('projects.fieldTotalInvestment').replace(':', '')}
                </label>
                <input
                  type="text"
                  value={totalInvestment}
                  onChange={(e) => setTotalInvestment(e.target.value)}
                  placeholder={tUI('ui.vi-du-1-200-ty-vnd-50-trieu-usd')}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: 12.5,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  {t('projects.fieldCapitalSource').replace(':', '')}
                </label>
                <input
                  type="text"
                  value={capitalSource}
                  onChange={(e) => setCapitalSource(e.target.value)}
                  placeholder={tUI('ui.vi-du-ngan-sach-nha-nuoc-von-oda-bot')}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: 12.5,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  {t('projects.fieldProgress').replace(':', '')}
                </label>
                <input
                  type="text"
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                  placeholder={tUI('ui.vi-du-dang-lap-fs-dang-dau-thau-dang-thi-cong')}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: 12.5,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  {t('projects.startDate')}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: 12.5,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  {t('projects.endDate')}
                </label>
                <input
                  type="date"
                  value={endDate}
                  // Trình duyệt chặn ngay ngày kết thúc trước ngày bắt đầu; máy chủ vẫn kiểm lại.
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: 12.5,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Ghi chú & thông tin khác */}
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
              <FileText size={13} style={{ color: 'var(--brand-600)' }} /> {t('projects.fieldNote').replace(':', '')}
            </label>
            <textarea
              className="form-input"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={tUI('ui.ghi-chu-noi-bo-ve-du-an-doi-tac-lich-trinh-lien-')}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-surface-2)',
                color: 'var(--text-primary)',
                fontSize: 13,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          </div>

          {/* Pinned Modal Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 10,
            padding: '14px 26px',
            borderTop: '1px solid var(--border-subtle, #f1f5f9)',
            background: 'var(--bg-surface-2)',
            flexShrink: 0,
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '9px 16px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 20px',
                borderRadius: 10,
                border: 'none',
                background: 'var(--brand-500, #2563eb)',
                color: '#fff',
                fontWeight: 800,
                fontSize: 13,
                cursor: loading ? 'default' : 'pointer',
                boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
              }}
            >
              {loading ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
              {t('projects.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
