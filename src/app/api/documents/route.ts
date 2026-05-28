import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/permissions";
import { createDocumentSchema, listDocumentsSchema } from "@/lib/validators/documents";
import { db } from "@/lib/db";
import type { DocumentEntityType } from "@prisma/client";

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
    meetingId:    searchParams.get("meetingId")    ?? undefined,
    committeeId:  searchParams.get("committeeId")  ?? undefined,
    decisionId:   searchParams.get("decisionId")   ?? undefined,
    taskId:       searchParams.get("taskId")        ?? undefined,
    isVoiceRecord: searchParams.get("isVoiceRecord") === "true"  ? true
                 : searchParams.get("isVoiceRecord") === "false" ? false : undefined,
    visibility:   searchParams.get("visibility")   ?? undefined,
  });

  // Build query: if relation filters provided, join through DocumentRelation
  const data = filters.success ? filters.data : {};
  const { committeeId, decisionId, taskId, ...directFilters } = data;

  const relationFilters: Array<{ entityType: DocumentEntityType; entityId: string }> = [];
  if (committeeId) relationFilters.push({ entityType: "COMMITTEE", entityId: committeeId });
  if (decisionId)  relationFilters.push({ entityType: "DECISION",  entityId: decisionId  });
  if (taskId)      relationFilters.push({ entityType: "TASK",       entityId: taskId      });

  const documents = await db.document.findMany({
    where: {
      orgId: session.user.orgId,
      deletedAt: null,
      ...directFilters,
      ...(relationFilters.length > 0
        ? { relations: { some: { OR: relationFilters } } }
        : {}),
    },
    include: {
      uploadedBy: { select: { id: true, name: true, displayName: true } },
      relations: true,
    },
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

  const { relations, ...docData } = parsed.data;

  const document = await db.document.create({
    data: {
      orgId: session.user.orgId,
      uploadedById: session.user.id,
      ...docData,
      ...(relations && relations.length > 0
        ? { relations: { create: relations } }
        : {}),
    },
    include: { relations: true },
  });

  return NextResponse.json(document, { status: 201 });
}
