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
    AM: { vi: 'Armenia', en: 'Armenia', ja: 'アルメニア' },
    AZ: { vi: 'Azerbaijan', en: 'Azerbaijan', ja: 'アゼルバイジャン' },
    GE: { vi: 'Georgia', en: 'Georgia', ja: 'ジョージア' },
    BT: { vi: 'Bhutan', en: 'Bhutan', ja: 'ブータン' },
    MM: { vi: 'Myanmar', en: 'Myanmar', ja: 'ミャンマー' },
    MY: { vi: 'Malaysia', en: 'Malaysia', ja: 'マレーシア' },
    MV: { vi: 'Maldives', en: 'Maldives', ja: 'モルディブ' },
    FJ: { vi: 'Fiji', en: 'Fiji', ja: 'フィジー' },
    WS: { vi: 'Samoa', en: 'Samoa', ja: 'サモア' },
    TO: { vi: 'Tonga', en: 'Tonga', ja: 'トンガ' },
    VU: { vi: 'Vanuatu', en: 'Vanuatu', ja: 'バヌアツ' },
    SB: { vi: 'Quần đảo Solomon', en: 'Solomon Islands', ja: 'ソロモン諸島' },
    FM: { vi: 'Micronesia', en: 'Micronesia', ja: 'ミクロネシア' },
    MH: { vi: 'Quần đảo Marshall', en: 'Marshall Islands', ja: 'マーシャル諸島' },
    PW: { vi: 'Palau', en: 'Palau', ja: 'パラオ' },
    NR: { vi: 'Nauru', en: 'Nauru', ja: 'ナウル' },
    TV: { vi: 'Tuvalu', en: 'Tuvalu', ja: 'ツバル' },
    TM: { vi: 'Turkmenistan', en: 'Turkmenistan', ja: 'トルクメニスタン' },
    KR: { vi: 'Hàn Quốc', en: 'South Korea', ja: '韓国' },
    JP: { vi: 'Nhật Bản', en: 'Japan', ja: '日本' },
    US: { vi: 'Mỹ', en: 'United States', ja: 'アメリカ' },
    GB: { vi: 'Vương quốc Anh', en: 'United Kingdom', ja: 'イギリス' },
    FR: { vi: 'Pháp', en: 'France', ja: 'フランス' },
    DE: { vi: 'Đức', en: 'Germany', ja: 'ドイツ' },
    AU: { vi: 'Úc', en: 'Australia', ja: 'オーストラリア' },
    NZ: { vi: 'New Zealand', en: 'New Zealand', ja: 'ニュージーランド' },
    SG: { vi: 'Singapore', en: 'Singapore', ja: 'シンガポール' },
    CM: { vi: 'Cameroon', en: 'Cameroon', ja: 'カメルーン' },
    BF: { vi: 'Burkina Faso', en: 'Burkina Faso', ja: 'ブルキナファソ' },
    SZ: { vi: 'Eswatini', en: 'Eswatini', ja: 'エスワティニ' },
    ME: { vi: 'Montenegro', en: 'Montenegro', ja: 'モンテネグロ' },
    BB: { vi: 'Barbados', en: 'Barbados', ja: 'バルバドス' },
    ST: { vi: 'Sao Tome và Principe', en: 'Sao Tome and Principe', ja: 'サントメ・プリンシペ' },
    CI: { vi: 'Bờ Biển Ngà', en: "Cote d'Ivoire", ja: 'コートジボワール' },
    TD: { vi: 'Chad', en: 'Chad', ja: 'チャド' },
    DJ: { vi: 'Djibouti', en: 'Djibouti', ja: 'ジブチ' },
    CF: { vi: 'Cộng hòa Trung Phi', en: 'Central African Republic', ja: '中央アフリカ共和国' },
    ZM: { vi: 'Zambia', en: 'Zambia', ja: 'ザンビア' },
    MG: { vi: 'Madagascar', en: 'Madagascar', ja: 'マダガスカル' },
    SL: { vi: 'Sierra Leone', en: 'Sierra Leone', ja: 'シエラレオネ' },
    BA: { vi: 'Bosnia và Herzegovina', en: 'Bosnia and Herzegovina', ja: 'ボスニア・ヘルツェゴビナ' },
    LR: { vi: 'Liberia', en: 'Liberia', ja: 'リベリア' },
    JM: { vi: 'Jamaica', en: 'Jamaica', ja: 'ジャマイカ' },
    BJ: { vi: 'Benin', en: 'Benin', ja: 'ベナン' },
    CV: { vi: 'Cabo Verde', en: 'Cabo Verde', ja: 'カーボベルデ' },
    GN: { vi: 'Guinea', en: 'Guinea', ja: 'ギニア' },
    SO: { vi: 'Somalia', en: 'Somalia', ja: 'ソマリア' },
    SC: { vi: 'Seychelles', en: 'Seychelles', ja: 'セーシェル' },
    EC: { vi: 'Ecuador', en: 'Ecuador', ja: 'エクアドル' },
    CD: { vi: 'Cộng hòa Dân chủ Congo', en: 'DR Congo', ja: 'コンゴ民主共和国' },
    CG: { vi: 'Congo', en: 'Congo', ja: 'コンゴ共和国' },
    BW: { vi: 'Botswana', en: 'Botswana', ja: 'ボツワナ' },
    LS: { vi: 'Lesotho', en: 'Lesotho', ja: 'レソト' },
    RO: { vi: 'Romania', en: 'Romania', ja: 'ルーマニア' },
    DM: { vi: 'Dominica', en: 'Dominica', ja: 'ドミニカ国' },
    RS: { vi: 'Serbia', en: 'Serbia', ja: 'セルビア' },
    AO: { vi: 'Angola', en: 'Angola', ja: 'アンゴラ' },
    GM: { vi: 'Gambia', en: 'Gambia', ja: 'ガンビア' },
    NE: { vi: 'Niger', en: 'Niger', ja: 'ニジェール' },
    SS: { vi: 'Nam Sudan', en: 'South Sudan', ja: '南スーダン' },
    ML: { vi: 'Mali', en: 'Mali', ja: 'マリ' },
    MK: { vi: 'Bắc Macedonia', en: 'North Macedonia', ja: '北マケドニア' },
    MW: { vi: 'Malawi', en: 'Malawi', ja: 'マラウイ' },
    MD: { vi: 'Moldova', en: 'Moldova', ja: 'モルドバ' },
    BI: { vi: 'Burundi', en: 'Burundi', ja: 'ブルンジ' },
    LB: { vi: 'Li-băng', en: 'Lebanon', ja: 'レバノン' },
    CR: { vi: 'Costa Rica', en: 'Costa Rica', ja: 'コスタリカ' },
    HT: { vi: 'Haiti', en: 'Haiti', ja: 'ハイチ' },
    TG: { vi: 'Togo', en: 'Togo', ja: 'トーゴ' },
    REGIONAL: { vi: 'Khu vực / Đa quốc gia', en: 'Regional', ja: '地域・複数国' },
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
    cau: { vi: 'Cầu', en: 'Bridge', ja: '橋梁' },
    'duong-bo': { vi: 'Đường bộ', en: 'Roads & Highways', ja: '道路・高速道路' },
    'duong-sat': { vi: 'Đường sắt', en: 'Railways & Metro', ja: '鉄道・地下鉄' },
    'cang-bien': { vi: 'Cảng biển', en: 'Seaports & Maritime', ja: '港湾・海運' },
    'hang-khong': { vi: 'Hàng không', en: 'Aviation & Airports', ja: '航空・空港' },
    'nang-luong': { vi: 'Năng lượng', en: 'Energy & Power', ja: 'エネルギー・電力' },
    'cap-thoat-nuoc': { vi: 'Cấp thoát nước', en: 'Water & Drainage', ja: '上下水道・治水' },
    'ha-tang-do-thi': { vi: 'Hạ tầng đô thị', en: 'Urban Infrastructure', ja: '都市インフラ' },
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
    'cấp thoát nước': { vi: 'Cấp thoát nước', en: 'Water & Drainage', ja: '上下水道・治水' },
    'hạ tầng đô thị': { vi: 'Hạ tầng đô thị', en: 'Urban Infrastructure', ja: '都市インフラ' },
    'công nghiệp & tm': { vi: 'Công nghiệp & TM', en: 'Industry & Trade', ja: '産業・貿易' },
    'quản lý công': { vi: 'Quản lý công', en: 'Public Sector Management', ja: '公共部門管理' },
    'tài chính': { vi: 'Tài chính', en: 'Finance', ja: '金融' },
    'đa ngành': { vi: 'Đa ngành', en: 'Multisector', ja: '多分野・複合' },
    'nông nghiệp & tntn': { vi: 'Nông nghiệp & TNTN', en: 'Agriculture & Resources', ja: '農業・天然資源' },
    
    'nước & đô thị': { vi: 'Nước & Đô thị', en: 'Water & Urban', ja: '水資源・都市開発' },
  },
  procurement: {
    fields: {
      'hàng hóa': { vi: 'Hàng hóa', en: 'Goods', ja: '物品' },
      'hh': { vi: 'Hàng hóa', en: 'Goods', ja: '物品' },
      'xây lắp': { vi: 'Xây lắp', en: 'Works / Construction', ja: '建設・工事' },
      'xl': { vi: 'Xây lắp', en: 'Works / Construction', ja: '建設・工事' },
      'tư vấn': { vi: 'Tư vấn', en: 'Consulting', ja: 'コンサルティング' },
      'tv': { vi: 'Tư vấn', en: 'Consulting', ja: 'コンサルティング' },
      'phi tư vấn': { vi: 'Phi tư vấn', en: 'Non-consulting Services', ja: '非コンサルティング' },
      'ptv': { vi: 'Phi tư vấn', en: 'Non-consulting Services', ja: '非コンサルティング' },
      'hỗn hợp': { vi: 'Hỗn hợp', en: 'Mixed', ja: '複合' },
      'hon': { vi: 'Hỗn hợp', en: 'Mixed', ja: '複合' },
      'thuốc': { vi: 'Thuốc', en: 'Pharmaceuticals', ja: '医薬品' },
      'thuoc': { vi: 'Thuốc', en: 'Pharmaceuticals', ja: '医薬品' },
    },
    bidForms: {
      'đấu thầu rộng rãi': { vi: 'Đấu thầu rộng rãi', en: 'Open Bidding', ja: '一般競争入札' },
      'dtrr': { vi: 'Đấu thầu rộng rãi', en: 'Open Bidding', ja: '一般競争入札' },
      'đấu thầu hạn chế': { vi: 'Đấu thầu hạn chế', en: 'Limited Bidding', ja: '指名競争入札' },
      'dthc': { vi: 'Đấu thầu hạn chế', en: 'Limited Bidding', ja: '指名競争入札' },
      'chào hàng cạnh tranh': { vi: 'Chào hàng cạnh tranh', en: 'Request for Quotation', ja: '見積合わせ競争' },
      'chct': { vi: 'Chào hàng cạnh tranh', en: 'Request for Quotation', ja: '見積合わせ競争' },
      'chào hàng cạnh tranh rút gọn': { vi: 'Chào hàng cạnh tranh rút gọn', en: 'Simplified Quotation', ja: '簡易見積合わせ' },
      'chct_rg': { vi: 'Chào hàng cạnh tranh rút gọn', en: 'Simplified Quotation', ja: '簡易見積合わせ' },
      'chỉ định thầu': { vi: 'Chỉ định thầu', en: 'Direct Contracting', ja: '随意契約' },
      'cdt': { vi: 'Chỉ định thầu', en: 'Direct Contracting', ja: '随意契約' },
      'chỉ định thầu rút gọn': { vi: 'Chỉ định thầu rút gọn', en: 'Simplified Direct Contracting', ja: '簡易随意契約' },
      'cdtrg': { vi: 'Chỉ định thầu rút gọn', en: 'Simplified Direct Contracting', ja: '簡易随意契約' },
      'mua sắm trực tiếp': { vi: 'Mua sắm trực tiếp', en: 'Direct Procurement', ja: '直接調達' },
      'mstt': { vi: 'Mua sắm trực tiếp', en: 'Direct Procurement', ja: '直接調達' },
      'tự thực hiện': { vi: 'Tự thực hiện', en: 'Self-implementation', ja: '自己実施' },
      'tth': { vi: 'Tự thực hiện', en: 'Self-implementation', ja: '自己実施' },
      'lựa chọn nhà thầu trong trường hợp đặc biệt': { vi: 'Lựa chọn nhà thầu đặc biệt', en: 'Special Case Selection', ja: '特別事例選定' },
    },
    bidModes: {
      'một giai đoạn một túi hồ sơ': { vi: 'Một giai đoạn một túi hồ sơ', en: 'Single-stage single-envelope', ja: '一段階一封筒方式' },
      '1_mths': { vi: 'Một giai đoạn một túi hồ sơ', en: 'Single-stage single-envelope', ja: '一段階一封筒方式' },
      'một giai đoạn hai túi hồ sơ': { vi: 'Một giai đoạn hai túi hồ sơ', en: 'Single-stage two-envelope', ja: '一段階二封筒方式' },
      '1_2ths': { vi: 'Một giai đoạn hai túi hồ sơ', en: 'Single-stage two-envelope', ja: '一段階二封筒方式' },
      'hai giai đoạn một túi hồ sơ': { vi: 'Hai giai đoạn một túi hồ sơ', en: 'Two-stage single-envelope', ja: '二段階一封筒方式' },
      '2_mths': { vi: 'Hai giai đoạn một túi hồ sơ', en: 'Two-stage single-envelope', ja: '二段階一封筒方式' },
      'hai giai đoạn hai túi hồ sơ': { vi: 'Hai giai đoạn hai túi hồ sơ', en: 'Two-stage two-envelope', ja: '二段階二封筒方式' },
      '2_2ths': { vi: 'Hai giai đoạn hai túi hồ sơ', en: 'Two-stage two-envelope', ja: '二段階二封筒方式' },
    },
    contractTypes: {
      'trọn gói': { vi: 'Trọn gói', en: 'Lump sum', ja: '総額一括請負（ランプサム）' },
      'tg': { vi: 'Trọn gói', en: 'Lump sum', ja: '総額一括請負（ランプサム）' },
      'đơn giá cố định': { vi: 'Đơn giá cố định', en: 'Fixed unit price', ja: '固定単価契約' },
      'dgcd': { vi: 'Đơn giá cố định', en: 'Fixed unit price', ja: '固定単価契約' },
      'đơn giá điều chỉnh': { vi: 'Đơn giá điều chỉnh', en: 'Adjustable unit price', ja: '変動単価契約' },
      'dgdc': { vi: 'Đơn giá điều chỉnh', en: 'Adjustable unit price', ja: '変動単価契約' },
      'theo thời gian': { vi: 'Theo thời gian', en: 'Time-based', ja: 'タイムベース契約' },
      'tgia': { vi: 'Theo thời gian', en: 'Time-based', ja: 'タイムベース契約' },
      'theo kết quả đầu ra': { vi: 'Theo kết quả đầu ra', en: 'Output-based', ja: '成果連動型契約' },
      'hhkq': { vi: 'Theo kết quả đầu ra', en: 'Output-based', ja: '成果連動型契約' },
    },
    planTypes: {
      'chi thường xuyên': { vi: 'Chi thường xuyên', en: 'Recurrent expenditure', ja: '経常支出' },
      'tx': { vi: 'Chi thường xuyên', en: 'Recurrent expenditure', ja: '経常支出' },
      'đầu tư phát triển': { vi: 'Đầu tư phát triển', en: 'Development investment', ja: '開発投資' },
      'dtpt': { vi: 'Đầu tư phát triển', en: 'Development investment', ja: '開発投資' },
      'khác': { vi: 'Khác', en: 'Other', ja: 'その他' },
      'khac': { vi: 'Khác', en: 'Other', ja: 'その他' },
    },
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
  // Kiểm `typeof localStorage !== 'undefined'` là chưa đủ: Node 22+ (và Node 25 chạy bộ test
  // i18n) có sẵn biến `localStorage` nhưng KHÔNG có getItem khi chưa bật kho web, nên gọi
  // thẳng là ném TypeError. Trình duyệt ở chế độ riêng tư cũng có thể ném khi đọc.
  let lang = 'vi';
  try {
    lang =
      (typeof localStorage?.getItem === 'function' &&
        (localStorage.getItem('app_lang') || localStorage.getItem('news_lang'))) ||
      'vi';
  } catch {
    lang = 'vi';
  }
  return DICT[lang]?.[key] ?? DICT.vi?.[key] ?? fallback ?? key;
}

