/**
 * Weekly goal progress math (Quest Board, PRD §10.6). Pure + unit-tested so the
 * completion-percentage rule lives in exactly one place (board + dashboard).
 */

/** Completion percentage (0–100) for a goal; 0 when there's no positive target. */
export function goalProgressPercent(
  current: number,
  target: number | null,
): number {
  if (!target || target <= 0) return 0;
  const pct = Math.round((current / target) * 100);
  return Math.max(0, Math.min(100, pct));
}
