import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/permissions";
import { updateCommitteeSchema } from "@/lib/validators/committees";
import { db } from "@/lib/db";
import { emitEvent } from "@/lib/events";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "committee:read", { entityType: "committee", entityId: id, ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const committee = await db.committee.findFirst({
    where: { id, orgId: session.user.orgId, deletedAt: null },
    include: {
      chair: { select: { id: true, name: true, displayName: true } },
      members: { include: { user: { select: { id: true, name: true, displayName: true, email: true } } } },
      recurrenceRule: true,
    },
  });

  if (!committee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(committee);
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "committee:update", { entityType: "committee", entityId: id, ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const body = await req.json();
  const parsed = updateCommitteeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });
  }

  const committee = await db.committee.updateMany({
    where: { id, orgId: session.user.orgId, deletedAt: null },
    data: parsed.data,
  });

  if (committee.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.committee.findUnique({ where: { id } });
  await emitEvent({ orgId: session.user.orgId, type: "committee.updated", entityId: id, payload: parsed.data });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "committee:delete", { entityType: "committee", entityId: id, ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const result = await db.committee.updateMany({
    where: { id, orgId: session.user.orgId, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await emitEvent({ orgId: session.user.orgId, type: "committee.deleted", entityId: id, payload: {} });
  return NextResponse.json({ success: true });
}
