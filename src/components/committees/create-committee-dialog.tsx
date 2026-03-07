"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface CreateCommitteeDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const RECURRENCE_OPTIONS = [
  { value: "none",      label: "One time" },
  { value: "weekly",    label: "Weekly" },
  { value: "monthly",   label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly",    label: "Yearly" },
  { value: "custom",    label: "Custom" },
];

const DAY_OPTIONS = [
  { value: "0", label: "Sun" },
  { value: "1", label: "Mon" },
  { value: "2", label: "Tue" },
  { value: "3", label: "Wed" },
  { value: "4", label: "Thu" },
  { value: "5", label: "Fri" },
  { value: "6", label: "Sat" },
];

export function CreateCommitteeDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateCommitteeDialogProps = {}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [chairId, setChairId] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState("none");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => controlledOnOpenChange?.(v)
    : setInternalOpen;

  const showRecurrenceDetails = recurrence !== "none";

  // Load users when dialog opens
  useEffect(() => {
    if (!open) return;
    fetch("/api/users")
      .then((r) => r.ok ? r.json() : [])
      .then(setUsers)
      .catch(() => setUsers([]));
  }, [open]);

  function toggleMember(id: string) {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  function toggleDay(d: string) {
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  function resetForm() {
    setChairId("");
    setSelectedMembers([]);
    setRecurrence("none");
    setSelectedDays([]);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      chairId: chairId || undefined,
    };

    const res = await fetch("/api/committees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const committee = await res.json();
      // Add selected members
      await Promise.all(
        selectedMembers.map((userId) =>
          fetch(`/api/committees/${committee.id}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, role: "MEMBER" }),
          })
        )
      );
      resetForm();
      setOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>New Committee</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Committee</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium">Name *</label>
            <Input id="name" name="name" placeholder="e.g. Finance Committee" required />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Textarea id="description" name="description" rows={2} placeholder="Optional description…" />
          </div>

          {/* Chair */}
          {users.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Chairperson</label>
              <Select value={chairId} onValueChange={setChairId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select chair (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                      {u.role === "ADMIN" && (
                        <Badge variant="outline" className="ms-2 text-xs">Admin</Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Members */}
          {users.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Members
                {selectedMembers.length > 0 && (
                  <Badge variant="secondary" className="ms-2">{selectedMembers.length}</Badge>
                )}
              </label>
              <div className="rounded-md border p-3 space-y-2 max-h-36 overflow-y-auto bg-slate-50">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`m-${u.id}`}
                      checked={selectedMembers.includes(u.id)}
                      onCheckedChange={() => toggleMember(u.id)}
                    />
                    <label htmlFor={`m-${u.id}`} className="text-sm cursor-pointer flex-1">
                      {u.name || u.email}
                      <span className="text-muted-foreground ms-1">· {u.role}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Recurrence */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Meeting Recurrence</label>
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showRecurrenceDetails && (
            <div className="rounded-lg border bg-slate-50 p-4 space-y-4">
              {/* Day(s) of week — for weekly / custom */}
              {(recurrence === "weekly" || recurrence === "custom") && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Day(s)</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAY_OPTIONS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggleDay(d.value)}
                        className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                          selectedDays.includes(d.value)
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Time */}
              <div className="space-y-1.5">
                <label htmlFor="recurTime" className="text-sm font-medium">Default Time</label>
                <Input id="recurTime" name="recurTime" type="time" />
              </div>

              {/* Start date */}
              <div className="space-y-1.5">
                <label htmlFor="startDate" className="text-sm font-medium">Start Date</label>
                <Input id="startDate" name="startDate" type="date" />
              </div>

              {/* End date (optional) */}
              <div className="space-y-1.5">
                <label htmlFor="endDate" className="text-sm font-medium">End Date (optional)</label>
                <Input id="endDate" name="endDate" type="date" />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create Committee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
