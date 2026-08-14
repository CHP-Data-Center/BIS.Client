// src/components/ScrollToTop.jsx
import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { tUI } from '../locales';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollUp = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  if (!visible) return null;

  return (
    <button
      onClick={scrollUp}
      id="btn-scroll-top"
      title={tUI('ui.len-dau-trang')}
      style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--brand-600), var(--brand-500))',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(37,99,235,0.45)',
        cursor: 'pointer',
        border: 'none',
        zIndex: 999,
        animation: 'bounceIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(37,99,235,0.6)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1) translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.45)';
      }}
    >
      <ArrowUp size={18} strokeWidth={2.5} />
    </button>
  );
}
