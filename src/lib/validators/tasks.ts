import { z } from "zod";

export const createTaskSchema = z.object({
  meetingId: z.string().uuid().optional(),
  decisionId: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  assignedToId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).nullable().optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
});

export const transitionTaskSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED"]),
});

export const TASK_TRANSITIONS: Record<string, string[]> = {
  OPEN: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "BLOCKED"],
  BLOCKED: ["IN_PROGRESS"],
  COMPLETED: [],
  CANCELLED: [],
};

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TransitionTaskInput = z.infer<typeof transitionTaskSchema>;
