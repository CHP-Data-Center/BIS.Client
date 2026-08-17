// src/pages/AiPage.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, Cpu, Loader2, ExternalLink, Bot, User,
  MessageSquarePlus, Trash2, Pencil, History, X,
  FileText, ShoppingBag, Globe, Building2, Sparkles,
  Layers, ArrowRight, CornerDownLeft, BookOpen, ChevronRight,
} from 'lucide-react';
import { aiService } from '../services/ai';
import { useLang } from '../context/LanguageContext';

/**
 * Xác định route nội bộ của hệ thống dựa trên loại dữ liệu và mã ID của nguồn
 */
function getInternalSourceRoute(source) {
  if (!source) return '/';
  // Backend đã tính sẵn đường dẫn chuẩn (AiSource.internal_path) → ưu tiên dùng, khỏi
  // đoán theo tiền tố mã. Các nhánh dưới chỉ là dự phòng cho dữ liệu cũ.
  if (source.internal_path) return source.internal_path;

  const idStr = String(source.id || '').trim();

  // 1. Gói mua sắm công / Đấu thầu → trang chi tiết trong app
  if (source.kind === 'procurement' || idStr.startsWith('IB') || idStr.startsWith('PL')) {
    return `/procurement/${encodeURIComponent(idStr)}`;
  }

  // 2. Dự án ODA: backend trả kind='oda'; source_name phân biệt ADB / World Bank.
  if (source.kind === 'oda' || source.kind === 'adb' || source.kind === 'adb_notice'
      || source.kind === 'worldbank') {
    const isWb = source.kind === 'worldbank'
      || (source.source_name || '').toLowerCase().includes('world bank');
    return `${isWb ? '/worldbank/project' : '/adb/project'}/${encodeURIComponent(idStr)}`;
  }

  // 3. Tin tức / Bài viết chi tiết (mặc định)
  return `/article/${encodeURIComponent(idStr)}`;
}

/**
 * Lấy nhãn và màu sắc phân loại cho thẻ nguồn
 */
function getSourceBadgeMeta(source) {
  const idStr = String(source.id || '').trim();
  const kind = source.kind || '';

  if (kind === 'procurement' || idStr.startsWith('IB') || idStr.startsWith('PL')) {
    if (idStr.startsWith('PL')) {
      return {
        label: 'KHLCNT (Kế hoạch)',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.14)',
        border: 'rgba(245, 158, 11, 0.35)',
        icon: ShoppingBag,
      };
    }
    return {
      label: 'TBMT (Mời thầu)',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.14)',
      border: 'rgba(16, 185, 129, 0.35)',
      icon: ShoppingBag,
    };
  }

  // Dự án ODA: backend trả kind='oda' cho cả 2 nhà tài trợ, phân biệt qua source_name.
  const isWbSource = kind === 'worldbank'
    || (kind === 'oda' && (source.source_name || '').toLowerCase().includes('world bank'));

  if (!isWbSource && (kind === 'adb' || kind === 'adb_notice' || kind === 'oda')) {
    return {
      label: 'Dự án ADB',
      color: '#ec4899',
      bg: 'rgba(236, 72, 153, 0.14)',
      border: 'rgba(236, 72, 153, 0.35)',
      icon: Building2,
    };
  }

  if (isWbSource) {
    return {
      label: 'World Bank',
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.14)',
      border: 'rgba(6, 182, 212, 0.35)',
      icon: Globe,
    };
  }

  return {
    label: source.source_name || 'Báo chí & Tin thầu',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.14)',
    border: 'rgba(59, 130, 246, 0.35)',
    icon: FileText,
  };
}

/**
 * Parse & render text có định dạng markdown nhẹ nhàng (bold, bullets, numbers, citations [1], [P1])
 */
