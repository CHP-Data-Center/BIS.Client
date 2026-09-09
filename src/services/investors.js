import api from './api';

export const investorsService = {
  /** Lấy tổng quan số liệu và danh sách chủ đầu tư theo dõi */
  async getSummary() {
    const { data } = await api.get('/investors/summary');
    return data;
  },

  /** Danh sách chủ đầu tư có bộ lọc */
  async getInvestors({ status, province, q } = {}) {
    const params = {};
    if (status) params.status = status;
    if (province) params.province = province;
    if (q) params.q = q;
    const { data } = await api.get('/investors', { params });
    return data;
  },

  /** Chi tiết hồ sơ 360° của chủ đầu tư */
  async getProfile360(id) {
    const { data } = await api.get(`/investors/${id}/profile360`);
    return data;
  },

  /** Tạo mới chủ đầu tư theo dõi */
  async createInvestor(payload) {
    const { data } = await api.post('/investors', payload);
    return data;
  },

  /** Cập nhật thông tin chủ đầu tư */
  async updateInvestor(id, payload) {
    const { data } = await api.patch(`/investors/${id}`, payload);
    return data;
  },

  /** Xóa chủ đầu tư khỏi danh sách theo dõi */
  async deleteInvestor(id) {
    await api.delete(`/investors/${id}`);
  },

  /** Gợi ý chủ đầu tư từ hệ thống e-GP */
  async suggest(q) {
    const { data } = await api.get('/investors/suggest', { params: { q } });
    return data;
  },
};
