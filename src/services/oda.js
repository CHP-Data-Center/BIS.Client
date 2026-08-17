// src/services/oda.js
// Dự án ODA (ADB / World Bank) + mua sắm công (TBMT / KHLCNT) cho bản đồ Dashboard.
import api from './api';
import { apiCache } from '../utils/apiCache';
import { currentLang } from './articles';

export const odaService = {
  /**
   * Danh sách dự án ODA.
   * @param {{ source?: 'adb'|'worldbank', country?, status?, sector?, q?, page?, size? }} params
   * @param {boolean} force - Có bỏ qua cache không
   */
  async getProjects(rawParams = {}, force = false) {
    // Tự gắn ngôn ngữ đang chọn (🌐) — tiêu đề dự án hiện bản dịch nếu có.
    const lang = currentLang();
    const params = 'lang' in rawParams || lang === 'en' ? rawParams : { ...rawParams, lang };
    const cacheKey = `oda:projects:${JSON.stringify(params)}`;
    if (!force) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }
    const { data } = await api.get('/oda-projects', { params: { size: 200, ...params } });
    apiCache.set(cacheKey, data, 60000); // cache 60 giây
    return data; // OdaProjectPage: { items, total, page, size }
  },

  /**
   * Mua sắm công.
   * @param {{ kind?: 'notice'|'plan', status?, sector?, q?, page?, size? }} params
   * @param {boolean} force - Có bỏ qua cache không
   */
  async getProcurement(rawParams = {}, force = false) {
    // Tự gắn ngôn ngữ đang chọn (🌐) — mọi trang gọi hàm này đều hiện tiêu đề đã dịch.
    const lang = currentLang();
    const params = 'lang' in rawParams || lang === 'vi' ? rawParams : { ...rawParams, lang };
    const cacheKey = `oda:procurement:${JSON.stringify(params)}`;
    if (!force) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }
    const { data } = await api.get('/procurement', { params: { size: 200, ...params } });
    apiCache.set(cacheKey, data, 60000); // cache 60 giây
    return data; // ProcurementPage
  },

  /**
   * Chi tiết 1 gói thầu (TBMT/KHLCNT) để hiển thị NGAY TRONG APP.
   * `details` đã được backend parse sẵn thành object; `detail_status`:
   *   ready = có chi tiết · missing = chưa lấy được · unavailable = không có link nguồn.
   * @param {string} id  Mã TBMT/KHLCNT
   * @param {{ enrich?: boolean }} opts  enrich=true: chưa có chi tiết thì lấy ngay (CHẬM)
   */
  async getProcurementDetail(id, { enrich = false } = {}) {
    const lang = currentLang();
    const params = { ...(enrich ? { enrich: true } : {}), ...(lang === 'vi' ? {} : { lang }) };
    // enrich phải mở trình duyệt nền phía server (~15-30s) → timeout riêng, vượt xa mặc định 15s.
    const { data } = await api.get(`/procurement/${encodeURIComponent(id)}`, {
      params,
      timeout: enrich ? 90000 : 20000,
    });
    return data; // ProcurementDetailOut
  },
};

