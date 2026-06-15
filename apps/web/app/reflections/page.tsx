import Link from "next/link";
import { requireParent } from "@/lib/auth/session";
import { todayISO } from "@/lib/date";
import type { Student, Reflection } from "@/lib/db/types";
import { ReflectionForm } from "./_components/ReflectionForm";
import { commentReflectionAction } from "./actions";

export const metadata = { title: "Reflections · LockIn" };

const PAGE_SIZE = 20;

const PROMPT_LABELS: { key: keyof Reflection; label: string }[] = [
  { key: "what_finished", label: "Finished" },
  { key: "what_was_hard", label: "Hard" },
  { key: "what_learned", label: "Learned" },
  { key: "what_to_do_next", label: "Next" },
];

function dateLabel(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00.000Z`).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function ReflectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; page?: string }>;
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

  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let todayReflection: Reflection | null = null;
  let history: Reflection[] = [];
  let total = 0;
  if (active) {
    const { data: todayData } = await supabase
      .from("reflections")
      .select("*")
      .eq("student_id", active.id)
      .eq("date", today)
      .maybeSingle();
    todayReflection = (todayData as Reflection | null) ?? null;

    const { data, count } = await supabase
      .from("reflections")
      .select("*", { count: "exact" })
      .eq("student_id", active.id)
      .neq("date", today)
      .order("date", { ascending: false })
      .range(from, to);
    history = (data ?? []) as Reflection[];
    total = count ?? 0;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (p: number) =>
    `/reflections?page=${p}${active ? `&student=${active.id}` : ""}`;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Reflections</h1>
          <p className="text-sm text-muted">
            A daily check-in. Writing one keeps the streak alive.
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
                  href={`/reflections?student=${s.id}`}
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
                  Today · {dateLabel(today)}
                  {todayReflection ? (
                    <span className="ml-2 text-xs font-normal text-success">
                      ✓ written
                    </span>
                  ) : null}
                </h2>
                <ReflectionForm
                  key={todayReflection?.id ?? "new"}
                  studentId={active.id}
                  date={today}
                  reflection={todayReflection}
                />
              </section>

              {history.length === 0 ? (
                <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
                  No past reflections yet.
                </p>
              ) : (
                <>
                  <ul className="flex flex-col gap-3">
                    {history.map((r) => (
                      <li
                        key={r.id}
                        className="rounded-xl border border-border bg-surface p-4"
                      >
                        <p className="text-sm font-medium text-text">
                          {dateLabel(r.date)}
                        </p>
                        <dl className="mt-2 flex flex-col gap-1.5">
                          {PROMPT_LABELS.map(({ key, label }) =>
                            r[key] ? (
                              <div key={key} className="text-sm">
                                <dt className="text-xs font-medium text-muted">
                                  {label}
                                </dt>
                                <dd className="whitespace-pre-wrap text-text">
                                  {r[key] as string}
                                </dd>
                              </div>
                            ) : null,
                          )}
                        </dl>

                        <form
                          action={commentReflectionAction}
                          className="mt-3 flex flex-col gap-2 border-t border-border pt-3"
                        >
                          <input type="hidden" name="id" value={r.id} />
                          <textarea
                            name="parentComment"
                            defaultValue={r.parent_comment ?? ""}
                            placeholder="Parent comment (optional)…"
                            maxLength={4000}
                            className="min-h-16 resize-y rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
                          />
                          <button className="self-start rounded-md border border-border px-2.5 py-1 text-xs text-muted hover:text-text">
                            Save comment
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
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
