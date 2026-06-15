import Link from "next/link";
import { requireParent } from "@/lib/auth/session";
import type { Student, HomeworkSubmissionRow } from "@/lib/db/types";
import { SubmissionForm } from "./_components/SubmissionForm";
import { SubmissionList } from "./_components/SubmissionList";

export const metadata = { title: "Homework · LockIn" };

type SubjectRow = { id: string; name: string; color: string | null };
type TrackRow = { id: string; subject_id: string; name: string };

const PAGE_SIZE = 20;

export default async function HomeworkPage({
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

  let submissions: HomeworkSubmissionRow[] = [];
  let total = 0;
  if (active) {
    const { data, count } = await supabase
      .from("homework_submissions")
      .select(
        "*, subject:subjects(id,name,color), track:subject_tracks(id,name,color), attachments:homework_attachments(*)",
        { count: "exact" },
      )
      .eq("student_id", active.id)
      .order("submission_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);
    submissions = (data ?? []) as HomeworkSubmissionRow[];
    total = count ?? 0;
  }

  // Short-lived signed URLs for private attachments (downloads never go through
  // a Vercel function; the bucket is private). Generated per page load.
  const paths = submissions
    .flatMap((s) => s.attachments)
    .map((a) => a.storage_path)
    .filter((p): p is string => !!p);
  const signedUrls: Record<string, string> = {};
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("homework")
      .createSignedUrls(paths, 60 * 10);
    for (const row of signed ?? []) {
      if (row.path && row.signedUrl) signedUrls[row.path] = row.signedUrl;
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (p: number) =>
    `/homework?page=${p}${active ? `&student=${active.id}` : ""}`;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Homework Inbox</h1>
          <p className="text-sm text-muted">
            Submit work as text, photos, or PDFs. Parents review each one.
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
                  href={`/homework?student=${s.id}`}
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
                  Submit homework for {active.name}
                </h2>
                <SubmissionForm
                  studentId={active.id}
                  subjects={subjects}
                  tracks={tracks}
                />
              </section>

              {submissions.length === 0 ? (
                <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
                  No submissions yet.
                </p>
              ) : (
                <>
                  <SubmissionList
                    submissions={submissions}
                    signedUrls={signedUrls}
                  />
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
