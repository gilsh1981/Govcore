import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/permissions";
import { enqueueSyncJob } from "@/lib/sync/job";
import { db } from "@/lib/db";

/** GET /api/sync — list recent sync logs */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "sync:run", { entityType: "sync", ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const logs = await db.syncLog.findMany({
    where: { orgId: session.user.orgId },
    orderBy: { startedAt: "desc" },
    take: 20,
  });

  return NextResponse.json(logs);
}

/** POST /api/sync — trigger a sync run */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "sync:run", { entityType: "sync", ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const body = await req.json().catch(() => ({}));
  const providerName: "AZURE_AD" | "LDAP" = body.provider ?? "AZURE_AD";

  if (!["AZURE_AD", "LDAP"].includes(providerName)) {
    return NextResponse.json({ error: "Invalid provider. Must be AZURE_AD or LDAP." }, { status: 422 });
  }

  const job = await enqueueSyncJob({ orgId: session.user.orgId, providerName });

  return NextResponse.json({ jobId: job.id, queued: true }, { status: 202 });
}
