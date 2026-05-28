import { db } from "@/lib/db";

// ── Capability → internal action mapping ─────────────────────────────────────
// Business capabilities stored on Role.permissions map to granular actions
// used by API route permission checks.

const CAPABILITY_TO_ACTIONS: Record<string, string[]> = {
  // Documents
  view_documents:                ["document:list", "document:read"],
  upload_documents:              ["document:upload"],
  delete_documents:              ["document:delete"],
  access_confidential_documents: ["document:list", "document:read"],
  // Meetings
  create_meetings:    ["meeting:create"],
  manage_meetings:    ["meeting:update", "meeting:delete", "meeting:transition_status"],
  manage_participants:["meeting:update"],
  manage_agenda:      ["meeting:update_minutes"],
  present_topics:     ["meeting:read"],
  approve_protocol:   ["meeting:update_minutes", "decision:approve"],
  // Decisions & Voting
  manage_decisions: ["decision:create", "decision:update", "decision:delete", "decision:transition_status", "decision:archive"],
  vote_on_decisions:["decision:create"],
  approve_decisions:["decision:approve", "decision:reject"],
  // Tasks
  manage_tasks: ["task:create", "task:update_status", "task:delete"],
  assign_tasks: ["task:assign"],
  // Committees
  view_committees:         ["committee:list", "committee:read"],
  manage_committees:       ["committee:create", "committee:update", "committee:delete"],
  manage_committee_members:["committee:manage_members"],
  // Users & Roles
  manage_users: ["user:list", "user:read", "user:create", "user:update", "user:delete"],
  manage_roles: ["role:list", "role:create", "role:assign"],
  // Organization
  view_reports:         ["org:read"],
  manage_organization:  ["org:read", "org:update"],
  run_sync:             ["sync:run"],
};

// Actions implicitly granted to every authenticated active user
const IMPLICIT_ACTIONS = new Set([
  "committee:list", "committee:read",
  "meeting:list",   "meeting:read",
  "decision:list",  "decision:read",
  "task:list",      "task:read",
  "document:list",  "document:read",
  "org:read",
]);

export class PermissionDeniedError extends Error {
  readonly statusCode = 403;
  constructor(action: string) {
    super(`Permission denied: ${action}`);
    this.name = "PermissionDeniedError";
  }
}

/**
 * Checks whether a user holds a capability that covers the given internal action.
 * Writes an audit entry to permission_logs for every check.
 */
export async function requirePermission(
  userId: string,
  action: string,
  opts: { entityType: string; entityId?: string; ip?: string } = { entityType: "unknown" },
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { status: true, role: true },
  });

  if (!user || user.status !== "ACTIVE") {
    await writeLog(userId, action, opts, false, "user_inactive_or_not_found");
    throw new PermissionDeniedError(action);
  }

  // System ADMIN always granted
  if (user.role === "ADMIN") {
    await writeLog(userId, action, opts, true, "admin_role");
    return;
  }

  // Implicit read-only actions granted to all active users
  if (IMPLICIT_ACTIONS.has(action)) {
    await writeLog(userId, action, opts, true, "implicit_grant");
    return;
  }

  // RBAC: check if any role assignment covers this action via capability mapping
  const assignments = await db.userRoleAssignment.findMany({
    where: { userId },
    include: { role: { select: { permissions: true } } },
  });

  const granted = assignments.some((a) =>
    a.role.permissions.some(
      (cap) => (CAPABILITY_TO_ACTIONS[cap] ?? []).includes(action),
    ),
  );

  await writeLog(userId, action, opts, granted, granted ? "capability_grant" : "no_permission");

  if (!granted) throw new PermissionDeniedError(action);
}

async function writeLog(
  userId: string,
  action: string,
  opts: { entityType: string; entityId?: string; ip?: string },
  granted: boolean,
  reason: string,
) {
  try {
    await db.permissionLog.create({
      data: { userId, action, entityType: opts.entityType, entityId: opts.entityId, granted, reason, ip: opts.ip },
    });
  } catch {
    // Audit log failure must never block business logic
  }
}

// ── Legacy flat-role helpers (kept for role-gate.tsx client component) ────────

export type Permission =
  | "committee.create" | "committee.edit" | "committee.delete"
  | "meeting.create" | "meeting.edit" | "meeting.manage_status"
  | "decision.create" | "decision.edit"
  | "org.manage" | "org.manage_roles"
  | "report.view" | "settings.manage";

import type { UserRole } from "@prisma/client";

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
  MEMBER: ["report.view"],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
