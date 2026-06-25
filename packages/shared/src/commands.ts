/**
 * Canonical command names. One identifier per admin action, shared by the UI
 * dispatch path and the agent gateway so logs/audit (`admin_command_log`) line
 * up across channels (ADR 0007).
 */
export const COMMANDS = {
  studentCreate: "student.create",
  taskCreate: "task.create",
  taskUpdate: "task.update",
  taskDelete: "task.delete",
  taskAssign: "task.assign",
  missionComplete: "mission.complete",
  subjectCreate: "subject.create",
  subjectUpdate: "subject.update",
  subjectDelete: "subject.delete",
  trackCreate: "track.create",
  trackUpdate: "track.update",
  trackDelete: "track.delete",
  studentSetSubjectPriority: "student.setSubjectPriority",
  studentSetTrackPriority: "student.setTrackPriority",
  scheduleBlockCreate: "schedule.block.create",
  scheduleBlockUpdate: "schedule.block.update",
  scheduleBlockDelete: "schedule.block.delete",
  missionCompleteScheduled: "mission.completeScheduled",
  missionUncomplete: "mission.uncomplete",
  missionDelete: "mission.delete",
  missionSetReflection: "mission.setReflection",
  weeklyGoalCreate: "weeklyGoal.create",
  weeklyGoalUpdate: "weeklyGoal.update",
  weeklyGoalDelete: "weeklyGoal.delete",
  weeklyGoalIncrement: "weeklyGoal.incrementProgress",
  homeworkSubmit: "homework.submit",
  homeworkReview: "homework.review",
  mistakeCreate: "mistake.create",
  mistakeUpdate: "mistake.update",
  mistakeDelete: "mistake.delete",
  reflectionCreate: "reflection.create",
  reflectionUpdate: "reflection.update",
  codingProjectCreate: "coding.project.create",
  codingProjectUpdate: "coding.project.update",
  codingProjectDelete: "coding.project.delete",
  codingFeatureCreate: "coding.feature.create",
  codingFeatureUpdate: "coding.feature.update",
  codingFeatureDelete: "coding.feature.delete",
  codingFeatureSetStatus: "coding.feature.setStatus",
} as const;

export type CommandName = (typeof COMMANDS)[keyof typeof COMMANDS];
