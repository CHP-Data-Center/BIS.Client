// src/pages/TrendingPage.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame, TrendingUp, Newspaper, Building2, Globe, ShoppingBag,
  Clock, Bookmark, BookmarkCheck,
  ChevronRight, RefreshCw, DollarSign, ArrowUpRight, ExternalLink,
  Play, Camera, Loader2, Sparkles, AlertCircle, FileText, CheckCircle2,
  HardHat, Landmark, Search, ArrowLeft, ChevronLeft, X,
  Zap, Crown, Trophy, Award, Star
} from 'lucide-react';
import { articlesService } from '../services/articles';
import { odaService } from '../services/oda';
import { statsService } from '../services/stats';
import { keywordsService } from '../services/keywords';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
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

// ── Filter Infrastructure articles for when user doesn't have Procurement ──
function filterInfraArticles(articles, tabIdx) {
  if (tabIdx === 0 || !articles.length) return articles;
  const kwMap = {
    1: ['cao tốc', 'cầu', 'đường bộ', 'hầm', 'ninh bình', 'hải phòng', 'bắc nam', 'vành đai', 'giao thông'],
    2: ['xây dựng', 'hạ tầng', 'thi công', 'vật liệu', 'khởi công', 'tiến độ', 'dự án', 'chủ đầu tư'],
    3: ['đô thị', 'metro', 'xe buýt', 'sân bay', 'nội bài', 'tân sơn nhất', 'long thành', 'cảng', 'logistics'],
    4: ['năng lượng', 'điện', 'bất động sản', 'khu công nghiệp', 'nhà xưởng', 'khu kinh tế'],
  };
  const keywords = kwMap[tabIdx] || [];
  const matched = articles.filter(a => {
    const text = `${a.title || ''} ${a.title_vi || ''} ${a.excerpt || ''} ${a.excerpt_vi || ''} ${(a.matched_keywords || []).join(' ')}`.toLowerCase();
    return keywords.some(k => text.includes(k));
  });
  return matched.length > 0 ? matched : articles;
}

