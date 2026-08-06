// src/adapters/oda.js
// Map dữ liệu backend (/oda-projects, /procurement) -> shape item của bản đồ Dashboard.
// Map ưu tiên item.lat/item.lng (backend đã có toạ độ); id là CHUỖI (popup dùng .toLowerCase()).

const PROC_TYPE = { notice: 'TB Mời thầu', plan: 'Kế hoạch thầu' };

const PROC_COORDS_FALLBACK = {
  'IB2600384477-00': [22.4809, 103.9755],
  'IB2600377917-00': [10.0341, 105.7838],
  'IB2600350334-00': [10.0341, 105.7838],
  'IB2600351150-00': [21.3860, 103.0230],
  'IB2600346536-00': [13.7829, 109.2196],
  'PL2600222922-00': [11.3354, 106.1097],
  'PL2600222852-00': [15.5100, 107.9700],
  'PL2600222858-00': [21.3400, 106.1800],
  'PL2600222808-00': [22.4809, 103.9755],
  'PL2600222691-00': [20.7100, 105.9500],
  'PL2600222664-00': [18.6800, 105.6800],
  'PL2600126771-01': [11.3100, 106.1000],
};

const VIETNAM_PROVINCES = [
  { keywords: ['hà nội', 'hanoi', 'ha noi'], coords: [21.0285, 105.8542] },
  { keywords: ['hồ chí minh', 'tphcm', 'hcm', 'sài gòn', 'saigon'], coords: [10.8231, 106.6297] },
  { keywords: ['đà nẵng', 'da nang'], coords: [16.0544, 108.2022] },
  { keywords: ['cần thơ', 'can tho'], coords: [10.0341, 105.7838] },
  { keywords: ['hải phòng', 'hai phong'], coords: [20.8449, 106.6881] },
  { keywords: ['lào cai', 'lao cai'], coords: [22.4809, 103.9755] },
  { keywords: ['tây ninh', 'tay ninh'], coords: [11.3100, 106.1000] },
  { keywords: ['quảng nam', 'quang nam'], coords: [15.5100, 107.9700] },
  { keywords: ['bắc giang', 'bac giang'], coords: [21.2731, 106.1946] },
  { keywords: ['nghệ an', 'nghe an'], coords: [18.6800, 105.6800] },
  { keywords: ['điện biên', 'dien bien'], coords: [21.3860, 103.0230] },
  { keywords: ['bình định', 'binh dinh'], coords: [13.7829, 109.2196] },
  { keywords: ['đồng nai', 'dong nai'], coords: [10.9574, 106.8427] },
  { keywords: ['khánh hòa', 'khanh hoa'], coords: [12.2388, 109.1967] },
  { keywords: ['thừa thiên huế', 'huế', 'hue'], coords: [16.4637, 107.5909] },
  { keywords: ['quảng ninh', 'quang ninh'], coords: [20.9599, 107.0425] },
  { keywords: ['thái nguyên', 'thai nguyen'], coords: [21.5928, 105.8442] },
  { keywords: ['thanh hóa', 'thanh hoa'], coords: [19.8067, 105.7851] },
  { keywords: ['lâm đồng', 'đà lạt', 'dalat'], coords: [11.9404, 108.4583] },
  { keywords: ['vũng tàu', 'vung tau', 'bà rịa'], coords: [10.4114, 107.1362] },
];

const COUNTRY_COORDS = {
  Vietnam: [21.0245, 105.8412],
  Philippines: [14.5995, 120.9842],
  Indonesia: [-6.2088, 106.8456],
  Thailand: [13.7563, 100.5018],
  Cambodia: [11.5564, 104.9282],
  'South Africa': [-25.7461, 28.1881],
  Tajikistan: [38.5598, 68.7738],
  Brazil: [-3.4653, -62.2159],
  Regional: [14.0583, 108.2772],
  GMS: [20.0522, 102.4999],
};

