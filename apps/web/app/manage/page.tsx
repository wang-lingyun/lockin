import Link from "next/link";
import { requireParent } from "@/lib/auth/session";
import { todayISO } from "@/lib/date";
import { withStudent } from "@/lib/nav/withStudent";
import { AppHeader } from "../_components/AppHeader";
import { GlanceStrip } from "../_components/GlanceStrip";
import { CreateTaskForm } from "../_components/CreateTaskForm";
import { AssignTaskForm } from "../_components/AssignTaskForm";
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

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id,title")
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