function FormattedAiContent({ content, onCitationClick }) {
  if (!content) return null;

  const lines = content.split('\n');

  const renderInline = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|\[P?\d+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      const citationMatch = part.match(/^\[(P?\d+)\]$/);
      if (citationMatch) {
        const citationId = citationMatch[1];
        return (
          <button
            key={i}
            type="button"
            className="ai-citation-pill"
            onClick={() => onCitationClick && onCitationClick(citationId)}
            title={`Cuộn đến nguồn trích dẫn [${citationId}]`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1px 7px',
              margin: '0 3px',
              borderRadius: 6,
              background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
              border: '1px solid #a855f7',
              color: '#ffffff',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              verticalAlign: 'baseline',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 6px rgba(124, 58, 237, 0.35)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(124, 58, 237, 0.35)';
            }}
          >
            [{citationId}]
          </button>
        );
      }
      return part;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} style={{ height: 6 }} />;
        }

        // Bullet point: * hoặc -
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const itemText = trimmed.slice(2);
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingLeft: 4 }}>
              <span
                className="ai-bullet-dot"
                style={{
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #9333ea, #db2777)',
                  marginTop: 8,
                  flexShrink: 0,
                  boxShadow: '0 0 6px rgba(147, 51, 234, 0.6)',
                }}
              />
              <div style={{ flex: 1, lineHeight: 1.6 }}>{renderInline(itemText)}</div>
            </div>
          );
        }

        // Numbered list: 1. 2.
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          const num = numMatch[1];
          const itemText = numMatch[2];
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingLeft: 4 }}>
              <span
                className="ai-num-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 18,
                  height: 18,
                  borderRadius: 6,
                  background: 'rgba(124, 58, 237, 0.15)',
                  border: '1px solid rgba(124, 58, 237, 0.35)',
                  color: 'var(--brand-600, #7c3aed)',
                  fontSize: 10.5,
                  fontWeight: 800,
                  marginTop: 2,
                  flexShrink: 0,
                }}
              >
                {num}
              </span>
              <div style={{ flex: 1, lineHeight: 1.6 }}>{renderInline(itemText)}</div>
            </div>
          );
        }

        // Blockquote / trích dẫn: >
        if (trimmed.startsWith('> ')) {
          return (
            <div key={idx} style={{
              padding: '6px 12px',
              borderLeft: '3px solid #7c3aed',
              background: 'rgba(124, 58, 237, 0.08)',
              borderRadius: '0 8px 8px 0',
              fontStyle: 'italic',
              margin: '4px 0',
            }}>
              {renderInline(trimmed.slice(2))}
            </div>
          );
        }

        // Heading: ###
        if (trimmed.startsWith('### ')) {
          return (
            <div key={idx} style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8, marginBottom: 2 }}>
              {renderInline(trimmed.slice(4))}
            </div>
          );
        }

        // Heading: ##
        if (trimmed.startsWith('## ')) {
          return (
            <div key={idx} style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginTop: 10, marginBottom: 4 }}>
              {renderInline(trimmed.slice(3))}
            </div>
          );
        }

        // Đoạn văn thông thường
        return (
          <p key={idx} style={{ margin: 0, lineHeight: 1.65 }}>
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Right-side Panel hiển thị Nguồn tham khảo chuyên nghiệp (Perplexity / ChatGPT style)
 * Có hiệu ứng tự động cuộn (smooth scroll) đến nguồn được click trong text
 */
function SourcesRightPanel({ sources, highlightedId, onClose }) {
  const { t } = useLang();
  const nav = useNavigate();

  useEffect(() => {
    if (!highlightedId) return;
    const cleanId = String(highlightedId).replace(/^P/i, '');
    const targetElem =
      document.getElementById(`source-card-${highlightedId}`) ||
      document.getElementById(`source-card-${cleanId}`) ||
      document.getElementById(`source-card-${Number(cleanId)}`);

    if (targetElem) {
      targetElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedId]);

  return (
    <aside
      className="ai-sources-panel"
      style={{
        width: 330,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-surface-2, rgba(255, 255, 255, 0.02))',
      }}>
        <div style={{
          fontSize: 13,
          fontWeight: 800,
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        }}>
          <BookOpen size={15} style={{ color: '#7c3aed' }} />
          <span>{t('ai.sources') || 'Nguồn tham khảo'}</span>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            color: '#7c3aed',
            background: 'rgba(124, 58, 237, 0.15)',
            border: '1px solid rgba(124, 58, 237, 0.35)',
            padding: '1px 7px',
            borderRadius: 12,
          }}>
            {sources?.length || 0}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            title={t('common.close') || 'Đóng'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Sources List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(!sources || sources.length === 0) ? (
          <div style={{
            padding: '30px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 12.5,
            lineHeight: 1.6,
          }}>
            <Layers size={28} style={{ margin: '0 auto 10px', color: 'var(--text-muted)', opacity: 0.5 }} />
            <div>Chưa có nguồn trích dẫn cho câu trả lời này.</div>
          </div>
        ) : (
          sources.map((s, idx) => {
            const meta = getSourceBadgeMeta(s);
            const Icon = meta.icon;
            const internalRoute = getInternalSourceRoute(s);
            const isHighlighted = highlightedId && (
              String(idx + 1) === String(highlightedId) ||
              String(idx + 1) === String(highlightedId).replace(/^P/i, '') ||
              String(s.id).toLowerCase() === String(highlightedId).toLowerCase()
            );

            return (
              <div
                key={s.id || idx}
                id={`source-card-${idx + 1}`}
                className={`ai-source-card ${isHighlighted ? 'highlighted' : ''}`}
                onClick={() => nav(internalRoute)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: isHighlighted
                    ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(219, 39, 119, 0.18))'
                    : 'var(--bg-surface-2, rgba(255, 255, 255, 0.04))',
                  border: isHighlighted
                    ? '2px solid #7c3aed'
                    : '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isHighlighted
                    ? '0 0 20px rgba(124, 58, 237, 0.4), inset 0 0 12px rgba(124, 58, 237, 0.15)'
                    : '0 2px 8px rgba(0, 0, 0, 0.04)',
                  transform: isHighlighted ? 'scale(1.02)' : 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                  e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.6)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(124, 58, 237, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = isHighlighted ? 'scale(1.02)' : 'none';
                  e.currentTarget.style.borderColor = isHighlighted ? '#7c3aed' : 'var(--border-subtle, rgba(255, 255, 255, 0.08))';
                  e.currentTarget.style.boxShadow = isHighlighted ? '0 0 20px rgba(124, 58, 237, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.04)';
                }}
              >
                {/* Badge & Order */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: meta.bg,
                    border: `1px solid ${meta.border}`,
                    color: meta.color,
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                  }}>
                    <Icon size={10} />
                    <span>{meta.label}</span>
                  </span>

                  <span style={{
                    fontSize: 11,
                    fontWeight: 900,
                    color: isHighlighted ? '#ffffff' : 'var(--text-muted)',
                    background: isHighlighted ? '#7c3aed' : 'rgba(255, 255, 255, 0.06)',
                    padding: '1px 8px',
                    borderRadius: 10,
                    boxShadow: isHighlighted ? '0 2px 8px rgba(124, 58, 237, 0.5)' : 'none',
                  }}>
                    [{idx + 1}]
                  </span>
                </div>

                {/* Title */}
                <div style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.45,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {s.title}
                </div>

                {/* Footer Action */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 6,
                  borderTop: '1px dashed rgba(255, 255, 255, 0.06)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--brand-600, #7c3aed)',
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span>Mở trang nội bộ</span>
                    <ChevronRight size={12} />
                  </span>

                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="Mở liên kết cổng thông tin gốc"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        color: 'var(--text-muted)',
                        textDecoration: 'none',
                        fontSize: 10.5,
                        padding: '2px 5px',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.04)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#38bdf8'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      <span>Web gốc</span>
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

function MessageBubble({ msg, onOpenSources, onSelectCitation }) {
  const isUser = msg.role === 'user';
  const hasSources = !isUser && msg.sources?.length > 0;

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 20,
      gap: 12,
      alignItems: 'flex-start',
      animation: 'fadeIn 0.25s ease',
    }}>
      {!isUser && (
        <div
          className="ai-agent-avatar"
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <Sparkles size={18} color="white" />
        </div>
      )}

      <div
        className={isUser ? 'ai-bubble-user' : 'ai-bubble-assistant'}
        style={{
          maxWidth: isUser ? '75%' : '88%',
          background: isUser
            ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
            : 'var(--bg-surface, #1e293b)',
          color: isUser ? '#ffffff' : 'var(--text-primary)',
          borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
          padding: '14px 18px',
          border: isUser ? 'none' : '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
          boxShadow: isUser
            ? '0 4px 16px rgba(37, 99, 235, 0.35)'
            : '0 4px 20px rgba(0, 0, 0, 0.12)',
          lineHeight: 1.6,
          fontSize: 14.5,
        }}
      >
        {/* Agent badge & Sources quick pill */}
        {!isUser && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {msg.agent && (
              <div
                className="ai-agent-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 12px',
                  borderRadius: 20,
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(219, 39, 119, 0.2))',
                  border: '1px solid rgba(124, 58, 237, 0.5)',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#9333ea',
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.18)',
                }}
              >
                <Cpu size={11} />
                <span>{msg.agent}</span>
              </div>
            )}

            {hasSources && (
              <button
                type="button"
                className="ai-sources-pill"
                onClick={() => onOpenSources && onOpenSources(msg.sources)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 10px',
                  borderRadius: 16,
                  background: 'rgba(124, 58, 237, 0.15)',
                  border: '1px solid rgba(124, 58, 237, 0.4)',
                  color: '#7c3aed',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(124, 58, 237, 0.25)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(124, 58, 237, 0.15)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <BookOpen size={11} />
                <span>{msg.sources.length} nguồn tham khảo</span>
              </button>
            )}
          </div>
        )}

        {/* Answer text / Formatted Markdown */}
        <div style={{ color: isUser ? '#ffffff' : 'var(--text-primary)' }}>
          {isUser ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
          ) : (
            <FormattedAiContent
              content={msg.content}
              onCitationClick={(citationId) => {
                if (onSelectCitation) onSelectCitation(citationId, msg.sources);
              }}
            />
          )}
        </div>

        {/* Error */}
        {!isUser && msg.isError && (
          <div style={{
            marginTop: 8,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            fontSize: 13,
            color: '#f59e0b',
            fontWeight: 600,
          }}>
            ⚠️ {msg.content}
          </div>
        )}
      </div>

      {isUser && (
        <div
          className="ai-user-avatar"
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
          }}
        >
          <User size={18} color="white" />
        </div>
      )}
    </div>
  );
}

