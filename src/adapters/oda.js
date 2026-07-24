// src/adapters/oda.js
// Map dữ liệu backend (/oda-projects, /procurement) -> shape item của bản đồ Dashboard.
// Map ưu tiên item.lat/item.lng (backend đã có toạ độ); id là CHUỖI (popup dùng .toLowerCase()).

const PROC_TYPE = { notice: 'TB Mời thầu', plan: 'Kế hoạch thầu' };

/** Một dự án ODA (ADB/WB) -> item bản đồ. */
export function adaptOdaProject(p) {
  const origId = p.external_id || p.id;
  const projectUrl = p.url || (p.source_org === 'worldbank'
    ? `https://projects.worldbank.org/en/projects-operations/project-detail/${origId}`
    : `https://www.adb.org/projects/${origId}/main`);

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
    lat: p.lat,
    lng: p.lng,
  };
}

/** Một gói mua sắm công -> item bản đồ (nguồn 'dauthau'). */
export function adaptProcurement(p) {
  const origId = p.id;
  const procUrl = p.url || `https://dauthau.asia/tim-kiem/?q=${encodeURIComponent(p.id)}`;

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
    lat: p.lat,
    lng: p.lng,
  };
}

/** Một dự án ODA -> shape thẻ NewsCard (trang list ADB/World Bank). */
export function adaptOdaToCard(p) {
  const bits = [p.country, p.status].filter(Boolean).join(' · ');
  const origId = p.external_id || p.id;
  const projectUrl = p.url || (p.source_org === 'worldbank'
    ? `https://projects.worldbank.org/en/projects-operations/project-detail/${origId}`
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

/** Gộp oda + procurement thành mảng item bản đồ; chỉ giữ item có toạ độ. */
export function buildMapItems(odaItems = [], procItems = []) {
  return [
    ...odaItems.map(adaptOdaProject),
    ...procItems.map(adaptProcurement),
  ].filter((i) => i.lat != null && i.lng != null);
}
