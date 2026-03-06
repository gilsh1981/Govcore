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
  const dayOfWeek = now.getDay();
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

  const { monday, sunday } = getWeekBounds();

  const thisWeekMeetings = meetings.filter((m) => {
    const d = new Date(m.scheduledAt);
    return d >= monday && d <= sunday;
  });

  const upcomingThisWeek = thisWeekMeetings.filter(
    (m) => m.status === "SCHEDULED" || m.status === "IN_PROGRESS"
  );

  const committeesThisWeek = Array.from(
    new Map(
      thisWeekMeetings
        .filter((m) => m.committee)
        .map((m) => [m.committee.id, m.committee])
    ).values()
  );

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayNamesHe = ["ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳", "א׳"];
  const dayLabels = locale === "he" ? dayNamesHe : dayNames;

  const today = new Date();

  const adminTiles = [
    { icon: UserCog,      labelKey: "manageUsers",       href: "/organization", color: "text-blue-500",   bg: "bg-blue-50" },
    { icon: ShieldCheck,  labelKey: "assignRoles",        href: "/organization", color: "text-indigo-500", bg: "bg-indigo-50" },
    { icon: LayoutList,   labelKey: "manageCommittees",   href: "/committees",   color: "text-violet-500", bg: "bg-violet-50" },
    { icon: ClipboardList,labelKey: "manageMeetings",     href: "/meetings",     color: "text-purple-500", bg: "bg-purple-50" },
    { icon: Lock,         labelKey: "managePermissions",  href: "/organization", color: "text-blue-500",   bg: "bg-blue-50" },
    { icon: Settings,     labelKey: "systemSettings",     href: "/settings",     color: "text-slate-500",  bg: "bg-slate-100" },
  ] as const;

  return (
    <div className="space-y-8">

      {/* Page header — on dark canvas */}
      <div>
        <h1 className="text-2xl font-semibold text-white">
          {t("welcome", { name: session.user.name || "" })}
        </h1>
        <p className="text-sm text-slate-400 mt-1">{t("subtitle")}</p>
      </div>

      {/* ── Section A: Weekly Overview ─────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">{t("weeklyOverview")}</h2>

        {/* Mini week calendar */}
        <Card className="glass-card mb-4 card-enter">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">
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
                      "flex flex-col items-center py-2 px-1 rounded-xl text-center transition-colors",
                      isToday ? "bg-indigo-50 ring-1 ring-indigo-200" : "hover:bg-gray-50"
                    )}
                  >
                    <span className="text-[10px] font-medium text-gray-400 uppercase">
                      {dayLabels[i]}
                    </span>
                    <span className={cn("text-sm font-semibold mt-0.5", isToday ? "text-indigo-600" : "text-gray-700")}>
                      {day.getDate()}
                    </span>
                    <div className="h-1.5 mt-1 flex items-center justify-center">
                      {hasMeeting && (
                        <div className={cn("w-1.5 h-1.5 rounded-full", isToday ? "bg-indigo-500" : "bg-indigo-400")} />
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
          <Card className="glass-card card-enter" style={{ animationDelay: "0.05s" }}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
                <CardTitle className="text-sm font-medium text-gray-500">
                  {t("upcomingCommittees")}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-indigo-600">{committeesThisWeek.length}</div>
              <div className="mt-2 space-y-1">
                {committeesThisWeek.slice(0, 3).map((c) => (
                  <Link
                    key={c.id}
                    href={`/committees/${c.id}`}
                    className="block text-xs text-gray-400 hover:text-indigo-600 truncate transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card card-enter" style={{ animationDelay: "0.10s" }}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                  <CalendarDays className="h-4 w-4 text-indigo-500" />
                </div>
                <CardTitle className="text-sm font-medium text-gray-500">
                  {t("upcomingMeetings")}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-indigo-600">{upcomingThisWeek.length}</div>
              <div className="mt-2 space-y-1">
                {upcomingThisWeek.slice(0, 3).map((m) => (
                  <Link
                    key={m.id}
                    href={`/meetings/${m.id}`}
                    className="block text-xs text-gray-400 hover:text-indigo-600 truncate transition-colors"
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
                  <p className="text-xs text-gray-400">{t("noWeeklyItems")}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card card-enter" style={{ animationDelay: "0.15s" }}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                </div>
                <CardTitle className="text-sm font-medium text-gray-500">
                  {t("unplannedEvents")}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-indigo-600">0</div>
              <p className="mt-2 text-xs text-gray-400">{t("noWeeklyItems")}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Section B: Documents ───────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">{t("documents")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card card-enter" style={{ animationDelay: "0.20s" }}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                  <Share2 className="h-4 w-4 text-violet-500" />
                </div>
                <CardTitle className="text-sm font-medium text-gray-700">{t("sharedWithMe")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400 mb-4">{t("noDocuments")}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" disabled className="text-gray-400 border-gray-200">
                  <Download className="h-3 w-3 me-1" />
                  {t("download")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card card-enter" style={{ animationDelay: "0.25s" }}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  <FileText className="h-4 w-4 text-blue-500" />
                </div>
                <CardTitle className="text-sm font-medium text-gray-700">{t("myDocuments")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400 mb-4">{t("noDocuments")}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" disabled className="text-gray-400 border-gray-200">
                  <Pencil className="h-3 w-3 me-1" />
                  {t("edit")}
                </Button>
                <Button variant="outline" size="sm" disabled className="text-gray-400 border-gray-200">
                  <Share2 className="h-3 w-3 me-1" />
                  {t("share")}
                </Button>
                <Button variant="outline" size="sm" disabled className="text-gray-400 border-gray-200">
                  <Trash2 className="h-3 w-3 me-1" />
                  {t("delete")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card card-enter" style={{ animationDelay: "0.30s" }}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                  <Mic className="h-4 w-4 text-purple-500" />
                </div>
                <CardTitle className="text-sm font-medium text-gray-700">{t("voiceRecordings")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400 mb-4">{t("noDocuments")}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" disabled className="text-gray-400 border-gray-200">
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
          <h2 className="text-lg font-semibold text-white mb-4">{t("adminControl")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {adminTiles.map(({ icon: Icon, labelKey, href, color, bg }, idx) => (
              <Link key={labelKey} href={href}>
                <Card
                  className="glass-card cursor-pointer card-enter"
                  style={{ animationDelay: `${0.35 + idx * 0.05}s` }}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", bg)}>
                      <Icon className={cn("h-4 w-4", color)} />
                    </div>
                    <span className="flex-1 text-sm font-medium text-gray-700">{t(labelKey)}</span>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
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
