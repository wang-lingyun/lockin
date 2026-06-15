import type { SupabaseClient } from "@supabase/supabase-js";
import { previousISODate } from "@/lib/date";

/**
 * Streak computation (PRD §10.12). Computed **on read** (no cron, per ADR 0006)
 * from the days a student "showed up": a day counts if there's a reflection OR a
 * completed mission on it (the rule decided for the MVP). The stored
 * `students.current_streak` column is left as a deprecated snapshot — the
 * dashboard renders this computed value instead.
 */

/**
 * Number of consecutive qualifying days ending at `today` (pure; unit-tested).
 * Today still "in progress" shouldn't break a streak, so if today hasn't
 * qualified yet we start counting from yesterday. Future dates are ignored.
 */
export function streakFromQualifyingDates(
  dates: Set<string>,
  today: string,
): number {
  let cursor = dates.has(today) ? today : previousISODate(today);
  let streak = 0;
  while (dates.has(cursor)) {
    streak += 1;
    cursor = previousISODate(cursor);
  }
  return streak;
}

/**
 * Read the student's qualifying days (reflections + completed missions) within a
 * bounded recent window and compute the current streak. Two small reads, no
 * writes; safe on the free tier.
 */
export async function computeStreak(
  supabase: SupabaseClient,
  studentId: string,
  today: string,
): Promise<number> {
  // Bound the scan so the query stays cheap; a streak longer than this is
  // effectively "max" for the MVP and not worth unbounded reads.
  const windowStart = (() => {
    const [y, m, d] = today.split("-").map(Number);
    const t = Date.UTC(y, m - 1, d) - 400 * 24 * 60 * 60 * 1000;
    return new Date(t).toISOString().slice(0, 10);
  })();

  const [reflectionsRes, missionsRes] = await Promise.all([
    supabase
      .from("reflections")
      .select("date")
      .eq("student_id", studentId)
      .gte("date", windowStart),
    supabase
      .from("daily_missions")
      .select("date")
      .eq("student_id", studentId)
      .eq("status", "completed")
      .gte("date", windowStart),
  ]);

  const dates = new Set<string>();
  for (const r of reflectionsRes.data ?? [])
    dates.add((r as { date: string }).date);
  for (const m of missionsRes.data ?? [])
    dates.add((m as { date: string }).date);

  return streakFromQualifyingDates(dates, today);
}
