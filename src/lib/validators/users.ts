import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email().max(320),
  phone: z.string().max(20).optional(),
  name: z.string().max(200).optional(),
  displayName: z.string().max(200).optional(),
  role: z.enum(["ADMIN", "SECRETARY", "MEMBER"]).default("MEMBER"),
  provider: z.enum(["LOCAL", "AZURE_AD", "LDAP"]).default("LOCAL"),
  externalId: z.string().max(500).optional(),
  passwordHash: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().max(200).nullable().optional(),
  displayName: z.string().max(200).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  role: z.enum(["ADMIN", "SECRETARY", "MEMBER"]).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

export const assignRoleSchema = z.object({
  roleId: z.string().uuid(),
  scopeType: z.enum(["ORGANIZATION", "COMMITTEE", "MEETING"]),
  scopeId: z.string().uuid().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
