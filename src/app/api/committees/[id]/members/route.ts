import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/permissions";
import { addMemberSchema } from "@/lib/validators/committees";
import { db } from "@/lib/db";
import { emitEvent } from "@/lib/events";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: committeeId } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "committee:manage_members", { entityType: "committee", entityId: committeeId, ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const committee = await db.committee.findFirst({ where: { id: committeeId, orgId: session.user.orgId, deletedAt: null } });
  if (!committee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });
  }

  const member = await db.committeeMember.upsert({
    where: { committeeId_userId: { committeeId, userId: parsed.data.userId } },
    create: { committeeId, userId: parsed.data.userId, role: parsed.data.role },
    update: { role: parsed.data.role },
  });

  await emitEvent({ orgId: session.user.orgId, type: "committee.member_added", entityId: committeeId, payload: { userId: parsed.data.userId } });

  return NextResponse.json(member, { status: 201 });
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: committeeId } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "committee:manage_members", { entityType: "committee", entityId: committeeId, ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 422 });

  await db.committeeMember.deleteMany({ where: { committeeId, userId } });
  await emitEvent({ orgId: session.user.orgId, type: "committee.member_removed", entityId: committeeId, payload: { userId } });

  return NextResponse.json({ success: true });
}
