/**
 * Vòng 2: trích chuỗi tiếng Việt nằm trong BIỂU THỨC JS (vòng 1 chỉ lấy text node JSX).
 *
 * Chỉ 3 dạng an toàn (không đụng chuỗi dùng để SO SÁNH hay làm khóa):
 *   1. return 'Chuỗi';              -> return tUI('ui.key');
 *   2. label|title|desc|sub|name: 'Chuỗi',   (trong object literal)
 *   3. {'Chuỗi'} đứng riêng trong JSX
 *
 * Bỏ qua: so sánh (=== '...'), khóa object ('...' :), import, chuỗi có ${}.
 *
 *   node scripts/i18n_extract2.mjs --apply
 */
import fs from 'node:fs';
import path from 'node:path';

const VI = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/;
const APPLY = process.argv.includes('--apply');
const ROOT = 'src';
const SKIP_DIRS = new Set(['locales', 'assets']);
const SKIP_FILES = new Set(['mockData.js']);
const found = new Map();

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

const ok = (t) => t && VI.test(t) && !t.includes('${') && !/^https?:/.test(t) && t.length <= 200;

function processFile(file) {
  let src = fs.readFileSync(file, 'utf8');
  const before = src;
  let n = 0;

  // 1. return 'Chuỗi';
  src = src.replace(/return '([^'\n]+)';/g, (m, t) =>
    ok(t) ? (n++, `return tUI('${keyFor(t)}');`) : m);

  // 2. label|title|desc|sub|name|placeholder: 'Chuỗi'
  src = src.replace(/\b(label|title|desc|description|sub|subtitle|name|placeholder|text|tooltip):\s*'([^'\n]+)'/g,
    (m, key, t) => (ok(t) ? (n++, `${key}: tUI('${keyFor(t)}')`) : m));

  // 3. {'Chuỗi'} đứng riêng trong JSX
  src = src.replace(/\{'([^'\n]+)'\}/g, (m, t) => (ok(t) ? (n++, `{tUI('${keyFor(t)}')}`) : m));

  if (n && !src.includes('import { tUI }')) {
    const rel = path.relative(path.dirname(file), path.join(ROOT, 'locales')).split(path.sep).join('/');
    const spec = rel.startsWith('.') ? rel : `./${rel}`;
    const lastImport = src.lastIndexOf('\nimport ');
    const eol = src.indexOf('\n', lastImport + 1);
    src = src.slice(0, eol + 1) + `import { tUI } from '${spec}';\n` + src.slice(eol + 1);
  }
  if (n && APPLY && src !== before) fs.writeFileSync(file, src, 'utf8');
  return n;
}

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) out.push(...walk(path.join(dir, e.name))); }
    else if (/\.jsx?$/.test(e.name) && !SKIP_FILES.has(e.name)) out.push(path.join(dir, e.name));
  }
  return out;
}

let total = 0;
for (const f of walk(ROOT)) {
  const n = processFile(f);
  if (n) { total += n; console.log(`${String(n).padStart(4)}  ${f}`); }
}
console.log(`\nVòng 2: ${total} chuỗi — ${found.size} khóa mới`);
fs.writeFileSync('scripts/i18n_extracted2.json', JSON.stringify(Object.fromEntries(found), null, 2), 'utf8');
console.log(APPLY ? 'ĐÃ ghi.' : 'Thêm --apply để ghi.');
