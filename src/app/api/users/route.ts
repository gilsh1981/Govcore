import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/permissions";
import { createUserSchema } from "@/lib/validators/users";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "user:list", { entityType: "user", ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;

  const users = await db.user.findMany({
    where: {
      orgId: session.user.orgId,
      deletedAt: null,
      ...(status ? { status: status as never } : {}),
    },
    select: { id: true, email: true, phone: true, name: true, displayName: true, role: true, status: true, provider: true, createdAt: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await requirePermission(session.user.id, "user:create", { entityType: "user", ip });
  } catch (e) {
    if (e instanceof PermissionDeniedError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });

  const exists = await db.user.findUnique({ where: { orgId_email: { orgId: session.user.orgId, email: parsed.data.email } } });
  if (exists) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const { passwordHash: rawPassword, ...rest } = parsed.data;
  const passwordHash = rawPassword ? await bcrypt.hash(rawPassword, 12) : undefined;

  const user = await db.user.create({
    data: { orgId: session.user.orgId, ...rest, passwordHash },
    select: { id: true, email: true, name: true, displayName: true, role: true, status: true },
  });

  return NextResponse.json(user, { status: 201 });
}
