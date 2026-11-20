// Authoritative KINDELORA PLUS pricing contract for server-side checkout.
// Customer-facing USD prices must never be silently treated as ZAR.
// No client-provided amount, exchange rate, currency or subscription period is trusted.
export const PLUS_PLANS = Object.freeze({
  monthly: Object.freeze({ usdMinor: 899, period: 'month', payfastFrequency: 3 }),
  annual: Object.freeze({ usdMinor: 8999, period: 'year', payfastFrequency: 6 })
});
export function selectPlusPlan(input) {
  if (typeof input !== 'string' || !Object.prototype.hasOwnProperty.call(PLUS_PLANS, input)) {
    throw new TypeError('invalid_plan');
  }
  return PLUS_PLANS[input];
}
// The settlement rate must be explicitly approved and managed server-side.
// A stale, missing or non-positive quote must never create a PayFast order.
export function quotePlusZar(planId, quote) {
  const plan = selectPlusPlan(planId);
  if (!quote || quote.approved !== true || quote.sourceCurrency !== 'USD' ||
      quote.settlementCurrency !== 'ZAR' || !Number.isSafeInteger(quote.zarMinor) ||
      quote.zarMinor < 500 || quote.usdMinor !== plan.usdMinor ||
      !Number.isSafeInteger(quote.expiresAtMs) || quote.expiresAtMs <= Date.now()) {
    throw new TypeError('verified_zar_quote_required');
  }
  return Object.freeze({
    planId,
    displayUsdMinor: plan.usdMinor,
    settlementZarMinor: quote.zarMinor,
    payfastFrequency: plan.payfastFrequency,
    quoteExpiresAtMs: quote.expiresAtMs
  });
}
