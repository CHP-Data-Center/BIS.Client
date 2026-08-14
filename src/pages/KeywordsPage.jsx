import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Trash2, Edit3, X, Tag, Loader2, Search, 
  LayoutGrid, Sparkles, Star, Folder, Globe, ChevronDown
} from 'lucide-react';
import { keywordsService } from '../services/keywords';
import { categoriesService } from '../services/categories';
import { useLang } from '../context/LanguageContext';
import ConfirmModal from '../components/common/ConfirmModal';
import { tUI } from '../locales';

const MAX_KEYWORDS = 50;

// Custom SVG Flag Components - 1px viewBox padding buffer prevents subpixel edge clipping
const FlagVN = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 26 26" style={{ flexShrink: 0, display: 'block', overflow: 'visible' }}>
    <circle cx="13" cy="13" r="12" fill="#da251d" />
    <polygon points="13,5.5 15.2,10.2 20.4,10.2 16.2,13.3 17.8,18.4 13,15.2 8.2,18.4 9.8,13.3 5.6,10.2 10.8,10.2" fill="#fffe00" />
  </svg>
);

const FlagUK = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 26 26" style={{ flexShrink: 0, display: 'block', overflow: 'visible' }}>
    <clipPath id="uk-circle-clip"><circle cx="13" cy="13" r="12" /></clipPath>
    <g clipPath="url(#uk-circle-clip)">
      <rect width="26" height="26" fill="#00247d" />
      <path d="M0,0 L26,26 M26,0 L0,26" stroke="#ffffff" strokeWidth="4.5" />
      <path d="M0,0 L26,26 M26,0 L0,26" stroke="#cf142b" strokeWidth="2.5" />
      <path d="M13,0 V26 M0,13 H26" stroke="#ffffff" strokeWidth="6.5" />
      <path d="M13,0 V26 M0,13 H26" stroke="#cf142b" strokeWidth="3.5" />
    </g>
  </svg>
);

const FlagJP = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 26 26" style={{ flexShrink: 0, display: 'block', overflow: 'visible' }}>
    <circle cx="13" cy="13" r="12" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
    <circle cx="13" cy="13" r="5" fill="#bc002d" />
  </svg>
);

const LangFlag = ({ lang, size = 18 }) => {
  if (lang === 'ja') return <FlagJP size={size} />;
  if (lang === 'en') return <FlagUK size={size} />;
  return <FlagVN size={size} />;
};

const LANG_OPTIONS = [
  { value: 'vi', label: tUI('ui.tieng-viet'), flag: <FlagVN size={18} /> },
  { value: 'en', label: 'English',    flag: <FlagUK size={18} /> },
  { value: 'ja', label: '日本語',      flag: <FlagJP size={18} /> },
];

