// src/services/potential.js
// Dự án tiềm năng theo lĩnh vực + cấu hình lĩnh vực người dùng theo dõi.
import api from './api';
import { apiCache } from '../utils/apiCache';

/** Khóa danh sách ổn định cho danh sách gộp nhiều nguồn.
 *  `ref` KHÔNG duy nhất một mình: dự án ODA id=1 và bài viết id=1 cùng cho ref="1". */
export const itemKey = (it) => `${it.kind}:${it.ref}`;

/** Nhãn hiển thị cho từng loại nguồn. */
export const KIND_LABELS = {
  procurement: { vi: 'Gói thầu', color: '#3b82f6' },
  oda: { vi: 'Dự án ODA', color: '#10b981' },
  article: { vi: 'Tin báo chí', color: '#f59e0b' },
};

const TTL_LIST = 180000; // 3 phút
const TTL_SECTORS = 300000; // 5 phút

export const potentialService = {
  /** Danh mục lĩnh vực + số mục tiềm năng mỗi lĩnh vực */
  async getSectors(forceFresh = false) {
    const cacheKey = 'potential_sectors_all';
    if (!forceFresh) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }
    const { data } = await api.get('/sectors');
    apiCache.set(cacheKey, data, TTL_SECTORS);
    return data; // SectorOut[]
  },

  /**
   * Danh sách dự án tiềm năng (có cache Client để chuyển tab không bị load lại)
   */
  async list({ sectors, kinds, minAmount, page = 1, size = 8, forceFresh = false } = {}) {
    const cacheKey = `potential_list_${(sectors || []).sort().join(',')}_${(kinds || []).sort().join(',')}_${minAmount || 0}_${page}_${size}`;
    if (!forceFresh) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }

    const params = { page, size };
    if (sectors?.length) params.sectors = sectors.join(',');
    if (kinds?.length) params.kinds = kinds.join(',');
    if (minAmount) params.min_amount = minAmount;

    const { data } = await api.get('/potential-projects', { params });
    apiCache.set(cacheKey, data, TTL_LIST);
    return data; // { items, total, page, size, sectors_applied }
  },

  /** Lấy nhanh từ cache nếu có (trả về null nếu chưa có) */
  getCachedList({ sectors, kinds, minAmount, page = 1, size = 8 } = {}) {
    const cacheKey = `potential_list_${(sectors || []).sort().join(',')}_${(kinds || []).sort().join(',')}_${minAmount || 0}_${page}_${size}`;
    return apiCache.get(cacheKey);
  },

  /** Lĩnh vực đang theo dõi + danh mục đầy đủ */
  async getWatchedSectors(forceFresh = false) {
    const cacheKey = 'potential_me_sectors';
    if (!forceFresh) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }
    const { data } = await api.get('/me/sectors');
    apiCache.set(cacheKey, data, TTL_SECTORS);
    return data; // { sectors, available }
  },

  /** Lấy nhanh watched sectors từ cache */
  getCachedWatchedSectors() {
    return apiCache.get('potential_me_sectors');
  },

  /** Cập nhật lĩnh vực theo dõi -> xóa cache danh sách */
  async setWatchedSectors(slugs) {
    const { data } = await api.put('/me/sectors', { sectors: slugs });
    apiCache.set('potential_me_sectors', data, TTL_SECTORS);
    // Xóa cache danh sách để nạp dữ liệu mới
    this.invalidateListCache();
    return data;
  },

  /** Xóa sạch cache danh sách dự án tiềm năng */
  invalidateListCache() {
    // Xóa các key bắt đầu bằng potential_list_
    try {
      if (apiCache.cache) {
        for (const k of apiCache.cache.keys()) {
          if (k.startsWith('potential_list_')) {
            apiCache.clear(k);
          }
        }
      }
    } catch { /* ignore */ }
  }
};
