// src/context/LanguageContext.jsx
// Ngôn ngữ TOÀN GIAO DIỆN (vi/en/ja): menu, nhãn, placeholder… + nội dung tin (?lang=).
// Dùng: const { lang, setLang, t } = useLang();  t('nav.dashboard') → theo ngôn ngữ đang chọn.
// Key thiếu ở en/ja tự rơi về vi (không bao giờ vỡ giao diện).
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useState } from 'react';

const DICT = {
  vi: {
    'nav.main': 'Chính',
    'nav.dashboard': 'Dashboard',
    'nav.allNews': 'Tất Cả Tin',
    'nav.sources': 'Nguồn Dữ Liệu',
    'nav.press': 'Báo Chí',
    'nav.adb': 'ADB (Châu Á)',
    'nav.adbProjects': 'Dự Án ADB',
    'nav.adbTenders': 'Thông Báo Mời Thầu ADB',
    'nav.worldbank': 'World Bank',
    'nav.procGroup': 'Đấu Thầu Công',
    'nav.tbmt': 'Thông Báo Mời Thầu (TBMT)',
    'nav.khlcnt': 'Kế Hoạch LCNT (KHLCNT)',
    'nav.tools': 'Công Cụ',
    'nav.keywords': 'Từ Khóa',
    'nav.bookmarks': 'Đã Lưu',
    'nav.ai': 'Trợ Lý AI',
    'nav.admin': 'Quản Trị Admin',
    'nav.upgrade': 'Nâng Cấp Dịch Vụ',
    'nav.settings': 'Cài đặt',
    'badge.upgrade': '🔒 NÂNG CẤP',
    'header.searchPlaceholder': 'Tìm kiếm tin tức... (Enter)',
    'header.login': 'Đăng nhập',
    'header.logout': 'Đăng xuất',
    'header.settings': 'Cài đặt',
    'header.myKeywords': 'Từ khóa của tôi',
    'header.adminPanel': 'Bảng Quản Trị Admin',
    'header.upgradeMenu': 'Nâng Cấp Gói Dịch Vụ',
    'news.sort': 'Sắp xếp:',
    'news.sortNewest': 'Mới nhất',
    'news.sortMatch': 'Khớp nhiều nhất',
    'news.lang': 'Ngôn ngữ tin:',
    'news.onlyMyKw': 'Chỉ từ khóa của tôi',
    'news.refresh': 'Làm mới',
    'news.reset': 'Đặt lại',
    'news.searchPlaceholder': 'Tìm tiêu đề, nội dung...',
    'news.dateRange': 'Khoảng thời gian',
    'news.readOriginal': 'Xem bài gốc',
    'news.save': 'Lưu lại',
    'common.close': 'Đóng',
    'common.loading': 'Đang tải...',
    'search.title': 'Kết quả tìm kiếm',
    'search.viewAll': 'Xem tất cả',
    'search.empty': 'Không có kết quả khớp.',
    'search.press': 'Báo Chí',
    'search.proc': 'Mua Sắm Công (TBMT / KHLCNT)',
  },
  en: {
    'nav.main': 'Main',
    'nav.dashboard': 'Dashboard',
    'nav.allNews': 'All News',
    'nav.sources': 'Data Sources',
    'nav.press': 'Press',
    'nav.adb': 'ADB (Asia)',
    'nav.adbProjects': 'ADB Projects',
    'nav.adbTenders': 'ADB Bid Notices',
    'nav.worldbank': 'World Bank',
    'nav.procGroup': 'Public Procurement',
    'nav.tbmt': 'Bid Notices (TBMT)',
    'nav.khlcnt': 'Selection Plans (KHLCNT)',
    'nav.tools': 'Tools',
    'nav.keywords': 'Keywords',
    'nav.bookmarks': 'Bookmarks',
    'nav.ai': 'AI Assistant',
    'nav.admin': 'Admin Panel',
    'nav.upgrade': 'Upgrade Plan',
    'nav.settings': 'Settings',
    'badge.upgrade': '🔒 UPGRADE',
    'header.searchPlaceholder': 'Search news... (Enter)',
    'header.login': 'Sign in',
    'header.logout': 'Sign out',
    'header.settings': 'Settings',
    'header.myKeywords': 'My keywords',
    'header.adminPanel': 'Admin Panel',
    'header.upgradeMenu': 'Upgrade Plan',
    'news.sort': 'Sort:',
    'news.sortNewest': 'Newest',
    'news.sortMatch': 'Most matched',
    'news.lang': 'News language:',
    'news.onlyMyKw': 'My keywords only',
    'news.refresh': 'Refresh',
    'news.reset': 'Reset',
    'news.searchPlaceholder': 'Search title, content...',
    'news.dateRange': 'Date range',
    'news.readOriginal': 'View original',
    'news.save': 'Save',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'search.title': 'Search results',
    'search.viewAll': 'View all',
    'search.empty': 'No matching results.',
    'search.press': 'Press',
    'search.proc': 'Public Procurement (TBMT / KHLCNT)',
  },
  ja: {
    'nav.main': 'メイン',
    'nav.dashboard': 'ダッシュボード',
    'nav.allNews': 'すべてのニュース',
    'nav.sources': 'データソース',
    'nav.press': '新聞・報道',
    'nav.adb': 'ADB（アジア）',
    'nav.adbProjects': 'ADBプロジェクト',
    'nav.adbTenders': 'ADB入札公告',
    'nav.worldbank': '世界銀行',
    'nav.procGroup': '公共調達',
    'nav.tbmt': '入札公告（TBMT）',
    'nav.khlcnt': '業者選定計画（KHLCNT）',
    'nav.tools': 'ツール',
    'nav.keywords': 'キーワード',
    'nav.bookmarks': '保存済み',
    'nav.ai': 'AIアシスタント',
    'nav.admin': '管理者パネル',
    'nav.upgrade': 'アップグレード',
    'nav.settings': '設定',
    'badge.upgrade': '🔒 アップグレード',
    'header.searchPlaceholder': 'ニュースを検索... (Enter)',
    'header.login': 'ログイン',
    'header.logout': 'ログアウト',
    'header.settings': '設定',
    'header.myKeywords': 'マイキーワード',
    'header.adminPanel': '管理者パネル',
    'header.upgradeMenu': 'プランをアップグレード',
    'news.sort': '並び替え:',
    'news.sortNewest': '新着順',
    'news.sortMatch': '一致数順',
    'news.lang': 'ニュース言語:',
    'news.onlyMyKw': '自分のキーワードのみ',
    'news.refresh': '更新',
    'news.reset': 'リセット',
    'news.searchPlaceholder': 'タイトル・内容を検索...',
    'news.dateRange': '期間',
    'news.readOriginal': '原文を見る',
    'news.save': '保存',
    'common.close': '閉じる',
    'common.loading': '読み込み中...',
    'search.title': '検索結果',
    'search.viewAll': 'すべて表示',
    'search.empty': '一致する結果はありません。',
    'search.press': '新聞・報道',
    'search.proc': '公共調達（TBMT / KHLCNT）',
  },
};

const LanguageContext = createContext({ lang: 'vi', setLang: () => {}, t: (k) => k });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem('app_lang') || localStorage.getItem('news_lang') || 'vi'
  );
  const setLang = useCallback((next) => {
    setLangState(next);
    localStorage.setItem('app_lang', next);
    localStorage.setItem('news_lang', next); // tương thích lựa chọn cũ ở trang tin
  }, []);
  const t = useCallback(
    (key) => DICT[lang]?.[key] ?? DICT.vi[key] ?? key,
    [lang]
  );
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
