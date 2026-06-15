import {
  COMMANDS,
  StudentCreateInput,
  TaskCreateInput,
  TaskAssignInput,
  MissionCompleteInput,
  type CommandName,
} from "@lockin/shared";
import type { CommandDefinition } from "./types";
import {
  studentCreate,
  taskCreate,
  taskAssign,
  missionComplete,
} from "./handlers";

/**
 * The command registry: the complete set of admin actions, each pairing a
 * shared input schema with its handler. Adding a command here exposes it to
 * both the UI and (later) the agent gateway at once.
 */
export const REGISTRY: Record<CommandName, CommandDefinition<unknown, unknown>> = {
  [COMMANDS.studentCreate]: {
    schema: StudentCreateInput,
    handler: studentCreate as CommandDefinition<unknown, unknown>["handler"],
  },
  [COMMANDS.taskCreate]: {
    schema: TaskCreateInput,
    handler: taskCreate as CommandDefinition<unknown, unknown>["handler"],
  },
  [COMMANDS.taskAssign]: {
    schema: TaskAssignInput,
    handler: taskAssign as CommandDefinition<unknown, unknown>["handler"],
  },
  [COMMANDS.missionComplete]: {
    schema: MissionCompleteInput,
    handler: missionComplete as CommandDefinition<unknown, unknown>["handler"],
  },
};
