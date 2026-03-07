"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, UserCog } from "lucide-react";

interface Role {
  id: string;
  name: string;
  scope: string;
}

interface Committee {
  id: string;
  name: string;
}

interface RoleAssignPanelProps {
  userId: string;
  userName: string;
  currentRole: string;
  orgRoles: Role[];
  committeeRoles: Role[];
  committees: Committee[];
}

type SystemRole = "ADMIN" | "SECRETARY" | "MEMBER";

export function RoleAssignPanel({
  userId,
  userName,
  currentRole,
  orgRoles,
  committeeRoles,
  committees,
}: RoleAssignPanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [roleDialogMode, setRoleDialogMode] = useState<"system" | "org" | "committee" | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedCommittee, setSelectedCommittee] = useState("");
  const [loading, setLoading] = useState(false);

  async function changeSystemRole(role: SystemRole) {
    setLoading(true);
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setLoading(false);
    router.refresh();
  }

  async function assignOrgRole() {
    if (!selectedRole) return;
    setLoading(true);
    await fetch("/api/roles/" + selectedRole + "/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, scopeType: "ORGANIZATION" }),
    }).catch(() => {});
    setLoading(false);
    setRoleDialogMode(null);
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="shrink-0 gap-1 text-slate-500">
            <UserCog className="h-4 w-4" />
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Manage {userName}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuLabel className="text-xs font-medium">System Role</DropdownMenuLabel>
          {(["ADMIN", "SECRETARY", "MEMBER"] as SystemRole[]).map((r) => (
            <DropdownMenuItem
              key={r}
              onClick={() => changeSystemRole(r)}
              className={currentRole === r ? "font-semibold text-indigo-600" : ""}
            >
              {r}
              {currentRole === r && " ✓"}
            </DropdownMenuItem>
          ))}

          {orgRoles.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setRoleDialogMode("org"); setOpen(true); }}>
                Assign org role…
              </DropdownMenuItem>
            </>
          )}

          {committeeRoles.length > 0 && committees.length > 0 && (
            <DropdownMenuItem onClick={() => { setRoleDialogMode("committee"); setOpen(true); }}>
              Assign committee role…
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Fine-grained assignment dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {roleDialogMode === "org" ? "Assign Organization Role" : "Assign Committee Role"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {roleDialogMode === "committee" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Committee</label>
                <Select value={selectedCommittee} onValueChange={setSelectedCommittee}>
                  <SelectTrigger><SelectValue placeholder="Select committee" /></SelectTrigger>
                  <SelectContent>
                    {committees.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {(roleDialogMode === "org" ? orgRoles : committeeRoles).map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                disabled={loading || !selectedRole || (roleDialogMode === "committee" && !selectedCommittee)}
                onClick={assignOrgRole}
              >
                {loading ? "Assigning…" : "Assign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
