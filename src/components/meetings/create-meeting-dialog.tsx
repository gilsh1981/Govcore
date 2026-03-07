"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface Committee {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface CreateMeetingDialogProps {
  committees: Committee[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Pre-selected committee (e.g. when opening from committee page) */
  defaultCommitteeId?: string;
  /** If true, creates a standalone meeting (no committee) */
  defaultStandalone?: boolean;
}

type ParticipationMethod = "PHYSICAL" | "TEAMS" | "ZOOM" | "WEBEX" | "HYBRID";

const PARTICIPATION_METHODS: { value: ParticipationMethod; label: string }[] = [
  { value: "PHYSICAL", label: "In person" },
  { value: "HYBRID",   label: "Hybrid" },
  { value: "TEAMS",    label: "Microsoft Teams" },
  { value: "ZOOM",     label: "Zoom" },
  { value: "WEBEX",    label: "Webex" },
];

const RECURRENCE_OPTIONS = [
  { value: "NONE",      label: "No recurrence" },
  { value: "DAILY",     label: "Daily" },
  { value: "WEEKLY",    label: "Weekly" },
  { value: "BIWEEKLY",  label: "Every two weeks" },
  { value: "MONTHLY",   label: "Monthly" },
];

export function CreateMeetingDialog({
  committees,
  open,
  onOpenChange,
  defaultCommitteeId,
  defaultStandalone = false,
}: CreateMeetingDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  // Form state
  const [standalone, setStandalone] = useState(defaultStandalone || !committees.length);
  const [committeeId, setCommitteeId] = useState(defaultCommitteeId ?? "");
  const [participation, setParticipation] = useState<ParticipationMethod>("PHYSICAL");
  const [recurrence, setRecurrence] = useState("NONE");
  const [aiTranscription, setAiTranscription] = useState(false);

  const showLocation = participation === "PHYSICAL" || participation === "HYBRID";
  const showLink = participation !== "PHYSICAL";

  useEffect(() => {
    if (!open) return;
    fetch("/api/users")
      .then((r) => r.ok ? r.json() : [])
      .then(setUsers)
      .catch(() => []);
  }, [open]);

  function reset() {
    setStandalone(defaultStandalone || !committees.length);
    setCommitteeId(defaultCommitteeId ?? "");
    setParticipation("PHYSICAL");
    setRecurrence("NONE");
    setAiTranscription(false);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const scheduledStartRaw = fd.get("scheduledStart") as string;
    const scheduledEndRaw = fd.get("scheduledEnd") as string;

    const body: Record<string, unknown> = {
      title: fd.get("title"),
      description: fd.get("description") || undefined,
      scheduledStart: scheduledStartRaw ? new Date(scheduledStartRaw).toISOString() : undefined,
      scheduledEnd: scheduledEndRaw ? new Date(scheduledEndRaw).toISOString() : undefined,
      committeeId: !standalone && committeeId ? committeeId : undefined,
    };

    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      reset();
      onOpenChange?.(false);
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      console.error("Meeting creation failed", err);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Standalone toggle (only show if committees exist) */}
          {committees.length > 0 && (
            <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Standalone meeting</p>
                <p className="text-xs text-muted-foreground">Not tied to a committee</p>
              </div>
              <Switch checked={standalone} onCheckedChange={setStandalone} />
            </div>
          )}

          {/* Committee select */}
          {!standalone && committees.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Committee *</label>
              <Select value={committeeId} onValueChange={setCommitteeId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select committee" />
                </SelectTrigger>
                <SelectContent>
                  {committees.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-sm font-medium">Title *</label>
            <Input id="title" name="title" placeholder="Meeting title" required />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Textarea id="description" name="description" rows={2} placeholder="Optional agenda or notes…" />
          </div>

          {/* Date & time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="scheduledStart" className="text-sm font-medium">Start *</label>
              <Input id="scheduledStart" name="scheduledStart" type="datetime-local" required />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="scheduledEnd" className="text-sm font-medium">End</label>
              <Input id="scheduledEnd" name="scheduledEnd" type="datetime-local" />
            </div>
          </div>

          <Separator />

          {/* Participation */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Participation</label>
            <Select value={participation} onValueChange={(v) => setParticipation(v as ParticipationMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTICIPATION_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showLocation && (
            <div className="space-y-1.5">
              <label htmlFor="location" className="text-sm font-medium">Location</label>
              <Input id="location" name="location" placeholder="Room or address" />
            </div>
          )}

          {showLink && (
            <div className="space-y-1.5">
              <label htmlFor="meetingLink" className="text-sm font-medium">Meeting link</label>
              <Input id="meetingLink" name="meetingLink" type="url" dir="ltr" placeholder="https://…" />
            </div>
          )}

          {/* Recurrence */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Recurrence</label>
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RECURRENCE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* AI Transcription */}
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">AI Transcription</p>
              <p className="text-xs text-muted-foreground">Premium feature</p>
            </div>
            <Switch checked={aiTranscription} onCheckedChange={setAiTranscription} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || (!standalone && !committeeId && committees.length > 0)}>
              {loading ? "Scheduling…" : "Schedule Meeting"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
