// src/utils/countryFlags.jsx
import React, { useState } from 'react';
import { stripAccents } from './format';

/**
 * Bản đồ toàn diện ánh xạ tên quốc gia (Anh, Việt, ISO-2, ISO-3)
 * sang mã ISO-2 chữ thường tương thích với FlagCDN (https://flagcdn.com).
 */
const COUNTRY_TO_CODE = {
  // Châu Á - Thái Bình Dương
  'vietnam': 'vn', 'viet nam': 'vn', 'việt nam': 'vn', 'vnm': 'vn',
  'china': 'cn', 'prc': 'cn', "people's republic of china": 'cn', 'trung quoc': 'cn', 'chn': 'cn',
  'thailand': 'th', 'thai lan': 'th', 'tha': 'th',
  'indonesia': 'id', 'idn': 'id', 'ino': 'id',
  'philippines': 'ph', 'phl': 'ph', 'phi': 'ph',
  'cambodia': 'kh', 'campuchia': 'kh', 'khm': 'kh', 'cam': 'kh',
  'laos': 'la', 'lao pdr': 'la', "lao people's democratic republic": 'la', 'lao': 'la', 'la': 'la',
  'myanmar': 'mm', 'burma': 'mm', 'mmr': 'mm', 'mya': 'mm',
  'malaysia': 'my', 'mys': 'my', 'mal': 'my',
  'singapore': 'sg', 'sgp': 'sg',
  'japan': 'jp', 'nhat ban': 'jp', 'jpn': 'jp',
  'south korea': 'kr', 'korea, rep.': 'kr', 'korea': 'kr', 'han quoc': 'kr', 'kor': 'kr',
  'north korea': 'kp', "korea, dem. people's rep.": 'kp', 'trieu tien': 'kp', 'prk': 'kp',
  'taiwan': 'tw', 'twn': 'tw',
  'hong kong': 'hk', 'hong kong sar, china': 'hk', 'hkg': 'hk',
  'macao': 'mo', 'macao sar, china': 'mo', 'mac': 'mo',
  'india': 'in', 'an do': 'in', 'ind': 'in',
  'bangladesh': 'bd', 'bgd': 'bd', 'ban': 'bd',
  'pakistan': 'pk', 'pak': 'pk',
  'sri lanka': 'lk', 'lka': 'lk', 'sri': 'lk',
  'nepal': 'np', 'npl': 'np', 'nep': 'np',
  'bhutan': 'bt', 'btn': 'bt', 'bhu': 'bt',
  'maldives': 'mv', 'mdv': 'mv', 'mld': 'mv',
  'afghanistan': 'af', 'afg': 'af',
  'mongolia': 'mn', 'mong co': 'mn', 'mng': 'mn', 'mon': 'mn',
  'kazakhstan': 'kz', 'kaz': 'kz',
  'uzbekistan': 'uz', 'uzb': 'uz',
  'tajikistan': 'tj', 'tjk': 'tj', 'taj': 'tj',
  'kyrgyz republic': 'kg', 'kyrgyzstan': 'kg', 'kgz': 'kg',
  'turkmenistan': 'tm', 'tkm': 'tm',
  'timor-leste': 'tl', 'east timor': 'tl', 'tls': 'tl', 'tim': 'tl',
  'papua new guinea': 'pg', 'png': 'pg',
  'fiji': 'fj', 'fji': 'fj',
  'solomon islands': 'sb', 'slb': 'sb', 'sol': 'sb',
  'vanuatu': 'vu', 'vut': 'vu', 'van': 'vu',
  'samoa': 'ws', 'wsm': 'ws', 'sam': 'ws',
  'tonga': 'to', 'ton': 'to',
  'kiribati': 'ki', 'kir': 'ki',
  'micronesia': 'fm', 'micronesia, fed. sts.': 'fm', 'fsm': 'fm',
  'marshall islands': 'mh', 'mhl': 'mh',
  'palau': 'pw', 'plw': 'pw',
  'tuvalu': 'tv', 'tuv': 'tv',
  'nauru': 'nr', 'nru': 'nr',
  'australia': 'au', 'uc': 'au', 'aus': 'au',
  'new zealand': 'nz', 'nzl': 'nz',

  // Châu Mỹ & Caribe
  'honduras': 'hn', 'hnd': 'hn',
  'brazil': 'br', 'bra': 'br',
  'mexico': 'mx', 'mex': 'mx',
  'argentina': 'ar', 'arg': 'ar',
  'colombia': 'co', 'col': 'co',
  'peru': 'pe', 'per': 'pe',
  'chile': 'cl', 'chl': 'cl',
  'ecuador': 'ec', 'ecu': 'ec',
  'bolivia': 'bo', 'bol': 'bo',
  'paraguay': 'py', 'pry': 'py',
  'uruguay': 'uy', 'ury': 'uy',
  'venezuela': 've', 'ven': 've',
  'guyana': 'gy', 'guy': 'gy',
  'suriname': 'sr', 'sur': 'sr',
  'guatemala': 'gt', 'gtm': 'gt',
  'el salvador': 'sv', 'slv': 'sv',
  'nicaragua': 'ni', 'nic': 'ni',
  'costa rica': 'cr', 'cri': 'cr',
  'panama': 'pa', 'pan': 'pa',
  'belize': 'bz', 'blz': 'bz',
  'cuba': 'cu', 'cub': 'cu',
  'dominican republic': 'do', 'dom': 'do',
  'haiti': 'ht', 'hti': 'ht',
  'jamaica': 'jm', 'jam': 'jm',
  'trinidad and tobago': 'tt', 'tto': 'tt',
  'bahamas': 'bs', 'bhs': 'bs',
  'barbados': 'bb', 'brb': 'bb',
  'saint lucia': 'lc', 'lca': 'lc',
  'saint vincent and the grenadines': 'vc', 'vct': 'vc',
  'grenada': 'gd', 'grd': 'gd',
  'antigua and barbuda': 'ag', 'atg': 'ag',
  'saint kitts and nevis': 'kn', 'kna': 'kn',
  'dominica': 'dm', 'dma': 'dm',
  'united states': 'us', 'usa': 'us', 'my': 'us',
  'canada': 'ca', 'can': 'ca',

  // Châu Phi
  'mauritania': 'mr', 'mrt': 'mr',
  'south africa': 'za', 'nam phi': 'za', 'zaf': 'za',
  'nigeria': 'ng', 'nga': 'ng',
  'sudan': 'sd', 'sdn': 'sd',
  'south sudan': 'ss', 'ssd': 'ss',
  'kenya': 'ke', 'ken': 'ke',
  'ethiopia': 'et', 'eth': 'et',
  'egypt': 'eg', 'egypt, arab republic of': 'eg', 'egypt, arab rep.': 'eg', 'ai cap': 'eg', 'egy': 'eg',
  'morocco': 'ma', 'ma-roc': 'ma', 'mar': 'ma',
  'algeria': 'dz', 'dza': 'dz',
  'tunisia': 'tn', 'tun': 'tn',
  'libya': 'ly', 'lby': 'ly',
  'ghana': 'gh', 'gha': 'gh',
  'tanzania': 'tz', 'tza': 'tz',
  'uganda': 'ug', 'uga': 'ug',
  'angola': 'ao', 'ago': 'ao',
  'mozambique': 'mz', 'moz': 'mz',
  'madagascar': 'mg', 'mdg': 'mg',
  'cameroon': 'cm', 'cmr': 'cm',
  "cote d'ivoire": 'ci', "côte d'ivoire": 'ci', 'ivory coast': 'ci', 'civ': 'ci',
  'senegal': 'sn', 'sen': 'sn',
  'zambia': 'zm', 'zmb': 'zm',
  'zimbabwe': 'zw', 'zwe': 'zw',
  'rwanda': 'rw', 'rwa': 'rw',
  'malawi': 'mw', 'mwi': 'mw',
  'mali': 'ml', 'mli': 'ml',
  'burkina faso': 'bf', 'bfa': 'bf',
  'niger': 'ne', 'ner': 'ne',
  'chad': 'td', 'tcd': 'td',
  'somalia': 'so', 'som': 'so',
  'guinea': 'gn', 'gin': 'gn',
  'guinea-bissau': 'gw', 'gnb': 'gw',
  'benin': 'bj', 'ben': 'bj',
  'togo': 'tg', 'tgo': 'tg',
  'sierra leone': 'sl', 'sle': 'sl',
  'liberia': 'lr', 'lbr': 'lr',
  'central african republic': 'cf', 'caf': 'cf',
  'congo, dem. rep.': 'cd', 'democratic republic of the congo': 'cd', 'congo, democratic republic of': 'cd', 'dr congo': 'cd', 'cod': 'cd',
  'congo, rep.': 'cg', 'republic of the congo': 'cg', 'congo': 'cg', 'cog': 'cg',
  'gabon': 'ga', 'gab': 'ga',
  'equatorial guinea': 'gq', 'gnq': 'gq',
  'botswana': 'bw', 'bwa': 'bw',
  'namibia': 'na', 'nam': 'na',
  'lesotho': 'ls', 'lso': 'ls',
  'eswatini': 'sz', 'swaziland': 'sz', 'swz': 'sz',
  'mauritius': 'mu', 'mus': 'mu',
  'seychelles': 'sc', 'syc': 'sc',
  'comoros': 'km', 'com': 'km',
  'cape verde': 'cv', 'cabo verde': 'cv', 'cpv': 'cv',
  'sao tome and principe': 'st', 'stp': 'st',
  'djibouti': 'dj', 'dji': 'dj',
  'eritrea': 'er', 'eri': 'er',
  'burundi': 'bi', 'bdi': 'bi',

  // Châu Âu & Trung Đông
  'ukraine': 'ua', 'ukraina': 'ua', 'ukr': 'ua',
  'turkey': 'tr', 'turkiye': 'tr', 'türkiye': 'tr', 'tho nhi ky': 'tr', 'tur': 'tr',
  'jordan': 'jo', 'jor': 'jo',
  'yemen': 'ye', 'yemen, republic of': 'ye', 'yemen, rep.': 'ye', 'yem': 'ye',
  'west bank and gaza': 'ps', 'palestine': 'ps', 'pse': 'ps',
  'armenia': 'am', 'arm': 'am',
  'georgia': 'ge', 'geo': 'ge',
  'azerbaijan': 'az', 'aze': 'az',
  'iraq': 'iq', 'irq': 'iq',
  'lebanon': 'lb', 'lbn': 'lb',
  'syria': 'sy', 'syrian arab republic': 'sy', 'syr': 'sy',
  'iran': 'ir', 'iran, islamic rep.': 'ir', 'irn': 'ir',
  'saudi arabia': 'sa', 'sau': 'sa',
  'united arab emirates': 'ae', 'uae': 'ae', 'are': 'ae',
  'qatar': 'qa', 'qat': 'qa',
  'kuwait': 'kw', 'kwt': 'kw',
  'oman': 'om', 'omn': 'om',
  'bahrain': 'bh', 'bhr': 'bh',
  'israel': 'il', 'isr': 'il',
  'albania': 'al', 'alb': 'al',
  'bosnia and herzegovina': 'ba', 'bih': 'ba',
  'north macedonia': 'mk', 'macedonia': 'mk', 'mkd': 'mk',
  'montenegro': 'me', 'mne': 'me',
  'serbia': 'rs', 'srb': 'rs',
  'kosovo': 'xk', 'xkx': 'xk',
  'moldova': 'md', 'mda': 'md',
  'belarus': 'by', 'blr': 'by',
  'poland': 'pl', 'ba lan': 'pl', 'pol': 'pl',
  'romania': 'ro', 'rou': 'ro',
  'bulgaria': 'bg', 'bgr': 'bg',
  'hungary': 'hu', 'hun': 'hu',
  'czech republic': 'cz', 'czechia': 'cz', 'cze': 'cz',
  'slovakia': 'sk', 'svk': 'sk',
  'croatia': 'hr', 'hrv': 'hr',
  'slovenia': 'si', 'svn': 'si',
  'united kingdom': 'gb', 'uk': 'gb', 'great britain': 'gb', 'anh': 'gb', 'gbr': 'gb',
  'germany': 'de', 'duc': 'de', 'deu': 'de',
  'france': 'fr', 'phap': 'fr', 'fra': 'fr',
  'italy': 'it', 'y': 'it', 'ita': 'it',
  'spain': 'es', 'tay ban nha': 'es', 'esp': 'es',
  'portugal': 'pt', 'bo dao nha': 'pt', 'prt': 'pt',
  'netherlands': 'nl', 'ha lan': 'nl', 'nld': 'nl',
  'belgium': 'be', 'bi': 'be', 'bel': 'be',
  'switzerland': 'ch', 'thuy si': 'ch', 'che': 'ch',
  'austria': 'at', 'ao': 'at', 'aut': 'at',
  'sweden': 'se', 'thuy dien': 'se', 'swe': 'se',
  'norway': 'no', 'na uy': 'no', 'nor': 'no',
  'denmark': 'dk', 'dan mach': 'dk', 'dnk': 'dk',
  'finland': 'fi', 'phan lan': 'fi', 'fin': 'fi',
  'ireland': 'ie', 'irl': 'ie',
  'greece': 'gr', 'hy lap': 'gr', 'grc': 'gr',
  'cyprus': 'cy', 'cyp': 'cy',
  'malta': 'mt', 'mlt': 'mt',
  'iceland': 'is', 'isl': 'is',
  'luxembourg': 'lu', 'lux': 'lu',
  'russia': 'ru', 'russian federation': 'ru', 'nuoc nga': 'ru', 'rus': 'ru',
};

