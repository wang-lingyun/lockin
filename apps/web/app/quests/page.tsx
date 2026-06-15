import Link from "next/link";
import { requireParent } from "@/lib/auth/session";
import { todayISO } from "@/lib/date";
import { weekStartFor, addDaysISO } from "@/lib/missions/recurrence";
import type { Student, WeeklyGoalRow } from "@/lib/db/types";
import { AddGoalForm } from "./_components/AddGoalForm";
import { GoalCard } from "./_components/GoalCard";

export const metadata = { title: "Quests · LockIn" };

type SubjectRow = { id: string; name: string; color: string | null };
type TrackRow = { id: string; subject_id: string; name: string };

/** Weekday + month/day label for an ISO date (UTC). */
function dayLabel(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00.000Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function QuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; week?: string }>;
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
  const active = students.find((s) => s.id === sp.student) ?? students[0] ?? null;

  const weekStart = weekStartFor(sp.week ?? today);
  const weekEnd = addDaysISO(weekStart, 6);
  const prevWeek = addDaysISO(weekStart, -7);
  const nextWeek = addDaysISO(weekStart, 7);

  const { data: subjectsData } = await supabase
    .from("subjects")
    .select("id,name,color")
    .order("name", { ascending: true });
  const subjects = (subjectsData ?? []) as SubjectRow[];

  const { data: tracksData } = await supabase
    .from("subject_tracks")
    .select("id,subject_id,name")
    .order("sort_order", { ascending: true });
  const tracks = (tracksData ?? []) as TrackRow[];

  let goals: WeeklyGoalRow[] = [];
  if (active) {
    const { data } = await supabase
      .from("weekly_goals")
      .select("*, subject:subjects(id,name,color), track:subject_tracks(id,name,color)")
      .eq("student_id", active.id)
      .eq("week_start_date", weekStart)
      .order("created_at", { ascending: true });
    goals = (data ?? []) as WeeklyGoalRow[];
  }

  const sw = (date: string) =>
    `/quests?week=${date}${active ? `&student=${active.id}` : ""}`;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Quest Board</h1>
          <p className="text-sm text-muted">
            Outcome-based weekly goals. Track what gets done, not minutes.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-text"
        >
          ← Dashboard
        </Link>
      </header>

      {students.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
          Add a student on the dashboard first.
        </p>
      ) : (
        <>
          <nav className="mb-6 flex flex-wrap gap-2">
            {students.map((s) => {
              const isActive = active?.id === s.id;
              return (
                <Link
                  key={s.id}
                  href={`/quests?student=${s.id}`}
                  className={`rounded-full border px-4 py-1.5 text-sm transition ${
                    isActive
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-border text-muted hover:text-text"
                  }`}
                >
                  {s.name}
                </Link>
              );
            })}
          </nav>

          {active ? (
            <>
              <section className="mb-6 rounded-xl border border-border bg-surface p-5">
                <h2 className="mb-3 text-sm font-semibold text-text">
                  Add a goal for {active.name}
                </h2>
                <AddGoalForm
                  studentId={active.id}
                  weekStartDate={weekStart}
                  subjects={subjects}
                  tracks={tracks}
                />
              </section>

              <div className="mb-4 flex items-center justify-between">
                <Link href={sw(prevWeek)} className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-text">
                  ← Prev
                </Link>
                <span className="text-sm font-medium text-text">
                  Week of {dayLabel(weekStart)} – {dayLabel(weekEnd)}
                </span>
                <Link href={sw(nextWeek)} className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-text">
                  Next →
                </Link>
              </div>

              {goals.length === 0 ? (
                <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
                  No goals for this week yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {goals.map((g) => (
                    <GoalCard key={g.id} goal={g} />
                  ))}
                </ul>
              )}
            </>
          ) : null}
        </>
      )}
    </main>
  );
}
