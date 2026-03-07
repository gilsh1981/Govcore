import { db } from "@/lib/db";
import type { Action } from "@/lib/validators/roles";

export interface PermissionContext {
  /** The entity being acted on (e.g. "committee", "meeting", "user") */
  entityType: string;
  /** Optional ID of the specific entity */
  entityId?: string;
  /** IP address of the requestor (for audit trail) */
  ip?: string;
}

/**
 * Check whether a user has permission to perform an action.
 *
 * Fast-path:  ADMIN role on the user row → always granted.
 * Slow-path:  Walk UserRoleAssignment → Role.permissions for granular RBAC.
 *
 * Always writes a PermissionLog row for audit trail.
 */
export async function checkPermission(
  userId: string,
  action: Action,
  ctx: PermissionContext,
): Promise<boolean> {
  // 1. Load user (active check + legacy role)
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { status: true, role: true },
  });

  if (!user || user.status !== "ACTIVE") {
    await writeLog(userId, action, ctx, false, "user_inactive_or_not_found");
    return false;
  }

  // 2. ADMIN fast-path
  if (user.role === "ADMIN") {
    await writeLog(userId, action, ctx, true, "admin_role");
    return true;
  }

  // 3. Granular RBAC: load all role assignments for this user
  const assignments = await db.userRoleAssignment.findMany({
    where: { userId },
    include: { role: { select: { permissions: true } } },
  });

  const granted = assignments.some((a) =>
    a.role.permissions.includes(action as string),
  );

  await writeLog(userId, action, ctx, granted, granted ? "role_permission" : "no_permission");
  return granted;
}

async function writeLog(
  userId: string,
  action: Action,
  ctx: PermissionContext,
  granted: boolean,
  reason: string,
) {
  try {
    await db.permissionLog.create({
      data: {
        userId,
        action: action as string,
        entityType: ctx.entityType,
        entityId: ctx.entityId,
        granted,
        reason,
        ip: ctx.ip,
      },
    });
  } catch {
    // Audit log failure must never block business logic
  }
}

/** Throw a 403-compatible error if permission is denied. */
export async function requirePermission(
  userId: string,
  action: Action,
  ctx: PermissionContext,
): Promise<void> {
  const ok = await checkPermission(userId, action, ctx);
  if (!ok) {
    throw new PermissionDeniedError(action);
  }
}

export class PermissionDeniedError extends Error {
  readonly statusCode = 403;
  constructor(action: Action) {
    super(`Permission denied: ${action}`);
    this.name = "PermissionDeniedError";
  }
}
