import { describe, it, expect } from "vitest";
import { todayISO, APP_TIME_ZONE } from "@/lib/date";

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
