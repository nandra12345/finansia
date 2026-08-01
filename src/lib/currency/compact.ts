/**
 * Formats a raw numeric value into a compact, human-readable string that
 * fits neatly in a card without wrapping or truncation.
 *
 * Strategy:
 *  - < 1 000 000              → full formatting (e.g. Rp 750.000)
 *  - 1 000 000 – 999 999 999 → compact with suffix  (e.g. Rp 1,5 Jt / 1.5M)
 *  - ≥ 1 000 000 000          → compact with suffix  (e.g. Rp 2,3 M / 2.3B)
 *
 * The suffix language adapts to the active currency locale:
 *  - IDR → Jt / M (Juta / Miliar)
 *  - others → K / M / B
 */

import { CURRENCY_METADATA, type CurrencyCode } from "@/lib/currency/constants";

type CompactResult = {
  /** Short display string, e.g. "Rp 1,5 Jt" */
  compact: string;
  /** Full unabbreviated string for tooltip / aria-label */
  full: string;
  /** Whether abbreviation was applied */
  isAbbreviated: boolean;
};

function getLocale(code: CurrencyCode): string {
  return CURRENCY_METADATA[code]?.locale ?? "id-ID";
}

function currencySymbol(code: CurrencyCode): string {
  return CURRENCY_METADATA[code]?.symbol ?? code;
}

function formatFull(value: number, code: CurrencyCode): string {
  return new Intl.NumberFormat(getLocale(code), {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(value);
}

export function compactCurrency(value: number, code: CurrencyCode): CompactResult {
  const full = formatFull(value, code);
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const sym = currencySymbol(code);
  const locale = getLocale(code);
  const isIDR = code === "IDR";

  // helper: format a short decimal number (max 2 fractional digits, trimmed)
  const shortNum = (n: number) =>
    new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(n);

  // ≥ 1 Triliun / Trillion
  if (abs >= 1_000_000_000_000) {
    const n = abs / 1_000_000_000_000;
    const suffix = isIDR ? "T" : "T";
    return { compact: `${sign}${sym} ${shortNum(n)} ${suffix}`, full, isAbbreviated: true };
  }

  // ≥ 1 Miliar / Billion
  if (abs >= 1_000_000_000) {
    const n = abs / 1_000_000_000;
    const suffix = isIDR ? "M" : "B";
    return { compact: `${sign}${sym} ${shortNum(n)} ${suffix}`, full, isAbbreviated: true };
  }

  // ≥ 1 Juta / Million
  if (abs >= 1_000_000) {
    const n = abs / 1_000_000;
    const suffix = isIDR ? "Jt" : "M";
    return { compact: `${sign}${sym} ${shortNum(n)} ${suffix}`, full, isAbbreviated: true };
  }

  // < 1 Juta — return full value as-is (already readable)
  return { compact: full, full, isAbbreviated: false };
}

/**
 * Determine the appropriate Tailwind text-size class based on string length.
 * Designed for card headings where the container is ~160-220px wide.
 */
export function adaptiveFontClass(text: string): string {
  const len = text.length;
  if (len <= 10) return "text-2xl";
  if (len <= 13) return "text-xl";
  if (len <= 16) return "text-lg";
  if (len <= 20) return "text-base";
  return "text-sm";
}
