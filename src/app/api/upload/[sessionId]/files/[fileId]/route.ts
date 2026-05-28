import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ sessionId: string; fileId: string }>;
}

/**
 * PATCH /api/upload/[sessionId]/files/[fileId]
 *
 * Reports chunk progress or marks a file as complete.
 * In production, the client would POST binary chunks here and the handler
 * would stream them to object storage. This implementation tracks progress
 * and records the final storageKey once the client confirms completion.
 *
 * Body (JSON):
 *   { uploadedBytes: number }           — progress update
 *   { status: "COMPLETED", storageKey } — mark file done
 *   { status: "FAILED", error }         — mark file failed
 */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId, fileId } = await ctx.params;

  // Verify the session belongs to this org
  const uploadSession = await db.uploadSession.findFirst({
    where: { id: sessionId, orgId: session.user.orgId, status: { in: ["PENDING", "IN_PROGRESS"] } },
  });
  if (!uploadSession) return NextResponse.json({ error: "Session not found or not active" }, { status: 404 });

  const file = await db.uploadFile.findFirst({ where: { id: fileId, sessionId } });
  if (!file) return NextResponse.json({ error: "File not found in session" }, { status: 404 });

  const body = await req.json();

  // Progress update
  if (typeof body.uploadedBytes === "number") {
    const updated = await db.uploadFile.update({
      where: { id: fileId },
      data: {
        uploadedBytes: BigInt(body.uploadedBytes),
        status: "UPLOADING",
      },
    });

    // Mark session IN_PROGRESS on first chunk
    if (uploadSession.status === "PENDING") {
      await db.uploadSession.update({
        where: { id: sessionId },
        data: { status: "IN_PROGRESS" },
      });
    }

    return NextResponse.json({
      fileId: updated.id,
      uploadedBytes: updated.uploadedBytes.toString(),
      status: updated.status,
    });
  }

  // Completion
  if (body.status === "COMPLETED" && body.storageKey) {
    const updated = await db.uploadFile.update({
      where: { id: fileId },
      data: { status: "COMPLETED", storageKey: body.storageKey, uploadedBytes: file.sizeBytes ?? 0n },
    });

    // Update session processed count
    const completedCount = await db.uploadFile.count({
      where: { sessionId, status: "COMPLETED" },
    });

    const allDone = completedCount >= uploadSession.totalFiles;
    await db.uploadSession.update({
      where: { id: sessionId },
      data: {
        processedFiles: completedCount,
        status: allDone ? "COMPLETED" : "IN_PROGRESS",
      },
    });

    return NextResponse.json({ fileId: updated.id, status: updated.status, storageKey: updated.storageKey });
  }

  // Failure
  if (body.status === "FAILED") {
    const updated = await db.uploadFile.update({
      where: { id: fileId },
      data: { status: "FAILED", error: body.error ?? "Unknown error" },
    });
    return NextResponse.json({ fileId: updated.id, status: updated.status, error: updated.error });
  }

  return NextResponse.json({ error: "Invalid update payload" }, { status: 422 });
}
