// src/pages/AiPage.jsx
import { useState, useRef, useEffect } from 'react';
import { Send, Cpu, Loader2, ExternalLink, Bot, User } from 'lucide-react';
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {msg.sources.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 11, color: 'var(--brand-600)', textDecoration: 'none', fontWeight: 600,
                  }}
                >
                  <ExternalLink size={10} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.title}
                  </span>
                </a>
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

export default function AiPage() {
  const { lang, t } = useLang();
  const [messages, setMessages] = useState([
    {
      id: 0, role: 'assistant',
      content: t('ai.greeting'),
      agent: 'BIS AI Assistant',
      sources: [],
    }
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Sync greeting message when system language changes
  useEffect(() => {
    setMessages((prev) => {
      if (!prev || prev.length === 0) {
        return [{
          id: 0,
          role: 'assistant',
          content: t('ai.greeting'),
          agent: 'BIS AI Assistant',
          sources: [],
        }];
      }
      return prev.map(m => m.id === 0 ? { ...m, content: t('ai.greeting') } : m);
    });
  }, [lang, t]);

  const SUGGESTED_QUESTIONS = [
    t('ai.suggestion1'),
    t('ai.suggestion2'),
    t('ai.suggestion3'),
    t('ai.suggestion4'),
  ];

  useEffect(() => {
    aiService.status()
      .then(res => setIsConfigured(res?.configured ?? true))
      .catch(() => setIsConfigured(true));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const sendMessage = async (question) => {
    const q = (question || input).trim();
    if (!q || loading) return;

    const userMsg = { id: Date.now(), role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const ans = await aiService.ask(q);
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
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
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

      {!isConfigured && (
        <div style={{
          padding: '12px 16px', borderRadius: 12, marginBottom: 16,
          background: '#fffbebf0', border: '1.5px solid #fde68a', color: '#b45309',
          fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          ⚠️ {t('ai.notConfigured') || 'Trợ lý AI chưa được cấu hình API Key trên máy chủ Server.'}
        </div>
      )}

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
  );
}
