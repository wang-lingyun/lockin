import Link from "next/link";
import { requireParent } from "@/lib/auth/session";
import { todayISO } from "@/lib/date";
import {
  expandWeek,
  weekStartFor,
  addDaysISO,
} from "@/lib/missions/recurrence";
import type { Student, ScheduleBlock } from "@/lib/db/types";
import { AddBlockForm } from "./_components/AddBlockForm";
import { deleteBlockAction } from "./actions";

export const metadata = { title: "Schedule · LockIn" };

type SubjectRow = { id: string; name: string; color: string | null };
type TrackRow = { id: string; subject_id: string; name: string };
type BlockRow = ScheduleBlock & {
  subject: { name: string; color: string | null } | null;
  track: { name: string; color: string | null } | null;
};

/** Weekday + day-of-month label for an ISO date (UTC). */
function dayLabel(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00.000Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** HH:MM (UTC) from an ISO datetime, or null. */
function timeOf(iso: string | null): string | null {
  return iso ? iso.slice(11, 16) : null;
}

function blockTime(b: ScheduleBlock): string {
  if (b.all_day) return "All day";
  const start = timeOf(b.start_at);
  const end = timeOf(b.end_at);
  if (start && end) return `${start}–${end}`;
  return start ?? "—";
}

export default async function SchedulePage({
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
  const prevWeek = addDaysISO(weekStart, -7);
  const nextWeek = addDaysISO(weekStart, 7);

  // Subjects/tracks/tasks for the add form.
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

  const { data: tasksData } = await supabase
    .from("tasks")
    .select("id,title")
    .order("created_at", { ascending: false });
  const tasks = (tasksData ?? []) as { id: string; title: string }[];

  // Blocks for the active student, expanded across the visible week.
  let week: { date: string; blocks: BlockRow[] }[] = [];
  if (active) {
    const { data: blockData } = await supabase
      .from("schedule_blocks")
      .select(
        "*, subject:subjects(name,color), track:subject_tracks(name,color)",
      )
      .eq("student_id", active.id);
    const blocks = (blockData ?? []) as BlockRow[];
    week = expandWeek(blocks, weekStart) as {
      date: string;
      blocks: BlockRow[];
    }[];
  }

  const sw = (date: string) =>
    `/schedule?week=${date}${active ? `&student=${active.id}` : ""}`;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Schedule</h1>
          <p className="text-sm text-muted">
            Plan recurring and one-off blocks. Today&apos;s missions are derived
            from this on read.
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
                  href={`/schedule?student=${s.id}`}
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
                  Add a block for {active.name}
                </h2>
                <AddBlockForm
                  studentId={active.id}
                  defaultDate={today}
                  subjects={subjects}
                  tracks={tracks}
                  tasks={tasks}
                />
              </section>

              <div className="mb-4 flex items-center justify-between">
                <Link
                  href={sw(prevWeek)}
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-text"
                >
                  ← Prev
                </Link>
                <span className="text-sm font-medium text-text">
                  Week of {dayLabel(weekStart)}
                </span>
                <Link
                  href={sw(nextWeek)}
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-text"
                >
                  Next →
                </Link>
              </div>

              <ul className="flex flex-col gap-3">
                {week.map((day) => {
                  const isToday = day.date === today;
                  return (
                    <li
                      key={day.date}
                      className={`rounded-xl border bg-surface p-4 ${
                        isToday ? "border-primary" : "border-border"
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-text">
                          {dayLabel(day.date)}
                        </h3>
                        {isToday ? (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-fg">
                            Today
                          </span>
                        ) : null}
                      </div>
                      {day.blocks.length === 0 ? (
                        <p className="text-sm text-muted">No blocks.</p>
                      ) : (
                        <ul className="flex flex-col gap-2">
                          {day.blocks.map((b) => {
                            const color =
                              b.track?.color ?? b.subject?.color ?? "#6366f1";
                            const label = b.track?.name ?? b.subject?.name;
                            return (
                              <li
                                key={b.id}
                                className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-4 py-3"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <span
                                    className="inline-block h-8 w-1 shrink-0 rounded-full"
                                    style={{ background: color }}
                                  />
                                  <div className="min-w-0">
                                    <p className="truncate text-sm text-text">
                                      {b.title}
                                      {b.recurrence_rule ? (
                                        <span className="ml-2 text-xs text-muted">
                                          ↻
                                        </span>
                                      ) : null}
                                    </p>
                                    <p className="text-xs text-muted">
                                      {blockTime(b)}
                                      {label ? ` · ${label}` : ""}
                                    </p>
                                  </div>
                                </div>
                                <form action={deleteBlockAction}>
                                  <input type="hidden" name="id" value={b.id} />
                                  <button className="shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-danger">
                                    Delete
                                  </button>
                                </form>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </>
      )}
    </main>
  );
}
