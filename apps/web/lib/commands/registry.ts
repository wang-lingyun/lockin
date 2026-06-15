import {
  COMMANDS,
  StudentCreateInput,
  TaskCreateInput,
  TaskAssignInput,
  MissionCompleteInput,
  SubjectCreateInput,
  TrackCreateInput,
  SetSubjectPriorityInput,
  SetTrackPriorityInput,
  ScheduleBlockCreateInput,
  ScheduleBlockUpdateInput,
  ScheduleBlockDeleteInput,
  CompleteScheduledInput,
  WeeklyGoalCreateInput,
  WeeklyGoalUpdateInput,
  WeeklyGoalDeleteInput,
  WeeklyGoalIncrementInput,
  type CommandName,
} from "@lockin/shared";
import type { CommandDefinition } from "./types";
import {
  studentCreate,
  taskCreate,
  taskAssign,
  missionComplete,
  subjectCreate,
  trackCreate,
  studentSetSubjectPriority,
  studentSetTrackPriority,
  scheduleBlockCreate,
  scheduleBlockUpdate,
  scheduleBlockDelete,
  missionCompleteScheduled,
  weeklyGoalCreate,
  weeklyGoalUpdate,
  weeklyGoalDelete,
  weeklyGoalIncrement,
} from "./handlers";

type AnyHandler = CommandDefinition<unknown, unknown>["handler"];

/**
 * The command registry: the complete set of admin actions, each pairing a
 * shared input schema with its handler. Adding a command here exposes it to
 * both the UI and (later) the agent gateway at once.
 */
export const REGISTRY: Record<CommandName, CommandDefinition<unknown, unknown>> = {
  [COMMANDS.studentCreate]: {
    schema: StudentCreateInput,
    handler: studentCreate as AnyHandler,
  },
  [COMMANDS.taskCreate]: {
    schema: TaskCreateInput,
    handler: taskCreate as AnyHandler,
  },
  [COMMANDS.taskAssign]: {
    schema: TaskAssignInput,
    handler: taskAssign as AnyHandler,
  },
  [COMMANDS.missionComplete]: {
    schema: MissionCompleteInput,
    handler: missionComplete as AnyHandler,
  },
  [COMMANDS.subjectCreate]: {
    schema: SubjectCreateInput,
    handler: subjectCreate as AnyHandler,
  },
  [COMMANDS.trackCreate]: {
    schema: TrackCreateInput,
    handler: trackCreate as AnyHandler,
  },
  [COMMANDS.studentSetSubjectPriority]: {
    schema: SetSubjectPriorityInput,
    handler: studentSetSubjectPriority as AnyHandler,
  },
  [COMMANDS.studentSetTrackPriority]: {
    schema: SetTrackPriorityInput,
    handler: studentSetTrackPriority as AnyHandler,
  },
  [COMMANDS.scheduleBlockCreate]: {
    schema: ScheduleBlockCreateInput,
    handler: scheduleBlockCreate as AnyHandler,
  },
  [COMMANDS.scheduleBlockUpdate]: {
    schema: ScheduleBlockUpdateInput,
    handler: scheduleBlockUpdate as AnyHandler,
  },
  [COMMANDS.scheduleBlockDelete]: {
    schema: ScheduleBlockDeleteInput,
    handler: scheduleBlockDelete as AnyHandler,
  },
  [COMMANDS.missionCompleteScheduled]: {
    schema: CompleteScheduledInput,
    handler: missionCompleteScheduled as AnyHandler,
  },
  [COMMANDS.weeklyGoalCreate]: {
    schema: WeeklyGoalCreateInput,
    handler: weeklyGoalCreate as AnyHandler,
  },
  [COMMANDS.weeklyGoalUpdate]: {
    schema: WeeklyGoalUpdateInput,
    handler: weeklyGoalUpdate as AnyHandler,
  },
  [COMMANDS.weeklyGoalDelete]: {
    schema: WeeklyGoalDeleteInput,
    handler: weeklyGoalDelete as AnyHandler,
  },
  [COMMANDS.weeklyGoalIncrement]: {
    schema: WeeklyGoalIncrementInput,
    handler: weeklyGoalIncrement as AnyHandler,
  },
};
