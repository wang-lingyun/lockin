import { describe, it, expect } from "vitest";
import { hoursLabel } from "@/lib/format";
import { formatLongDate } from "@/lib/date";

describe("hoursLabel", () => {
  it("shows whole hours without a fraction", () => {
    expect(hoursLabel(60)).toBe("1 hour");
    expect(hoursLabel(120)).toBe("2 hours");
    expect(hoursLabel(180)).toBe("3 hours");
  });

  it("shows an hour or more as hours with a fraction", () => {
    expect(hoursLabel(90)).toBe("1.5 hours");
    expect(hoursLabel(105)).toBe("1.75 hours");
    expect(hoursLabel(165)).toBe("2.75 hours");
    expect(hoursLabel(555)).toBe("9.25 hours");
  });

  it("shows sub-hour durations in minutes (half-hour excepted)", () => {
    expect(hoursLabel(30)).toBe("0.5 hour");
    expect(hoursLabel(45)).toBe("45min");
    expect(hoursLabel(15)).toBe("15min");
  });

  it("returns null for nothing to show", () => {
    expect(hoursLabel(0)).toBeNull();
    expect(hoursLabel(null)).toBeNull();
    expect(hoursLabel(undefined)).toBeNull();
    expect(hoursLabel(-30)).toBeNull();
  });
});

describe("formatLongDate", () => {
  it("formats a mid-year date with weekday", () => {
    expect(formatLongDate("2026-06-22")).toBe("Monday, June 22, 2026");
  });

  it("handles January (boundary)", () => {
    expect(formatLongDate("2026-01-01")).toBe("Thursday, January 1, 2026");
  });

  it("handles December (boundary)", () => {
    expect(formatLongDate("2025-12-31")).toBe("Wednesday, December 31, 2025");
  });
});
