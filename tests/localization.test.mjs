// tests/localization.test.mjs
// Comprehensive Unit Test Suite for BIS Localization (i18n)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import vi from '../src/locales/vi.js';
import en from '../src/locales/en.js';
import ja from '../src/locales/ja.js';
import { DICT, TRANSLATIONS, tUI } from '../src/locales/index.js';

console.log('\n========================================');
console.log('🧪 RUNNING LOCALIZATION UNIT TEST SUITE');
console.log('========================================\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// TEST 1: Dictionary Integrity & 100% Key Parity
// ---------------------------------------------------------------------------
test('1. Dictionary loads and has all 3 supported languages', () => {
  assert.ok(DICT.vi, 'DICT.vi must exist');
  assert.ok(DICT.en, 'DICT.en must exist');
  assert.ok(DICT.ja, 'DICT.ja must exist');
});

test('2. Exactly 100% 1-to-1 key parity between VI, EN, and JA', () => {
  const viKeys = Object.keys(vi);
  const enKeys = Object.keys(en);
  const jaKeys = Object.keys(ja);

  assert.equal(viKeys.length, enKeys.length, `VI key count (${viKeys.length}) must equal EN count (${enKeys.length})`);
  assert.equal(viKeys.length, jaKeys.length, `VI key count (${viKeys.length}) must equal JA count (${jaKeys.length})`);

  const allKeys = new Set([...viKeys, ...enKeys, ...jaKeys]);
  const missingInVi = [];
  const missingInEn = [];
  const missingInJa = [];

  for (const k of allKeys) {
    if (vi[k] === undefined) missingInVi.push(k);
    if (en[k] === undefined) missingInEn.push(k);
    if (ja[k] === undefined) missingInJa.push(k);
  }

  assert.equal(missingInVi.length, 0, `VI missing keys: ${missingInVi.join(', ')}`);
  assert.equal(missingInEn.length, 0, `EN missing keys: ${missingInEn.join(', ')}`);
  assert.equal(missingInJa.length, 0, `JA missing keys: ${missingInJa.join(', ')}`);
});

test('3. No translation values are empty, null, or undefined', () => {
  const emptyKeys = [];
  ['vi', 'en', 'ja'].forEach((lang) => {
    const d = DICT[lang];
    for (const [k, v] of Object.entries(d)) {
      if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) {
        emptyKeys.push(`${lang}:${k}`);
      }
    }
  });
  assert.equal(emptyKeys.length, 0, `Found empty translation values: ${emptyKeys.join(', ')}`);
});

// ---------------------------------------------------------------------------
// TEST 2: Static Code Extraction Audit (Every key in JSX exists in DICT)
// ---------------------------------------------------------------------------
test('4. All translation keys referenced in React code exist in all dictionaries', () => {
  function getAllFiles(dir, exts = ['.js', '.jsx']) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getAllFiles(fullPath, exts));
      } else if (exts.includes(path.extname(fullPath))) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const files = getAllFiles('./src');
  const keyRegexes = [
    /(?:^|[^a-zA-Z0-9_])t\s*\(\s*['"]([^'"]+)['"]/g,
    /(?:^|[^a-zA-Z0-9_])tUI\s*\(\s*['"]([^'"]+)['"]/g
  ];

  const foundKeys = new Set();
  const keyFileMap = {};

  for (const f of files) {
    if (f.includes(path.join('src', 'locales'))) continue;
    const content = fs.readFileSync(f, 'utf8');
    for (const regex of keyRegexes) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const k = match[1];
        // Filter out non-keys or comment examples
        if (k && !k.includes('${') && !k.includes('/') && (k.includes('.') || k.startsWith('ui.'))) {
          if (k === 'nav.…') continue; // comment in Sidebar.jsx
          foundKeys.add(k);
          if (!keyFileMap[k]) keyFileMap[k] = f;
        }
      }
    }
  }

  const missingFromLocales = [];
  for (const k of foundKeys) {
    if (vi[k] === undefined || en[k] === undefined || ja[k] === undefined) {
      missingFromLocales.push(`${k} (in ${path.basename(keyFileMap[k])})`);
    }
  }

  assert.equal(
    missingFromLocales.length,
    0,
    `Code references keys not found in locales:\n  ${missingFromLocales.join('\n  ')}`
  );
});

