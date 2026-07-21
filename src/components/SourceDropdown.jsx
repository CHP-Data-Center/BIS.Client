// src/components/SourceDropdown.jsx
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SOURCES } from '../data/mockData';

export default function SourceDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const nav = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (sourceId) => {
    setOpen(false);
    nav(`/news/${sourceId}`);
  };

  return (
    <div className="source-dropdown-wrapper" ref={ref}>
      <button
        className={`source-btn ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
        id="btn-source-dropdown"
      >
        <Database size={14} />
        Nguồn Dữ Liệu
        <ChevronDown size={14} className="chevron" />
      </button>

      {open && (
        <div className="source-menu">
          <div className="source-menu-header">Chọn nguồn theo dõi</div>

          {Object.values(SOURCES).map(src => (
            <div
              key={src.id}
              className="source-item"
              onClick={() => handleSelect(src.id)}
              id={`source-item-${src.id}`}
            >
              <div
                className="source-item-icon"
                style={{ background: src.bg }}
              >
                <span style={{ fontSize: 18 }}>{src.icon}</span>
              </div>
              <div className="source-item-info">
                <div className="source-item-name">{src.fullName}</div>
                <div className="source-item-desc">{src.desc}</div>
              </div>
              <span
                className="source-item-badge"
                style={{ background: src.color }}
              >
                {src.name}
              </span>
            </div>
          ))}

          <div style={{ margin: '8px 12px 4px', borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
            <div
              className="source-item"
              onClick={() => { setOpen(false); nav('/news/all'); }}
              id="source-item-all"
            >
              <div className="source-item-icon" style={{ background: 'var(--bg-surface-2)' }}>
                <span style={{ fontSize: 18 }}>🗂️</span>
              </div>
              <div className="source-item-info">
                <div className="source-item-name">Tất cả nguồn</div>
                <div className="source-item-desc">Xem tổng hợp mọi nguồn</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
