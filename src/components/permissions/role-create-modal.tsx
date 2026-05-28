"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CAPABILITY_CATEGORIES, type Capability } from "@/lib/validators/roles";
import { ChevronDown, ChevronRight, Shield } from "lucide-react";

interface RoleCreateModalProps {
  open: boolean;
  onClose: () => void;
  /** If provided, pre-fill the form for editing */
  editRole?: {
    id: string;
    name: string;
    description?: string | null;
    scope: string;
    permissions: string[];
  };
}

const SCOPE_LABELS: Record<string, { label: string; color: string }> = {
  ORGANIZATION: { label: "Organization",  color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  COMMITTEE:    { label: "Committee",     color: "bg-violet-50 text-violet-700 border-violet-200" },
  MEETING:      { label: "Meeting",       color: "bg-sky-50    text-sky-700    border-sky-200"    },
  EVENT:        { label: "Event",         color: "bg-amber-50  text-amber-700  border-amber-200"  },
};

export function RoleCreateModal({ open, onClose, editRole }: RoleCreateModalProps) {
  const router = useRouter();
  const isEdit = !!editRole;

  const [name, setName] = useState(editRole?.name ?? "");
  const [description, setDescription] = useState(editRole?.description ?? "");
  const [scope, setScope] = useState(editRole?.scope ?? "ORGANIZATION");
  const [selected, setSelected] = useState<Set<Capability>>(
    new Set((editRole?.permissions ?? []) as Capability[])
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CAPABILITY_CATEGORIES.map((c) => c.key))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCapability(key: Capability) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleCategory(catKey: string, keys: Capability[]) {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = keys.every((k) => next.has(k));
      if (allSelected) { keys.forEach((k) => next.delete(k)); }
      else              { keys.forEach((k) => next.add(k));    }
      return next;
    });
  }

  function toggleExpand(catKey: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catKey)) next.delete(catKey); else next.add(catKey);
      return next;
    });
  }

  async function handleSubmit() {
    if (!name.trim()) { setError("Role name is required"); return; }
    if (selected.size === 0) { setError("Select at least one capability"); return; }
    setError(null);
    setLoading(true);

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      scope,
      permissions: Array.from(selected),
    };

    try {
      const url  = isEdit ? `/api/roles/${editRole!.id}` : "/api/roles";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "An error occurred");
        return;
      }

      router.refresh();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
              <Shield className="h-4 w-4 text-indigo-600" />
            </div>
            <DialogTitle>{isEdit ? "Edit Role" : "Create Role"}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Basic info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Role Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Safety Officer, Legal Advisor, CFO"
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Description <span className="text-slate-400 font-normal">(optional)</span></label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what this role is responsible for…"
                className="text-sm resize-none"
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Default Scope</label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SCOPE_LABELS).map(([val, { label }]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">
                Roles can still be assigned at any scope when adding them to a user.
              </p>
            </div>

            <div className="space-y-1.5 flex flex-col justify-end">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Selected:</span>
                <Badge variant="secondary">{selected.size} capabilities</Badge>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-700 mb-3">Capabilities</p>
            <div className="space-y-2">
              {CAPABILITY_CATEGORIES.map((cat) => {
                const catKeys = cat.items.map((i) => i.key);
                const allChecked = catKeys.every((k) => selected.has(k));
                const someChecked = catKeys.some((k) => selected.has(k));
                const expanded = expandedCategories.has(cat.key);

                return (
                  <div key={cat.key} className="rounded-lg border border-slate-200 overflow-hidden">
                    {/* Category header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleExpand(cat.key)}>
                      <Checkbox
                        checked={allChecked}
                        data-state={someChecked && !allChecked ? "indeterminate" : undefined}
                        onCheckedChange={() => toggleCategory(cat.key, catKeys)}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{cat.label}</p>
                        <p className="text-xs text-slate-500">{cat.description}</p>
                      </div>
                      <span className="text-xs text-slate-400">
                        {catKeys.filter((k) => selected.has(k)).length}/{catKeys.length}
                      </span>
                      {expanded
                        ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                        : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                    </div>

                    {/* Capability rows */}
                    {expanded && (
                      <div className="divide-y divide-slate-100">
                        {cat.items.map((item) => (
                          <label
                            key={item.key}
                            className="flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                          >
                            <Checkbox
                              checked={selected.has(item.key)}
                              onCheckedChange={() => toggleCapability(item.key)}
                              className="mt-0.5 shrink-0"
                            />
                            <div>
                              <p className="text-sm text-slate-800">{item.label}</p>
                              <p className="text-xs text-slate-500">{item.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 mt-2">{error}</p>
        )}

        <DialogFooter className="mt-4 shrink-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save Changes" : "Create Role")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
