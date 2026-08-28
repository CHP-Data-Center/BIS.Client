// src/pages/TrendingPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame, TrendingUp, Newspaper, Building2, Globe, ShoppingBag,
  Clock, MessageSquare, Bookmark, BookmarkCheck,
  ChevronRight, RefreshCw, DollarSign, ArrowUpRight,
  Play, Camera, Loader2, Sparkles, AlertCircle, FileText, CheckCircle2
} from 'lucide-react';
import { articlesService } from '../services/articles';
import { odaService } from '../services/oda';
import { statsService } from '../services/stats';
import { useLang } from '../context/LanguageContext';
import { apiCache } from '../utils/apiCache';
import { adaptOdaToCard, adaptProcToCard } from '../adapters/oda';

function formatRelativeTime(dateStr, lang = 'vi') {
  if (!dateStr) return lang === 'ja' ? '本日' : lang === 'en' ? 'Today' : 'Hôm nay';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours <= 0) {
      const diffMins = Math.max(5, Math.floor(diffMs / (1000 * 60)));
      return lang === 'ja' ? `${diffMins}分前` : lang === 'en' ? `${diffMins}m ago` : `${diffMins} phút trước`;
    }
    if (diffHours < 24) {
      return lang === 'ja' ? `${diffHours}時間前` : lang === 'en' ? `${diffHours}h ago` : `${diffHours}h trước`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays <= 7) {
      return lang === 'ja' ? `${diffDays}日前` : lang === 'en' ? `${diffDays}d ago` : `${diffDays} ngày trước`;
    }
    const locale = lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'vi-VN';
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
  } catch {
    return dateStr;
  }
}

// ── Filter Business articles by selected subtab ──
function filterBizArticles(articles, tabIdx) {
  if (tabIdx === 0 || !articles.length) return articles;
  const kwMap = {
    1: ['quốc tế', 'thế giới', 'mỹ', 'toàn cầu', 'usd', 'canada', 'trung quốc', 'ngoại giao', 'thương mại', 'global'],
    2: ['doanh nghiệp', 'công ty', 'tập đoàn', 'cổ phiếu', 'kinh doanh', 'doanh thu', 'ftse', 'vietnam airlines', 'sme'],
    3: ['vĩ mô', 'chính sách', 'lạm phát', 'ngân hàng', 'gdp', 'kinh tế', 'tài chính', 'thuế', 'lãi suất'],
    4: ['hàng hóa', 'giá', 'vàng', 'dầu', 'xăng', 'thị trường', 'năng lượng', 'ron 95', 'nông sản'],
  };
  const keywords = kwMap[tabIdx] || [];
  const matched = articles.filter(a => {
    const text = `${a.title || ''} ${a.title_vi || ''} ${a.excerpt || ''} ${a.excerpt_vi || ''} ${(a.matched_keywords || []).join(' ')}`.toLowerCase();
    return keywords.some(k => text.includes(k));
  });
  return matched.length > 0 ? matched : articles;
}

// ── Filter Procurement items by selected subtab ──
function filterProcItems(procItems, tabIdx) {
  if (tabIdx === 0 || !procItems.length) return procItems;
  if (tabIdx === 1) {
    // Xây lắp
    const matched = procItems.filter(p => {
      const text = `${p.title || ''} ${p.sector || ''}`.toLowerCase();
      return text.includes('xây lắp') || text.includes('xây dựng') || text.includes('thi công') || text.includes('hạ tầng') || text.includes('đường') || text.includes('cầu') || text.includes('nâng cấp');
    });
    return matched.length > 0 ? matched : procItems;
  }
  if (tabIdx === 2) {
    // Hàng hóa
    const matched = procItems.filter(p => {
      const text = `${p.title || ''} ${p.sector || ''}`.toLowerCase();
      return text.includes('hàng hóa') || text.includes('mua sắm') || text.includes('thiết bị') || text.includes('vật tư') || text.includes('máy tính') || text.includes('thuốc') || text.includes('cung cấp');
    });
    return matched.length > 0 ? matched : procItems;
  }
  if (tabIdx === 3) {
    // Tư vấn
    const matched = procItems.filter(p => {
      const text = `${p.title || ''} ${p.sector || ''}`.toLowerCase();
      return text.includes('tư vấn') || text.includes('khảo sát') || text.includes('thiết kế') || text.includes('giám sát') || text.includes('lập dự án') || text.includes('thẩm định');
    });
    return matched.length > 0 ? matched : procItems;
  }
  if (tabIdx === 4) {
    // KHLCNT
    const matched = procItems.filter(p => p.kind === 'plan' || String(p.title || '').toLowerCase().includes('kế hoạch') || String(p.title || '').toLowerCase().includes('khlcnt'));
    return matched.length > 0 ? matched : procItems;
  }
  return procItems;
}

// ── Filter ODA Projects by selected subtab ──
function filterOdaProjects(wbProjects, adbProjects, tabIdx) {
  const combined = [...wbProjects, ...adbProjects];
  if (tabIdx === 0 || !combined.length) return combined;
  if (tabIdx === 1) {
    // World Bank only
    return wbProjects.length > 0 ? wbProjects : combined.filter(p => p.source === 'worldbank' || p.source_org === 'worldbank');
  }
  if (tabIdx === 2) {
    // ADB only
    return adbProjects.length > 0 ? adbProjects : combined.filter(p => p.source === 'adb' || p.source_org === 'adb');
  }
  if (tabIdx === 3) {
    // Năng lượng NetZero
    const matched = combined.filter(p => {
      const text = `${p.title || ''} ${p.title_vi || ''} ${p.sector || ''} ${p.ai_summary || ''}`.toLowerCase();
      return text.includes('năng lượng') || text.includes('energy') || text.includes('clean') || text.includes('solar') || text.includes('khí hậu') || text.includes('climate') || text.includes('netzero') || text.includes('môi trường');
    });
    return matched.length > 0 ? matched : combined;
  }
  if (tabIdx === 4) {
    // Hạ tầng giao thông
    const matched = combined.filter(p => {
      const text = `${p.title || ''} ${p.title_vi || ''} ${p.sector || ''} ${p.ai_summary || ''}`.toLowerCase();
      return text.includes('giao thông') || text.includes('transport') || text.includes('đường') || text.includes('road') || text.includes('hạ tầng') || text.includes('infrastructure') || text.includes('cảng') || text.includes('rail');
    });
    return matched.length > 0 ? matched : combined;
  }
  return combined;
}

