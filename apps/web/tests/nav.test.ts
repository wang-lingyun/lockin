import { describe, it, expect } from "vitest";
import { withStudent } from "@/lib/nav/withStudent";
import { parseRRule, buildRRule } from "@/lib/missions/recurrence";

const STUDENT = "11111111-1111-1111-1111-111111111111";

describe("withStudent", () => {
  it("appends the student query param", () => {
    expect(withStudent("/schedule", STUDENT)).toBe(`/schedule?student=${STUDENT}`);
  });

  it("returns a bare path when there is no student", () => {
    expect(withStudent("/schedule", null)).toBe("/schedule");
    expect(withStudent("/schedule", undefined)).toBe("/schedule");
  });

  it("merges extra params alongside student", () => {
    expect(withStudent("/schedule", STUDENT, { week: "2026-06-01" })).toBe(
      `/schedule?student=${STUDENT}&week=2026-06-01`,
    );
  });

  it("omits empty extra values", () => {
    expect(withStudent("/schedule", STUDENT, { week: "" })).toBe(
      `/schedule?student=${STUDENT}`,
    );
  });

  it("supports extras with no student", () => {
    expect(withStudent("/schedule", null, { week: "2026-06-01" })).toBe(
      "/schedule?week=2026-06-01",
    );
  });
});

describe("parseRRule (inverse of buildRRule)", () => {
  it("maps null to none", () => {
    expect(parseRRule(null)).toEqual({ repeat: "none", byweekday: [] });
  });

  it("round-trips daily", () => {
    const rule = buildRRule("daily", []);
    expect(parseRRule(rule)).toEqual({ repeat: "daily", byweekday: [] });
  });

  it("round-trips weekly with weekdays", () => {
    const rule = buildRRule("weekly", ["MO", "WE", "FR"]);
    expect(rule).toBe("FREQ=WEEKLY;BYDAY=MO,WE,FR");
    expect(parseRRule(rule)).toEqual({
      repeat: "weekly",
      byweekday: ["MO", "WE", "FR"],
    });
  });

  it("handles weekly with no BYDAY", () => {
    expect(parseRRule("FREQ=WEEKLY")).toEqual({ repeat: "weekly", byweekday: [] });
  });

  it("falls back to none for unsupported rules", () => {
    expect(parseRRule("FREQ=MONTHLY")).toEqual({ repeat: "none", byweekday: [] });
  });
});
