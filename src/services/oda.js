// src/services/oda.js
// Dự án ODA (ADB / World Bank) + mua sắm công (TBMT / KHLCNT) cho bản đồ Dashboard.
import api from './api';
import { apiCache } from '../utils/apiCache';

export const odaService = {
  /**
   * Danh sách dự án ODA.
   * @param {{ source?: 'adb'|'worldbank', country?, status?, sector?, q?, page?, size? }} params
   * @param {boolean} force - Có bỏ qua cache không
   */
  async getProjects(params = {}, force = false) {
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
  async getProcurement(params = {}, force = false) {
    const cacheKey = `oda:procurement:${JSON.stringify(params)}`;
    if (!force) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }
    const { data } = await api.get('/procurement', { params: { size: 200, ...params } });
    apiCache.set(cacheKey, data, 60000); // cache 60 giây
    return data; // ProcurementPage
  },
};

