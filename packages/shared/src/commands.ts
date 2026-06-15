/**
 * Canonical command names. One identifier per admin action, shared by the UI
 * dispatch path and the agent gateway so logs/audit (`admin_command_log`) line
 * up across channels (ADR 0007).
 */
export const COMMANDS = {
  studentCreate: "student.create",
  taskCreate: "task.create",
  taskAssign: "task.assign",
  missionComplete: "mission.complete",
} as const;

export type CommandName = (typeof COMMANDS)[keyof typeof COMMANDS];
