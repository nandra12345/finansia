import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_LOCALE, type LocaleCode } from "@/lib/i18n";

interface LanguageState {
  language: LocaleCode;
  setLanguage: (language: LocaleCode) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: DEFAULT_LOCALE,
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "language-storage",
    }
  )
);
