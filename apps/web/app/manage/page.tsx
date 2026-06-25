import Link from "next/link";
import { requireParent } from "@/lib/auth/session";
import { todayISO } from "@/lib/date";
import { withStudent } from "@/lib/nav/withStudent";
import { AppHeader } from "../_components/AppHeader";
import { XpBar } from "../_components/XpBar";
import { GlanceStrip } from "../_components/GlanceStrip";
import { CreateStudentForm } from "../_components/CreateStudentForm";
import { CreateTaskForm } from "../_components/CreateTaskForm";
import { AssignTaskForm } from "../_components/AssignTaskForm";
import { weekStartFor } from "@/lib/missions/recurrence";
import { goalProgressPercent } from "@/lib/goals/progress";
import { studentGlance } from "@/lib/dashboard/glance";
import { rewardUnlocked } from "@lockin/shared";
import type { Student, WeeklyGoal, Reflection, Reward } from "@/lib/db/types";

export const metadata = { title: "Manage · LockIn" };

/**
 * Manage — the planning focus (Stage 8). The parent overview (all students at a
 * glance + the active student's week), entry points to every planning page, and
 * the admin forms that used to clutter the dashboard.
 */
export default async function ManagePage({
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

  const glances = await Promise.all(
    students.map((s) => studentGlance(supabase, s, today)),
  );

  // Active student's week: XP earned, this week's goals, latest reflection, and
  // the nearest still-locked reward. All read-time aggregates (no cron).
  const weekStart = weekStartFor(today);
  let weeklyXp = 0;
  let weeklyGoals: WeeklyGoal[] = [];
  let recentReflection: Reflection | null = null;
  let nextReward: Reward | null = null;
  if (active) {
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

    const { data: reflectionRow } = await supabase
      .from("reflections")
      .select("*")
      .eq("student_id", active.id)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();
    recentReflection = (reflectionRow as Reflection | null) ?? null;

    const { data: rewardRows } = await supabase
      .from("rewards")
      .select("*")
      .eq("student_id", active.id)
      .not("required_xp", "is", null)
      .order("required_xp", { ascending: true });
    nextReward =
      ((rewardRows ?? []) as Reward[]).find(
        (r) => !rewardUnlocked(r.required_xp, active.current_xp),
      ) ?? null;
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
      <AppHeader
        email={parent.email}
        students={students}
        activeId={active?.id ?? null}
        current="manage"
      />

      {students.length > 1 ? (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            All students
          </h2>
          <GlanceStrip glances={glances} />
        </section>
      ) : null}

      {active ? (
        <section className="mb-8 rounded-xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-text">{active.name}</h2>
            <span className="flex items-center gap-3 text-sm text-muted">
              <span>⚡ +{weeklyXp} XP this week</span>
              <span>🔥 {glances.find((g) => g.student.id === active.id)?.streak ?? 0} day streak</span>
            </span>
          </div>

          <XpBar xp={active.current_xp} />

          {nextReward ? (
            <Link
              href={withStudent("/rewards", active.id)}
              className="mt-3 flex items-center justify-between rounded-lg bg-surface-2 px-4 py-2.5 text-sm hover:opacity-90"
            >
              <span className="text-text">🎁 Next reward: {nextReward.title}</span>
              <span className="text-muted">
                {Math.max(0, (nextReward.required_xp ?? 0) - active.current_xp)} XP
                to go
              </span>
            </Link>
          ) : null}

          <div className="mb-2 mt-6 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
              This week&apos;s goals
            </h3>
            <Link
              href={withStudent("/quests", active.id)}
              className="text-xs text-muted hover:text-text"
            >
              Quest Board →
            </Link>
          </div>
          {weeklyGoals.length === 0 ? (
            <p className="text-sm text-muted">
              No goals set this week.{" "}
              <Link
                href={withStudent("/quests", active.id)}
                className="text-accent hover:underline"
              >
                Add one
              </Link>
              .
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {weeklyGoals.map((g) => {
                const pct = goalProgressPercent(g.current_value, g.target_value);
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

          <div className="mb-2 mt-6 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Latest reflection
            </h3>
            <Link
              href={withStudent("/reflections", active.id)}
              className="text-xs text-muted hover:text-text"
            >
              Reflections →
            </Link>
          </div>
          {recentReflection ? (
            <Link
              href={withStudent("/reflections", active.id)}
              className="block rounded-lg bg-surface-2 px-4 py-3 hover:opacity-90"
            >
              <p className="text-xs text-muted">{recentReflection.date}</p>
              <p className="mt-1 line-clamp-2 text-sm text-text">
                {recentReflection.what_learned ??
                  recentReflection.what_finished ??
                  recentReflection.what_was_hard ??
                  recentReflection.what_to_do_next ??
                  "—"}
              </p>
            </Link>
          ) : (
            <p className="text-sm text-muted">No reflections yet.</p>
          )}
        </section>
      ) : null}

      {/* Planning entry points */}
      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: "/schedule", label: "Schedule", hint: "Plan blocks" },
          { href: "/settings", label: "Settings", hint: "Subjects & tracks" },
          { href: "/quests", label: "Quests", hint: "Weekly goals" },
          { href: "/rewards", label: "Rewards", hint: "XP unlocks" },
        ].map((c) => (
          <Link
            key={c.href}
            href={withStudent(c.href, active?.id)}
            className="rounded-xl border border-border bg-surface p-4 hover:border-primary"
          >
            <p className="font-medium text-text">{c.label}</p>
            <p className="mt-1 text-xs text-muted">{c.hint}</p>
          </Link>
        ))}
      </section>

      {/* Admin */}
      <section className="flex flex-col gap-6">
        <Panel title="Assign a task to today">
          {active ? (
            <AssignTaskForm
              studentId={active.id}
              tasks={tasks ?? []}
              today={today}
            />
          ) : (
            <p className="text-sm text-muted">Add a student first.</p>
          )}
        </Panel>
        <Panel title="Create a task">
          <CreateTaskForm subjects={subjects ?? []} />
        </Panel>
        <Panel title="Add a student">
          <CreateStudentForm />
        </Panel>
      </section>
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
