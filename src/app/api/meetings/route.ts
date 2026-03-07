import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/permissions";
import { createMeetingSchema } from "@/lib/validators/meetings";
import { db } from "@/lib/db";
import { emitEvent } from "@/lib/events";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "meeting:list", { entityType: "meeting", ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const { searchParams } = new URL(req.url);
  const committeeId = searchParams.get("committeeId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const meetings = await db.meeting.findMany({
    where: {
      orgId: session.user.orgId,
      deletedAt: null,
      ...(committeeId ? { committeeId } : {}),
      ...(status ? { status: status as never } : {}),
    },
    include: {
      committee: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, displayName: true } },
      _count: { select: { decisions: true, documents: true } },
    },
    orderBy: { scheduledStart: "asc" },
  });

  return NextResponse.json(meetings);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "meeting:create", { entityType: "meeting", ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const body = await req.json();
  const parsed = createMeetingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });
  }

  const meeting = await db.meeting.create({
    data: { orgId: session.user.orgId, createdById: session.user.id, ...parsed.data },
  });

  await emitEvent({ orgId: session.user.orgId, type: "meeting.created", entityId: meeting.id, payload: { title: meeting.title } });

  return NextResponse.json(meeting, { status: 201 });
}
