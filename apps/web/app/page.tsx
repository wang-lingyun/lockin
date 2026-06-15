import Link from "next/link";
import { requireParent } from "@/lib/auth/session";
import { todayISO } from "@/lib/date";
import { signOut } from "./login/actions";
import { completeMissionAction, completeScheduledAction } from "./actions";
import { XpBar } from "./_components/XpBar";
import { CreateStudentForm } from "./_components/CreateStudentForm";
import { CreateTaskForm } from "./_components/CreateTaskForm";
import { AssignTaskForm } from "./_components/AssignTaskForm";
import { getTodaysMissions } from "@/lib/missions/getTodaysMissions";
import { weekStartFor } from "@/lib/missions/recurrence";
import { goalProgressPercent } from "@/lib/goals/progress";
import { computeStreak } from "@/lib/streak/computeStreak";
import type { Student, WeeklyGoal } from "@/lib/db/types";

export default async function Dashboard({
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

  // Today's missions: persisted + virtual (derived from schedule blocks on read).
  const missions = active
    ? await getTodaysMissions(supabase, active.id, today)
    : [];

  // Weekly progress (AC 12): XP earned this week + this week's goals. Both are
  // read-time aggregates (no cron). The week starts Monday (UTC).
  const weekStart = weekStartFor(today);
  let weeklyXp = 0;
  let weeklyGoals: WeeklyGoal[] = [];
  let toReview = 0;
  let toRevisit = 0;
  let streak = 0;
  if (active) {
    streak = await computeStreak(supabase, active.id, today);

    const { count } = await supabase
      .from("homework_submissions")
      .select("id", { count: "exact", head: true })
      .eq("student_id", active.id)
      .eq("review_status", "submitted");
    toReview = count ?? 0;

    const { count: revisitCount } = await supabase
      .from("mistake_bank_entries")
      .select("id", { count: "exact", head: true })
      .eq("student_id", active.id)
      .eq("status", "needs_review");
    toRevisit = revisitCount ?? 0;

    const { data: xpRows } = await supabase
      .from("xp_events")
      .select("amount")
      .eq("student_id", active.id)
      .gte("created_at", `${weekStart}T00:00:00.000Z`);
    weeklyXp = (xpRows ?? []).reduce(
      (sum, r) => sum + ((r as { amount: number }).amount ?? 0),
      0,
    );

    const { data: goalRows } = await supabase
      .from("weekly_goals")
      .select("*")
      .eq("student_id", active.id)
      .eq("week_start_date", weekStart)
      .neq("status", "archived")
      .order("created_at", { ascending: true });
    weeklyGoals = (goalRows ?? []) as WeeklyGoal[];
  }

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id,name")
    .order("name", { ascending: true });

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id,title,xp_value")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">LockIn</h1>
          <p className="text-sm text-muted">{parent.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/homework"
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-text"
          >
            Homework
          </Link>
          <Link
            href="/mistakes"
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-text"
          >
            Mistakes
          </Link>
          <Link
            href="/reflections"
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-text"
          >
            Reflections
          </Link>
          <Link
            href="/quests"
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-text"
          >
            Quests
          </Link>
          <Link
            href="/schedule"
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-text"
          >
            Schedule
          </Link>
          <Link
            href="/settings"
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-text"
          >
            Settings
          </Link>
          <form action={signOut}>
            <button className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-text">
              Sign out
            </button>
          </form>
        </div>
      </header>

      {students.length === 0 ? (
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-1 text-lg font-semibold text-text">
            Add your first student
          </h2>
          <p className="mb-4 text-sm text-muted">
            Create a child profile to start assigning tasks and tracking XP.
          </p>
          <CreateStudentForm />
        </section>
      ) : (
        <>
          {/* Student switcher */}
          <nav className="mb-6 flex flex-wrap gap-2">
            {students.map((s) => {
              const isActive = active?.id === s.id;
              return (
                <Link
                  key={s.id}
                  href={`/?student=${s.id}`}
                  className={`rounded-full border px-4 py-1.5 text-sm transition ${
                    isActive
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-border text-muted hover:text-text"
                  }`}
                >
                  {s.name} · L{s.current_level}
                </Link>
              );
            })}
          </nav>

          {active ? (
            <section className="mb-8 rounded-xl border border-border bg-surface p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text">
                  {active.name}
                  {active.grade ? (
                    <span className="ml-2 text-sm font-normal text-muted">
                      Grade {active.grade}
                    </span>
                  ) : null}
                </h2>
                <span className="flex items-center gap-3 text-sm text-muted">
                  <span>⚡ +{weeklyXp} XP this week</span>
                  <span>🔥 {streak} day streak</span>
                  {toReview > 0 ? (
                    <Link href="/homework" className="text-accent hover:underline">
                      📥 {toReview} to review
                    </Link>
                  ) : null}
                  {toRevisit > 0 ? (
                    <Link href="/mistakes" className="text-accent hover:underline">
                      📝 {toRevisit} to revisit
                    </Link>
                  ) : null}
                </span>
              </div>

              <XpBar xp={active.current_xp} />

              <h3 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-muted">
                Today&apos;s missions
              </h3>
              {missions.length === 0 ? (
                <p className="text-sm text-muted">
                  Nothing assigned for today yet.
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
                            <input
                              type="hidden"
                              name="studentId"
                              value={active.id}
                            />
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

              <div className="mb-2 mt-6 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                  This week&apos;s goals
                </h3>
                <Link href="/quests" className="text-xs text-muted hover:text-text">
                  Quest Board →
                </Link>
              </div>
              {weeklyGoals.length === 0 ? (
                <p className="text-sm text-muted">
                  No goals set this week.{" "}
                  <Link href="/quests" className="text-accent hover:underline">
                    Add one
                  </Link>
                  .
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {weeklyGoals.map((g) => {
                    const pct = goalProgressPercent(
                      g.current_value,
                      g.target_value,
                    );
                    return (
                      <li key={g.id} className="rounded-lg bg-surface-2 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={`truncate text-sm ${
                              g.status === "completed"
                                ? "text-muted line-through"
                                : "text-text"
                            }`}
                          >
                            {g.title}
                          </span>
                          <span className="shrink-0 text-xs text-muted">
                            {g.target_value != null
                              ? `${g.current_value}/${g.target_value}${
                                  g.unit ? ` ${g.unit}` : ""
                                }`
                              : `${g.current_value}${g.unit ? ` ${g.unit}` : ""}`}
                          </span>
                        </div>
                        {g.target_value != null ? (
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ) : null}

          {/* Admin */}
          <section className="flex flex-col gap-6">
            <Panel title="Assign a task to today">
              {active ? (
                <AssignTaskForm
                  studentId={active.id}
                  tasks={tasks ?? []}
                  today={today}
                />
              ) : null}
            </Panel>
            <Panel title="Create a task">
              <CreateTaskForm subjects={subjects ?? []} />
            </Panel>
            <Panel title="Add a student">
              <CreateStudentForm />
            </Panel>
          </section>
        </>
      )}
    </main>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-3 text-sm font-semibold text-text">{title}</h2>
      {children}
    </div>
  );
}