/**
 * Trả về mã ISO-2 chữ thường (vd: 'cn', 'th', 'mr', 'hn', 'ua', 'ki', 'ng', 'sd')
 * từ tên quốc gia hoặc mã bất kỳ.
 * @param {string} countryName
 * @returns {string|null}
 */
export function getCountryCode(countryName) {
  if (!countryName || typeof countryName !== 'string') return null;
  const clean = countryName.trim().toLowerCase();
  if (!clean) return null;
  if (clean.startsWith('regional') || clean.startsWith('multinational') || clean.startsWith('global')) {
    return null;
  }

  // Nếu là mã 2 ký tự (vd: 'vn', 'th', 'us')
  if (clean.length === 2 && /^[a-z]{2}$/.test(clean)) {
    return clean;
  }

  // Tra cứu theo chuỗi đã chuẩn hóa bỏ dấu
  const normalized = stripAccents(clean).replace(/[^\w\s-]/g, '').trim();
  if (COUNTRY_TO_CODE[normalized]) return COUNTRY_TO_CODE[normalized];
  if (COUNTRY_TO_CODE[clean]) return COUNTRY_TO_CODE[clean];

  // Thử so khớp từng từ nếu có tên dài (vd: "Republic of Kenya" -> "kenya")
  for (const [name, code] of Object.entries(COUNTRY_TO_CODE)) {
    if (name.length >= 4 && (normalized.includes(name) || clean.includes(name))) {
      return code;
    }
  }

  return null;
}

/**
 * Component hiển thị cờ quốc gia bằng FlagCDN chất lượng cao.
 * Tự động fallback về biểu tượng 🌏 nếu không tìm thấy mã hoặc ảnh không tải được.
 */
export function FlagImg({ country, size = 18, style = {}, className = '' }) {
  const [imgError, setImgError] = useState(false);
  const code = getCountryCode(country);

  if (!code || imgError) {
    return (
      <span
        className={className}
        style={{
          fontSize: Math.round(size * 0.85),
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          ...style
        }}
        title={country || 'Quốc gia'}
      >
        🌏
      </span>
    );
  }

  const height = Math.round(size * 0.67);

  return (
    <img
      src={`https://flagcdn.com/w20/${code}.webp`}
      srcSet={`https://flagcdn.com/w40/${code}.webp 2x`}
      alt={country || code}
      title={country || code.toUpperCase()}
      onError={() => setImgError(true)}
      className={className}
      style={{
        width: size,
        height,
        borderRadius: 2,
        objectFit: 'cover',
        flexShrink: 0,
        verticalAlign: 'middle',
        boxShadow: '0 0 1px rgba(0,0,0,0.3)',
        ...style
      }}
      loading="lazy"
    />
  );
}

export default FlagImg;
