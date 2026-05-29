import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/permissions";
import { db } from "@/lib/db";
import { readUploadedFile } from "@/lib/storage";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/documents/[id]/download
 *
 * Streams the file bytes from local disk to the client with correct
 * Content-Type and Content-Disposition headers.
 */
export async function GET(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "document:read", { entityType: "document", entityId: id, ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const document = await db.document.findFirst({
    where: { id, orgId: session.user.orgId, deletedAt: null },
  });

  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let fileBuffer: Buffer;
  try {
    fileBuffer = await readUploadedFile(document.storageKey);
  } catch {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }

  const inline = req.nextUrl.searchParams.get("inline") === "1";
  const disposition = inline
    ? `inline; filename="${document.name}"`
    : `attachment; filename="${document.name}"`;

  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": disposition,
      "Content-Length": fileBuffer.length.toString(),
      "Cache-Control": "private, no-cache",
    },
  });
}
