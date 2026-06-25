import type { SupabaseClient } from "@supabase/supabase-js";
import type { Student } from "@/lib/db/types";
import { computeStreak } from "@/lib/streak/computeStreak";
import { getTodaysMissions } from "@/lib/missions/getTodaysMissions";

/**
 * One student's at-a-glance summary for the parent dashboard (PRD §10.1):
 * streak, today's mission completion, and the two attention counts. All
 * read-time aggregates (no cron, ADR 0006). A handful of cheap reads per
 * student — fine on the free tier for a small family.
 */
export type StudentGlance = {
  student: Student;
  streak: number;
  missionsDone: number;
  missionsTotal: number;
  toReview: number;
  toRevisit: number;
};

export async function studentGlance(
  supabase: SupabaseClient,
  student: Student,
  today: string,
): Promise<StudentGlance> {
  const [streak, missions, reviewRes, revisitRes] = await Promise.all([
    computeStreak(supabase, student.id, today),
    getTodaysMissions(supabase, student.id, today),
    supabase
      .from("homework_submissions")
      .select("id", { count: "exact", head: true })
      .eq("student_id", student.id)
      .eq("review_status", "submitted"),
    supabase
      .from("mistake_bank_entries")
      .select("id", { count: "exact", head: true })
      .eq("student_id", student.id)
      .eq("status", "needs_review"),
  ]);

  return {
    student,
    streak,
    missionsDone: missions.filter((m) => m.status === "completed").length,
    missionsTotal: missions.length,
    toReview: reviewRes.count ?? 0,
    toRevisit: revisitRes.count ?? 0,
  };
}
