// Dựng link cho gói thầu muasamcong (TBMT/KHLCNT).
//
// Vì sao phải gom về một chỗ: trước đây 7 nơi trong FE tự ghép URL từ `p.id`, và cả hai
// kiểu ghép đều dẫn tới trang lỗi:
//
//   1. https://muasamcong.mpi.gov.vn/web/guest/ket-qua-tim-kiem?keyword=<id>
//      -> 404 "Tài nguyên không được tìm thấy". Đường dẫn này đã bị gỡ khỏi cổng, không
//         phải do sai từ khoá: bỏ hậu tố phiên bản đi vẫn 404.
//   2. https://dauthau.asia/tim-kiem/?q=<id>
//      -> không kết nối được (curl trả 000).
//
// Link chi tiết thật của muasamcong có dạng
//   /web/guest/contractor-selection?...&notifyId=<UUID>&notifyNo=IB2600429542&...
// tức cần một UUID chỉ lấy được khi crawl trang, KHÔNG suy ra được từ mã TBMT. Nên
// nguyên tắc ở đây: dùng `url` đã crawl nếu có, còn không thì đưa vào trang chi tiết
// TRONG APP — tuyệt đối không bịa URL ngoài.

/**
 * Trang tra cứu thông tin đấu thầu của muasamcong.
 *
 * `?render=index` là BẮT BUỘC. Thiếu nó, cổng vẫn trả HTTP 200 nhưng portlet không dựng
 * được và trang chỉ hiện "egp-portal-contractor-selection-v2 tạm thời không có" — mã
 * trạng thái 200 ở đây gây hiểu nhầm là link tốt.
 *
 * Không kèm được từ khoá vào URL: ô tra cứu tìm phía client, URL không đổi sau khi tìm.
 * Vì vậy chỗ dùng nên kèm nút chép mã TBMT để người dùng dán vào ô "Số TBMT / Tên gói thầu".
 */
export const MUASAMCONG_SEARCH_URL =
  'https://muasamcong.mpi.gov.vn/web/guest/contractor-selection?render=index';

/**
 * Mã TBMT/KHLCNT hiển thị cho người dùng.
 *
 * `id` trong DB kèm hậu tố số phiên bản: `IB2600458335-01`. Mã thật in trên cổng là
 * `IB2600458335`, còn `01` nằm ở dòng riêng "Phiên bản thay đổi". Đem cả hậu tố đi tra
 * cứu thì không khớp mã nào.
 */
export function tbmtCode(id) {
  return String(id ?? '').replace(/-\d{1,2}$/, '');
}

/**
 * Nơi cần đi tới khi người dùng bấm vào một gói thầu.
 *
 * @returns {{href: string, external: boolean}} `external` = true thì mở tab mới,
 *          false thì điều hướng trong app bằng react-router.
 */
export function procurementLink(item) {
  const url = item?.url || item?.rawUrl;
  if (url) return { href: url, external: true };
  const id = item?.original_id ?? item?.id ?? '';
  return { href: `/procurement/${encodeURIComponent(id)}`, external: false };
}

/** Đường dẫn trang chi tiết trong app. */
export function procurementDetailPath(id) {
  return `/procurement/${encodeURIComponent(String(id ?? ''))}`;
}
