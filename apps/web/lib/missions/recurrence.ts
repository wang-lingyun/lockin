import { rrulestr } from "rrule";
import type { ScheduleBlock } from "@/lib/db/types";

/**
 * Read-time recurrence expansion for schedule blocks (ADR 0006). All date math
 * is in UTC, matching the app's single-day model (`lib/date.ts`); per-student
 * timezones are a deferred decision. Pure + server-side only (imports rrule).
 */

/** UTC [start, end) instants bounding an ISO calendar day (YYYY-MM-DD). */
export function dayWindowUTC(dateISO: string): [Date, Date] {
  const start = new Date(`${dateISO}T00:00:00.000Z`);
  const end = new Date(`${dateISO}T23:59:59.999Z`);
  return [start, end];
}

/** iCal basic UTC stamp, e.g. 20260601T160000Z. */
function toICalUTC(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Does a block occur on the given ISO date? */
export function blockOccursOn(block: ScheduleBlock, dateISO: string): boolean {
  if (block.status === "cancelled") return false;
  const [dayStart, dayEnd] = dayWindowUTC(dateISO);

  if (block.recurrence_rule) {
    if (!block.start_at) return false;
    const dtstart = new Date(block.start_at);
    if (dtstart > dayEnd) return false; // not started yet
    const text = `DTSTART:${toICalUTC(dtstart)}\nRRULE:${block.recurrence_rule}`;
    const rule = rrulestr(text);
    return rule.between(dayStart, dayEnd, true).length > 0;
  }

  // One-off: occurs on the calendar day of its start.
  if (!block.start_at) return false;
  return block.start_at.slice(0, 10) === dateISO;
}

/** Sort key: timed blocks by start, then all-day/untimed, then title. */
function compareBlocks(a: ScheduleBlock, b: ScheduleBlock): number {
  const at = a.all_day ? "" : (a.start_at ?? "");
  const bt = b.all_day ? "" : (b.start_at ?? "");
  if (at !== bt) return at < bt ? -1 : 1;
  return a.title.localeCompare(b.title);
}

/** Add `n` days to an ISO date (UTC). */
export function addDaysISO(dateISO: string, n: number): string {
  const d = new Date(`${dateISO}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Monday (UTC) of the week containing `dateISO`. */
export function weekStartFor(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00.000Z`);
  const dow = d.getUTCDay(); // 0=Sun..6=Sat
  const backToMonday = (dow + 6) % 7;
  return addDaysISO(dateISO, -backToMonday);
}

/** Bucket the blocks' occurrences across the 7 days from `weekStartISO`. */
export function expandWeek(
  blocks: ScheduleBlock[],
  weekStartISO: string,
): { date: string; blocks: ScheduleBlock[] }[] {
  const days: { date: string; blocks: ScheduleBlock[] }[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDaysISO(weekStartISO, i);
    const onDay = blocks
      .filter((b) => blockOccursOn(b, date))
      .sort(compareBlocks);
    days.push({ date, blocks: onDay });
  }
  return days;
}

/** Build an RRULE string from the add-block form preset (null = no repeat). */
export function buildRRule(
  repeat: "none" | "daily" | "weekly",
  byweekday: string[],
): string | null {
  if (repeat === "daily") return "FREQ=DAILY";
  if (repeat === "weekly") {
    const days = byweekday.filter(Boolean);
    return days.length > 0 ? `FREQ=WEEKLY;BYDAY=${days.join(",")}` : "FREQ=WEEKLY";
  }
  return null;
}

/**
 * Inverse of `buildRRule` for prefilling the edit form: map a stored RRULE back
 * to the friendly preset. Only the presets the form can produce are recognized;
 * anything else (e.g. an agent-set MONTHLY rule) falls back to "none".
 */
export function parseRRule(rule: string | null): {
  repeat: "none" | "daily" | "weekly";
  byweekday: string[];
} {
  if (!rule) return { repeat: "none", byweekday: [] };
  if (/FREQ=DAILY/i.test(rule)) return { repeat: "daily", byweekday: [] };
  if (/FREQ=WEEKLY/i.test(rule)) {
    const m = rule.match(/BYDAY=([^;]+)/i);
    const byweekday = m
      ? m[1].split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
      : [];
    return { repeat: "weekly", byweekday };
  }
  return { repeat: "none", byweekday: [] };
}
