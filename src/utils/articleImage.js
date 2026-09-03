// src/utils/articleImage.js
/**
 * Trình hỗ trợ tải ảnh và tạo placeholder chuẩn tạp chí điện tử cho bài viết báo chí.
 * Đảm bảo mọi bài báo (kể cả bài thiếu ảnh hoặc ảnh crawl bị lỗi 404/hotlink)
 * đều có hình ảnh chất lượng cao, đúng ngữ cảnh chủ đề (Metro, Cao tốc, Tài chính, Doanh nghiệp...)
 */

const THEME_IMAGES = {
  metro: 'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80',
  transport: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=800&q=80',
  construction: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=800&q=80',
  earthwork: 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?auto=format&fit=crop&w=800&q=80',
  finance: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80',
  business: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
  meeting: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
  realestate: 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?auto=format&fit=crop&w=800&q=80',
  greenenergy: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80',
  commodities: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
  agriculture: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
  policy: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
};

const DEFAULT_POOL = [
  THEME_IMAGES.business,
  THEME_IMAGES.transport,
  THEME_IMAGES.finance,
  THEME_IMAGES.construction,
  THEME_IMAGES.realestate,
  THEME_IMAGES.meeting,
];

/**
 * Trả về link ảnh thật của bài viết nếu có, hoặc trả về ảnh placeholder đẹp mắt theo chủ đề
 */
export function getArticleImage(article, fallbackIndex = 0) {
  if (article?.image_url && typeof article.image_url === 'string' && article.image_url.trim().length > 10) {
    return article.image_url;
  }
  const text = `${article?.title || ''} ${article?.titleVi || ''} ${article?.title_vi || ''} ${article?.excerpt || ''} ${article?.excerptVi || ''} ${article?.excerpt_vi || ''} ${(article?.matched_keywords || []).join(' ')}`.toLowerCase();

  if (text.includes('metro') || text.includes('tàu điện') || text.includes('đường sắt')) {
    return THEME_IMAGES.metro;
  }
  if (text.includes('cao tốc') || text.includes('cầu') || text.includes('giao thông') || text.includes('đường bộ') || text.includes('hạ tầng') || text.includes('sân bay') || text.includes('cảng')) {
    return THEME_IMAGES.transport;
  }
  if (text.includes('xây dựng') || text.includes('thi công') || text.includes('vật liệu') || text.includes('công trình') || text.includes('khởi công') || text.includes('san lấp')) {
    return THEME_IMAGES.construction;
  }
  if (text.includes('vàng') || text.includes('cổ phiếu') || text.includes('tài chính') || text.includes('chứng khoán') || text.includes('ngân hàng') || text.includes('lãi suất') || text.includes('tỷ giá') || text.includes('usd') || text.includes('vn-index')) {
    return THEME_IMAGES.finance;
  }
  if (text.includes('bất động sản') || text.includes('đất') || text.includes('nhà ở') || text.includes('đô thị') || text.includes('quy hoạch') || text.includes('chung cư')) {
    return THEME_IMAGES.realestate;
  }
  if (text.includes('năng lượng') || text.includes('điện') || text.includes('netzero') || text.includes('môi trường') || text.includes('xanh') || text.includes('khí hậu')) {
    return THEME_IMAGES.greenenergy;
  }
  if (text.includes('hàng hóa') || text.includes('xăng') || text.includes('dầu') || text.includes('logistics') || text.includes('xuất khẩu') || text.includes('ron 95')) {
    return THEME_IMAGES.commodities;
  }
  if (text.includes('nông sản') || text.includes('gạo') || text.includes('cà phê') || text.includes('thủy sản')) {
    return THEME_IMAGES.agriculture;
  }
  if (text.includes('chính sách') || text.includes('chính phủ') || text.includes('quốc hội') || text.includes('nghị định') || text.includes('vĩ mô') || text.includes('luật')) {
    return THEME_IMAGES.policy;
  }
  if (text.includes('doanh nghiệp') || text.includes('công ty') || text.includes('tập đoàn') || text.includes('kinh doanh') || text.includes('thương mại')) {
    return THEME_IMAGES.business;
  }

  const idNum = Math.abs((typeof article?.id === 'number' ? article.id : 0) || fallbackIndex);
  return DEFAULT_POOL[idNum % DEFAULT_POOL.length];
}

/**
 * Fallback khi thẻ <img> bị lỗi tải ảnh từ bên ngoài
 */
export function handleImageFallback(e, article, fallbackIndex = 0) {
  if (!e || !e.currentTarget) return;
  const fallback = getArticleImage(null, fallbackIndex);
  if (e.currentTarget.src !== fallback) {
    e.currentTarget.onerror = null;
    e.currentTarget.src = fallback;
  }
}
