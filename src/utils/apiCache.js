// src/utils/apiCache.js
/**
 * Utility quản lý cache bộ nhớ đệm nhẹ phía Client cho các API GET ít thay đổi
 * (ví dụ: Thống kê tổng quan, dữ liệu bản đồ ODA, danh mục).
 * Hỗ trợ lưu persistent localStorage để khi F5 trang web không bị nháy/mất dữ liệu.
 */

const STORAGE_PREFIX = 'bis_apicache_';

class ApiCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Lấy giá trị từ cache (Memory -> localStorage) nếu chưa hết hạn
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    // 1. Check in-memory cache
    const item = this.cache.get(key);
    if (item) {
      if (Date.now() > item.expiry) {
        this.cache.delete(key);
        try { localStorage.removeItem(STORAGE_PREFIX + key); } catch (e) { /* ignore */ }
        return null;
      }
      return item.data;
    }

    // 2. Check localStorage persistence
    try {
      const storedStr = localStorage.getItem(STORAGE_PREFIX + key);
      if (storedStr) {
        const stored = JSON.parse(storedStr);
        if (Date.now() <= stored.expiry) {
          // Hydrate memory cache
          this.cache.set(key, stored);
          return stored.data;
        } else {
          localStorage.removeItem(STORAGE_PREFIX + key);
        }
      }
    } catch (e) {
      // Storage error or JSON parse error
    }

    return null;
  }

  /**
   * Lưu giá trị vào cache với thời gian sống (TTL)
   * @param {string} key
   * @param {any} data
   * @param {number} ttlMs - Thời gian sống tính bằng milliseconds (mặc định 60s)
   */
  set(key, data, ttlMs = 60000) {
    const item = {
      data,
      expiry: Date.now() + ttlMs,
    };

    // Save memory
    this.cache.set(key, item);

    // Save localStorage
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(item));
    } catch (e) {
      // QuotaExceeded or disabled
    }
  }

  /**
   * Xóa một key cụ thể khỏi cache
   * @param {string} key
   */
  clear(key) {
    this.cache.delete(key);
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (e) { /* ignore */ }
  }

  /**
   * Xóa toàn bộ cache
   */
  clearAll() {
    this.cache.clear();
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) { /* ignore */ }
  }
}

export const apiCache = new ApiCache();

