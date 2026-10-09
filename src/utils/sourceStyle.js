// src/utils/sourceStyle.js
import { tUI } from '../locales';

function getEffectiveLang(lang) {
  if (lang) return lang;
  try {
    return (
      (typeof localStorage?.getItem === 'function' &&
        (localStorage.getItem('app_lang') || localStorage.getItem('news_lang'))) ||
      'vi'
    );
  } catch {
    return 'vi';
  }
}

export function formatArticleSource(src, lang) {
  if (!src) return '';
  const effectiveLang = getEffectiveLang(lang);
  if (effectiveLang === 'vi') return src;

  const lower = src.toLowerCase().trim();
  if (lower === 'báo chí' || lower === 'bao chi') {
    return effectiveLang === 'ja' ? '報道' : (effectiveLang === 'en' ? 'Press' : src);
  }
  if (lower === 'đấu thầu' || lower === 'dau thau') {
    return effectiveLang === 'ja' ? '公共調達' : (effectiveLang === 'en' ? 'Bidding' : src);
  }
  if (lower === 'mua sắm công' || lower === 'mua sam cong') {
    return effectiveLang === 'ja' ? '公共調達' : (effectiveLang === 'en' ? 'Public Procurement' : src);
  }
  if (lower === 'nguồn tin' || lower === 'nguon tin') {
    return effectiveLang === 'ja' ? 'ニュースソース' : (effectiveLang === 'en' ? 'News Source' : src);
  }

  const suffixMapJa = {
    'hổ sơ nhà thầu': '入札書類',
    'hồ sơ nhà thầu': '入札書類',
    'thông báo mời thầu': '入札招請通知',
    'đấu thầu': '入札情報',
    'kế hoạch lựa chọn nhà thầu': '調達計画',
    'kết quả lựa chọn nhà thầu': '落札結果',
  };
  const suffixMapEn = {
    'hổ sơ nhà thầu': 'Bidder Dossier',
    'hồ sơ nhà thầu': 'Bidder Dossier',
    'thông báo mời thầu': 'Invitation to Bid',
    'đấu thầu': 'Bidding',
    'kế hoạch lựa chọn nhà thầu': 'Procurement Plan',
    'kết quả lựa chọn nhà thầu': 'Bidding Results',
  };

  if (src.includes(' - ')) {
    const [prefix, suffix] = src.split(' - ').map(s => s.trim());
    const lowerSuffix = suffix.toLowerCase();
    if (prefix.toLowerCase().includes('báo đấu thầu')) {
      if (effectiveLang === 'ja') return `入札新聞 - ${suffixMapJa[lowerSuffix] || suffix}`;
      if (effectiveLang === 'en') return `Bidding News - ${suffixMapEn[lowerSuffix] || suffix}`;
    }
  }

  if (lower === 'báo đấu thầu') {
    return effectiveLang === 'ja' ? '入札新聞' : (effectiveLang === 'en' ? 'Bidding News' : src);
  }
  return src;
}

const SOURCE_MAP = {
  adb:       { color: '#d97706', bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.25)', icon: '🏦', name: 'ADB' },
  worldbank: { color: '#047857', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.25)', icon: '🌍', name: 'World Bank' },
  dauthau:   { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(59, 130, 246, 0.22)', icon: '📋', name: tUI('ui.dau-thau') },
  gov:       { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(59, 130, 246, 0.22)', icon: '📋', name: tUI('ui.mua-sam-cong') },
  press:     { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(59, 130, 246, 0.22)', icon: '📰', name: tUI('ui.bao-chi-2') },
  default:   { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(59, 130, 246, 0.22)', icon: '📰', name: tUI('ui.nguon-tin-2') },
};

export function getSourceStyle(article = {}, lang) {
  const effectiveLang = getEffectiveLang(lang);
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
    const raw = sourceName || (effectiveLang === 'ja' ? '報道' : (effectiveLang === 'en' ? 'Press' : 'Báo chí'));
    return { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(59, 130, 246, 0.22)', icon: '📰', name: formatArticleSource(raw, effectiveLang) };
  }

  // 4. Các nguồn đấu thầu / mua sắm công khác
  if (lowerName.includes('thầu') || lowerName.includes('egp') || sourceType === 'gov' || sourceType === 'dauthau') {
    const raw = sourceName || (effectiveLang === 'ja' ? '公共調達' : (effectiveLang === 'en' ? 'Bidding' : 'Đấu thầu'));
    return { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(59, 130, 246, 0.22)', icon: '📋', name: formatArticleSource(raw, effectiveLang) };
  }

  // Mặc định màu xanh dương
  if (article.source && SOURCE_MAP[article.source]) {
    const base = SOURCE_MAP[article.source];
    const raw = sourceName || base.name;
    return { ...base, name: formatArticleSource(raw, effectiveLang) };
  }
  const defaultRaw = sourceName || (effectiveLang === 'ja' ? '報道' : (effectiveLang === 'en' ? 'Press' : 'Báo chí'));
  return { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(59, 130, 246, 0.22)', icon: '📰', name: formatArticleSource(defaultRaw, effectiveLang) };
}