/**
 * Dịch các giá trị phân loại đấu thầu (lĩnh vực, hình thức lựa chọn, phương thức, hợp đồng, kế hoạch)
 */
export function translateProcurementValue(category, value, lang = 'vi') {
  if (!value) return value;
  const key = String(value).trim().toLowerCase();
  const cat = TRANSLATIONS.procurement?.[category];
  if (cat && cat[key]) {
    return cat[key][lang] || cat[key].vi || value;
  }
  return value;
}

/**
 * Bản địa hóa khoảng thời gian: '8 tháng' -> '8 ヶ月', '90 ngày' -> '90 日'
 */
export function localizePeriod(periodStr, lang = 'vi') {
  if (!periodStr) return periodStr;
  const m = String(periodStr).match(/^(\d+)\s*(tháng|ngày|năm|thang|ngay|nam|months?|days?|years?|日|ヶ月|年)/i);
  if (!m) return periodStr;
  const num = m[1];
  const unit = m[2].toLowerCase();
  if (unit.startsWith('tháng') || unit.startsWith('thang') || unit.startsWith('month') || unit === 'ヶ月') {
    if (lang === 'ja') return `${num} ヶ月`;
    if (lang === 'en') return `${num} ${num === '1' ? 'month' : 'months'}`;
    return `${num} tháng`;
  }
  if (unit.startsWith('ngày') || unit.startsWith('ngay') || unit.startsWith('day') || unit === '日') {
    if (lang === 'ja') return `${num} 日`;
    if (lang === 'en') return `${num} ${num === '1' ? 'day' : 'days'}`;
    return `${num} ngày`;
  }
  if (unit.startsWith('năm') || unit.startsWith('nam') || unit.startsWith('year') || unit === '年') {
    if (lang === 'ja') return `${num} 年`;
    if (lang === 'en') return `${num} ${num === '1' ? 'year' : 'years'}`;
    return `${num} năm`;
  }
  return periodStr;
}

