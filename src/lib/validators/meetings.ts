import { z } from "zod";

export const createMeetingSchema = z.object({
  committeeId: z.string().uuid().optional(),
  title: z.string().min(2).max(500),
  description: z.string().max(5000).optional(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime().optional(),
  recurrenceRuleId: z.string().uuid().optional(),
});

export const updateMeetingSchema = z.object({
  title: z.string().min(2).max(500).optional(),
  description: z.string().max(5000).nullable().optional(),
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().nullable().optional(),
});

export const transitionStatusSchema = z.object({
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});

export const updateMinutesSchema = z.object({
  minutes: z.record(z.string(), z.unknown()),
});

export const VALID_TRANSITIONS: Record<string, string[]> = {
  PLANNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
export type TransitionStatusInput = z.infer<typeof transitionStatusSchema>;
