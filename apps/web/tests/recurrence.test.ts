import { describe, it, expect } from "vitest";
import {
  blockOccursOn,
  expandWeek,
  weekStartFor,
  addDaysISO,
  buildRRule,
} from "@/lib/missions/recurrence";
import type { ScheduleBlock } from "@/lib/db/types";

const UUID = "11111111-1111-1111-1111-111111111111";

/** Minimal block factory; overrides win. */
function block(over: Partial<ScheduleBlock>): ScheduleBlock {
  return {
    id: UUID,
    student_id: UUID,
    subject_id: null,
    subject_track_id: null,
    task_id: null,
    title: "Block",
    start_at: null,
    end_at: null,
    all_day: false,
    recurrence_rule: null,
    estimated_minutes: null,
    location: null,
    notes: null,
    status: "planned",
    ...over,
  };
}

// Monday 2026-06-01 .. Sunday 2026-06-07.
const MON = "2026-06-01";

describe("buildRRule", () => {
  it("maps presets to RRULE strings", () => {
    expect(buildRRule("none", [])).toBeNull();
    expect(buildRRule("daily", [])).toBe("FREQ=DAILY");
    expect(buildRRule("weekly", ["MO", "WE", "FR"])).toBe(
      "FREQ=WEEKLY;BYDAY=MO,WE,FR",
    );
    expect(buildRRule("weekly", [])).toBe("FREQ=WEEKLY");
  });
});

describe("weekStartFor", () => {
  it("returns the Monday of the containing week", () => {
    expect(weekStartFor("2026-06-03")).toBe(MON); // Wed -> Mon
    expect(weekStartFor(MON)).toBe(MON); // Mon -> Mon
    expect(weekStartFor("2026-06-07")).toBe(MON); // Sun -> Mon
  });
});

describe("blockOccursOn — one-off", () => {
  it("matches only its own calendar day", () => {
    const b = block({ start_at: "2026-06-03T16:00:00.000Z" });
    expect(blockOccursOn(b, "2026-06-03")).toBe(true);
    expect(blockOccursOn(b, "2026-06-04")).toBe(false);
    expect(blockOccursOn(b, "2026-06-02")).toBe(false);
  });

  it("never occurs when cancelled", () => {
    const b = block({
      start_at: "2026-06-03T16:00:00.000Z",
      status: "cancelled",
    });
    expect(blockOccursOn(b, "2026-06-03")).toBe(false);
  });
});

describe("blockOccursOn — recurring", () => {
  it("weekly BYDAY hits exactly the named weekdays", () => {
    const b = block({
      start_at: `${MON}T16:00:00.000Z`,
      recurrence_rule: "FREQ=WEEKLY;BYDAY=MO,WE,FR",
    });
    const hits = [];
    for (let i = 0; i < 7; i++) {
      const d = addDaysISO(MON, i);
      if (blockOccursOn(b, d)) hits.push(d);
    }
    expect(hits).toEqual(["2026-06-01", "2026-06-03", "2026-06-05"]);
  });

  it("daily hits every day in the window", () => {
    const b = block({
      start_at: `${MON}T08:00:00.000Z`,
      recurrence_rule: "FREQ=DAILY",
    });
    for (let i = 0; i < 7; i++) {
      expect(blockOccursOn(b, addDaysISO(MON, i))).toBe(true);
    }
  });

  it("does not occur before its start date", () => {
    const b = block({
      start_at: "2026-06-05T08:00:00.000Z",
      recurrence_rule: "FREQ=DAILY",
    });
    expect(blockOccursOn(b, "2026-06-04")).toBe(false);
    expect(blockOccursOn(b, "2026-06-05")).toBe(true);
  });
});

describe("expandWeek", () => {
  it("buckets occurrences across the 7-day window", () => {
    const weekly = block({
      id: "a",
      title: "Math",
      start_at: `${MON}T16:00:00.000Z`,
      recurrence_rule: "FREQ=WEEKLY;BYDAY=MO,WE,FR",
    });
    const oneOff = block({
      id: "b",
      title: "Chemistry",
      start_at: "2026-06-04T10:00:00.000Z",
    });
    const week = expandWeek([weekly, oneOff], MON);
    expect(week).toHaveLength(7);
    expect(week[0].blocks.map((b) => b.id)).toEqual(["a"]); // Mon
    expect(week[1].blocks.map((b) => b.id)).toEqual([]); // Tue
    expect(week[2].blocks.map((b) => b.id)).toEqual(["a"]); // Wed
    expect(week[3].blocks.map((b) => b.id)).toEqual(["b"]); // Thu (one-off)
    expect(week[4].blocks.map((b) => b.id)).toEqual(["a"]); // Fri
    expect(week[6].blocks).toHaveLength(0); // Sun
  });

  it("orders a day by clock time, not by a recurring block's anchor date", () => {
    // Swim recurs daily from an early-week anchor at a LATE time; AMC is a
    // one-off later in the week at an EARLY time. On Wednesday both occur, and
    // the early-clock-time AMC must come first (regression: comparing full
    // datetimes ordered Swim first because its anchor date is earlier).
    const swim = block({
      id: "swim",
      title: "Swim practice",
      start_at: `${MON}T17:45:00.000Z`,
      recurrence_rule: "FREQ=DAILY",
    });
    const amc = block({
      id: "amc",
      title: "AMC 10 Mock",
      start_at: "2026-06-03T08:00:00.000Z", // Wednesday
    });
    const week = expandWeek([swim, amc], MON);
    expect(week[2].blocks.map((b) => b.id)).toEqual(["amc", "swim"]); // Wed
  });

  it("sorts all-day / untimed blocks after timed ones", () => {
    const allDay = block({
      id: "comp",
      title: "Competition",
      start_at: `${MON}T00:00:00.000Z`,
      all_day: true,
    });
    const timed = block({
      id: "class",
      title: "Class",
      start_at: `${MON}T09:00:00.000Z`,
    });
    const week = expandWeek([allDay, timed], MON);
    expect(week[0].blocks.map((b) => b.id)).toEqual(["class", "comp"]); // Mon
  });
});
