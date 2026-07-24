// src/adapters/oda.js
// Map dữ liệu backend (/oda-projects, /procurement) -> shape item của bản đồ Dashboard.
// Map ưu tiên item.lat/item.lng (backend đã có toạ độ); id là CHUỖI (popup dùng .toLowerCase()).

const PROC_TYPE = { notice: 'TB Mời thầu', plan: 'Kế hoạch thầu' };

/** Một dự án ODA (ADB/WB) -> item bản đồ. */
export function adaptOdaProject(p) {
  return {
    id: `${p.source_org}-${p.id}`,
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
    lat: p.lat,
    lng: p.lng,
  };
}

/** Một gói mua sắm công -> item bản đồ (nguồn 'dauthau'). */
export function adaptProcurement(p) {
  return {
    id: `proc-${p.id}`,
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
    lat: p.lat,
    lng: p.lng,
  };
}

/** Gộp oda + procurement thành mảng item bản đồ; chỉ giữ item có toạ độ. */
export function buildMapItems(odaItems = [], procItems = []) {
  return [
    ...odaItems.map(adaptOdaProject),
    ...procItems.map(adaptProcurement),
  ].filter((i) => i.lat != null && i.lng != null);
}