/**
 * Dich quoc gia (ten tieng Anh hoac ma ISO) sang ngon ngu hien tai
 */
export function translateCountry(country, lang = 'vi') {
  if (!country || country === 'N/A') return country;
  const raw = String(country).trim();
  const rawUpper = raw.toUpperCase();
  if (TRANSLATIONS.countries[rawUpper]) {
    return TRANSLATIONS.countries[rawUpper][lang] || TRANSLATIONS.countries[rawUpper].vi || raw;
  }
  const rawLower = raw.toLowerCase();
  for (const info of Object.values(TRANSLATIONS.countries)) {
    if (
      (info.en && info.en.toLowerCase() === rawLower) ||
      (info.vi && info.vi.toLowerCase() === rawLower) ||
      (info.ja && info.ja.toLowerCase() === rawLower)
    ) {
      return info[lang] || info.vi || raw;
    }
  }
  return raw;
}

/**
 * Dich trang thai du an (Active, Pipeline, Closed, etc.)
 */
export function translateStatus(status, lang = 'vi') {
  if (!status) return status;
  const s = String(status).trim().toLowerCase();
  if (TRANSLATIONS.statuses?.[s]) {
    return TRANSLATIONS.statuses[s][lang] || TRANSLATIONS.statuses[s].vi || status;
  }
  if (s.includes('active') || s.includes('approved') || s.includes('trien khai') || s.includes('thuc hien') || s.includes('dang')) {
    return lang === 'ja' ? '進行中' : lang === 'en' ? 'Active' : 'Đang triển khai';
  }
  if (s.includes('closed') || s.includes('completed') || s.includes('dong') || s.includes('hoan thanh')) {
    return lang === 'ja' ? '完了' : lang === 'en' ? 'Closed' : 'Đã đóng';
  }
  if (s.includes('pipeline') || s.includes('chuan bi')) {
    return lang === 'ja' ? 'パイプライン' : lang === 'en' ? 'Pipeline' : 'Đang chuẩn bị';
  }
  if (s.includes('proposed') || s.includes('concept') || s.includes('de xuat')) {
    return lang === 'ja' ? '提案中' : lang === 'en' ? 'Proposed' : 'Đề xuất';
  }
  if (s.includes('dropped') || s.includes('huy')) {
    return lang === 'ja' ? '中止' : lang === 'en' ? 'Dropped' : 'Hủy bỏ';
  }
  return status;
}

