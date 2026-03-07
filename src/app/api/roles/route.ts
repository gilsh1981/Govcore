import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/permissions";
import { createRoleSchema } from "@/lib/validators/roles";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "role:list", { entityType: "role", ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const roles = await db.role.findMany({
    where: { orgId: session.user.orgId },
    orderBy: [{ scope: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(roles);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "role:create", { entityType: "role", ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const body = await req.json();
  const parsed = createRoleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });

  const exists = await db.role.findFirst({ where: { orgId: session.user.orgId, name: parsed.data.name, scope: parsed.data.scope } });
  if (exists) return NextResponse.json({ error: "Role with this name and scope already exists" }, { status: 409 });

  const role = await db.role.create({
    data: { orgId: session.user.orgId, ...parsed.data },
  });

  return NextResponse.json(role, { status: 201 });
}
