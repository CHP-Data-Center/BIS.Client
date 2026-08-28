// src/services/potential.js
// Dự án tiềm năng theo lĩnh vực + cấu hình lĩnh vực người dùng theo dõi.
import api from './api';

/** Khóa danh sách ổn định cho danh sách gộp nhiều nguồn.
 *  `ref` KHÔNG duy nhất một mình: dự án ODA id=1 và bài viết id=1 cùng cho ref="1". */
export const itemKey = (it) => `${it.kind}:${it.ref}`;

/** Nhãn hiển thị cho từng loại nguồn. */
export const KIND_LABELS = {
  procurement: { vi: 'Gói thầu', color: '#3b82f6' },
  oda: { vi: 'Dự án ODA', color: '#10b981' },
  article: { vi: 'Tin báo chí', color: '#f59e0b' },
};

export const potentialService = {
  /** Danh mục lĩnh vực + số mục tiềm năng mỗi lĩnh vực */
  async getSectors() {
    const { data } = await api.get('/sectors');
    return data; // SectorOut[]
  },

  /**
   * Danh sách dự án tiềm năng.
   * Bỏ trống `sectors` -> backend tự dùng lĩnh vực người dùng đang theo dõi.
   */
  async list({ sectors, kinds, minAmount, page = 1, size = 20 } = {}) {
    const params = { page, size };
    if (sectors?.length) params.sectors = sectors.join(',');
    if (kinds?.length) params.kinds = kinds.join(',');
    if (minAmount) params.min_amount = minAmount;
    const { data } = await api.get('/potential-projects', { params });
    return data; // { items, total, page, size, sectors_applied }
  },

  /** Lĩnh vực đang theo dõi + danh mục đầy đủ (không phải gọi thêm /sectors) */
  async getWatchedSectors() {
    const { data } = await api.get('/me/sectors');
    return data; // { sectors, available }
  },

  /** Thứ tự mảng được giữ nguyên — coi là thứ tự ưu tiên hiển thị */
  async setWatchedSectors(slugs) {
    const { data } = await api.put('/me/sectors', { sectors: slugs });
    return data;
  },
};
