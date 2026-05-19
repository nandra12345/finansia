import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CurrencyCode = "USD" | "EUR" | "GBP" | "IDR";

interface SettingsState {
  displayName: string;
  currency: CurrencyCode;
  emailNotifications: boolean;
  pushNotifications: boolean;
  setDisplayName: (value: string) => void;
  setCurrency: (value: CurrencyCode) => void;
  setEmailNotifications: (value: boolean) => void;
  setPushNotifications: (value: boolean) => void;
  resetSettings: () => void;
}

const defaultState = {
  displayName: "",
  currency: "USD" as CurrencyCode,
  emailNotifications: true,
  pushNotifications: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultState,
      setDisplayName: (value) => set({ displayName: value }),
      setCurrency: (value) => set({ currency: value }),
      setEmailNotifications: (value) => set({ emailNotifications: value }),
      setPushNotifications: (value) => set({ pushNotifications: value }),
      resetSettings: () => set(defaultState),
    }),
    {
      name: "settings-storage",
    }
  )
);

