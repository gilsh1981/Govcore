import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/permissions";
import { updateDocumentSchema } from "@/lib/validators/documents";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

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
    include: {
      uploadedBy: { select: { id: true, name: true, displayName: true } },
      meeting: { select: { id: true, title: true } },
      relations: true,
    },
  });

  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(document);
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "document:upload", { entityType: "document", entityId: id, ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const body = await req.json();
  const parsed = updateDocumentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });

  const { relations, ...docData } = parsed.data;

  // Verify doc exists in this org
  const existing = await db.document.findFirst({ where: { id, orgId: session.user.orgId, deletedAt: null } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.document.update({
    where: { id },
    data: {
      ...docData,
      ...(relations !== undefined
        ? {
            relations: {
              deleteMany: {},
              create: relations,
            },
          }
        : {}),
    },
    include: { relations: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "document:delete", { entityType: "document", entityId: id, ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const result = await db.document.updateMany({ where: { id, orgId: session.user.orgId, deletedAt: null }, data: { deletedAt: new Date() } });
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
