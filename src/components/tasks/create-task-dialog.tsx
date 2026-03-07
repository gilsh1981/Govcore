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

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface CreateTaskDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  meetingId?: string;
  decisionId?: string;
  trigger?: React.ReactNode;
}

const PRIORITIES = [
  { value: "LOW",      label: "Low",      color: "text-slate-500" },
  { value: "MEDIUM",   label: "Medium",   color: "text-amber-500" },
  { value: "HIGH",     label: "High",     color: "text-orange-500" },
  { value: "CRITICAL", label: "Critical", color: "text-red-500" },
];

export function CreateTaskDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  meetingId,
  decisionId,
  trigger,
}: CreateTaskDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [assignedToId, setAssignedToId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => controlledOnOpenChange?.(v)
    : setInternalOpen;

  useEffect(() => {
    if (!open) return;
    fetch("/api/users")
      .then((r) => r.ok ? r.json() : [])
      .then(setUsers)
      .catch(() => []);
  }, [open]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const dueDateRaw = fd.get("dueDate") as string;

    const body: Record<string, unknown> = {
      title: fd.get("title"),
      description: fd.get("description") || undefined,
      priority,
      assignedToId: assignedToId || undefined,
      dueDate: dueDateRaw ? new Date(dueDateRaw).toISOString() : undefined,
      meetingId: meetingId || undefined,
      decisionId: decisionId || undefined,
    };

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setOpen(false);
      setAssignedToId("");
      setPriority("MEDIUM");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && !isControlled && (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="taskTitle" className="text-sm font-medium">Title *</label>
            <Input id="taskTitle" name="title" placeholder="Task description" required />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="taskDesc" className="text-sm font-medium">Notes</label>
            <Textarea id="taskDesc" name="description" rows={2} placeholder="Additional details…" />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Priority</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <span className={p.color}>{p.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignee */}
          {users.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Assign to</label>
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Due date */}
          <div className="space-y-1.5">
            <label htmlFor="dueDate" className="text-sm font-medium">Due date</label>
            <Input id="dueDate" name="dueDate" type="date" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
