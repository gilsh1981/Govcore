import { z } from "zod";

// All known actions used by checkPermission
export const ACTIONS = [
  "committee:list",
  "committee:read",
  "committee:create",
  "committee:update",
  "committee:delete",
  "committee:manage_members",
  "meeting:list",
  "meeting:read",
  "meeting:create",
  "meeting:update",
  "meeting:delete",
  "meeting:transition_status",
  "meeting:update_minutes",
  "decision:list",
  "decision:read",
  "decision:create",
  "decision:update",
  "decision:delete",
  "decision:transition_status",
  "decision:approve",
  "decision:reject",
  "decision:archive",
  "task:list",
  "task:read",
  "task:create",
  "task:assign",
  "task:update_status",
  "task:delete",
  "document:list",
  "document:read",
  "document:upload",
  "document:delete",
  "user:list",
  "user:read",
  "user:create",
  "user:update",
  "user:delete",
  "role:list",
  "role:create",
  "role:assign",
  "sync:run",
  "org:read",
  "org:update",
] as const;

export type Action = (typeof ACTIONS)[number];

export const createRoleSchema = z.object({
  name: z.string().min(2).max(100),
  scope: z.enum(["ORGANIZATION", "COMMITTEE", "MEETING"]),
  permissions: z.array(z.enum(ACTIONS)).min(1),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  permissions: z.array(z.enum(ACTIONS)).optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
