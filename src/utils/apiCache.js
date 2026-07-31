// src/utils/apiCache.js
/**
 * Utility quản lý cache bộ nhớ đệm nhẹ phía Client cho các API GET ít thay đổi
 * (ví dụ: Thống kê tổng quan, dữ liệu bản đồ ODA, danh mục).
 */

class ApiCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Lấy giá trị từ cache nếu chưa hết hạn
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  /**
   * Lưu giá trị vào cache với thời gian sống (TTL)
   * @param {string} key
   * @param {any} data
   * @param {number} ttlMs - Thời gian sống tính bằng milliseconds (mặc định 60s)
   */
  set(key, data, ttlMs = 60000) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }

  /**
   * Xóa một key cụ thể khỏi cache
   * @param {string} key
   */
  clear(key) {
    this.cache.delete(key);
  }

  /**
   * Xóa toàn bộ cache
   */
  clearAll() {
    this.cache.clear();
  }
}

export const apiCache = new ApiCache();
