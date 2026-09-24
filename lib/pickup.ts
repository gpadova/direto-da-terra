// Shared (client + Convex) helpers for pickup scheduling.
// pickupTime is stored as "yyyy-MM-dd HH:mm-HH:mm" (America/Sao_Paulo local time),
// e.g. "2026-09-24 10:00-12:00".

import { daysUntilExpiry, todayInSaoPaulo } from "./expiry";

export const PICKUP_WINDOWS = [
  "08:00-10:00",
  "10:00-12:00",
  "12:00-14:00",
  "14:00-16:00",
  "16:00-18:00",
  "18:00-20:00",
] as const;

export type PickupWindow = (typeof PICKUP_WINDOWS)[number];

/** How many days ahead (beyond today) a pickup may be scheduled. */
export const MAX_PICKUP_DAYS_AHEAD = 7;

const PICKUP_RE = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}-\d{2}:\d{2})$/;

export function formatPickupTime(date: string, window: string): string {
  return `${date} ${window}`;
}

export function parsePickupTime(
  pickupTime: string | undefined | null
): { date: string; window: string; start: string; end: string } | null {
  if (!pickupTime) return null;
  const match = PICKUP_RE.exec(pickupTime.trim());
  if (!match) return null;
  const [, date, window] = match;
  const ts = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(ts) || new Date(ts).toISOString().slice(0, 10) !== date) return null;
  const [start, end] = window.split("-");
  return { date, window, start, end };
}

/** Current time (HH:mm) in America/Sao_Paulo. */
export function nowTimeInSaoPaulo(now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(now);
  } catch {
    return new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(11, 16);
  }
}

/** Adds `days` calendar days to a yyyy-MM-dd date. */
export function addDays(date: string, days: number): string {
  const base = Date.parse(`${date.slice(0, 10)}T00:00:00Z`);
  return new Date(base + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Latest allowed pickup date: min(today + MAX_PICKUP_DAYS_AHEAD, earliest expiry).
 * Returns null when some item is already expired (no valid date).
 */
export function maxPickupDate(
  expiryDates: (string | undefined | null)[],
  today: string = todayInSaoPaulo()
): string | null {
  let max = addDays(today, MAX_PICKUP_DAYS_AHEAD);
  for (const expiry of expiryDates) {
    if (!expiry) continue;
    const e = expiry.slice(0, 10);
    if (daysUntilExpiry(e, today) < 0) return null;
    if (e < max) max = e;
  }
  return max;
}

/** List of selectable pickup dates (yyyy-MM-dd), from today to maxDate inclusive. */
export function pickupDateOptions(maxDate: string | null, today: string = todayInSaoPaulo()): string[] {
  if (!maxDate) return [];
  const dates: string[] = [];
  for (let d = today; d <= maxDate && dates.length <= MAX_PICKUP_DAYS_AHEAD; d = addDays(d, 1)) {
    dates.push(d);
  }
  return dates;
}

/** Windows still available on `date` (windows that already ended today are excluded). */
export function availableWindows(
  date: string,
  today: string = todayInSaoPaulo(),
  nowTime: string = nowTimeInSaoPaulo()
): PickupWindow[] {
  if (date !== today) return [...PICKUP_WINDOWS];
  return PICKUP_WINDOWS.filter((w) => w.split("-")[1] > nowTime);
}

/** Human-readable pt-BR label, e.g. "qua., 24/09 · 10h–12h". */
export function formatPickupLabel(pickupTime: string | undefined | null): string | null {
  const parsed = parsePickupTime(pickupTime);
  if (!parsed) return pickupTime ?? null;
  return `${formatPickupDate(parsed.date)} · ${formatWindow(parsed.window)}`;
}

export function formatPickupDate(date: string, today: string = todayInSaoPaulo()): string {
  if (date === today) return "Hoje";
  if (date === addDays(today, 1)) return "Amanhã";
  const d = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(d);
}

export function formatWindow(window: string): string {
  const [start, end] = window.split("-");
  const fmt = (t: string) => (t.endsWith(":00") ? `${t.slice(0, 2)}h` : t.replace(":", "h"));
  return `${fmt(start)}–${fmt(end)}`;
}
