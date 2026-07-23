// src/pages/KeywordsPage.jsx
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Check, X, Tag, Loader2, Search } from 'lucide-react';
import { keywordsService } from '../services/keywords';
import { categoriesService } from '../services/categories';

const MAX_KEYWORDS = 50;

export default function KeywordsPage() {
  const [keywords, setKeywords]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  // Add form
  const [newTerm, setNewTerm]     = useState('');
  const [newCat, setNewCat]       = useState('');
  const [newLang, setNewLang]     = useState('vi');
  const [newPrimary, setNewPrimary] = useState(false);

  // Edit state
  const [editId, setEditId]       = useState(null);
  const [editTerm, setEditTerm]   = useState('');

  useEffect(() => {
    Promise.all([
      keywordsService.getKeywords(),
      categoriesService.getCategories().catch(() => []),
    ]).then(([kws, cats]) => {
      setKeywords(kws);
      setCategories(cats);
    }).finally(() => setLoading(false));
  }, []);

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };
  const showError   = (msg) => { setError(msg);   setTimeout(() => setError(''),   4000); };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTerm.trim()) return;
    if (keywords.length >= MAX_KEYWORDS) {
      showError(`Tối đa ${MAX_KEYWORDS} từ khóa.`);
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
      setKeywords((prev) => [...prev, kw]);
      setNewTerm('');
      setNewCat('');
      setNewPrimary(false);
      showSuccess('Đã thêm từ khóa.');
    } catch (err) {
      if (err.response?.data?.code === 'duplicate') showError('Từ khóa này đã tồn tại.');
      else showError(err.response?.data?.detail || 'Lỗi khi thêm từ khóa.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa từ khóa này?')) return;
    try {
      await keywordsService.deleteKeyword(id);
      setKeywords((prev) => prev.filter((k) => k.id !== id));
      showSuccess('Đã xóa.');
    } catch {
      showError('Không thể xóa.');
    }
  };

  const handleEdit = async (id) => {
    if (!editTerm.trim()) { setEditId(null); return; }
    try {
      const updated = await keywordsService.updateKeyword(id, { term: editTerm.trim() });
      setKeywords((prev) => prev.map((k) => k.id === id ? updated : k));
      setEditId(null);
      showSuccess('Đã cập nhật.');
    } catch (err) {
      showError(err.response?.data?.detail || 'Lỗi khi cập nhật.');
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 4px 14px rgba(59,130,246,0.35)',
          }}>
            <Tag size={20} color="white" />
          </div>
          Quản Lý Từ Khóa
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Thêm từ khóa để dashboard tự lọc tin tức khớp với lĩnh vực bạn quan tâm.
          Tối đa <strong>{MAX_KEYWORDS}</strong> từ khóa.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ padding: '10px 14px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10, fontSize: 13, color: '#e11d48', marginBottom: 14, fontWeight: 500 }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, fontSize: 13, color: '#16a34a', marginBottom: 14, fontWeight: 500 }}>
          ✅ {success}
        </div>
      )}

      {/* Add form */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16, padding: 20, marginBottom: 24,
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
          ➕ Thêm Từ Khóa Mới
        </div>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '2 1 180px' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 5 }}>Từ khóa *</label>
            <input
              id="input-keyword-term"
              className="form-input"
              placeholder="vd: cao tốc, metro, đấu thầu..."
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              required
              style={{ fontSize: 13 }}
            />
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 5 }}>Ngôn ngữ</label>
            <select className="form-input" style={{ fontSize: 13 }} value={newLang} onChange={(e) => setNewLang(e.target.value)}>
              <option value="vi">🇻🇳 Tiếng Việt</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>
          {categories.length > 0 && (
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 5 }}>Danh mục</label>
              <select className="form-input" style={{ fontSize: 13 }} value={newCat} onChange={(e) => setNewCat(e.target.value)}>
                <option value="">-- Không --</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 1 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={newPrimary} onChange={(e) => setNewPrimary(e.target.checked)} style={{ accentColor: 'var(--brand-500)' }} />
              Chính
            </label>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || keywords.length >= MAX_KEYWORDS}
            style={{ gap: 6, flexShrink: 0 }}
            id="btn-add-keyword"
          >
            {saving ? <Loader2 size={14} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Plus size={14} />}
            Thêm
          </button>
        </form>
      </div>

      {/* Keywords list */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Từ Khóa Của Tôi
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700,
            padding: '2px 10px', borderRadius: 20,
            background: keywords.length >= MAX_KEYWORDS ? '#fff1f2' : 'var(--brand-50)',
            color: keywords.length >= MAX_KEYWORDS ? '#e11d48' : 'var(--brand-700)',
            border: `1px solid ${keywords.length >= MAX_KEYWORDS ? '#fecdd3' : 'var(--brand-200)'}`,
          }}>
            {keywords.length} / {MAX_KEYWORDS}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 8px', display: 'block' }} />
            Đang tải...
          </div>
        ) : keywords.length === 0 ? (
          <div className="empty-state" style={{ minHeight: 160 }}>
            <div className="empty-icon">🔍</div>
            <div className="empty-title">Chưa có từ khóa nào</div>
            <div className="empty-sub">Thêm từ khóa đầu tiên ở trên</div>
          </div>
        ) : (
          <div>
            {keywords.map((kw, i) => (
              <div
                key={kw.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px',
                  borderBottom: i < keywords.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {/* Icon */}
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'var(--brand-50)', border: '1px solid var(--brand-200)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Tag size={14} style={{ color: 'var(--brand-500)' }} />
                </div>

                {/* Term — editable */}
                {editId === kw.id ? (
                  <div style={{ flex: 1, display: 'flex', gap: 6 }}>
                    <input
                      className="form-input"
                      style={{ flex: 1, fontSize: 13 }}
                      value={editTerm}
                      onChange={(e) => setEditTerm(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(kw.id); if (e.key === 'Escape') setEditId(null); }}
                      autoFocus
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => handleEdit(kw.id)} style={{ gap: 4 }}><Check size={12} /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)} style={{ gap: 4 }}><X size={12} /></button>
                  </div>
                ) : (
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{kw.term}</span>
                      {kw.is_primary && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                          Chính
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {kw.lang === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
                      {kw.created_at && ` · ${new Date(kw.created_at).toLocaleDateString('vi-VN')}`}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {editId !== kw.id && (
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => { setEditId(kw.id); setEditTerm(kw.term); }}
                      title="Sửa"
                      id={`btn-edit-kw-${kw.id}`}
                      style={{ padding: '5px 8px' }}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDelete(kw.id)}
                      title="Xóa"
                      id={`btn-delete-kw-${kw.id}`}
                      style={{ padding: '5px 8px', color: '#ef4444' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
