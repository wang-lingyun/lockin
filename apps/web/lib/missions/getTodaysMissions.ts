import type { SupabaseClient } from "@supabase/supabase-js";
import type { MissionStatus, MissionWithTask, ScheduleBlock } from "@/lib/db/types";
import { blockOccursOn } from "./recurrence";

/**
 * A row for the dashboard's Today's Missions. Either a persisted `daily_mission`
 * (ad-hoc or already materialized from a block) or a *virtual* one derived from a
 * schedule block that occurs today but hasn't been acted on yet (ADR 0006). The
 * merge reads only — nothing is written, so re-opening a day never duplicates.
 */
export type TodayMission = {
  source: "mission" | "block";
  key: string;
  title: string;
  description: string | null;
  subjectName: string | null;
  subjectColor: string | null;
  estimatedMinutes: number | null;
  reflection: string | null;
  status: MissionStatus;
  deferredTo: string | null;
  // Scheduled wall-clock window (floating UTC ISO), when the item comes from a
  // timed schedule block. Null for ad-hoc or all-day items — those sort last.
  startAt: string | null;
  endAt: string | null;
  missionId?: string;
  scheduleBlockId?: string;
};

/** A block's timed window, or nulls when it's all-day / untimed. */
function blockWindow(
  b: { start_at: string | null; end_at: string | null; all_day: boolean } | undefined,
): { startAt: string | null; endAt: string | null } {
  if (!b || b.all_day) return { startAt: null, endAt: null };
  return { startAt: b.start_at ?? null, endAt: b.end_at ?? null };
}

/** Minutes-from-midnight of a floating UTC ISO time, for ordering. */
function timeOfDay(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

type BlockWithJoins = ScheduleBlock & {
  task: { id: string; title: string } | null;
  subject: { id: string; name: string; color: string | null } | null;
};

export async function getTodaysMissions(
  supabase: SupabaseClient,
  studentId: string,
  dateISO: string,
): Promise<TodayMission[]> {
  // Persisted missions for the day (ad-hoc + previously materialized blocks).
  const { data: missionData } = await supabase
    .from("daily_missions")
    .select(
      "*, task:tasks(id,title,description,estimated_minutes), subject:subjects(id,name,color)",
    )
    .eq("student_id", studentId)
    .eq("date", dateISO)
    .order("created_at", { ascending: true });
  const missions = (missionData ?? []) as MissionWithTask[];

  // Schedule blocks for the student (used both to title block-derived missions
  // and to surface today's not-yet-acted-on occurrences).
  const { data: blockData } = await supabase
    .from("schedule_blocks")
    .select("*, task:tasks(id,title), subject:subjects(id,name,color)")
    .eq("student_id", studentId)
    .neq("status", "cancelled");
  const blocks = (blockData ?? []) as BlockWithJoins[];
  const blockById = new Map(blocks.map((b) => [b.id, b]));

  // 1. Persisted missions for the day. A mission materialized from a schedule
  // block has no task, so fall back to the block's own title (keeping Today in
  // sync with the weekly schedule) before the generic "Untitled task".
  const out: TodayMission[] = missions.map((m) => {
    const block = m.schedule_block_id
      ? blockById.get(m.schedule_block_id)
      : undefined;
    return {
      source: "mission",
      key: `m:${m.id}`,
      title: m.task?.title ?? block?.title ?? "Untitled task",
      // Prefer the mission's own note (e.g. a note carried over when this mission
      // was moved here from another day) over the task/block description.
      description: m.notes ?? m.task?.description ?? block?.notes ?? null,
      subjectName: m.subject?.name ?? null,
      subjectColor: m.subject?.color ?? null,
      estimatedMinutes: m.task?.estimated_minutes ?? null,
      reflection: m.student_reflection ?? null,
      status: m.status,
      deferredTo: m.deferred_to ?? null,
      ...blockWindow(block),
      missionId: m.id,
    };
  });

  // 2. Schedule blocks occurring today without a persisted mission yet.
  const materialized = new Set(
    missions.map((m) => m.schedule_block_id).filter(Boolean) as string[],
  );

  for (const b of blocks) {
    if (materialized.has(b.id)) continue;
    if (!blockOccursOn(b, dateISO)) continue;
    out.push({
      source: "block",
      key: `b:${b.id}`,
      title: b.title,
      description: b.notes ?? null,
      subjectName: b.subject?.name ?? null,
      subjectColor: b.subject?.color ?? null,
      estimatedMinutes: b.estimated_minutes ?? null,
      reflection: null,
      status: "not_started",
      deferredTo: null,
      ...blockWindow(b),
      scheduleBlockId: b.id,
    });
  }

  // Order by scheduled start time (earliest first); untimed / all-day items go
  // to the very end, each group keeping its prior (created_at / block) order.
  return out
    .map((m, i) => ({ m, i, t: timeOfDay(m.startAt) }))
    .sort((a, b) => {
      if (a.t === null && b.t === null) return a.i - b.i;
      if (a.t === null) return 1;
      if (b.t === null) return -1;
      return a.t !== b.t ? a.t - b.t : a.i - b.i;
    })
    .map((x) => x.m);
}
