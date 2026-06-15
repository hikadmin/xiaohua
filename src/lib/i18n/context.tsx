'use client';

import React, { createContext, useContext, useState, useCallback, useSyncExternalStore } from 'react';
import type { Locale, TKey } from './translations';
import translations from './translations';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TKey, ...args: (string | number)[]) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function subscribe() { return () => {}; }
function getSnapshot(): string { 
  try { return localStorage.getItem('luna_locale') || 'zh'; } 
  catch { return 'zh'; } 
}
function getServerSnapshot(): string { return 'zh'; }

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const savedLocale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const locale = (savedLocale === 'en' || savedLocale === 'ko') ? savedLocale : 'zh' as Locale;
  const [, forceUpdate] = useState(0);

  const setLocale = useCallback((newLocale: Locale) => {
    try { localStorage.setItem('luna_locale', newLocale); } catch {}
    forceUpdate(c => c + 1);
  }, []);

  const t = useCallback((key: TKey, ...args: (string | number)[]): string => {
    let text = translations[locale][key] || translations.zh[key] || key;
    args.forEach((arg, i) => { text = text.replace(`{${i}}`, String(arg)); });
    return text;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
