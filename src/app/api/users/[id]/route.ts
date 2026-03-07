import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/permissions";
import { updateUserSchema, assignRoleSchema } from "@/lib/validators/users";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "user:read", { entityType: "user", entityId: id, ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const user = await db.user.findFirst({
    where: { id, orgId: session.user.orgId, deletedAt: null },
    select: {
      id: true, email: true, phone: true, name: true, displayName: true,
      role: true, status: true, provider: true, createdAt: true,
      roleAssignments: { include: { role: { select: { id: true, name: true, scope: true } } } },
      committeeMemberships: { include: { committee: { select: { id: true, name: true } } } },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "user:update", { entityType: "user", entityId: id, ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const body = await req.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });

  const result = await db.user.updateMany({
    where: { id, orgId: session.user.orgId, deletedAt: null },
    data: parsed.data,
  });
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, displayName: true, role: true, status: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  // Prevent self-delete
  if (id === session.user.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  try {
    await requirePermission(session.user.id, "user:delete", { entityType: "user", entityId: id, ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const result = await db.user.updateMany({
    where: { id, orgId: session.user.orgId, deletedAt: null },
    data: { deletedAt: new Date(), status: "DISABLED" },
  });
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}

/** POST /api/users/:id/roles — assign a role to user */
export async function PUT(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: userId } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "role:assign", { entityType: "user", entityId: userId, ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const body = await req.json();
  const parsed = assignRoleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });

  // Check for existing assignment and update or create
  const existing = await db.userRoleAssignment.findFirst({
    where: { userId, roleId: parsed.data.roleId, scopeId: parsed.data.scopeId ?? null },
  });

  const assignment = existing
    ? await db.userRoleAssignment.update({
        where: { id: existing.id },
        data: { scopeType: parsed.data.scopeType, assignedBy: session.user.id },
      })
    : await db.userRoleAssignment.create({
        data: { userId, roleId: parsed.data.roleId, scopeType: parsed.data.scopeType, scopeId: parsed.data.scopeId, assignedBy: session.user.id },
      });

  return NextResponse.json(assignment, { status: 201 });
}
