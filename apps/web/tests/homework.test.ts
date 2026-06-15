import { describe, it, expect } from "vitest";
import {
  HomeworkSubmitInput,
  HomeworkReviewInput,
  HOMEWORK_MAX_FILE_BYTES,
  homeworkSourceType,
} from "@lockin/shared";

const STUDENT = "11111111-1111-1111-1111-111111111111";
const SUB = "22222222-2222-2222-2222-222222222222";

const attachment = (over: Record<string, unknown> = {}) => ({
  storagePath: `${STUDENT}/abc-photo.png`,
  mimeType: "image/png",
  sizeBytes: 1024,
  originalName: "photo.png",
  ...over,
});

describe("HomeworkSubmitInput", () => {
  it("accepts a text-only submission", () => {
    const r = HomeworkSubmitInput.safeParse({
      studentId: STUDENT,
      rawText: "  3x + 2 = 11, so x = 3  ",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.rawText).toBe("3x + 2 = 11, so x = 3");
  });

  it("accepts an attachment-only submission", () => {
    expect(
      HomeworkSubmitInput.safeParse({
        studentId: STUDENT,
        attachments: [attachment()],
      }).success,
    ).toBe(true);
  });

  it("rejects an empty submission (no text, no files)", () => {
    expect(
      HomeworkSubmitInput.safeParse({ studentId: STUDENT }).success,
    ).toBe(false);
    expect(
      HomeworkSubmitInput.safeParse({
        studentId: STUDENT,
        rawText: "   ",
        attachments: [],
      }).success,
    ).toBe(false);
  });

  it("rejects a disallowed mime type", () => {
    expect(
      HomeworkSubmitInput.safeParse({
        studentId: STUDENT,
        attachments: [attachment({ mimeType: "image/gif" })],
      }).success,
    ).toBe(false);
  });

  it("rejects an oversize file", () => {
    expect(
      HomeworkSubmitInput.safeParse({
        studentId: STUDENT,
        attachments: [attachment({ sizeBytes: HOMEWORK_MAX_FILE_BYTES + 1 })],
      }).success,
    ).toBe(false);
  });

  it("rejects a non-uuid studentId", () => {
    expect(
      HomeworkSubmitInput.safeParse({
        studentId: "nope",
        rawText: "hi",
      }).success,
    ).toBe(false);
  });
});

describe("HomeworkReviewInput", () => {
  it("accepts a valid status", () => {
    expect(
      HomeworkReviewInput.safeParse({ id: SUB, reviewStatus: "mastered" })
        .success,
    ).toBe(true);
  });

  it("rejects an unknown status", () => {
    expect(
      HomeworkReviewInput.safeParse({ id: SUB, reviewStatus: "approved" })
        .success,
    ).toBe(false);
  });
});

describe("homeworkSourceType", () => {
  it("is text when there are no attachments", () => {
    expect(homeworkSourceType()).toBe("text");
    expect(homeworkSourceType([])).toBe("text");
  });

  it("prefers pdf over image", () => {
    expect(
      homeworkSourceType([
        { mimeType: "image/png" },
        { mimeType: "application/pdf" },
      ]),
    ).toBe("pdf");
  });

  it("is photo when only images are present", () => {
    expect(homeworkSourceType([{ mimeType: "image/jpeg" }])).toBe("photo");
  });
});
