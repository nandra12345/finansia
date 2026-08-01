"use client";

import { useLanguageStore } from "@/store/use-language-store";
import { locales } from "@/lib/i18n";
import { useCallback } from "react";

/**
 * Lightweight translation hook.
 * - Accepts dot-notated keys like 'transactions.title'
 * - Safely traverses the in-memory `locales` dictionary and returns the string or the key as fallback
 */
export function useTranslation() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const t = useCallback((path: string, params?: Record<string, string | number>): string => {
    if (!path) return "";
    const keys = path.split(".");
    let current: any = locales[language] || locales["en"];

    const result = keys.reduce((obj: any, key: string) => {
      if (obj && typeof obj === "object" && key in obj) {
        return obj[key];
      }
      return undefined;
    }, current as any);

    const message = typeof result === "string" ? result : path;

    if (!params) {
      return message;
    }

    return String(message).replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ""));
  }, [language]);

  return { t, language, setLanguage } as const;
}
