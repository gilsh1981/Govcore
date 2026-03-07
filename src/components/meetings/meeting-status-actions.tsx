"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { MeetingStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";

const TRANSITIONS: Record<MeetingStatus, { key: string; status: MeetingStatus }[]> = {
  PLANNED: [
    { key: "startMeeting", status: "IN_PROGRESS" },
    { key: "cancel", status: "CANCELLED" },
  ],
  IN_PROGRESS: [
    { key: "complete", status: "COMPLETED" },
    { key: "cancel", status: "CANCELLED" },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

export function MeetingStatusActions({
  meetingId,
  currentStatus,
}: {
  meetingId: string;
  currentStatus: MeetingStatus;
}) {
  const router = useRouter();
  const t = useTranslations("meetingActions");
  const [loading, setLoading] = useState(false);
  const actions = TRANSITIONS[currentStatus];

  if (actions.length === 0) return null;

  async function transition(newStatus: MeetingStatus) {
    setLoading(true);
    const res = await fetch(`/api/meetings/${meetingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="flex gap-2">
      {actions.map((action) => (
        <Button
          key={action.status}
          variant={action.status === "CANCELLED" ? "destructive" : "default"}
          size="sm"
          disabled={loading}
          onClick={() => transition(action.status)}
        >
          {t(action.key)}
        </Button>
      ))}
    </div>
  );
}
