import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { listMeetings } from "@/services/meetings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  CalendarDays,
  AlertCircle,
  FileText,
  Share2,
  Pencil,
  Download,
  Trash2,
  Mic,
  UserCog,
  ShieldCheck,
  LayoutList,
  ClipboardList,
  Lock,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── helpers ─────────────────────────────────────────────────────────────────

function getWeekBounds() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const t = await getTranslations("dashboard");
  const locale = await getLocale();
  const isAdmin = session.user.role === "ADMIN";
  const orgId = session.user.orgId;

  const meetings = await listMeetings(orgId);

  // Week bounds
  const { monday, sunday } = getWeekBounds();

  const thisWeekMeetings = meetings.filter((m) => {
    const d = new Date(m.scheduledAt);
    return d >= monday && d <= sunday;
  });

  const upcomingThisWeek = thisWeekMeetings.filter(
    (m) => m.status === "SCHEDULED" || m.status === "IN_PROGRESS"
  );

  // Unique committees from this week's meetings
  const committeesThisWeek = Array.from(
    new Map(
      thisWeekMeetings
        .filter((m) => m.committee)
        .map((m) => [m.committee.id, m.committee])
    ).values()
  );

  // Build week days array: Mon → Sun
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayNamesHe = ["ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳", "א׳"];
  const dayLabels = locale === "he" ? dayNamesHe : dayNames;

  const today = new Date();

  // Admin tiles
  const adminTiles = [
    { icon: UserCog, labelKey: "manageUsers", href: "/organization" },
    { icon: ShieldCheck, labelKey: "assignRoles", href: "/organization" },
    { icon: LayoutList, labelKey: "manageCommittees", href: "/committees" },
    { icon: ClipboardList, labelKey: "manageMeetings", href: "/meetings" },
    { icon: Lock, labelKey: "managePermissions", href: "/organization" },
    { icon: Settings, labelKey: "systemSettings", href: "/settings" },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold">
          {t("welcome", { name: session.user.name || "" })}
        </h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {/* ── Section A: Weekly Overview ─────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold mb-4">{t("weeklyOverview")}</h2>

        {/* Mini week calendar */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
              {t("thisWeek")}
            </p>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day, i) => {
                const hasMeeting = thisWeekMeetings.some((m) =>
                  isSameDay(new Date(m.scheduledAt), day)
                );
                const isToday = isSameDay(day, today);
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex flex-col items-center py-2 px-1 rounded-lg text-center",
                      isToday && "bg-primary/10 ring-1 ring-primary/30"
                    )}
                  >
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">
                      {dayLabels[i]}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-semibold mt-0.5",
                        isToday && "text-primary"
                      )}
                    >
                      {day.getDate()}
                    </span>
                    <div className="h-1.5 mt-1 flex items-center justify-center">
                      {hasMeeting && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Stats row */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("upcomingCommittees")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{committeesThisWeek.length}</div>
              <div className="mt-2 space-y-1">
                {committeesThisWeek.slice(0, 3).map((c) => (
                  <Link
                    key={c.id}
                    href={`/committees/${c.id}`}
                    className="block text-xs text-muted-foreground hover:text-foreground truncate transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("upcomingMeetings")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingThisWeek.length}</div>
              <div className="mt-2 space-y-1">
                {upcomingThisWeek.slice(0, 3).map((m) => (
                  <Link
                    key={m.id}
                    href={`/meetings/${m.id}`}
                    className="block text-xs text-muted-foreground hover:text-foreground truncate transition-colors"
                  >
                    {m.title} &middot;{" "}
                    {new Date(m.scheduledAt).toLocaleDateString(locale, {
                      weekday: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Link>
                ))}
                {upcomingThisWeek.length === 0 && (
                  <p className="text-xs text-muted-foreground">{t("noWeeklyItems")}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("unplannedEvents")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="mt-2 text-xs text-muted-foreground">{t("noWeeklyItems")}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Section B: Documents ───────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold mb-4">{t("documents")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Shared Documents */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{t("sharedWithMe")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{t("noDocuments")}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" disabled>
                  <Download className="h-3 w-3 me-1" />
                  {t("download")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* My Documents */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{t("myDocuments")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{t("noDocuments")}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" disabled>
                  <Pencil className="h-3 w-3 me-1" />
                  {t("edit")}
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <Share2 className="h-3 w-3 me-1" />
                  {t("share")}
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <Trash2 className="h-3 w-3 me-1" />
                  {t("delete")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Voice Recordings */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <Mic className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{t("voiceRecordings")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{t("noDocuments")}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" disabled>
                  <Download className="h-3 w-3 me-1" />
                  {t("download")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Section C: Admin Control Panel ────────────────────────── */}
      {isAdmin && (
        <section>
          <h2 className="text-xl font-semibold mb-4">{t("adminControl")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {adminTiles.map(({ icon: Icon, labelKey, href }) => (
              <Link key={labelKey} href={href}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="flex items-center gap-3 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="flex-1 text-sm font-medium">{t(labelKey)}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
