import { z } from "zod";

export const DOCUMENT_ENTITY_TYPES = [
  "ORGANIZATION",
  "COMMITTEE",
  "MEETING",
  "EVENT",
  "AGENDA_ITEM",
  "DECISION",
  "TASK",
] as const;

export type DocumentEntityType = (typeof DOCUMENT_ENTITY_TYPES)[number];

export const ACCEPTED_MIME_TYPES = [
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Archives
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  "application/gzip",
  // Text
  "text/plain",
  "text/csv",
] as const;

const documentRelationSchema = z.object({
  entityType: z.enum(DOCUMENT_ENTITY_TYPES),
  entityId: z.string().uuid(),
});

export const createDocumentSchema = z.object({
  name: z.string().min(1).max(500),
  mimeType: z.string().max(200),
  storageKey: z.string().min(1).max(1000),
  sizeBytes: z.number().int().positive().optional(),
  visibility: z.enum(["ORGANIZATION", "COMMITTEE", "MEETING", "PRIVATE"]).default("ORGANIZATION"),
  isVoiceRecord: z.boolean().default(false),
  // Legacy single meeting link (kept for backwards compat)
  meetingId: z.string().uuid().optional(),
  // Multi-entity relations
  relations: z.array(documentRelationSchema).max(20).optional(),
});

export const updateDocumentSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  visibility: z.enum(["ORGANIZATION", "COMMITTEE", "MEETING", "PRIVATE"]).optional(),
  relations: z.array(documentRelationSchema).max(20).optional(),
});

export const listDocumentsSchema = z.object({
  meetingId: z.string().uuid().optional(),
  committeeId: z.string().uuid().optional(),
  decisionId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  isVoiceRecord: z.boolean().optional(),
  visibility: z.enum(["ORGANIZATION", "COMMITTEE", "MEETING", "PRIVATE"]).optional(),
});

export const createUploadSessionSchema = z.object({
  files: z.array(z.object({
    name: z.string().min(1).max(500),
    mimeType: z.string().max(200),
    sizeBytes: z.number().int().positive().optional(),
  })).min(1).max(20),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type CreateUploadSessionInput = z.infer<typeof createUploadSessionSchema>;
