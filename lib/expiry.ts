// Shared (client + Convex) helpers for near-expiry logic.
// Dates are compared as calendar days in America/Sao_Paulo.

const SAO_PAULO_TZ = "America/Sao_Paulo";
const DAY_MS = 24 * 60 * 60 * 1000;

/** Today's date (yyyy-MM-dd) in America/Sao_Paulo. */
export function todayInSaoPaulo(now: Date = new Date()): string {
  try {
    // en-CA formats as yyyy-MM-dd
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: SAO_PAULO_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    // Fallback: Brazil has had no DST since 2019, so UTC-3 is exact.
    return new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }
}

/**
 * Whole calendar days from `today` until `expiryDate` (both yyyy-MM-dd,
 * extra time components ignored). 0 = expires today, negative = expired.
 */
export function daysUntilExpiry(expiryDate: string, today: string = todayInSaoPaulo()): number {
  const expiry = Date.parse(`${expiryDate.slice(0, 10)}T00:00:00Z`);
  const base = Date.parse(`${today.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(expiry) || Number.isNaN(base)) return Number.POSITIVE_INFINITY;
  return Math.round((expiry - base) / DAY_MS);
}

/** True when the product expires today or within the next `days` days. */
export function isLastChance(expiryDate: string | undefined, days = 2): boolean {
  if (!expiryDate) return false;
  const left = daysUntilExpiry(expiryDate);
  return left >= 0 && left <= days;
}

/** Markdown multiplier for a given number of days left, or null if none applies. */
export function autoDiscountFactor(daysLeft: number): number | null {
  if (daysLeft < 0) return null;
  if (daysLeft <= 1) return 0.5;
  if (daysLeft === 2) return 0.7;
  if (daysLeft === 3) return 0.8;
  return null;
}

export function roundPrice(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Parses a yyyy-MM-dd expiry date as a local Date at noon, so the calendar
 * day never shifts when converted/formatted in the browser's timezone
 * (`new Date("yyyy-MM-dd")` is UTC midnight = previous day in Brazil).
 */
export function parseExpiryDate(expiryDate: string): Date {
  const [y, m, d] = expiryDate.slice(0, 10).split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0);
}

/** Formats a yyyy-MM-dd expiry date as dd/MM/yyyy (pt-BR). */
export function formatExpiryDate(expiryDate: string): string {
  return parseExpiryDate(expiryDate).toLocaleDateString("pt-BR");
}
