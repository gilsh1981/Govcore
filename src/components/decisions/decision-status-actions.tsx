"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { DecisionStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";

const TRANSITIONS: Record<DecisionStatus, { key: string; status: DecisionStatus }[]> = {
  PROPOSED: [
    { key: "approve", status: "APPROVED" },
    { key: "reject", status: "REJECTED" },
  ],
  APPROVED: [
    { key: "archive", status: "ARCHIVED" },
  ],
  REJECTED: [],
  ARCHIVED: [],
};

export function DecisionStatusActions({
  decisionId,
  currentStatus,
}: {
  decisionId: string;
  currentStatus: DecisionStatus;
}) {
  const router = useRouter();
  const t = useTranslations("decisionActions");
  const [loading, setLoading] = useState(false);
  const actions = TRANSITIONS[currentStatus];

  if (actions.length === 0) return null;

  async function transition(newStatus: DecisionStatus) {
    setLoading(true);
    const res = await fetch(`/api/decisions/${decisionId}/status`, {
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
          variant={
            action.status === "REJECTED"
              ? "destructive"
              : action.status === "APPROVED"
                ? "default"
                : "outline"
          }
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
