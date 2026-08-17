// src/pages/AiPage.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Send, Cpu, Loader2, ExternalLink, Bot, User, FileSearch,
  MessageSquarePlus, Trash2, Pencil, History, X,
} from 'lucide-react';
import { aiService } from '../services/ai';
import { useLang } from '../context/LanguageContext';

function MessageBubble({ msg }) {
  const { t } = useLang();
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 16,
      gap: 10,
      alignItems: 'flex-start',
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #a855f7, #ec4899)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Cpu size={16} color="white" />
        </div>
      )}

      <div style={{
        maxWidth: '75%',
        background: isUser
          ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
          : 'var(--bg-surface)',
        color: isUser ? 'white' : 'var(--text-primary)',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        padding: '12px 16px',
        border: isUser ? 'none' : '1px solid var(--border-subtle)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        lineHeight: 1.6,
        fontSize: 14,
      }}>
        {/* Agent badge */}
        {!isUser && msg.agent && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '2px 9px', borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(236,72,153,0.1))',
            border: '1px solid rgba(168,85,247,0.25)',
            marginBottom: 8, fontSize: 10.5, fontWeight: 700, color: '#a855f7',
          }}>
            <Cpu size={9} /> {msg.agent}
          </div>
        )}

        {/* Answer text */}
        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>

        {/* Sources */}
        {!isUser && msg.sources?.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
              📎 {t('ai.sources')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {msg.sources.map((s, i) => (
                <div key={`${s.kind || 'src'}-${s.id}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {s.source_name && (
                    <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 6, background: 'var(--bg-surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)', flexShrink: 0 }}>
                      {s.source_name}
                    </span>
                  )}
                  {/* Trang chi tiết TRONG APP (backend trả internal_path) — ưu tiên hơn link ngoài */}
                  {s.internal_path ? (
                    <Link
                      to={s.internal_path}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--brand-600)', textDecoration: 'none', fontWeight: 600, minWidth: 0, flex: 1 }}
                    >
                      <FileSearch size={10} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                    </Link>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                      {s.title}
                    </span>
                  )}
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t('ai.sourceOriginal')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600, flexShrink: 0 }}
                    >
                      {t('ai.sourceOriginal')} <ExternalLink size={9} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {!isUser && msg.isError && (
          <div style={{ marginTop: 6, fontSize: 12, color: '#f59e0b', fontWeight: 500 }}>
            ⚠️ {msg.content}
          </div>
        )}
      </div>

      {isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <User size={16} color="white" />
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
      width: 250, flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      borderRadius: 16, overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <div style={{
          fontSize: 12, fontWeight: 800, color: 'var(--text-primary)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <History size={14} /> {t('ai.history')}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            title={t('common.close') || 'Đóng'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div style={{ padding: 10 }}>
        <button
          className="btn"
          onClick={onNew}
          id="btn-ai-new-chat"
          style={{
            width: '100%', gap: 6, fontSize: 12, fontWeight: 700,
            border: '1px dashed #a855f7', color: '#a855f7', background: 'transparent',
          }}
        >
          <MessageSquarePlus size={14} /> {t('ai.newChat')}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
        {items.length === 0 && (
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', padding: '18px 8px', lineHeight: 1.6 }}>
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
                padding: '8px 10px', borderRadius: 10, marginBottom: 4, cursor: 'pointer',
                background: active ? 'rgba(168,85,247,0.10)' : 'transparent',
                border: `1px solid ${active ? 'rgba(168,85,247,0.35)' : 'transparent'}`,
                display: 'flex', alignItems: 'flex-start', gap: 6,
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-surface-2)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: 'var(--text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {c.title}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  {c.message_count} {t('ai.messagesCount')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onRename(c); }}
                  title={t('ai.renameChat')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(c); }}
                  title={t('ai.deleteChat')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: 10, borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5 }}>
          🔒 {t('ai.historyHint')}
        </div>
        {items.length > 0 && (
          <button
            onClick={onClearAll}
            style={{
              width: '100%', fontSize: 11, fontWeight: 700, padding: '6px 10px',
              borderRadius: 8, cursor: 'pointer',
              background: 'transparent', border: '1px solid var(--border)', color: '#ef4444',
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
    id: 0, role: 'assistant',
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
  const [showHistory, setShowHistory] = useState(() => window.innerWidth >= 1000);
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
    t('ai.suggestion1'),
    t('ai.suggestion2'),
    t('ai.suggestion3'),
    t('ai.suggestion4'),
  ];

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await aiService.conversations());
    } catch {
      setConversations([]); // lịch sử lỗi/không có quyền → chat vẫn dùng được bình thường
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
  }, [messages]);

  const openConversation = async (id) => {
    if (loading) return;
    try {
      const detail = await aiService.conversation(id);
      setActiveId(detail.id);
      setMessages(detail.messages.map((m) => ({
        id: m.id, role: m.role, content: m.content, agent: m.agent, sources: m.sources || [],
      })));
    } catch {
      alert(t('ai.loadFailed'));
      loadConversations();
    }
  };

  const startNewChat = () => {
    setActiveId(null);
    setMessages([greeting()]);
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
    await aiService.deleteConversation(conv.id);
    if (conv.id === activeId) startNewChat();
    loadConversations();
  };

  const clearAll = async () => {
    if (!window.confirm(t('ai.confirmClearAll'))) return;
    await aiService.clearConversations();
    startNewChat();
    loadConversations();
  };

  const sendMessage = async (question) => {
    const q = (question || input).trim();
    if (!q || loading) return;

    const userMsg = { id: Date.now(), role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const ans = await aiService.ask(q, activeId);
      if (ans.conversation_id) {
        setActiveId(ans.conversation_id);
        loadConversations();
      }
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: ans.answer,
        agent: ans.agent,
        sources: ans.sources || [],
      }]);
    } catch (err) {
      const isUnavailable = err.response?.status === 503;
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: isUnavailable
          ? (t('ai.notConfigured') || 'Trợ lý AI chưa được bật (chưa cấu hình API Key trên server).')
          : (err.response?.data?.detail || t('ai.errorMsg')),
        isError: true,
        agent: null,
        sources: [],
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
      {/* Header */}
      <div style={{ marginBottom: 16, flexShrink: 0, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(168,85,247,0.4)',
            }}>
              <Bot size={20} color="white" />
            </div>
            {t('ai.title')}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {t('ai.subtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            className="btn"
            onClick={startNewChat}
            id="btn-ai-new-chat-top"
            style={{ gap: 6, fontSize: 12, fontWeight: 700 }}
          >
            <MessageSquarePlus size={14} /> {t('ai.newChat')}
          </button>
          <button
            className="btn"
            onClick={() => setShowHistory((v) => !v)}
            id="btn-ai-toggle-history"
            title={t('ai.history')}
            style={{ gap: 6, fontSize: 12, fontWeight: 700 }}
          >
            <History size={14} /> {t('ai.history')}
          </button>
        </div>
      </div>

      {!isConfigured && (
        <div style={{
          padding: '12px 16px', borderRadius: 12, marginBottom: 16,
          background: '#fffbebf0', border: '1.5px solid #fde68a', color: '#b45309',
          fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          ⚠️ {t('ai.notConfigured') || 'Trợ lý AI chưa được cấu hình API Key trên máy chủ Server.'}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', gap: 14, minHeight: 0 }}>
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

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Chat area */}
          <div style={{
            flex: 1, overflowY: 'auto',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px 16px 0 0',
            padding: 20,
          }}>
            {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}

            {loading && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Cpu size={16} color="white" />
                </div>
                <div style={{
                  padding: '10px 16px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '18px 18px 18px 4px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Loader2 size={14} style={{ color: '#a855f7', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('ai.thinking')}</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggested questions */}
          {messages.length <= 1 && (
            <div style={{
              background: 'var(--bg-surface-2)',
              borderLeft: '1px solid var(--border-subtle)',
              borderRight: '1px solid var(--border-subtle)',
              padding: '10px 16px',
              display: 'flex', flexWrap: 'wrap', gap: 6,
            }}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  style={{
                    fontSize: 11, padding: '5px 12px', borderRadius: 20,
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.color = '#a855f7'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderTop: 'none',
            borderRadius: '0 0 16px 16px',
            padding: '12px 16px',
            display: 'flex', gap: 10, alignItems: 'flex-end',
            flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              id="input-ai-question"
              className="form-input"
              style={{
                flex: 1, resize: 'none', minHeight: 44, maxHeight: 120,
                fontSize: 14, lineHeight: 1.5,
                overflowY: 'auto',
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
              style={{ gap: 6, flexShrink: 0, minWidth: 90 }}
            >
              {loading
                ? <Loader2 size={14} style={{ animation: 'spin 0.6s linear infinite' }} />
                : <Send size={14} />}
              {t('ai.sendBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
