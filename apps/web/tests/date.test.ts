import { describe, it, expect } from "vitest";
import { todayISO, APP_TIME_ZONE, nextISODate } from "@/lib/date";

describe("todayISO", () => {
  it("is the app timezone (Pacific), not necessarily UTC", () => {
    expect(APP_TIME_ZONE).toBe("America/Los_Angeles");
  });

  it("returns a YYYY-MM-DD string", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("matches the Pacific calendar day", () => {
    const expected = new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    expect(todayISO()).toBe(expected);
  });
});

describe("nextISODate", () => {
  it("returns the following calendar day", () => {
    expect(nextISODate("2026-06-22")).toBe("2026-06-23");
  });

  it("crosses month boundaries", () => {
    expect(nextISODate("2026-06-30")).toBe("2026-07-01");
  });

  it("crosses year boundaries", () => {
    expect(nextISODate("2025-12-31")).toBe("2026-01-01");
  });

  it("handles leap-day boundary", () => {
    expect(nextISODate("2028-02-28")).toBe("2028-02-29");
    expect(nextISODate("2028-02-29")).toBe("2028-03-01");
  });
});
