import { EXCHANGE_RATES, type CurrencyCode } from "./constants";

/**
 * Converts an amount from one currency to another using static exchange rates.
 * @param amount - The amount to convert
 * @param from - Source currency code
 * @param to - Target currency code
 * @returns The converted amount
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) {
    return amount;
  }

  // Convert source to USD first (base)
  const amountInUsd = amount / EXCHANGE_RATES[from];

  // Convert USD to target
  return amountInUsd * EXCHANGE_RATES[to];
}
