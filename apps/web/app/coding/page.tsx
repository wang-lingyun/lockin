import Link from "next/link";
import { requireParent } from "@/lib/auth/session";
import type { Student, CodingProjectRow } from "@/lib/db/types";
import { ProjectForm } from "./_components/ProjectForm";
import { ProjectList } from "./_components/ProjectList";

export const metadata = { title: "Coding · LockIn" };

export default async function CodingPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const parent = await requireParent();
  const { supabase } = parent;
  const sp = await searchParams;

  const { data: studentsData } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: true });
  const students = (studentsData ?? []) as Student[];
  const active = students.find((s) => s.id === sp.student) ?? students[0] ?? null;

  let projects: CodingProjectRow[] = [];
  if (active) {
    const { data } = await supabase
      .from("coding_projects")
      .select("*, features:coding_features(*)")
      .eq("student_id", active.id)
      .order("created_at", { ascending: false });
    projects = (data ?? []) as CodingProjectRow[];
    // Features come back in arbitrary order; sort oldest-first for a stable list.
    for (const p of projects) {
      p.features.sort((a, b) => a.created_at.localeCompare(b.created_at));
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Coding Projects</h1>
          <p className="text-sm text-muted">
            Track projects and their features, and check them off as you finish.
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
                  href={`/coding?student=${s.id}`}
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
                  New project for {active.name}
                </h2>
                <ProjectForm studentId={active.id} />
              </section>

              {projects.length === 0 ? (
                <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
                  No coding projects yet.
                </p>
              ) : (
                <ProjectList projects={projects} />
              )}
            </>
          ) : null}
        </>
      )}
    </main>
  );
}
