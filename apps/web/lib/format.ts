/**
 * Small display formatters. Kept pure so they're trivially unit-testable.
 */

/**
 * Render a duration stored in minutes as a friendly label:
 *  - an hour or more → hours, with a fraction as needed ("1 hour", "1.5 hours",
 *    "1.75 hours", "9.25 hours") — big minute counts like "555min" read poorly;
 *  - exactly half an hour → "0.5 hour";
 *  - any other sub-hour value → minutes ("15min", "45min").
 * Returns null when there's nothing to show (null or non-positive), so callers
 * can simply omit the figure.
 *
 * The app stores estimates in minutes (matching `tasks.estimated_minutes`).
 */
export function hoursLabel(minutes: number | null | undefined): string | null {
  if (minutes == null || minutes <= 0) return null;
  // Under an hour: half-hour as hours, anything else stays in minutes.
  if (minutes < 60) return minutes === 30 ? "0.5 hour" : `${minutes}min`;
  const hours = minutes / 60;
  // Up to 2 decimals, trimming trailing zeros (60 → "1", 90 → "1.5", 555 → "9.25").
  const text = String(parseFloat(hours.toFixed(2)));
  return `${text} ${text === "1" ? "hour" : "hours"}`;
}

/** Wall-clock h:mm + meridiem from a "floating" UTC ISO datetime. */
function parseClock(iso: string): { h12: number; m: string; ampm: "AM" | "PM" } {
  // The app stores wall-clock time as UTC ("floating"), so read it back in UTC
  // — getUTCHours is robust whether the API returns "…Z" or "…+00:00".
  const d = new Date(iso);
  const h = d.getUTCHours();
  const ampm: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { h12, m: String(d.getUTCMinutes()).padStart(2, "0"), ampm };
}

/**
 * Render a scheduled time window from two "floating" UTC ISO datetimes:
 *  - same meridiem collapses the first one ("8:00–10:00 AM");
 *  - across noon it stays explicit ("11:00 AM – 1:30 PM");
 *  - no end → just the start ("8:00 AM").
 * Returns null when there's no start (an untimed / all-day item), so callers can
 * omit the figure and sort the item last.
 */
export function timeRangeLabel(
  startAt: string | null | undefined,
  endAt: string | null | undefined,
): string | null {
  if (!startAt) return null;
  const s = parseClock(startAt);
  const start = `${s.h12}:${s.m}`;
  if (!endAt) return `${start} ${s.ampm}`;
  const e = parseClock(endAt);
  const end = `${e.h12}:${e.m} ${e.ampm}`;
  return s.ampm === e.ampm ? `${start}–${end}` : `${start} ${s.ampm} – ${end}`;
}
