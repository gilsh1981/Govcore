import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Users, Building2, ChevronRight } from "lucide-react";
import { CAPABILITY_CATEGORIES } from "@/lib/validators/roles";
import { PermissionsClient } from "@/components/permissions/permissions-client";

// Build a lookup for capability display labels
const CAPABILITY_LABELS: Record<string, string> = {};
CAPABILITY_CATEGORIES.forEach((cat) => {
  cat.items.forEach((item) => {
    CAPABILITY_LABELS[item.key] = item.label;
  });
});

const SCOPE_STYLES: Record<string, { label: string; className: string }> = {
  ORGANIZATION: { label: "Organization",  className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  COMMITTEE:    { label: "Committee",     className: "bg-violet-50 text-violet-700 border-violet-200" },
  MEETING:      { label: "Meeting",       className: "bg-sky-50    text-sky-700    border-sky-200"    },
  EVENT:        { label: "Event",         className: "bg-amber-50  text-amber-700  border-amber-200"  },
};

export default async function PermissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const orgId = session.user.orgId;

  const [users, roles, committees] = await Promise.all([
    db.user.findMany({
      where: { orgId, deletedAt: null },
      select: {
        id: true, name: true, email: true, displayName: true, role: true,
        roleAssignments: {
          include: {
            role: { select: { id: true, name: true, scope: true, description: true } },
          },
          orderBy: { assignedAt: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.role.findMany({
      where: { orgId },
      include: { _count: { select: { assignments: true } } },
      orderBy: [{ scope: "asc" }, { name: "asc" }],
    }),
    db.committee.findMany({
      where: { orgId, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Build committee name lookup for rendering scope labels
  const committeeMap = Object.fromEntries(committees.map((c) => [c.id, c.name]));

  const serializedUsers = users.map((u) => ({
    id: u.id,
    name: u.name ?? u.displayName ?? u.email,
    email: u.email,
    systemRole: u.role,
    assignments: u.roleAssignments.map((ra) => ({
      id: ra.id,
      roleId: ra.roleId,
      roleName: ra.role.name,
      scopeType: ra.scopeType,
      scopeId: ra.scopeId,
      scopeLabel: ra.scopeId ? (committeeMap[ra.scopeId] ?? ra.scopeId) : undefined,
    })),
  }));

  const serializedRoles = roles.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    scope: r.scope,
    permissions: r.permissions as string[],
    assignmentCount: r._count.assignments,
  }));

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
            <Shield className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Roles & Permissions</h1>
            <p className="text-sm text-slate-500">
              Define organizational roles and assign them to people in the right context
            </p>
          </div>
        </div>
      </div>

      {/* Roles section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400" />
            Roles
            <Badge variant="secondary" className="font-normal">{roles.length}</Badge>
          </h2>
          {/* Create Role button is rendered client-side */}
        </div>

        {/* Role cards + create button — client component */}
        <PermissionsClient
          initialRoles={serializedRoles}
          users={serializedUsers}
          committees={committees}
          capabilityLabels={CAPABILITY_LABELS}
          scopeStyles={SCOPE_STYLES}
        />
      </section>
    </div>
  );
}
