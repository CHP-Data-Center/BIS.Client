// src/utils/theme.js

/**
 * Lấy theme UI đã lưu của một tài khoản user cụ thể.
 * Nếu user chưa từng chọn theme, mặc định trả về 'basic'.
 * @param {object|string|null} user - User object hoặc email/id
 * @returns {string} - Theme key ('basic', 'classic', 'sapphire', 'luxury')
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
  applyTheme(themeKey);
}

/**
 * Cập nhật thuộc tính data-ui-theme trên document.documentElement.
 * @param {string} themeKey
 */
export function applyTheme(themeKey) {
  const targetTheme = themeKey || 'basic';
  document.documentElement.setAttribute('data-ui-theme', targetTheme);
  localStorage.setItem('bis_last_active_ui_theme', targetTheme);
}

/**
 * Đồng bộ UI Theme dựa theo trạng thái đăng nhập:
 * - Khi đã đăng nhập (user tồn tại):
 *   Áp dụng ĐÚNG theme riêng của user đó (`bis_ui_theme_<user_key>`).
 *   Nếu tài khoản này CHƯA từng chọn/mua theme -> Mặc định áp dụng 'basic' (Không bị nhiễm theme của tài khoản khác!).
 * - Khi chưa đăng nhập (màn hình Login):
 *   Giữ nguyên theme của tài khoản vừa hoạt động trước đó (`bis_last_active_ui_theme`).
 * @param {object|null} user
 */
export function syncUserTheme(user) {
  if (user) {
    const userKey = user.email || user.id;
    // Check if THIS specific user has a saved theme, otherwise strictly default to 'basic'
    const userTheme = localStorage.getItem(`bis_ui_theme_${userKey}`) || 'basic';
    applyTheme(userTheme);
  } else {
    // Unauthenticated (Login screen): show last active theme preview
    const lastTheme = localStorage.getItem('bis_last_active_ui_theme') || 'basic';
    applyTheme(lastTheme);
  }
}
