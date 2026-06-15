import { describe, it, expect } from "vitest";
import { ReflectionCreateInput, ReflectionUpdateInput } from "@lockin/shared";

const STUDENT = "11111111-1111-1111-1111-111111111111";
const REFLECTION = "22222222-2222-2222-2222-222222222222";

describe("ReflectionCreateInput", () => {
  it("accepts a reflection with one filled prompt and trims it", () => {
    const r = ReflectionCreateInput.safeParse({
      studentId: STUDENT,
      whatLearned: "  fractions click now  ",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.whatLearned).toBe("fractions click now");
  });

  it("rejects an all-empty reflection", () => {
    expect(
      ReflectionCreateInput.safeParse({ studentId: STUDENT }).success,
    ).toBe(false);
    expect(
      ReflectionCreateInput.safeParse({
        studentId: STUDENT,
        whatFinished: "   ",
        whatWasHard: "",
      }).success,
    ).toBe(false);
  });

  it("rejects a malformed date", () => {
    expect(
      ReflectionCreateInput.safeParse({
        studentId: STUDENT,
        whatFinished: "math",
        date: "06/14/2026",
      }).success,
    ).toBe(false);
  });
});

describe("ReflectionUpdateInput", () => {
  it("accepts a parent-comment-only update", () => {
    expect(
      ReflectionUpdateInput.safeParse({
        id: REFLECTION,
        parentComment: "Great work today!",
      }).success,
    ).toBe(true);
  });

  it("allows clearing the parent comment with null", () => {
    expect(
      ReflectionUpdateInput.safeParse({ id: REFLECTION, parentComment: null })
        .success,
    ).toBe(true);
  });
});
