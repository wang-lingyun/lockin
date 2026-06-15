import { describe, it, expect } from "vitest";
import {
  StudentCreateInput,
  TaskCreateInput,
  TaskAssignInput,
  MissionCompleteInput,
} from "@lockin/shared";

const UUID = "11111111-1111-1111-1111-111111111111";

describe("StudentCreateInput", () => {
  it("accepts a name and trims it", () => {
    const r = StudentCreateInput.parse({ name: "  Ava  " });
    expect(r.name).toBe("Ava");
  });

  it("rejects an empty name", () => {
    expect(StudentCreateInput.safeParse({ name: "   " }).success).toBe(false);
  });
});

describe("TaskCreateInput", () => {
  it("defaults xpValue to 10", () => {
    const r = TaskCreateInput.parse({ title: "Read a chapter" });
    expect(r.xpValue).toBe(10);
  });

  it("rejects a negative xpValue", () => {
    expect(
      TaskCreateInput.safeParse({ title: "x", xpValue: -5 }).success,
    ).toBe(false);
  });

  it("rejects a non-uuid subjectId", () => {
    expect(
      TaskCreateInput.safeParse({ title: "x", subjectId: "nope" }).success,
    ).toBe(false);
  });
});

describe("TaskAssignInput", () => {
  it("accepts uuids and an ISO date", () => {
    const r = TaskAssignInput.parse({
      taskId: UUID,
      studentId: UUID,
      date: "2026-06-14",
    });
    expect(r.date).toBe("2026-06-14");
  });

  it("rejects a malformed date", () => {
    expect(
      TaskAssignInput.safeParse({
        taskId: UUID,
        studentId: UUID,
        date: "06/14/2026",
      }).success,
    ).toBe(false);
  });
});

describe("MissionCompleteInput", () => {
  it("requires a uuid missionId", () => {
    expect(MissionCompleteInput.safeParse({ missionId: "x" }).success).toBe(
      false,
    );
    expect(MissionCompleteInput.safeParse({ missionId: UUID }).success).toBe(
      true,
    );
  });
});
