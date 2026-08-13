// src/services/adb.js
import api from './api';
import { apiCache } from '../utils/apiCache';

const ADB_SAVED_KEY = 'saved_adb_projects';

/** Parse details_json an toàn -> object hoặc null. */
function safeParse(s) {
  if (!s) return null;
  if (typeof s === 'object') return s;
  try { return JSON.parse(s); } catch { return null; }
}

export const adbService = {
  /**
   * Lấy danh sách dự án ADB từ Database Server
   */
  async fetchProjects(params = {}, force = false) {
    const cacheKey = `adb:projects:${JSON.stringify(params)}`;
    if (!force) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }
    try {
      const res = await api.get('/oda-projects', {
        params: { source: 'adb', size: 5000, ...params },
      });
      const items = res.data?.items || [];
      const mapped = items.map((p) => {
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
          external_id: p.external_id || String(p.id),
          url: p.url || p.rawUrl || (p.external_id ? `https://www.adb.org/projects/${p.external_id}/main` : null),
          sector: p.sector || null,
          region: p.region || null,
          development_objective: p.development_objective || null,
          team_leader: p.team_leader || null,
          borrower: p.borrower || null,
          implementing_agency: p.implementing_agency || null,
          lending_instrument: p.lending_instrument || null,
          closing_date: p.closing_date || null,
          fiscal_year: p.fiscal_year || null,
          total_cost: p.total_cost || null,
          amount_display: p.amount || null,
          details: safeParse(p.details_json),
        };
      });
      apiCache.set(cacheKey, mapped, 60000);
      return mapped;
    } catch (e) {
      console.error('Lỗi khi lấy dữ liệu ADB từ Database:', e);
      throw new Error('Không thể tải dữ liệu ADB từ Server. Vui lòng thử lại sau.');
    }
  },

  /**
   * Lấy chi tiết 1 dự án ADB theo ID / external_id
   */
  async getProjectById(id) {
    if (!id) return null;
    const targetId = String(id).trim().toLowerCase();
    try {
      const all = await this.fetchProjects();
      const found = all.find(p => 
        String(p.id).toLowerCase() === targetId || 
        String(p.external_id || '').toLowerCase() === targetId
      );
      if (found) return found;

      const res = await api.get('/oda-projects', {
        params: { source: 'adb', q: id, size: 20 },
      });
      const items = res.data?.items || [];
      const item = items.find(p => 
        String(p.external_id || p.id).toLowerCase() === targetId
      ) || items[0];

      if (item) {
        const totalAmt = item.amount_usd || (typeof item.amount === 'string' ? parseFloat(item.amount.replace(/[^0-9.]/g, '')) : item.amount) || 0;
        return {
          id: item.external_id || String(item.id),
          project_name: item.title || 'N/A',
          countryshortname: item.country || 'N/A',
          totalamt: totalAmt,
          totalCommitmentAmount: totalAmt,
          projectstatusdisplay: item.status || 'Active',
          boardapprovaldate: item.approval_date || null,
          proj_last_upd_date: item.last_updated_date || null,
          last_stage_reached_name: item.last_stage || 'N/A',
          ai_summary: item.ai_summary || null,
          external_id: item.external_id || String(item.id),
          url: item.url || item.rawUrl || (item.external_id ? `https://www.adb.org/projects/${item.external_id}/main` : null),
          sector: item.sector || null,
          region: item.region || null,
          development_objective: item.development_objective || null,
          team_leader: item.team_leader || null,
          borrower: item.borrower || null,
          implementing_agency: item.implementing_agency || null,
          lending_instrument: item.lending_instrument || null,
          closing_date: item.closing_date || null,
          fiscal_year: item.fiscal_year || null,
          total_cost: item.total_cost || null,
          amount_display: item.amount || null,
          details: safeParse(item.details_json),
        };
      }
    } catch (e) {
      console.warn('Failed getProjectById ADB:', e);
    }
    return null;
  },

  /**
   * Quản lý lưu dự án ADB cá nhân (localStorage)
   */
  getSavedProjects() {
    try {
      const raw = localStorage.getItem(ADB_SAVED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

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
          saved_at: new Date().toISOString(),
        },
      ];
      isSavedNow = true;
    }

    localStorage.setItem(ADB_SAVED_KEY, JSON.stringify(updated));
    return { isSaved: isSavedNow, savedList: updated };
  },

  isProjectSaved(projectId) {
    const saved = this.getSavedProjects();
    return saved.some((p) => p.id === projectId);
  },
};
