// src/components/common/ThemePageLoader.jsx
import { useState, useEffect, useRef } from 'react';
import { useLang } from '../../context/LanguageContext';
import { LuxuryCrownSvg, LuxuryMoneyBagSvg, SapphireDiamondSvg, SapphireStarSvg } from './ThemeFxOverlay';

const RAIN_TRAJECTORIES = [
  { rotStart: '0deg', rotEnd: '0deg', driftX: '0px' },
  { rotStart: '35deg', rotEnd: '50deg', driftX: '18px' },
  { rotStart: '170deg', rotEnd: '190deg', driftX: '-15px' },
  { rotStart: '-45deg', rotEnd: '-55deg', driftX: '-22px' },
  { rotStart: '0deg', rotEnd: '360deg', driftX: '20px' },
  { rotStart: '-140deg', rotEnd: '-120deg', driftX: '12px' },
  { rotStart: '85deg', rotEnd: '95deg', driftX: '-28px' },
  { rotStart: '-18deg', rotEnd: '-10deg', driftX: '0px' },
];

function getLoaderParticleSpec(i) {
  const seed = (Math.sin(i * 17.1234 + 43.567) * 43758.5453) % 1;
  const rand = Math.abs(seed);

  if (rand < 0.25) {
    const norm = rand / 0.25;
    const size = 32 + Math.floor(norm * 14);
    const opacity = 0.9;
    return { size, opacity, tier: 'huge' };
  } else if (rand < 0.60) {
    const norm = (rand - 0.25) / 0.35;
    const size = 20 + Math.floor(norm * 10);
    const opacity = 0.8;
    return { size, opacity, tier: 'large' };
  } else {
    const norm = (rand - 0.60) / 0.40;
    const size = 11 + Math.floor(norm * 6);
    const opacity = 0.55;
    return { size, opacity, tier: 'small' };
  }
}

function LoaderThemeRain({ theme }) {
  const items = useRef(
    Array.from({ length: 42 }).map((_, i) => {
      const spec = getLoaderParticleSpec(i);
      const left = `${(i * 2.3 + (i % 7) * 1.7) % 97}%`;
      const durVal = 4.2 + (i % 8) * 0.75;
      const duration = `${durVal.toFixed(2)}s`;
      const delay = `-${((i * 0.4) % durVal).toFixed(2)}s`;
      const traj = RAIN_TRAJECTORIES[i % RAIN_TRAJECTORIES.length];

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
          i % 9 === 0 ? '🌸'
          : i % 9 === 1 ? '(˶>⩊<˶)'
          : i % 9 === 2 ? '💖'
          : i % 9 === 3 ? 'ദ്ദി ˉ͈̀꒳ˉ͈́ )✧'
          : i % 9 === 4 ? '🎀'
          : i % 9 === 5 ? '( • ̀ω•́ )✧'
          : i % 9 === 6 ? '(≡> ᴗ <≡)'
          : i % 9 === 7 ? '「キラキラ」'
          : '(≧◡≦)',
      };
    })
  ).current;

  if (theme !== 'luxury' && theme !== 'sapphire' && theme !== 'anime') return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <style>{`
        @keyframes loaderParticleFallFull {
          0% {
            transform: translateY(-50px) rotate(var(--rot-start, 0deg));
            opacity: 0;
          }
          12% {
            opacity: var(--particle-opacity, 0.85);
          }
          88% {
            opacity: var(--particle-opacity, 0.85);
          }
          100% {
            transform: translateY(calc(100vh + 60px)) translateX(var(--drift-x, 0px)) rotate(var(--rot-end, 0deg));
            opacity: 0;
          }
        }
      `}</style>
      {items.map((it) => {
        const glowFilter =
          it.tier === 'huge'
            ? theme === 'luxury'
              ? 'drop-shadow(0 6px 18px rgba(234, 179, 8, 0.95))'
              : theme === 'anime'
              ? 'drop-shadow(0 6px 18px rgba(244, 114, 182, 0.95))'
              : 'drop-shadow(0 6px 18px rgba(56, 189, 248, 0.95))'
            : undefined;

        const renderSymbol = () => {
          if (theme === 'luxury') {
            if (it.goldSymbol === 'crown_svg') return <LuxuryCrownSvg size={it.size} />;
            if (it.goldSymbol === 'bag_svg') return <LuxuryMoneyBagSvg size={it.size} />;
            return <span style={{ fontSize: it.size, lineHeight: 1 }}>{it.goldSymbol}</span>;
          }
          if (theme === 'anime') {
            if (typeof it.animeSymbol === 'string' && (it.animeSymbol.includes('(') || it.animeSymbol.includes('「') || it.animeSymbol.includes('✧') || it.animeSymbol.length > 2)) {
              return (
                <span style={{ fontSize: Math.min(it.size, 17), fontWeight: 800, color: '#f472b6', whiteSpace: 'nowrap', textShadow: '0 0 8px rgba(244, 114, 182, 0.8)' }}>
                  {it.animeSymbol}
                </span>
              );
            }
            return <span style={{ fontSize: it.size, lineHeight: 1, color: '#f472b6' }}>{it.animeSymbol}</span>;
          }
          if (it.sapphireSymbol === 'diamond_svg') return <SapphireDiamondSvg size={it.size + 4} />;
          return <SapphireStarSvg size={it.size + 2} />;
        };

        return (
          <div
            key={it.id}
            style={{
              position: 'fixed',
              top: '-50px',
              left: it.left,
              '--particle-opacity': it.opacity,
              '--rot-start': it.rotStart,
              '--rot-end': it.rotEnd,
              '--drift-x': it.driftX,
              animation: `loaderParticleFallFull ${it.duration} linear infinite both`,
              animationDelay: it.delay,
              willChange: 'transform',
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: glowFilter,
            }}
          >
            {renderSymbol()}
          </div>
        );
      })}
    </div>
  );
}

