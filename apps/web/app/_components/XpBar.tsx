import { LEVEL_THRESHOLDS, levelForXp, xpToNextLevel } from "@lockin/shared";

/** A level badge + progress bar toward the next level (PRD §10.12). */
export function XpBar({ xp }: { xp: number }) {
  const level = levelForXp(xp);
  const toNext = xpToNextLevel(xp);
  const isMax = toNext === 0;

  // Fraction of the current level's band that's filled.
  const bandStart = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const bandEnd = LEVEL_THRESHOLDS[level] ?? bandStart;
  const span = bandEnd - bandStart;
  const pct = isMax ? 100 : Math.round(((xp - bandStart) / span) * 100);

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold text-text">Level {level}</span>
        <span className="text-muted">
          {xp} XP{isMax ? " · max" : ` · ${toNext} to L${level + 1}`}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
