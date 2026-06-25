import Link from "next/link";
import { requireParent } from "@/lib/auth/session";
import { todayISO, formatLongDate } from "@/lib/date";
import { hoursLabel } from "@/lib/format";
import { withStudent } from "@/lib/nav/withStudent";
import {
  completeMissionAction,
  completeScheduledAction,
  uncompleteMissionAction,
} from "./actions";
import { AppHeader } from "./_components/AppHeader";
import { MissionReflection } from "./_components/MissionReflection";
import { getTodaysMissions } from "@/lib/missions/getTodaysMissions";
import type { Student } from "@/lib/db/types";

/**
 * Today — the distraction-free "do my work" focus (Stage 8). Just the active
 * student's today's missions and how much of today is done, with mark-done and a
 * per-task reflection note. Everything to plan or administer lives behind Manage.
 */
export default async function Today({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const parent = await requireParent();
  const { supabase } = parent;
  const sp = await searchParams;
  const today = todayISO();

  const { data: studentsData } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: true });
  const students = (studentsData ?? []) as Student[];
  const active =
    students.find((s) => s.id === sp.student) ?? students[0] ?? null;

  const missions = active
    ? await getTodaysMissions(supabase, active.id, today)
    : [];
  const missionsDone = missions.filter((m) => m.status === "completed").length;
  const pct = missions.length
    ? Math.round((missionsDone / missions.length) * 100)
    : 0;
  const totalMinutes = missions.reduce(
    (sum, m) => sum + (m.estimatedMinutes ?? 0),
    0,
  );
  const totalLabel = hoursLabel(totalMinutes);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <AppHeader
        email={parent.email}
        students={students}
        activeId={active?.id ?? null}
        current="today"
      />

      {students.length === 0 ? (
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-1 text-lg font-semibold text-text">
            No students yet
          </h2>
          <p className="mb-4 text-sm text-muted">
            Add a child profile in Manage to start planning daily missions.
          </p>
          <Link
            href="/manage"
            className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90"
          >
            Go to Manage →
          </Link>
        </section>
      ) : active ? (
        <section className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-text">
                {active.name}
                {active.grade ? (
                  <span className="ml-2 text-sm font-normal text-muted">
                    Grade {active.grade}
                  </span>
                ) : null}
              </h2>
              <p className="text-sm text-muted">{formatLongDate(today)}</p>
              <Link
                href={withStudent("/schedule", active.id)}
                className="text-xs text-muted hover:text-text"
              >
                Week schedule →
              </Link>
            </div>
            <div className="shrink-0 text-right text-sm text-muted">
              <p>
                ✅ {missionsDone}/{missions.length} today
              </p>
              {totalLabel ? <p>~{totalLabel} planned</p> : null}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-sm font-semibold text-text">
                {pct}% done today
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <h3 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-muted">
            Today&apos;s missions
          </h3>
          {missions.length === 0 ? (
            <p className="text-sm text-muted">
              Nothing scheduled for today. Enjoy the break. 🎉
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {missions.map((m) => {
                const done = m.status === "completed";
                return (
                  <li
                    key={m.key}
                    className="rounded-lg bg-surface-2 px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="inline-block h-8 w-1 shrink-0 rounded-full"
                        style={{ background: m.subjectColor ?? "#6366f1" }}
                      />
                      <div className="min-w-0">
                        <p
                          className={`truncate text-sm ${
                            done ? "text-muted line-through" : "text-text"
                          }`}
                        >
                          {m.title}
                          {m.source === "block" ? (
                            <span className="ml-2 text-xs text-muted">
                              scheduled
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted">
                          {m.subjectName ?? "No subject"}
                          {hoursLabel(m.estimatedMinutes)
                            ? ` · ${hoursLabel(m.estimatedMinutes)}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    {done ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm text-success">✓ Done</span>
                        <form action={uncompleteMissionAction}>
                          <input
                            type="hidden"
                            name="missionId"
                            value={m.missionId}
                          />
                          <button className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-text">
                            Undo
                          </button>
                        </form>
                      </div>
                    ) : m.source === "mission" ? (
                      <form action={completeMissionAction}>
                        <input
                          type="hidden"
                          name="missionId"
                          value={m.missionId}
                        />
                        <button className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-fg hover:opacity-90">
                          Mark done
                        </button>
                      </form>
                    ) : (
                      <form action={completeScheduledAction}>
                        <input type="hidden" name="studentId" value={active.id} />
                        <input
                          type="hidden"
                          name="scheduleBlockId"
                          value={m.scheduleBlockId}
                        />
                        <input type="hidden" name="date" value={today} />
                        <button className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-fg hover:opacity-90">
                          Mark done
                        </button>
                      </form>
                    )}
                    </div>
                    <MissionReflection
                      reflection={m.reflection}
                      missionId={m.source === "mission" ? m.missionId : undefined}
                      studentId={m.source === "block" ? active.id : undefined}
                      scheduleBlockId={
                        m.source === "block" ? m.scheduleBlockId : undefined
                      }
                      date={m.source === "block" ? today : undefined}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}
    </main>
  );
}
