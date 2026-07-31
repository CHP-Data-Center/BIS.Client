// src/components/StatsCard.jsx
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useState, useEffect } from 'react';

function AnimatedNumber({ target }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const duration = 1400;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target]);
  return <>{val.toLocaleString('vi-VN')}</>;
}

export default function StatsCard({
  icon, label, value, sub, trend, trendDir = 'up', accentColor, iconBg, onClick, loading = false
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="stats-card"
      style={{ '--card-accent': accentColor, '--card-bg': iconBg, cursor: onClick ? 'pointer' : 'default' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Shimmer overlay on hover */}
      {hovered && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)',
          backgroundSize: '200% 100%',
          animation: 'shimmerSweep 0.8s ease',
          pointerEvents: 'none',
          zIndex: 1,
        }} />
      )}

      <div className="stats-card-header">
        <div
          className="stats-card-icon"
          style={{ transition: 'transform 0.3s ease' }}
        >
          {icon}
        </div>
        {trend && !loading && (
          <div className={`stats-card-trend ${trendDir === 'down' ? 'down' : ''}`}>
            {trendDir === 'up'
              ? <TrendingUp size={12} />
              : <TrendingDown size={12} />}
            {trend}
          </div>
        )}
      </div>

      <div className="stats-value">
        {loading ? (
          <div className="skeleton" style={{ height: 32, width: 70, borderRadius: 8, margin: '4px 0' }} />
        ) : (
          <AnimatedNumber target={typeof value === 'number' ? value : parseInt(value) || 0} />
        )}
      </div>

      <div className="stats-label">{label}</div>
      {sub && <div className="stats-sub">{loading ? <div className="skeleton" style={{ height: 12, width: '60%', borderRadius: 4 }} /> : sub}</div>}

      {/* Bottom accent bar animation */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        height: 3,
        width: hovered ? '100%' : '30%',
        background: accentColor,
        borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
        transition: 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        opacity: 0.7,
      }} />
    </div>
  );
}
