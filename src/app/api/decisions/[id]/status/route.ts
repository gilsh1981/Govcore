import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/permissions";
import type { Action } from "@/lib/validators/roles";
import { transitionDecisionSchema } from "@/lib/validators/decisions";
import { transitionDecisionStatus, WorkflowError, WorkflowPermissionError } from "@/services/decisions";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  const body = await req.json();
  const parsed = transitionDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });
  }

  const { status } = parsed.data;

  const actionMap: Record<string, Action> = {
    APPROVED: "decision:approve",
    REJECTED: "decision:reject",
    ARCHIVED: "decision:archive",
  };

  const action = actionMap[status];
  if (!action) {
    return NextResponse.json(
      { error: `Status '${status}' cannot be set via this endpoint` },
      { status: 422 }
    );
  }

  try {
    await requirePermission(session.user.id, action, { entityType: "decision", entityId: id, ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  try {
    const result = await transitionDecisionStatus(
      session.user.orgId,
      id,
      status as never,
      session.user.id
    );
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof WorkflowError) return NextResponse.json({ error: e.message }, { status: 422 });
    if (e instanceof WorkflowPermissionError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
}
