import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/permissions";
import { createDocumentSchema, listDocumentsSchema } from "@/lib/validators/documents";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "document:list", { entityType: "document", ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const { searchParams } = new URL(req.url);
  const filters = listDocumentsSchema.safeParse({
    meetingId: searchParams.get("meetingId") ?? undefined,
    isVoiceRecord: searchParams.get("isVoiceRecord") === "true" ? true : searchParams.get("isVoiceRecord") === "false" ? false : undefined,
    visibility: searchParams.get("visibility") ?? undefined,
  });

  const where = {
    orgId: session.user.orgId,
    deletedAt: null,
    ...(filters.success ? filters.data : {}),
  };

  const documents = await db.document.findMany({
    where,
    include: { uploadedBy: { select: { id: true, name: true, displayName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}

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
  const parsed = createDocumentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });

  const document = await db.document.create({
    data: { orgId: session.user.orgId, uploadedById: session.user.id, ...parsed.data },
  });

  return NextResponse.json(document, { status: 201 });
}
