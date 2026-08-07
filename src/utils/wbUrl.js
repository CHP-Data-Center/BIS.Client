// Link tới trang CHI TIẾT dự án World Bank.
//
// Trang project-detail chính thức của WB mở được bình thường cho dự án thật. (Trước đây tưởng
// bị 403 — thực ra chỉ là WB throttle tạm thời khi bị gọi dồn dập lúc test, không phải chặn.)
//
// Hàm nhận: mã dự án ("P505244"), URL project-detail, HOẶC URL search cũ (từ DB/bookmark
// localStorage còn sót) — rút mã ra rồi dựng lại link chi tiết chuẩn.
export function worldBankProjectUrl(idOrUrl) {
  const s = String(idOrUrl || '').trim();
  let id = s;
  const mDetail = s.match(/project-detail\/([A-Za-z0-9-]+)/i);
  const mSearch = s.match(/[?&]q=([A-Za-z0-9-]+)/i);
  if (mDetail) id = mDetail[1];
  else if (mSearch) id = mSearch[1];
  if (!id) return 'https://projects.worldbank.org/en/projects-operations/projects-list';
  return `https://projects.worldbank.org/en/projects-operations/project-detail/${encodeURIComponent(id)}`;
}
