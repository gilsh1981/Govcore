import type { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

// ─── Legacy flat-permission helpers ──────────────────────────────────────────

export type Permission =
  | "committee.create"
  | "committee.edit"
  | "committee.delete"
  | "meeting.create"
  | "meeting.edit"
  | "meeting.manage_status"
  | "decision.create"
  | "decision.edit"
  | "org.manage"
  | "org.manage_roles"
  | "report.view"
  | "settings.manage";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    "committee.create", "committee.edit", "committee.delete",
    "meeting.create", "meeting.edit", "meeting.manage_status",
    "decision.create", "decision.edit",
    "org.manage", "org.manage_roles",
    "report.view", "settings.manage",
  ],
  SECRETARY: [
    "committee.edit",
    "meeting.create", "meeting.edit", "meeting.manage_status",
    "decision.create", "decision.edit",
    "report.view",
  ],
  MEMBER: [
    "report.view",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

// ─── Action-based permission enforcement ─────────────────────────────────────

export class PermissionDeniedError extends Error {
  constructor(action: string) {
    super(`Permission denied: ${action}`);
    this.name = "PermissionDeniedError";
  }
}

// Actions allowed for each flat role
const SECRETARY_ACTIONS = new Set([
  "committee:list", "committee:read", "committee:create", "committee:update",
  "meeting:list", "meeting:read", "meeting:create", "meeting:update",
  "meeting:transition_status", "meeting:update_minutes",
  "decision:list", "decision:read", "decision:create", "decision:update",
  "decision:approve", "decision:reject", "decision:archive",
  "task:list", "task:read", "task:create", "task:assign", "task:update_status",
  "document:list", "document:read", "document:upload",
  "org:read",
]);

const MEMBER_ACTIONS = new Set([
  "committee:list", "committee:read",
  "meeting:list", "meeting:read",
  "decision:list", "decision:read",
  "task:list", "task:read",
  "document:list", "document:read",
  "org:read",
]);

export async function requirePermission(
  userId: string,
  action: string,
  opts: { entityType: string; entityId?: string; ip?: string } = { entityType: "unknown" }
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) throw new PermissionDeniedError(action);

  let granted = false;

  if (user.role === "ADMIN") {
    granted = true;
  } else if (user.role === "SECRETARY") {
    granted = SECRETARY_ACTIONS.has(action);
  } else {
    granted = MEMBER_ACTIONS.has(action);
  }

  // Also check fine-grained UserRoleAssignment
  if (!granted) {
    const assignments = await db.userRoleAssignment.findMany({
      where: { userId },
      include: { role: { select: { permissions: true } } },
    });
    granted = assignments.some((a) => a.role.permissions.includes(action));
  }

  // Audit log (non-critical)
  try {
    await db.permissionLog.create({
      data: { userId, action, entityType: opts.entityType, entityId: opts.entityId, granted, ip: opts.ip },
    });
  } catch {
    // ignore logging failures
  }

  if (!granted) throw new PermissionDeniedError(action);
}
