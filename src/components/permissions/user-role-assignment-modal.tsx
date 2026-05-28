"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UserCog, Building2, Users, X, Plus } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description?: string | null;
  scope: string;
}

interface Committee {
  id: string;
  name: string;
}

interface RoleAssignment {
  id: string;
  roleId: string;
  roleName: string;
  scopeType: string;
  scopeId: string | null;
  scopeLabel?: string;
}

interface UserRoleAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
  currentAssignments: RoleAssignment[];
  allRoles: Role[];
  committees: Committee[];
}

const SCOPE_COLORS: Record<string, string> = {
  ORGANIZATION: "bg-indigo-50 text-indigo-700 border-indigo-200",
  COMMITTEE:    "bg-violet-50 text-violet-700 border-violet-200",
  MEETING:      "bg-sky-50    text-sky-700    border-sky-200",
  EVENT:        "bg-amber-50  text-amber-700  border-amber-200",
};

export function UserRoleAssignmentModal({
  open,
  onClose,
  userId,
  userName,
  userEmail,
  currentAssignments,
  allRoles,
  committees,
}: UserRoleAssignmentModalProps) {
  const router = useRouter();

  const [assignments, setAssignments] = useState<RoleAssignment[]>(currentAssignments);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedScope, setSelectedScope] = useState<"ORGANIZATION" | "COMMITTEE">("ORGANIZATION");
  const [selectedCommitteeId, setSelectedCommitteeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function addAssignment() {
    if (!selectedRoleId) return;
    if (selectedScope === "COMMITTEE" && !selectedCommitteeId) return;
    setError(null);
    setLoading(true);

    try {
      const scopeId = selectedScope === "COMMITTEE" ? selectedCommitteeId : undefined;
      const res = await fetch(`/api/roles/${selectedRoleId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          scopeType: selectedScope,
          scopeId: scopeId ?? undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to assign role");
        return;
      }

      const assigned = await res.json();
      const role = allRoles.find((r) => r.id === selectedRoleId);
      const committee = committees.find((c) => c.id === selectedCommitteeId);

      setAssignments((prev) => [
        ...prev,
        {
          id: assigned.id,
          roleId: selectedRoleId,
          roleName: role?.name ?? "Unknown",
          scopeType: selectedScope,
          scopeId: scopeId ?? null,
          scopeLabel: committee?.name,
        },
      ]);

      setSelectedRoleId("");
      setSelectedCommitteeId("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function removeAssignment(assignment: RoleAssignment) {
    setRemoving(assignment.id);
    try {
      const res = await fetch(`/api/roles/${assignment.roleId}/assign`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, scopeId: assignment.scopeId }),
      });

      if (res.ok) {
        setAssignments((prev) => prev.filter((a) => a.id !== assignment.id));
        router.refresh();
      }
    } finally {
      setRemoving(null);
    }
  }

  const selectedRole = allRoles.find((r) => r.id === selectedRoleId);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm shrink-0">
              {userName[0].toUpperCase()}
            </div>
            <div>
              <DialogTitle className="text-base">{userName}</DialogTitle>
              <p className="text-xs text-slate-500">{userEmail}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* Current assignments */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <UserCog className="h-4 w-4 text-slate-400" />
              Current Role Assignments
            </p>
            {assignments.length === 0 ? (
              <p className="text-sm text-slate-400 py-3 text-center border border-dashed rounded-lg">
                No roles assigned yet.
              </p>
            ) : (
              <div className="space-y-2">
                {assignments.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{a.roleName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${SCOPE_COLORS[a.scopeType] ?? ""}`}>
                          {a.scopeType === "ORGANIZATION"
                            ? <Building2 className="h-3 w-3" />
                            : <Users className="h-3 w-3" />}
                          {a.scopeLabel ?? a.scopeType}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
                      onClick={() => removeAssignment(a)}
                      disabled={removing === a.id}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add new assignment */}
          <div className="rounded-lg border border-slate-200 p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Plus className="h-4 w-4 text-slate-400" />
              Assign a Role
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Scope</label>
              <div className="flex gap-2">
                <Button
                  variant={selectedScope === "ORGANIZATION" ? "default" : "outline"}
                  size="sm"
                  className="text-xs flex items-center gap-1.5"
                  onClick={() => { setSelectedScope("ORGANIZATION"); setSelectedCommitteeId(""); }}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  Organization
                </Button>
                <Button
                  variant={selectedScope === "COMMITTEE" ? "default" : "outline"}
                  size="sm"
                  className="text-xs flex items-center gap-1.5"
                  onClick={() => setSelectedScope("COMMITTEE")}
                >
                  <Users className="h-3.5 w-3.5" />
                  Committee
                </Button>
              </div>
            </div>

            {selectedScope === "COMMITTEE" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Committee</label>
                <Select value={selectedCommitteeId} onValueChange={setSelectedCommitteeId}>
                  <SelectTrigger className="text-sm h-9">
                    <SelectValue placeholder="Select committee…" />
                  </SelectTrigger>
                  <SelectContent>
                    {committees.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Role</label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger className="text-sm h-9">
                  <SelectValue placeholder="Select role…" />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <span>{r.name}</span>
                      {r.description && (
                        <span className="ml-1.5 text-xs text-slate-400">{r.description}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRole?.description && (
                <p className="text-xs text-slate-500">{selectedRole.description}</p>
              )}
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <Button
              className="w-full"
              size="sm"
              disabled={loading || !selectedRoleId || (selectedScope === "COMMITTEE" && !selectedCommitteeId)}
              onClick={addAssignment}
            >
              {loading ? "Assigning…" : "Assign Role"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
