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
};
