export const SUPPORTED_CURRENCIES = ["IDR", "USD", "EUR", "GBP"] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_METADATA: Record<
  CurrencyCode,
  { label: string; symbol: string; locale: string }
> = {
  IDR: { label: "IDR (Rp)", symbol: "Rp", locale: "id-ID" },
  USD: { label: "USD ($)", symbol: "$", locale: "en-US" },
  EUR: { label: "EUR (Euro)", symbol: "EUR", locale: "de-DE" },
  GBP: { label: "GBP (Pound)", symbol: "GBP", locale: "en-GB" },
};

// Static exchange rates relative to USD for the MVP Sheets backend.
export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  IDR: 16500,
  EUR: 0.92,
  GBP: 0.78,
};

export const DEFAULT_CURRENCY: CurrencyCode = "IDR";
