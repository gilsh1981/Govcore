import type { MeetingStatus } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";

const statusVariant: Record<
  MeetingStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PLANNED: "outline",
  IN_PROGRESS: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

export async function MeetingStatusBadge({ status }: { status: MeetingStatus }) {
  const t = await getTranslations("meetingStatuses");
  return <Badge variant={statusVariant[status]}>{t(status)}</Badge>;
}
