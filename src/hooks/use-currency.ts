"use client";

import { useCurrencyStore } from "@/store/use-currency-store";
import { formatCurrency as baseFormatCurrency } from "@/lib/currency/formatter";
import { convertCurrency as baseConvertCurrency } from "@/lib/currency/converter";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/currency/constants";
import { useMemo } from "react";

export function useCurrency() {
  const currency = useCurrencyStore((state) => state.currency);
  const setCurrency = useCurrencyStore((state) => state.setCurrency);

  const format = useMemo(
    () =>
      (value: number, options: Intl.NumberFormatOptions = {}) =>
        baseFormatCurrency(value, currency, options),
    [currency]
  );

  /**
   * Converts a value from a source currency (defaulting to the project's base currency)
   * to the currently selected global currency.
   */
  const convert = useMemo(
    () =>
      (value: number, from: CurrencyCode = DEFAULT_CURRENCY) =>
        baseConvertCurrency(value, from, currency),
    [currency]
  );

  return {
    currency,
    setCurrency,
    format,
    convert,
  };
}
