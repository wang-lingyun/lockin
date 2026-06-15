/**
 * @lockin/shared — domain constants, pure helpers, and command schemas shared by
 * the web app and the command layer. Keep this side-effect-free (zod only).
 */

export * from "./commands";
export * from "./schemas";

/** XP required to reach each level (PRD §10.12). Index 0 = Level 1. */
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 800, 1200] as const;

/** Returns the 1-based level for a given total XP. */
export function levelForXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

/** XP remaining to the next level, or 0 if at the max defined level. */
export function xpToNextLevel(xp: number): number {
  const level = levelForXp(xp);
  const next = LEVEL_THRESHOLDS[level]; // threshold for level+1 (0-based index = level)
  return next === undefined ? 0 : Math.max(0, next - xp);
}