/**
 * Dich giai doan (World Bank Stage)
 */
export function translateStage(stage, lang = 'vi') {
  if (!stage || stage === 'N/A') return stage;
  const s = String(stage).trim().toLowerCase();
  if (s.includes('ois sign-off') || s.includes('ois')) {
    return lang === 'ja' ? 'OIS承認' : lang === 'en' ? 'OIS Sign-off' : 'Ký duyệt OIS';
  }
  if (s.includes('concept')) {
    return lang === 'ja' ? '構想審査' : lang === 'en' ? 'Concept Review' : 'Đánh giá ý tưởng';
  }
  if (s.includes('appraisal')) {
    return lang === 'ja' ? '審査・評価' : lang === 'en' ? 'Appraisal Review' : 'Thẩm định';
  }
  if (s.includes('negotiation')) {
    return lang === 'ja' ? '交渉段階' : lang === 'en' ? 'Negotiations' : 'Đàm phán';
  }
  if (s.includes('board') || s.includes('approval')) {
    return lang === 'ja' ? '理事会承認' : lang === 'en' ? 'Board Approval' : 'Ban điều hành duyệt';
  }
  if (s.includes('sign')) {
    return lang === 'ja' ? '署名済' : lang === 'en' ? 'Signing' : 'Ký kết';
  }
  if (s.includes('effective')) {
    return lang === 'ja' ? '発効' : lang === 'en' ? 'Effectiveness' : 'Có hiệu lực';
  }
  if (s.includes('closing') || s.includes('closed')) {
    return lang === 'ja' ? '完了・終了' : lang === 'en' ? 'Closed' : 'Hoàn tất';
  }
  return stage;
}

