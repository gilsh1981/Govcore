import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getMeeting } from "@/services/meetings";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MeetingStatusBadge } from "@/components/meetings/meeting-status-badge";
import { MeetingStatusActions } from "@/components/meetings/meeting-status-actions";
import { CreateDecisionDialog } from "@/components/decisions/create-decision-dialog";
import { DecisionStatusBadge } from "@/components/decisions/decision-status-badge";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { DecisionStatusActions } from "@/components/decisions/decision-status-actions";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList, CheckSquare, AlertCircle } from "lucide-react";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const t = await getTranslations("meetingDetail");
  const locale = await getLocale();
  const { id } = await params;
  const meeting = await getMeeting(session.user.orgId, id);
  if (!meeting) notFound();

  // Fetch tasks for this meeting
  const tasks = await db.task.findMany({
    where: { meetingId: id, deletedAt: null },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link
          href="/meetings"
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; {t("backLink")}
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-3xl font-bold text-slate-900">{meeting.title}</h1>
          <MeetingStatusBadge status={meeting.status} />
        </div>
        <p className="mt-1 text-muted-foreground">
          {meeting.committee?.name ? `${meeting.committee.name} · ` : ""}
          {new Date(meeting.scheduledStart).toLocaleString(locale)}
        </p>
      </div>

      <MeetingStatusActions meetingId={meeting.id} currentStatus={meeting.status} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Decisions */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-indigo-500" />
              {t("decisionsTitle")}
              <Badge variant="secondary">{meeting.decisions.length}</Badge>
            </CardTitle>
            <CreateDecisionDialog meetingId={meeting.id} />
          </CardHeader>
          <CardContent>
            {meeting.decisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noDecisions")}</p>
            ) : (
              <div className="divide-y">
                {meeting.decisions.map((decision) => (
                  <div key={decision.id} className="py-3 flex items-center justify-between gap-4">
                    <Link
                      href={`/decisions/${decision.id}`}
                      className="text-sm font-medium text-slate-800 hover:text-indigo-600 hover:underline flex-1 truncate"
                    >
                      {decision.title}
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <DecisionStatusBadge status={decision.status} />
                      <DecisionStatusActions
                        decisionId={decision.id}
                        currentStatus={decision.status}
                      />
                      <CreateTaskDialog
                        decisionId={decision.id}
                        meetingId={meeting.id}
                        trigger={
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-700 gap-1">
                            <Plus className="h-3 w-3" />
                            Task
                          </Button>
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-amber-500" />
              Tasks
              <Badge variant="secondary">{tasks.length}</Badge>
            </CardTitle>
            <CreateTaskDialog meetingId={meeting.id} trigger={
              <Button variant="outline" size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            } />
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks for this meeting.</p>
            ) : (
              <div className="divide-y">
                {tasks.map((task) => {
                  const isOverdue = task.dueDate && task.dueDate < now && task.status !== "COMPLETED";
                  return (
                    <div key={task.id} className="py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isOverdue ? "text-red-600" : "text-slate-800"}`}>
                          {isOverdue && <AlertCircle className="inline h-3 w-3 me-1" />}
                          {task.title}
                        </p>
                        {task.assignedTo && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            → {task.assignedTo.name || task.assignedTo.email}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={
                            task.priority === "CRITICAL" ? "border-red-300 text-red-600" :
                            task.priority === "HIGH" ? "border-orange-300 text-orange-600" :
                            task.priority === "MEDIUM" ? "border-amber-300 text-amber-600" :
                            "border-slate-200 text-slate-500"
                          }
                        >
                          {task.priority}
                        </Badge>
                        <Badge variant={
                          task.status === "COMPLETED" ? "default" :
                          task.status === "IN_PROGRESS" ? "secondary" :
                          task.status === "BLOCKED" ? "destructive" : "outline"
                        }>
                          {task.status.replace("_", " ")}
                        </Badge>
                        {task.dueDate && (
                          <span className={`text-xs ${isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
                            {new Date(task.dueDate).toLocaleDateString(locale)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meeting Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t("detailsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("createdByLabel")}</p>
              <p className="text-sm">
                {meeting.createdBy?.name || meeting.createdBy?.email || "—"}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">{t("createdLabel")}</p>
              <p className="text-sm">
                {new Date(meeting.createdAt).toLocaleDateString(locale)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Minutes */}
        <Card>
          <CardHeader>
            <CardTitle>{t("minutesTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {meeting.minutes ? (
              <pre className="whitespace-pre-wrap text-sm">
                {typeof meeting.minutes === "string"
                  ? meeting.minutes
                  : JSON.stringify(meeting.minutes, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("noMinutes")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
