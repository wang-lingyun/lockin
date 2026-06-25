/**
 * Date helpers. LockIn treats the family's local day as Pacific time
 * (America/Los_Angeles, which follows PST/PDT daylight saving). "Today" is
 * computed in one place here so the dashboard, Quest Board, schedule, and the
 * weekly XP window all agree on the same calendar day. The DB mirrors this for
 * the one auto-stamped column (homework `submission_date`, default set to
 * Pacific in migration 0006). Per-student timezones remain a future extension
 * (ADR 0006).
 */

/** The single app timezone. Pacific clock, DST-aware. */
export const APP_TIME_ZONE = "America/Los_Angeles";

/** Today's date as an ISO calendar date (YYYY-MM-DD), in the app timezone. */
export function todayISO(): string {
  // en-CA formats as YYYY-MM-DD; timeZone makes it the Pacific calendar day.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Format an ISO calendar date (YYYY-MM-DD) as a friendly long date, e.g.
 * "2026-06-22" → "June 22, 2026". Pure: splits the ISO string (no `Date`), so
 * it never drifts across timezones — matches `previousISODate`'s style.
 */
export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const month = MONTH_NAMES[m - 1] ?? "";
  return `${month} ${d}, ${y}`;
}

/**
 * The calendar day before an ISO date (YYYY-MM-DD), as an ISO date. Pure: parses
 * the date at UTC noon and subtracts a day, so it's immune to DST and only walks
 * calendar dates (used by the streak computation). Crosses month/year boundaries.
 */
export function previousISODate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d) - 24 * 60 * 60 * 1000;
  return new Date(t).toISOString().slice(0, 10);
}
