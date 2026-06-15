import Link from "next/link";
import { requireParent } from "@/lib/auth/session";
import type { Student, PriorityType } from "@/lib/db/types";
import { PriorityControl } from "./_components/PriorityControl";
import { setSubjectPriorityAction, setTrackPriorityAction } from "./actions";

export const metadata = { title: "Settings · LockIn" };

type SubjectRow = { id: string; name: string; color: string | null };
type TrackRow = { id: string; subject_id: string; name: string };

export default async function SettingsPage({
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

  const { data: subjectsData } = await supabase
    .from("subjects")
    .select("id,name,color")
    .order("name", { ascending: true });
  const subjects = (subjectsData ?? []) as SubjectRow[];

  const { data: tracksData } = await supabase
    .from("subject_tracks")
    .select("id,subject_id,name")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  const tracks = (tracksData ?? []) as TrackRow[];
  const tracksBySubject = new Map<string, TrackRow[]>();
  for (const t of tracks) {
    const list = tracksBySubject.get(t.subject_id) ?? [];
    list.push(t);
    tracksBySubject.set(t.subject_id, list);
  }

  // Current priorities for the active student (absence => inactive).
  const subjectPriority = new Map<string, PriorityType>();
  const trackPriority = new Map<string, PriorityType>();
  if (active) {
    const { data: ss } = await supabase
      .from("student_subjects")
      .select("subject_id,priority_type")
      .eq("student_id", active.id);
    for (const r of ss ?? [])
      subjectPriority.set(r.subject_id, r.priority_type as PriorityType);

    const { data: st } = await supabase
      .from("student_subject_tracks")
      .select("subject_track_id,priority_type")
      .eq("student_id", active.id);
    for (const r of st ?? [])
      trackPriority.set(r.subject_track_id, r.priority_type as PriorityType);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Subjects &amp; tracks</h1>
          <p className="text-sm text-muted">
            Turn subjects on per student and mark each as primary or bonus.
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
                  href={`/settings?student=${s.id}`}
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
            <ul className="flex flex-col gap-3">
              {subjects.map((subject) => {
                const subjTracks = tracksBySubject.get(subject.id) ?? [];
                return (
                  <li
                    key={subject.id}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-medium text-text">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ background: subject.color ?? "#6366f1" }}
                        />
                        {subject.name}
                      </span>
                      <PriorityControl
                        action={setSubjectPriorityAction}
                        hidden={{ studentId: active.id, subjectId: subject.id }}
                        current={subjectPriority.get(subject.id) ?? "inactive"}
                      />
                    </div>

                    {subjTracks.length > 0 ? (
                      <ul className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                        {subjTracks.map((t) => (
                          <li
                            key={t.id}
                            className="flex items-center justify-between gap-3 pl-5"
                          >
                            <span className="text-sm text-muted">{t.name}</span>
                            <PriorityControl
                              action={setTrackPriorityAction}
                              hidden={{
                                studentId: active.id,
                                subjectTrackId: t.id,
                              }}
                              current={trackPriority.get(t.id) ?? "inactive"}
                            />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </>
      )}
    </main>
  );
}
