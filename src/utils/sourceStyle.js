// src/utils/sourceStyle.js
import { tUI } from '../locales';
/**
 * Shared utility cho màu sắc, background, border và icon của thẻ Nguồn (Source Pill Tag)
 * Đồng bộ 100% màu xanh dương (#2563eb) cho các nguồn Báo Chí / Báo Đấu Thầu khớp với Tab Báo Chí.
 */

const SOURCE_MAP = {
  adb:       { color: '#d97706', bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.25)', icon: '🏦', name: 'ADB' },
  worldbank: { color: '#047857', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.25)', icon: '🌍', name: 'World Bank' },
  dauthau:   { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(59, 130, 246, 0.22)', icon: '📋', name: tUI('ui.dau-thau') },
  gov:       { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(59, 130, 246, 0.22)', icon: '📋', name: tUI('ui.mua-sam-cong') },
  press:     { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(59, 130, 246, 0.22)', icon: '📰', name: tUI('ui.bao-chi-2') },
  default:   { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(59, 130, 246, 0.22)', icon: '📰', name: tUI('ui.nguon-tin-2') },
};

export function getSourceStyle(article = {}) {
  const sourceName = article.sources?.[0]?.source_name || article.source_name || '';
  const sourceType = article.source_type || article.source || '';
  const lowerName = sourceName.toLowerCase();

  // 1. ADB (Màu da cam)
  if (lowerName.includes('adb') || sourceType === 'adb') {
    return { color: '#d97706', bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.25)', icon: '🏦', name: sourceName || 'ADB' };
  }

  // 2. World Bank (Màu xanh lá)
  if (lowerName.includes('world bank') || lowerName.includes('wb') || sourceType === 'worldbank') {
    return { color: '#047857', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.25)', icon: '🌍', name: sourceName || 'World Bank' };
  }

  // 3. Báo Chí & Báo Đấu Thầu (Màu xanh dương #2563eb đồng bộ với Tab Báo Chí)
  if (lowerName.includes('báo') || sourceType === 'press') {
    return { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(59, 130, 246, 0.22)', icon: '📰', name: sourceName || 'Báo Chí' };
  }

  // 4. Các nguồn đấu thầu / mua sắm công khác
  if (lowerName.includes('thầu') || lowerName.includes('egp') || sourceType === 'gov' || sourceType === 'dauthau') {
    return { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(59, 130, 246, 0.22)', icon: '📋', name: sourceName || 'Đấu Thầu' };
  }

  // Mặc định màu xanh dương
  if (article.source && SOURCE_MAP[article.source]) {
    const base = SOURCE_MAP[article.source];
    return { ...base, name: sourceName || base.name };
  }
  return { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(59, 130, 246, 0.22)', icon: '📰', name: sourceName || 'Nguồn tin' };
}
