import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/permissions";
import { db } from "@/lib/db";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const assignSchema = z.object({
  userId: z.string().uuid(),
  scopeType: z.enum(["ORGANIZATION", "COMMITTEE", "MEETING", "EVENT"]),
  scopeId: z.string().uuid().optional(),
});

const removeSchema = z.object({
  userId: z.string().uuid(),
  scopeId: z.string().uuid().optional().nullable(),
});

/** POST /api/roles/[id]/assign — assign this role to a user in a scope */
export async function POST(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: roleId } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "role:assign", { entityType: "role", entityId: roleId, ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  // Verify role belongs to this org
  const role = await db.role.findFirst({ where: { id: roleId, orgId: session.user.orgId } });
  if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });

  const body = await req.json();
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });

  // Verify target user belongs to this org
  const targetUser = await db.user.findFirst({
    where: { id: parsed.data.userId, orgId: session.user.orgId, deletedAt: null },
  });
  if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const scopeId = parsed.data.scopeId ?? null;
  const assignment = await db.userRoleAssignment.upsert({
    where: {
      userId_roleId_scopeId: {
        userId: parsed.data.userId,
        roleId,
        scopeId: scopeId as string,
      },
    },
    create: {
      userId: parsed.data.userId,
      roleId,
      scopeType: parsed.data.scopeType as never,
      scopeId,
      assignedBy: session.user.id,
    },
    update: {
      scopeType: parsed.data.scopeType as never,
      assignedBy: session.user.id,
    },
  });

  return NextResponse.json(assignment, { status: 201 });
}

/** DELETE /api/roles/[id]/assign — remove a role assignment from a user */
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: roleId } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "role:assign", { entityType: "role", entityId: roleId, ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const body = await req.json();
  const parsed = removeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });

  const result = await db.userRoleAssignment.deleteMany({
    where: {
      userId: parsed.data.userId,
      roleId,
      scopeId: parsed.data.scopeId ?? null,
    },
  });

  if (result.count === 0) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
