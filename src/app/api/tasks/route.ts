import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/permissions";
import { createTaskSchema } from "@/lib/validators/tasks";
import { createTask, listTasks } from "@/services/tasks";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "task:list", { entityType: "task", ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const { searchParams } = new URL(req.url);
  const assignedToId = searchParams.get("assignedToId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const meetingId = searchParams.get("meetingId") ?? undefined;
  const decisionId = searchParams.get("decisionId") ?? undefined;
  const overdue = searchParams.get("overdue") === "true";

  const tasks = await listTasks(session.user.orgId, {
    assignedToId,
    status: status as never,
    meetingId,
    decisionId,
    overdue: overdue || undefined,
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "task:create", { entityType: "task", ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });
  }

  const task = await createTask({
    organizationId: session.user.orgId,
    createdById: session.user.id,
    ...parsed.data,
  });

  if (!task) return NextResponse.json({ error: "Meeting or decision not found" }, { status: 404 });

  return NextResponse.json(task, { status: 201 });
}
