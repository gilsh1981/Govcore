import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { listMeetings } from "@/services/meetings";
import { CalendarView } from "@/components/calendar/calendar-view";
import { CalendarSyncButton } from "@/components/calendar/calendar-sync-modal";
import { generateMockCalendarEvents, EVENT_TYPE_COLORS } from "@/lib/mock-data";
import type { CalendarEvent } from "@/types";

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const t = await getTranslations("calendar");
  const meetings = await listMeetings(session.user.orgId);

  const realEvents: CalendarEvent[] = meetings.map((m) => ({
    id: m.id,
    title: m.title,
    start: m.scheduledStart,
    end: m.scheduledEnd ?? m.scheduledStart,
    type: "MEETING" as const,
    color: EVENT_TYPE_COLORS.MEETING,
    committeeId: m.committeeId ?? undefined,
    committeeName: m.committee?.name,
  }));

  const mockEvents = generateMockCalendarEvents();
  const allEvents = [...realEvents, ...mockEvents];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <CalendarSyncButton />
      </div>
      <CalendarView events={allEvents} />
    </div>
  );
}
