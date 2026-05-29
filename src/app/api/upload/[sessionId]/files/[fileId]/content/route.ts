import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeUploadedFile } from "@/lib/storage";

// Allow up to 100 MB per file
export const maxDuration = 60;

interface RouteContext {
  params: Promise<{ sessionId: string; fileId: string }>;
}

/**
 * PUT /api/upload/[sessionId]/files/[fileId]/content
 *
 * Accepts multipart/form-data with a single field named "file".
 * Writes the bytes to local disk, marks the UploadFile as COMPLETED,
 * and updates session progress.
 */
export async function PUT(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId, fileId } = await ctx.params;

  // Verify the upload session belongs to this org and is still active
  const uploadSession = await db.uploadSession.findFirst({
    where: {
      id: sessionId,
      orgId: session.user.orgId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
  });
  if (!uploadSession) {
    return NextResponse.json({ error: "Upload session not found or not active" }, { status: 404 });
  }

  const uploadFile = await db.uploadFile.findFirst({ where: { id: fileId, sessionId } });
  if (!uploadFile) {
    return NextResponse.json({ error: "File not found in session" }, { status: 404 });
  }

  // Parse multipart body
  let fileBuffer: Buffer;
  try {
    const formData = await req.formData();
    const fileField = formData.get("file");
    if (!fileField || typeof fileField === "string") {
      return NextResponse.json({ error: "Missing file field in form data" }, { status: 422 });
    }
    const arrayBuffer = await fileField.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
  } catch {
    return NextResponse.json({ error: "Failed to parse upload body" }, { status: 400 });
  }

  // Write to disk
  let storageKey: string;
  try {
    storageKey = await writeUploadedFile(
      session.user.orgId,
      sessionId,
      fileId,
      fileBuffer
    );
  } catch {
    return NextResponse.json({ error: "Failed to save file" }, { status: 500 });
  }

  // Mark file as COMPLETED
  await db.uploadFile.update({
    where: { id: fileId },
    data: {
      status: "COMPLETED",
      storageKey,
      uploadedBytes: BigInt(fileBuffer.length),
    },
  });

  // Update session progress
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

  return NextResponse.json({
    fileId,
    storageKey,
    sizeBytes: fileBuffer.length,
    status: "COMPLETED",
  });
}
