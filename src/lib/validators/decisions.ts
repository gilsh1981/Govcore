import { z } from "zod";

export const createDecisionSchema = z.object({
  meetingId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
});

export const updateDecisionSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).nullable().optional(),
});

export const transitionDecisionSchema = z.object({
  status: z.enum(["PROPOSED", "APPROVED", "REJECTED", "ARCHIVED"]),
});

export const DECISION_TRANSITIONS: Record<string, string[]> = {
  PROPOSED: ["APPROVED", "REJECTED"],
  APPROVED: ["ARCHIVED"],
  REJECTED: [],
  ARCHIVED: [],
};

export type CreateDecisionInput = z.infer<typeof createDecisionSchema>;
export type UpdateDecisionInput = z.infer<typeof updateDecisionSchema>;
export type TransitionDecisionInput = z.infer<typeof transitionDecisionSchema>;
