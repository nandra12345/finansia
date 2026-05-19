import { CURRENCY_METADATA, type CurrencyCode } from "./constants";

export function formatCurrency(
  value: number,
  currencyCode: CurrencyCode,
  options: Intl.NumberFormatOptions = {}
): string {
  const metadata = CURRENCY_METADATA[currencyCode];

  return new Intl.NumberFormat(metadata.locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}
