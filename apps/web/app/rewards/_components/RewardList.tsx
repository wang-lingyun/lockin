import { rewardUnlocked } from "@lockin/shared";
import type { Reward } from "@/lib/db/types";
import { deleteRewardAction } from "../actions";

const btn =
  "rounded-md border border-border px-2.5 py-1 text-xs text-muted hover:text-text disabled:opacity-40";

export function RewardList({
  rewards,
  currentXp,
}: {
  rewards: Reward[];
  currentXp: number;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {rewards.map((r) => {
        const unlocked = rewardUnlocked(r.required_xp, currentXp);
        const remaining =
          r.required_xp != null ? Math.max(0, r.required_xp - currentXp) : null;
        const pct =
          r.required_xp && r.required_xp > 0
            ? Math.min(100, Math.round((currentXp / r.required_xp) * 100))
            : unlocked
              ? 100
              : 0;
        return (
          <li
            key={r.id}
            className={`rounded-xl border p-4 ${
              unlocked ? "border-success bg-surface" : "border-border bg-surface"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-text">
                  {unlocked ? "🎉 " : "🔒 "}
                  {r.title}
                </p>
                {r.description ? (
                  <p className="mt-0.5 text-sm text-muted">{r.description}</p>
                ) : null}
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                  unlocked ? "bg-success text-bg" : "bg-surface-2 text-muted"
                }`}
              >
                {unlocked
                  ? "Unlocked"
                  : r.required_xp == null
                    ? "No goal set"
                    : `${remaining} XP to go`}
              </span>
            </div>

            {r.required_xp != null ? (
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-bg">
                <div
                  className={`h-full rounded-full ${
                    unlocked ? "bg-success" : "bg-primary"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            ) : null}

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs text-muted">
                {r.required_xp != null
                  ? `${Math.min(currentXp, r.required_xp)}/${r.required_xp} XP`
                  : "Unlock manually later"}
              </span>
              <form action={deleteRewardAction}>
                <input type="hidden" name="id" value={r.id} />
                <button className={btn}>Delete</button>
              </form>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