function getVietnamFallbackCoords(id, procuringEntity, title = '') {
  if (PROC_COORDS_FALLBACK[id]) return PROC_COORDS_FALLBACK[id];

  const text = (String(procuringEntity || '') + ' ' + String(title || '')).toLowerCase();
  for (const prov of VIETNAM_PROVINCES) {
    if (prov.keywords.some(kw => text.includes(kw))) {
      return prov.coords;
    }
  }

  const str = String(id || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % VIETNAM_PROVINCES.length;
  return VIETNAM_PROVINCES[idx].coords;
}

/** Một dự án ODA (ADB/WB) -> item bản đồ. */
export function adaptOdaProject(p) {
  const origId = p.external_id || p.id;
  const projectUrl = p.url || (p.source_org === 'worldbank'
    ? `https://www.worldbank.org/en/search?q=${encodeURIComponent(origId)}`
    : `https://www.adb.org/projects/${origId}/main`);

  let lat = p.lat;
  let lng = p.lng;
  if (lat == null || lng == null) {
    const fallback = COUNTRY_COORDS[p.country] || [15.0, 107.0];
    lat = fallback[0];
    lng = fallback[1];
  }

  return {
    id: `${p.source_org}-${p.id}`,
    original_id: origId,
    source: p.source_org, // 'adb' | 'worldbank' -> khớp sourceConfig
    type: p.source_org === 'adb' ? 'Dự án ADB' : 'Dự án World Bank',
    title: p.title,
    titleVi: p.title_vi || p.title,
    country: p.country,
    amount: p.amount,
    status: p.status,
    sector: p.sector,
    aiSummary: p.ai_summary,
    date: p.approval_date,
    url: projectUrl,
    lat,
    lng,
  };
}

/** Một gói mua sắm công -> item bản đồ (nguồn 'dauthau'). */
export function adaptProcurement(p) {
  const origId = p.id;
  const procUrl = p.url || `https://dauthau.asia/tim-kiem/?q=${encodeURIComponent(p.id)}`;
  const coords = (p.lat != null && p.lng != null)
    ? [p.lat, p.lng]
    : getVietnamFallbackCoords(p.id, p.procuring_entity, p.title);

  return {
    id: `proc-${p.id}`,
    original_id: origId,
    source: 'dauthau',
    type: PROC_TYPE[p.kind] || 'Đấu thầu',
    title: p.title,
    titleVi: p.title,
    country: 'Vietnam', // mua sắm công là nguồn trong nước
    amount: null,
    status: p.status,
    sector: p.sector || 'Transport',
    aiSummary: null,
    date: p.publish_date,
    url: procUrl,
    lat: coords[0],
    lng: coords[1],
  };
}

/** Một dự án ODA -> shape thẻ NewsCard (trang list ADB/World Bank). */
export function adaptOdaToCard(p) {
  const bits = [p.country, p.status].filter(Boolean).join(' · ');
  const origId = p.external_id || p.id;
  const projectUrl = p.url || (p.source_org === 'worldbank'
    ? `https://www.worldbank.org/en/search?q=${encodeURIComponent(origId)}`
    : `https://www.adb.org/projects/${origId}/main`);

  return {
    id: `${p.source_org}-${p.id}`, // chuỗi -> NewsCard bỏ qua bookmark an toàn
    original_id: origId,
    source: p.source_org, // 'adb' | 'worldbank' -> SOURCE_STYLE
    title: p.title,
    titleVi: p.title_vi || p.title,
    excerpt: bits || undefined,
    amount: p.amount,
    aiSummary: p.ai_summary,
    date: p.approval_date,
    url: projectUrl,
    is_local_project: true,
    local_key: p.source_org === 'worldbank' ? 'saved_worldbank_projects' : 'saved_adb_projects',
  };
}

/** Một gói mua sắm công -> shape thẻ NewsCard (trang Đấu Thầu Công). */
export function adaptProcToCard(p) {
  const bits = [
    p.procuring_entity,
    p.package_count ? `${p.package_count} gói` : null,
    p.status,
  ].filter(Boolean).join(' · ');
  const procUrl = p.url || `https://dauthau.asia/tim-kiem/?q=${encodeURIComponent(p.id)}`;

  return {
    id: `proc-${p.id}`,
    original_id: p.id,
    source: 'gov',
    title: p.title,
    titleVi: p.title,
    excerpt: bits || undefined,
    date: p.publish_date,
    url: procUrl,
    is_local_project: true,
    local_key: 'saved_procurement_items',
  };
}

/** Gộp oda + procurement thành mảng item bản đồ; chỉ giữ item có toạ độ hợp lệ. */
export function buildMapItems(odaItems = [], procItems = []) {
  return [
    ...odaItems.map(adaptOdaProject),
    ...procItems.map(adaptProcurement),
  ].filter((i) => i.lat != null && i.lng != null);
}

