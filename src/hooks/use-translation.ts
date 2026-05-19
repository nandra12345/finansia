"use client";

import { useLanguageStore } from "@/store/use-language-store";
import { locales } from "@/lib/i18n";
import { useCallback } from "react";

type Paths<T> = T extends object
  ? {
      [K in keyof T]: `${Exclude<K, symbol>}${"" | `.${Paths<T[K]>}`}`;
    }[keyof T]
  : never;

export type TranslationPath = Paths<(typeof locales)["en"]>;

export function useTranslation() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const t = useCallback(
    (path: TranslationPath): string => {
      const keys = path.split(".");
      let current: unknown = locales[language] || locales["en"];

      for (const key of keys) {
        if (current && typeof current === "object" && key in current) {
          current = (current as Record<string, unknown>)[key];
        } else {
          return path;
        }
      }

      return typeof current === "string" ? current : path;
    },
    [language]
  );

  return {
    t,
    language,
    setLanguage,
  };
}
