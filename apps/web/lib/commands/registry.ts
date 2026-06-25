import {
  COMMANDS,
  StudentCreateInput,
  TaskCreateInput,
  TaskUpdateInput,
  TaskDeleteInput,
  TaskAssignInput,
  MissionCompleteInput,
  MissionUncompleteInput,
  MissionDeleteInput,
  SubjectCreateInput,
  SubjectUpdateInput,
  SubjectDeleteInput,
  TrackCreateInput,
  TrackUpdateInput,
  TrackDeleteInput,
  SetSubjectPriorityInput,
  SetTrackPriorityInput,
  ScheduleBlockCreateInput,
  ScheduleBlockUpdateInput,
  ScheduleBlockDeleteInput,
  CompleteScheduledInput,
  MissionSetReflectionInput,
  WeeklyGoalCreateInput,
  WeeklyGoalUpdateInput,
  WeeklyGoalDeleteInput,
  WeeklyGoalIncrementInput,
  HomeworkSubmitInput,
  HomeworkReviewInput,
  MistakeCreateInput,
  MistakeUpdateInput,
  MistakeDeleteInput,
  ReflectionCreateInput,
  ReflectionUpdateInput,
  CodingProjectCreateInput,
  CodingProjectUpdateInput,
  CodingProjectDeleteInput,
  CodingFeatureCreateInput,
  CodingFeatureUpdateInput,
  CodingFeatureDeleteInput,
  CodingFeatureSetStatusInput,
  type CommandName,
} from "@lockin/shared";
import type { CommandDefinition } from "./types";
import {
  studentCreate,
  taskCreate,
  taskUpdate,
  taskDelete,
  taskAssign,
  missionComplete,
  missionUncomplete,
  missionDelete,
  subjectCreate,
  subjectUpdate,
  subjectDelete,
  trackCreate,
  trackUpdate,
  trackDelete,
  studentSetSubjectPriority,
  studentSetTrackPriority,
  scheduleBlockCreate,
  scheduleBlockUpdate,
  scheduleBlockDelete,
  missionCompleteScheduled,
  missionSetReflection,
  weeklyGoalCreate,
  weeklyGoalUpdate,
  weeklyGoalDelete,
  weeklyGoalIncrement,
  homeworkSubmit,
  homeworkReview,
  mistakeCreate,
  mistakeUpdate,
  mistakeDelete,
  reflectionCreate,
  reflectionUpdate,
  codingProjectCreate,
  codingProjectUpdate,
  codingProjectDelete,
  codingFeatureCreate,
  codingFeatureUpdate,
  codingFeatureDelete,
  codingFeatureSetStatus,
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
  [COMMANDS.taskUpdate]: {
    schema: TaskUpdateInput,
    handler: taskUpdate as AnyHandler,
  },
  [COMMANDS.taskDelete]: {
    schema: TaskDeleteInput,
    handler: taskDelete as AnyHandler,
  },
  [COMMANDS.taskAssign]: {
    schema: TaskAssignInput,
    handler: taskAssign as AnyHandler,
  },
  [COMMANDS.missionComplete]: {
    schema: MissionCompleteInput,
    handler: missionComplete as AnyHandler,
  },
  [COMMANDS.missionUncomplete]: {
    schema: MissionUncompleteInput,
    handler: missionUncomplete as AnyHandler,
  },
  [COMMANDS.missionDelete]: {
    schema: MissionDeleteInput,
    handler: missionDelete as AnyHandler,
  },
  [COMMANDS.subjectCreate]: {
    schema: SubjectCreateInput,
    handler: subjectCreate as AnyHandler,
  },
  [COMMANDS.subjectUpdate]: {
    schema: SubjectUpdateInput,
    handler: subjectUpdate as AnyHandler,
  },
  [COMMANDS.subjectDelete]: {
    schema: SubjectDeleteInput,
    handler: subjectDelete as AnyHandler,
  },
  [COMMANDS.trackCreate]: {
    schema: TrackCreateInput,
    handler: trackCreate as AnyHandler,
  },
  [COMMANDS.trackUpdate]: {
    schema: TrackUpdateInput,
    handler: trackUpdate as AnyHandler,
  },
  [COMMANDS.trackDelete]: {
    schema: TrackDeleteInput,
    handler: trackDelete as AnyHandler,
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
  [COMMANDS.missionSetReflection]: {
    schema: MissionSetReflectionInput,
    handler: missionSetReflection as AnyHandler,
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
  [COMMANDS.homeworkSubmit]: {
    schema: HomeworkSubmitInput,
    handler: homeworkSubmit as AnyHandler,
  },
  [COMMANDS.homeworkReview]: {
    schema: HomeworkReviewInput,
    handler: homeworkReview as AnyHandler,
  },
  [COMMANDS.mistakeCreate]: {
    schema: MistakeCreateInput,
    handler: mistakeCreate as AnyHandler,
  },
  [COMMANDS.mistakeUpdate]: {
    schema: MistakeUpdateInput,
    handler: mistakeUpdate as AnyHandler,
  },
  [COMMANDS.mistakeDelete]: {
    schema: MistakeDeleteInput,
    handler: mistakeDelete as AnyHandler,
  },
  [COMMANDS.reflectionCreate]: {
    schema: ReflectionCreateInput,
    handler: reflectionCreate as AnyHandler,
  },
  [COMMANDS.reflectionUpdate]: {
    schema: ReflectionUpdateInput,
    handler: reflectionUpdate as AnyHandler,
  },
  [COMMANDS.codingProjectCreate]: {
    schema: CodingProjectCreateInput,
    handler: codingProjectCreate as AnyHandler,
  },
  [COMMANDS.codingProjectUpdate]: {
    schema: CodingProjectUpdateInput,
    handler: codingProjectUpdate as AnyHandler,
  },
  [COMMANDS.codingProjectDelete]: {
    schema: CodingProjectDeleteInput,
    handler: codingProjectDelete as AnyHandler,
  },
  [COMMANDS.codingFeatureCreate]: {
    schema: CodingFeatureCreateInput,
    handler: codingFeatureCreate as AnyHandler,
  },
  [COMMANDS.codingFeatureUpdate]: {
    schema: CodingFeatureUpdateInput,
    handler: codingFeatureUpdate as AnyHandler,
  },
  [COMMANDS.codingFeatureDelete]: {
    schema: CodingFeatureDeleteInput,
    handler: codingFeatureDelete as AnyHandler,
  },
  [COMMANDS.codingFeatureSetStatus]: {
    schema: CodingFeatureSetStatusInput,
    handler: codingFeatureSetStatus as AnyHandler,
  },
};
