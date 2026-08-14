// src/context/LanguageContext.jsx
// Ngôn ngữ TOÀN GIAO DIỆN (vi/en/ja): menu, nhãn, placeholder, biểu đồ, popup...
// Dùng: const { lang, setLang, t, tCountry, tSector, tStatus } = useLang();
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useState } from 'react';
import { DICT, TRANSLATIONS } from '../locales';

const LanguageContext = createContext({
  lang: 'vi',
  setLang: () => {},
  t: (k, params) => k,
  tCountry: (c) => c,
  tSector: (s) => s,
  tStatus: (st) => st,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem('app_lang') || localStorage.getItem('news_lang') || 'vi'
  );

  const setLang = useCallback((next) => {
    setLangState(next);
    localStorage.setItem('app_lang', next);
    localStorage.setItem('news_lang', next);
  }, []);

  const t = useCallback(
    (key, params = null) => {
      let str = DICT[lang]?.[key] ?? DICT.vi[key];
      if (str === undefined) {
        // Fallback to params if string passed as fallback
        if (typeof params === 'string') return params;
        return key;
      }
      if (params && typeof params === 'object') {
        Object.entries(params).forEach(([k, v]) => {
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
        });
      }
      return str;
    },
    [lang]
  );

  const tCountry = useCallback(
    (code) => {
      if (!code) return '';
      const cUpper = String(code).toUpperCase();
      return TRANSLATIONS.countries[cUpper]?.[lang] || TRANSLATIONS.countries[cUpper]?.vi || code;
    },
    [lang]
  );

  const tSector = useCallback(
    (secKey) => {
      if (!secKey) return '';
      const sLower = String(secKey).toLowerCase();
      return TRANSLATIONS.sectors[sLower]?.[lang] || TRANSLATIONS.sectors[sLower]?.vi || secKey;
    },
    [lang]
  );

  const tStatus = useCallback(
    (stKey) => {
      if (!stKey) return '';
      const stLower = String(stKey).toLowerCase();
      return TRANSLATIONS.statuses[stLower]?.[lang] || TRANSLATIONS.statuses[stLower]?.vi || stKey;
    },
    [lang]
  );

  const tCategory = useCallback(
    (catName) => {
      if (!catName) return '';
      const catLower = String(catName).trim().toLowerCase();
      return TRANSLATIONS.categories?.[catLower]?.[lang] || TRANSLATIONS.categories?.[catLower]?.vi || catName;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tCountry, tSector, tStatus, tCategory }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
