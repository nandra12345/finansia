import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCurrencyStore } from "@/store/use-currency-store";

export type CurrencyCode = "USD" | "EUR" | "GBP" | "IDR";

interface SettingsState {
  displayName: string;
  currency: CurrencyCode;
  emailNotifications: boolean;
  pushNotifications: boolean;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  setDisplayName: (value: string) => Promise<void>;
  setCurrency: (value: CurrencyCode) => Promise<void>;
  setEmailNotifications: (value: boolean) => Promise<void>;
  setPushNotifications: (value: boolean) => Promise<void>;
  resetSettings: () => Promise<void>;
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
      isLoading: false,
      error: null,

      fetchSettings: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/settings");
          if (!response.ok) throw new Error("Failed to fetch settings");
          const data = await response.json();
          if (data) {
            set({
              currency: data.currency as CurrencyCode,
              isLoading: false,
            });
            // Keep global currency store in sync so UI components react to the chosen currency
            try {
              useCurrencyStore.setState({ currency: data.currency as CurrencyCode });
            } catch (err) {
              // ignore sync failure
            }
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      setDisplayName: async (value) => {
        set({ displayName: value });
        try {
          await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ displayName: value }),
          });
        } catch {
          // display name is Clerk-managed; silently ignore API sync errors
        }
      },

      setCurrency: async (value) => {
        set({ currency: value });
        // Also update the shared currency store so formatting updates across the app
        try {
          useCurrencyStore.setState({ currency: value });
        } catch {
          /* noop */
        }
        try {
          await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currency: value }),
          });
        } catch (err) {
          console.error("Failed to persist currency setting:", err);
        }
      },

      setEmailNotifications: async (value) => {
        set({ emailNotifications: value });
        // Email notifications are local-only preferences — no server sync needed
      },

      setPushNotifications: async (value) => {
        set({ pushNotifications: value });
        // Push notifications are local-only preferences — no server sync needed
      },

      resetSettings: async () => {
        set(defaultState);
        try {
          useCurrencyStore.setState({ currency: defaultState.currency as any });
        } catch (err) {
          /* noop */
        }
        await fetch("/api/settings", {
          method: "POST",
          body: JSON.stringify(defaultState),
        });
      },
    }),
    {
      name: "settings-storage",
    }
  )
);

