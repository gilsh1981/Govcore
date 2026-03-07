import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/permissions";
import { updateMeetingSchema, transitionStatusSchema, updateMinutesSchema, VALID_TRANSITIONS } from "@/lib/validators/meetings";
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
    await requirePermission(session.user.id, "meeting:read", { entityType: "meeting", entityId: id, ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const meeting = await db.meeting.findFirst({
    where: { id, orgId: session.user.orgId, deletedAt: null },
    include: {
      committee: { select: { id: true, name: true } },
      decisions: { where: { deletedAt: null } },
      documents: { where: { deletedAt: null } },
      createdBy: { select: { id: true, name: true, displayName: true } },
    },
  });

  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(meeting);
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for") ?? undefined;
  const body = await req.json();

  const meeting = await db.meeting.findFirst({ where: { id, orgId: session.user.orgId, deletedAt: null } });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Status transition
  if (body.status !== undefined) {
    try {
      await requirePermission(session.user.id, "meeting:transition_status", { entityType: "meeting", entityId: id, ip });
    } catch (e) {
      if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      throw e;
    }

    const parsed = transitionStatusSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });

    const allowed = VALID_TRANSITIONS[meeting.status] ?? [];
    if (!allowed.includes(parsed.data.status)) {
      return NextResponse.json({ error: `Cannot transition from ${meeting.status} to ${parsed.data.status}` }, { status: 422 });
    }

    const updated = await db.meeting.update({ where: { id }, data: { status: parsed.data.status } });
    const evtMap: Record<string, "meeting.started" | "meeting.completed" | "meeting.cancelled"> = {
      IN_PROGRESS: "meeting.started", COMPLETED: "meeting.completed", CANCELLED: "meeting.cancelled",
    };
    if (evtMap[parsed.data.status]) {
      await emitEvent({ orgId: session.user.orgId, type: evtMap[parsed.data.status], entityId: id, payload: { status: parsed.data.status } });
    }
    return NextResponse.json(updated);
  }

  // Minutes update
  if (body.minutes !== undefined) {
    try {
      await requirePermission(session.user.id, "meeting:update_minutes", { entityType: "meeting", entityId: id, ip });
    } catch (e) {
      if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      throw e;
    }

    const parsed = updateMinutesSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });

    const updated = await db.meeting.update({ where: { id }, data: { minutes: parsed.data.minutes as object } });
    await emitEvent({ orgId: session.user.orgId, type: "meeting.minutes_updated", entityId: id, payload: {} });
    return NextResponse.json(updated);
  }

  // Field update
  try {
    await requirePermission(session.user.id, "meeting:update", { entityType: "meeting", entityId: id, ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const parsed = updateMeetingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });

  const updated = await db.meeting.update({ where: { id }, data: parsed.data });
  await emitEvent({ orgId: session.user.orgId, type: "meeting.updated", entityId: id, payload: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "meeting:delete", { entityType: "meeting", entityId: id, ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const result = await db.meeting.updateMany({ where: { id, orgId: session.user.orgId, deletedAt: null }, data: { deletedAt: new Date() } });
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await emitEvent({ orgId: session.user.orgId, type: "meeting.cancelled", entityId: id, payload: { reason: "deleted" } });
  return NextResponse.json({ success: true });
}