const CustomLangSelect = ({ value, onChange, includeAll = false, allLabel = 'Tất cả', style = {}, height = 40 }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = includeAll
    ? [{ value: 'all', label: allLabel, flag: <Globe size={16} style={{ color: 'var(--text-muted)' }} /> }, ...LANG_OPTIONS]
    : LANG_OPTIONS;

  const currentOption = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minWidth: 135, ...style }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="form-input"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          height,
          padding: '0 12px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          background: 'var(--bg-surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          width: '100%',
          textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentOption.flag}
          <span>{currentOption.label}</span>
        </span>
        <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 999,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: opt.value === value ? 700 : 500,
                color: opt.value === value ? 'var(--brand-500)' : 'var(--text-primary)',
                background: opt.value === value ? 'var(--bg-surface-2)' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (opt.value !== value) e.currentTarget.style.background = 'var(--bg-surface-2)';
              }}
              onMouseLeave={(e) => {
                if (opt.value !== value) e.currentTarget.style.background = 'transparent';
              }}
            >
              {opt.flag}
              <span>{opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Reusable Keyword Chip Component for 100% consistency across views
const KeywordChipItem = ({ kw, catMap, startEdit, onDeleteClick, tCategory, t }) => (
  <div
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '7px 14px', borderRadius: 24,
      background: 'var(--bg-surface-2)',
      border: `1px solid ${kw.is_primary ? 'rgba(245, 158, 11, 0.4)' : 'var(--border)'}`,
      boxShadow: kw.is_primary 
        ? '0 2px 8px rgba(245, 158, 11, 0.12)' 
        : '0 1px 3px rgba(0,0,0,0.03)',
      transition: 'all 0.2s ease',
      position: 'relative'
    }}
    className="keyword-chip-item"
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'var(--bg-surface)';
      e.currentTarget.style.borderColor = 'var(--brand-400)';
      e.currentTarget.style.transform = 'translateY(-1px)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.12)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'var(--bg-surface-2)';
      e.currentTarget.style.borderColor = kw.is_primary ? 'rgba(245, 158, 11, 0.4)' : 'var(--border)';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = kw.is_primary ? '0 2px 8px rgba(245, 158, 11, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)';
    }}
  >
    {/* SVG Country Flag Icon */}
    <LangFlag lang={kw.lang} size={18} />
    
    {/* Term Title */}
    <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}
          title={kw.display_term ? `Gốc: ${kw.term}` : undefined}>
      {kw.display_term || kw.term}
    </span>

    {/* Primary Star Badge */}
    {kw.is_primary && (
      <Star size={13} style={{ color: '#f59e0b', fill: '#f59e0b' }} title={t ? t('keywords.isPrimary') : 'Từ khóa chính'} />
    )}

    {/* Category Label (optional) */}
    {catMap && kw.category_id && catMap[kw.category_id] && (
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
        background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-200)'
      }}>
        {tCategory ? tCategory(catMap[kw.category_id]) : catMap[kw.category_id]}
      </span>
    )}

    {/* Action Buttons */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 4 }}>
      <button
        onClick={() => startEdit(kw)}
        title={tUI('ui.sua')}
        style={{
          width: 22, height: 22, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)', border: 'none', background: 'transparent', cursor: 'pointer',
          transition: 'color 0.15s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand-600)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <Edit3 size={12} />
      </button>
      <button
        onClick={() => onDeleteClick(kw)}
        title={tUI('ui.xoa')}
        style={{
          width: 22, height: 22, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)', border: 'none', background: 'transparent', cursor: 'pointer',
          transition: 'color 0.15s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <Trash2 size={12} />
      </button>
    </div>
  </div>
);

export default function KeywordsPage() {
  const [keywords, setKeywords]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  // Search & Filter & View state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLang, setFilterLang] = useState('all');
  const [filterCat, setFilterCat]   = useState('all');
  const [onlyPrimary, setOnlyPrimary] = useState(false);
  const [viewMode, setViewMode]     = useState('chips'); // 'chips' | 'grid' | 'grouped'

  // Add form state
  const [newTerm, setNewTerm]       = useState('');
  const [newCat, setNewCat]         = useState('');
  const [newLang, setNewLang]       = useState('vi');
  const [newPrimary, setNewPrimary] = useState(false);

  // Edit state
  const [editId, setEditId]         = useState(null);
  const [editTerm, setEditTerm]     = useState('');
  const [editCat, setEditCat]       = useState('');
  const [editLang, setEditLang]     = useState('vi');
  const [editPrimary, setEditPrimary] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kws, cats] = await Promise.all([
        keywordsService.getKeywords(),
        categoriesService.getCategories().catch(() => []),
      ]);
      setKeywords(kws);
      setCategories(cats);
    } catch {
      showError('Không thể tải danh sách từ khóa.');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };
  const showError   = (msg) => { setError(msg);   setTimeout(() => setError(''),   4000); };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTerm.trim()) return;
    if (keywords.length >= MAX_KEYWORDS) {
      showError(`Đã đạt giới hạn tối đa ${MAX_KEYWORDS} từ khóa.`);
      return;
    }
    setSaving(true);
    try {
      const kw = await keywordsService.createKeyword({
        term: newTerm.trim(),
        category_id: newCat ? Number(newCat) : null,
        lang: newLang,
        is_primary: newPrimary,
      });
      setKeywords((prev) => [kw, ...prev]);
      setNewTerm('');
      setNewCat('');
      setNewPrimary(false);
      showSuccess('Đã thêm từ khóa mới thành công.');
    } catch (err) {
      if (err.response?.data?.code === 'duplicate') showError('Từ khóa này đã tồn tại.');
      else showError(err.response?.data?.detail || 'Lỗi khi thêm từ khóa.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteKeyword = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await keywordsService.deleteKeyword(deleteTarget.id);
      setKeywords((prev) => prev.filter((k) => k.id !== deleteTarget.id));
      showSuccess(`Đã xóa từ khóa "${deleteTarget.term}".`);
      setDeleteTarget(null);
    } catch {
      showError('Không thể xóa từ khóa.');
    } finally {
      setDeleting(false);
    }
  };

  const startEdit = (kw) => {
    setEditId(kw.id);
    setEditTerm(kw.term);
    setEditCat(kw.category_id || '');
    setEditLang(kw.lang || 'vi');
    setEditPrimary(!!kw.is_primary);
  };

  const handleEditSave = async (id) => {
    if (!editTerm.trim()) { setEditId(null); return; }
    try {
      const updated = await keywordsService.updateKeyword(id, { 
        term: editTerm.trim(),
        category_id: editCat ? Number(editCat) : null,
        lang: editLang,
        is_primary: editPrimary
      });
      setKeywords((prev) => prev.map((k) => k.id === id ? updated : k));
      setEditId(null);
      showSuccess('Đã cập nhật từ khóa.');
    } catch (err) {
      showError(err.response?.data?.detail || 'Lỗi khi cập nhật từ khóa.');
    }
  };

  // Map category ID to name
  const catMap = useMemo(() => {
    const map = {};
    categories.forEach(c => { map[c.id] = c.name; });
    return map;
  }, [categories]);

  // Filtered keywords
  const filteredKeywords = useMemo(() => {
    return keywords.filter(kw => {
      if (searchTerm.trim() && !kw.term.toLowerCase().includes(searchTerm.toLowerCase().trim())) {
        return false;
      }
      if (filterLang !== 'all' && kw.lang !== filterLang) {
        return false;
      }
      if (filterCat !== 'all') {
        if (filterCat === 'uncategorized' && kw.category_id) return false;
        if (filterCat !== 'uncategorized' && kw.category_id !== Number(filterCat)) return false;
      }
      if (onlyPrimary && !kw.is_primary) {
        return false;
      }
      return true;
    });
  }, [keywords, searchTerm, filterLang, filterCat, onlyPrimary]);

  // Grouped keywords by Category
  const groupedKeywords = useMemo(() => {
    const groups = {};
    filteredKeywords.forEach(kw => {
      const catName = kw.category_id ? (catMap[kw.category_id] || 'Danh mục khác') : 'Chưa phân loại';
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(kw);
    });
    return groups;
  }, [filteredKeywords, catMap]);

  const { t, tCategory } = useLang();
  const primaryCount = useMemo(() => keywords.filter(k => k.is_primary).length, [keywords]);

  return (
    <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header & Stats Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24
      }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: '0 6px 20px rgba(59,130,246,0.35)',
            }}>
              <Tag size={22} color="white" />
            </div>
            {t('keywords.title')}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {t('keywords.subtitle')}
          </p>
        </div>

        {/* Counter Pills */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12, padding: '8px 16px',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Tag size={16} style={{ color: 'var(--brand-500)' }} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('common.total')}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                {keywords.length} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>/ {MAX_KEYWORDS}</span>
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12, padding: '8px 16px',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Star size={16} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('keywords.isPrimary')}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#d97706' }}>{primaryCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ padding: '12px 16px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 12, fontSize: 13, color: '#e11d48', marginBottom: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, fontSize: 13, color: '#16a34a', marginBottom: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          ✅ {success}
        </div>
      )}

      {/* Quick Add Bar */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 16, padding: '18px 22px', marginBottom: 24,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={16} style={{ color: 'var(--brand-500)' }} /> {t('keywords.addBtn')}
        </div>

        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '2 1 220px' }}>
            <input
              id="input-keyword-term"
              className="form-input"
              placeholder={t('keywords.termPlaceholder')}
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              required
              style={{ fontSize: 13.5, height: 40 }}
            />
          </div>

          <div style={{ width: 140 }}>
            <CustomLangSelect 
              value={newLang} 
              onChange={setNewLang} 
              height={40} 
            />
          </div>

          {categories.length > 0 && (
            <div style={{ width: 160 }}>
              <select 
                className="form-input" 
                style={{ fontSize: 13, height: 40 }} 
                value={newCat} 
                onChange={(e) => setNewCat(e.target.value)}
              >
                <option value="">-- {t('keywords.allCategories')} --</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{tCategory(c.name)}</option>)}
              </select>
            </div>
          )}

          <label style={{ 
            display: 'flex', alignItems: 'center', gap: 6, 
            fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', 
            cursor: 'pointer', userSelect: 'none',
            padding: '0 8px', height: 40
          }}>
            <input 
              type="checkbox" 
              checked={newPrimary} 
              onChange={(e) => setNewPrimary(e.target.checked)} 
              style={{ width: 16, height: 16, accentColor: 'var(--brand-500)', cursor: 'pointer' }} 
            />
            {t('keywords.isPrimary')}
          </label>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || keywords.length >= MAX_KEYWORDS}
            style={{ height: 40, padding: '0 20px', gap: 8, flexShrink: 0, fontWeight: 700 }}
            id="btn-add-keyword"
          >
            {saving ? <Loader2 size={16} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Plus size={16} />}
            {t('keywords.addBtn')}
          </button>
        </form>
      </div>

      {/* Toolbar: Search, Filters & View Mode Switcher */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, marginBottom: 18,
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '10px 16px', boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Left: Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 260px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder={t('keywords.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 34, height: 36, fontSize: 13, width: '100%' }}
            />
            {searchTerm && (
              <X 
                size={14} 
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer' }} 
                onClick={() => setSearchTerm('')}
              />
            )}
          </div>
        </div>

        {/* Right Controls: Filters & View Modes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Lang Filter */}
          <CustomLangSelect 
            value={filterLang} 
            onChange={setFilterLang} 
            includeAll={true} 
            allLabel={t('keywords.allLangs')} 
            height={36} 
            style={{ width: 155 }} 
          />

          {/* Category Filter */}
          {categories.length > 0 && (
            <select 
              className="form-input" 
              style={{ height: 36, fontSize: 12.5, padding: '0 10px', width: 'auto' }}
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            >
              <option value="all">{t('keywords.allCategories')}</option>
              <option value="uncategorized">{t('keywords.uncategorized')}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{tCategory(c.name)}</option>)}
            </select>
          )}

          {/* Primary Only Button */}
          <button
            onClick={() => setOnlyPrimary(!onlyPrimary)}
            style={{
              height: 36, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              background: onlyPrimary ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-surface-2)',
              color: onlyPrimary ? '#d97706' : 'var(--text-secondary)',
              border: `1px solid ${onlyPrimary ? '#fde68a' : 'var(--border)'}`,
              transition: 'all 0.15s'
            }}
          >
            <Star size={13} style={{ fill: onlyPrimary ? '#f59e0b' : 'none', color: onlyPrimary ? '#f59e0b' : 'currentColor' }} />
            {t('keywords.isPrimary')}
          </button>

          <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 2px' }} />

          {/* View Switcher Buttons */}
          <div style={{ display: 'flex', background: 'var(--bg-surface-2)', padding: 3, borderRadius: 9, border: '1px solid var(--border)' }}>
            <button
              onClick={() => setViewMode('chips')}
              title={t('keywords.chipsView')}
              style={{
                height: 30, padding: '0 10px', borderRadius: 7, border: 'none',
                background: viewMode === 'chips' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'chips' ? 'var(--brand-600)' : 'var(--text-muted)',
                fontWeight: viewMode === 'chips' ? 700 : 500, fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: viewMode === 'chips' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer'
              }}
            >
              <Tag size={13} /> {t('keywords.chipsView')}
            </button>

            <button
              onClick={() => setViewMode('grid')}
              title={t('keywords.gridView')}
              style={{
                height: 30, padding: '0 10px', borderRadius: 7, border: 'none',
                background: viewMode === 'grid' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--brand-600)' : 'var(--text-muted)',
                fontWeight: viewMode === 'grid' ? 700 : 500, fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: viewMode === 'grid' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer'
              }}
            >
              <LayoutGrid size={13} /> {t('keywords.gridView')}
            </button>

            <button
              onClick={() => setViewMode('grouped')}
              title={t('keywords.groupedView')}
              style={{
                height: 30, padding: '0 10px', borderRadius: 7, border: 'none',
                background: viewMode === 'grouped' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'grouped' ? 'var(--brand-600)' : 'var(--text-muted)',
                fontWeight: viewMode === 'grouped' ? 700 : 500, fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: viewMode === 'grouped' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer'
              }}
            >
              <Folder size={13} /> {t('keywords.groupedView')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={28} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 12px', display: 'block' }} />
          {t('common.loading')}
        </div>
      ) : filteredKeywords.length === 0 ? (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 48, textAlign: 'center'
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{t('keywords.noKeywords')}</div>
        </div>
      ) : (
        <>
          {/* EDIT MODAL */}
          {editId && (
            <div
              onClick={(e) => { if (e.target === e.currentTarget) setEditId(null); }}
              style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
                padding: 20
              }}
            >
              <div style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 16, padding: 24, width: '100%', maxWidth: 440,
                boxShadow: 'var(--shadow-xl)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>✏️ {t('keywords.editModalTitle')}</div>
                  <button onClick={() => setEditId(null)} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>{t('keywords.termLabel')}</label>
                    <input
                      className="form-input"
                      value={editTerm}
                      onChange={(e) => setEditTerm(e.target.value)}
                      autoFocus
                      style={{ fontSize: 14 }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>{t('keywords.languageLabel')}</label>
                      <CustomLangSelect 
                        value={editLang} 
                        onChange={setEditLang} 
                        height={40} 
                      />
                    </div>

                    {categories.length > 0 && (
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>{t('keywords.categoryLabel')}</label>
                        <select className="form-input" value={editCat} onChange={(e) => setEditCat(e.target.value)} style={{ fontSize: 13 }}>
                          <option value="">-- {t('keywords.uncategorized')} --</option>
                          {categories.map((c) => <option key={c.id} value={c.id}>{tCategory(c.name)}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
                    <input type="checkbox" checked={editPrimary} onChange={(e) => setEditPrimary(e.target.checked)} style={{ accentColor: 'var(--brand-500)', width: 16, height: 16 }} />
                    {t('keywords.isPrimary')}
                  </label>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                    <button className="btn btn-ghost" onClick={() => setEditId(null)}>{t('common.cancel')}</button>
                    <button className="btn btn-primary" onClick={() => handleEditSave(editId)}>{t('common.save')}</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 1: COMPACT CHIPS */}
          {viewMode === 'chips' && (
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 22, boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>
                {t('keywords.chipsView')} ({filteredKeywords.length})
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {filteredKeywords.map((kw) => (
                  <KeywordChipItem 
                    key={kw.id} 
                    kw={kw} 
                    catMap={catMap} 
                    startEdit={startEdit} 
                    onDeleteClick={setDeleteTarget} 
                    tCategory={tCategory}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* VIEW 2: GRID CARDS */}
          {viewMode === 'grid' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 16
            }}>
              {filteredKeywords.map((kw) => (
                <div
                  key={kw.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: `1px solid ${kw.is_primary ? 'rgba(245, 158, 11, 0.4)' : 'var(--border)'}`,
                    borderRadius: 14, padding: 16,
                    boxShadow: kw.is_primary ? '0 4px 14px rgba(245, 158, 11, 0.1)' : 'var(--shadow-sm)',
                    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    e.currentTarget.style.borderColor = 'var(--brand-400)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = kw.is_primary ? '0 4px 14px rgba(245, 158, 11, 0.1)' : 'var(--shadow-sm)';
                    e.currentTarget.style.borderColor = kw.is_primary ? 'rgba(245, 158, 11, 0.4)' : 'var(--border)';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <LangFlag lang={kw.lang} size={18} />
                        {kw.category_id && catMap[kw.category_id] && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-200)' }}>
                            {tCategory(catMap[kw.category_id])}
                          </span>
                        )}
                      </div>

                      {kw.is_primary && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(254, 243, 199, 0.8)', color: '#92400e', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Star size={10} style={{ fill: '#f59e0b', color: '#f59e0b' }} /> {t('keywords.isPrimary')}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, wordBreak: 'break-word' }}
                         title={kw.display_term ? `Gốc: ${kw.term}` : undefined}>
                      {kw.display_term || kw.term}
                    </div>
                  </div>

                  <div style={{
                    paddingTop: 10, borderTop: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: 11, color: 'var(--text-muted)'
                  }}>
                    <span>{kw.created_at ? new Date(kw.created_at).toLocaleDateString('vi-VN') : ''}</span>

                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => startEdit(kw)}
                        title={t('common.edit')}
                        style={{ padding: 4 }}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setDeleteTarget(kw)}
                        title={t('common.delete')}
                        style={{ padding: 4, color: '#ef4444' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW 3: CATEGORIZED GROUPS */}
          {viewMode === 'grouped' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {Object.entries(groupedKeywords).map(([catName, kws]) => (
                <div
                  key={catName}
                  style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{
                    padding: '12px 20px', background: 'var(--bg-surface-2)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Folder size={16} style={{ color: 'var(--brand-500)' }} />
                      {catName === 'Chưa phân loại' ? t('keywords.uncategorized') : tCategory(catName)}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'var(--brand-100)', color: 'var(--brand-700)' }}>
                      {kws.length}
                    </span>
                  </div>

                  <div style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {kws.map((kw) => (
                      <KeywordChipItem 
                        key={kw.id} 
                        kw={kw} 
                        catMap={null} 
                        startEdit={startEdit} 
                        onDeleteClick={setDeleteTarget} 
                        tCategory={tCategory}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title={t('keywords.deleteConfirmTitle')}
        message={t('keywords.deleteConfirmMsg')}
        itemName={deleteTarget?.term}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        type="danger"
        loading={deleting}
        onConfirm={confirmDeleteKeyword}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
