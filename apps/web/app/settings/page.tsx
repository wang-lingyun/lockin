import { requireParent } from "@/lib/auth/session";
import type { Student, PriorityType } from "@/lib/db/types";
import { AppHeader } from "@/app/_components/AppHeader";
import { PriorityControl } from "./_components/PriorityControl";
import { AddSubjectForm } from "./_components/AddSubjectForm";
import { AddTrackForm } from "./_components/AddTrackForm";
import { InlineRename } from "./_components/InlineRename";
import {
  setSubjectPriorityAction,
  setTrackPriorityAction,
  renameSubjectAction,
  renameTrackAction,
  setTrackActiveAction,
} from "./actions";

export const metadata = { title: "Settings · LockIn" };

type SubjectRow = {
  id: string;
  name: string;
  color: string | null;
  is_default: boolean;
  owner_parent_id: string | null;
};
type TrackRow = {
  id: string;
  subject_id: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
  owner_parent_id: string | null;
};

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
    .select("id,name,color,is_default,owner_parent_id")
    .order("name", { ascending: true });
  const subjects = (subjectsData ?? []) as SubjectRow[];

  const { data: tracksData } = await supabase
    .from("subject_tracks")
    .select("id,subject_id,name,is_active,is_default,owner_parent_id")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  const tracks = (tracksData ?? []) as TrackRow[];
  const tracksBySubject = new Map<string, TrackRow[]>();
  for (const t of tracks) {
    const list = tracksBySubject.get(t.subject_id) ?? [];
    list.push(t);
    tracksBySubject.set(t.subject_id, list);
  }

  // A parent can edit only subjects/tracks they own (defaults stay read-only).
  const owns = (row: { is_default: boolean; owner_parent_id: string | null }) =>
    !row.is_default && row.owner_parent_id === parent.parentUserId;

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
      <AppHeader
        email={parent.email}
        students={students}
        activeId={active?.id ?? null}
        current="settings"
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Subjects &amp; tracks</h1>
        <p className="text-sm text-muted">
          Add your own subjects and sub-categories, then turn them on per student
          and mark each as primary or bonus.
        </p>
      </div>

      {students.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
          Add a student in Manage first.
        </p>
      ) : (
        <>
          <section className="mb-6 rounded-xl border border-border bg-surface p-4">
            <AddSubjectForm />
          </section>

          {active ? (
            <ul className="flex flex-col gap-3">
              {subjects.map((subject) => {
                const subjTracks = tracksBySubject.get(subject.id) ?? [];
                const subjectEditable = owns(subject);
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
                        {subjectEditable ? (
                          <InlineRename
                            action={renameSubjectAction}
                            id={subject.id}
                            defaultName={subject.name}
                          />
                        ) : (
                          subject.name
                        )}
                      </span>
                      <PriorityControl
                        action={setSubjectPriorityAction}
                        hidden={{ studentId: active.id, subjectId: subject.id }}
                        current={subjectPriority.get(subject.id) ?? "inactive"}
                      />
                    </div>

                    {subjTracks.length > 0 ? (
                      <ul className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                        {subjTracks.map((t) => {
                          const trackEditable = owns(t);
                          return (
                            <li
                              key={t.id}
                              className="flex items-center justify-between gap-3 pl-5"
                            >
                              <span className="flex items-center gap-2 text-sm text-muted">
                                {trackEditable ? (
                                  <InlineRename
                                    action={renameTrackAction}
                                    id={t.id}
                                    defaultName={t.name}
                                  />
                                ) : (
                                  t.name
                                )}
                                {!t.is_active ? (
                                  <span className="rounded bg-border px-1.5 py-0.5 text-xs text-muted">
                                    hidden
                                  </span>
                                ) : null}
                              </span>
                              <div className="flex items-center gap-2">
                                {trackEditable ? (
                                  <form action={setTrackActiveAction}>
                                    <input type="hidden" name="id" value={t.id} />
                                    <input
                                      type="hidden"
                                      name="isActive"
                                      value={t.is_active ? "false" : "true"}
                                    />
                                    <button className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-text">
                                      {t.is_active ? "Hide" : "Show"}
                                    </button>
                                  </form>
                                ) : null}
                                <PriorityControl
                                  action={setTrackPriorityAction}
                                  hidden={{
                                    studentId: active.id,
                                    subjectTrackId: t.id,
                                  }}
                                  current={trackPriority.get(t.id) ?? "inactive"}
                                />
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}

                    {subjectEditable ? (
                      <div className="mt-3 border-t border-border pt-3">
                        <AddTrackForm subjectId={subject.id} />
                      </div>
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
