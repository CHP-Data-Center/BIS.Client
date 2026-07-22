// src/components/NewsCard.jsx
import { Calendar, ExternalLink, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SOURCES } from '../data/mockData';

export default function NewsCard({ article, index = 0 }) {
  const nav = useNavigate();
  const src = SOURCES[article.source];
  const hasCover = article.source !== 'adb' && article.source !== 'worldbank' && article.source !== 'dauthau';

  return (
    <article
      className="news-card"
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={() => nav(`/article/${article.id}`)}
      id={`news-card-${article.id}`}
    >
      {/* Cover (Only display if it's not a database project source) */}
      {hasCover && (
        <div
          className="news-card-img"
          style={{
            overflow: 'hidden',
            flexShrink: 0,
            height: 180,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: article.coverUrl 
              ? 'none' 
              : `linear-gradient(135deg, ${article.gradient?.[0] ?? '#eff6ff'}, ${article.gradient?.[1] ?? '#dbeafe'})`,
          }}
        >
          {article.coverUrl ? (
            <img
              src={article.coverUrl}
              alt={article.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          ) : (
            <span style={{
              fontSize: 52,
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.12))',
              display: 'block',
              transition: 'transform 0.4s ease',
              transform: 'scale(1)',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15) rotate(5deg)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {article.coverEmoji ?? '📰'}
            </span>
          )}
        </div>
      )}

      {/* Body */}
      <div className="news-card-body">
        <div className="news-card-meta">
          <span
            className="news-source-tag"
            style={{ background: src.color }}
          >
            <span style={{ fontSize: 10 }}>{src.icon}</span>
            {src.name}
          </span>

          {article.amount && (
            <span style={{
              fontSize: 11.5,
              fontWeight: 800,
              color: src.color,
              background: src.bg,
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              border: `1.5px solid ${src.color}40`,
              letterSpacing: '0.3px',
            }}>
              {article.amount}
            </span>
          )}

          {article.status && (
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: article.status === 'Đang mở thầu' ? '#10b981' : '#f59e0b',
              background: article.status === 'Đang mở thầu' ? '#ecfdf5' : '#fffbeb',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              border: `1px solid ${article.status === 'Đang mở thầu' ? '#a7f3d0' : '#fde68a'}`,
            }}>
              {article.status}
            </span>
          )}
        </div>

        <h3 className="news-card-title">
          {article.titleVi || article.title}
        </h3>

        {!hasCover && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginTop: '6px',
            marginBottom: '6px',
            padding: '10px 12px',
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Mã dự án</span>
              <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'monospace' }}>{article.id}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Quốc gia</span>
              <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 700 }}>{article.country || 'Việt Nam'}</span>
            </div>
            {article.deadline && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Hạn cuối</span>
                <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700 }}>{article.deadline}</span>
              </div>
            )}
            {article.amount && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Quy mô</span>
                <span style={{ fontSize: '11px', color: src.color, fontWeight: 700 }}>{article.amount}</span>
              </div>
            )}
          </div>
        )}

        <p style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
          display: '-webkit-box',
          WebkitLineClamp: hasCover ? 2 : 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          flex: hasCover ? '1' : '0 0 auto',
          maxHeight: hasCover ? '3.1em' : '6.2em',
          marginTop: hasCover ? '0' : '4px',
        }}>
          {article.excerptVi || article.excerpt}
        </p>

        {article.aiSummary && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '9px 11px',
            background: 'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(244,114,182,0.08))',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(167,139,250,0.3)',
            marginTop: 'auto',
          }}>
            <span className="ai-badge" style={{ flexShrink: 0 }}>
              <Cpu size={9} />AI
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.45, fontWeight: 500 }}>
              {article.aiSummary}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="news-card-footer">
        <div className="news-card-date">
          <Calendar size={11} />
          {new Date(article.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {article.category && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{article.category}</span>
          )}
          <ExternalLink size={11} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>
    </article>
  );
}
