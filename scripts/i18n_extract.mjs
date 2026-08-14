/**
 * Trích chuỗi tiếng Việt CỨNG trong JSX và thay bằng t('ui.<key>').
 *
 * CHỈ đụng 2 vị trí an toàn (không chạm chuỗi dùng trong logic/so sánh):
 *   1. Text node JSX:      >Xin chào<            -> >{t('ui.xin-chao')}<
 *   2. Thuộc tính chuỗi:   title="Xin chào"      -> title={t('ui.xin-chao')}
 *      (title | placeholder | aria-label | alt)
 *
 * Bỏ qua text có {biểu thức} bên trong (nội suy) và chuỗi đã nằm trong t(...).
 * Xuất ra scripts/i18n_extracted.json để bước sau dịch sang EN/JA.
 *
 *   node scripts/i18n_extract.mjs --apply   (không có --apply = chỉ liệt kê)
 */
import fs from 'node:fs';
import path from 'node:path';

const VI = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/;
const APPLY = process.argv.includes('--apply');
const ROOT = 'src';
const SKIP_DIRS = new Set(['locales', 'assets']);
const SKIP_FILES = new Set(['mockData.js']);

const found = new Map(); // key -> text gốc

function slug(text) {
  const map = { à:'a',á:'a',ả:'a',ã:'a',ạ:'a',ă:'a',ằ:'a',ắ:'a',ẳ:'a',ẵ:'a',ặ:'a',â:'a',ầ:'a',ấ:'a',ẩ:'a',ẫ:'a',ậ:'a',
    è:'e',é:'e',ẻ:'e',ẽ:'e',ẹ:'e',ê:'e',ề:'e',ế:'e',ể:'e',ễ:'e',ệ:'e', ì:'i',í:'i',ỉ:'i',ĩ:'i',ị:'i',
    ò:'o',ó:'o',ỏ:'o',õ:'o',ọ:'o',ô:'o',ồ:'o',ố:'o',ổ:'o',ỗ:'o',ộ:'o',ơ:'o',ờ:'o',ớ:'o',ở:'o',ỡ:'o',ợ:'o',
    ù:'u',ú:'u',ủ:'u',ũ:'u',ụ:'u',ư:'u',ừ:'u',ứ:'u',ử:'u',ữ:'u',ự:'u', ỳ:'y',ý:'y',ỷ:'y',ỹ:'y',ỵ:'y', đ:'d' };
  return text.toLowerCase().split('').map((c) => map[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'text';
}

function keyFor(text) {
  const base = `ui.${slug(text)}`;
  let key = base;
  let i = 2;
  while (found.has(key) && found.get(key) !== text) key = `${base}-${i++}`;
  found.set(key, text);
  return key;
}

/** Chuỗi có đáng dịch không: có dấu tiếng Việt, không phải mã/URL, không nội suy. */
function translatable(text) {
  const t = text.trim();
  if (!t || !VI.test(t)) return false;
  if (t.includes('{') || t.includes('}')) return false;
  if (/^https?:\/\//.test(t)) return false;
  return true;
}

function processFile(file) {
  let src = fs.readFileSync(file, 'utf8');
  const before = src;
  let count = 0;

  // 1. Thuộc tính chuỗi
  src = src.replace(/\b(title|placeholder|aria-label|alt)="([^"]+)"/g, (m, attr, text) => {
    if (!translatable(text)) return m;
    count++;
    return `${attr}={tUI('${keyFor(text.trim())}')}`;
  });

  // 2. Text node JSX (giữa dấu > và <), một dòng, không nội suy
  src = src.replace(/>([^<>{}\n]+)</g, (m, text) => {
    if (!translatable(text)) return m;
    const trimmed = text.trim();
    const [, lead = '', tail = ''] = text.match(/^(\s*).*?(\s*)$/s) || [];
    count++;
    return `>${lead}{tUI('${keyFor(trimmed)}')}${tail}<`;
  });

  if (count && !src.includes('import { tUI }')) {
    // Chèn import ngay sau khối import cuối cùng để tUI khả dụng trong file.
    const rel = path
      .relative(path.dirname(file), path.join(ROOT, 'locales'))
      .split(path.sep)
      .join('/');
    const spec = rel.startsWith('.') ? rel : `./${rel}`;
    const imp = `import { tUI } from '${spec}';\n`;
    const lastImport = src.lastIndexOf('\nimport ');
    const eol = src.indexOf('\n', lastImport + 1);
    src = src.slice(0, eol + 1) + imp + src.slice(eol + 1);
  }
  if (count && APPLY && src !== before) fs.writeFileSync(file, src, 'utf8');
  return count;
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) out.push(...walk(path.join(dir, entry.name)));
    } else if (/\.jsx$/.test(entry.name) && !SKIP_FILES.has(entry.name)) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

const files = walk(ROOT);
let total = 0;
for (const f of files) {
  const n = processFile(f);
  if (n) {
    total += n;
    console.log(`${String(n).padStart(4)}  ${f}`);
  }
}
console.log(`\nTổng: ${total} chuỗi trong ${files.length} file — ${found.size} khóa duy nhất`);
fs.writeFileSync(
  'scripts/i18n_extracted.json',
  JSON.stringify(Object.fromEntries(found), null, 2),
  'utf8',
);
console.log(APPLY ? 'ĐÃ ghi thay đổi vào mã nguồn.' : 'Chạy lại với --apply để ghi thay đổi.');
