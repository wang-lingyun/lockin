import Link from "next/link";
import { requireParent } from "@/lib/auth/session";
import { todayISO } from "@/lib/date";
import { completeMissionAction, completeScheduledAction } from "./actions";
import { AppHeader } from "./_components/AppHeader";
import { XpBar } from "./_components/XpBar";
import { getTodaysMissions } from "@/lib/missions/getTodaysMissions";
import type { Student } from "@/lib/db/types";

/**
 * Today — the distraction-free "do my work" focus (Stage 8). Just the active
 * student's level and today's missions, with mark-done. Everything to plan or
 * administer lives behind Manage.
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
            Add a child profile in Manage to start planning and tracking XP.
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
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-text">
              {active.name}
              {active.grade ? (
                <span className="ml-2 text-sm font-normal text-muted">
                  Grade {active.grade}
                </span>
              ) : null}
            </h2>
            <span className="shrink-0 text-sm text-muted">
              ✅ {missionsDone}/{missions.length} today
            </span>
          </div>

          <XpBar xp={active.current_xp} />

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
                    className="flex items-center justify-between rounded-lg bg-surface-2 px-4 py-3"
                  >
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
                          {m.subjectName ?? "No subject"} · +{m.xp} XP
                        </p>
                      </div>
                    </div>
                    {done ? (
                      <span className="shrink-0 text-sm text-success">
                        ✓ Done
                      </span>
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
