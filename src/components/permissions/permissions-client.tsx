"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleCreateModal } from "./role-create-modal";
import { UserRoleAssignmentModal } from "./user-role-assignment-modal";
import { Plus, MoreHorizontal, Pencil, Trash2, Users, Building2, UserCog, Shield } from "lucide-react";

interface SerializedRole {
  id: string;
  name: string;
  description?: string | null;
  scope: string;
  permissions: string[];
  assignmentCount: number;
}

interface RoleAssignment {
  id: string;
  roleId: string;
  roleName: string;
  scopeType: string;
  scopeId: string | null;
  scopeLabel?: string;
}

interface SerializedUser {
  id: string;
  name: string;
  email: string;
  systemRole: string;
  assignments: RoleAssignment[];
}

interface Committee {
  id: string;
  name: string;
}

interface PermissionsClientProps {
  initialRoles: SerializedRole[];
  users: SerializedUser[];
  committees: Committee[];
  capabilityLabels: Record<string, string>;
  scopeStyles: Record<string, { label: string; className: string }>;
}

export function PermissionsClient({
  initialRoles,
  users,
  committees,
  capabilityLabels,
  scopeStyles,
}: PermissionsClientProps) {
  const router = useRouter();
  const [roles, setRoles] = useState(initialRoles);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<SerializedRole | null>(null);
  const [assignUser, setAssignUser] = useState<SerializedUser | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function deleteRole(roleId: string) {
    if (!confirm("Delete this role? Users with this role will lose associated permissions.")) return;
    setDeleting(roleId);
    try {
      const res = await fetch(`/api/roles/${roleId}`, { method: "DELETE" });
      if (res.ok) {
        setRoles((prev) => prev.filter((r) => r.id !== roleId));
        router.refresh();
      }
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      {/* ── Roles ──────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => {
            const scope = scopeStyles[role.scope];
            const shownCaps = role.permissions.slice(0, 4);
            const remaining = role.permissions.length - shownCaps.length;

            return (
              <Card key={role.id} className="border-slate-200 hover:border-slate-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{role.name}</p>
                      {role.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{role.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {scope && (
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${scope.className}`}>
                          {scope.label}
                        </span>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditRole(role)}>
                            <Pencil className="h-3.5 w-3.5 me-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteRole(role.id)}
                            className="text-red-600 focus:text-red-600"
                            disabled={deleting === role.id || role.assignmentCount > 0}
                          >
                            <Trash2 className="h-3.5 w-3.5 me-2" />
                            {role.assignmentCount > 0 ? `In use (${role.assignmentCount})` : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {shownCaps.map((cap) => (
                      <span key={cap} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 font-medium">
                        {capabilityLabels[cap] ?? cap}
                      </span>
                    ))}
                    {remaining > 0 && (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-400">
                        +{remaining} more
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs text-slate-400">
                    <Users className="h-3 w-3" />
                    <span>{role.assignmentCount} assignment{role.assignmentCount !== 1 ? "s" : ""}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Create role card */}
          <button
            onClick={() => setCreateOpen(true)}
            className="rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors p-4 flex flex-col items-center justify-center gap-2 min-h-[140px] text-slate-400 hover:text-indigo-600"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-indigo-100 transition-colors">
              <Plus className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Create Role</span>
          </button>
        </div>
      </div>

      <Separator />

      {/* ── Users ──────────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-400" />
          People & Their Roles
          <Badge variant="secondary" className="font-normal">{users.length}</Badge>
        </h2>

        <Card className="border-slate-200">
          <CardContent className="p-0">
            {users.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">No users found.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {users.map((user) => {
                  // Group assignments by scope
                  const orgAssignments = user.assignments.filter((a) => a.scopeType === "ORGANIZATION");
                  const contextualAssignments = user.assignments.filter((a) => a.scopeType !== "ORGANIZATION");

                  return (
                    <div key={user.id} className="flex items-start gap-4 px-5 py-4">
                      {/* Avatar */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm">
                        {user.name[0].toUpperCase()}
                      </div>

                      {/* Identity */}
                      <div className="w-44 min-w-0 shrink-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>

                      {/* Role assignments */}
                      <div className="flex-1 min-w-0 flex flex-wrap gap-1.5 items-start">
                        {/* Organization-level roles */}
                        {orgAssignments.map((a) => (
                          <span key={a.id} className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                            <Building2 className="h-3 w-3 shrink-0" />
                            {a.roleName}
                          </span>
                        ))}

                        {/* Contextual roles (committee / meeting) */}
                        {contextualAssignments.map((a) => {
                          const style = scopeStyles[a.scopeType];
                          return (
                            <span key={a.id} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${style?.className ?? ""}`}>
                              <Users className="h-3 w-3 shrink-0" />
                              {a.roleName}
                              {a.scopeLabel && (
                                <span className="opacity-60">· {a.scopeLabel}</span>
                              )}
                            </span>
                          );
                        })}

                        {user.assignments.length === 0 && (
                          <span className="text-xs text-slate-400 italic">No roles assigned</span>
                        )}
                      </div>

                      {/* Assign roles button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-slate-400 hover:text-indigo-600 gap-1.5"
                        onClick={() => setAssignUser(user)}
                      >
                        <UserCog className="h-4 w-4" />
                        <span className="text-xs">Manage</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      <RoleCreateModal
        open={createOpen || !!editRole}
        onClose={() => { setCreateOpen(false); setEditRole(null); }}
        editRole={editRole ?? undefined}
      />

      {assignUser && (
        <UserRoleAssignmentModal
          open={!!assignUser}
          onClose={() => setAssignUser(null)}
          userId={assignUser.id}
          userName={assignUser.name}
          userEmail={assignUser.email}
          currentAssignments={assignUser.assignments}
          allRoles={roles}
          committees={committees}
        />
      )}
    </>
  );
}
