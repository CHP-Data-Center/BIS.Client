// src/pages/ArticlePage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, Globe, Cpu, ExternalLink, Bookmark, Share2, ChevronRight } from 'lucide-react';
import { getArticleById, mockArticles, SOURCES } from '../data/mockData';

export default function ArticlePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const article = getArticleById(id);

  if (!article) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📄</div>
        <div className="empty-title">Không tìm thấy bài viết</div>
        <div className="empty-sub">Bài viết này có thể đã bị xóa hoặc không tồn tại</div>
        <button className="btn btn-primary" onClick={() => nav(-1)} style={{ marginTop: 20 }}>
          <ArrowLeft size={14} /> Quay lại
        </button>
      </div>
    );
  }

  const src = SOURCES[article.source];
  const related = mockArticles
    .filter(a => a.id !== article.id && (a.source === article.source || a.category === article.category))
    .slice(0, 4);

  // Generate rich fake body content
  const bodyParagraphs = [
    article.excerptVi || article.excerpt,
    `Theo thông tin từ ${src.fullName}, dự án này được đánh giá là một trong những sáng kiến quan trọng nhất trong khu vực năm 2026. Các chuyên gia phân tích cho rằng đây là bước đi chiến lược nhằm tăng cường hợp tác phát triển bền vững.`,
    `Với tổng giá trị đầu tư lên đến ${article.amount ?? 'hàng trăm triệu USD'}, dự án dự kiến sẽ tác động trực tiếp đến hàng triệu người dân trong khu vực, đặc biệt tại các vùng nông thôn còn gặp nhiều khó khăn về cơ sở hạ tầng và dịch vụ cơ bản.`,
    `Hệ thống AI của IIH đã phân tích và tổng hợp thông tin từ nhiều nguồn chính thống để đưa ra bản tóm tắt này. Tất cả dữ liệu được cập nhật tự động mỗi 30 phút thông qua hệ thống crawler thông minh tích hợp sẵn.`,
    `Các bên liên quan dự kiến sẽ tổ chức cuộc họp vào quý III năm 2026 để đánh giá tiến độ triển khai và đưa ra những điều chỉnh phù hợp với bối cảnh thực tế. Đây cũng là cơ hội để các nhà thầu và đối tác quan tâm cập nhật thông tin chi tiết nhất.`,
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <a onClick={() => nav('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</a>
        <ChevronRight size={12} className="breadcrumb-sep" />
        <a onClick={() => nav(`/news/${article.source}`)} style={{ cursor: 'pointer' }}>{src.name}</a>
        <ChevronRight size={12} className="breadcrumb-sep" />
        <span style={{ color: 'var(--text-primary)', fontWeight: 600, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {(article.titleVi || article.title).slice(0, 40)}…
        </span>
      </div>

      <div className="article-layout">
        {/* Main */}
        <div>
          <article className="article-card">
            {/* Cover */}
            <div style={{
              height: 200,
              background: `linear-gradient(135deg, ${article.gradient[0]}, ${article.gradient[1]})`,
              borderRadius: 'var(--radius-lg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 'var(--space-6)',
              fontSize: 72,
              filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.08))',
            }}>
              {article.coverEmoji}
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span className="news-source-tag" style={{ background: src.color }}>
                {src.icon} {src.name}
              </span>
              {article.category && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  padding: '2px 8px', borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-surface-2)', color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}>
                  <Tag size={9} style={{ display: 'inline', marginRight: 3 }} />{article.category}
                </span>
              )}
              {article.amount && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  padding: '2px 10px', borderRadius: 'var(--radius-full)',
                  background: src.bg, color: src.color,
                  border: `1px solid ${src.color}40`,
                }}>
                  💰 {article.amount}
                </span>
              )}
              {article.status && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  padding: '2px 10px', borderRadius: 'var(--radius-full)',
                  background: article.status === 'Đang mở thầu' ? '#ecfdf5' : '#fffbeb',
                  color: article.status === 'Đang mở thầu' ? '#059669' : '#d97706',
                  border: `1px solid ${article.status === 'Đang mở thầu' ? '#a7f3d0' : '#fde68a'}`,
                }}>
                  {article.status}
                </span>
              )}
            </div>

            <h1 className="article-title">{article.titleVi || article.title}</h1>

            {/* AI Summary Box */}
            {article.aiSummary && (
              <div style={{
                display: 'flex',
                gap: 10,
                padding: '14px 16px',
                background: 'linear-gradient(135deg, rgba(244,114,182,0.07), rgba(167,139,250,0.07))',
                border: '1px solid rgba(167,139,250,0.25)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-6)',
              }}>
                <div>
                  <span className="ai-badge" style={{ marginBottom: 6, display: 'inline-flex' }}>
                    <Cpu size={9} /> Tóm tắt AI
                  </span>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {article.aiSummary}
                  </p>
                </div>
              </div>
            )}

            {/* Metadata row */}
            <div style={{
              display: 'flex', gap: 20, flexWrap: 'wrap',
              padding: '12px 0',
              borderTop: '1px solid var(--border-subtle)',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: 'var(--space-6)',
              fontSize: 12, color: 'var(--text-muted)',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Calendar size={12} />
                {new Date(article.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Globe size={12} /> {article.country}
              </span>
              {article.deadline && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#f59e0b', fontWeight: 600 }}>
                  ⏰ Hạn nộp: {new Date(article.deadline).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>

            {/* Body */}
            <div className="article-body">
              {bodyParagraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
              {article.tags?.map(tag => (
                <span key={tag} style={{
                  fontSize: 11, fontWeight: 600,
                  padding: '3px 10px', borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-surface-2)', color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}>
                  #{tag}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 'var(--space-6)' }}>
              <button className="btn btn-primary" style={{ gap: 6 }} id="btn-read-original">
                <ExternalLink size={14} /> Xem bài gốc
              </button>
              <button className="btn btn-secondary" style={{ gap: 6 }} id="btn-bookmark">
                <Bookmark size={14} /> Lưu lại
              </button>
              <button className="btn btn-secondary" style={{ gap: 6 }} id="btn-share">
                <Share2 size={14} /> Chia sẻ
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => nav(-1)}
                id="btn-back"
                style={{ marginLeft: 'auto', gap: 6 }}
              >
                <ArrowLeft size={14} /> Quay lại
              </button>
            </div>
          </article>
        </div>

        {/* Sidebar */}
        <div>
          {/* Source info */}
          <div className="article-sidebar-card">
            <div className="article-sidebar-title">
              <span>{src.icon}</span> Về {src.name}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {src.fullName} ({src.name}) là một tổ chức tài chính quốc tế lớn, cung cấp vốn vay, tư vấn chính sách và hỗ trợ kỹ thuật cho các nước đang phát triển.
            </p>
            <a
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                marginTop: 12, fontSize: 12, fontWeight: 600,
                color: src.color, textDecoration: 'none',
              }}
            >
              <ExternalLink size={11} /> {src.url}
            </a>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div className="article-sidebar-card">
              <div className="article-sidebar-title">
                📰 Bài Viết Liên Quan
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {related.map(ra => {
                  const rs = SOURCES[ra.source];
                  return (
                    <div
                      key={ra.id}
                      style={{
                        display: 'flex', gap: 10, padding: '10px 6px',
                        borderRadius: 'var(--radius-md)', cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onClick={() => nav(`/article/${ra.id}`)}
                      id={`related-${ra.id}`}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: `linear-gradient(135deg, ${ra.gradient[0]}, ${ra.gradient[1]})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, flexShrink: 0,
                      }}>
                        {ra.coverEmoji}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {ra.titleVi || ra.title}
                        </div>
                        <div style={{ fontSize: 10.5, color: rs.color, marginTop: 3, fontWeight: 600 }}>{rs.name}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Deadline alert */}
          {article.deadline && (
            <div style={{
              padding: 'var(--space-4)',
              background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
              border: '1px solid #fde68a',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>
                ⏰ Hạn Nộp Hồ Sơ
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#b45309', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {new Date(article.deadline).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
              <div style={{ fontSize: 11.5, color: '#92400e', marginTop: 6 }}>
                Còn {Math.max(0, Math.ceil((new Date(article.deadline) - new Date()) / (1000 * 60 * 60 * 24)))} ngày nữa
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
