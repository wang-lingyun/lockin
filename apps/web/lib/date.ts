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
