import type { WeeklyGoalRow } from "@/lib/db/types";
import { goalProgressPercent } from "@/lib/goals/progress";
import {
  incrementGoalAction,
  setGoalStatusAction,
  deleteGoalAction,
} from "../actions";

/** A small inline button used inside the card's action forms. */
const iconBtn =
  "rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-text disabled:opacity-40";

/** One weekly goal: progress bar + manual increment / status / delete controls. */
export function GoalCard({ goal }: { goal: WeeklyGoalRow }) {
  const color = goal.track?.color ?? goal.subject?.color ?? "#6366f1";
  const label = goal.track?.name ?? goal.subject?.name;
  const pct = goalProgressPercent(goal.current_value, goal.target_value);
  const done = goal.status === "completed";
  const archived = goal.status === "archived";

  return (
    <li
      className={`rounded-xl border bg-surface p-4 ${
        archived ? "border-border opacity-60" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="mt-1 inline-block h-8 w-1 shrink-0 rounded-full"
            style={{ background: color }}
          />
          <div className="min-w-0">
            <p
              className={`text-sm font-medium ${
                done ? "text-muted line-through" : "text-text"
              }`}
            >
              {goal.title}
            </p>
            <p className="text-xs text-muted">
              {label ? `${label} · ` : ""}
              {goal.target_value != null
                ? `${formatNum(goal.current_value)} / ${formatNum(
                    goal.target_value,
                  )}${goal.unit ? ` ${goal.unit}` : ""}`
                : `${formatNum(goal.current_value)}${
                    goal.unit ? ` ${goal.unit}` : ""
                  }`}
              {goal.due_date ? ` · due ${goal.due_date}` : ""}
            </p>
          </div>
        </div>
        <StatusBadge status={goal.status} />
      </div>

      {goal.target_value != null ? (
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: color }}
            />
          </div>
          <p className="mt-1 text-right text-xs text-muted">{pct}%</p>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <form action={incrementGoalAction}>
          <input type="hidden" name="id" value={goal.id} />
          <input type="hidden" name="delta" value="-1" />
          <button className={iconBtn} disabled={goal.current_value <= 0}>
            −1
          </button>
        </form>
        <form action={incrementGoalAction}>
          <input type="hidden" name="id" value={goal.id} />
          <input type="hidden" name="delta" value="1" />
          <button className={iconBtn}>+1</button>
        </form>
        <form action={incrementGoalAction}>
          <input type="hidden" name="id" value={goal.id} />
          <input type="hidden" name="delta" value="5" />
          <button className={iconBtn}>+5</button>
        </form>

        <span className="mx-1 h-4 w-px bg-border" />

        {!done ? (
          <form action={setGoalStatusAction}>
            <input type="hidden" name="id" value={goal.id} />
            <input type="hidden" name="status" value="completed" />
            <button className={iconBtn}>Complete</button>
          </form>
        ) : (
          <form action={setGoalStatusAction}>
            <input type="hidden" name="id" value={goal.id} />
            <input type="hidden" name="status" value="active" />
            <button className={iconBtn}>Reopen</button>
          </form>
        )}
        {!archived ? (
          <form action={setGoalStatusAction}>
            <input type="hidden" name="id" value={goal.id} />
            <input type="hidden" name="status" value="archived" />
            <button className={iconBtn}>Archive</button>
          </form>
        ) : (
          <form action={setGoalStatusAction}>
            <input type="hidden" name="id" value={goal.id} />
            <input type="hidden" name="status" value="active" />
            <button className={iconBtn}>Unarchive</button>
          </form>
        )}
        <form action={deleteGoalAction} className="ml-auto">
          <input type="hidden" name="id" value={goal.id} />
          <button className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-danger">
            Delete
          </button>
        </form>
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: WeeklyGoalRow["status"] }) {
  const map: Record<string, string> = {
    active: "bg-surface-2 text-muted",
    completed: "bg-success text-bg",
    archived: "bg-surface-2 text-muted",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${map[status]}`}
    >
      {status}
    </span>
  );
}

/** Trim trailing .0 from numeric (numeric columns come back as strings/numbers). */
function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n);
}
