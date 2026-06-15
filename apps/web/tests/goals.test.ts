import { describe, it, expect } from "vitest";
import { goalProgressPercent } from "@/lib/goals/progress";

describe("goalProgressPercent", () => {
  it("returns 0 when there is no positive target", () => {
    expect(goalProgressPercent(5, null)).toBe(0);
    expect(goalProgressPercent(5, 0)).toBe(0);
    expect(goalProgressPercent(5, -10)).toBe(0);
  });

  it("computes and rounds a partial percentage", () => {
    expect(goalProgressPercent(25, 50)).toBe(50);
    expect(goalProgressPercent(1, 3)).toBe(33); // 33.33 -> 33
    expect(goalProgressPercent(2, 3)).toBe(67); // 66.66 -> 67
  });

  it("clamps over-target progress to 100", () => {
    expect(goalProgressPercent(60, 50)).toBe(100);
  });

  it("floors negative current at 0", () => {
    expect(goalProgressPercent(-5, 50)).toBe(0);
  });
});
