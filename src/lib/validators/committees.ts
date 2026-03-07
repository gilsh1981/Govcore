import { z } from "zod";

export const createCommitteeSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  chairUserId: z.string().uuid().optional(),
  recurrenceRuleId: z.string().uuid().optional(),
});

export const updateCommitteeSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  chairUserId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["CHAIR", "SECRETARY", "MEMBER"]).default("MEMBER"),
});

export const createRecurrenceRuleSchema = z.object({
  frequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "YEARLY"]),
  interval: z.number().int().min(1).max(99).default(1),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
  dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  monthOfYear: z.number().int().min(1).max(12).nullable().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
});

export type CreateCommitteeInput = z.infer<typeof createCommitteeSchema>;
export type UpdateCommitteeInput = z.infer<typeof updateCommitteeSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type CreateRecurrenceRuleInput = z.infer<typeof createRecurrenceRuleSchema>;
