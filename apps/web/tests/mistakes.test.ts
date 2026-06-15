import { describe, it, expect } from "vitest";
import { MistakeCreateInput, MistakeUpdateInput } from "@lockin/shared";

const STUDENT = "11111111-1111-1111-1111-111111111111";
const ENTRY = "22222222-2222-2222-2222-222222222222";

describe("MistakeCreateInput", () => {
  it("accepts a minimal entry (title only)", () => {
    const r = MistakeCreateInput.safeParse({
      studentId: STUDENT,
      title: "  Sign error  ",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.title).toBe("Sign error");
      expect(r.data.status).toBe("needs_review");
    }
  });

  it("accepts a description-only entry", () => {
    expect(
      MistakeCreateInput.safeParse({
        studentId: STUDENT,
        mistakeDescription: "Flipped the inequality without flipping the sign",
      }).success,
    ).toBe(true);
  });

  it("rejects a fully empty entry (no title, no description)", () => {
    expect(MistakeCreateInput.safeParse({ studentId: STUDENT }).success).toBe(
      false,
    );
    expect(
      MistakeCreateInput.safeParse({
        studentId: STUDENT,
        title: "   ",
        mistakeDescription: "   ",
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown status", () => {
    expect(
      MistakeCreateInput.safeParse({
        studentId: STUDENT,
        title: "x",
        status: "done",
      }).success,
    ).toBe(false);
  });

  it("rejects a non-uuid studentId", () => {
    expect(
      MistakeCreateInput.safeParse({ studentId: "nope", title: "x" }).success,
    ).toBe(false);
  });
});

describe("MistakeUpdateInput", () => {
  it("accepts a status-only change", () => {
    expect(
      MistakeUpdateInput.safeParse({ id: ENTRY, status: "mastered" }).success,
    ).toBe(true);
  });

  it("allows clearing the homework link with null", () => {
    expect(
      MistakeUpdateInput.safeParse({ id: ENTRY, homeworkSubmissionId: null })
        .success,
    ).toBe(true);
  });

  it("rejects an unknown status", () => {
    expect(
      MistakeUpdateInput.safeParse({ id: ENTRY, status: "approved" }).success,
    ).toBe(false);
  });
});
