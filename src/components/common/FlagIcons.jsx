// src/components/common/FlagIcons.jsx
import React from 'react';

/** Cờ Việt Nam 🇻🇳 SVG */
export function FlagVN({ size = 18, style = {} }) {
  return (
    <svg
      width={size * 1.4}
      height={size}
      viewBox="0 0 30 20"
      style={{ borderRadius: 3, verticalAlign: 'middle', flexShrink: 0, display: 'inline-block', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', ...style }}
    >
      <rect width="30" height="20" fill="#da251d" />
      <polygon
        points="15,4 16.47,8.53 21.23,8.53 17.38,11.33 18.85,15.86 15,13.06 11.15,15.86 12.62,11.33 8.77,8.53 13.53,8.53"
        fill="#ffff00"
      />
    </svg>
  );
}

/** Cờ Vương Quốc Anh 🇬🇧 SVG (Union Jack) */
export function FlagUK({ size = 18, style = {} }) {
  return (
    <svg
      width={size * 1.4}
      height={size}
      viewBox="0 0 30 20"
      style={{ borderRadius: 3, verticalAlign: 'middle', flexShrink: 0, display: 'inline-block', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', ...style }}
    >
      <clipPath id="uk-clip">
        <rect width="30" height="20" rx="1" />
      </clipPath>
      <g clipPath="url(#uk-clip)">
        <rect width="30" height="20" fill="#012169" />
        <path d="M0,0 L30,20 M30,0 L0,20" stroke="#fff" strokeWidth="4" />
        <path d="M0,0 L30,20 M30,0 L0,20" stroke="#C8102E" strokeWidth="2" />
        <path d="M15,0 V20 M0,10 H30" stroke="#fff" strokeWidth="6" />
        <path d="M15,0 V20 M0,10 H30" stroke="#C8102E" strokeWidth="3.5" />
      </g>
    </svg>
  );
}

/** Cờ Nhật Bản 🇯🇵 SVG (Hinomaru) */
export function FlagJA({ size = 18, style = {} }) {
  return (
    <svg
      width={size * 1.4}
      height={size}
      viewBox="0 0 30 20"
      style={{ borderRadius: 3, verticalAlign: 'middle', flexShrink: 0, display: 'inline-block', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', border: '1px solid rgba(0,0,0,0.1)', ...style }}
    >
      <rect width="30" height="20" fill="#ffffff" />
      <circle cx="15" cy="10" r="6" fill="#bc002d" />
    </svg>
  );
}

export function FlagIcon({ lang = 'vi', size = 18, style = {} }) {
  if (lang === 'en') return <FlagUK size={size} style={style} />;
  if (lang === 'ja') return <FlagJA size={size} style={style} />;
  return <FlagVN size={size} style={style} />;
}
