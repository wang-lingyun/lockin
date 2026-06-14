import { describe, expect, it } from "vitest";
import { LEVEL_THRESHOLDS, levelForXp, xpToNextLevel } from "@lockin/shared";

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
