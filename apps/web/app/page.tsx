import Link from "next/link";
import { requireParent } from "@/lib/auth/session";
import { todayISO } from "@/lib/date";
import { signOut } from "./login/actions";
import { completeMissionAction } from "./actions";
import { XpBar } from "./_components/XpBar";
import { CreateStudentForm } from "./_components/CreateStudentForm";
import { CreateTaskForm } from "./_components/CreateTaskForm";
import { AssignTaskForm } from "./_components/AssignTaskForm";
import type { Student, MissionWithTask } from "@/lib/db/types";

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

  let missions: MissionWithTask[] = [];
  if (active) {
    const { data } = await supabase
      .from("daily_missions")
      .select(
        "*, task:tasks(id,title,xp_value), subject:subjects(id,name,color)",
      )
      .eq("student_id", active.id)
      .eq("date", today)
      .order("created_at", { ascending: true });
    missions = (data ?? []) as MissionWithTask[];
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
        <form action={signOut}>
          <button className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-text">
            Sign out
          </button>
        </form>
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
                <span className="text-sm text-muted">
                  🔥 {active.current_streak} day streak
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
                        key={m.id}
                        className="flex items-center justify-between rounded-lg bg-surface-2 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p
                            className={`truncate text-sm ${
                              done ? "text-muted line-through" : "text-text"
                            }`}
                          >
                            {m.task?.title ?? "Untitled task"}
                          </p>
                          <p className="text-xs text-muted">
                            {m.subject?.name ?? "No subject"} · +
                            {m.task?.xp_value ?? 0} XP
                          </p>
                        </div>
                        {done ? (
                          <span className="shrink-0 text-sm text-success">
                            ✓ Done
                          </span>
                        ) : (
                          <form action={completeMissionAction}>
                            <input
                              type="hidden"
                              name="missionId"
                              value={m.id}
                            />
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
