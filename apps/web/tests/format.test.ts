import { describe, it, expect } from "vitest";
import { hoursLabel, timeRangeLabel } from "@/lib/format";
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

describe("timeRangeLabel", () => {
  it("collapses the meridiem when start and end share it", () => {
    expect(timeRangeLabel("2026-06-29T08:00:00Z", "2026-06-29T10:00:00Z")).toBe(
      "8:00–10:00 AM",
    );
  });

  it("keeps both meridiems across noon", () => {
    expect(timeRangeLabel("2026-06-29T11:00:00Z", "2026-06-29T13:30:00Z")).toBe(
      "11:00 AM – 1:30 PM",
    );
  });

  it("renders midnight/noon as 12 and pads minutes", () => {
    expect(timeRangeLabel("2026-06-29T00:05:00Z", "2026-06-29T12:00:00Z")).toBe(
      "12:05 AM – 12:00 PM",
    );
  });

  it("reads a +00:00 offset the same as Z", () => {
    expect(
      timeRangeLabel("2026-06-29T08:00:00+00:00", "2026-06-29T10:00:00+00:00"),
    ).toBe("8:00–10:00 AM");
  });

  it("shows just the start when there's no end", () => {
    expect(timeRangeLabel("2026-06-29T08:00:00Z", null)).toBe("8:00 AM");
  });

  it("returns null for an untimed / all-day item", () => {
    expect(timeRangeLabel(null, null)).toBeNull();
    expect(timeRangeLabel(undefined, "2026-06-29T10:00:00Z")).toBeNull();
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
