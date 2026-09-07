// src/utils/format.js
/**
 * Tiện ích chuẩn hóa chuỗi và định dạng dữ liệu dùng chung.
 */

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
 * Định dạng ngày dạng dài: 'Thứ ..., ngày ... tháng ... năm ...'
 */
export function formatFullDate(d) {
  if (!d) return 'N/A';
  try {
    return new Date(d).toLocaleDateString('vi-VN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
  } catch {
    return String(d);
  }
}

/**
 * Định dạng ngày ngắn: 'DD/MM/YYYY'
 */
export function formatShortDate(d) {
  if (!d) return 'N/A';
  try {
    return new Date(d).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  } catch {
    return String(d);
  }
}

/**
 * Định dạng số tiền USD: tỷ (B), triệu (M), nghìn...
 */
export function formatUsdAmount(amount) {
  if (!amount || amount <= 0) return 'N/A';
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)} tỷ (B)`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)} triệu (M)`;
  return `$${amount.toLocaleString('en-US')}`;
}

