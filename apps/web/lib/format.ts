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
