import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/permissions";
import { createUploadSessionSchema } from "@/lib/validators/documents";
import { db } from "@/lib/db";

const MAX_FILES = 20;
const SESSION_TTL_HOURS = 24;

/** POST /api/upload — create a new upload session for up to 20 files */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "document:upload", { entityType: "document", ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const body = await req.json();
  const parsed = createUploadSessionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });

  if (parsed.data.files.length > MAX_FILES) {
    return NextResponse.json({ error: `Maximum ${MAX_FILES} files per session` }, { status: 422 });
  }

  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

  const uploadSession = await db.uploadSession.create({
    data: {
      orgId: session.user.orgId,
      uploadedById: session.user.id,
      totalFiles: parsed.data.files.length,
      expiresAt,
      files: {
        create: parsed.data.files.map((f) => ({
          name: f.name,
          mimeType: f.mimeType,
          sizeBytes: f.sizeBytes ? BigInt(f.sizeBytes) : undefined,
        })),
      },
    },
    include: { files: true },
  });

  return NextResponse.json({
    sessionId: uploadSession.id,
    expiresAt: uploadSession.expiresAt,
    files: uploadSession.files.map((f) => ({
      fileId: f.id,
      name: f.name,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes?.toString() ?? null,
      status: f.status,
    })),
  }, { status: 201 });
}
