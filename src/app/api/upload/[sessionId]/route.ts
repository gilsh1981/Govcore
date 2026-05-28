import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

/** GET /api/upload/[sessionId] — get session status and per-file progress */
export async function GET(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await ctx.params;

  const uploadSession = await db.uploadSession.findFirst({
    where: { id: sessionId, orgId: session.user.orgId },
    include: { files: { orderBy: { createdAt: "asc" } } },
  });

  if (!uploadSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  return NextResponse.json({
    sessionId: uploadSession.id,
    status: uploadSession.status,
    totalFiles: uploadSession.totalFiles,
    processedFiles: uploadSession.processedFiles,
    expiresAt: uploadSession.expiresAt,
    files: uploadSession.files.map((f) => ({
      fileId: f.id,
      name: f.name,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes?.toString() ?? null,
      uploadedBytes: f.uploadedBytes.toString(),
      progress: f.sizeBytes && f.sizeBytes > 0n
        ? Math.round(Number((f.uploadedBytes * 100n) / f.sizeBytes))
        : null,
      status: f.status,
      storageKey: f.storageKey,
      error: f.error,
    })),
  });
}

/** DELETE /api/upload/[sessionId] — cancel the session */
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await ctx.params;

  const result = await db.uploadSession.updateMany({
    where: {
      id: sessionId,
      orgId: session.user.orgId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
    data: { status: "CANCELLED" },
  });

  if (result.count === 0) return NextResponse.json({ error: "Session not found or cannot be cancelled" }, { status: 404 });
  return NextResponse.json({ success: true });
}
