import type { DecisionStatus } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";

const statusVariant: Record<
  DecisionStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PROPOSED: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
  ARCHIVED: "secondary",
};

export async function DecisionStatusBadge({ status }: { status: DecisionStatus }) {
  const t = await getTranslations("decisionStatuses");
  return (
    <Badge variant={statusVariant[status]}>{t(status)}</Badge>
  );
}
