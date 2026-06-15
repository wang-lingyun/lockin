import { describe, it, expect } from "vitest";
import {
  StudentCreateInput,
  TaskCreateInput,
  TaskAssignInput,
  MissionCompleteInput,
  TrackCreateInput,
  SetSubjectPriorityInput,
  SetTrackPriorityInput,
  ScheduleBlockCreateInput,
  CompleteScheduledInput,
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

describe("TrackCreateInput", () => {
  it("requires a uuid subjectId and trims the name", () => {
    const r = TrackCreateInput.parse({ subjectId: UUID, name: "  HMA  " });
    expect(r.name).toBe("HMA");
  });

  it("rejects an empty name or non-uuid subject", () => {
    expect(
      TrackCreateInput.safeParse({ subjectId: UUID, name: "  " }).success,
    ).toBe(false);
    expect(
      TrackCreateInput.safeParse({ subjectId: "nope", name: "HMA" }).success,
    ).toBe(false);
  });
});

describe("priority inputs", () => {
  it("accepts the three priority values", () => {
    for (const priority of ["primary", "bonus", "inactive"] as const) {
      expect(
        SetSubjectPriorityInput.safeParse({
          studentId: UUID,
          subjectId: UUID,
          priority,
        }).success,
      ).toBe(true);
    }
  });

  it("rejects an unknown priority value", () => {
    expect(
      SetSubjectPriorityInput.safeParse({
        studentId: UUID,
        subjectId: UUID,
        priority: "core",
      }).success,
    ).toBe(false);
  });

  it("SetTrackPriorityInput requires a uuid subjectTrackId", () => {
    expect(
      SetTrackPriorityInput.safeParse({
        studentId: UUID,
        subjectTrackId: "x",
        priority: "primary",
      }).success,
    ).toBe(false);
  });
});

describe("ScheduleBlockCreateInput", () => {
  it("requires a uuid studentId and a title", () => {
    expect(
      ScheduleBlockCreateInput.safeParse({ studentId: UUID, title: "Math" })
        .success,
    ).toBe(true);
    expect(
      ScheduleBlockCreateInput.safeParse({ studentId: "x", title: "Math" })
        .success,
    ).toBe(false);
    expect(
      ScheduleBlockCreateInput.safeParse({ studentId: UUID, title: "  " })
        .success,
    ).toBe(false);
  });

  it("accepts ISO datetimes with offset and an RRULE string", () => {
    const r = ScheduleBlockCreateInput.parse({
      studentId: UUID,
      title: "Class",
      startAt: "2026-06-01T16:00:00.000Z",
      endAt: "2026-06-01T17:00:00.000Z",
      recurrenceRule: "FREQ=WEEKLY;BYDAY=MO,WE,FR",
    });
    expect(r.recurrenceRule).toContain("FREQ=WEEKLY");
  });

  it("rejects a non-datetime startAt", () => {
    expect(
      ScheduleBlockCreateInput.safeParse({
        studentId: UUID,
        title: "Class",
        startAt: "2026-06-01",
      }).success,
    ).toBe(false);
  });
});

describe("CompleteScheduledInput", () => {
  it("validates ids and the date format", () => {
    expect(
      CompleteScheduledInput.safeParse({
        studentId: UUID,
        scheduleBlockId: UUID,
        date: "2026-06-14",
      }).success,
    ).toBe(true);
    expect(
      CompleteScheduledInput.safeParse({
        studentId: UUID,
        scheduleBlockId: UUID,
        date: "06/14/2026",
      }).success,
    ).toBe(false);
  });
});