export default function ThemePageLoader({ message, minHeight = '65vh' }) {
  const { lang } = useLang();
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-ui-theme') || 'basic');

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

  // 1. LUXURY THEME LOADER (Bloomberg Luxury Gold & Obsidian Glass)
  if (theme === 'luxury') {
    const titleText =
      lang === 'ja'
        ? '市場と金融データを読み込み中...'
        : lang === 'en'
        ? 'Loading Financial & Market Intelligence...'
        : 'Đang tải dữ liệu thị trường & tài chính...';

    const subText =
      lang === 'ja'
        ? 'BIS Bloomberg VIP ターミナルを初期化中...'
        : lang === 'en'
        ? 'Initializing BIS Bloomberg VIP Terminal...'
        : 'Đang khởi tạo BIS Bloomberg VIP Terminal...';

    return (
      <div
        style={{
          minHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Particles falling rain effect around the card */}
        <LoaderThemeRain theme="luxury" />

        <div
          style={{
            background: 'linear-gradient(145deg, rgba(20, 16, 10, 0.94), rgba(12, 10, 6, 0.98))',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8), 0 0 35px rgba(234, 179, 8, 0.15)',
            borderRadius: 20,
            padding: '32px 44px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
            maxWidth: 420,
            textAlign: 'center',
            backdropFilter: 'blur(16px)',
            position: 'relative',
            zIndex: 2,
            overflow: 'hidden',
          }}
        >
          {/* Subtle top gold light beam */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '20%',
              right: '20%',
              height: 2,
              background: 'linear-gradient(90deg, transparent, #fef08a, #eab308, transparent)',
            }}
          />

          {/* Central Luxury Gold Orbit Animation */}
          <div style={{ position: 'relative', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '2px dashed rgba(234, 179, 8, 0.4)',
                animation: 'spin 12s linear infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 4,
                borderRadius: '50%',
                border: '2px solid transparent',
                borderTopColor: '#fef08a',
                borderRightColor: '#eab308',
                animation: 'spin 1.2s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite',
                boxShadow: '0 0 16px rgba(234, 179, 8, 0.5)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 12,
                borderRadius: '50%',
                border: '2px solid transparent',
                borderBottomColor: '#d97706',
                borderLeftColor: '#f59e0b',
                animation: 'spinReverse 0.9s linear infinite',
              }}
            />
            <LuxuryCrownSvg size={30} />
          </div>

          {/* Luxury Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 20,
              background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.15), rgba(217, 119, 6, 0.15))',
              border: '1px solid rgba(234, 179, 8, 0.4)',
              color: '#fef08a',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            ✨ BLOOMBERG LUXURY VIP
          </div>

          {/* Main Text */}
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #ffffff 30%, #fef08a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: 0.3,
                marginBottom: 4,
              }}
            >
              {message || titleText}
            </div>
            <div style={{ fontSize: 11.5, color: 'rgba(254, 240, 138, 0.7)', fontWeight: 500 }}>
              {subText}
            </div>
          </div>

          {/* Shimmer Progress Bar */}
          <div
            style={{
              width: '100%',
              height: 4,
              borderRadius: 4,
              background: 'rgba(234, 179, 8, 0.15)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '40%',
                background: 'linear-gradient(90deg, transparent, #fef08a, #eab308, transparent)',
                animation: 'luxuryShimmer 1.4s ease-in-out infinite',
                boxShadow: '0 0 10px rgba(234, 179, 8, 0.8)',
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // 2. CLASSIC RETRO THEME LOADER (Windows 98 OS Dialog Box)
  if (theme === 'classic') {
    const dialogTitle =
      lang === 'ja'
        ? 'データを読み込み中... - Windows 98'
        : lang === 'en'
        ? 'Loading Data... - Windows 98'
        : 'Đang tải dữ liệu... - Windows 98';

    const promptText =
      lang === 'ja'
        ? 'Windowsがデータを読み込んでいます。しばらくお待ちください...'
        : lang === 'en'
        ? 'Please wait while Windows is reading system data...'
        : 'Vui lòng đợi trong khi Windows nạp dữ liệu hệ thống...';

    return (
      <div
        style={{
          minHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '24px',
        }}
      >
        {/* Windows 98 3D Modal Window Box */}
        <div
          style={{
            background: '#c0c0c0',
            border: '2px solid',
            borderTopColor: '#ffffff',
            borderLeftColor: '#ffffff',
            borderRightColor: '#404040',
            borderBottomColor: '#404040',
            outline: '1px solid #000000',
            boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.35)',
            width: '100%',
            maxWidth: 380,
            fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
            userSelect: 'none',
          }}
        >
          {/* Active Title Bar */}
          <div
            style={{
              background: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)',
              color: '#ffffff',
              padding: '3px 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontWeight: 'bold',
              fontSize: 12,
              letterSpacing: 0.2,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13 }}>⌛</span>
              <span>{dialogTitle}</span>
            </div>
            {/* Title Bar Buttons */}
            <div style={{ display: 'flex', gap: 2 }}>
              <button
                tabIndex={-1}
                style={{
                  width: 16,
                  height: 14,
                  background: '#c0c0c0',
                  border: '1px solid',
                  borderTopColor: '#ffffff',
                  borderLeftColor: '#ffffff',
                  borderRightColor: '#404040',
                  borderBottomColor: '#404040',
                  fontSize: 9,
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  cursor: 'default',
                }}
              >
                _
              </button>
              <button
                tabIndex={-1}
                style={{
                  width: 16,
                  height: 14,
                  background: '#c0c0c0',
                  border: '1px solid',
                  borderTopColor: '#ffffff',
                  borderLeftColor: '#ffffff',
                  borderRightColor: '#404040',
                  borderBottomColor: '#404040',
                  fontSize: 9,
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  cursor: 'default',
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Dialog Body */}
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div
                style={{
                  fontSize: 32,
                  animation: 'retroHourglass 1.2s steps(4) infinite',
                  display: 'inline-block',
                }}
              >
                ⏳
              </div>
              <div style={{ fontSize: 12, color: '#000000', lineHeight: 1.4 }}>
                <strong>{message || promptText}</strong>
              </div>
            </div>

            {/* Classic Win98 Segmented Blue Progress Bar */}
            <div
              style={{
                height: 22,
                background: '#ffffff',
                border: '2px solid',
                borderTopColor: '#808080',
                borderLeftColor: '#808080',
                borderRightColor: '#ffffff',
                borderBottomColor: '#ffffff',
                padding: 2,
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  bottom: 2,
                  left: 0,
                  width: '50%',
                  background: 'repeating-linear-gradient(90deg, #000080, #000080 8px, #ffffff 8px, #ffffff 10px)',
                  animation: 'win98Progress 1.6s linear infinite',
                }}
              />
            </div>

            {/* Bottom Details Status Bar */}
            <div
              style={{
                border: '1px solid',
                borderTopColor: '#808080',
                borderLeftColor: '#808080',
                borderRightColor: '#ffffff',
                borderBottomColor: '#ffffff',
                padding: '2px 6px',
                fontSize: 11,
                color: '#404040',
                background: '#d4d0c8',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>BIS-CRAWLER-SERVICE.EXE</span>
              <span style={{ color: '#000080', fontWeight: 'bold' }}>BUSY 99.8%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. ROYAL SAPPHIRE THEME LOADER (Obsidian Sapphire Diamond & Holographic Cyber)
  if (theme === 'sapphire') {
    const titleText =
      lang === 'ja'
        ? 'ODA・公共調達データを分析中...'
        : lang === 'en'
        ? 'Analyzing ODA & Global Procurement Data...'
        : 'Đang phân tích dữ liệu ODA & Mua sắm công...';

    const subText =
      lang === 'ja'
        ? 'ロイヤル・サファイア VIP スイートを同期中...'
        : lang === 'en'
        ? 'Synchronizing Royal Sapphire VIP Suite...'
        : 'Đang đồng bộ Royal Sapphire VIP Suite...';

    return (
      <div
        style={{
          minHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Particles falling rain effect around the card */}
        <LoaderThemeRain theme="sapphire" />

        <div
          style={{
            background: 'linear-gradient(145deg, rgba(8, 16, 36, 0.94), rgba(4, 8, 20, 0.98))',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.85), 0 0 35px rgba(56, 189, 248, 0.15)',
            borderRadius: 20,
            padding: '32px 44px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
            maxWidth: 420,
            textAlign: 'center',
            backdropFilter: 'blur(16px)',
            position: 'relative',
            zIndex: 2,
            overflow: 'hidden',
          }}
        >
          {/* Top cyan neon beam */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '20%',
              right: '20%',
              height: 2,
              background: 'linear-gradient(90deg, transparent, #7dd3fc, #0284c7, transparent)',
            }}
          />

          {/* Central Sapphire Diamond Orbital Animation */}
          <div style={{ position: 'relative', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '2px dashed rgba(56, 189, 248, 0.35)',
                animation: 'spin 10s linear infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 4,
                borderRadius: '50%',
                border: '2px solid transparent',
                borderTopColor: '#7dd3fc',
                borderRightColor: '#0284c7',
                animation: 'spin 1.1s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.5)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 12,
                borderRadius: '50%',
                border: '2px solid transparent',
                borderBottomColor: '#38bdf8',
                borderLeftColor: '#0369a1',
                animation: 'spinReverse 0.85s linear infinite',
              }}
            />
            <SapphireDiamondSvg size={30} />
          </div>

          {/* Sapphire Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 20,
              background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.15), rgba(2, 132, 199, 0.15))',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#7dd3fc',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            💎 ROYAL SAPPHIRE SUITE
          </div>

          {/* Main Text */}
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #ffffff 30%, #7dd3fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: 0.3,
                marginBottom: 4,
              }}
            >
              {message || titleText}
            </div>
            <div style={{ fontSize: 11.5, color: 'rgba(125, 211, 252, 0.7)', fontWeight: 500 }}>
              {subText}
            </div>
          </div>

          {/* Cyber Cyan Progress Bar */}
          <div
            style={{
              width: '100%',
              height: 4,
              borderRadius: 4,
              background: 'rgba(56, 189, 248, 0.15)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '40%',
                background: 'linear-gradient(90deg, transparent, #7dd3fc, #0284c7, transparent)',
                animation: 'luxuryShimmer 1.3s ease-in-out infinite',
                boxShadow: '0 0 10px rgba(56, 189, 248, 0.8)',
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // 4. ANIME SAKURA THEME LOADER (Sakura Blossom Pink)
  if (theme === 'anime') {
    const titleText =
      lang === 'ja'
        ? 'お気に入りページを読み込み中... ( • ̀ω•́ )✧'
        : lang === 'en'
        ? 'Loading Cute Content... Just a moment! ( • ̀ω•́ )✧'
        : 'Đang tải trang yêu thích... Chờ xíu nha! ( • ̀ω•́ )✧';

    const subText =
      lang === 'ja'
        ? '桜アニメステーションと接続中 (˶>⩊<˶) ✨'
        : lang === 'en'
        ? 'Connecting to Sakura Anime Station (˶>⩊<˶) ✨'
        : 'Đang kết nối Sakura Anime Station (˶>⩊<˶) ✨';

    return (
      <div
        style={{
          minHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Particles falling rain effect around the card */}
        <LoaderThemeRain theme="anime" />

        <div
          style={{
            background: 'linear-gradient(145deg, rgba(38, 16, 28, 0.94), rgba(20, 8, 16, 0.98))',
            border: '1px solid rgba(244, 114, 182, 0.35)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.85), 0 0 35px rgba(244, 114, 182, 0.2)',
            borderRadius: 20,
            padding: '32px 44px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
            maxWidth: 420,
            textAlign: 'center',
            backdropFilter: 'blur(16px)',
            position: 'relative',
            zIndex: 2,
            overflow: 'hidden',
          }}
        >
          {/* Top sakura light beam */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '20%',
              right: '20%',
              height: 2,
              background: 'linear-gradient(90deg, transparent, #fbcfe8, #ec4899, transparent)',
            }}
          />

          {/* Central Sakura Flower Orbit */}
          <div style={{ position: 'relative', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '2px dashed rgba(244, 114, 182, 0.4)',
                animation: 'spin 8s linear infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 4,
                borderRadius: '50%',
                border: '2px solid transparent',
                borderTopColor: '#fbcfe8',
                borderRightColor: '#ec4899',
                animation: 'spin 1s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite',
                boxShadow: '0 0 16px rgba(244, 114, 182, 0.5)',
              }}
            />
            <span style={{ fontSize: 32, animation: 'floatHeart 1.5s ease-in-out infinite' }}>🌸</span>
          </div>

          {/* Sakura Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 20,
              background: 'linear-gradient(90deg, rgba(244, 114, 182, 0.2), rgba(236, 72, 153, 0.2))',
              border: '1px solid rgba(244, 114, 182, 0.45)',
              color: '#fbcfe8',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1.2,
            }}
          >
            🌸 SAKURA ANIME STATION
          </div>

          {/* Main Text */}
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #ffffff 30%, #fbcfe8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: 0.3,
                marginBottom: 4,
              }}
            >
              {message || titleText}
            </div>
            <div style={{ fontSize: 11.5, color: 'rgba(251, 207, 232, 0.8)', fontWeight: 500 }}>
              {subText}
            </div>
          </div>

          {/* Sakura Pink Progress Bar */}
          <div
            style={{
              width: '100%',
              height: 4,
              borderRadius: 4,
              background: 'rgba(244, 114, 182, 0.2)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '40%',
                background: 'linear-gradient(90deg, transparent, #fbcfe8, #ec4899, transparent)',
                animation: 'luxuryShimmer 1.2s ease-in-out infinite',
                boxShadow: '0 0 10px rgba(244, 114, 182, 0.8)',
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // 5. BASIC CLEAN PRO MODERN LOADER (Default)
  const basicTitle =
    lang === 'ja'
      ? 'ページを読み込み中...'
      : lang === 'en'
      ? 'Loading page...'
      : 'Đang tải trang...';

  const basicSub =
    lang === 'ja'
      ? 'BIS データを取得しています'
      : lang === 'en'
      ? 'Fetching latest BIS data'
      : 'Đang đồng bộ dữ liệu BIS';

  return (
    <div
      style={{
        minHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        padding: '24px',
      }}
    >
      <div style={{ position: 'relative', width: 48, height: 48 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid var(--border-subtle, rgba(59, 130, 246, 0.15))',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: 'var(--brand-500, #3b82f6)',
            borderRightColor: 'var(--brand-400, #60a5fa)',
            animation: 'spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          }}
        />
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
          {message || basicTitle}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted, #64748b)', marginTop: 2 }}>
          {basicSub}
        </div>
      </div>
    </div>
  );
}
