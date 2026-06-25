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
  subjectName: string | null;
  subjectColor: string | null;
  xp: number;
  estimatedMinutes: number | null;
  status: MissionStatus;
  missionId?: string;
  scheduleBlockId?: string;
};

type BlockWithJoins = ScheduleBlock & {
  task: { id: string; title: string; xp_value: number } | null;
  subject: { id: string; name: string; color: string | null } | null;
};

export async function getTodaysMissions(
  supabase: SupabaseClient,
  studentId: string,
  dateISO: string,
): Promise<TodayMission[]> {
  // 1. Persisted missions for the day (ad-hoc + previously materialized).
  const { data: missionData } = await supabase
    .from("daily_missions")
    .select(
      "*, task:tasks(id,title,xp_value,estimated_minutes), subject:subjects(id,name,color)",
    )
    .eq("student_id", studentId)
    .eq("date", dateISO)
    .order("created_at", { ascending: true });
  const missions = (missionData ?? []) as MissionWithTask[];

  const out: TodayMission[] = missions.map((m) => ({
    source: "mission",
    key: `m:${m.id}`,
    title: m.task?.title ?? "Untitled task",
    subjectName: m.subject?.name ?? null,
    subjectColor: m.subject?.color ?? null,
    xp: m.task?.xp_value ?? 0,
    estimatedMinutes: m.task?.estimated_minutes ?? null,
    status: m.status,
    missionId: m.id,
  }));

  // 2. Schedule blocks occurring today without a persisted mission yet.
  const materialized = new Set(
    missions.map((m) => m.schedule_block_id).filter(Boolean) as string[],
  );

  const { data: blockData } = await supabase
    .from("schedule_blocks")
    .select("*, task:tasks(id,title,xp_value), subject:subjects(id,name,color)")
    .eq("student_id", studentId)
    .neq("status", "cancelled");
  const blocks = (blockData ?? []) as BlockWithJoins[];

  for (const b of blocks) {
    if (materialized.has(b.id)) continue;
    if (!blockOccursOn(b, dateISO)) continue;
    out.push({
      source: "block",
      key: `b:${b.id}`,
      title: b.title,
      subjectName: b.subject?.name ?? null,
      subjectColor: b.subject?.color ?? null,
      xp: b.task?.xp_value ?? 0,
      estimatedMinutes: b.estimated_minutes ?? null,
      status: "not_started",
      scheduleBlockId: b.id,
    });
  }

  return out;
}
