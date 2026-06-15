import { describe, expect, it } from "vitest";
import {
  LEVEL_THRESHOLDS,
  levelForXp,
  xpToNextLevel,
  XpAdjustInput,
} from "@lockin/shared";

const STUDENT = "11111111-1111-1111-1111-111111111111";

describe("level math (PRD §10.12)", () => {
  it("maps XP to the right level", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(800)).toBe(5);
    expect(levelForXp(99999)).toBe(LEVEL_THRESHOLDS.length);
  });

  it("computes XP to the next level", () => {
    expect(xpToNextLevel(0)).toBe(100);
    expect(xpToNextLevel(100)).toBe(150);
    expect(xpToNextLevel(1200)).toBe(0); // at max defined level
  });
});

describe("XpAdjustInput (xp.adjust)", () => {
  it("accepts a positive delta with a reason", () => {
    const r = XpAdjustInput.safeParse({
      studentId: STUDENT,
      amount: 25,
      reason: "  Helped a sibling  ",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.reason).toBe("Helped a sibling");
  });

  it("accepts a negative delta without a reason", () => {
    expect(
      XpAdjustInput.safeParse({ studentId: STUDENT, amount: -10 }).success,
    ).toBe(true);
  });

  it("rejects a zero delta", () => {
    expect(
      XpAdjustInput.safeParse({ studentId: STUDENT, amount: 0 }).success,
    ).toBe(false);
  });

  it("rejects a non-integer delta", () => {
    expect(
      XpAdjustInput.safeParse({ studentId: STUDENT, amount: 12.5 }).success,
    ).toBe(false);
  });

  it("rejects an out-of-range delta", () => {
    expect(
      XpAdjustInput.safeParse({ studentId: STUDENT, amount: 200000 }).success,
    ).toBe(false);
  });
});
