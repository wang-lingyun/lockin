/**
 * Small display formatters. Kept pure so they're trivially unit-testable.
 */

/**
 * Render a duration stored in minutes as a friendly hours label, e.g.
 * 90 → "1.5h", 120 → "2h", 30 → "0.5h". Returns null when there's nothing to
 * show (null or non-positive), so callers can simply omit the figure.
 *
 * The app stores estimates in minutes (matching `tasks.estimated_minutes`) but
 * presents them in hours with 0.5h granularity (PRD §10.16).
 */
export function hoursLabel(minutes: number | null | undefined): string | null {
  if (minutes == null || minutes <= 0) return null;
  const hours = minutes / 60;
  // Drop a trailing ".0" (2.0h → 2h) but keep halves (1.5h).
  const text = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return `${text}h`;
}
