// src/utils/sanitize.js
import DOMPurify from 'dompurify';

/**
 * Làm sạch HTML từ bài viết crawler / người dùng nhập để tránh lỗi XSS.
 * @param {string} html - Chuỗi HTML chưa làm sạch
 * @returns {string} - Chuỗi HTML an toàn
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'br',
      'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'mark'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'title', 'class', 'style'],
  });
}

/**
 * Tách bỏ toàn bộ thẻ HTML chỉ giữ lại văn bản thuần.
 * @param {string} str - Chuỗi cần làm sạch
 * @returns {string} - Văn bản thuần
 */
export function sanitizeText(str) {
  if (!str || typeof str !== 'string') return '';
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [] });
}

export default sanitizeHtml;