/**
 * Dich nganh / linh vuc (Sectors & Procurement Fields)
 */
export function translateSector(sector, lang = 'vi') {
  if (!sector || sector === 'N/A') return sector;
  let clean = String(sector).trim().replace(/\s*\/\s*$/, '');
  const lower = clean.toLowerCase();

  // ADB / World Bank main sectors
  if (lower.startsWith('agriculture') || lower.includes('nong nghiep') || lower.includes('nông nghiệp')) {
    return lang === 'ja' ? '農業・天然資源・農村開発' : lang === 'en' ? 'Agriculture & Rural Development' : 'Nông nghiệp, tài nguyên & PTNT';
  }
  if (lower.startsWith('energy') || lower.includes('nang luong') || lower.includes('năng lượng')) {
    return lang === 'ja' ? 'エネルギー' : lang === 'en' ? 'Energy' : 'Năng lượng';
  }
  if (lower.startsWith('transport') || lower.includes('giao thong') || lower.includes('giao thông')) {
    return lang === 'ja' ? '交通・運輸インフラ' : lang === 'en' ? 'Transport' : 'Giao thông vận tải';
  }
  if (lower.startsWith('water and other urban') || lower.startsWith('water') || lower.includes('cap thoat nuoc') || lower.includes('cấp thoát nước')) {
    return lang === 'ja' ? '水資源・都市インフラ' : lang === 'en' ? 'Water & Urban Infrastructure' : 'Cấp thoát nước & Đô thị';
  }
  if (lower.startsWith('industry and trade') || lower.startsWith('industry') || lower.includes('cong nghiep') || lower.includes('công nghiệp')) {
    return lang === 'ja' ? '産業・貿易' : lang === 'en' ? 'Industry & Trade' : 'Công nghiệp & Thương mại';
  }
  if (lower.startsWith('public sector') || lower.startsWith('public admin') || lower.includes('quan ly cong') || lower.includes('quản lý công')) {
    return lang === 'ja' ? '公共部門管理' : lang === 'en' ? 'Public Sector Management' : 'Quản lý công';
  }
  if (lower.startsWith('finance') || lower.includes('tai chinh') || lower.includes('tài chính')) {
    return lang === 'ja' ? '金融・財務' : lang === 'en' ? 'Finance' : 'Tài chính - Ngân hàng';
  }
  if (lower.startsWith('education') || lower.includes('giao duc') || lower.includes('giáo dục')) {
    return lang === 'ja' ? '教育' : lang === 'en' ? 'Education' : 'Giáo dục';
  }
  if (lower.startsWith('health') || lower.includes('y te') || lower.includes('y tế')) {
    return lang === 'ja' ? '保健・医療' : lang === 'en' ? 'Health' : 'Y tế';
  }
  if (lower.startsWith('information and communication') || lower.includes('ict') || lower.includes('cong nghe') || lower.includes('công nghệ')) {
    return lang === 'ja' ? '情報通信技術 (ICT)' : lang === 'en' ? 'Information & Communications' : 'Công nghệ thông tin & Viễn thông';
  }

  // Vietnam Procurement Fields
  if (lower.includes('mua sam cong') || lower.includes('mua sắm công') || lower === 'muasamcong') {
    return lang === 'ja' ? '公共調達' : lang === 'en' ? 'Public Procurement' : 'Mua sắm công';
  }
  if (lower.includes('duong sat') || lower.includes('đường sắt')) {
    return lang === 'ja' ? '鉄道' : lang === 'en' ? 'Railways' : 'Đường sắt';
  }
  if (lower.includes('duong bo') || lower.includes('đường bộ')) {
    return lang === 'ja' ? '道路' : lang === 'en' ? 'Roads' : 'Đường bộ';
  }
  if (lower.includes('cau') || lower.includes('cầu')) {
    return lang === 'ja' ? '橋梁' : lang === 'en' ? 'Bridges' : 'Cầu';
  }
  if (lower.includes('cang') || lower.includes('cảng')) {
    return lang === 'ja' ? '港湾' : lang === 'en' ? 'Seaports' : 'Cảng biển';
  }
  if (lower.includes('hang khong') || lower.includes('hàng không')) {
    return lang === 'ja' ? '航空' : lang === 'en' ? 'Aviation' : 'Hàng không';
  }
  if (lower.includes('xay lap') || lower.includes('xây lắp') || lower === 'xl') {
    return lang === 'ja' ? '建設工事' : lang === 'en' ? 'Works / Construction' : 'Xây lắp';
  }
  if (lower.includes('hang hoa') || lower.includes('hàng hóa') || lower === 'hh') {
    return lang === 'ja' ? '物品' : lang === 'en' ? 'Goods' : 'Hàng hóa';
  }
  if (lower.includes('phi tu van') || lower.includes('phi tư vấn') || lower === 'ptv') {
    return lang === 'ja' ? '非コンサルティング' : lang === 'en' ? 'Non-consulting' : 'Phi tư vấn';
  }
  if (lower.includes('tu van') || lower.includes('tư vấn') || lower === 'tv') {
    return lang === 'ja' ? 'コンサルティング' : lang === 'en' ? 'Consulting' : 'Tư vấn';
  }
  if (lower.includes('hon hop') || lower.includes('hỗn hợp') || lower === 'hon') {
    return lang === 'ja' ? '混合' : lang === 'en' ? 'Mixed' : 'Hỗn hợp';
  }
  if (lower.includes('thuoc') || lower.includes('thuốc')) {
    return lang === 'ja' ? '医薬品' : lang === 'en' ? 'Pharmaceuticals' : 'Thuốc';
  }

  // Categories fallback
  if (TRANSLATIONS.categories?.[lower]) {
    return TRANSLATIONS.categories[lower][lang] || TRANSLATIONS.categories[lower].vi || clean;
  }

  return clean;
}
