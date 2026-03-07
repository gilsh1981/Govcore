import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { listMeetings } from "@/services/meetings";
import { listCommittees } from "@/services/committees";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MeetingStatusBadge } from "@/components/meetings/meeting-status-badge";
import { CreateMeetingDialog } from "@/components/meetings/create-meeting-dialog";

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const t = await getTranslations("meetings");
  const tStatus = await getTranslations("meetingStatuses");
  const locale = await getLocale();
  const orgId = session.user.orgId;
  const { status } = await searchParams;

  const [meetings, committees] = await Promise.all([
    listMeetings(orgId, status ? { status: status as "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" } : undefined),
    listCommittees(orgId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <CreateMeetingDialog
          committees={committees.map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {[undefined, "PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map(
          (s) => (
            <Link
              key={s ?? "all"}
              href={s ? `/meetings?status=${s}` : "/meetings"}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                status === s || (!status && !s)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s ? tStatus(s) : t("all")}
            </Link>
          )
        )}
      </div>

      {meetings.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("titleCol")}</TableHead>
              <TableHead>{t("committee")}</TableHead>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead className="w-24">{t("decisions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.map((meeting) => (
              <TableRow key={meeting.id}>
                <TableCell>
                  <Link
                    href={`/meetings/${meeting.id}`}
                    className="font-medium hover:underline"
                  >
                    {meeting.title}
                  </Link>
                </TableCell>
                <TableCell>{meeting.committee?.name ?? "—"}</TableCell>
                <TableCell>
                  {new Date(meeting.scheduledStart).toLocaleDateString(locale)}
                </TableCell>
                <TableCell>
                  <MeetingStatusBadge status={meeting.status} />
                </TableCell>
                <TableCell>{meeting._count?.decisions ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
