import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/permissions";
import { createCommitteeSchema } from "@/lib/validators/committees";
import { db } from "@/lib/db";
import { emitEvent } from "@/lib/events";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "committee:list", { entityType: "committee", ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const committees = await db.committee.findMany({
    where: { orgId: session.user.orgId, deletedAt: null },
    include: { chair: { select: { id: true, name: true, displayName: true } }, _count: { select: { members: true, meetings: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(committees);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "committee:create", { entityType: "committee", ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const body = await req.json();
  const parsed = createCommitteeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });
  }

  const committee = await db.committee.create({
    data: { orgId: session.user.orgId, ...parsed.data },
  });

  await emitEvent({ orgId: session.user.orgId, type: "committee.created", entityId: committee.id, payload: { name: committee.name } });

  return NextResponse.json(committee, { status: 201 });
}
