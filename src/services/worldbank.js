// src/services/worldbank.js
import api from './api';

const WB_SAVED_KEY = 'saved_worldbank_projects';
const WB_PUBLIC_API = 'https://search.worldbank.org/api/v2/projects';

export const worldBankService = {
  /**
   * Trigger server-side crawling of World Bank projects into the database
   */
  async crawlProjects(rows = 500) {
    try {
      const res = await api.post('/oda/crawl-worldbank', null, { params: { rows } });
      return res.data;
    } catch (e) {
      console.warn('Direct crawl endpoint fallback error:', e);
      try {
        const res = await api.post('/admin/oda/crawl-worldbank', null, { params: { rows } });
        return res.data;
      } catch (err) {
        console.error('Failed to trigger World Bank crawl:', err);
        return { new: 0, updated: 0 };
      }
    }
  },

  /**
   * Fetch World Bank projects exclusively from local Server Database.
   * Direct fetching from World Bank in browser is disabled to preserve historical data in DB.
   */
  async fetchProjects(params = {}) {
    try {
      const res = await api.get('/oda-projects', {
        params: { source: 'worldbank', size: 5000, ...params },
      });
      const items = res.data?.items || [];
      return items.map((p) => {
        const totalAmt = p.amount_usd || (typeof p.amount === 'string' ? parseFloat(p.amount.replace(/[^0-9.]/g, '')) : p.amount) || 0;
        return {
          id: p.external_id || String(p.id),
          project_name: p.title || 'N/A',
          countryshortname: p.country || 'N/A',
          totalamt: totalAmt,
          grantamt: 0,
          totalCommitmentAmount: totalAmt,
          projectstatusdisplay: p.status || 'Active',
          boardapprovaldate: p.approval_date || null,
          proj_last_upd_date: p.last_updated_date || null,
          last_stage_reached_name: p.last_stage || 'N/A',
          ai_summary: p.ai_summary || null,
        };
      });
    } catch (e) {
      console.error('Lỗi khi lấy dữ liệu World Bank từ Database:', e);
      throw new Error('Không thể tải dữ liệu từ CSDL Server. Vui lòng thử lại sau.');
    }
  },

  /**
   * Get saved projects from localStorage / server
   */
  getSavedProjects() {
    try {
      const raw = localStorage.getItem(WB_SAVED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Toggle save/bookmark for a World Bank project
   */
  toggleSaveProject(project) {
    const saved = this.getSavedProjects();
    const existsIndex = saved.findIndex((p) => p.id === project.id);
    let updated;
    let isSavedNow;

    if (existsIndex >= 0) {
      updated = saved.filter((p) => p.id !== project.id);
      isSavedNow = false;
    } else {
      updated = [
        ...saved,
        {
          id: project.id,
          project_name: project.project_name,
          countryshortname: project.countryshortname,
          totalCommitmentAmount: project.totalCommitmentAmount,
          projectstatusdisplay: project.projectstatusdisplay,
          boardapprovaldate: project.boardapprovaldate,
          proj_last_upd_date: project.proj_last_upd_date,
          last_stage_reached_name: project.last_stage_reached_name,
          saved_at: new Date().toISOString(),
        },
      ];
      isSavedNow = true;
    }

    localStorage.setItem(WB_SAVED_KEY, JSON.stringify(updated));
    return { isSaved: isSavedNow, savedList: updated };
  },

  /**
   * Check if project is saved
   */
  isProjectSaved(projectId) {
    const saved = this.getSavedProjects();
    return saved.some((p) => p.id === projectId);
  },
};
