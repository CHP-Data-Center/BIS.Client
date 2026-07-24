// src/services/oda.js
// Dự án ODA (ADB / World Bank) + mua sắm công (TBMT / KHLCNT) cho bản đồ Dashboard.
import api from './api';

export const odaService = {
  /**
   * Danh sách dự án ODA.
   * @param {{ source?: 'adb'|'worldbank', country?, status?, sector?, q?, page?, size? }} params
   */
  async getProjects(params = {}) {
    const { data } = await api.get('/oda-projects', { params: { size: 200, ...params } });
    return data; // OdaProjectPage: { items, total, page, size }
  },

  /**
   * Mua sắm công.
   * @param {{ kind?: 'notice'|'plan', status?, sector?, q?, page?, size? }} params
   */
  async getProcurement(params = {}) {
    const { data } = await api.get('/procurement', { params: { size: 200, ...params } });
    return data; // ProcurementPage
  },
};
