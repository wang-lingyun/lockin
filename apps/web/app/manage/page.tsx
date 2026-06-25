import Link from "next/link";
import { requireParent } from "@/lib/auth/session";
import { todayISO } from "@/lib/date";
import { withStudent } from "@/lib/nav/withStudent";
import { AppHeader } from "../_components/AppHeader";
import { GlanceStrip } from "../_components/GlanceStrip";
import { CreateTaskForm } from "../_components/CreateTaskForm";
import { AssignTaskForm } from "../_components/AssignTaskForm";
import { TaskList } from "../_components/TaskList";
import { studentGlance } from "@/lib/dashboard/glance";
import type { Student } from "@/lib/db/types";

export const metadata = { title: "Manage · LockIn" };

/**
 * Manage — the planning focus (Stage 8). Decluttered to the all-students glance
 * and the admin task forms; the per-feature pages (Schedule, Settings, Quests,
 * Homework, Coding, Mistakes) stay reachable by URL but are no longer surfaced
 * here.
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

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id,name")
    .order("name", { ascending: true });

  // Active tracks for the "Create a task" form's track picker (RLS already
  // limits reads to default-or-own; hidden tracks are excluded).
  const { data: tracks } = await supabase
    .from("subject_tracks")
    .select("id,name,subject_id")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  // Tasks for the assign form, scoped to the active student's *active* subjects
  // & tracks (priority not "inactive"; absence => inactive, per ADR 0005 — the
  // same rule Settings uses). A task is offered if its most-specific attribution
  // is on for the student; an unattributed (generic) task is always offered.
  const { data: tasksData } = await supabase
    .from("tasks")
    .select("id,title,subject_id,subject_track_id")
    .order("created_at", { ascending: false });
  type TaskRow = {
    id: string;
    title: string;
    subject_id: string | null;
    subject_track_id: string | null;
  };
  const allTasks = (tasksData ?? []) as TaskRow[];

  let tasks: { id: string; title: string }[] = [];
  if (active) {
    const { data: ss } = await supabase
      .from("student_subjects")
      .select("subject_id")
      .eq("student_id", active.id)
      .neq("priority_type", "inactive");
    const activeSubjects = new Set((ss ?? []).map((r) => r.subject_id));

    const { data: st } = await supabase
      .from("student_subject_tracks")
      .select("subject_track_id")
      .eq("student_id", active.id)
      .neq("priority_type", "inactive");
    const activeTracks = new Set((st ?? []).map((r) => r.subject_track_id));

    tasks = allTasks
      .filter((t) =>
        t.subject_track_id
          ? activeTracks.has(t.subject_track_id)
          : t.subject_id
            ? activeSubjects.has(t.subject_id)
            : true,
      )
      .map((t) => ({ id: t.id, title: t.title }));
  }

  // Full task list for the "Tasks" panel (rename/delete), labelled by track or
  // subject name. Built from the already-fetched subjects/tracks (track wins).
  const subjectName = new Map((subjects ?? []).map((s) => [s.id, s.name]));
  const trackName = new Map((tracks ?? []).map((t) => [t.id, t.name]));
  const manageTasks = allTasks.map((t) => ({
    id: t.id,
    title: t.title,
    label:
      (t.subject_track_id ? trackName.get(t.subject_track_id) : null) ??
      (t.subject_id ? subjectName.get(t.subject_id) : null) ??
      null,
  }));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <AppHeader
        email={parent.email}
        students={students}
        activeId={active?.id ?? null}
        current="manage"
      />

      {students.length > 1 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            All students
          </h2>
          <GlanceStrip glances={glances} />
        </section>
      ) : null}

      {/* Planning entry points */}
      <section className="mb-8 grid grid-cols-2 gap-3">
        {[
          { href: "/schedule", label: "Schedule", hint: "Weekly schedule" },
          { href: "/settings", label: "Settings", hint: "Subjects & tracks" },
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
        <Panel title="Tasks">
          <TaskList tasks={manageTasks} />
        </Panel>
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
          <CreateTaskForm subjects={subjects ?? []} tracks={tracks ?? []} />
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
