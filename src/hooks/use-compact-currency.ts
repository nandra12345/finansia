"use client";

import { useMemo } from "react";
import { useCurrencyStore } from "@/store/use-currency-store";
import { compactCurrency, adaptiveFontClass } from "@/lib/currency/compact";
import { formatCurrency } from "@/lib/currency/formatter";
import { convertCurrency } from "@/lib/currency/converter";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/currency/constants";

export function useCompactCurrency() {
  const currency = useCurrencyStore((state) => state.currency);

  /** Full Intl.NumberFormat currency string (no abbreviation) */
  const format = useMemo(
    () =>
      (value: number, options: Intl.NumberFormatOptions = {}) =>
        formatCurrency(value, currency, options),
    [currency]
  );

  /** Compact form: "Rp 1,5 Jt" with full tooltip text + adaptive font class */
  const compact = useMemo(
    () =>
      (value: number) => {
        const result = compactCurrency(value, currency);
        return {
          ...result,
          fontClass: adaptiveFontClass(result.compact),
        };
      },
    [currency]
  );

  /** Convert from base currency to active currency */
  const convert = useMemo(
    () =>
      (value: number, from: CurrencyCode = DEFAULT_CURRENCY) =>
        convertCurrency(value, from, currency),
    [currency]
  );

  return { currency, format, compact, convert };
}
