// src/components/common/ThemeFxOverlay.jsx
import { useEffect, useState, useRef } from 'react';

// Real SVG Faceted Sapphire Diamond Icon Component with unique gradient ID per instance
export function SapphireDiamondSvg({ size = 18 }) {
  const gradientId = useRef(`sapphireGrad_${Math.random().toString(36).substring(2, 9)}`).current;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: 'drop-shadow(0 2px 8px rgba(56, 189, 248, 0.9))',
        flexShrink: 0,
      }}
    >
      <path d="M12 2L3 8L12 22L21 8L12 2Z" fill={`url(#${gradientId})`} stroke="#7dd3fc" strokeWidth="1" />
      <path d="M3 8H21" stroke="#ffffff" strokeWidth="1" />
      <path d="M7 8L12 2L17 8L12 22L7 8Z" fill="rgba(255,255,255,0.4)" />
      <path d="M3 8L7 8L12 22" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
      <path d="M21 8L17 8L12 22" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
      <defs>
        <linearGradient id={gradientId} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="0.5" stopColor="#1d4ed8" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Crisp Glowing Sapphire Crystal Star SVG Component with unique gradient ID per instance
export function SapphireStarSvg({ size = 15 }) {
  const gradientId = useRef(`sapphireStarGrad_${Math.random().toString(36).substring(2, 9)}`).current;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.9))',
        flexShrink: 0,
      }}
    >
      <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill={`url(#${gradientId})`} />
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f0f9ff" />
          <stop offset="0.5" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Ultra-optimized, GPU-accelerated Theme Rain (Sits BEHIND cards & content at zIndex: 0)
function BackgroundRain({ isLuxury }) {
  const items = useRef(
    Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      goldSymbol: i % 4 === 0 ? '🪙' : i % 5 === 0 ? '💰' : i % 3 === 0 ? '⭐' : '✨',
      isDiamond: i % 2 === 0, // 50% diamonds, 50% stars!
      left: `${(i * 2.8 + (i % 7) * 2.5) % 97}%`,
      size: 14 + (i % 5) * 3,
      duration: 5.5 + (i % 6) * 1.2,
      delay: (i % 8) * 0.65,
      opacity: 0.45 + (i % 4) * 0.12,
    }))
  ).current;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0, // MUST sit BEHIND all cards, header, and sidebar!
        overflow: 'hidden',
      }}
    >
      {items.map((c) => (
        <div
          key={c.id}
          style={{
            position: 'absolute',
            top: '-35px',
            left: c.left,
            fontSize: c.size,
            opacity: c.opacity,
            animation: `goldCoinFallGpu ${c.duration}s linear infinite`,
            animationDelay: `${c.delay}s`,
            willChange: 'transform',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isLuxury ? (
            c.goldSymbol
          ) : c.isDiamond ? (
            <SapphireDiamondSvg size={c.size + 4} />
          ) : (
            <SapphireStarSvg size={c.size + 2} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ThemeFxOverlay() {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-ui-theme') || 'basic');
  const [pos, setPos] = useState({ x: -500, y: -500 });
  const [trail, setTrail] = useState([]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute('data-ui-theme') || 'basic';
      setTheme(current);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-ui-theme'],
    });

    return () => observer.disconnect();
  }, []);

  // Mouse trail emitting both Diamonds & Stars for Sapphire theme!
  useEffect(() => {
    if (theme !== 'luxury' && theme !== 'sapphire') return;

    let lastTime = 0;
    const handleMouseMove = (e) => {
      const now = Date.now();
      if (now - lastTime < 50) return;
      lastTime = now;

      const x = e.clientX;
      const y = e.clientY;
      setPos({ x, y });

      setTrail((prev) => [
        ...prev.slice(-7), // Trail of up to 7 particles
        {
          id: `${now}-${Math.random()}`,
          x,
          y,
          size: 14 + Math.random() * 5,
          isDiamond: Math.random() > 0.45, // Both Diamonds & Stars emit on mouse move!
        },
      ]);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [theme]);

  // Clean up trail
  useEffect(() => {
    if (trail.length === 0) return;
    const timer = setTimeout(() => {
      setTrail((prev) => prev.slice(1));
    }, 320);
    return () => clearTimeout(timer);
  }, [trail]);

  if (theme !== 'luxury' && theme !== 'sapphire') return null;

  const isLuxury = theme === 'luxury';
  const ambientGlowColor = isLuxury ? 'rgba(212, 175, 55, 0.08)' : 'rgba(56, 189, 248, 0.08)';

  return (
    <>
      {/* Falling Coins & Sapphire Rain (BEHIND content at zIndex: 0) */}
      <BackgroundRain isLuxury={isLuxury} />

      {/* Background Ambient Mouse Glow (BEHIND content at zIndex: 0) */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: `radial-gradient(280px circle at ${pos.x}px ${pos.y}px, ${ambientGlowColor} 0%, transparent 80%)`,
          willChange: 'background',
        }}
      />

      {/* Mouse Sparkles & Diamonds Trail */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 99999,
          overflow: 'hidden',
        }}
      >
        {trail.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.x - 7,
              top: p.y - 7,
              opacity: 0.85,
              animation: 'mouseSparkleFade 0.4s ease-out forwards',
              willChange: 'transform, opacity',
              userSelect: 'none',
            }}
          >
            {isLuxury ? (
              <span style={{ fontSize: p.size }}>✨</span>
            ) : p.isDiamond ? (
              <SapphireDiamondSvg size={p.size + 2} />
            ) : (
              <SapphireStarSvg size={p.size} />
            )}
          </div>
        ))}
      </div>
    </>
  );
}
