/**
 * Date helpers. Stage 1 uses a single UTC calendar day for "today"; per-student
 * timezones arrive with the calendar in Stage 3 (ADR 0006).
 */

/** Today's date as an ISO calendar date (YYYY-MM-DD), in UTC. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
