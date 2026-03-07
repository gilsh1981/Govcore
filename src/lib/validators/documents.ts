import { z } from "zod";

export const createDocumentSchema = z.object({
  meetingId: z.string().uuid().optional(),
  name: z.string().min(1).max(500),
  mimeType: z.string().max(200),
  storageKey: z.string().min(1).max(1000),
  sizeBytes: z.number().int().positive().optional(),
  visibility: z.enum(["ORGANIZATION", "COMMITTEE", "MEETING", "PRIVATE"]).default("ORGANIZATION"),
  isVoiceRecord: z.boolean().default(false),
});

export const updateDocumentSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  visibility: z.enum(["ORGANIZATION", "COMMITTEE", "MEETING", "PRIVATE"]).optional(),
});

export const listDocumentsSchema = z.object({
  meetingId: z.string().uuid().optional(),
  isVoiceRecord: z.boolean().optional(),
  visibility: z.enum(["ORGANIZATION", "COMMITTEE", "MEETING", "PRIVATE"]).optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
