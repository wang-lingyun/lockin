import Link from "next/link";
import { requireParent } from "@/lib/auth/session";
import type { Student, MistakeBankEntryRow } from "@/lib/db/types";
import { MistakeForm } from "./_components/MistakeForm";
import { MistakeList } from "./_components/MistakeList";

export const metadata = { title: "Mistakes · LockIn" };

type SubjectRow = { id: string; name: string; color: string | null };
type TrackRow = { id: string; subject_id: string; name: string };
type HomeworkRow = {
  id: string;
  assignment_title: string | null;
  topic: string | null;
  submission_date: string;
};

const PAGE_SIZE = 20;

export default async function MistakesPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; page?: string }>;
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

  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

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

  let entries: MistakeBankEntryRow[] = [];
  let total = 0;
  let homework: HomeworkRow[] = [];
  if (active) {
    const { data, count } = await supabase
      .from("mistake_bank_entries")
      .select(
        "*, subject:subjects(id,name,color), track:subject_tracks(id,name,color), homework:homework_submissions(id,assignment_title,topic,submission_date)",
        { count: "exact" },
      )
      .eq("student_id", active.id)
      .order("created_at", { ascending: false })
      .range(from, to);
    entries = (data ?? []) as MistakeBankEntryRow[];
    total = count ?? 0;

    // Recent submissions for the optional "link homework" select (AC 18).
    const { data: hwData } = await supabase
      .from("homework_submissions")
      .select("id,assignment_title,topic,submission_date")
      .eq("student_id", active.id)
      .order("submission_date", { ascending: false })
      .limit(50);
    homework = (hwData ?? []) as HomeworkRow[];
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (p: number) =>
    `/mistakes?page=${p}${active ? `&student=${active.id}` : ""}`;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Mistake Bank</h1>
          <p className="text-sm text-muted">
            Track mistakes to revisit until they&apos;re mastered.
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
                  href={`/mistakes?student=${s.id}`}
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
                  Add a mistake for {active.name}
                </h2>
                <MistakeForm
                  studentId={active.id}
                  subjects={subjects}
                  tracks={tracks}
                  homework={homework}
                />
              </section>

              {entries.length === 0 ? (
                <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
                  No mistakes tracked yet.
                </p>
              ) : (
                <>
                  <MistakeList entries={entries} />
                  {totalPages > 1 ? (
                    <div className="mt-4 flex items-center justify-between">
                      {page > 1 ? (
                        <Link
                          href={pageHref(page - 1)}
                          className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-text"
                        >
                          ← Newer
                        </Link>
                      ) : (
                        <span />
                      )}
                      <span className="text-sm text-muted">
                        Page {page} of {totalPages}
                      </span>
                      {page < totalPages ? (
                        <Link
                          href={pageHref(page + 1)}
                          className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-text"
                        >
                          Older →
                        </Link>
                      ) : (
                        <span />
                      )}
                    </div>
                  ) : null}
                </>
              )}
            </>
          ) : null}
        </>
      )}
    </main>
  );
}
