import { en } from "./locales/en";
import { id } from "./locales/id";

export const locales = {
  en,
  id,
} as const;

export type LocaleCode = keyof typeof locales;

export const DEFAULT_LOCALE: LocaleCode = "en";

export const LANGUAGE_METADATA: Record<LocaleCode, { label: string }> = {
  en: { label: "English" },
  id: { label: "Bahasa Indonesia" },
};
