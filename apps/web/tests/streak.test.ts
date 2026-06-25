import { describe, it, expect } from "vitest";
import { previousISODate } from "@/lib/date";
import { streakFromQualifyingDates } from "@/lib/streak/computeStreak";

describe("previousISODate", () => {
  it("steps back one calendar day", () => {
    expect(previousISODate("2026-06-14")).toBe("2026-06-13");
  });

  it("crosses a month boundary", () => {
    expect(previousISODate("2026-07-01")).toBe("2026-06-30");
  });

  it("crosses a year boundary", () => {
    expect(previousISODate("2026-01-01")).toBe("2025-12-31");
  });

  it("handles a leap day", () => {
    expect(previousISODate("2024-03-01")).toBe("2024-02-29");
  });
});

describe("streakFromQualifyingDates", () => {
  const today = "2026-06-14";

  it("is 0 with no qualifying days", () => {
    expect(streakFromQualifyingDates(new Set(), today)).toBe(0);
  });

  it("is 0 on the day a streak starts (today only)", () => {
    expect(streakFromQualifyingDates(new Set(["2026-06-14"]), today)).toBe(0);
  });

  it("counts days on top of the first for a run ending today", () => {
    // 3 consecutive days → start day is 0, so 2
    const dates = new Set(["2026-06-14", "2026-06-13", "2026-06-12"]);
    expect(streakFromQualifyingDates(dates, today)).toBe(2);
  });

  it("counts a run ending yesterday (today not done yet)", () => {
    // 2 consecutive days → 1
    const dates = new Set(["2026-06-13", "2026-06-12"]);
    expect(streakFromQualifyingDates(dates, today)).toBe(1);
  });

  it("breaks on a gap", () => {
    // today + yesterday qualify (2 days), then a gap on the 12th → 1
    const dates = new Set(["2026-06-14", "2026-06-13", "2026-06-11"]);
    expect(streakFromQualifyingDates(dates, today)).toBe(1);
  });

  it("is 0 when neither today nor yesterday qualifies", () => {
    const dates = new Set(["2026-06-12", "2026-06-11"]);
    expect(streakFromQualifyingDates(dates, today)).toBe(0);
  });

  it("ignores future dates", () => {
    const dates = new Set(["2026-06-15", "2026-06-16"]);
    expect(streakFromQualifyingDates(dates, today)).toBe(0);
  });
});
