import { describe, it, expect } from "vitest";
import { SubjectUpdateInput, TrackUpdateInput } from "@lockin/shared";

const SUBJECT = "11111111-1111-1111-1111-111111111111";
const TRACK = "22222222-2222-2222-2222-222222222222";

describe("SubjectUpdateInput", () => {
  it("accepts a rename and trims the name", () => {
    const r = SubjectUpdateInput.safeParse({ id: SUBJECT, name: "  Math  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe("Math");
  });

  it("requires a valid uuid id", () => {
    expect(SubjectUpdateInput.safeParse({ id: "nope", name: "Math" }).success).toBe(
      false,
    );
  });

  it("allows a bare id with no fields (no-op patch)", () => {
    expect(SubjectUpdateInput.safeParse({ id: SUBJECT }).success).toBe(true);
  });

  it("allows clearing nullable fields (description/icon/color)", () => {
    const r = SubjectUpdateInput.safeParse({
      id: SUBJECT,
      description: null,
      icon: null,
      color: null,
    });
    expect(r.success).toBe(true);
  });

  it("rejects an over-long name", () => {
    expect(
      SubjectUpdateInput.safeParse({ id: SUBJECT, name: "x".repeat(61) }).success,
    ).toBe(false);
  });
});

describe("TrackUpdateInput", () => {
  it("accepts a rename", () => {
    const r = TrackUpdateInput.safeParse({ id: TRACK, name: "AoPS" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe("AoPS");
  });

  it("accepts an isActive toggle on its own", () => {
    const r = TrackUpdateInput.safeParse({ id: TRACK, isActive: false });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.isActive).toBe(false);
  });

  it("accepts a sortOrder within range and rejects out-of-range", () => {
    expect(TrackUpdateInput.safeParse({ id: TRACK, sortOrder: 5 }).success).toBe(
      true,
    );
    expect(TrackUpdateInput.safeParse({ id: TRACK, sortOrder: -1 }).success).toBe(
      false,
    );
    expect(
      TrackUpdateInput.safeParse({ id: TRACK, sortOrder: 1.5 }).success,
    ).toBe(false);
  });

  it("requires a valid uuid id", () => {
    expect(TrackUpdateInput.safeParse({ id: "nope" }).success).toBe(false);
  });
});
