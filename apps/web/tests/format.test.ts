import { describe, it, expect } from "vitest";
import { hoursLabel } from "@/lib/format";
import { formatLongDate } from "@/lib/date";

describe("hoursLabel", () => {
  it("formats half hours", () => {
    expect(hoursLabel(30)).toBe("0.5h");
    expect(hoursLabel(90)).toBe("1.5h");
  });

  it("drops a trailing .0 for whole hours", () => {
    expect(hoursLabel(60)).toBe("1h");
    expect(hoursLabel(120)).toBe("2h");
  });

  it("returns null for nothing to show", () => {
    expect(hoursLabel(0)).toBeNull();
    expect(hoursLabel(null)).toBeNull();
    expect(hoursLabel(undefined)).toBeNull();
    expect(hoursLabel(-30)).toBeNull();
  });
});

describe("formatLongDate", () => {
  it("formats a mid-year date", () => {
    expect(formatLongDate("2026-06-22")).toBe("June 22, 2026");
  });

  it("handles January (boundary)", () => {
    expect(formatLongDate("2026-01-01")).toBe("January 1, 2026");
  });

  it("handles December (boundary)", () => {
    expect(formatLongDate("2025-12-31")).toBe("December 31, 2025");
  });
});
