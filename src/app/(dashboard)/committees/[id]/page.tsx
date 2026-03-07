import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getCommittee } from "@/services/committees";
import { listMeetings } from "@/services/meetings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreateMeetingDialog } from "@/components/meetings/create-meeting-dialog";
import { MeetingStatusBadge } from "@/components/meetings/meeting-status-badge";
import { Calendar, Users, Plus } from "lucide-react";

export default async function CommitteeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const t = await getTranslations("committeeDetail");
  const locale = await getLocale();
  const { id } = await params;
  const [committee, meetings] = await Promise.all([
    getCommittee(session.user.orgId, id),
    listMeetings(session.user.orgId, { committeeId: id }),
  ]);
  const chair = committee?.members.find((m) => m.role === "CHAIR")?.user ?? null;
  if (!committee) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/committees"
            className="text-sm text-muted-foreground hover:underline"
          >
            &larr; {t("backLink")}
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{committee.name}</h1>
          {committee.description && (
            <p className="mt-1 text-muted-foreground">{committee.description}</p>
          )}
        </div>
        <CreateMeetingDialog
          committees={[{ id: committee.id, name: committee.name }]}
          defaultCommitteeId={committee.id}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Members */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              {t("membersTitle")}
              <Badge variant="secondary">{committee.members.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {committee.members.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noMembers")}</p>
            ) : (
              <div className="space-y-3">
                {committee.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {member.user.name || member.user.email}
                      </p>
                      {member.user.name && (
                        <p className="text-xs text-muted-foreground">{member.user.email}</p>
                      )}
                    </div>
                    <Badge variant="outline">{member.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>{t("detailsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("meetingsLabel")}</p>
              <p className="text-2xl font-semibold text-indigo-600">{committee._count.meetings}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">{t("createdLabel")}</p>
              <p className="text-sm">{new Date(committee.createdAt).toLocaleDateString(locale)}</p>
            </div>
            {chair && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Chair</p>
                  <p className="text-sm font-medium">{chair.name || chair.email}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Meetings */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              Meetings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {meetings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No meetings yet.</p>
            ) : (
              <div className="space-y-3">
                {meetings.slice(0, 6).map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-2">
                    <Link
                      href={`/meetings/${m.id}`}
                      className="text-sm font-medium text-slate-700 hover:text-indigo-600 hover:underline truncate"
                    >
                      {m.title}
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {new Date(m.scheduledStart).toLocaleDateString(locale)}
                      </span>
                      <MeetingStatusBadge status={m.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
