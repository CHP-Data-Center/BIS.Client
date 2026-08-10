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

// Real SVG 24K Gold Crown Icon Component with unique gradient ID per instance
export function LuxuryCrownSvg({ size = 28 }) {
  const gradientId = useRef(`goldCrownGrad_${Math.random().toString(36).substring(2, 9)}`).current;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: 'drop-shadow(0 3px 10px rgba(234, 179, 8, 0.9))',
        flexShrink: 0,
      }}
    >
      <path
        d="M2 19H22V21H2V19ZM2 5L7 10L12 3L17 10L22 5V17H2V5ZM4.5 15H19.5V11.25L17 13.75L12 6.75L7 13.75L4.5 11.25V15Z"
        fill={`url(#${gradientId})`}
      />
      <circle cx="2" cy="5" r="1.5" fill="#fef08a" />
      <circle cx="12" cy="3" r="1.5" fill="#fef08a" />
      <circle cx="22" cy="5" r="1.5" fill="#fef08a" />
      <defs>
        <linearGradient id={gradientId} x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef08a" />
          <stop offset="0.4" stopColor="#eab308" />
          <stop offset="0.8" stopColor="#ca8a04" />
          <stop offset="1" stopColor="#854d0e" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Real SVG 24K Gold Money Bag Icon Component with unique gradient ID per instance
export function LuxuryMoneyBagSvg({ size = 28 }) {
  const gradientId = useRef(`goldBagGrad_${Math.random().toString(36).substring(2, 9)}`).current;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: 'drop-shadow(0 3px 10px rgba(234, 179, 8, 0.9))',
        flexShrink: 0,
      }}
    >
      <path
        d="M15 3C15 2.45 14.55 2 14 2H10C9.45 2 9 2.45 9 3V5H15V3ZM18.5 7H5.5C4.67 7 4 7.67 4 8.5C4 9.07 4.32 9.57 4.8 9.82L3.2 19.35C3.08 20.08 3.58 20.76 4.3 20.91C4.37 20.92 4.43 20.93 4.5 20.93H19.5C20.33 20.93 21 20.26 21 19.43C21 19.4 21 19.37 20.99 19.35L19.2 9.82C19.68 9.57 20 9.07 20 8.5C20 7.67 19.33 7 18.5 7ZM12 17C10.34 17 9 15.66 9 14C9 12.34 10.34 11 12 11C13.66 11 15 12.34 15 14C15 15.66 13.66 17 12 17Z"
        fill={`url(#${gradientId})`}
      />
      <path d="M12 12.5V15.5M10.8 13.2H13.2" stroke="#422006" strokeWidth="1.2" strokeLinecap="round" />
      <defs>
        <linearGradient id={gradientId} x1="3" y1="2" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef08a" />
          <stop offset="0.35" stopColor="#f59e0b" />
          <stop offset="0.75" stopColor="#d97706" />
          <stop offset="1" stopColor="#78350f" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Helper function to calculate deterministic size/opacity tiers with probabilistic distribution
