import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/permissions";
import { createDecisionSchema } from "@/lib/validators/decisions";
import { createDecision, listDecisions } from "@/services/decisions";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "decision:list", { entityType: "decision", ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const { searchParams } = new URL(req.url);
  const meetingId = searchParams.get("meetingId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const proposedById = searchParams.get("proposedById") ?? undefined;

  const decisions = await listDecisions(session.user.orgId, {
    meetingId,
    status: status as never,
    proposedById,
  });

  return NextResponse.json(decisions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "decision:create", { entityType: "decision", ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const body = await req.json();
  const parsed = createDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });
  }

  const decision = await createDecision({
    organizationId: session.user.orgId,
    createdById: session.user.id,
    ...parsed.data,
  });

  if (!decision) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

  return NextResponse.json(decision, { status: 201 });
}