/** Sidebar: lịch sử trò chuyện của RIÊNG người đang đăng nhập (server lọc theo user). */
function HistorySidebar({ items, activeId, onSelect, onNew, onRename, onDelete, onClearAll, onClose }) {
  const { t } = useLang();
  return (
    <aside style={{
      width: 260,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 18,
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    }}>
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        <div style={{
          fontSize: 13,
          fontWeight: 800,
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <History size={15} style={{ color: '#7c3aed' }} />
          <span>{t('ai.history')}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            title={t('common.close') || 'Đóng'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div style={{ padding: 12 }}>
        <button
          className="btn ai-top-btn"
          onClick={onNew}
          id="btn-ai-new-chat"
          style={{
            width: '100%',
            gap: 8,
            fontSize: 12.5,
            fontWeight: 800,
            border: '1px solid rgba(124, 58, 237, 0.45)',
            color: '#7c3aed',
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(219, 39, 119, 0.1))',
            borderRadius: 12,
            padding: '9px 14px',
            boxShadow: '0 2px 8px rgba(124, 58, 237, 0.12)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(219, 39, 119, 0.18))';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(219, 39, 119, 0.1))';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <MessageSquarePlus size={15} />
          <span>{t('ai.newChat')}</span>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
        {items.length === 0 && (
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 10px', lineHeight: 1.6 }}>
            {t('ai.noHistory')}
          </div>
        )}
        {items.map((c) => {
          const active = c.id === activeId;
          return (
            <div
              key={c.id}
              onClick={() => onSelect(c.id)}
              style={{
                padding: '9px 10px',
                borderRadius: 10,
                marginBottom: 4,
                cursor: 'pointer',
                background: active ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(219, 39, 119, 0.15))' : 'transparent',
                border: `1px solid ${active ? 'rgba(124, 58, 237, 0.5)' : 'transparent'}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-surface-2)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12.5,
                  fontWeight: active ? 700 : 600,
                  color: active ? '#7c3aed' : 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {c.title}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  {c.message_count} {t('ai.messagesCount')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onRename(c); }}
                  title={t('ai.renameChat')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '3px 4px',
                    borderRadius: 4,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#7c3aed'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(c); }}
                  title={t('ai.deleteChat')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '3px 4px',
                    borderRadius: 4,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: 12, borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5 }}>
          🔒 {t('ai.historyHint')}
        </div>
        {items.length > 0 && (
          <button
            onClick={onClearAll}
            style={{
              width: '100%',
              fontSize: 11.5,
              fontWeight: 700,
              padding: '7px 10px',
              borderRadius: 10,
              cursor: 'pointer',
              background: 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {t('ai.clearAll')}
          </button>
        )}
      </div>
    </aside>
  );
}

export default function AiPage() {
  const { lang, t } = useLang();
  const greeting = useCallback(() => ({
    id: 0,
    role: 'assistant',
    content: t('ai.greeting'),
    agent: 'BIS AI Assistant',
    sources: [],
  }), [t]);

  const [messages, setMessages] = useState([greeting()]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  // Lịch sử chat riêng từng người dùng
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(() => window.innerWidth >= 1100);
  // Right Sources Panel state
  const [showSources, setShowSources] = useState(false);
  const [activeSources, setActiveSources] = useState([]);
  const [highlightedCitation, setHighlightedCitation] = useState(null);

  const convCacheRef = useRef(new Map());
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Sync greeting message when system language changes
  useEffect(() => {
    setMessages((prev) => {
      if (!prev || prev.length === 0) return [greeting()];
      return prev.map(m => m.id === 0 ? { ...m, content: t('ai.greeting') } : m);
    });
  }, [lang, t, greeting]);

  const SUGGESTED_QUESTIONS = [
    { label: t('ai.suggestion1'), icon: '⚡' },
    { label: t('ai.suggestion2'), icon: '🔍' },
    { label: t('ai.suggestion3'), icon: '📊' },
    { label: t('ai.suggestion4'), icon: '📑' },
  ];

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await aiService.conversations());
    } catch {
      setConversations([]);
    }
  }, []);

  useEffect(() => {
    aiService.status()
      .then(res => setIsConfigured(res?.configured ?? true))
      .catch(() => setIsConfigured(true));
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // Cập nhật nguồn hiển thị ở bảng bên phải theo tin nhắn AI mới nhất
  useEffect(() => {
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant' && m.sources?.length > 0);
    if (lastAssistantMsg) {
      setActiveSources(lastAssistantMsg.sources);
      if (window.innerWidth >= 1280) {
        setShowSources(true);
      }
    }
  }, [messages]);

  const openConversation = async (id) => {
    if (loading || id === activeId) return;

    // 1. Đổi active tab lập tức (0ms)
    setActiveId(id);

    // 2. Nếu đã có trong cache bộ nhớ -> nạp hiển thị tức thì (0ms)
    if (convCacheRef.current.has(id)) {
      const cachedMsgs = convCacheRef.current.get(id);
      setMessages(cachedMsgs);
      const lastMsgWithSources = [...cachedMsgs].reverse().find(m => m.role === 'assistant' && m.sources?.length > 0);
      if (lastMsgWithSources) {
        setActiveSources(lastMsgWithSources.sources);
      }
    } else {
      setChatLoading(true);
    }

    try {
      const detail = await aiService.conversation(id);
      const formattedMsgs = detail.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        agent: m.agent,
        sources: m.sources || [],
      }));
      convCacheRef.current.set(detail.id, formattedMsgs);

      setActiveId((currentId) => {
        if (currentId === detail.id) {
          setMessages(formattedMsgs);
          const lastMsgWithSources = [...formattedMsgs].reverse().find(m => m.role === 'assistant' && m.sources?.length > 0);
          if (lastMsgWithSources) {
            setActiveSources(lastMsgWithSources.sources);
          }
        }
        return currentId;
      });
    } catch {
      alert(t('ai.loadFailed'));
      loadConversations();
    } finally {
      setChatLoading(false);
    }
  };

  const startNewChat = () => {
    setActiveId(null);
    setMessages([greeting()]);
    setActiveSources([]);
    inputRef.current?.focus();
  };

  const renameConversation = async (conv) => {
    const title = window.prompt(t('ai.renamePrompt'), conv.title);
    if (!title || title.trim() === conv.title) return;
    await aiService.renameConversation(conv.id, title.trim());
    loadConversations();
  };

  const deleteConversation = async (conv) => {
    if (!window.confirm(t('ai.confirmDeleteChat'))) return;
    convCacheRef.current.delete(conv.id);
    await aiService.deleteConversation(conv.id);
    if (conv.id === activeId) startNewChat();
    loadConversations();
  };

  const clearAll = async () => {
    if (!window.confirm(t('ai.confirmClearAll'))) return;
    convCacheRef.current.clear();
    await aiService.clearConversations();
    startNewChat();
    loadConversations();
  };

  const handleOpenSources = (sources) => {
    setActiveSources(sources || []);
    setShowSources(true);
  };

  const handleSelectCitation = (citationId, sources) => {
    if (sources && sources.length > 0) {
      setActiveSources(sources);
    }
    setShowSources(true);
    setHighlightedCitation(citationId);

    // Tự động cuộn mượt (smooth scroll) đến thẻ nguồn tương ứng ở bảng bên phải
    setTimeout(() => {
      const cleanId = String(citationId).replace(/^P/i, '');
      const targetElem =
        document.getElementById(`source-card-${citationId}`) ||
        document.getElementById(`source-card-${cleanId}`) ||
        document.getElementById(`source-card-${Number(cleanId)}`);

      if (targetElem) {
        targetElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    setTimeout(() => setHighlightedCitation(null), 3500);
  };

  const sendMessage = async (question) => {
    const q = (question || input).trim();
    if (!q || loading) return;

    const userMsg = { id: Date.now(), role: 'user', content: q };
    const nextMessagesWithUser = [...messages, userMsg];
    setMessages(nextMessagesWithUser);
    setInput('');
    setLoading(true);

    try {
      const ans = await aiService.ask(q, activeId);
      const targetConvId = ans.conversation_id || activeId;
      if (ans.conversation_id && ans.conversation_id !== activeId) {
        setActiveId(ans.conversation_id);
        loadConversations();
      }
      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: ans.answer,
        agent: ans.agent,
        sources: ans.sources || [],
      };
      const finalMsgs = [...nextMessagesWithUser, assistantMsg];
      setMessages(finalMsgs);
      if (ans.sources && ans.sources.length > 0) {
        setActiveSources(ans.sources);
        setShowSources(true);
      }
      if (targetConvId) {
        convCacheRef.current.set(targetConvId, finalMsgs);
      }
    } catch (err) {
      const isUnavailable = err.response?.status === 503;
      const errorMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: isUnavailable
          ? (t('ai.notConfigured') || 'Trợ lý AI chưa được bật (chưa cấu hình API Key trên server).')
          : (err.response?.data?.detail || t('ai.errorMsg')),
        isError: true,
        agent: null,
        sources: [],
      };
      const finalMsgs = [...nextMessagesWithUser, errorMsg];
      setMessages(finalMsgs);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)' }}>
      {/* Header */}
      <div style={{ marginBottom: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              className="ai-agent-avatar"
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
              }}
            >
              <Bot size={20} color="white" />
            </div>
            <span>{t('ai.title')}</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            {t('ai.subtitle')}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Nút Cuộc trò chuyện mới */}
          <button
            onClick={startNewChat}
            className="ai-top-btn"
            id="btn-ai-new-chat-top"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 800,
              borderRadius: 12,
              padding: '8px 14px',
              border: '1px solid rgba(124, 58, 237, 0.5)',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(219, 39, 119, 0.15))',
              color: '#a855f7',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.18)',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124, 58, 237, 0.32), rgba(219, 39, 119, 0.25))';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(219, 39, 119, 0.15))';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <MessageSquarePlus size={15} />
            <span>{t('ai.newChat')}</span>
          </button>

          {/* Nút Lịch sử trò chuyện */}
          <button
            onClick={() => setShowHistory((v) => !v)}
            className={`ai-top-btn ${showHistory ? 'active' : ''}`}
            id="btn-ai-toggle-history"
            title={t('ai.history')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 800,
              borderRadius: 12,
              padding: '8px 14px',
              border: showHistory
                ? '1px solid rgba(124, 58, 237, 0.65)'
                : '1px solid var(--border-subtle, rgba(255, 255, 255, 0.18))',
              background: showHistory
                ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(219, 39, 119, 0.18))'
                : 'var(--bg-surface-2, rgba(255, 255, 255, 0.08))',
              color: showHistory ? '#c084fc' : 'var(--text-primary, #f1f5f9)',
              boxShadow: showHistory ? '0 2px 10px rgba(124, 58, 237, 0.28)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(219, 39, 119, 0.22))';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = showHistory
                ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(219, 39, 119, 0.18))'
                : 'var(--bg-surface-2, rgba(255, 255, 255, 0.08))';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <History size={15} style={{ color: showHistory ? '#c084fc' : '#7c3aed' }} />
            <span>{t('ai.history')}</span>
          </button>

          {/* Nút Bật/Tắt Nguồn tham khảo bên phải (nếu có nguồn) */}
          {activeSources.length > 0 && (
            <button
              onClick={() => setShowSources((v) => !v)}
              className={`ai-top-btn ${showSources ? 'active' : ''}`}
              id="btn-ai-toggle-sources"
              title="Nguồn tham khảo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12.5,
                fontWeight: 800,
                borderRadius: 12,
                padding: '8px 14px',
                border: showSources
                  ? '1px solid rgba(16, 185, 129, 0.65)'
                  : '1px solid var(--border-subtle, rgba(255, 255, 255, 0.18))',
                background: showSources
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.18))'
                  : 'var(--bg-surface-2, rgba(255, 255, 255, 0.08))',
                color: showSources ? '#34d399' : 'var(--text-primary, #f1f5f9)',
                boxShadow: showSources ? '0 2px 10px rgba(16, 185, 129, 0.28)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(6, 182, 212, 0.22))';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = showSources
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.18))'
                  : 'var(--bg-surface-2, rgba(255, 255, 255, 0.08))';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <BookOpen size={15} style={{ color: showSources ? '#34d399' : '#10b981' }} />
              <span>Nguồn ({activeSources.length})</span>
            </button>
          )}
        </div>
      </div>

      {!isConfigured && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 12,
          marginBottom: 14,
          background: '#fffbebf0',
          border: '1.5px solid #fde68a',
          color: '#b45309',
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          ⚠️ {t('ai.notConfigured') || 'Trợ lý AI chưa được cấu hình API Key trên máy chủ Server.'}
        </div>
      )}

      {/* 3-Column Layout: [History Sidebar] | [Chat Center] | [Sources Right Panel] */}
      <div style={{ flex: 1, display: 'flex', gap: 14, minHeight: 0 }}>
        {/* Left History Sidebar */}
        {showHistory && (
          <HistorySidebar
            items={conversations}
            activeId={activeId}
            onSelect={openConversation}
            onNew={startNewChat}
            onRename={renameConversation}
            onDelete={deleteConversation}
            onClearAll={clearAll}
            onClose={() => setShowHistory(false)}
          />
        )}

        {/* Center Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Chat messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '18px 18px 0 0',
            padding: '20px 24px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          }}>
            {chatLoading ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 12,
                color: 'var(--text-muted)',
              }}>
                <Loader2 size={28} style={{ color: '#7c3aed', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{t('common.loading') || 'Đang tải hội thoại...'}</span>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  onOpenSources={handleOpenSources}
                  onSelectCitation={handleSelectCitation}
                />
              ))
            )}

            {loading && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
                <div
                  className="ai-agent-avatar"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #7c3aed, #db2777)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
                  }}
                >
                  <Cpu size={18} color="white" />
                </div>
                <div style={{
                  padding: '12px 18px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '18px 18px 18px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                }}>
                  <Loader2 size={16} style={{ color: '#7c3aed', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-muted)' }}>
                    {t('ai.thinking')}
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggested questions */}
          {messages.length <= 1 && (
            <div style={{
              background: 'var(--bg-surface-2, rgba(255, 255, 255, 0.02))',
              borderLeft: '1px solid var(--border-subtle)',
              borderRight: '1px solid var(--border-subtle)',
              padding: '10px 16px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}>
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(q.label)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    padding: '6px 14px',
                    borderRadius: 20,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#7c3aed';
                    e.currentTarget.style.color = '#7c3aed';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 3px 10px rgba(124, 58, 237, 0.18)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.04)';
                  }}
                >
                  <span>{q.icon}</span>
                  <span>{q.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderTop: 'none',
            borderRadius: '0 0 18px 18px',
            padding: '14px 16px',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-end',
            flexShrink: 0,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          }}>
            <textarea
              ref={inputRef}
              id="input-ai-question"
              className="form-input"
              style={{
                flex: 1,
                resize: 'none',
                minHeight: 46,
                maxHeight: 120,
                fontSize: 14,
                lineHeight: 1.5,
                overflowY: 'auto',
                borderRadius: 14,
                padding: '12px 14px',
                background: 'var(--bg-surface-2, rgba(255, 255, 255, 0.03))',
                border: '1px solid var(--border-subtle)',
              }}
              placeholder={t('ai.inputPlaceholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className="btn btn-primary"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              id="btn-ai-send"
              style={{
                height: 46,
                padding: '0 18px',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 700,
                background: (!loading && input.trim())
                  ? 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)'
                  : 'var(--bg-surface-3, rgba(255, 255, 255, 0.1))',
                border: 'none',
                boxShadow: (!loading && input.trim())
                  ? '0 4px 14px rgba(124, 58, 237, 0.4)'
                  : 'none',
                cursor: (!loading && input.trim()) ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {loading ? (
                <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <>
                  <span>Gửi</span>
                  <CornerDownLeft size={14} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Sources Panel (Perplexity / Gemini Style) */}
        {showSources && (
          <SourcesRightPanel
            sources={activeSources}
            highlightedId={highlightedCitation}
            onClose={() => setShowSources(false)}
          />
        )}
      </div>
    </div>
  );
}