function getParticleSpec(i) {
  // Probabilities:
  // ~25% CỰC TO (HUGE: 56px - 76px)
  // ~35% TO VỪA (LARGE: 34px - 48px)
  // ~40% NHỎ (SMALL: 16px - 24px)
  const seed = (Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1;
  const rand = Math.abs(seed);

  if (rand < 0.25) {
    // HUGE (Cực To!) ~25%
    const norm = rand / 0.25;
    const size = 56 + Math.floor(norm * 20); // 56px - 76px !!
    const opacity = 0.95;
    return { size, opacity, tier: 'huge' };
  } else if (rand < 0.60) {
    // LARGE (To vừa) ~35%
    const norm = (rand - 0.25) / 0.35;
    const size = 34 + Math.floor(norm * 14); // 34px - 48px
    const opacity = 0.82;
    return { size, opacity, tier: 'large' };
  } else {
    // SMALL (Nhỏ) ~40%
    const norm = (rand - 0.60) / 0.40;
    const size = 16 + Math.floor(norm * 9); // 16px - 25px
    const opacity = 0.50;
    return { size, opacity, tier: 'small' };
  }
}

const TRAJECTORIES = [
  { rotStart: '0deg', rotEnd: '0deg', driftX: '0px' },        // Rơi thẳng xuôi (0°)
  { rotStart: '35deg', rotEnd: '50deg', driftX: '25px' },     // Rơi nghiêng xuôi (35°)
  { rotStart: '170deg', rotEnd: '190deg', driftX: '-20px' },  // Rơi ngược (180°)
  { rotStart: '-45deg', rotEnd: '-55deg', driftX: '-35px' },  // Rơi nghiêng trái (-45°)
  { rotStart: '0deg', rotEnd: '360deg', driftX: '30px' },     // Rơi xoay tròn 360°
  { rotStart: '-140deg', rotEnd: '-120deg', driftX: '18px' }, // Rơi chéo ngược (-135°)
  { rotStart: '85deg', rotEnd: '95deg', driftX: '-40px' },    // Rơi ngang (90°)
  { rotStart: '-18deg', rotEnd: '-10deg', driftX: '0px' },    // Rơi hơi nghiêng (-15°)
];

// Ultra-optimized, GPU-accelerated Theme Rain (Sits BEHIND cards & content at zIndex: 0)
function BackgroundRain({ theme }) {
  const items = useRef(
    Array.from({ length: 42 }).map((_, i) => {
      const spec = getParticleSpec(i);
      const left = `${(i * 2.3 + (i % 7) * 2.1) % 96}%`;
      const duration = spec.tier === 'huge'
        ? 5.0 + (i % 5) * 0.7
        : spec.tier === 'large'
        ? 6.5 + (i % 6) * 0.9
        : 8.5 + (i % 7) * 1.2;

      // Negative delay ensures background particles are ALREADY mid-fall on F5 refresh (0ms freeze)
      const delay = -((i * 0.85) % duration).toFixed(2);

      const traj = TRAJECTORIES[i % TRAJECTORIES.length];

      return {
        id: i,
        ...spec,
        left,
        delay,
        duration,
        ...traj,
        goldSymbol: i % 4 === 0 ? 'crown_svg' : i % 4 === 1 ? 'bag_svg' : i % 4 === 2 ? 'crown_svg' : '🪙',
        sapphireSymbol: i % 2 === 0 ? 'diamond_svg' : 'star_svg',
        animeSymbol:
          i % 10 === 0
            ? '🌸'
            : i % 10 === 1
            ? '(˶>⩊<˶)'
            : i % 10 === 2
            ? '💖'
            : i % 10 === 3
            ? 'ദ്ദി ˉ͈̀꒳ˉ͈́ )✧'
            : i % 10 === 4
            ? '🎀'
            : i % 10 === 5
            ? '( • ̀ω•́ )✧'
            : i % 10 === 6
            ? '(≡> ᴗ <≡)'
            : i % 10 === 7
            ? '「キラキラ」'
            : i % 10 === 8
            ? '(≧◡≦)'
            : '✨',
      };
    })
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
      {items.map((c) => {
        const glowFilter =
          c.tier === 'huge'
            ? theme === 'luxury'
              ? 'drop-shadow(0 8px 24px rgba(234, 179, 8, 0.95)) drop-shadow(0 2px 10px rgba(255, 215, 0, 0.85))'
              : theme === 'anime'
              ? 'drop-shadow(0 8px 24px rgba(244, 114, 182, 0.95)) drop-shadow(0 2px 10px rgba(236, 72, 153, 0.85))'
              : 'drop-shadow(0 8px 24px rgba(56, 189, 248, 0.95)) drop-shadow(0 2px 10px rgba(29, 78, 216, 0.85))'
            : c.tier === 'large'
            ? theme === 'luxury'
              ? 'drop-shadow(0 4px 14px rgba(234, 179, 8, 0.8))'
              : theme === 'anime'
              ? 'drop-shadow(0 4px 14px rgba(244, 114, 182, 0.8))'
              : 'drop-shadow(0 4px 14px rgba(56, 189, 248, 0.8))'
            : undefined;

        const renderSymbol = (symbol) => {
          if (symbol === 'crown_svg') {
            return <LuxuryCrownSvg size={c.size} />;
          }
          if (symbol === 'bag_svg') {
            return <LuxuryMoneyBagSvg size={c.size} />;
          }
          if (symbol === 'diamond_svg') {
            return <SapphireDiamondSvg size={c.size + 4} />;
          }
          if (symbol === 'star_svg') {
            return <SapphireStarSvg size={c.size + 2} />;
          }
          if (typeof symbol === 'string' && (symbol.includes('(') || symbol.includes('「') || symbol.includes('✧') || symbol.length > 2)) {
            return (
              <span style={{ fontSize: Math.min(c.size, 20), fontWeight: 800, color: '#f472b6', whiteSpace: 'nowrap', textShadow: '0 0 10px rgba(244, 114, 182, 0.9)' }}>
                {symbol}
              </span>
            );
          }
          return <span style={{ fontSize: c.size, lineHeight: 1 }}>{symbol}</span>;
        };

        return (
          <div
            key={c.id}
            style={{
              position: 'absolute',
              top: '-120px',
              left: c.left,
              '--particle-opacity': c.opacity,
              '--rot-start': c.rotStart,
              '--rot-end': c.rotEnd,
              '--drift-x': c.driftX,
              animation: `goldCoinFallGpu ${c.duration}s linear infinite both`,
              animationDelay: `${c.delay}s`,
              willChange: 'transform',
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: glowFilter,
            }}
          >
            {theme === 'luxury'
              ? renderSymbol(c.goldSymbol)
              : theme === 'anime'
              ? renderSymbol(c.animeSymbol)
              : renderSymbol(c.sapphireSymbol)}
          </div>
        );
      })}
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

  // Mouse trail emitting particle effects
  useEffect(() => {
    if (theme !== 'luxury' && theme !== 'sapphire' && theme !== 'anime') return;

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
          isDiamond: Math.random() > 0.45,
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

  if (theme !== 'luxury' && theme !== 'sapphire' && theme !== 'anime') return null;

  const ambientGlowColor =
    theme === 'luxury'
      ? 'rgba(212, 175, 55, 0.08)'
      : theme === 'anime'
      ? 'rgba(244, 114, 182, 0.12)'
      : 'rgba(56, 189, 248, 0.08)';

  return (
    <>
      {/* Falling Coins, Sapphire & Sakura Rain (BEHIND content at zIndex: 0) */}
      <BackgroundRain theme={theme} />

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
            {theme === 'luxury' ? (
              <span style={{ fontSize: p.size }}>✨</span>
            ) : theme === 'anime' ? (
              <span style={{ fontSize: p.size, fontWeight: 800, color: '#f472b6', textShadow: '0 0 8px rgba(244, 114, 182, 0.7)' }}>
                {p.isDiamond ? (p.size > 16 ? '(≧◡≦)' : '🌸') : (p.size > 16 ? '「キラキラ」' : '✨')}
              </span>
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
