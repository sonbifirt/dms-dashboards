"use client";

import * as React from "react";
import { enMessages, type MessageKey } from "@/lib/i18n/messages/en";
import { trMessages } from "@/lib/i18n/messages/tr";
import { interpolate } from "@/lib/i18n/interpolate";

const STORAGE_KEY = "dms-locale";

export type AppLocale = "en" | "tr" | "ru" | "ro";

function resolveMessageLocale(l: AppLocale): "en" | "tr" {
  return l === "tr" ? "tr" : "en";
}

export function localeToHtmlLang(locale: AppLocale): string {
  if (locale === "tr") return "tr";
  return "en";
}

export function localeToDateStringLocale(locale: AppLocale): string {
  return resolveMessageLocale(locale) === "tr" ? "tr-TR" : "en-GB";
}

export type I18nContextValue = {
  locale: AppLocale;
  setLocale: (l: AppLocale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  messageLocale: "en" | "tr";
  dateLocale: string;
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<AppLocale>("en");

  React.useLayoutEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY) as AppLocale | null;
    if (raw === "en" || raw === "tr" || raw === "ru" || raw === "ro") {
      setLocaleState(raw);
    }
  }, []);

  const setLocale = React.useCallback((l: AppLocale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const messageLocale = resolveMessageLocale(locale);
  const table = messageLocale === "tr" ? trMessages : enMessages;

  const t = React.useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      const raw = (table as Record<string, string>)[key] ?? enMessages[key];
      return interpolate(raw, vars);
    },
    [table]
  );

  const dateLocale = localeToDateStringLocale(locale);

  React.useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = localeToHtmlLang(locale);
  }, [locale]);

  const value = React.useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t, messageLocale, dateLocale }),
    [locale, setLocale, t, messageLocale, dateLocale]
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const c = React.useContext(I18nContext);
  if (!c) {
    throw new Error("useI18n must be used within LocaleProvider");
  }
  return c;
}
