import { describe, it, expect } from "vitest";
import {
  CodingProjectCreateInput,
  CodingProjectUpdateInput,
  CodingFeatureCreateInput,
  CodingFeatureSetStatusInput,
  CODING_FEATURE_XP,
} from "@lockin/shared";

const STUDENT = "11111111-1111-1111-1111-111111111111";
const PROJECT = "22222222-2222-2222-2222-222222222222";
const FEATURE = "33333333-3333-3333-3333-333333333333";

describe("CodingProjectCreateInput", () => {
  it("accepts a project and trims the name", () => {
    const r = CodingProjectCreateInput.safeParse({
      studentId: STUDENT,
      projectName: "  Snake game  ",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.projectName).toBe("Snake game");
  });

  it("requires a project name", () => {
    expect(
      CodingProjectCreateInput.safeParse({ studentId: STUDENT }).success,
    ).toBe(false);
    expect(
      CodingProjectCreateInput.safeParse({
        studentId: STUDENT,
        projectName: "   ",
      }).success,
    ).toBe(false);
  });
});

describe("CodingProjectUpdateInput", () => {
  it("accepts a status change", () => {
    expect(
      CodingProjectUpdateInput.safeParse({ id: PROJECT, status: "completed" })
        .success,
    ).toBe(true);
  });

  it("rejects an unknown status", () => {
    expect(
      CodingProjectUpdateInput.safeParse({ id: PROJECT, status: "done" })
        .success,
    ).toBe(false);
  });

  it("allows clearing the goal with null", () => {
    expect(
      CodingProjectUpdateInput.safeParse({ id: PROJECT, goal: null }).success,
    ).toBe(true);
  });
});

describe("CodingFeatureCreateInput", () => {
  it("requires a title", () => {
    expect(
      CodingFeatureCreateInput.safeParse({ projectId: PROJECT }).success,
    ).toBe(false);
  });

  it("accepts a titled feature", () => {
    expect(
      CodingFeatureCreateInput.safeParse({
        projectId: PROJECT,
        title: "Move the snake",
      }).success,
    ).toBe(true);
  });
});

describe("CodingFeatureSetStatusInput", () => {
  it("accepts a valid status", () => {
    expect(
      CodingFeatureSetStatusInput.safeParse({
        id: FEATURE,
        status: "completed",
      }).success,
    ).toBe(true);
  });

  it("rejects an unknown status", () => {
    expect(
      CodingFeatureSetStatusInput.safeParse({ id: FEATURE, status: "shipped" })
        .success,
    ).toBe(false);
  });
});

describe("CODING_FEATURE_XP", () => {
  it("is 20 (PRD §10.12)", () => {
    expect(CODING_FEATURE_XP).toBe(20);
  });
});
