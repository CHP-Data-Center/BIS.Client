import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Building2,
  MapPin,
  FileText,
  Save,
  Loader2,
  Phone,
  Tag,
  Pencil,
} from 'lucide-react';
import { investorsService } from '../services/investors';
import { useLang } from '../context/LanguageContext';

const INVESTOR_TYPES = [
  { value: 'ban_qlda', label: 'Ban Quản lý dự án (Ban QLDA)' },
  { value: 'so_nganh', label: 'Sở / Ban / Ngành' },
  { value: 'tap_doan_tct', label: 'Tập đoàn / Tổng công ty' },
  { value: 'ubnd', label: 'UBND Tỉnh / Thành phố / Quận / Huyện' },
  { value: 'benh_vien_truong_hoc', label: 'Bệnh viện / Trường học / Viện nghiên cứu' },
  { value: 'khac', label: 'Khác' },
];

const STATUS_OPTIONS = [
  { value: 'watching', label: 'Đang theo dõi', color: '#2563eb', bg: '#eff6ff' },
  { value: 'priority', label: 'Ưu tiên cao', color: '#d97706', bg: '#fef3c7' },
  { value: 'inactive', label: 'Tạm ngưng', color: '#64748b', bg: '#f1f5f9' },
];

export default function EditInvestorModal({ investor, onClose, onSaved }) {
  const { t } = useLang();
  const [name, setName] = useState('');
  const [aliases, setAliases] = useState('');
  const [province, setProvince] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [investorType, setInvestorType] = useState('ban_qlda');
  const [scale, setScale] = useState('');
  const [address, setAddress] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [status, setStatus] = useState('watching');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (investor) {
      setName(investor.name || '');
      setAliases(investor.aliases || '');
      setProvince(investor.province || '');
      setTaxCode(investor.tax_code || '');
      setInvestorType(investor.investor_type || 'ban_qlda');
      setScale(investor.scale || '');
      setAddress(investor.address || '');
      setContactInfo(investor.contact_info || '');
      setStatus(investor.status || 'watching');
      setNotes(investor.notes || '');
      setError(null);
    }
  }, [investor]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!investor) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên chủ đầu tư');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const updated = await investorsService.updateInvestor(investor.id, {
        name: name.trim(),
        aliases: aliases.trim() || null,
        province: province.trim() || null,
        tax_code: taxCode.trim() || null,
        investor_type: investorType || null,
        scale: scale.trim() || null,
        address: address.trim() || null,
        contact_info: contactInfo.trim() || null,
        status: status || 'watching',
        notes: notes.trim() || null,
      });
      if (onSaved) onSaved(updated);
      onClose();
    } catch (err) {
      console.error('Lỗi cập nhật CĐT:', err);
      setError(err?.response?.data?.detail || 'Có lỗi xảy ra khi cập nhật chủ đầu tư');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overscrollBehavior: 'contain',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          color: 'var(--text-main, #0f172a)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--border, #e2e8f0)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border, #e2e8f0)',
            backgroundColor: 'var(--bg-subtle, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Pencil size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, color: 'var(--text-main, #0f172a)' }}>
                Chỉnh sửa Chủ đầu tư
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', margin: 0 }}>
                Cập nhật thông tin nhận diện, phân loại và liên hệ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748b)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div
            style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '0.875rem',
                }}
              >
                {error}
              </div>
            )}

            {/* Tên chủ đầu tư */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: 'var(--text-main, #0f172a)',
                }}
              >
                <Building2 size={16} color="#2563eb" />
                Tên Chủ đầu tư / Bên mời thầu <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border, #cbd5e1)',
                  backgroundColor: 'var(--bg-surface, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '0.9375rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Tên viết tắt / tên gọi khác */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: 'var(--text-main, #0f172a)',
                }}
              >
                <Tag size={16} color="#64748b" />
                Tên viết tắt / Tên gọi khác
              </label>
              <input
                type="text"
                value={aliases}
                onChange={(e) => setAliases(e.target.value)}
                placeholder="Ví dụ: Ban QLDA Giao thông HN, BQL Giao thông Hà Nội (phân cách bằng dấu phẩy)"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border, #cbd5e1)',
                  backgroundColor: 'var(--bg-surface, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '0.9375rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Row: Phân loại & Trạng thái */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--text-main, #0f172a)',
                  }}
                >
                  Phân loại đơn vị
                </label>
                <select
                  value={investorType}
                  onChange={(e) => setInvestorType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #cbd5e1)',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    color: 'var(--text-main, #0f172a)',
                    fontSize: '0.9375rem',
                  }}
                >
                  {INVESTOR_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--text-main, #0f172a)',
                  }}
                >
                  Trạng thái theo dõi
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #cbd5e1)',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    color: 'var(--text-main, #0f172a)',
                    fontSize: '0.9375rem',
                  }}
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row: Tỉnh / TP & Mã định danh / MST */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--text-main, #0f172a)',
                  }}
                >
                  <MapPin size={16} color="#64748b" />
                  Tỉnh / Thành phố
                </label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Ví dụ: Hà Nội, TP Hồ Chí Minh..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #cbd5e1)',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    color: 'var(--text-main, #0f172a)',
                    fontSize: '0.9375rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--text-main, #0f172a)',
                  }}
                >
                  Mã số thuế / Mã định danh e-GP
                </label>
                <input
                  type="text"
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value)}
                  placeholder="Ví dụ: 0101234567"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #cbd5e1)',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    color: 'var(--text-main, #0f172a)',
                    fontSize: '0.9375rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Địa chỉ & Liên hệ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--text-main, #0f172a)',
                  }}
                >
                  Địa chỉ trụ sở
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #cbd5e1)',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    color: 'var(--text-main, #0f172a)',
                    fontSize: '0.9375rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--text-main, #0f172a)',
                  }}
                >
                  <Phone size={16} color="#64748b" />
                  Thông tin liên hệ (SĐT, Email)
                </label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #cbd5e1)',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    color: 'var(--text-main, #0f172a)',
                    fontSize: '0.9375rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Ghi chú */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: 'var(--text-main, #0f172a)',
                }}
              >
                <FileText size={16} color="#64748b" />
                Ghi chú & Đánh giá nội bộ
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border, #cbd5e1)',
                  backgroundColor: 'var(--bg-surface, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '0.9375rem',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Footer actions */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border, #e2e8f0)',
              backgroundColor: 'var(--bg-subtle, #f8fafc)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid var(--border, #cbd5e1)',
                backgroundColor: 'var(--bg-surface, #ffffff)',
                color: 'var(--text-main, #0f172a)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !name.trim() ? 0.7 : 1,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