// ---------------------------------------------------------------------------
// TEST 3: Dynamic Classifications (countries, sectors, statuses, categories)
// ---------------------------------------------------------------------------
test('5. Dynamic classification dictionaries have vi, en, ja for all entries', () => {
  const sections = ['countries', 'sectors', 'statuses', 'categories'];
  for (const sec of sections) {
    assert.ok(TRANSLATIONS[sec], `TRANSLATIONS.${sec} must exist`);
    for (const [slug, trans] of Object.entries(TRANSLATIONS[sec])) {
      assert.ok(trans.vi, `TRANSLATIONS.${sec}.${slug}.vi must exist`);
      assert.ok(trans.en, `TRANSLATIONS.${sec}.${slug}.en must exist`);
      assert.ok(trans.ja, `TRANSLATIONS.${sec}.${slug}.ja must exist`);
    }
  }
});

// ---------------------------------------------------------------------------
// TEST 4: View Toggle Keys (the specific keys reported by the user)
// ---------------------------------------------------------------------------
test('6. Specific view toggle keys for NewsPage and BookmarksPage are present & accurate', () => {
  assert.equal(vi['ui.dang-luoi'], 'Dạng lưới');
  assert.equal(en['ui.dang-luoi'], 'Grid View');
  assert.equal(ja['ui.dang-luoi'], 'グリッド表示');

  assert.equal(vi['ui.tinh-gon'], 'Tinh gọn');
  assert.equal(en['ui.tinh-gon'], 'Compact List');
  assert.equal(ja['ui.tinh-gon'], 'コンパクト表示');

  assert.equal(vi['bookmarks.listView'], 'Danh sách');
  assert.equal(en['bookmarks.listView'], 'List View');
  assert.equal(ja['bookmarks.listView'], 'リスト表示');

  assert.equal(vi['bookmarks.gridView'], 'Lưới');
  assert.equal(en['bookmarks.gridView'], 'Grid View');
  assert.equal(ja['bookmarks.gridView'], 'グリッド表示');
});

// ---------------------------------------------------------------------------
// TEST 5: Parameter Replacement Format
// ---------------------------------------------------------------------------
test('7. Parameterized translation keys have identical placeholders across VI, EN, JA', () => {
  const placeholderRegex = /\{([a-zA-Z0-9_]+)\}/g;

  for (const [k, viStr] of Object.entries(vi)) {
    const viMatches = [...viStr.matchAll(placeholderRegex)].map(m => m[1]).sort();
    if (viMatches.length > 0) {
      const enStr = en[k] || '';
      const jaStr = ja[k] || '';

      const enMatches = [...enStr.matchAll(placeholderRegex)].map(m => m[1]).sort();
      const jaMatches = [...jaStr.matchAll(placeholderRegex)].map(m => m[1]).sort();

      assert.deepEqual(
        enMatches,
        viMatches,
        `Key ${k} placeholder mismatch between VI (${viMatches}) and EN (${enMatches})`
      );
      assert.deepEqual(
        jaMatches,
        viMatches,
        `Key ${k} placeholder mismatch between VI (${viMatches}) and JA (${jaMatches})`
      );
    }
  }
});

// ---------------------------------------------------------------------------
// TEST 6: tUI Resolution & Fallback Behavior
// ---------------------------------------------------------------------------
test('8. tUI returns correct translations and handles custom fallback properly', () => {
  // Existing key
  const valVi = tUI('ui.dang-luoi');
  assert.equal(valVi, 'Dạng lưới');

  // Non-existent key with fallback
  const fallbackVal = tUI('ui.non_existent_key_xyz_123', 'Fallback Text');
  assert.equal(fallbackVal, 'Fallback Text');
});

console.log('\n========================================');
console.log(`🎉 ALL ${passedTests}/${totalTests} LOCALIZATION UNIT TESTS PASSED (100%)`);
console.log('========================================\n');
