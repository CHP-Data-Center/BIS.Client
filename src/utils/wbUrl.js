// Trang project-detail của World Bank (projects.worldbank.org/.../project-detail/{id})
// trả 403 cho MỌI truy cập trực tiếp — WB chặn hotlink, kể cả browser thật. Vì vậy luôn
// forward sang trang TÌM KIẾM WB theo mã dự án; kết quả đầu tiên chính là dự án cần tìm.
//
// Hàm chấp nhận cả mã dự án ("P181090") lẫn URL project-detail cũ còn sót trong DB / bookmark
// localStorage, rút mã ra rồi dựng lại link tìm kiếm an toàn.
export function worldBankSearchUrl(idOrUrl) {
  const s = String(idOrUrl || '').trim();
  if (!s) return 'https://www.worldbank.org/en/search';
  const match = s.match(/project-detail\/([A-Za-z0-9-]+)/i);
  const id = match ? match[1] : s;
  return `https://www.worldbank.org/en/search?q=${encodeURIComponent(id)}`;
}
