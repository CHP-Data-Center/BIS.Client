// src/context/CrawlContext.jsx
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { adminService } from '../services/admin';
import { useAuth } from './AuthContext';
import { Zap, AlertCircle, X } from 'lucide-react';

const CrawlContext = createContext(null);

export function CrawlProvider({ children }) {
  const [isCrawling, setIsCrawling] = useState(false);
  const [toast, setToast] = useState(null); // { id, type: 'success' | 'error', message }
  const isCrawlingRef = useRef(isCrawling);
  const { user, isAdmin } = useAuth() || {};

  useEffect(() => {
    isCrawlingRef.current = isCrawling;
  }, [isCrawling]);

  const showToast = (type, message) => {
    const id = Date.now();
    setToast({ id, type, message });
    setTimeout(() => {
      setToast(current => (current?.id === id ? null : current));
    }, 6000);
  };

  // Poll backend to sync crawl status (chỉ cho Admin & khi tab đang active)
  const checkStatus = async () => {
    if (!user || !isAdmin || document.hidden) return false;

    try {
      const res = await adminService.getCrawlStatus();
      const active = Boolean(res?.is_crawling);

      if (active && !isCrawlingRef.current) {
        setIsCrawling(true);
      } else if (!active && isCrawlingRef.current) {
        setIsCrawling(false);
        showToast('success', '⚡ Tiến trình crawl dữ liệu nền đã hoàn tất! Dữ liệu mới đã được cập nhật.');
        window.dispatchEvent(new CustomEvent('bis:data_updated'));
      }
      return active;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!user || !isAdmin) return;

    checkStatus();

    const timer = setInterval(() => {
      if (!document.hidden) {
        checkStatus();
      }
    }, isCrawling ? 3000 : 15000);

    const handleVisibility = () => {
      if (!document.hidden) checkStatus();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isCrawling, user, isAdmin]);

  const triggerCrawl = async () => {
    if (isCrawling) {
      showToast('error', '⚡ Hệ thống đang tiến hành crawl dữ liệu. Vui lòng chờ tiến trình hoàn tất!');
      return { status: 'already_running' };
    }

    try {
      const res = await adminService.crawlNow();
      if (res?.status === 'already_running') {
        showToast('error', '⚡ Hệ thống đang tiến hành crawl dữ liệu. Vui lòng chờ tiến trình hoàn tất!');
        setIsCrawling(true);
      } else {
        setIsCrawling(true);
        showToast('success', '⚡ Đã kích hoạt tiến trình crawl dữ liệu nền! Đang tự động quét Báo chí, ODA & Mua sắm công...');
      }
      return res;
    } catch (e) {
      const errorMsg = e.response?.data?.detail || 'Lỗi khi kích hoạt crawl.';
      showToast('error', `❌ ${errorMsg}`);
      setIsCrawling(false);
      throw e;
    }
  };

  return (
    <CrawlContext.Provider value={{ isCrawling, triggerCrawl, showToast }}>
      {children}

      {/* Top Dropdown Toast Notification */}
      {toast && (
        <div
          className="global-crawl-toast"
          style={{
            position: 'fixed',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 20px',
            borderRadius: 14,
            background: toast.type === 'success'
              ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.98) 100%)'
              : 'linear-gradient(135deg, rgba(30, 10, 10, 0.96) 0%, rgba(45, 15, 15, 0.98) 100%)',
            color: '#ffffff',
            border: toast.type === 'success'
              ? '1px solid rgba(129, 140, 248, 0.5)'
              : '1px solid rgba(239, 68, 68, 0.5)',
            boxShadow: toast.type === 'success'
              ? '0 12px 36px rgba(99, 102, 241, 0.4), 0 4px 12px rgba(0,0,0,0.5)'
              : '0 12px 36px rgba(239, 68, 68, 0.4), 0 4px 12px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(16px)',
            maxWidth: '92vw',
            width: 540,
            animation: 'toastSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.45,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: toast.type === 'success'
                ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
                : 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            {toast.type === 'success' ? (
              <Zap size={18} style={{ color: '#fef08a' }} />
            ) : (
              <AlertCircle size={18} style={{ color: '#ffffff' }} />
            )}
          </div>

          <div style={{ flex: 1, color: '#f8fafc' }}>
            {toast.message}
          </div>

          <button
            onClick={() => setToast(null)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </CrawlContext.Provider>
  );
}

export function useCrawl() {
  const context = useContext(CrawlContext);
  if (!context) {
    throw new Error('useCrawl must be used within a CrawlProvider');
  }
  return context;
}
