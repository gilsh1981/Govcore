import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RoleAssignPanel } from "@/components/permissions/role-assign-panel";
import { Shield, Users, Building2 } from "lucide-react";

export default async function PermissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const orgId = session.user.orgId;

  const [users, roles, committees] = await Promise.all([
    db.user.findMany({
      where: { orgId, deletedAt: null },
      select: {
        id: true, name: true, email: true, role: true, displayName: true,
        roleAssignments: {
          include: { role: { select: { id: true, name: true, scope: true } } },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.role.findMany({
      where: { orgId },
      orderBy: [{ scope: "asc" }, { name: "asc" }],
    }),
    db.committee.findMany({
      where: { orgId, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const rolesByScope = {
    ORGANIZATION: roles.filter((r) => r.scope === "ORGANIZATION"),
    COMMITTEE: roles.filter((r) => r.scope === "COMMITTEE"),
    MEETING: roles.filter((r) => r.scope === "MEETING"),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
          <Shield className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Permissions</h1>
          <p className="text-sm text-slate-500">Manage roles and access control across your organization</p>
        </div>
      </div>

      {/* Roles overview */}
      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-400" />
          Defined Roles
        </h2>
        {roles.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No custom roles defined yet. Users rely on their system role (ADMIN / SECRETARY / MEMBER).
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <Card key={role.id} className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-800">{role.name}</p>
                    <Badge variant="outline" className="text-xs">{role.scope}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(role.permissions as string[]).slice(0, 5).map((p) => (
                      <span key={p} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{p}</span>
                    ))}
                    {role.permissions.length > 5 && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                        +{role.permissions.length - 5} more
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* User role assignments */}
      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-400" />
          User Permissions
          <Badge variant="secondary">{users.length}</Badge>
        </h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm">
                    {(user.name || user.email)[0].toUpperCase()}
                  </div>

                  {/* Name / email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {user.name || user.displayName || user.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>

                  {/* System role badge */}
                  <Badge
                    variant={user.role === "ADMIN" ? "default" : "outline"}
                    className="shrink-0"
                  >
                    {user.role}
                  </Badge>

                  {/* Fine-grained role assignments */}
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {user.roleAssignments.map((ra) => (
                      <Badge key={ra.id} variant="secondary" className="text-xs">
                        {ra.role.name}
                      </Badge>
                    ))}
                  </div>

                  {/* Assign panel */}
                  <RoleAssignPanel
                    userId={user.id}
                    userName={user.name || user.email}
                    currentRole={user.role}
                    orgRoles={rolesByScope.ORGANIZATION}
                    committeeRoles={rolesByScope.COMMITTEE}
                    committees={committees}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
