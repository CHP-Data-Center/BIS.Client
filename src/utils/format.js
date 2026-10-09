// src/utils/format.js
/**
 * Tiện ích chuẩn hóa chuỗi và định dạng dữ liệu dùng chung.
 */

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

/**
 * Loại bỏ dấu tiếng Việt và chuẩn hóa về chữ thường để phục vụ tìm kiếm / so khớp từ khóa.
 * @param {string} str Chuỗi nguồn
 * @returns {string} Chuỗi không dấu, chữ thường
 */
export function stripAccents(str = '') {
  if (typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/**
 * Định dạng ngày dạng dài: 'Thứ ..., ngày ... tháng ... năm ...' (hoặc theo ja, en)
 */
export function formatFullDate(d, lang) {
  if (!d) return 'N/A';
  const effectiveLang = getEffectiveLang(lang);
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return String(d);
    if (effectiveLang === 'ja') {
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
      });
    }
    if (effectiveLang === 'en') {
      return date.toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
      });
    }
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
  } catch {
    return String(d);
  }
}

/**
 * Định dạng ngày ngắn: 'DD/MM/YYYY' (hoặc YYYY/MM/DD với ja)
 */
export function formatShortDate(d, lang) {
  if (!d) return 'N/A';
  const effectiveLang = getEffectiveLang(lang);
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return String(d);
    if (effectiveLang === 'ja') {
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric', month: '2-digit', day: '2-digit'
      });
    }
    if (effectiveLang === 'en') {
      return date.toLocaleDateString('en-US', {
        month: '2-digit', day: '2-digit', year: 'numeric'
      });
    }
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  } catch {
    return String(d);
  }
}

/**
 * Định dạng số tiền USD: tỷ (B), triệu (M), nghìn...
 */
export function formatUsdAmount(amount, lang) {
  if (!amount || amount <= 0) return 'N/A';
  const effectiveLang = getEffectiveLang(lang);
  if (effectiveLang === 'vi') {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)} tỷ (B)`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)} triệu (M)`;
  } else {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)} B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)} M`;
  }
  return `$${amount.toLocaleString('en-US')}`;
}

/**
 * Định dạng số tiền VND / Tiền tệ khác có đơn vị rút gọn B, M, tỷ, triệu...
 */
export function formatMoney(value, unit = 'VND', lang) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  const effectiveLang = getEffectiveLang(lang);
  const numStr = effectiveLang === 'en' ? n.toLocaleString('en-US') : n.toLocaleString('vi-VN');
  const full = `${numStr} ${unit || 'VND'}`;
  if (effectiveLang === 'ja' || effectiveLang === 'en') {
    if (n >= 1e9) return `${full} (${(n / 1e9).toFixed(2)} B)`;
    if (n >= 1e6) return `${full} (${(n / 1e6).toFixed(1)} M)`;
  } else {
    if (n >= 1e9) return `${full} (${(n / 1e9).toFixed(2).replace('.', ',')} tỷ)`;
    if (n >= 1e6) return `${full} (${(n / 1e6).toFixed(1).replace('.', ',')} triệu)`;
  }
  return full;
}
