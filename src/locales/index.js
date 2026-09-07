// src/locales/index.js
import vi from './vi.js';
import en from './en.js';
import ja from './ja.js';

export const DICT = { vi, en, ja };

// Dynamic classifications translation mapping
export const TRANSLATIONS = {
  countries: {
    VN: { vi: 'Việt Nam', en: 'Vietnam', ja: 'ベトナム' },
    PH: { vi: 'Philippines', en: 'Philippines', ja: 'フィリピン' },
    TH: { vi: 'Thái Lan', en: 'Thailand', ja: 'タイ' },
    ID: { vi: 'Indonesia', en: 'Indonesia', ja: 'インドネシア' },
    KH: { vi: 'Campuchia', en: 'Cambodia', ja: 'カンボジア' },
    LA: { vi: 'Lào', en: 'Laos', ja: 'ラオス' },
    TJ: { vi: 'Tajikistan', en: 'Tajikistan', ja: 'タジキスタン' },
    BR: { vi: 'Brazil', en: 'Brazil', ja: 'ブラジル' },
    ZA: { vi: 'Nam Phi', en: 'South Africa', ja: '南アフリカ' },
    IN: { vi: 'Ấn Độ', en: 'India', ja: 'インド' },
    BD: { vi: 'Bangladesh', en: 'Bangladesh', ja: 'バングラデシュ' },
    PK: { vi: 'Pakistan', en: 'Pakistan', ja: 'パキスタン' },
    MN: { vi: 'Mông Cổ', en: 'Mongolia', ja: 'モンゴル' },
    UZ: { vi: 'Uzbekistan', en: 'Uzbekistan', ja: 'ウズベキスタン' },
    CN: { vi: 'Trung Quốc', en: 'China', ja: '中国' },
    MR: { vi: 'Mauritania', en: 'Mauritania', ja: 'モーリタニア' },
    HN: { vi: 'Honduras', en: 'Honduras', ja: 'ホンジュラス' },
    UA: { vi: 'Ukraina', en: 'Ukraine', ja: 'ウクライナ' },
    KI: { vi: 'Kiribati', en: 'Kiribati', ja: 'キリバス' },
    NG: { vi: 'Nigeria', en: 'Nigeria', ja: 'ナイジェリア' },
    SD: { vi: 'Sudan', en: 'Sudan', ja: 'スーダン' },
    KE: { vi: 'Kenya', en: 'Kenya', ja: 'ケニア' },
    ET: { vi: 'Ethiopia', en: 'Ethiopia', ja: 'エチオピア' },
    EG: { vi: 'Ai Cập', en: 'Egypt', ja: 'エジプト' },
    GH: { vi: 'Ghana', en: 'Ghana', ja: 'ガーナ' },
    TZ: { vi: 'Tanzania', en: 'Tanzania', ja: 'タンザニア' },
    UG: { vi: 'Uganda', en: 'Uganda', ja: 'ウガンダ' },
    MA: { vi: 'Ma-rốc', en: 'Morocco', ja: 'モロッコ' },
    MX: { vi: 'Mexico', en: 'Mexico', ja: 'メキシコ' },
    CO: { vi: 'Colombia', en: 'Colombia', ja: 'コロンビア' },
    PE: { vi: 'Peru', en: 'Peru', ja: 'ペルー' },
    AR: { vi: 'Argentina', en: 'Argentina', ja: 'アルゼンチン' },
    TR: { vi: 'Thổ Nhĩ Kỳ', en: 'Turkey', ja: 'トルコ' },
    JO: { vi: 'Jordan', en: 'Jordan', ja: 'ヨルダン' },
    YE: { vi: 'Yemen', en: 'Yemen', ja: 'イエメン' },
    AF: { vi: 'Afghanistan', en: 'Afghanistan', ja: 'アフガニスタン' },
    PG: { vi: 'Papua New Guinea', en: 'Papua New Guinea', ja: 'パプアニューギニア' },
    TL: { vi: 'Timor-Leste', en: 'Timor-Leste', ja: '東ティモール' },
    NP: { vi: 'Nepal', en: 'Nepal', ja: 'ネパール' },
    LK: { vi: 'Sri Lanka', en: 'Sri Lanka', ja: 'スリランカ' },
    KZ: { vi: 'Kazakhstan', en: 'Kazakhstan', ja: 'カザフスタン' },
    KG: { vi: 'Kyrgyzstan', en: 'Kyrgyz Republic', ja: 'キルギス' },
    RW: { vi: 'Rwanda', en: 'Rwanda', ja: 'ルワンダ' },
  },
  sectors: {
    transport: { vi: 'Giao thông', en: 'Transport', ja: '交通・運輸' },
    energy: { vi: 'Năng lượng', en: 'Energy', ja: 'エネルギー' },
    water: { vi: 'Cấp thoát nước', en: 'Water & Sanitation', ja: '水・衛生' },
    agriculture: { vi: 'Nông nghiệp', en: 'Agriculture', ja: '農業' },
    urban: { vi: 'Đô thị', en: 'Urban Development', ja: '都市開発' },
    education: { vi: 'Giáo dục', en: 'Education', ja: '教育' },
    health: { vi: 'Y tế', en: 'Health', ja: '保健・医療' },
    finance: { vi: 'Tài chính', en: 'Finance', ja: '金融' },
    environment: { vi: 'Môi trường', en: 'Environment', ja: '環境' },
    tech: { vi: 'Công nghệ số', en: 'Digital & ICT', ja: 'デジタル・ICT' },
  },
  statuses: {
    active: { vi: 'Đang triển khai', en: 'Active', ja: '実施中' },
    approved: { vi: 'Đã phê duyệt', en: 'Approved', ja: '承認済み' },
    pipeline: { vi: 'Đang chuẩn bị', en: 'Pipeline', ja: '準備中' },
    proposed: { vi: 'Đề xuất', en: 'Proposed', ja: '提案中' },
    closed: { vi: 'Đã đóng / Hoàn thành', en: 'Closed', ja: '完了・終了' },
    dropped: { vi: 'Hủy bỏ', en: 'Dropped', ja: '中止' },
  },
  categories: {
    'cảng biển': { vi: 'Cảng biển', en: 'Seaport / Maritime', ja: '港湾・海運' },
    'cầu': { vi: 'Cầu', en: 'Bridge', ja: '橋梁' },
    'đường bộ': { vi: 'Đường bộ', en: 'Road / Highway', ja: '道路・高速道路' },
    'đường sắt': { vi: 'Đường sắt', en: 'Railway / Metro', ja: '鉄道・地下鉄' },
    'giao thông': { vi: 'Giao thông', en: 'Transportation', ja: '交通・インフラ' },
    'hàng không': { vi: 'Hàng không', en: 'Aviation', ja: '航空・空港' },
    'mua sắm công': { vi: 'Mua sắm công', en: 'Public Procurement', ja: '公共調達' },
    'oda': { vi: 'ODA', en: 'ODA (Dev Assistance)', ja: 'ODA (政府開発援助)' },
    'năng lượng': { vi: 'Năng lượng', en: 'Energy', ja: 'エネルギー' },
    'môi trường': { vi: 'Môi trường', en: 'Environment', ja: '環境' },
    'y tế': { vi: 'Y tế', en: 'Healthcare', ja: '医療・ヘルスケア' },
    'giáo dục': { vi: 'Giáo dục', en: 'Education', ja: '教育' },
  }
};

/**
 * Dịch ĐỘC LẬP (không cần React hook) — dùng cho các chuỗi giao diện được trích tự
 * động bằng scripts/i18n_extract.mjs. Nhờ không phải hook, script có thể thay chuỗi
 * ở BẤT KỲ đâu (kể cả ngoài component) mà không phải sửa cấu trúc file.
 *
 * Đổi ngôn ngữ vẫn cập nhật ngay vì App remount toàn cây theo `lang` (xem App.jsx).
 */
export function tUI(key, fallback) {
  const lang = (typeof localStorage !== 'undefined' && (localStorage.getItem('app_lang') || localStorage.getItem('news_lang'))) || 'vi';
  return DICT[lang]?.[key] ?? DICT.vi?.[key] ?? fallback ?? key;
}
