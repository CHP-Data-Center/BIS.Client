// src/services/categories.js
import api from './api';

export const categoriesService = {
  /** Danh sách categories dùng cho dropdown gán từ khóa */
  async getCategories() {
    const { data } = await api.get('/categories');
    return data; // CategoryOut[]
  },
};