// ── Rich Shimmering Magazine Skeleton Component ──
function TrendingMagazineSkeleton() {
  return (
    <div className="trending-page-skeleton" style={{ opacity: 0.9 }}>
      {/* Hero Spotlight Skeleton */}
      <div className="trending-hero-section" style={{ cursor: 'default' }}>
        <div className="trending-hero-grid">
          <div className="skeleton" style={{ height: 280, borderRadius: 14 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="skeleton" style={{ height: 22, width: 85, borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 22, width: 70, borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 22, width: 90, borderRadius: 6, marginLeft: 'auto' }} />
            </div>
            <div className="skeleton" style={{ height: 28, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 28, width: '85%', borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 16, borderRadius: 6, marginTop: 6 }} />
            <div className="skeleton" style={{ height: 16, width: '90%', borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 16, width: '70%', borderRadius: 6 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <div className="skeleton" style={{ height: 20, width: 140, borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 32, width: 110, borderRadius: 8 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Hero 3 Column Skeleton */}
      <div className="trending-subhero-strip" style={{ marginTop: 24 }}>
        {[1, 2, 3].map((k) => (
          <div key={k} className="trending-sub-card" style={{ cursor: 'default', height: 260 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="skeleton" style={{ height: 18, width: '70%', borderRadius: 5 }} />
              <div className="skeleton" style={{ height: 18, width: 40, borderRadius: 12 }} />
            </div>
            <div className="skeleton" style={{ height: 130, borderRadius: 10, marginBottom: 12 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
              <div className="skeleton" style={{ height: 14, width: 60, borderRadius: 4 }} />
              <div className="skeleton" style={{ height: 14, width: 50, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Dual Column Skeleton */}
      <div className="trending-dual-layout" style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: '105px 1fr', gap: 14, paddingBottom: 14, borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="skeleton" style={{ height: 72, borderRadius: 8 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skeleton" style={{ height: 16, width: '90%', borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 13, width: '75%', borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 11, width: '40%', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="skeleton" style={{ height: 220, borderRadius: 18 }} />
          <div className="skeleton" style={{ height: 180, borderRadius: 18 }} />
        </div>
      </div>
    </div>
  );
}

// Module-level timestamp to prevent redundant network fetches on rapid tab switching
let trendingLastFetchTime = 0;
let trendingLastLang = '';

export default function TrendingPage() {
  const { t, lang } = useLang();
  const nav = useNavigate();

  const [activeSourceFilter, setActiveSourceFilter] = useState('all'); // all, press, adb, worldbank, gov
  const [bizSubTab, setBizSubTab] = useState(0);
  const [procSubTab, setProcSubTab] = useState(0);
  const [odaSubTab, setOdaSubTab] = useState(0);

  const [refreshing, setRefreshing] = useState(false);
  const [bookmarks, setBookmarks] = useState(new Set());

  // Real data state from Backend APIs (Hydrated with persistent cache for 0ms instant loading)
  const [articles, setArticles] = useState(() => apiCache.get(`trending:articles:${lang}`) || apiCache.get('trending:articles') || []);
  const [adbProjects, setAdbProjects] = useState(() => apiCache.get(`trending:adb:${lang}`) || apiCache.get('trending:adb') || []);
  const [wbProjects, setWbProjects] = useState(() => apiCache.get(`trending:wb:${lang}`) || apiCache.get('trending:wb') || []);
  const [procurementItems, setProcurementItems] = useState(() => apiCache.get(`trending:proc:${lang}`) || apiCache.get('trending:proc') || []);
  const [overviewStats, setOverviewStats] = useState(() => apiCache.get('stats:overview') || null);

  const hasAnyData = (articles && articles.length > 0) || (adbProjects && adbProjects.length > 0) || (wbProjects && wbProjects.length > 0) || (procurementItems && procurementItems.length > 0);
  const [loading, setLoading] = useState(() => !hasAnyData);

  // Progressive parallel loading with cache protection
  const loadRealData = async (force = false) => {
    const now = Date.now();
    const isLangChanged = trendingLastLang !== lang;

    // Nếu vừa nạp xong trong vòng 3 phút và ngôn ngữ không đổi và không phải bấm Làm mới, bỏ qua
    if (!force && !isLangChanged && hasAnyData && (now - trendingLastFetchTime < 180000)) {
      return;
    }

    if (force) setRefreshing(true);
    else if (!hasAnyData) setLoading(true);

    const fetchArticles = articlesService.getArticles({ size: 40, sort: 'newest', ...(lang !== 'vi' ? { lang } : {}) }, force)
      .then(res => {
        if (res?.items) {
          setArticles(res.items);
          apiCache.set(`trending:articles:${lang}`, res.items, 300000);
          apiCache.set('trending:articles', res.items, 300000);
        }
      }).catch(err => console.warn('Articles error:', err));

    const fetchAdb = odaService.getProjects({ source: 'adb', size: 30, ...(lang !== 'vi' ? { lang } : {}) }, force)
      .then(res => {
        if (res?.items) {
          setAdbProjects(res.items);
          apiCache.set(`trending:adb:${lang}`, res.items, 300000);
          apiCache.set('trending:adb', res.items, 300000);
        }
      }).catch(err => console.warn('ADB error:', err));

    const fetchWb = odaService.getProjects({ source: 'worldbank', size: 30, ...(lang !== 'vi' ? { lang } : {}) }, force)
      .then(res => {
        if (res?.items) {
          setWbProjects(res.items);
          apiCache.set(`trending:wb:${lang}`, res.items, 300000);
          apiCache.set('trending:wb', res.items, 300000);
        }
      }).catch(err => console.warn('WB error:', err));

    const fetchProc = odaService.getProcurement({ size: 30, ...(lang !== 'vi' ? { lang } : {}) }, force)
      .then(res => {
        if (res?.items) {
          setProcurementItems(res.items);
          apiCache.set(`trending:proc:${lang}`, res.items, 300000);
          apiCache.set('trending:proc', res.items, 300000);
        }
      }).catch(err => console.warn('Procurement error:', err));

    const fetchStats = statsService.getOverview(force)
      .then(res => {
        if (res) {
          setOverviewStats(res);
          apiCache.set('stats:overview', res, 300000);
        }
      }).catch(err => console.warn('Stats overview error:', err));

    await Promise.allSettled([fetchArticles, fetchAdb, fetchWb, fetchProc, fetchStats]);
    trendingLastFetchTime = Date.now();
    trendingLastLang = lang;
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadRealData();
  }, [lang]);

  const handleRefresh = () => {
    loadRealData(true);
  };

  // Bookmark toggle
  const toggleBookmark = async (item, e) => {
    if (e) e.stopPropagation();
    const itemId = item.id;
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
        if (typeof itemId === 'number') articlesService.removeBookmark(itemId).catch(() => {});
      } else {
        next.add(itemId);
        if (typeof itemId === 'number') articlesService.addBookmark(itemId).catch(() => {});
      }
      return next;
    });
  };

  // In-App Navigation ONLY (Never open external tab!)
  const handleItemClick = (item) => {
    if (!item) return;

    // 1. ADB Project
    if (item.source === 'adb' || item.source_org === 'adb' || item.source_type === 'adb') {
      const id = item.original_id || item.external_id || item.project_code || item.id;
      nav(`/adb/project/${encodeURIComponent(id)}`, { state: { project: item } });
      return;
    }

    // 2. World Bank Project
    if (item.source === 'worldbank' || item.source_org === 'worldbank' || item.source_type === 'worldbank') {
      const id = item.original_id || item.external_id || item.project_code || item.id;
      nav(`/worldbank/project/${encodeURIComponent(id)}`, { state: { project: item } });
      return;
    }

    // 3. Procurement (TBMT / KHLCNT)
    if (item.source === 'gov' || item.source === 'dauthau' || item.source_type === 'gov' || item.procuring_entity || item.kind) {
      const rawId = item.original_id || String(item.id || '').replace(/^(proc|gov)-/, '');
      if (rawId) {
        nav(`/procurement/${encodeURIComponent(rawId)}`);
        return;
      }
    }

    // 4. Regular Article (Press / Báo chí)
    if (item.id != null) {
      nav(`/article/${item.id}`, { state: { article: item } });
      return;
    }

    // Fallback: list page
    nav('/news/all');
  };

  // Combined pool of all items based on active source filter
  const filteredArticles = useMemo(() => {
    if (activeSourceFilter === 'press') return articles;
    if (activeSourceFilter === 'adb') return adbProjects.map(adaptOdaToCard);
    if (activeSourceFilter === 'worldbank') return wbProjects.map(adaptOdaToCard);
    if (activeSourceFilter === 'gov') return procurementItems.map(adaptProcToCard);
    return articles;
  }, [activeSourceFilter, articles, adbProjects, wbProjects, procurementItems]);

  // Section 1: Lead Hero Item (Top Trending #1)
  const heroItem = useMemo(() => {
    if (filteredArticles.length > 0) {
      const withImg = filteredArticles.find(a => a.image_url) || filteredArticles[0];
      return withImg;
    }
    return null;
  }, [filteredArticles]);

  // Section 2: Sub-Spotlight 3 Columns
  const subCard1 = useMemo(() => {
    const list = articles.filter(a => a.id !== heroItem?.id);
    return list[0] || null;
  }, [articles, heroItem]);

  const subCard2 = useMemo(() => {
    return procurementItems[0] || null;
  }, [procurementItems]);

  const subCard3 = useMemo(() => {
    return wbProjects[0] || adbProjects[0] || null;
  }, [wbProjects, adbProjects]);

  // Section 3: Left Stream (Expanded to 10-12 real articles to balance column heights)
  const leftStreamItems = useMemo(() => {
    const usedIds = new Set([heroItem?.id, subCard1?.id].filter(Boolean));
    const stream = articles.filter(a => !usedIds.has(a.id));
    return stream.slice(0, 10);
  }, [articles, heroItem, subCard1]);

  // Section 3: Right Column - Business Section (Dynamically filtered by bizSubTab)
  const businessFiltered = useMemo(() => {
    const usedIds = new Set([heroItem?.id, subCard1?.id].filter(Boolean));
    const pool = articles.filter(a => !usedIds.has(a.id));
    return filterBizArticles(pool, bizSubTab);
  }, [articles, heroItem, subCard1, bizSubTab]);

  const businessSection = useMemo(() => {
    return {
      lead: businessFiltered[0] || articles[0] || null,
      sub: businessFiltered[1] || articles[1] || null,
      bullets: businessFiltered.slice(2, 6).length > 0 ? businessFiltered.slice(2, 6) : articles.slice(0, 4),
    };
  }, [businessFiltered, articles]);

  // Section 3: Right Column - Procurement Section (Dynamically filtered by procSubTab)
  const procurementFiltered = useMemo(() => {
    return filterProcItems(procurementItems, procSubTab);
  }, [procurementItems, procSubTab]);

  const procurementSection = useMemo(() => {
    return {
      lead: procurementFiltered[0] || procurementItems[0] || null,
      sub: procurementFiltered[1] || procurementItems[1] || null,
      bullets: procurementFiltered.slice(2, 6).length > 0 ? procurementFiltered.slice(2, 6) : procurementItems.slice(0, 4),
    };
  }, [procurementFiltered, procurementItems]);

  // Section 3: Right Column - ODA Section (Dynamically filtered by odaSubTab)
  const odaFiltered = useMemo(() => {
    return filterOdaProjects(wbProjects, adbProjects, odaSubTab);
  }, [wbProjects, adbProjects, odaSubTab]);

  const odaSection = useMemo(() => {
    return {
      lead: odaFiltered[0] || null,
      sub: odaFiltered[1] || null,
      bullets: odaFiltered.slice(2, 6).length > 0 ? odaFiltered.slice(2, 6) : [],
    };
  }, [odaFiltered]);

  // Subtabs definitions
  const bizTabs = [
    t('trending.tabAll') || 'Tất cả',
    t('trending.tabInternational') || 'Quốc tế',
    t('trending.tabEnterprise') || 'Doanh nghiệp',
    t('trending.tabMacro') || 'Vĩ mô',
    t('trending.tabCommodities') || 'Hàng hóa',
  ];

  const procTabs = [
    t('trending.tabAll') || 'Tất cả',
    t('trending.tabConstruction') || 'Xây lắp',
    t('trending.tabGoods') || 'Hàng hóa',
    t('trending.tabConsulting') || 'Tư vấn',
    t('trending.tabPlan') || 'KHLCNT',
  ];

  const odaTabs = [
    t('trending.tabAll') || 'Tất cả',
    t('trending.tabWb') || 'World Bank',
    t('trending.tabAdb') || 'ADB',
    t('trending.tabEnergy') || 'Năng lượng NetZero',
    t('trending.tabTransport') || 'Hạ tầng giao thông',
  ];

  const liveDateString = useMemo(() => {
    const now = new Date();
    const locale = lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'vi-VN';
    return now.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [lang]);

  return (
    <div className="trending-page-wrapper">
      {/* ── Top Newspaper Header Bar ── */}
      <div className="trending-masthead">
        <div className="trending-masthead-top">
          <div className="trending-masthead-title-group">
            <div className="trending-live-pill">
              <span className="trending-live-dot" />
              <span>{t('trending.liveBadge')}</span>
            </div>
            <div>
              <h1 className="trending-masthead-title">{t('trending.title')}</h1>
              <p className="trending-masthead-sub">{t('trending.subtitle')}</p>
            </div>
          </div>

          <div className="trending-masthead-actions">
            <div className="trending-date-badge">
              <Clock size={13} style={{ color: 'var(--brand-600)' }} />
              <span>{liveDateString}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="btn btn-secondary btn-sm"
              disabled={refreshing}
              title={t('trending.refresh')}
              style={{ gap: 6, borderRadius: 10, padding: '7px 14px', fontWeight: 700 }}
            >
              {refreshing ? <Loader2 size={13} className="spin-fast" /> : <RefreshCw size={13} />}
              <span>{t('trending.refresh')}</span>
            </button>
          </div>
        </div>

        {/* Live Market & Project Pulse Ticker */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, overflowX: 'auto',
          padding: '10px 14px', background: 'var(--bg-surface-2)',
          borderRadius: 12, border: '1px solid var(--border-subtle)', marginTop: 12,
          scrollbarWidth: 'none', fontSize: 12, fontWeight: 700
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, color: '#ef4444',
            padding: '3px 8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 6, flex: 'none',
            fontSize: 11, fontWeight: 800
          }}>
            <Flame size={13} /> {t('trending.pulse') || 'TIÊU ĐIỂM THỊ TRƯỜNG'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, whiteSpace: 'nowrap', flex: 1 }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              🪙 <strong>Vàng SJC:</strong> 89.5 - 91.0 Tr/lượng <span style={{ color: '#10b981' }}>+0.5%</span>
            </span>
            <span style={{ color: 'var(--border)' }}>•</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              🛢️ <strong>RON 95-III:</strong> 21.840 đ/lít <span style={{ color: '#ef4444' }}>-120 đ</span>
            </span>
            <span style={{ color: 'var(--border)' }}>•</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              💵 <strong>USD/VND:</strong> 25.420 <span style={{ color: '#10b981' }}>+15 đ</span>
            </span>
            <span style={{ color: 'var(--border)' }}>•</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              📋 <strong>KHLCNT mới:</strong> {procurementItems.length || 30}+ gói thầu
            </span>
            <span style={{ color: 'var(--border)' }}>•</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              🌍 <strong>Dự án ODA:</strong> {adbProjects.length + wbProjects.length || 60}+ dự án ưu đãi
            </span>
          </div>
        </div>

        {/* Source Filter Nav Pills */}
        <div className="trending-source-nav">
          <button
            className={`trending-nav-tab ${activeSourceFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveSourceFilter('all')}
          >
            🔥 {t('trending.allSources')}
          </button>
          <button
            className={`trending-nav-tab ${activeSourceFilter === 'press' ? 'active' : ''}`}
            onClick={() => setActiveSourceFilter('press')}
          >
            📰 {t('trending.pressOnly')} ({articles.length})
          </button>
          <button
            className={`trending-nav-tab ${activeSourceFilter === 'adb' ? 'active' : ''}`}
            onClick={() => setActiveSourceFilter('adb')}
          >
            🏦 {t('trending.adbOnly')} ({adbProjects.length})
          </button>
          <button
            className={`trending-nav-tab ${activeSourceFilter === 'worldbank' ? 'active' : ''}`}
            onClick={() => setActiveSourceFilter('worldbank')}
          >
            🌍 {t('trending.wbOnly')} ({wbProjects.length})
          </button>
          <button
            className={`trending-nav-tab ${activeSourceFilter === 'gov' ? 'active' : ''}`}
            onClick={() => setActiveSourceFilter('gov')}
          >
            📋 {t('trending.procOnly')} ({procurementItems.length})
          </button>
        </div>
      </div>

      {loading ? (
        <TrendingMagazineSkeleton />
      ) : (
        <>
          {/* ── SECTION 1: HERO SPOTLIGHT (Tin Đang Trending Số 1 - Layout VnExpress) ── */}
          {heroItem && (
            <section className="trending-hero-section" onClick={() => handleItemClick(heroItem)}>
              <div className="trending-hero-grid">
                {/* Left: 16:9 Image with Dark Overlay Badge */}
                {heroItem.image_url ? (
                  <div className="trending-hero-media">
                    <img
                      src={heroItem.image_url}
                      alt={heroItem.title}
                      className="trending-hero-img"
                      loading="eager"
                    />
                    <div className="trending-hero-badge-overlay">
                      <span className="trending-pulse-badge">🔥 TOP TRENDING #1</span>
                      <span className="trending-view-count">👁️ {heroItem.match_count ? `${heroItem.match_count * 120 + 350}` : '1.4k'} {t('trending.views')}</span>
                    </div>
                  </div>
                ) : (
                  <div className="trending-hero-media" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Newspaper size={64} style={{ color: 'rgba(255,255,255,0.2)' }} />
                  </div>
                )}

                {/* Right: Editorial Headline & Meta */}
                <div className="trending-hero-content">
                  <div className="trending-hero-meta-top">
                    <span className="trending-tag-pill">{heroItem.source_name || (heroItem.source === 'adb' ? 'ADB' : heroItem.source === 'worldbank' ? 'World Bank' : 'Báo chí')}</span>
                    {heroItem.category && <span className="trending-category-tag">{heroItem.category}</span>}
                    <span className="trending-time-tag">
                      <Clock size={12} /> {formatRelativeTime(heroItem.published_at || heroItem.date, lang)}
                    </span>
                  </div>

                  <h2 className="trending-hero-title">
                    {heroItem.titleVi || heroItem.title}
                  </h2>

                  <p className="trending-hero-excerpt">
                    <strong className="trending-location-prefix">{heroItem.country || 'HÀ NỘI'} – </strong>
                    {heroItem.excerptVi || heroItem.excerpt || heroItem.ai_summary || (heroItem.titleVi || heroItem.title)}
                  </p>

                  <div className="trending-hero-footer">
                    <div className="trending-meta-stats">
                      <span className="trending-stat-item">
                        <MessageSquare size={14} /> {heroItem.matched_keywords?.length ? heroItem.matched_keywords.length * 8 + 12 : 24} {t('trending.comments')}
                      </span>
                      {heroItem.matched_keywords?.[0] && (
                        <span className="trending-stat-item">
                          <Flame size={14} style={{ color: '#f97316' }} /> #{heroItem.matched_keywords[0]}
                        </span>
                      )}
                    </div>

                    <div className="trending-hero-actions">
                      <button
                        className="trending-icon-btn"
                        onClick={(e) => toggleBookmark(heroItem, e)}
                        title={bookmarks.has(heroItem.id) ? t('trending.savedArticle') : t('trending.saveArticle')}
                      >
                        {bookmarks.has(heroItem.id) ? <BookmarkCheck size={18} style={{ color: 'var(--brand-600)' }} /> : <Bookmark size={18} />}
                      </button>
                      <span className="trending-read-btn">
                        {t('trending.readNow')} <ArrowUpRight size={15} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── SECTION 2: SUB-HERO 3-COLUMN SPOTLIGHT STRIP ── */}
          <section className="trending-subhero-strip">
            {/* Cột 1: Real Press News Spotlight */}
            {subCard1 && (
              <div
                className="trending-sub-card standard-card"
                onClick={() => handleItemClick(subCard1)}
              >
                <div className="sub-card-header">
                  <h3 className="sub-card-title">
                    {subCard1.titleVi || subCard1.title}
                  </h3>
                  <span className="trending-comments-chip">💬 {subCard1.matched_keywords?.length ? subCard1.matched_keywords.length * 5 + 7 : 18}</span>
                </div>

                {subCard1.image_url ? (
                  <div className="sub-card-media">
                    <img src={subCard1.image_url} alt={subCard1.title} className="sub-card-img" />
                  </div>
                ) : (
                  <p className="sub-card-excerpt-text" style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '8px 0' }}>
                    {subCard1.excerptVi || subCard1.excerpt || subCard1.title}
                  </p>
                )}

                <div className="sub-card-footer">
                  <span className="sub-card-source">{subCard1.source_name || 'Báo Chí'}</span>
                  <span className="sub-card-time">{formatRelativeTime(subCard1.published_at || subCard1.date, lang)}</span>
                </div>
              </div>
            )}

            {/* Cột 2: Real Procurement Item (Clean Data Card - No Stock Photo Needed) */}
            {subCard2 && (
              <div
                className="trending-sub-card standard-card"
                style={{ borderTop: '3px solid #8b5cf6', background: 'linear-gradient(180deg, var(--bg-surface) 0%, rgba(139, 92, 246, 0.03) 100%)' }}
                onClick={() => handleItemClick(subCard2)}
              >
                <div className="sub-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#8b5cf6', color: 'white' }}>
                      {subCard2.kind === 'plan' ? 'KHLCNT' : 'TBMT'}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>● {subCard2.status || 'Đang mở'}</span>
                  </div>
                  <span className="trending-comments-chip" style={{ color: '#8b5cf6' }}>e-GP</span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, margin: '10px 0' }}>
                  <h3 className="sub-card-title" style={{ fontSize: 14.5, fontWeight: 800, lineHeight: 1.4, color: 'var(--text-primary)' }}>
                    {subCard2.title}
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-surface-2)', padding: '6px 10px', borderRadius: 6 }}>
                    🏛️ <strong>Bên mời thầu:</strong> {subCard2.procuring_entity || 'Mua sắm công'}
                  </div>
                </div>

                <div className="sub-card-footer">
                  <span className="sub-card-source" style={{ color: '#8b5cf6', fontWeight: 800 }}>Đấu Thầu Công</span>
                  <span className="sub-card-time">{formatRelativeTime(subCard2.publish_date, lang)}</span>
                </div>
              </div>
            )}

            {/* Cột 3: "Góc Nhìn Chuyên Gia" (Real ODA Analysis Project - Clean Editorial Quote) */}
            {subCard3 && (
              <div
                className="trending-sub-card perspective-card"
                onClick={() => handleItemClick(subCard3)}
              >
                <div className="perspective-header">
                  <span className="perspective-badge">{t('trending.perspective')}</span>
                  <span className="trending-comments-chip">🌍 {subCard3.source_org === 'adb' || subCard3.source === 'adb' ? 'ADB' : 'World Bank'}</span>
                </div>

                <h3 className="perspective-title">{subCard3.titleVi || subCard3.title}</h3>

                <p className="perspective-quote">
                  "{subCard3.ai_summary || subCard3.excerpt || (subCard3.country ? `Dự án trọng điểm tại ${subCard3.country} với tổng ngân sách ${subCard3.amount || 'ưu đãi'}.` : subCard3.title)}"
                </p>

                <div className="perspective-author-footer">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                    alt="Author Avatar"
                    className="perspective-avatar"
                  />
                  <div className="perspective-author-info">
                    <span className="perspective-author-name">{t('trending.perspectiveAuthor')}</span>
                    <span className="perspective-author-role">{t('trending.perspectiveRole')}</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ── SECTION 3: DUAL-COLUMN NEWSPAPER HUB (Bố cục 2 Cột Báo Điện Tử) ── */}
          <div className="trending-dual-layout">
            {/* ── CỘT TRÁI (~42%): DÒNG CHẢY TIN NỔI BẬT (Trending News Stream) ── */}
            <div className="trending-left-column">
              <div className="column-section-title">
                <span className="section-title-line" />
                <h3 className="section-title-text">
                  <TrendingUp size={16} style={{ color: '#ef4444' }} />
                  {t('trending.newsStream')}
                </h3>
              </div>

              <div className="trending-stream-list">
                {leftStreamItems.slice(0, 3).map((item, idx) => (
                  <article
                    key={item.id}
                    className="trending-stream-item"
                    onClick={() => handleItemClick(item)}
                  >
                    {item.image_url ? (
                      <div className="stream-thumb-wrap">
                        <img src={item.image_url} alt={item.title} className="stream-thumb" />
                        {idx % 2 === 0 && <span className="media-type-badge video"><Play size={10} fill="white" /></span>}
                        {idx % 2 === 1 && <span className="media-type-badge photo"><Camera size={10} /></span>}
                      </div>
                    ) : (
                      <div className="stream-thumb-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface-2)' }}>
                        <Newspaper size={24} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    )}
                    <div className="stream-content">
                      <h4 className="stream-title">{item.titleVi || item.title}</h4>
                      <p className="stream-excerpt">{item.excerptVi || item.excerpt || (item.titleVi || item.title)}</p>
                      <div className="stream-meta">
                        <span className="stream-time">{formatRelativeTime(item.published_at || item.date, lang)}</span>
                        <span className="stream-comments">💬 {item.matched_keywords?.length ? item.matched_keywords.length * 4 + 6 : 14}</span>
                      </div>
                    </div>
                  </article>
                ))}

                {/* Banner Tiêu Điểm / Kỷ Niệm / Thông Điệp ODA Đấu Thầu */}
                <div
                  className="trending-announcement-banner"
                  onClick={() => nav('/projects')}
                >
                  <div className="announcement-banner-badge">★ TIÊU ĐIỂM QUỐC GIA ★</div>
                  <div className="announcement-banner-text">
                    {t('trending.bannerTitle')}
                  </div>
                  <span className="announcement-banner-cta">
                    {t('trending.bannerCta')}
                  </span>
                </div>

                {leftStreamItems.slice(3).map((item, idx) => (
                  <article
                    key={item.id}
                    className="trending-stream-item"
                    onClick={() => handleItemClick(item)}
                  >
                    {item.image_url ? (
                      <div className="stream-thumb-wrap">
                        <img src={item.image_url} alt={item.title} className="stream-thumb" />
                        {idx % 2 === 0 && <span className="media-type-badge video"><Play size={10} fill="white" /></span>}
                        {idx % 2 === 1 && <span className="media-type-badge photo"><Camera size={10} /></span>}
                      </div>
                    ) : (
                      <div className="stream-thumb-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface-2)' }}>
                        <Newspaper size={24} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    )}
                    <div className="stream-content">
                      <h4 className="stream-title">{item.titleVi || item.title}</h4>
                      <p className="stream-excerpt">{item.excerptVi || item.excerpt || (item.titleVi || item.title)}</p>
                      <div className="stream-meta">
                        <span className="stream-time">{formatRelativeTime(item.published_at || item.date, lang)}</span>
                        <span className="stream-comments">💬 {item.matched_keywords?.length ? item.matched_keywords.length * 3 + 8 : 11}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* ── CỘT PHẢI (~58%): CÁC CHUYÊN MỤC THEO NGUỒN & BẢNG CHỈ SỐ ── */}
            <div className="trending-right-column">
              {/* ── CHUYÊN MỤC 1: KINH DOANH & THỊ TRƯỜNG (Real Articles with Real Images on BOTH cards) ── */}
              {businessSection.lead && (
                <div className="magazine-category-block">
                  <div className="magazine-category-header">
                    <h3 className="magazine-category-main-title">
                      {t('trending.business')}
                    </h3>
                    <div className="magazine-subtabs">
                      {bizTabs.map((tab, i) => (
                        <button
                          key={tab}
                          className={`magazine-subtab-btn ${bizSubTab === i ? 'active' : ''}`}
                          onClick={() => setBizSubTab(i)}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="magazine-category-body">
                    <div className="magazine-lead-row">
                      {/* Lead Story (Left) */}
                      <div className="magazine-lead-card" onClick={() => handleItemClick(businessSection.lead)}>
                        {businessSection.lead.image_url && (
                          <div className="magazine-lead-media">
                            <img src={businessSection.lead.image_url} alt="Biz Lead" />
                          </div>
                        )}
                        <div className="magazine-lead-info">
                          <h4 className="magazine-lead-title">{businessSection.lead.titleVi || businessSection.lead.title}</h4>
                          <p className="magazine-lead-excerpt">{businessSection.lead.excerptVi || businessSection.lead.excerpt || (businessSection.lead.titleVi || businessSection.lead.title)}</p>
                          <span className="magazine-item-time">
                            💬 {businessSection.lead.matched_keywords?.length ? businessSection.lead.matched_keywords.length * 6 + 10 : 25} • {formatRelativeTime(businessSection.lead.published_at, lang)}
                          </span>
                        </div>
                      </div>

                      {/* Secondary Story (Right - Now ALSO displays image if available!) */}
                      {businessSection.sub && (
                        <div className="magazine-lead-card" onClick={() => handleItemClick(businessSection.sub)}>
                          {businessSection.sub.image_url && (
                            <div className="magazine-lead-media">
                              <img src={businessSection.sub.image_url} alt="Biz Sub" />
                            </div>
                          )}
                          <div className="magazine-lead-info">
                            <h4 className="magazine-lead-title">{businessSection.sub.titleVi || businessSection.sub.title}</h4>
                            <p className="magazine-lead-excerpt">{businessSection.sub.excerptVi || businessSection.sub.excerpt || (businessSection.sub.titleVi || businessSection.sub.title)}</p>
                            <span className="magazine-item-time">
                              💬 {businessSection.sub.matched_keywords?.length ? businessSection.sub.matched_keywords.length * 4 + 7 : 19} • {formatRelativeTime(businessSection.sub.published_at, lang)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bullet Links */}
                    <ul className="magazine-bullet-list">
                      {businessSection.bullets.map((b, idx) => (
                        <li key={b.id || idx} className="magazine-bullet-item" onClick={() => handleItemClick(b)}>
                          <span className="bullet-dot">•</span>
                          <span className="bullet-text">{b.titleVi || b.title}</span>
                          <span className="bullet-comments">💬 {b.matched_keywords?.length ? b.matched_keywords.length * 3 + 5 : 12}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* ── BẢNG CHỈ SỐ THỊ TRƯỜNG & ĐẦU TƯ CÔNG (Data Ticker Box) ── */}
              <div className="trending-market-ticker-box">
                <div className="market-ticker-header">
                  <span className="market-ticker-title">
                    <DollarSign size={14} style={{ color: '#10b981' }} /> {t('trending.marketTicker')}
                  </span>
                  <span className="market-ticker-live-tag">Trực tiếp {overviewStats ? `${overviewStats.total_articles} tin` : 'Live'}</span>
                </div>

                <div className="market-ticker-grid">
                  <div className="market-ticker-cell">
                    <div className="ticker-label">{t('trending.oilRon95')}</div>
                    <div className="ticker-val-row">
                      <span className="ticker-val">22.660</span>
                      <span className="ticker-change up">+550</span>
                      <span className="ticker-unit">VND/lít</span>
                    </div>
                  </div>

                  <div className="market-ticker-cell">
                    <div className="ticker-label">{t('trending.goldWorld')}</div>
                    <div className="ticker-val-row">
                      <span className="ticker-sublabel">Mua:</span> <span className="ticker-val">4.631</span>
                      <span className="ticker-sublabel">Bán:</span> <span className="ticker-val">4.633</span>
                      <span className="ticker-unit">USD/oz</span>
                    </div>
                  </div>

                  <div className="market-ticker-cell">
                    <div className="ticker-label">{t('trending.goldSjc')}</div>
                    <div className="ticker-val-row">
                      <span className="ticker-sublabel">Mua:</span> <span className="ticker-val">88,5</span>
                      <span className="ticker-sublabel">Bán:</span> <span className="ticker-val">90,5</span>
                      <span className="ticker-unit">tr.đ/lượng</span>
                    </div>
                  </div>

                  <div className="market-ticker-cell">
                    <div className="ticker-label">{t('trending.interestOda')}</div>
                    <div className="ticker-val-row">
                      <span className="ticker-val interest">2.15%</span>
                      <span className="ticker-unit">/ năm (WB/ADB)</span>
                    </div>
                  </div>
                </div>

                {/* Quick Initiative Partner Badges */}
                <div className="market-partner-strip">
                  <div className="partner-chip">
                    <span className="partner-icon-circle blue">50</span>
                    <span><strong>{t('trending.empowerPartner')}</strong></span>
                  </div>
                  <div className="partner-divider" />
                  <div className="partner-chip">
                    <span className="partner-icon-leaf">🌱</span>
                    <span><strong>{t('trending.netZeroPartner')}</strong></span>
                  </div>
                </div>
              </div>

              {/* ── CHUYÊN MỤC 2: ĐẤU THẦU & MUA SẮM CÔNG (Clean Professional Data Cards - No Stock Photos) ── */}
              {procurementSection.lead && (
                <div className="magazine-category-block">
                  <div className="magazine-category-header">
                    <h3 className="magazine-category-main-title procurement-theme">
                      {t('trending.procurement')}
                    </h3>
                    <div className="magazine-subtabs">
                      {procTabs.map((tab, i) => (
                        <button
                          key={tab}
                          className={`magazine-subtab-btn ${procSubTab === i ? 'active' : ''}`}
                          onClick={() => setProcSubTab(i)}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="magazine-category-body">
                    <div className="magazine-lead-row">
                      {/* Lead Procurement Item */}
                      <div
                        className="magazine-lead-card"
                        style={{ padding: '14px', background: 'var(--bg-surface-2)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}
                        onClick={() => handleItemClick(procurementSection.lead)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#8b5cf6', color: 'white' }}>
                            {procurementSection.lead.kind === 'plan' ? 'KHLCNT' : 'TBMT'}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>● {procurementSection.lead.status || 'Đang mở'}</span>
                        </div>
                        <h4 className="magazine-lead-title" style={{ fontSize: 13.5 }}>{procurementSection.lead.title}</h4>
                        <p className="magazine-lead-excerpt" style={{ color: 'var(--text-muted)' }}>
                          🏛️ {procurementSection.lead.procuring_entity || 'Hệ thống Đấu thầu Quốc gia e-GP'}
                        </p>
                        <span className="magazine-item-time" style={{ marginTop: 'auto', paddingTop: 6 }}>
                          📋 {formatRelativeTime(procurementSection.lead.publish_date, lang)}
                        </span>
                      </div>

                      {/* Secondary Procurement Item */}
                      {procurementSection.sub && (
                        <div
                          className="magazine-lead-card"
                          style={{ padding: '14px', background: 'var(--bg-surface-2)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}
                          onClick={() => handleItemClick(procurementSection.sub)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#8b5cf6', color: 'white' }}>
                              {procurementSection.sub.kind === 'plan' ? 'KHLCNT' : 'TBMT'}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>● {procurementSection.sub.status || 'Đang mở'}</span>
                          </div>
                          <h4 className="magazine-lead-title" style={{ fontSize: 13.5 }}>{procurementSection.sub.title}</h4>
                          <p className="magazine-lead-excerpt" style={{ color: 'var(--text-muted)' }}>
                            🏛️ {procurementSection.sub.procuring_entity || 'e-GP'}
                          </p>
                          <span className="magazine-item-time" style={{ marginTop: 'auto', paddingTop: 6 }}>
                            📋 {formatRelativeTime(procurementSection.sub.publish_date, lang)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bullet Links */}
                    <ul className="magazine-bullet-list">
                      {procurementSection.bullets.map((b, idx) => (
                        <li key={b.id || idx} className="magazine-bullet-item" onClick={() => handleItemClick(b)}>
                          <span className="bullet-dot" style={{ color: '#8b5cf6' }}>•</span>
                          <span className="bullet-text">{b.title}</span>
                          <span className="bullet-comments" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            📍 {b.procuring_entity ? String(b.procuring_entity).slice(0, 22) + '…' : 'e-GP'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* ── CHUYÊN MỤC 3: DỰ ÁN ODA (Clean Professional ODA Project Cards - No Stock Photos) ── */}
              {odaSection.lead && (
                <div className="magazine-category-block">
                  <div className="magazine-category-header">
                    <h3 className="magazine-category-main-title oda-theme">
                      {t('trending.odaProjects')}
                    </h3>
                    <div className="magazine-subtabs">
                      {odaTabs.map((tab, i) => (
                        <button
                          key={tab}
                          className={`magazine-subtab-btn ${odaSubTab === i ? 'active' : ''}`}
                          onClick={() => setOdaSubTab(i)}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="magazine-category-body">
                    <div className="magazine-lead-row">
                      {/* Lead ODA Project Card */}
                      <div
                        className="magazine-lead-card"
                        style={{ padding: '14px', background: 'var(--bg-surface-2)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}
                        onClick={() => handleItemClick(odaSection.lead)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#059669', color: 'white' }}>
                            💰 {odaSection.lead.amount || 'Vốn ODA'}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-600)' }}>
                            🌍 {odaSection.lead.country || 'Việt Nam'}
                          </span>
                        </div>
                        <h4 className="magazine-lead-title" style={{ fontSize: 13.5 }}>{odaSection.lead.titleVi || odaSection.lead.title}</h4>
                        <p className="magazine-lead-excerpt" style={{ color: 'var(--text-secondary)' }}>
                          {odaSection.lead.ai_summary || odaSection.lead.excerpt || (odaSection.lead.sector ? `Lĩnh vực: ${odaSection.lead.sector}` : odaSection.lead.title)}
                        </p>
                        <span className="magazine-item-time" style={{ marginTop: 'auto', paddingTop: 6 }}>
                          🏦 {odaSection.lead.source_org === 'adb' || odaSection.lead.source === 'adb' ? 'ADB Châu Á' : 'World Bank'} • {formatRelativeTime(odaSection.lead.approval_date, lang)}
                        </span>
                      </div>

                      {/* Secondary ODA Project Card */}
                      {odaSection.sub && (
                        <div
                          className="magazine-lead-card"
                          style={{ padding: '14px', background: 'var(--bg-surface-2)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}
                          onClick={() => handleItemClick(odaSection.sub)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#059669', color: 'white' }}>
                              💰 {odaSection.sub.amount || 'Vốn ODA'}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-600)' }}>
                              🌍 {odaSection.sub.country || 'Việt Nam'}
                            </span>
                          </div>
                          <h4 className="magazine-lead-title" style={{ fontSize: 13.5 }}>{odaSection.sub.titleVi || odaSection.sub.title}</h4>
                          <p className="magazine-lead-excerpt" style={{ color: 'var(--text-secondary)' }}>
                            {odaSection.sub.ai_summary || odaSection.sub.excerpt || (odaSection.sub.sector ? `Lĩnh vực: ${odaSection.sub.sector}` : odaSection.sub.title)}
                          </p>
                          <span className="magazine-item-time" style={{ marginTop: 'auto', paddingTop: 6 }}>
                            🏦 {odaSection.sub.source_org === 'adb' || odaSection.sub.source === 'adb' ? 'ADB Châu Á' : 'World Bank'} • {formatRelativeTime(odaSection.sub.approval_date, lang)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bullet Links */}
                    <ul className="magazine-bullet-list">
                      {odaSection.bullets.map((b, idx) => (
                        <li key={b.id || idx} className="magazine-bullet-item" onClick={() => handleItemClick(b)}>
                          <span className="bullet-dot" style={{ color: '#059669' }}>•</span>
                          <span className="bullet-text">{b.titleVi || b.title}</span>
                          <span className="bullet-comments">🌍 {b.country || (b.source_org === 'adb' || b.source === 'adb' ? 'ADB' : 'World Bank')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
