import { describe, it, expect } from "vitest";
import {
  StudentCreateInput,
  TaskCreateInput,
  TaskAssignInput,
  MissionCompleteInput,
  MissionUncompleteInput,
  TrackCreateInput,
  SubjectDeleteInput,
  TrackDeleteInput,
  SetSubjectPriorityInput,
  SetTrackPriorityInput,
  ScheduleBlockCreateInput,
  ScheduleBlockUpdateInput,
  CompleteScheduledInput,
  MissionSetReflectionInput,
  WeeklyGoalCreateInput,
  WeeklyGoalUpdateInput,
  WeeklyGoalIncrementInput,
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
  it("accepts a title and trims it", () => {
    const r = TaskCreateInput.parse({ title: "  Read a chapter  " });
    expect(r.title).toBe("Read a chapter");
  });

  it("rejects a non-uuid subjectId", () => {
    expect(
      TaskCreateInput.safeParse({ title: "x", subjectId: "nope" }).success,
    ).toBe(false);
  });

  it("accepts an optional subjectTrackId and rejects a non-uuid one", () => {
    expect(
      TaskCreateInput.safeParse({ title: "x", subjectTrackId: UUID }).success,
    ).toBe(true);
    expect(
      TaskCreateInput.safeParse({ title: "x", subjectTrackId: "nope" }).success,
    ).toBe(false);
  });
});

describe("SubjectDeleteInput / TrackDeleteInput", () => {
  it("accept a uuid id", () => {
    expect(SubjectDeleteInput.safeParse({ id: UUID }).success).toBe(true);
    expect(TrackDeleteInput.safeParse({ id: UUID }).success).toBe(true);
  });

  it("reject a non-uuid or missing id", () => {
    expect(SubjectDeleteInput.safeParse({ id: "nope" }).success).toBe(false);
    expect(TrackDeleteInput.safeParse({}).success).toBe(false);
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

describe("MissionUncompleteInput", () => {
  it("requires a uuid missionId", () => {
    expect(MissionUncompleteInput.safeParse({ missionId: "x" }).success).toBe(
      false,
    );
    expect(MissionUncompleteInput.safeParse({}).success).toBe(false);
    expect(MissionUncompleteInput.safeParse({ missionId: UUID }).success).toBe(
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

  it("accepts an estimatedMinutes target and rejects out-of-range", () => {
    expect(
      ScheduleBlockCreateInput.safeParse({
        studentId: UUID,
        title: "Class",
        estimatedMinutes: 90,
      }).success,
    ).toBe(true);
    expect(
      ScheduleBlockCreateInput.safeParse({
        studentId: UUID,
        title: "Class",
        estimatedMinutes: 601,
      }).success,
    ).toBe(false);
    expect(
      ScheduleBlockCreateInput.safeParse({
        studentId: UUID,
        title: "Class",
        estimatedMinutes: -30,
      }).success,
    ).toBe(false);
  });
});

describe("ScheduleBlockUpdateInput", () => {
  it("accepts a nullable estimatedMinutes (clearing) and a value", () => {
    expect(
      ScheduleBlockUpdateInput.safeParse({ id: UUID, estimatedMinutes: null })
        .success,
    ).toBe(true);
    expect(
      ScheduleBlockUpdateInput.safeParse({ id: UUID, estimatedMinutes: 120 })
        .success,
    ).toBe(true);
  });

  it("rejects an over-range estimatedMinutes", () => {
    expect(
      ScheduleBlockUpdateInput.safeParse({ id: UUID, estimatedMinutes: 999 })
        .success,
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

describe("MissionSetReflectionInput", () => {
  it("accepts a persisted mission by id", () => {
    expect(
      MissionSetReflectionInput.safeParse({
        missionId: UUID,
        reflection: "Finished all the fractions.",
      }).success,
    ).toBe(true);
  });

  it("accepts a scheduled block via studentId + scheduleBlockId + date", () => {
    expect(
      MissionSetReflectionInput.safeParse({
        studentId: UUID,
        scheduleBlockId: UUID,
        date: "2026-06-14",
        reflection: "Got stuck on recursion.",
      }).success,
    ).toBe(true);
  });

  it("allows clearing the note with null", () => {
    expect(
      MissionSetReflectionInput.safeParse({
        missionId: UUID,
        reflection: null,
      }).success,
    ).toBe(true);
  });

  it("rejects when neither identifier path is provided", () => {
    expect(
      MissionSetReflectionInput.safeParse({ reflection: "orphan" }).success,
    ).toBe(false);
  });

  it("rejects an incomplete block trio", () => {
    expect(
      MissionSetReflectionInput.safeParse({
        studentId: UUID,
        scheduleBlockId: UUID,
        reflection: "missing date",
      }).success,
    ).toBe(false);
  });

  it("rejects reflections over the max length", () => {
    expect(
      MissionSetReflectionInput.safeParse({
        missionId: UUID,
        reflection: "x".repeat(2001),
      }).success,
    ).toBe(false);
  });
});

describe("WeeklyGoalCreateInput", () => {
  it("requires uuid studentId, title, and an ISO weekStartDate", () => {
    expect(
      WeeklyGoalCreateInput.safeParse({
        studentId: UUID,
        title: "Solve 50 problems",
        weekStartDate: "2026-06-01",
      }).success,
    ).toBe(true);
    expect(
      WeeklyGoalCreateInput.safeParse({
        studentId: "x",
        title: "Solve 50 problems",
        weekStartDate: "2026-06-01",
      }).success,
    ).toBe(false);
    expect(
      WeeklyGoalCreateInput.safeParse({
        studentId: UUID,
        title: "  ",
        weekStartDate: "2026-06-01",
      }).success,
    ).toBe(false);
    expect(
      WeeklyGoalCreateInput.safeParse({
        studentId: UUID,
        title: "x",
        weekStartDate: "06/01/2026",
      }).success,
    ).toBe(false);
  });

  it("rejects a negative targetValue", () => {
    expect(
      WeeklyGoalCreateInput.safeParse({
        studentId: UUID,
        title: "x",
        weekStartDate: "2026-06-01",
        targetValue: -1,
      }).success,
    ).toBe(false);
  });
});

describe("WeeklyGoalIncrementInput", () => {
  it("requires a uuid id and a numeric delta", () => {
    expect(
      WeeklyGoalIncrementInput.safeParse({ id: UUID, delta: 5 }).success,
    ).toBe(true);
    expect(
      WeeklyGoalIncrementInput.safeParse({ id: UUID, delta: -3 }).success,
    ).toBe(true);
    expect(
      WeeklyGoalIncrementInput.safeParse({ id: "x", delta: 5 }).success,
    ).toBe(false);
    expect(
      WeeklyGoalIncrementInput.safeParse({ id: UUID, delta: "5" }).success,
    ).toBe(false);
  });
});

describe("WeeklyGoalUpdateInput", () => {
  it("rejects an unknown status", () => {
    expect(
      WeeklyGoalUpdateInput.safeParse({ id: UUID, status: "done" }).success,
    ).toBe(false);
    expect(
      WeeklyGoalUpdateInput.safeParse({ id: UUID, status: "completed" }).success,
    ).toBe(true);
  });
});
