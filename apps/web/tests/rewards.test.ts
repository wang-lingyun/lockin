import { describe, it, expect } from "vitest";
import { RewardCreateInput, rewardUnlocked } from "@lockin/shared";

const STUDENT = "11111111-1111-1111-1111-111111111111";

describe("RewardCreateInput", () => {
  it("accepts a reward and trims the title", () => {
    const r = RewardCreateInput.safeParse({
      studentId: STUDENT,
      title: "  Movie night  ",
      requiredXp: 500,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.title).toBe("Movie night");
  });

  it("allows a reward with no threshold", () => {
    expect(
      RewardCreateInput.safeParse({ studentId: STUDENT, title: "Surprise" })
        .success,
    ).toBe(true);
  });

  it("requires a title", () => {
    expect(
      RewardCreateInput.safeParse({ studentId: STUDENT }).success,
    ).toBe(false);
  });

  it("rejects a negative or non-integer requiredXp", () => {
    expect(
      RewardCreateInput.safeParse({
        studentId: STUDENT,
        title: "x",
        requiredXp: -5,
      }).success,
    ).toBe(false);
    expect(
      RewardCreateInput.safeParse({
        studentId: STUDENT,
        title: "x",
        requiredXp: 10.5,
      }).success,
    ).toBe(false);
  });
});

describe("rewardUnlocked", () => {
  it("stays locked when there's no threshold", () => {
    expect(rewardUnlocked(null, 9999)).toBe(false);
  });

  it("is locked below the threshold", () => {
    expect(rewardUnlocked(500, 499)).toBe(false);
  });

  it("unlocks at the threshold", () => {
    expect(rewardUnlocked(500, 500)).toBe(true);
  });

  it("stays unlocked above the threshold", () => {
    expect(rewardUnlocked(500, 800)).toBe(true);
  });
});
