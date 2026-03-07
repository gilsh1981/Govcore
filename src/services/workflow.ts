import { db } from "@/lib/db";
import { DECISION_TRANSITIONS } from "@/lib/validators/decisions";
import { TASK_TRANSITIONS } from "@/lib/validators/tasks";

const MEETING_TRANSITIONS: Record<string, string[]> = {
  PLANNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const TRANSITION_MAPS: Record<string, Record<string, string[]>> = {
  decision: DECISION_TRANSITIONS,
  task: TASK_TRANSITIONS,
  meeting: MEETING_TRANSITIONS,
};

export function validateTransition(
  entityType: "decision" | "task" | "meeting",
  fromStatus: string,
  toStatus: string,
): boolean {
  const map = TRANSITION_MAPS[entityType];
  if (!map) return false;
  const allowed = map[fromStatus] ?? [];
  return allowed.includes(toStatus);
}

export async function logStatusTransition(params: {
  entityType: "decision" | "task" | "meeting";
  entityId: string;
  fromStatus: string;
  toStatus: string;
  changedById: string;
}) {
  return db.statusTransition.create({ data: params });
}

export class WorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowError";
  }
}

export class WorkflowPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowPermissionError";
  }
}