// ── Filter Macro & Policy articles for when user doesn't have ODA ──
function filterMacroArticles(articles, tabIdx) {
  if (tabIdx === 0 || !articles.length) return articles;
  const kwMap = {
    1: ['chính sách', 'nghị định', 'thủ tướng', 'chính phủ', 'bộ', 'luật', 'công điện', 'văn bản'],
    2: ['ngân hàng', 'lãi suất', 'tín dụng', 'tiền tệ', 'lạm phát', 'tài chính', 'thuế', 'kho bạc'],
    3: ['quốc tế', 'thương mại', 'xuất khẩu', 'nhập khẩu', 'fdi', 'đối tác', 'toàn cầu', 'hợp tác'],
    4: ['đầu tư công', 'giải ngân', 'ngân sách', 'vốn đầu tư', 'kế hoạch vốn', 'phân bổ'],
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

// ── Khối hình ảnh chuẩn hóa: có ảnh thì hiển thị ảnh, không có ảnh thì hiển thị placeholder sang trọng cùng chiều cao để không bị lệch hàng hay nhảy chữ ──
function ArticleMediaPlaceholder({ imageUrl, alt, category, height = 130, className = 'magazine-lead-media' }) {
  const [imgErr, setImgErr] = useState(false);

  if (imageUrl && !imgErr) {
    return (
      <div className={className} style={{ height, position: 'relative', overflow: 'hidden', borderRadius: 9, flexShrink: 0 }}>
        <img
          src={imageUrl}
          alt={alt || ''}
          onError={() => setImgErr(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  return (
    <div
      className={`${className} article-placeholder-box`}
      style={{
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        background: 'linear-gradient(135deg, var(--bg-surface-2), var(--bg-surface-3, rgba(241, 245, 249, 0.95)))',
        border: '1px solid var(--border-subtle)',
        borderRadius: 9,
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'rgba(37, 99, 235, 0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--brand-600)',
      }}>
        <Newspaper size={18} />
      </div>
      <span style={{
        fontSize: 11, fontWeight: 700,
        color: 'var(--text-muted)',
        letterSpacing: '0.2px',
      }}>
        {category || 'Bản tin Báo chí & Đầu tư'}
      </span>
    </div>
  );
}

// ── Skeleton Loader trang nhã đồng bộ ──
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

const TrendingPageSkeleton = TrendingMagazineSkeleton;

// ── Trending Marquee Strip (Tương tự Dashboard, có highlight từ khóa đã lưu của người dùng) ──
function TrendingMarqueeStrip({ keywords, userKeywords, onSelectKeyword, activeTag, onClearTag }) {
  const { t } = useLang();

  const displayKeywords = (keywords && keywords.length > 0) ? keywords : [
    { term: 'đấu thầu', count: 490 },
    { term: 'cầu', count: 348 },
    { term: 'giao thông', count: 272 },
    { term: 'cao tốc', count: 187 },
    { term: 'đường sắt', count: 116 },
    { term: 'Lưới điện', count: 10 },
    { term: 'Chuyển đổi số', count: 12 },
    { term: 'dự án', count: 678 },
    { term: 'ODA', count: 654 },
    { term: 'năng lượng', count: 95 },
  ];

  const userKeywordTerms = useMemo(() => {
    return new Set(userKeywords.map(k => (k.term || k.display_term || '').toLowerCase().trim()).filter(Boolean));
  }, [userKeywords]);

  const isUserKeyword = useCallback((term) => {
    if (!term || userKeywordTerms.size === 0) return false;
    const lower = term.toLowerCase().trim();
    if (userKeywordTerms.has(lower)) return true;
    for (const uk of userKeywordTerms) {
      if (lower.includes(uk) || uk.includes(lower)) return true;
    }
    return false;
  }, [userKeywordTerms]);

  const userMatchedCount = useMemo(() => {
    return displayKeywords.filter(k => isUserKeyword(k.term)).length;
  }, [displayKeywords, isUserKeyword]);

  const repeatCount = Math.max(2, Math.ceil(18 / displayKeywords.length));
  const baseList = Array(repeatCount).fill(displayKeywords).flat();
  const items = [...baseList, ...baseList];

  return (
    <div className="trending-strip" style={{ marginTop: 14, marginBottom: 20 }}>
      <div className="trending-strip-header">
        <div className="trending-strip-title">
          <Zap size={15} style={{ color: '#f59e0b', animation: 'pulse 1.8s ease-in-out infinite' }} />
          <span>{t('dashboard.trendingTitle')}</span>
        </div>
        <span className="hot-badge">{t('badge.live')}</span>

        {displayKeywords.slice(0, 1).map((kw, i) => (
          <span
            key={i}
            className="top-kw-pill"
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectKeyword(kw.term)}
            title={`Top #1 thị trường: ${kw.term}`}
          >
            <Crown size={14} style={{ color: '#d97706', fill: '#f59e0b', filter: 'drop-shadow(0 2px 4px rgba(245,158,11,0.4))' }} />
            <span>{kw.term}</span>
            <span className="top-kw-count">{kw.count}</span>
          </span>
        ))}

        {userMatchedCount > 0 && (
          <span className="user-matched-summary-pill" title="Các từ khóa bạn đã lưu đang nằm trong top xu hướng thị trường">
            <Star size={13} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
            <span>{userMatchedCount} từ khóa của bạn đang nổi bật</span>
          </span>
        )}

        <span className="trending-hint">
          {activeTag ? (
            <button
              onClick={onClearTag}
              style={{
                background: '#ef4444', color: '#fff', border: 'none',
                padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
              }}
            >
              <span>Đang lọc: #{activeTag}</span>
              <X size={12} />
            </button>
          ) : (
            '↔ Di chuột để dừng · Click từ khóa để lọc bài'
          )}
        </span>
      </div>

      <div className="trending-marquee-wrapper">
        <div className="trending-marquee-track">
          {items.map((kw, i) => {
            const originalRank = (i % displayKeywords.length) + 1;
            const isTop3 = originalRank <= 3;
            const isMyKw = isUserKeyword(kw.term);
            const isActive = activeTag && activeTag.toLowerCase() === kw.term.toLowerCase();

            return (
              <span
                key={i}
                className={`trending-keyword-chip ${originalRank === 1 ? 'rank-1' : originalRank === 2 ? 'rank-2' : originalRank === 3 ? 'rank-3' : ''} ${isMyKw ? 'user-matched-chip' : ''}`}
                style={isActive ? { borderColor: '#2563eb', background: 'var(--brand-50)', color: 'var(--brand-700)', fontWeight: 800 } : {}}
                onClick={() => onSelectKeyword(kw.term)}
                title={isMyKw ? `★ Từ khóa bạn theo dõi: "${kw.term}" (${kw.count})` : `Hạng #${originalRank}: ${kw.term} (${kw.count})`}
              >
                {isMyKw ? (
                  <Star size={12} style={{ color: '#d97706', fill: '#f59e0b', flexShrink: 0 }} />
                ) : isTop3 ? (
                  originalRank === 1 ? <Crown size={14} style={{ color: '#d97706', fill: '#f59e0b', flexShrink: 0 }} /> :
                  originalRank === 2 ? <Trophy size={13} style={{ color: '#64748b', fill: '#94a3b8', flexShrink: 0 }} /> :
                  <Award size={13} style={{ color: '#ea580c', fill: '#f97316', flexShrink: 0 }} />
                ) : null}

                <span className="chip-term-text">{kw.term}</span>
                <span className="chip-count-tag">{kw.count}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Module-level timestamp to prevent redundant network fetches on rapid tab switching
let trendingLastFetchTime = 0;
let trendingLastLang = '';
let trendingLastUserKey = '';

export default function TrendingPage() {
  const { t, lang } = useLang();
  const nav = useNavigate();
  const { user, hasSourceAccess } = useAuth();

  // Kiểm tra gói đã mua của người dùng
  const canAdb = hasSourceAccess('adb');
  const canWb = hasSourceAccess('worldbank');
  const canProc = hasSourceAccess('gov');
  const userKey = `${user?.id || 'guest'}_${user?.active_package || 'free'}_${canAdb}_${canWb}_${canProc}`;

  const [activeSourceFilter, setActiveSourceFilter] = useState('all'); // all, press, adb, worldbank, gov
  const [bizSubTab, setBizSubTab] = useState(0);
  const [infraSubTab, setInfraSubTab] = useState(0);
  const [macroSubTab, setMacroSubTab] = useState(0);
  const [procSubTab, setProcSubTab] = useState(0);
  const [odaSubTab, setOdaSubTab] = useState(0);

  const [refreshing, setRefreshing] = useState(false);
  const [bookmarks, setBookmarks] = useState(new Set());

  // State tìm kiếm & phân trang cho chế độ lọc nguồn
  const [filterSearch, setFilterSearch] = useState('');
  const [filterPage, setFilterPage] = useState(1);
  const pageSize = 12;

  // Tự động về trang 1 và xóa tìm kiếm khi đổi tab nguồn
  useEffect(() => {
    setFilterPage(1);
    setFilterSearch('');
  }, [activeSourceFilter]);

  // Real data state from Backend APIs (Hydrated with persistent cache for 0ms instant loading)
  const [articles, setArticles] = useState(() => apiCache.get(`trending:articles:${lang}`) || apiCache.get('trending:articles') || []);
  const [adbProjects, setAdbProjects] = useState(() => canAdb ? (apiCache.get(`trending:adb:${lang}`) || apiCache.get('trending:adb') || []) : []);
  const [wbProjects, setWbProjects] = useState(() => canWb ? (apiCache.get(`trending:wb:${lang}`) || apiCache.get('trending:wb') || []) : []);
  const [procurementItems, setProcurementItems] = useState(() => canProc ? (apiCache.get(`trending:proc:${lang}`) || apiCache.get('trending:proc') || []) : []);

  // State từ khóa đã lưu của người dùng & từ khóa xu hướng thị trường
  const [userKeywords, setUserKeywords] = useState(() => apiCache.get(`keywords:all:${lang}`) || []);
  const [trendingKeywords, setTrendingKeywords] = useState(() => apiCache.get('trending:keywords_strip') || []);
  const [activeTrendingTag, setActiveTrendingTag] = useState(null);

  const hasAnyData = (articles && articles.length > 0) || (canAdb && adbProjects.length > 0) || (canWb && wbProjects.length > 0) || (canProc && procurementItems.length > 0);
  const [loading, setLoading] = useState(() => !hasAnyData);

  // Set các term của userKeywords (lowercase, trimmed)
  const userKeywordTerms = useMemo(() => {
    return new Set(userKeywords.map(k => (k.term || k.display_term || '').toLowerCase().trim()).filter(Boolean));
  }, [userKeywords]);

  // Set các term của trendingKeywords (lowercase, trimmed)
  const trendingKeywordTerms = useMemo(() => {
    return new Set(trendingKeywords.map(k => (k.term || '').toLowerCase().trim()).filter(Boolean));
  }, [trendingKeywords]);

  // Kiểm tra xem 1 từ khóa có thuộc danh sách theo dõi của người dùng không
  const isUserKeyword = useCallback((term) => {
    if (!term || userKeywordTerms.size === 0) return false;
    const lower = term.toLowerCase().trim();
    if (userKeywordTerms.has(lower)) return true;
    for (const uk of userKeywordTerms) {
      if (lower.includes(uk) || uk.includes(lower)) return true;
    }
    return false;
  }, [userKeywordTerms]);

  // Lấy chi tiết các từ khóa khớp cho 1 item (bài báo, dự án ODA, gói thầu)
  const getMatchedUserKeywords = useCallback((item) => {
    if (!item) return [];
    const text = `${item.title || ''} ${item.titleVi || ''} ${item.excerpt || ''} ${item.excerptVi || ''} ${item.ai_summary || ''} ${(item.matched_keywords || []).join(' ')} ${item.sector || ''} ${item.procuring_entity || ''} ${item.country || ''}`.toLowerCase();
    
    const matched = [];
    const seen = new Set();

    // 1. Đối soát với các từ khóa người dùng đã lưu
    if (userKeywords.length > 0) {
      userKeywords.forEach(k => {
        const term = (k.term || k.display_term || '').toLowerCase().trim();
        if (term && text.includes(term) && !seen.has(term)) {
          seen.add(term);
          const isTrending = trendingKeywordTerms.has(term) || Array.from(trendingKeywordTerms).some(tk => term.includes(tk) || tk.includes(term));
          matched.push({
            term: k.display_term || k.term,
            isTrending,
            isUserKeyword: true
          });
        }
      });
    }

    // 2. Đối soát với matched_keywords có sẵn của item
    if (item.matched_keywords && Array.isArray(item.matched_keywords)) {
      item.matched_keywords.forEach(mk => {
        const lower = mk.toLowerCase().trim();
        if (lower && !seen.has(lower)) {
          seen.add(lower);
          const isUser = isUserKeyword(lower);
          const isTrending = trendingKeywordTerms.has(lower) || Array.from(trendingKeywordTerms).some(tk => lower.includes(tk) || tk.includes(lower));
          matched.push({
            term: mk,
            isTrending,
            isUserKeyword: isUser
          });
        }
      });
    }

    return matched;
  }, [userKeywords, userKeywordTerms, trendingKeywordTerms, isUserKeyword]);

  // Tự động chuyển về 'all' nếu filter đang ở nguồn chưa mua gói
  useEffect(() => {
    if (activeSourceFilter === 'adb' && !canAdb) setActiveSourceFilter('all');
    if (activeSourceFilter === 'worldbank' && !canWb) setActiveSourceFilter('all');
    if (activeSourceFilter === 'gov' && !canProc) setActiveSourceFilter('all');
  }, [activeSourceFilter, canAdb, canWb, canProc]);

  // Tự động tải lại dữ liệu khi đổi tài khoản (từ free sang VIP hoặc ngược lại)
  useEffect(() => {
    if (trendingLastUserKey && trendingLastUserKey !== userKey) {
      trendingLastFetchTime = 0;
      loadRealData(true);
    }
  }, [userKey]);

  // Progressive parallel loading with cache protection (CHỈ gọi nguồn đã mua gói)
  const loadRealData = async (force = false) => {
    const now = Date.now();
    const isLangChanged = trendingLastLang !== lang;
    const isUserChanged = trendingLastUserKey !== userKey;

    if (!force && !isLangChanged && !isUserChanged && hasAnyData && (now - trendingLastFetchTime < 180000)) {
      return;
    }

    trendingLastUserKey = userKey;
    trendingLastLang = lang;
    trendingLastFetchTime = now;

    if (force) setRefreshing(true);
    else if (!hasAnyData) setLoading(true);

    const fetchArticles = articlesService.getArticles({
      size: 60,
      sort: 'newest',
      only_my_keywords: false,
      ...(lang !== 'vi' ? { lang } : {})
    }, force)
      .then(res => {
        if (res?.items) {
          setArticles(res.items);
          apiCache.set(`trending:articles:${lang}`, res.items, 300000);
          apiCache.set('trending:articles', res.items, 300000);
          // Mở khóa giao diện ngay khi bài viết chính đã tải về (không chờ API phụ)
          setLoading(false);
        }
      }).catch(err => console.warn('Articles error:', err));

    const fetchAdb = canAdb
      ? odaService.getProjects({ source: 'adb', size: 30, ...(lang !== 'vi' ? { lang } : {}) }, force)
          .then(res => {
            if (res?.items) {
              setAdbProjects(res.items);
              apiCache.set(`trending:adb:${lang}`, res.items, 300000);
              apiCache.set('trending:adb', res.items, 300000);
            }
          }).catch(err => console.warn('ADB error:', err))
      : Promise.resolve().then(() => setAdbProjects([]));

    const fetchWb = canWb
      ? odaService.getProjects({ source: 'worldbank', size: 30, ...(lang !== 'vi' ? { lang } : {}) }, force)
          .then(res => {
            if (res?.items) {
              setWbProjects(res.items);
              apiCache.set(`trending:wb:${lang}`, res.items, 300000);
              apiCache.set('trending:wb', res.items, 300000);
            }
          }).catch(err => console.warn('WB error:', err))
      : Promise.resolve().then(() => setWbProjects([]));

    const fetchProc = canProc
      ? odaService.getProcurement({ size: 30, ...(lang !== 'vi' ? { lang } : {}) }, force)
          .then(res => {
            if (res?.items) {
              setProcurementItems(res.items);
              apiCache.set(`trending:proc:${lang}`, res.items, 300000);
              apiCache.set('trending:proc', res.items, 300000);
            }
          }).catch(err => console.warn('Procurement error:', err))
      : Promise.resolve().then(() => setProcurementItems([]));

    const fetchKeywords = keywordsService.getKeywords(force)
      .then(kws => {
        if (Array.isArray(kws)) {
          setUserKeywords(kws);
          apiCache.set(`keywords:all:${lang}`, kws, 60000);
        }
      }).catch(err => console.warn('Keywords error:', err));

    const fetchTrendingKws = statsService.getTrending(25, force)
      .then(res => {
        if (Array.isArray(res) && res.length > 0) {
          setTrendingKeywords(res);
          apiCache.set('trending:keywords_strip', res, 300000);
        }
      }).catch(err => console.warn('Trending keywords error:', err));

    await Promise.allSettled([fetchArticles, fetchAdb, fetchWb, fetchProc, fetchKeywords, fetchTrendingKws]);
    trendingLastFetchTime = Date.now();
    trendingLastLang = lang;
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadRealData();
  }, [lang, canAdb, canWb, canProc]);

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

  // Adapter chuẩn hóa ODA & Procurement để giữ nguyên đầy đủ thuộc tính dữ liệu
  const adaptOda = (p) => ({
    ...p,
    id: `${p.source_org || p.source || 'oda'}-${p.id}`,
    original_id: p.external_id || p.id,
    source: p.source_org || p.source || 'oda',
    source_name: (p.source_org === 'adb' || p.source === 'adb') ? 'ADB' : 'World Bank',
    titleVi: p.title_vi || p.title,
    date: p.approval_date || p.date,
    published_at: p.approval_date || p.date,
  });

  const adaptProc = (p) => ({
    ...p,
    id: `proc-${p.id}`,
    original_id: p.id,
    source: 'gov',
    source_name: 'Đấu Thầu Công',
    titleVi: p.title,
    date: p.publish_date || p.date,
    published_at: p.publish_date || p.date,
  });

  // Combined pool of all items based on active source filter (Gộp đầy đủ dữ liệu theo gói đã mua)
  // Dữ liệu bài viết hiển thị: lọc theo activeTrendingTag nếu người dùng click vào từ khóa trên dải marquee
  const displayArticles = useMemo(() => {
    let list = articles;
    if (activeTrendingTag) {
      const q = activeTrendingTag.toLowerCase().trim();
      const filtered = list.filter(item => {
        const text = `${item.title || ''} ${item.titleVi || ''} ${item.excerpt || ''} ${item.excerptVi || ''} ${(item.matched_keywords || []).join(' ')}`.toLowerCase();
        return text.includes(q);
      });
      if (filtered.length > 0) return filtered;
    }
    return list;
  }, [articles, activeTrendingTag]);

  // Combined pool of all items based on active source filter (Gộp đầy đủ dữ liệu theo gói đã mua)
  const filteredArticles = useMemo(() => {
    if (activeSourceFilter === 'press') return displayArticles;
    if (activeSourceFilter === 'adb') return adbProjects.map(adaptOda);
    if (activeSourceFilter === 'worldbank') return wbProjects.map(adaptOda);
    if (activeSourceFilter === 'gov') return procurementItems.map(adaptProc);

    // activeSourceFilter === 'all': Gộp tất cả các nguồn mà người dùng có quyền và có dữ liệu
    const pool = [...displayArticles];
    if (canAdb && adbProjects.length > 0) {
      pool.push(...adbProjects.map(adaptOda));
    }
    if (canWb && wbProjects.length > 0) {
      pool.push(...wbProjects.map(adaptOda));
    }
    if (canProc && procurementItems.length > 0) {
      pool.push(...procurementItems.map(adaptProc));
    }

    // Sắp xếp theo ngày phát hành mới nhất
    return pool.sort((a, b) => {
      const timeA = new Date(a.published_at || a.date || a.publish_date || a.approval_date || 0).getTime();
      const timeB = new Date(b.published_at || b.date || b.publish_date || b.approval_date || 0).getTime();
      return timeB - timeA;
    });
  }, [activeSourceFilter, displayArticles, adbProjects, wbProjects, procurementItems, canAdb, canWb, canProc]);

  // Section 1: Lead Hero Item (Top Trending #1)
  const heroItem = useMemo(() => {
    if (filteredArticles.length > 0) {
      const withImg = filteredArticles.find(a => a.image_url) || filteredArticles[0];
      return withImg;
    }
    return null;
  }, [filteredArticles]);

  // Danh sách các mục còn lại cho chế độ xem lọc nguồn (sau bài heroItem)
  const filteredRemainingItems = useMemo(() => {
    let list = filteredArticles.slice(1);
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase().trim();
      list = list.filter(item => {
        const title = (item.titleVi || item.title || '').toLowerCase();
        const excerpt = (item.excerptVi || item.excerpt || item.ai_summary || '').toLowerCase();
        const extra = (item.country || item.procuring_entity || item.sector || item.category || '').toLowerCase();
        return title.includes(q) || excerpt.includes(q) || extra.includes(q);
      });
    }
    return list;
  }, [filteredArticles, filterSearch]);

  const totalFilteredPages = Math.max(1, Math.ceil(filteredRemainingItems.length / pageSize));
  const currentPageItems = useMemo(() => {
    const start = (filterPage - 1) * pageSize;
    return filteredRemainingItems.slice(start, start + pageSize);
  }, [filteredRemainingItems, filterPage, pageSize]);

  // Section 2: Sub-Spotlight 3 Thẻ Chuẩn Báo Chí (Đồng bộ 100% cho mọi người dùng)
  const spotlightCards = useMemo(() => {
    const cards = [];
    if (displayArticles[1]) cards.push(displayArticles[1]);
    if (displayArticles[2]) cards.push(displayArticles[2]);
    if (displayArticles[3]) cards.push(displayArticles[3]);
    // Đảm bảo đủ 3 thẻ
    while (cards.length < 3 && displayArticles.length > cards.length) {
      cards.push(displayArticles[cards.length]);
    }
    return cards;
  }, [displayArticles]);

  // Section 3: Left Stream 1 & 2 (Đồng bộ cố định, không bị xáo trộn khi mua gói)
  const leftStreamPart1 = useMemo(() => {
    return displayArticles.slice(4, 10);
  }, [displayArticles]);

  const leftStreamPart2 = useMemo(() => {
    return displayArticles.slice(10, 16);
  }, [displayArticles]);

  // Top read articles ranking 1-5 (Đồng bộ cố định)
  const topReadArticles = useMemo(() => {
    return displayArticles.slice(16, 21);
  }, [displayArticles]);

  // Procurement In-Feed Spotlight (Tenders for Left Column - Hiển thị thêm nếu đã mua gói)
  const procInFeed = useMemo(() => {
    return procurementItems.slice(0, 3);
  }, [procurementItems]);

  // ODA In-Feed Spotlight (World Bank & ADB for Left Column - Hiển thị thêm nếu đã mua gói)
  const odaInFeed = useMemo(() => {
    return [...wbProjects, ...adbProjects].slice(0, 3);
  }, [wbProjects, adbProjects]);

  // Section: "Khoa Học & Hạ Tầng Công Trình" 3-Part Feature Hub (Image 3 - Đồng bộ cố định)
  const featureSection = useMemo(() => {
    return {
      lead: displayArticles[21] || displayArticles[0] || null,
      middle: displayArticles.slice(22, 24),
      right: displayArticles.slice(24, 28),
    };
  }, [displayArticles]);

  // Section: "Năng Lượng Net-Zero" & "Bất Động Sản KCN" (Image 4 & 5 - Đồng bộ cố định)
  const energySection = useMemo(() => {
    return {
      lead: displayArticles[28] || displayArticles[1] || null,
      bullets: displayArticles.slice(29, 33),
    };
  }, [displayArticles]);

  const realEstateSection = useMemo(() => {
    return {
      lead: displayArticles[33] || displayArticles[2] || null,
      bullets: displayArticles.slice(34, 38),
    };
  }, [displayArticles]);

  // Section 3: Right Column - Business Section (Dynamically filtered by bizSubTab)
  const businessFiltered = useMemo(() => {
    const pool = displayArticles.slice(38, 50);
    return filterBizArticles(pool.length > 0 ? pool : displayArticles, bizSubTab);
  }, [displayArticles, bizSubTab]);

  const businessSection = useMemo(() => {
    return {
      lead: businessFiltered[0] || displayArticles[0] || null,
      sub: businessFiltered[1] || displayArticles[1] || null,
      bullets: businessFiltered.slice(2, 6).length > 0 ? businessFiltered.slice(2, 6) : displayArticles.slice(0, 4),
    };
  }, [businessFiltered, displayArticles]);

  // Section 3: Right Column - Procurement Section (Nếu đã mua gói)
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

  // Section 3: Right Column - ODA Section (Nếu đã mua gói)
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

  // Section 3: Right Column - Infrastructure News (Đồng bộ cố định)
  const infraFiltered = useMemo(() => {
    const pool = articles.slice(45, 55);
    return filterInfraArticles(pool.length > 0 ? pool : articles, infraSubTab);
  }, [articles, infraSubTab]);

  const infraSection = useMemo(() => {
    return {
      lead: infraFiltered[0] || articles[0] || null,
      sub: infraFiltered[1] || articles[1] || null,
      bullets: infraFiltered.slice(2, 6).length > 0 ? infraFiltered.slice(2, 6) : articles.slice(0, 4),
    };
  }, [infraFiltered, articles]);

  // Section 3: Right Column - Macro & Policy News (Đồng bộ cố định)
  const macroFiltered = useMemo(() => {
    const pool = articles.slice(50, 60);
    return filterMacroArticles(pool.length > 0 ? pool : articles, macroSubTab);
  }, [articles, macroSubTab]);

  const macroSection = useMemo(() => {
    return {
      lead: macroFiltered[0] || articles[0] || null,
      sub: macroFiltered[1] || articles[1] || null,
      bullets: macroFiltered.slice(2, 6).length > 0 ? macroFiltered.slice(2, 6) : articles.slice(0, 4),
    };
  }, [macroFiltered, articles]);

  // Subtabs definitions
  const bizTabs = [
    t('trending.tabAll') || 'Tất cả',
    t('trending.tabInternational') || 'Quốc tế',
    t('trending.tabEnterprise') || 'Doanh nghiệp',
    t('trending.tabMacro') || 'Vĩ mô',
    t('trending.tabCommodities') || 'Hàng hóa',
  ];

  const infraTabs = [
    'Tất cả',
    'Cao tốc & Cầu',
    'Xây dựng & Hạ tầng',
    'Giao thông & Cảng',
    'Năng lượng & KCN',
  ];

  const macroTabs = [
    'Tất cả',
    'Chính sách vĩ mô',
    'Tài chính & Ngân hàng',
    'Thương mại quốc tế',
    'Đầu tư công',
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
              <p className="trending-masthead-sub">
                {canAdb || canWb || canProc
                  ? t('trending.subtitle')
                  : 'Cập nhật trực tiếp các bài viết, tin tức kinh tế và thông tin thị trường nổi bật nhất từ Báo chí'}
              </p>
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



        {/* Source Filter Nav Pills */}
        <div className="trending-source-nav">
          <button
            className={`trending-nav-tab ${activeSourceFilter === 'all' ? 'active' : ''}`}
            onClick={() => {
              setActiveSourceFilter('all');
              setActiveTrendingTag(null);
            }}
          >
            🔥 {t('trending.allSources')}
          </button>
          <button
            className={`trending-nav-tab ${activeSourceFilter === 'press' ? 'active' : ''}`}
            onClick={() => {
              setActiveSourceFilter('press');
              setActiveTrendingTag(null);
            }}
          >
            📰 {t('trending.pressOnly')} ({articles.length})
          </button>
          {canAdb && (
            <button
              className={`trending-nav-tab ${activeSourceFilter === 'adb' ? 'active' : ''}`}
              onClick={() => {
                setActiveSourceFilter('adb');
                setActiveTrendingTag(null);
              }}
            >
              🏦 {t('trending.adbOnly')} ({adbProjects.length})
            </button>
          )}
          {canWb && (
            <button
              className={`trending-nav-tab ${activeSourceFilter === 'worldbank' ? 'active' : ''}`}
              onClick={() => {
                setActiveSourceFilter('worldbank');
                setActiveTrendingTag(null);
              }}
            >
              🌍 {t('trending.wbOnly')} ({wbProjects.length})
            </button>
          )}
          {canProc && (
            <button
              className={`trending-nav-tab ${activeSourceFilter === 'gov' ? 'active' : ''}`}
              onClick={() => {
                setActiveSourceFilter('gov');
                setActiveTrendingTag(null);
              }}
            >
              📋 {t('trending.procOnly')} ({procurementItems.length})
            </button>
          )}
        </div>
      </div>

      {/* ── DẢI TỪ KHÓA ĐANG NỔI BẬT (GIỐNG DASHBOARD + HIGHLIGHT TỪ KHÓA CỦA USER) ── */}
      <TrendingMarqueeStrip
        keywords={trendingKeywords}
        userKeywords={userKeywords}
        activeTag={activeTrendingTag}
        onSelectKeyword={(term) => {
          if (activeTrendingTag === term) {
            setActiveTrendingTag(null);
          } else {
            setActiveTrendingTag(term);
          }
        }}
        onClearTag={() => setActiveTrendingTag(null)}
      />

      {/* Banner thông báo lọc theo từ khóa nổi bật khi click chip */}
      {activeTrendingTag && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
          padding: '10px 18px', background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: 12, marginBottom: 20
        }}>
          <span style={{ fontSize: 13, fontWeight: 750, color: 'var(--brand-700)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Zap size={15} style={{ color: '#f59e0b' }} />
            <span>Đang lọc bài viết theo từ khóa nổi bật: <strong>#{activeTrendingTag}</strong></span>
            {isUserKeyword(activeTrendingTag) && (
              <span className="user-matched-tag-chip" style={{ fontSize: 11, padding: '2px 8px' }}>
                ⭐ Trùng với danh mục bạn theo dõi!
              </span>
            )}
          </span>
          <button
            onClick={() => setActiveTrendingTag(null)}
            style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
            }}
          >
            <X size={13} />
            <span>Bỏ lọc</span>
          </button>
        </div>
      )}

      {loading ? (
        <TrendingMagazineSkeleton />
      ) : activeSourceFilter === 'all' ? (
        <>

          {/* ── SECTION 1: HERO SPOTLIGHT (Tin Đang Trending Số 1 - Hoàn toàn không có comment ảo) ── */}
          {heroItem && (() => {
            const userMatches = getMatchedUserKeywords(heroItem);
            const isUserMatch = userMatches.length > 0;
            const isTrendingMatch = userMatches.some(m => m.isTrending);

            return (
              <section
                className="trending-hero-section"
                onClick={() => handleItemClick(heroItem)}
              >
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
                        {isUserMatch && (
                          <span style={{
                            background: 'rgba(15, 23, 42, 0.78)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(245, 158, 11, 0.5)',
                            color: '#fef08a',
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: 6,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <Star size={11} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                            #{userMatches[0].term}
                          </span>
                        )}
                        <span className="trending-view-count">👁️ {heroItem.match_count ? `${heroItem.match_count * 120 + 350}` : '1.4k'} {t('trending.views')}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="trending-hero-media" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {heroItem.source === 'gov' ? (
                        <ShoppingBag size={64} style={{ color: 'rgba(255,255,255,0.2)' }} />
                      ) : (heroItem.source === 'adb' || heroItem.source === 'worldbank') ? (
                        <Globe size={64} style={{ color: 'rgba(255,255,255,0.2)' }} />
                      ) : (
                        <Newspaper size={64} style={{ color: 'rgba(255,255,255,0.2)' }} />
                      )}
                    </div>
                  )}

                  {/* Right: Editorial Headline & Meta */}
                  <div className="trending-hero-content">
                    <div className="trending-hero-meta-top">
                      <span className="trending-tag-pill">{heroItem.source_name || (heroItem.source === 'adb' ? 'ADB' : heroItem.source === 'worldbank' ? 'World Bank' : heroItem.source === 'gov' ? 'Đấu Thầu' : 'Báo chí')}</span>
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
                        {userMatches.length > 0 ? (
                          userMatches.slice(0, 3).map((m, i) => (
                            <span
                              key={i}
                              className="card-user-kw-badge"
                              style={{ fontSize: 11, padding: '2px 8px' }}
                            >
                              <Star size={10} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                              #{m.term}
                            </span>
                          ))
                        ) : (
                          <span className="trending-stat-item" style={{ color: 'var(--text-muted)' }}>
                            <Clock size={13} /> {formatRelativeTime(heroItem.published_at || heroItem.date, lang)}
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
            );
          })()}

          {/* ── SECTION 2: SUB-HERO 3-COLUMN SPOTLIGHT STRIP (LUÔN ĐẦY ĐỦ 3 CỘT KHÔNG BỊ TRỐNG) ── */}
          <section className="trending-subhero-strip">
            {spotlightCards.map((card, idx) => {
              if (!card) return null;
              const userMatches = getMatchedUserKeywords(card);
              const isUserMatch = userMatches.length > 0;

              // Card kiểu Đấu thầu
              const isProc = card.source === 'gov' || card.source === 'dauthau' || card.kind || card.procuring_entity;
              if (isProc) {
                return (
                  <div
                    key={card.id || `proc-${idx}`}
                    className={`trending-sub-card standard-card ${isUserMatch ? 'article-user-matched' : ''}`}
                    style={{ borderTop: isUserMatch ? '3px solid #f59e0b' : '3px solid #8b5cf6', background: 'linear-gradient(180deg, var(--bg-surface) 0%, rgba(139, 92, 246, 0.03) 100%)' }}
                    onClick={() => handleItemClick(card)}
                  >
                    <div className="sub-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#8b5cf6', color: 'white' }}>
                          {card.kind === 'plan' ? 'KHLCNT' : 'TBMT'}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>● {card.status || 'Đang mở'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {isUserMatch && (
                          <span className="card-user-kw-badge" style={{ fontSize: 9.5, padding: '2px 6px' }}>
                            <Star size={9} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                            #{userMatches[0].term}
                          </span>
                        )}
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)', padding: '2px 8px', borderRadius: 6 }}>
                          e-GP
                        </span>
                      </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, margin: '10px 0' }}>
                      <h3 className="sub-card-title" style={{ fontSize: 14.5, fontWeight: 800, lineHeight: 1.4, color: 'var(--text-primary)' }}>
                        {card.title}
                      </h3>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-surface-2)', padding: '6px 10px', borderRadius: 6 }}>
                        🏛️ <strong>Bên mời thầu:</strong> {card.procuring_entity || 'Mua sắm công'}
                      </div>
                    </div>

                    <div className="sub-card-footer">
                      <span className="sub-card-source" style={{ color: '#8b5cf6', fontWeight: 800 }}>Đấu Thầu Công</span>
                      <span className="sub-card-time">{formatRelativeTime(card.publish_date || card.published_at || card.date, lang)}</span>
                    </div>
                  </div>
                );
              }

              // Card kiểu ODA
              const isOda = card.source === 'adb' || card.source === 'worldbank' || card.source_org === 'adb' || card.source_org === 'worldbank';
              if (isOda) {
                return (
                  <div
                    key={card.id || `oda-${idx}`}
                    className={`trending-sub-card perspective-card ${isUserMatch ? 'article-user-matched' : ''}`}
                    onClick={() => handleItemClick(card)}
                  >
                    <div className="perspective-header">
                      <span className="perspective-badge">{t('trending.perspective')}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {isUserMatch && (
                          <span className="card-user-kw-badge" style={{ fontSize: 9.5, padding: '2px 6px' }}>
                            <Star size={9} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                            #{userMatches[0].term}
                          </span>
                        )}
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#059669', background: 'rgba(5, 150, 105, 0.1)', padding: '2px 8px', borderRadius: 6 }}>
                          🌍 {card.source_org === 'adb' || card.source === 'adb' ? 'ADB' : 'World Bank'}
                        </span>
                      </div>
                    </div>

                    <h3 className="perspective-title">{card.titleVi || card.title}</h3>

                    <p className="perspective-quote">
                      "{card.ai_summary || card.excerpt || (card.country ? `Dự án trọng điểm tại ${card.country} với tổng ngân sách ${card.amount || 'ưu đãi'}.` : card.title)}"
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
                );
              }

              // Card kiểu Báo chí (Press)
              return (
                <div
                  key={card.id || `press-${idx}`}
                  className={`trending-sub-card standard-card ${isUserMatch ? 'article-user-matched' : ''}`}
                  onClick={() => handleItemClick(card)}
                >
                  <div className="sub-card-header">
                    <h3 className="sub-card-title">
                      {card.titleVi || card.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      {isUserMatch && (
                        <span className="card-user-kw-badge" style={{ fontSize: 9.5, padding: '2px 6px' }}>
                          <Star size={9} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                          #{userMatches[0].term}
                        </span>
                      )}
                      {card.category && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-600)', background: 'var(--bg-surface-2)', padding: '2px 8px', borderRadius: 6 }}>
                          {card.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <ArticleMediaPlaceholder
                    imageUrl={card.image_url}
                    alt={card.titleVi || card.title}
                    category={card.category || 'Tiêu điểm'}
                    height={120}
                    className="sub-card-media"
                  />
                  <p className="sub-card-excerpt-text" style={{
                    fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.4,
                    margin: '6px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {card.excerptVi || card.excerpt || card.title}
                  </p>

                  <div className="sub-card-footer">
                    <span className="sub-card-source">{card.source_name || 'Báo Chí'}</span>
                    <span className="sub-card-time">{formatRelativeTime(card.published_at || card.date, lang)}</span>
                  </div>
                </div>
              );
            })}
          </section>

          {/* ── SECTION 3: DUAL-COLUMN NEWSPAPER HUB (Bố cục 2 Cột Báo Điện Tử Cân Bằng) ── */}
          <div className="trending-dual-layout">
            {/* ── CỘT TRÁI (~42%): DÒNG CHẢY TIN NỔI BẬT + GÓI THẦU + DỰ ÁN ODA (Lấp đầy không bị trống) ── */}
            <div className="trending-left-column">
              <div className="column-section-title">
                <span className="section-title-line" />
                <h3 className="section-title-text">
                  <TrendingUp size={16} style={{ color: '#ef4444' }} />
                  {t('trending.newsStream')}
                </h3>
              </div>

              {/* Luồng 1: 6 Bài viết Thời sự */}
              <div className="trending-stream-list">
                  {leftStreamPart1.map((item, idx) => {
                    const userMatches = getMatchedUserKeywords(item);

                    return (
                      <article
                        key={item.id}
                        className="trending-stream-item"
                        onClick={() => handleItemClick(item)}
                        style={{ paddingBottom: 10, gap: 12 }}
                      >
                        {item.image_url ? (
                          <div className="stream-thumb-wrap" style={{ width: 88, height: 60, flexShrink: 0 }}>
                            <img src={item.image_url} alt={item.title} className="stream-thumb" />
                            {idx % 2 === 0 && <span className="media-type-badge video"><Play size={9} fill="white" /></span>}
                            {idx % 2 === 1 && <span className="media-type-badge photo"><Camera size={9} /></span>}
                          </div>
                        ) : (
                          <div className="stream-thumb-wrap" style={{ width: 88, height: 60, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface-2)' }}>
                            <Newspaper size={20} style={{ color: 'var(--text-muted)' }} />
                          </div>
                        )}
                        <div className="stream-content" style={{ gap: 2 }}>
                          <h4 className="stream-title" style={{ fontSize: 13, lineHeight: 1.35 }}>{item.titleVi || item.title}</h4>
                          <p className="stream-excerpt" style={{ fontSize: 11.5, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text-muted)' }}>
                            {item.excerptVi || item.excerpt || (item.titleVi || item.title)}
                          </p>
                          <div className="stream-meta" style={{ marginTop: 2 }}>
                            <span className="stream-time" style={{ fontSize: 11 }}>{formatRelativeTime(item.published_at || item.date, lang)}</span>
                            {userMatches.length > 0 && (
                              <span className="card-user-kw-badge" style={{ fontSize: 10, padding: '1px 6px' }}>
                                <Star size={9.5} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                                #{userMatches[0].term}
                              </span>
                            )}
                            {item.category && (
                              <span style={{ fontSize: 10.5, color: 'var(--text-muted)', background: 'var(--bg-surface-2)', padding: '1px 5px', borderRadius: 4 }}>
                                {item.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}

                {/* Khối Tiêu Điểm: Đấu Thầu & Gói Thầu Mới (Theo gói sở hữu) */}
                {canProc && procInFeed.length > 0 ? (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.04), rgba(59, 130, 246, 0.06))',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: 12, padding: 12, margin: '6px 0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid rgba(139, 92, 246, 0.12)' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ShoppingBag size={14} /> Gói Thầu & KHLCNT Tiêu Điểm
                      </span>
                      <button onClick={() => nav('/potential-projects')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                        Xem tất cả <ChevronRight size={12} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {procInFeed.map((p, pIdx) => {
                        const userMatches = getMatchedUserKeywords(p);
                        const isUserMatch = userMatches.length > 0;

                        return (
                          <div
                            key={p.id || `proc-infeed-${pIdx}`}
                            onClick={() => handleItemClick(p)}
                            style={{
                              background: 'var(--bg-surface)',
                              padding: '8px 10px', borderRadius: 8,
                              border: isUserMatch ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid var(--border-subtle)',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ fontSize: 9.5, fontWeight: 800, color: '#7c3aed', background: 'rgba(139, 92, 246, 0.1)', padding: '1px 5px', borderRadius: 4 }}>
                                  {p.kind === 'plan' ? 'KHLCNT' : 'GÓI THẦU'}
                                </span>
                                {isUserMatch && (
                                  <span className="card-user-kw-badge" style={{ fontSize: 9.5, padding: '1px 5px' }}>
                                    <Star size={9} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                                    #{userMatches[0].term}
                                  </span>
                                )}
                              </div>
                              {p.amount && (
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#059669' }}>
                                  💰 {p.amount}
                                </span>
                              )}
                            </div>
                            <h5 style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.35, margin: '0 0 3px 0', color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {p.title}
                            </h5>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-muted)' }}>
                              <span>{p.investor ? p.investor.slice(0, 30) + '…' : 'Bên mời thầu'}</span>
                              <span>{p.date ? formatRelativeTime(p.date, lang) : 'Mới'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Banner Tiêu Điểm Báo Chí & Đầu Tư */
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
                )}

                {/* Luồng 2: 6 Bài viết Kinh tế tiếp theo */}
                {leftStreamPart2.map((item, idx) => {
                  const userMatches = getMatchedUserKeywords(item);

                  return (
                    <article
                      key={item.id}
                      className="trending-stream-item"
                      onClick={() => handleItemClick(item)}
                      style={{ paddingBottom: 10, gap: 12 }}
                    >
                      {item.image_url ? (
                        <div className="stream-thumb-wrap" style={{ width: 88, height: 60, flexShrink: 0 }}>
                          <img src={item.image_url} alt={item.title} className="stream-thumb" />
                          {idx % 2 === 0 && <span className="media-type-badge video"><Play size={9} fill="white" /></span>}
                          {idx % 2 === 1 && <span className="media-type-badge photo"><Camera size={9} /></span>}
                        </div>
                      ) : (
                        <div className="stream-thumb-wrap" style={{ width: 88, height: 60, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface-2)' }}>
                          <Newspaper size={20} style={{ color: 'var(--text-muted)' }} />
                        </div>
                      )}
                      <div className="stream-content" style={{ gap: 2 }}>
                        <h4 className="stream-title" style={{ fontSize: 13, lineHeight: 1.35 }}>{item.titleVi || item.title}</h4>
                        <p className="stream-excerpt" style={{ fontSize: 11.5, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text-muted)' }}>
                          {item.excerptVi || item.excerpt || (item.titleVi || item.title)}
                        </p>
                        <div className="stream-meta" style={{ marginTop: 2 }}>
                          <span className="stream-time" style={{ fontSize: 11 }}>{formatRelativeTime(item.published_at || item.date, lang)}</span>
                          {userMatches.length > 0 && (
                            <span className="card-user-kw-badge" style={{ fontSize: 10, padding: '1px 6px' }}>
                              <Star size={9.5} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                              #{userMatches[0].term}
                            </span>
                          )}
                          {item.category && (
                            <span style={{ fontSize: 10.5, color: 'var(--text-muted)', background: 'var(--bg-surface-2)', padding: '1px 5px', borderRadius: 4 }}>
                              {item.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}

                {/* Khối Tiêu Điểm: Dự Án ODA (World Bank / ADB) */}
                {(canAdb || canWb) && odaInFeed.length > 0 && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.04), rgba(16, 185, 129, 0.06))',
                    border: '1px solid rgba(5, 150, 105, 0.2)',
                    borderRadius: 12, padding: 12, margin: '6px 0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid rgba(5, 150, 105, 0.12)' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Globe size={14} /> Dự Án ODA (World Bank & ADB)
                      </span>
                      <button onClick={() => nav('/potential-projects')} style={{ background: 'none', border: 'none', color: '#059669', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                        Xem tất cả <ChevronRight size={12} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {odaInFeed.map((oda, oIdx) => {
                        const userMatches = getMatchedUserKeywords(oda);
                        const isUserMatch = userMatches.length > 0;

                        return (
                          <div
                            key={oda.id || `oda-infeed-${oIdx}`}
                            onClick={() => handleItemClick(oda)}
                            style={{
                              background: 'var(--bg-surface)',
                              padding: '8px 10px', borderRadius: 8,
                              border: isUserMatch ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid var(--border-subtle)',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{
                                  fontSize: 9.5, fontWeight: 800,
                                  color: oda.source === 'worldbank' || oda.source_org === 'worldbank' ? '#0284c7' : '#059669',
                                  background: oda.source === 'worldbank' || oda.source_org === 'worldbank' ? 'rgba(2, 132, 199, 0.1)' : 'rgba(5, 150, 105, 0.1)',
                                  padding: '1px 5px', borderRadius: 4
                                }}>
                                  {oda.source === 'worldbank' || oda.source_org === 'worldbank' ? '🌍 WORLD BANK' : '🏦 ADB'}
                                </span>
                                {isUserMatch && (
                                  <span className="card-user-kw-badge" style={{ fontSize: 9.5, padding: '1px 5px' }}>
                                    <Star size={9} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                                    #{userMatches[0].term}
                                  </span>
                                )}
                              </div>
                              {oda.amount && (
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#059669' }}>
                                  💵 {oda.amount}
                                </span>
                              )}
                            </div>
                            <h5 style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.35, margin: '0 0 3px 0', color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {oda.titleVi || oda.title}
                            </h5>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-muted)' }}>
                              <span>{oda.sector || oda.status || 'Đang triển khai'}</span>
                              <span>{oda.date ? formatRelativeTime(oda.date, lang) : 'Cập nhật'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Khối Tin Nóng Đọc Nhiều Nhất (Ranking 1 - 8 như Image 2) */}
                {topReadArticles.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, paddingBottom: 6, borderBottom: '2px solid var(--border)' }}>
                      <Flame size={14} style={{ color: '#ef4444' }} />
                      <span style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--text-primary)' }}>
                        Tin Đang Đọc Nhiều Nhất
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {topReadArticles.map((item, idx) => (
                        <div
                          key={item.id || `top-read-${idx}`}
                          onClick={() => handleItemClick(item)}
                          style={{
                            display: 'grid', gridTemplateColumns: '20px 52px 1fr', gap: 10,
                            alignItems: 'center', paddingBottom: 7, borderBottom: '1px solid var(--border-subtle)',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{
                            fontSize: 14, fontWeight: 900, lineHeight: 1,
                            color: idx < 3 ? '#ef4444' : idx < 6 ? '#f97316' : 'var(--text-muted)',
                            textAlign: 'center'
                          }}>
                            {idx + 1}
                          </span>
                          <div style={{ width: 52, height: 38, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{
                                width: '100%', height: '100%',
                                background: idx % 2 === 0 ? 'linear-gradient(135deg, #1e3a5f, #3b82f6)' : 'linear-gradient(135deg, #064e3b, #10b981)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                <Newspaper size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                              </div>
                            )}
                          </div>
                          <p style={{
                            fontSize: 12.5, fontWeight: 700, lineHeight: 1.35, margin: 0,
                            color: 'var(--text-primary)',
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                          }}>
                            {item.titleVi || item.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── CỘT PHẢI (~58%): CÁC CHUYÊN MỤC THEO NGUỒN & BẢNG CHỈ SỐ (Lấp đầy không để trống) ── */}
            <div className="trending-right-column">
              {/* ── CHUYÊN MỤC 1: KINH DOANH & THỊ TRƯỜNG (Real Articles - Không comment ảo) ── */}
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
                        <ArticleMediaPlaceholder
                          imageUrl={businessSection.lead.image_url}
                          alt={businessSection.lead.titleVi || businessSection.lead.title}
                          category="Kinh Doanh"
                          height={130}
                        />
                        <div className="magazine-lead-info">
                          <h4 className="magazine-lead-title">{businessSection.lead.titleVi || businessSection.lead.title}</h4>
                          <p className="magazine-lead-excerpt">{businessSection.lead.excerptVi || businessSection.lead.excerpt || (businessSection.lead.titleVi || businessSection.lead.title)}</p>
                          <span className="magazine-item-time">
                            <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                            {formatRelativeTime(businessSection.lead.published_at, lang)}
                          </span>
                        </div>
                      </div>

                      {/* Secondary Story (Right) */}
                      {businessSection.sub && (
                        <div className="magazine-lead-card" onClick={() => handleItemClick(businessSection.sub)}>
                          <ArticleMediaPlaceholder
                            imageUrl={businessSection.sub.image_url}
                            alt={businessSection.sub.titleVi || businessSection.sub.title}
                            category="Thị Trường"
                            height={130}
                          />
                          <div className="magazine-lead-info">
                            <h4 className="magazine-lead-title">{businessSection.sub.titleVi || businessSection.sub.title}</h4>
                            <p className="magazine-lead-excerpt">{businessSection.sub.excerptVi || businessSection.sub.excerpt || (businessSection.sub.titleVi || businessSection.sub.title)}</p>
                            <span className="magazine-item-time">
                              <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                              {formatRelativeTime(businessSection.sub.published_at, lang)}
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
                          <span className="bullet-comments" style={{ color: 'var(--text-muted)' }}>
                            {formatRelativeTime(b.published_at || b.date, lang)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}



              {/* ── CHUYÊN MỤC 2: ĐẤU THẦU CÔNG (HOẶC HẠ TẦNG XÂY DỰNG NẾU CHƯA MUA GÓI) ── */}
              {canProc && procurementSection.lead ? (
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
                        style={{ padding: 0, overflow: 'hidden', background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                        onClick={() => handleItemClick(procurementSection.lead)}
                      >
                        {/* Visual Header Banner */}
                        <div style={{
                          height: 95,
                          background: 'linear-gradient(135deg, #3b0764 0%, #6b21a8 60%, #9333ea 100%)',
                          padding: '10px 12px',
                          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                          color: '#fff', position: 'relative'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: 0.5, padding: '2px 7px', borderRadius: 5, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)' }}>
                              {procurementSection.lead.kind === 'plan' ? '📋 KHLCNT' : '🛍️ GÓI THẦU (TBMT)'}
                            </span>
                            <span style={{ fontSize: 10.5, fontWeight: 800, background: 'rgba(16,185,129,0.3)', border: '1px solid rgba(16,185,129,0.6)', padding: '2px 7px', borderRadius: 10, color: '#34d399' }}>
                              ● {procurementSection.lead.status || 'Đang mở'}
                            </span>
                          </div>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 900, textShadow: '0 2px 4px rgba(0,0,0,0.4)', color: '#fef08a' }}>
                              {procurementSection.lead.amount ? `💰 ${procurementSection.lead.amount}` : '🏛️ e-GP Quốc gia'}
                            </div>
                            <div style={{ fontSize: 10, opacity: 0.9, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {procurementSection.lead.procuring_entity || 'Hệ thống Đấu thầu Quốc gia e-GP'}
                            </div>
                          </div>
                        </div>

                        <div className="magazine-lead-info" style={{ padding: '10px 12px' }}>
                          <h4 className="magazine-lead-title" style={{ fontSize: 13, lineHeight: 1.35, WebkitLineClamp: 2 }}>
                            {procurementSection.lead.title}
                          </h4>
                          <span className="magazine-item-time" style={{ marginTop: 'auto', paddingTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                            📋 Đăng tải: {formatRelativeTime(procurementSection.lead.publish_date, lang)}
                          </span>
                        </div>
                      </div>

                      {/* Secondary Procurement Item */}
                      {procurementSection.sub && (
                        <div
                          className="magazine-lead-card"
                          style={{ padding: 0, overflow: 'hidden', background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                          onClick={() => handleItemClick(procurementSection.sub)}
                        >
                          <div style={{
                            height: 95,
                            background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 60%, #6366f1 100%)',
                            padding: '10px 12px',
                            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                            color: '#fff', position: 'relative'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: 0.5, padding: '2px 7px', borderRadius: 5, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                {procurementSection.sub.kind === 'plan' ? '📋 KHLCNT' : '🛍️ GÓI THẦU (TBMT)'}
                              </span>
                              <span style={{ fontSize: 10.5, fontWeight: 800, background: 'rgba(16,185,129,0.3)', border: '1px solid rgba(16,185,129,0.6)', padding: '2px 7px', borderRadius: 10, color: '#34d399' }}>
                                ● {procurementSection.sub.status || 'Đang mở'}
                              </span>
                            </div>
                            <div>
                              <div style={{ fontSize: 16, fontWeight: 900, textShadow: '0 2px 4px rgba(0,0,0,0.4)', color: '#fef08a' }}>
                                {procurementSection.sub.amount ? `💰 ${procurementSection.sub.amount}` : '🏛️ e-GP'}
                              </div>
                              <div style={{ fontSize: 10, opacity: 0.9, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {procurementSection.sub.procuring_entity || 'e-GP'}
                              </div>
                            </div>
                          </div>

                          <div className="magazine-lead-info" style={{ padding: '10px 12px' }}>
                            <h4 className="magazine-lead-title" style={{ fontSize: 13, lineHeight: 1.35, WebkitLineClamp: 2 }}>
                              {procurementSection.sub.title}
                            </h4>
                            <span className="magazine-item-time" style={{ marginTop: 'auto', paddingTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                              📋 Đăng tải: {formatRelativeTime(procurementSection.sub.publish_date, lang)}
                            </span>
                          </div>
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
              ) : infraSection.lead ? (
                /* Thay thế bằng chuyên mục Hạ tầng & Xây dựng từ Báo chí nếu chưa mua gói Đấu thầu */
                <div className="magazine-category-block">
                  <div className="magazine-category-header">
                    <h3 className="magazine-category-main-title" style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <HardHat size={18} /> Hạ Tầng & Xây Dựng
                    </h3>
                    <div className="magazine-subtabs">
                      {infraTabs.map((tab, i) => (
                        <button
                          key={tab}
                          className={`magazine-subtab-btn ${infraSubTab === i ? 'active' : ''}`}
                          onClick={() => setInfraSubTab(i)}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="magazine-category-body">
                    <div className="magazine-lead-row">
                      <div className="magazine-lead-card" onClick={() => handleItemClick(infraSection.lead)}>
                        <ArticleMediaPlaceholder
                          imageUrl={infraSection.lead.image_url}
                          alt={infraSection.lead.titleVi || infraSection.lead.title}
                          category="Hạ Tầng"
                          height={130}
                        />
                        <div className="magazine-lead-info">
                          <h4 className="magazine-lead-title">{infraSection.lead.titleVi || infraSection.lead.title}</h4>
                          <p className="magazine-lead-excerpt">{infraSection.lead.excerptVi || infraSection.lead.excerpt || (infraSection.lead.titleVi || infraSection.lead.title)}</p>
                          <span className="magazine-item-time">
                            <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                            {formatRelativeTime(infraSection.lead.published_at, lang)}
                          </span>
                        </div>
                      </div>

                      {infraSection.sub && (
                        <div className="magazine-lead-card" onClick={() => handleItemClick(infraSection.sub)}>
                          <ArticleMediaPlaceholder
                            imageUrl={infraSection.sub.image_url}
                            alt={infraSection.sub.titleVi || infraSection.sub.title}
                            category="Xây Dựng"
                            height={130}
                          />
                          <div className="magazine-lead-info">
                            <h4 className="magazine-lead-title">{infraSection.sub.titleVi || infraSection.sub.title}</h4>
                            <p className="magazine-lead-excerpt">{infraSection.sub.excerptVi || infraSection.sub.excerpt || (infraSection.sub.titleVi || infraSection.sub.title)}</p>
                            <span className="magazine-item-time">
                              <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                              {formatRelativeTime(infraSection.sub.published_at, lang)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <ul className="magazine-bullet-list">
                      {infraSection.bullets.map((b, idx) => (
                        <li key={b.id || idx} className="magazine-bullet-item" onClick={() => handleItemClick(b)}>
                          <span className="bullet-dot" style={{ color: '#8b5cf6' }}>•</span>
                          <span className="bullet-text">{b.titleVi || b.title}</span>
                          <span className="bullet-comments" style={{ color: 'var(--text-muted)' }}>
                            {formatRelativeTime(b.published_at || b.date, lang)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}

              {/* ── CHUYÊN MỤC 3: DỰ ÁN ODA (HOẶC CHÍNH SÁCH VĨ MÔ NẾU CHƯA MUA GÓI) ── */}
              {(canAdb || canWb) && odaSection.lead ? (
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
                        style={{ padding: 0, overflow: 'hidden', background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                        onClick={() => handleItemClick(odaSection.lead)}
                      >
                        {/* Visual Header Banner */}
                        <div style={{
                          height: 95,
                          background: (odaSection.lead.source_org === 'adb' || odaSection.lead.source === 'adb')
                            ? 'linear-gradient(135deg, #064e3b 0%, #047857 60%, #10b981 100%)'
                            : 'linear-gradient(135deg, #082f49 0%, #0369a1 60%, #0ea5e9 100%)',
                          padding: '10px 12px',
                          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                          color: '#fff', position: 'relative'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: 0.5, padding: '2px 7px', borderRadius: 5, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)' }}>
                              {(odaSection.lead.source_org === 'adb' || odaSection.lead.source === 'adb') ? '🏦 ADB (CHÂU Á)' : '🌍 WORLD BANK'}
                            </span>
                            <span style={{ fontSize: 10.5, fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 12 }}>
                              📍 {odaSection.lead.country || 'Quốc tế'}
                            </span>
                          </div>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 900, textShadow: '0 2px 4px rgba(0,0,0,0.4)', color: '#fef08a' }}>
                              💵 {odaSection.lead.amount || 'Khoản vay ưu đãi'}
                            </div>
                            <div style={{ fontSize: 10, opacity: 0.9, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {odaSection.lead.sector || 'Hạ tầng phát triển'}
                            </div>
                          </div>
                        </div>

                        <div className="magazine-lead-info" style={{ padding: '10px 12px' }}>
                          <h4 className="magazine-lead-title" style={{ fontSize: 13, lineHeight: 1.35, WebkitLineClamp: 2 }}>
                            {odaSection.lead.titleVi || odaSection.lead.title}
                          </h4>
                          <p className="magazine-lead-excerpt" style={{ color: 'var(--text-secondary)', fontSize: 11.5 }}>
                            {odaSection.lead.ai_summary || odaSection.lead.excerpt || (odaSection.lead.sector ? `Lĩnh vực: ${odaSection.lead.sector}` : (odaSection.lead.titleVi || odaSection.lead.title))}
                          </p>
                          <span className="magazine-item-time" style={{ marginTop: 'auto', paddingTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                            🏦 {(odaSection.lead.source_org === 'adb' || odaSection.lead.source === 'adb') ? 'ADB' : 'World Bank'} • {formatRelativeTime(odaSection.lead.approval_date, lang)}
                          </span>
                        </div>
                      </div>

                      {/* Secondary ODA Project Card */}
                      {odaSection.sub && (
                        <div
                          className="magazine-lead-card"
                          style={{ padding: 0, overflow: 'hidden', background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                          onClick={() => handleItemClick(odaSection.sub)}
                        >
                          <div style={{
                            height: 95,
                            background: (odaSection.sub.source_org === 'adb' || odaSection.sub.source === 'adb')
                              ? 'linear-gradient(135deg, #064e3b 0%, #047857 60%, #10b981 100%)'
                              : 'linear-gradient(135deg, #082f49 0%, #0369a1 60%, #0ea5e9 100%)',
                            padding: '10px 12px',
                            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                            color: '#fff', position: 'relative'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: 0.5, padding: '2px 7px', borderRadius: 5, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                {(odaSection.sub.source_org === 'adb' || odaSection.sub.source === 'adb') ? '🏦 ADB (CHÂU Á)' : '🌍 WORLD BANK'}
                              </span>
                              <span style={{ fontSize: 10.5, fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 12 }}>
                                📍 {odaSection.sub.country || 'Quốc tế'}
                              </span>
                            </div>
                            <div>
                              <div style={{ fontSize: 16, fontWeight: 900, textShadow: '0 2px 4px rgba(0,0,0,0.4)', color: '#fef08a' }}>
                                💵 {odaSection.sub.amount || 'Khoản vay ưu đãi'}
                              </div>
                              <div style={{ fontSize: 10, opacity: 0.9, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {odaSection.sub.sector || 'Hạ tầng phát triển'}
                              </div>
                            </div>
                          </div>

                          <div className="magazine-lead-info" style={{ padding: '10px 12px' }}>
                            <h4 className="magazine-lead-title" style={{ fontSize: 13, lineHeight: 1.35, WebkitLineClamp: 2 }}>
                              {odaSection.sub.titleVi || odaSection.sub.title}
                            </h4>
                            <p className="magazine-lead-excerpt" style={{ color: 'var(--text-secondary)', fontSize: 11.5 }}>
                              {odaSection.sub.ai_summary || odaSection.sub.excerpt || (odaSection.sub.sector ? `Lĩnh vực: ${odaSection.sub.sector}` : (odaSection.sub.titleVi || odaSection.sub.title))}
                            </p>
                            <span className="magazine-item-time" style={{ marginTop: 'auto', paddingTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                              🏦 {(odaSection.sub.source_org === 'adb' || odaSection.sub.source === 'adb') ? 'ADB' : 'World Bank'} • {formatRelativeTime(odaSection.sub.approval_date, lang)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bullet Links */}
                    <ul className="magazine-bullet-list">
                      {odaSection.bullets.map((b, idx) => (
                        <li key={b.id || idx} className="magazine-bullet-item" onClick={() => handleItemClick(b)}>
                          <span className="bullet-dot" style={{ color: '#059669' }}>•</span>
                          <span className="bullet-text">{b.titleVi || b.title}</span>
                          <span className="bullet-comments" style={{ color: 'var(--text-muted)' }}>
                            🌍 {b.country || (b.source_org === 'adb' || b.source === 'adb' ? 'ADB' : 'World Bank')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : macroSection.lead ? (
                /* Thay thế bằng chuyên mục Chính sách & Vĩ mô từ Báo chí nếu chưa mua gói ODA */
                <div className="magazine-category-block">
                  <div className="magazine-category-header">
                    <h3 className="magazine-category-main-title" style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Landmark size={18} /> Chính Sách & Kinh Tế Vĩ Mô
                    </h3>
                    <div className="magazine-subtabs">
                      {macroTabs.map((tab, i) => (
                        <button
                          key={tab}
                          className={`magazine-subtab-btn ${macroSubTab === i ? 'active' : ''}`}
                          onClick={() => setMacroSubTab(i)}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="magazine-category-body">
                    <div className="magazine-lead-row">
                      <div className="magazine-lead-card" onClick={() => handleItemClick(macroSection.lead)}>
                        <ArticleMediaPlaceholder
                          imageUrl={macroSection.lead.image_url}
                          alt={macroSection.lead.titleVi || macroSection.lead.title}
                          category="Chính Sách"
                          height={130}
                        />
                        <div className="magazine-lead-info">
                          <h4 className="magazine-lead-title">{macroSection.lead.titleVi || macroSection.lead.title}</h4>
                          <p className="magazine-lead-excerpt">{macroSection.lead.excerptVi || macroSection.lead.excerpt || (macroSection.lead.titleVi || macroSection.lead.title)}</p>
                          <span className="magazine-item-time">
                            <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                            {formatRelativeTime(macroSection.lead.published_at, lang)}
                          </span>
                        </div>
                      </div>

                      {macroSection.sub && (
                        <div className="magazine-lead-card" onClick={() => handleItemClick(macroSection.sub)}>
                          <ArticleMediaPlaceholder
                            imageUrl={macroSection.sub.image_url}
                            alt={macroSection.sub.titleVi || macroSection.sub.title}
                            category="Kinh Tế Vĩ Mô"
                            height={130}
                          />
                          <div className="magazine-lead-info">
                            <h4 className="magazine-lead-title">{macroSection.sub.titleVi || macroSection.sub.title}</h4>
                            <p className="magazine-lead-excerpt">{macroSection.sub.excerptVi || macroSection.sub.excerpt || (macroSection.sub.titleVi || macroSection.sub.title)}</p>
                            <span className="magazine-item-time">
                              <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                              {formatRelativeTime(macroSection.sub.published_at, lang)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <ul className="magazine-bullet-list">
                      {macroSection.bullets.map((b, idx) => (
                        <li key={b.id || idx} className="magazine-bullet-item" onClick={() => handleItemClick(b)}>
                          <span className="bullet-dot" style={{ color: '#059669' }}>•</span>
                          <span className="bullet-text">{b.titleVi || b.title}</span>
                          <span className="bullet-comments" style={{ color: 'var(--text-muted)' }}>
                            {formatRelativeTime(b.published_at || b.date, lang)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}

              {/* ── CHUYÊN MỤC 4: HẠ TẦNG & QUY HOẠCH ĐÔ THỊ (Lấp đầy chiều cao cân bằng tuyệt đối khi user có full gói) ── */}
              {canProc && (canAdb || canWb) && infraSection.lead && (
                <div className="magazine-category-block">
                  <div className="magazine-category-header">
                    <h3 className="magazine-category-main-title" style={{ color: '#0284c7', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <HardHat size={18} /> Hạ Tầng & Quy Hoạch Công Trình
                    </h3>
                    <div className="magazine-subtabs">
                      {infraTabs.map((tab, i) => (
                        <button
                          key={tab}
                          className={`magazine-subtab-btn ${infraSubTab === i ? 'active' : ''}`}
                          onClick={() => setInfraSubTab(i)}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="magazine-category-body">
                    <div className="magazine-lead-row">
                      <div className="magazine-lead-card" onClick={() => handleItemClick(infraSection.lead)}>
                        <ArticleMediaPlaceholder
                          imageUrl={infraSection.lead.image_url}
                          alt={infraSection.lead.titleVi || infraSection.lead.title}
                          category="Hạ Tầng"
                          height={130}
                        />
                        <div className="magazine-lead-info">
                          <h4 className="magazine-lead-title">{infraSection.lead.titleVi || infraSection.lead.title}</h4>
                          <p className="magazine-lead-excerpt">{infraSection.lead.excerptVi || infraSection.lead.excerpt || (infraSection.lead.titleVi || infraSection.lead.title)}</p>
                          <span className="magazine-item-time">
                            <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                            {formatRelativeTime(infraSection.lead.published_at, lang)}
                          </span>
                        </div>
                      </div>

                      {infraSection.sub && (
                        <div className="magazine-lead-card" onClick={() => handleItemClick(infraSection.sub)}>
                          <ArticleMediaPlaceholder
                            imageUrl={infraSection.sub.image_url}
                            alt={infraSection.sub.titleVi || infraSection.sub.title}
                            category="Quy Hoạch"
                            height={130}
                          />
                          <div className="magazine-lead-info">
                            <h4 className="magazine-lead-title">{infraSection.sub.titleVi || infraSection.sub.title}</h4>
                            <p className="magazine-lead-excerpt">{infraSection.sub.excerptVi || infraSection.sub.excerpt || (infraSection.sub.titleVi || infraSection.sub.title)}</p>
                            <span className="magazine-item-time">
                              <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                              {formatRelativeTime(infraSection.sub.published_at, lang)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <ul className="magazine-bullet-list">
                      {infraSection.bullets.map((b, idx) => (
                        <li key={b.id || idx} className="magazine-bullet-item" onClick={() => handleItemClick(b)}>
                          <span className="bullet-dot" style={{ color: '#0284c7' }}>•</span>
                          <span className="bullet-text">{b.titleVi || b.title}</span>
                          <span className="bullet-comments" style={{ color: 'var(--text-muted)' }}>
                            {formatRelativeTime(b.published_at || b.date, lang)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── SECTION 4: FEATURE HUB TRÀN RỘNG (Bố Cục 3 Phần - Phong Cách Image 3) ── */}
          {featureSection.lead && (
            <section className="magazine-feature-hub">
              <div className="column-section-title" style={{ marginBottom: 16 }}>
                <span className="section-title-line" />
                <h3 className="section-title-text">
                  <HardHat size={17} style={{ color: '#0284c7' }} />
                  Hạ Tầng Giao Thông & Công Trình Trọng Điểm
                </h3>
              </div>

              <div className="feature-hub-grid">
                {/* Phần 1 (46%): Thẻ Tin Lớn Nhất (Lead Feature) */}
                <div
                  className="feature-lead-card"
                  onClick={() => handleItemClick(featureSection.lead)}
                  style={{ cursor: 'pointer' }}
                >
                  <ArticleMediaPlaceholder
                    imageUrl={featureSection.lead.image_url}
                    alt={featureSection.lead.titleVi || featureSection.lead.title}
                    category="Hạ Tầng Quốc Gia"
                    height={230}
                  />
                  <h3 style={{
                    fontSize: 17, fontWeight: 800, lineHeight: 1.4, margin: '12px 0 6px 0',
                    color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {featureSection.lead.titleVi || featureSection.lead.title}
                  </h3>
                  <p style={{
                    fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 8px 0',
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {featureSection.lead.excerptVi || featureSection.lead.excerpt || (featureSection.lead.titleVi || featureSection.lead.title)}
                  </p>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600 }}>
                    {formatRelativeTime(featureSection.lead.published_at, lang)} · {featureSection.lead.source_name || 'Báo Giao Thông'}
                  </span>
                </div>

                {/* Phần 2 (26%): 2 Bài Xếp Tầng Ở Giữa */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {featureSection.middle.map((midItem, mIdx) => (
                    <div
                      key={midItem.id || `mid-${mIdx}`}
                      onClick={() => handleItemClick(midItem)}
                      style={{ cursor: 'pointer', paddingBottom: 12, borderBottom: mIdx === 0 ? '1px solid var(--border-subtle)' : 'none' }}
                    >
                      <ArticleMediaPlaceholder
                        imageUrl={midItem.image_url}
                        alt={midItem.titleVi || midItem.title}
                        category="Dự Án"
                        height={115}
                      />
                      <h4 style={{
                        fontSize: 13.5, fontWeight: 700, lineHeight: 1.38, margin: '8px 0 4px 0',
                        color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                      }}>
                        {midItem.titleVi || midItem.title}
                      </h4>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {formatRelativeTime(midItem.published_at, lang)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Phần 3 (28%): 4 Tin Vắn Danh Sách Bên Phải (Ảnh nhỏ + Tiêu đề) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {featureSection.right.map((rItem, rIdx) => (
                    <div
                      key={rItem.id || `right-${rIdx}`}
                      onClick={() => handleItemClick(rItem)}
                      style={{
                        display: 'grid', gridTemplateColumns: '64px 1fr', gap: 10,
                        alignItems: 'center', cursor: 'pointer', paddingBottom: 10,
                        borderBottom: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ width: 64, height: 46, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                        {rItem.image_url ? (
                          <img src={rItem.image_url} alt={rItem.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'var(--bg-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Newspaper size={14} style={{ color: 'var(--text-muted)' }} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h5 style={{
                          fontSize: 12, fontWeight: 700, lineHeight: 1.35, margin: '0 0 2px 0',
                          color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                          {rItem.titleVi || rItem.title}
                        </h5>
                        <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                          {formatRelativeTime(rItem.published_at, lang)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── SECTION 5: 2 CHUYÊN MỤC SONG SONG ĐÁY TRANG (Phong Cách Image 4 & 5) ── */}
          <section className="magazine-bottom-duo">
            {/* Cột 1: Năng Lượng & Môi Trường (Net-Zero) */}
            {energySection.lead && (
              <div className="magazine-category-block" style={{ margin: 0 }}>
                <div className="magazine-category-header">
                  <h3 className="magazine-category-main-title" style={{ color: '#059669' }}>
                    🌱 Năng Lượng & Chuyển Dịch Xanh (Net-Zero)
                  </h3>
                </div>
                <div className="magazine-category-body">
                  <div
                    className="magazine-lead-card"
                    onClick={() => handleItemClick(energySection.lead)}
                    style={{ cursor: 'pointer', marginBottom: 12 }}
                  >
                    <ArticleMediaPlaceholder
                      imageUrl={energySection.lead.image_url}
                      alt={energySection.lead.titleVi || energySection.lead.title}
                      category="Năng Lượng Tái Tạo"
                      height={140}
                    />
                    <div className="magazine-lead-info" style={{ marginTop: 8 }}>
                      <h4 className="magazine-lead-title">{energySection.lead.titleVi || energySection.lead.title}</h4>
                      <p className="magazine-lead-excerpt">{energySection.lead.excerptVi || energySection.lead.excerpt || (energySection.lead.titleVi || energySection.lead.title)}</p>
                      <span className="magazine-item-time">
                        <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                        {formatRelativeTime(energySection.lead.published_at, lang)}
                      </span>
                    </div>
                  </div>

                  <ul className="magazine-bullet-list">
                    {energySection.bullets.map((b, idx) => (
                      <li key={b.id || `energy-b-${idx}`} className="magazine-bullet-item" onClick={() => handleItemClick(b)}>
                        <span className="bullet-dot" style={{ color: '#059669' }}>•</span>
                        <span className="bullet-text">{b.titleVi || b.title}</span>
                        <span className="bullet-comments" style={{ color: 'var(--text-muted)' }}>
                          {formatRelativeTime(b.published_at, lang)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Cột 2: Bất Động Sản Công Nghiệp & Khu Kinh Tế */}
            {realEstateSection.lead && (
              <div className="magazine-category-block" style={{ margin: 0 }}>
                <div className="magazine-category-header">
                  <h3 className="magazine-category-main-title" style={{ color: '#2563eb' }}>
                    🏢 Bất Động Sản Công Nghiệp & FDI
                  </h3>
                </div>
                <div className="magazine-category-body">
                  <div
                    className="magazine-lead-card"
                    onClick={() => handleItemClick(realEstateSection.lead)}
                    style={{ cursor: 'pointer', marginBottom: 12 }}
                  >
                    <ArticleMediaPlaceholder
                      imageUrl={realEstateSection.lead.image_url}
                      alt={realEstateSection.lead.titleVi || realEstateSection.lead.title}
                      category="Khu Công Nghiệp & FDI"
                      height={140}
                    />
                    <div className="magazine-lead-info" style={{ marginTop: 8 }}>
                      <h4 className="magazine-lead-title">{realEstateSection.lead.titleVi || realEstateSection.lead.title}</h4>
                      <p className="magazine-lead-excerpt">{realEstateSection.lead.excerptVi || realEstateSection.lead.excerpt || (realEstateSection.lead.titleVi || realEstateSection.lead.title)}</p>
                      <span className="magazine-item-time">
                        <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                        {formatRelativeTime(realEstateSection.lead.published_at, lang)}
                      </span>
                    </div>
                  </div>

                  <ul className="magazine-bullet-list">
                    {realEstateSection.bullets.map((b, idx) => (
                      <li key={b.id || `re-b-${idx}`} className="magazine-bullet-item" onClick={() => handleItemClick(b)}>
                        <span className="bullet-dot" style={{ color: '#2563eb' }}>•</span>
                        <span className="bullet-text">{b.titleVi || b.title}</span>
                        <span className="bullet-comments" style={{ color: 'var(--text-muted)' }}>
                          {formatRelativeTime(b.published_at, lang)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        </>
      ) : (
        /* ── CHẾ ĐỘ XEM LỌC RIÊNG CHO TỪNG NGUỒN (ADB, World Bank, Đấu thầu, Báo chí) ── */
        <div className="trending-filtered-source-view" style={{ marginTop: 20 }}>
          {/* 1. TOP HEADER & SEARCH BAR */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, padding: '16px 20px', background: 'var(--bg-surface)',
            borderRadius: 16, border: '1px solid var(--border)', marginBottom: 24,
            boxShadow: '0 4px 16px -2px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveSourceFilter('all')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
                  padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s ease'
                }}
              >
                <ArrowLeft size={14} />
                <span>Tạp chí Xu Hướng</span>
              </button>
              <div style={{ height: 20, width: 1, background: 'var(--border)' }} />
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {activeSourceFilter === 'keywords' && <><span>🎯</span> Bản Tin Theo Từ Khóa Đã Lưu ({userKeywords.length} từ khóa)</>}
                {activeSourceFilter === 'adb' && <><span>🏦</span> Dự Án ODA Ngân Hàng Phát Triển Châu Á (ADB)</>}
                {activeSourceFilter === 'worldbank' && <><span>🌍</span> Dự Án ODA Ngân Hàng Thế Giới (World Bank)</>}
                {activeSourceFilter === 'gov' && <><span>📋</span> Gói Thầu & KHLCNT Đấu Thầu Quốc Gia (e-GP)</>}
                {activeSourceFilter === 'press' && <><span>📰</span> Toàn Bộ Bản Tin Báo Chí & Phân Tích Thị Trường</>}
                <span style={{
                  fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                  background: 'var(--brand-50)', color: 'var(--brand-600)', border: '1px solid var(--brand-200)'
                }}>
                  {filteredRemainingItems.length + (heroItem ? 1 : 0)} mục
                </span>
              </h3>
            </div>

            {/* Search Input Box */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '7px 14px', minWidth: 280
            }}>
              <Search size={15} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => {
                  setFilterSearch(e.target.value);
                  setFilterPage(1);
                }}
                placeholder={
                  activeSourceFilter === 'keywords' ? 'Tìm trong bản tin theo từ khóa...' :
                  activeSourceFilter === 'gov' ? 'Tìm gói thầu, bên mời thầu...' :
                  activeSourceFilter === 'adb' || activeSourceFilter === 'worldbank' ? 'Tìm dự án ODA, quốc gia, lĩnh vực...' :
                  'Tìm bài báo theo tiêu đề, chủ đề...'
                }
                style={{
                  border: 'none', background: 'transparent', outline: 'none',
                  fontSize: 13, color: 'var(--text-primary)', width: '100%'
                }}
              />
              {filterSearch && (
                <button
                  onClick={() => setFilterSearch('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Dải Tag Từ Khóa Đã Lưu khi người dùng chọn lọc theo từ khóa */}
          {activeSourceFilter === 'keywords' && userKeywords.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
              padding: '12px 18px', background: 'var(--bg-surface)', borderRadius: 14,
              border: '1px solid var(--border-subtle)', marginBottom: 20,
              boxShadow: '0 2px 10px -2px rgba(0,0,0,0.03)'
            }}>
              <span style={{ fontSize: 12.5, fontWeight: 750, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Flame size={14} style={{ color: '#f59e0b' }} /> Từ khóa theo dõi:
              </span>
              <button
                onClick={() => {
                  setSelectedKeywordTag('all');
                  setFilterPage(1);
                }}
                style={{
                  fontSize: 12, fontWeight: 750, padding: '4px 12px', borderRadius: 20,
                  background: selectedKeywordTag === 'all' ? '#f59e0b' : 'var(--bg-surface-2)',
                  color: selectedKeywordTag === 'all' ? '#fff' : 'var(--text-primary)',
                  border: selectedKeywordTag === 'all' ? 'none' : '1px solid var(--border)',
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
              >
                Tất cả ({userKeywords.length})
              </button>
              {userKeywords.map(k => {
                const term = k.term || k.display_term;
                const isSelected = selectedKeywordTag === term;
                return (
                  <button
                    key={k.id || term}
                    onClick={() => {
                      setSelectedKeywordTag(isSelected ? 'all' : term);
                      setFilterPage(1);
                    }}
                    style={{
                      fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                      background: isSelected ? '#f59e0b' : 'var(--bg-surface-2)',
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      border: isSelected ? '1px solid #f59e0b' : '1px solid var(--border)',
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>#{k.display_term || term}</span>
                  </button>
                );
              })}
              <button
                onClick={() => nav('/keywords')}
                style={{
                  fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                  background: 'none', color: 'var(--brand-600)', border: '1px dashed var(--brand-400)',
                  cursor: 'pointer', marginLeft: 'auto'
                }}
              >
                + Quản lý từ khóa
              </button>
            </div>
          )}

          {/* Trạng thái chưa lưu từ khóa */}
          {activeSourceFilter === 'keywords' && userKeywords.length === 0 && (
            <div style={{
              padding: '44px 24px', textAlign: 'center', background: 'var(--bg-surface)',
              borderRadius: 18, border: '1px dashed var(--border)', marginBottom: 28,
              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)'
            }}>
              <Sparkles size={44} style={{ color: '#f59e0b', margin: '0 auto 14px' }} />
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                Bạn chưa lưu từ khóa theo dõi nào
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 20px', lineHeight: 1.5 }}>
                Hãy thêm các từ khóa về công trình, dự án ODA hoặc lĩnh vực bạn quan tâm (ví dụ: cao tốc, đường sắt, điện gió, World Bank...) để hệ thống tự động lọc bản tin riêng cho bạn.
              </p>
              <button
                onClick={() => nav('/keywords')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 22px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff',
                  border: 'none', fontWeight: 750, fontSize: 13.5, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
                }}
              >
                <span>+ Thêm từ khóa theo dõi ngay</span>
                <ArrowUpRight size={15} />
              </button>
            </div>
          )}

          {/* 2. HERO SHOWCASE CARD (Dự án / Tin tiêu điểm số 1) */}
          {heroItem && !filterSearch && filterPage === 1 && (() => {
            const userMatches = getMatchedUserKeywords(heroItem);
            const isUserMatch = userMatches.length > 0;
            const isTrendingMatch = userMatches.some(m => m.isTrending);

            return (
              <div
                className={`trending-hero-section ${isTrendingMatch ? 'article-user-and-trending-matched' : isUserMatch ? 'article-user-matched' : ''}`}
                onClick={() => handleItemClick(heroItem)}
                style={{
                  borderRadius: 18, border: '1px solid var(--border)', overflow: 'hidden',
                  background: 'var(--bg-surface)', boxShadow: '0 8px 30px -4px rgba(0,0,0,0.08)',
                  marginBottom: 32, cursor: 'pointer'
                }}
              >
                <div className="trending-hero-grid">
                  {heroItem.image_url ? (
                    <div className="trending-hero-media" style={{ minHeight: 300 }}>
                      <img
                        src={heroItem.image_url}
                        alt={heroItem.title}
                        className="trending-hero-img"
                        loading="eager"
                      />
                      <div className="trending-hero-badge-overlay">
                        <span className="trending-pulse-badge" style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)', color: '#fff' }}>
                          🔥 TIÊU ĐIỂM {heroItem.source_name ? heroItem.source_name.toUpperCase() : 'NGUỒN'}
                        </span>
                        {isTrendingMatch ? (
                          <span className="card-user-kw-badge trending-double">
                            🔥⭐ KHỚP XU HƯỚNG: #{userMatches.map(m => m.term).join(', #')}
                          </span>
                        ) : isUserMatch ? (
                          <span className="card-user-kw-badge">
                            🎯 TRÙNG TỪ KHÓA: #{userMatches.map(m => m.term).join(', #')}
                          </span>
                        ) : null}
                        <span className="trending-view-count">👁️ 1.8k lượt đọc</span>
                      </div>
                    </div>
                  ) : (
                    <div className="trending-hero-media" style={{
                      minHeight: 300,
                      background: heroItem.source === 'gov'
                        ? 'linear-gradient(135deg, #1e0a3c 0%, #4c1d95 50%, #7e22ce 100%)'
                        : (heroItem.source === 'adb' || heroItem.source_org === 'adb')
                        ? 'linear-gradient(135deg, #022c22 0%, #065f46 50%, #059669 100%)'
                        : 'linear-gradient(135deg, #082f49 0%, #0369a1 50%, #0ea5e9 100%)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: 30, color: '#fff', textAlign: 'center', position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute', top: 16, left: 16,
                        fontSize: 11, fontWeight: 900, letterSpacing: '0.5px',
                        padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}>
                        🔥 TIÊU ĐIỂM {heroItem.source_name ? heroItem.source_name.toUpperCase() : 'QUỐC TẾ'}
                      </div>
                      <div style={{ fontSize: 52, marginBottom: 14, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
                        {heroItem.source === 'gov' ? '📋' : (heroItem.source === 'adb' || heroItem.source_org === 'adb') ? '🏦' : '🌍'}
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: '#fef08a', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                        {heroItem.amount ? `💰 ${heroItem.amount}` : heroItem.source_name}
                      </div>
                    </div>
                  )}

                  <div className="trending-hero-content" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column' }}>
                    <div className="trending-hero-meta-top" style={{ marginBottom: 12 }}>
                      <span className="trending-tag-pill" style={{ background: 'var(--brand-50)', color: 'var(--brand-600)', border: '1px solid var(--brand-200)' }}>
                        {heroItem.source_name || 'Nguồn dữ liệu'}
                      </span>
                      {heroItem.country && (
                        <span className="trending-category-tag" style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}>
                          📍 {heroItem.country}
                        </span>
                      )}
                      {heroItem.category && (
                        <span className="trending-category-tag">
                          {heroItem.category}
                        </span>
                      )}
                      {isTrendingMatch ? (
                        <span className="card-user-kw-badge trending-double" style={{ fontSize: 10 }}>
                          🔥⭐ Xu hướng bạn theo dõi
                        </span>
                      ) : isUserMatch ? (
                        <span className="card-user-kw-badge" style={{ fontSize: 10 }}>
                          🎯 Trùng từ khóa của bạn
                        </span>
                      ) : null}
                      <span className="trending-time-tag">
                        <Clock size={12} /> {formatRelativeTime(heroItem.published_at || heroItem.date, lang)}
                      </span>
                    </div>

                    <h2 className="trending-hero-title" style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.35, marginBottom: 12, color: 'var(--text-primary)' }}>
                      {heroItem.titleVi || heroItem.title}
                    </h2>

                    <p className="trending-hero-excerpt" style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1, margin: 0 }}>
                      {heroItem.excerptVi || heroItem.excerpt || heroItem.ai_summary || (heroItem.titleVi || heroItem.title)}
                    </p>

                    <div className="trending-hero-footer" style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {heroItem.procuring_entity && (
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-surface-2)', padding: '4px 10px', borderRadius: 6 }}>
                            🏛️ {heroItem.procuring_entity}
                          </span>
                        )}
                        {heroItem.sector && (
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-surface-2)', padding: '4px 10px', borderRadius: 6 }}>
                            🏷️ {heroItem.sector}
                          </span>
                        )}
                        {userMatches.length > 0 && (
                          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#d97706', background: 'rgba(245, 158, 11, 0.12)', padding: '4px 8px', borderRadius: 6 }}>
                            #{userMatches[0].term}
                          </span>
                        )}
                      </div>

                      <button
                        className="article-detail-btn"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8,
                          padding: '9px 18px', borderRadius: 10,
                          background: 'linear-gradient(135deg, var(--brand-600), var(--brand-700))', color: '#fff',
                          fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleItemClick(heroItem);
                        }}
                      >
                        <span>Xem chi tiết nội dung</span>
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 3. CARD GRID (Danh sách thẻ cao cấp) */}
          {filteredRemainingItems.length === 0 ? (
            <div style={{
              padding: '56px 24px', textAlign: 'center', background: 'var(--bg-surface)',
              borderRadius: 16, border: '1px dashed var(--border)', color: 'var(--text-muted)'
            }}>
              <AlertCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Không tìm thấy kết quả phù hợp với "{filterSearch}"</p>
              <button
                onClick={() => setFilterSearch('')}
                style={{
                  marginTop: 14, padding: '8px 18px', borderRadius: 8,
                  background: 'var(--brand-600)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700
                }}
              >
                Xóa bộ lọc tìm kiếm
              </button>
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: 22,
                marginBottom: 36
              }}>
                {currentPageItems.map((item, idx) => {
                  const userMatches = getMatchedUserKeywords(item);
                  const isUserMatch = userMatches.length > 0;
                  const isTrendingMatch = userMatches.some(m => m.isTrending);

                  // 1. Dạng Gói thầu công (e-GP)
                  if (item.source === 'gov' || item.kind) {
                    return (
                      <div
                        key={item.id || idx}
                        className={`trending-luxury-card ${isUserMatch ? 'article-user-matched' : ''}`}
                        style={{
                          borderRadius: 16, border: isUserMatch ? '1.5px solid rgba(245, 158, 11, 0.45)' : '1px solid var(--border)',
                          background: 'var(--bg-surface)',
                          overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer',
                          boxShadow: '0 4px 16px -2px rgba(0,0,0,0.05)', transition: 'all 0.25s ease'
                        }}
                        onClick={() => handleItemClick(item)}
                      >
                        <div style={{
                          height: 100,
                          background: 'linear-gradient(135deg, #2e1065 0%, #581c87 50%, #7e22ce 100%)',
                          padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                          color: '#fff', position: 'relative'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{
                                fontSize: 10.5, fontWeight: 900, letterSpacing: '0.4px',
                                padding: '3px 8px', borderRadius: 6,
                                background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)'
                              }}>
                                {item.kind === 'plan' ? '📋 KHLCNT' : '🛍️ GÓI THẦU (TBMT)'}
                              </span>
                              {isUserMatch && (
                                <span className="card-user-kw-badge" style={{ fontSize: 9.5, padding: '2px 6px' }}>
                                  <Star size={9} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                                  #{userMatches[0].term}
                                </span>
                              )}
                            </div>
                            <span style={{
                              fontSize: 11, fontWeight: 800, color: '#34d399',
                              background: 'rgba(16,185,129,0.25)', padding: '2px 8px', borderRadius: 12
                            }}>
                              ● {item.status || 'Đang mở'}
                            </span>
                          </div>
                          <div>
                            <div style={{ fontSize: 17.5, fontWeight: 900, color: '#fef08a', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                              {item.amount ? `💰 ${item.amount}` : '🏛️ Đấu thầu qua mạng e-GP'}
                            </div>
                          </div>
                        </div>

                        <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <h4 style={{
                            fontSize: 14.5, fontWeight: 800, lineHeight: 1.45, margin: '0 0 10px 0',
                            color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                          }}>
                            {item.title}
                          </h4>
                          <div style={{
                            fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-surface-2)',
                            padding: '7px 10px', borderRadius: 8, marginBottom: 12, lineHeight: 1.4,
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                          }}>
                            🏛️ <strong>Bên mời thầu:</strong> {item.procuring_entity || item.investor || 'Cổng thông tin đấu thầu'}
                          </div>
                          <div style={{
                            marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-subtle)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            fontSize: 11.5, color: 'var(--text-muted)'
                          }}>
                            <span>📅 {formatRelativeTime(item.publish_date || item.date, lang)}</span>
                            <span style={{ color: '#8b5cf6', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              Chi tiết hồ sơ →
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 2. Dạng Dự án ODA (World Bank hoặc ADB)
                  if (item.source === 'adb' || item.source === 'worldbank' || item.source_org) {
                    const isAdb = item.source === 'adb' || item.source_org === 'adb';
                    return (
                      <div
                        key={item.id || idx}
                        className={`trending-luxury-card ${isUserMatch ? 'article-user-matched' : ''}`}
                        style={{
                          borderRadius: 16, border: isUserMatch ? '1.5px solid rgba(245, 158, 11, 0.45)' : '1px solid var(--border)',
                          background: 'var(--bg-surface)',
                          overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer',
                          boxShadow: '0 4px 16px -2px rgba(0,0,0,0.05)', transition: 'all 0.25s ease'
                        }}
                        onClick={() => handleItemClick(item)}
                      >
                        <div style={{
                          height: 100,
                          background: isAdb
                            ? 'linear-gradient(135deg, #022c22 0%, #065f46 50%, #059669 100%)'
                            : 'linear-gradient(135deg, #082f49 0%, #075985 50%, #0284c7 100%)',
                          padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                          color: '#fff', position: 'relative'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{
                                fontSize: 10.5, fontWeight: 900, letterSpacing: '0.4px',
                                padding: '3px 8px', borderRadius: 6,
                                background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)'
                              }}>
                                {isAdb ? '🏦 ADB (CHÂU Á)' : '🌍 WORLD BANK'}
                              </span>
                              {isUserMatch && (
                                <span className="card-user-kw-badge" style={{ fontSize: 9.5, padding: '2px 6px' }}>
                                  <Star size={9} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                                  #{userMatches[0].term}
                                </span>
                              )}
                            </div>
                            <span style={{
                              fontSize: 11, fontWeight: 800, color: '#fff',
                              background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 12
                            }}>
                              📍 {item.country || 'Quốc tế'}
                            </span>
                          </div>
                          <div>
                            <div style={{ fontSize: 17.5, fontWeight: 900, color: '#fef08a', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                              💵 {item.amount || 'Khoản vay ODA'}
                            </div>
                          </div>
                        </div>

                        <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <h4 style={{
                            fontSize: 14.5, fontWeight: 800, lineHeight: 1.45, margin: '0 0 8px 0',
                            color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                          }}>
                            {item.titleVi || item.title}
                          </h4>
                          <p style={{
                            fontSize: 12.5, color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.5,
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                          }}>
                            {item.ai_summary || item.excerpt || (item.sector ? `Lĩnh vực: ${item.sector}` : (item.titleVi || item.title))}
                          </p>
                          <div style={{
                            marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-subtle)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            fontSize: 11.5, color: 'var(--text-muted)'
                          }}>
                            <span>📅 {formatRelativeTime(item.approval_date || item.date, lang)}</span>
                            <span style={{ color: isAdb ? '#059669' : '#0284c7', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              Xem hồ sơ dự án →
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 3. Dạng Báo chí (Press)
                  return (
                    <div
                      key={item.id || idx}
                      className={`trending-luxury-card ${isUserMatch ? 'article-user-matched' : ''}`}
                      style={{
                        borderRadius: 16, border: isUserMatch ? '1.5px solid rgba(245, 158, 11, 0.45)' : '1px solid var(--border)',
                        background: 'var(--bg-surface)',
                        overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer',
                        boxShadow: '0 4px 16px -2px rgba(0,0,0,0.05)', transition: 'all 0.25s ease'
                      }}
                      onClick={() => handleItemClick(item)}
                    >
                      <div style={{ position: 'relative', height: 185, overflow: 'hidden', background: 'var(--bg-surface-2)' }}>
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.titleVi || item.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div style={{
                          display: item.image_url ? 'none' : 'flex',
                          width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center',
                          background: 'linear-gradient(135deg, var(--bg-surface-2) 0%, var(--border-subtle) 100%)'
                        }}>
                          <Newspaper size={36} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                        </div>

                        {/* Floating Category Tag */}
                        <span style={{
                          position: 'absolute', top: 12, left: 12,
                          fontSize: 10.5, fontWeight: 800, letterSpacing: '0.3px',
                          padding: '4px 10px', borderRadius: 6,
                          background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)',
                          color: '#fff', border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                          {item.category || 'Thời Sự & Đầu Tư'}
                        </span>

                        {isUserMatch && (
                          <span className="card-user-kw-badge" style={{
                            position: 'absolute', top: 12, right: 12,
                            fontSize: 10, padding: '3px 8px', zIndex: 2
                          }}>
                            <Star size={10} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                            #{userMatches[0].term}
                          </span>
                        )}

                        {/* Floating Source Pill */}
                        <span style={{
                          position: 'absolute', bottom: 10, right: 12,
                          fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4,
                          background: 'rgba(255, 255, 255, 0.92)', color: '#0f172a',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                          {item.source_name || 'Báo chí'}
                        </span>
                      </div>

                      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h4 style={{
                          fontSize: 15, fontWeight: 800, lineHeight: 1.45, margin: '0 0 8px 0',
                          color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                          {item.titleVi || item.title}
                        </h4>
                        <p style={{
                          fontSize: 12.5, color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.5,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                          {item.excerptVi || item.excerpt || (item.titleVi || item.title)}
                        </p>
                        <div style={{
                          marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-subtle)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          fontSize: 11.5, color: 'var(--text-muted)'
                        }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} /> {formatRelativeTime(item.published_at || item.date, lang)}
                          </span>
                          <span style={{ color: 'var(--brand-600)', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            Đọc bài viết →
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 4. PAGINATION CONTROLS */}
              {totalFilteredPages > 1 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 8, margin: '24px 0 40px 0'
                }}>
                  <button
                    disabled={filterPage === 1}
                    onClick={() => {
                      setFilterPage(p => Math.max(1, p - 1));
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '8px 14px', borderRadius: 10,
                      background: 'var(--bg-surface)', border: '1px solid var(--border)',
                      color: filterPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                      cursor: filterPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13
                    }}
                  >
                    <ChevronLeft size={16} /> Trước
                  </button>

                  {Array.from({ length: totalFilteredPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setFilterPage(pageNum);
                        window.scrollTo({ top: 380, behavior: 'smooth' });
                      }}
                      style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: filterPage === pageNum ? 'var(--brand-600)' : 'var(--bg-surface)',
                        color: filterPage === pageNum ? '#fff' : 'var(--text-primary)',
                        border: filterPage === pageNum ? 'none' : '1px solid var(--border)',
                        fontWeight: 750, fontSize: 13.5, cursor: 'pointer',
                        boxShadow: filterPage === pageNum ? '0 4px 10px rgba(37,99,235,0.3)' : 'none'
                      }}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    disabled={filterPage === totalFilteredPages}
                    onClick={() => {
                      setFilterPage(p => Math.min(totalFilteredPages, p + 1));
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '8px 14px', borderRadius: 10,
                      background: 'var(--bg-surface)', border: '1px solid var(--border)',
                      color: filterPage === totalFilteredPages ? 'var(--text-muted)' : 'var(--text-primary)',
                      cursor: filterPage === totalFilteredPages ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13
                    }}
                  >
                    Sau <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
