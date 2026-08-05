// src/utils/theme.js

/**
 * Lấy theme UI đã lưu của một tài khoản user cụ thể.
 * Nếu user chưa từng chọn theme, mặc định trả về 'basic'.
 * @param {object|string|null} user - User object hoặc email/id
 * @returns {string} - Theme key ('basic', 'classic', 'cyberpunk', 'luxury')
 */
export function getUserTheme(user) {
  const userKey = typeof user === 'string' ? user : (user?.email || user?.id);
  if (userKey) {
    const userTheme = localStorage.getItem(`bis_ui_theme_${userKey}`);
    if (userTheme) return userTheme;
  }
  return 'basic';
}

/**
 * Lưu theme UI cho tài khoản user hiện tại và áp dụng ngay lập tức.
 * @param {object|string|null} user
 * @param {string} themeKey
 */
export function setUserTheme(user, themeKey) {
  const userKey = typeof user === 'string' ? user : (user?.email || user?.id);
  if (userKey) {
    localStorage.setItem(`bis_ui_theme_${userKey}`, themeKey);
  }
  localStorage.setItem('bis_last_active_ui_theme', themeKey);
  localStorage.setItem('bis_saved_ui_theme', themeKey); // for fallback
  applyTheme(themeKey);
}

/**
 * Cập nhật thuộc tính data-ui-theme trên document.documentElement.
 * @param {string} themeKey
 */
export function applyTheme(themeKey) {
  if (themeKey && themeKey !== 'basic') {
    document.documentElement.setAttribute('data-ui-theme', themeKey);
  } else {
    document.documentElement.removeAttribute('data-ui-theme');
  }
}

/**
 * Đồng bộ UI Theme dựa theo trạng thái đăng nhập:
 * - Khi đã đăng nhập (user tồn tại): Áp dụng đúng theme riêng của user đó.
 * - Khi chưa đăng nhập (màn hình Login): Giữ nguyên theme của tài khoản vừa dùng trước đó.
 * @param {object|null} user
 */
export function syncUserTheme(user) {
  if (user) {
    const userKey = user.email || user.id;
    const userTheme = localStorage.getItem(`bis_ui_theme_${userKey}`) || 'basic';
    applyTheme(userTheme);
    localStorage.setItem('bis_last_active_ui_theme', userTheme);
  } else {
    const lastTheme = localStorage.getItem('bis_last_active_ui_theme') || localStorage.getItem('bis_saved_ui_theme') || 'basic';
    applyTheme(lastTheme);
  }
}
