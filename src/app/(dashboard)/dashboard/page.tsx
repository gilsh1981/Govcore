import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { db } from "@/lib/db";
import { listMeetings } from "@/services/meetings";
import { listCommittees } from "@/services/committees";
import { GlobalCreateButton } from "@/components/shared/global-create-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  UserCog,
  ShieldCheck,
  LayoutList,
  ClipboardList,
  Settings,
  BarChart3,
  CalendarCheck,
  ArrowUpRight,
  Circle,
  TrendingUp,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getWeekBounds() {
  const now = new Date();
  const dow = now.getDay();
  const daysToMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(now);
  mon.setDate(now.getDate() + daysToMon);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return { monday: mon, sunday: sun };
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const t   = await getTranslations("dashboard");
  const tS  = await getTranslations("meetingStatuses");
  const locale = await getLocale();
  const isRtl = locale === "he";
  const orgId = session.user.orgId;
  const isAdmin = session.user.role === "ADMIN";

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [meetings, committees, pendingDecisions, myTasks, meetingsThisMonth, overdueCount, todaysMeetings] =
    await Promise.all([
      listMeetings(orgId),
      listCommittees(orgId),
      db.decision.findMany({
        where: { organizationId: orgId, status: "PROPOSED", deletedAt: null },
        include: {
          meeting: {
            select: { id: true, title: true, committee: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 8,
      }),
      db.task.findMany({
        where: {
          organizationId: orgId,
          assignedToId: session.user.id,
          status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] },
          deletedAt: null,
        },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 8,
      }),
      db.meeting.count({
        where: { orgId, scheduledStart: { gte: monthStart, lte: monthEnd }, deletedAt: null },
      }),
      db.task.count({
        where: {
          organizationId: orgId,
          assignedToId: session.user.id,
          status: { in: ["OPEN", "IN_PROGRESS"] },
          dueDate: { lt: now },
          deletedAt: null,
        },
      }),
      db.meeting.findMany({
        where: {
          orgId,
          scheduledStart: { gte: todayStart, lte: todayEnd },
          deletedAt: null,
          status: { in: ["PLANNED", "IN_PROGRESS"] },
        },
        include: { committee: { select: { id: true, name: true } } },
        orderBy: { scheduledStart: "asc" },
      }),
    ]);

  // Week calendar
  const { monday, sunday } = getWeekBounds();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const weekMeetings = meetings.filter((m) => {
    const d = new Date(m.scheduledStart);
    return d >= monday && d <= sunday;
  });
  const upcomingThisWeek = weekMeetings
    .filter((m) => m.status === "PLANNED" || m.status === "IN_PROGRESS")
    .slice(0, 5);

  const dayLabelsEn = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayLabelsHe = ["ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳", "א׳"];
  const dayLabels = isRtl ? dayLabelsHe : dayLabelsEn;

  const committeeList = committees.map((c) => ({ id: c.id, name: c.name }));

  // Today's date string
  const todayStr = now.toLocaleDateString(locale, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // Admin quick-links
  const adminTiles = [
    { icon: UserCog,       labelKey: "manageUsers",      href: "/organization",  color: "text-blue-600",   bg: "bg-blue-50" },
    { icon: ShieldCheck,   labelKey: "assignRoles",       href: "/permissions",   color: "text-indigo-600", bg: "bg-indigo-50" },
    { icon: LayoutList,    labelKey: "manageCommittees",  href: "/committees",    color: "text-violet-600", bg: "bg-violet-50" },
    { icon: ClipboardList, labelKey: "manageMeetings",    href: "/meetings",      color: "text-purple-600", bg: "bg-purple-50" },
    { icon: BarChart3,     labelKey: "qaReports",         href: "/reports",       color: "text-cyan-600",   bg: "bg-cyan-50" },
    { icon: Settings,      labelKey: "systemSettings",    href: "/settings",      color: "text-slate-600",  bg: "bg-slate-100" },
  ] as const;

  return (
    <div className="space-y-6">

      {/* ── Welcome row ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-900">
            {session.user.name
              ? t("welcome", { name: session.user.name })
              : t("welcomeGeneric")}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">{t("todayDate", { date: todayStr })}</p>
        </div>
        <GlobalCreateButton committees={committeeList} />
      </div>

      {/* ── KPI strip ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label={t("kpiMeetingsMonth")}
          value={meetingsThisMonth}
          icon={<CalendarCheck className="h-4 w-4" />}
          color="blue"
          href="/meetings"
        />
        <KpiCard
          label={t("kpiCommittees")}
          value={committees.filter((c) => c.isActive !== false).length}
          icon={<Users className="h-4 w-4" />}
          color="violet"
          href="/committees"
        />
        <KpiCard
          label={t("kpiPendingDecisions")}
          value={pendingDecisions.length}
          icon={<AlertCircle className="h-4 w-4" />}
          color={pendingDecisions.length > 0 ? "amber" : "green"}
          urgent={pendingDecisions.length > 0}
          href="/decisions"
        />
        <KpiCard
          label={t("kpiOverdueTasks")}
          value={overdueCount}
          icon={<Clock className="h-4 w-4" />}
          color={overdueCount > 0 ? "red" : "green"}
          urgent={overdueCount > 0}
          href="/decisions"
        />
      </div>

      {/* ── Main content grid ────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Left column — 2/3 */}
        <div className="space-y-5 lg:col-span-2">

          {/* Today's Agenda */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              title={t("todayAgenda")}
              count={todaysMeetings.length}
              href="/meetings"
              viewAllLabel={t("viewAll")}
            />
            <div className="divide-y divide-slate-100">
              {todaysMeetings.length === 0 ? (
                <EmptyState
                  icon={<CalendarCheck className="h-8 w-8 text-slate-300" />}
                  message={t("noMeetingsToday")}
                  action={<Link href="/meetings" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline">{t("scheduleFirst")} <ArrowUpRight className="h-3 w-3" /></Link>}
                />
              ) : (
                todaysMeetings.map((m) => {
                  const start = new Date(m.scheduledStart);
                  const timeStr = start.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
                  const inProgress = m.status === "IN_PROGRESS";
                  return (
                    <Link
                      key={m.id}
                      href={`/meetings/${m.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                    >
                      {/* Time */}
                      <div className="w-14 shrink-0 text-end">
                        <span className="text-[13px] font-semibold tabular-nums text-slate-700">{timeStr}</span>
                      </div>
                      {/* Status dot */}
                      <div className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        inProgress ? "bg-emerald-500 ring-2 ring-emerald-200" : "bg-indigo-400",
                      )} />
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{m.title}</p>
                        {m.committee && (
                          <p className="text-xs text-slate-500 truncate">{m.committee.name}</p>
                        )}
                      </div>
                      {/* Badge */}
                      <div className="shrink-0">
                        {inProgress ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {t("inProgress")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 border border-indigo-100">
                            {tS("PLANNED")}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 rtl:rotate-180" />
                    </Link>
                  );
                })
              )}
            </div>
          </section>

          {/* This Week */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              title={t("upcomingThisWeek")}
              count={upcomingThisWeek.length}
              href="/calendar"
              viewAllLabel={t("viewAll")}
            />
            {/* Mini week calendar */}
            <div className="px-5 pt-4 pb-3">
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day, i) => {
                  const hasMeeting = weekMeetings.some((m) => sameDay(new Date(m.scheduledStart), day));
                  const isToday = sameDay(day, now);
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex flex-col items-center rounded-lg py-2 text-center",
                        isToday ? "bg-indigo-600" : hasMeeting ? "bg-indigo-50" : "",
                      )}
                    >
                      <span className={cn(
                        "text-[10px] font-medium uppercase tracking-wide",
                        isToday ? "text-indigo-200" : "text-slate-400",
                      )}>
                        {dayLabels[i]}
                      </span>
                      <span className={cn(
                        "mt-0.5 text-sm font-semibold tabular-nums",
                        isToday ? "text-white" : hasMeeting ? "text-indigo-600" : "text-slate-600",
                      )}>
                        {day.getDate()}
                      </span>
                      <div className="mt-1 h-1.5 flex items-center justify-center">
                        {hasMeeting && !isToday && (
                          <span className="h-1 w-1 rounded-full bg-indigo-400" />
                        )}
                        {hasMeeting && isToday && (
                          <span className="h-1 w-1 rounded-full bg-white/80" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Meeting list */}
            <div className="divide-y divide-slate-100 border-t border-slate-100">
              {upcomingThisWeek.length === 0 ? (
                <EmptyState
                  icon={<CalendarDays className="h-6 w-6 text-slate-300" />}
                  message={t("noWeeklyItems")}
                  compact
                />
              ) : (
                upcomingThisWeek.map((m) => {
                  const start = new Date(m.scheduledStart);
                  return (
                    <Link
                      key={m.id}
                      href={`/meetings/${m.id}`}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-20 shrink-0">
                        <p className="text-[11px] font-medium text-slate-500">
                          {start.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" })}
                        </p>
                        <p className="text-[11px] tabular-nums text-slate-400">
                          {start.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{m.title}</p>
                        {m.committee && (
                          <p className="text-xs text-slate-400 truncate">{m.committee.name}</p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 rtl:rotate-180" />
                    </Link>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Right column — 1/3 */}
        <div className="space-y-5">

          {/* Pending Decisions */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              title={t("pendingDecisions")}
              count={pendingDecisions.length}
              countColor={pendingDecisions.length > 0 ? "amber" : undefined}
              href="/decisions"
              viewAllLabel={t("viewAll")}
            />
            <div className="divide-y divide-slate-100">
              {pendingDecisions.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 className="h-7 w-7 text-emerald-400" />}
                  message={t("noPendingDecisions")}
                  compact
                />
              ) : (
                pendingDecisions.slice(0, 6).map((d) => (
                  <Link
                    key={d.id}
                    href={`/decisions/${d.id}`}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-slate-800 truncate leading-snug">{d.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {d.meeting.committee?.name
                          ? `${d.meeting.committee.name} · ${d.meeting.title}`
                          : d.meeting.title}
                      </p>
                    </div>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 rtl:rotate-180" />
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* My Tasks */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              title={t("myTasks")}
              count={myTasks.length}
              countColor={overdueCount > 0 ? "red" : undefined}
              href="/decisions"
              viewAllLabel={t("viewAll")}
            />
            <div className="divide-y divide-slate-100">
              {myTasks.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 className="h-7 w-7 text-emerald-400" />}
                  message={t("noTasks")}
                  compact
                />
              ) : (
                myTasks.slice(0, 6).map((task) => {
                  const isOverdue = task.dueDate && task.dueDate < now;
                  const priorityColor =
                    task.priority === "CRITICAL" ? "text-red-600 bg-red-50 border-red-100" :
                    task.priority === "HIGH"     ? "text-orange-600 bg-orange-50 border-orange-100" :
                    task.priority === "MEDIUM"   ? "text-blue-600 bg-blue-50 border-blue-100" :
                                                   "text-slate-500 bg-slate-50 border-slate-100";
                  return (
                    <div key={task.id} className="flex items-start gap-3 px-4 py-3">
                      <Circle className={cn(
                        "mt-0.5 h-3.5 w-3.5 shrink-0",
                        isOverdue ? "text-red-400" : "text-slate-300",
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-[13px] font-medium leading-snug truncate",
                          isOverdue ? "text-red-700" : "text-slate-800",
                        )}>
                          {task.title}
                        </p>
                        {task.dueDate && (
                          <p className={cn("text-[11px] mt-0.5", isOverdue ? "text-red-500 font-medium" : "text-slate-400")}>
                            {isOverdue
                              ? `⚠ ${t("overdue")}`
                              : t("dueOn", { date: new Date(task.dueDate).toLocaleDateString(locale, { month: "short", day: "numeric" }) })}
                          </p>
                        )}
                      </div>
                      <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold", priorityColor)}>
                        {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ── Quick Actions ───────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
          {t("quickActions")}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { icon: Users,        labelKey: "qaNewCommittee", href: "/committees",  color: "indigo" },
            { icon: CalendarDays, labelKey: "qaNewMeeting",   href: "/meetings",    color: "blue"   },
            { icon: Upload,       labelKey: "qaUpload",       href: "/documents",   color: "violet" },
            { icon: AlertCircle,  labelKey: "qaNewDecision",  href: "/decisions",   color: "amber"  },
            { icon: CalendarCheck,labelKey: "qaCalendar",     href: "/calendar",    color: "cyan"   },
            { icon: BarChart3,    labelKey: "qaReports",      href: "/reports",     color: "purple" },
          ].map(({ icon: Icon, labelKey, href, color }) => (
            <Link key={labelKey} href={href}>
              <QuickActionCard Icon={Icon} label={t(labelKey)} color={color} />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Admin ───────────────────────────────────────────────────────── */}
      {isAdmin && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
            {t("adminControl")}
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {adminTiles.map(({ icon: Icon, labelKey, href, color, bg }) => (
              <Link key={labelKey} href={href}>
                <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 transition-all hover:border-indigo-200 hover:shadow-sm">
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", bg)}>
                    <Icon className={cn("h-4 w-4", color)} />
                  </div>
                  <span className="flex-1 text-[13px] font-medium text-slate-700">{t(labelKey)}</span>
                  <ChevronRight className="h-4 w-4 text-slate-300 rtl:rotate-180" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  label, value, icon, color, urgent, href,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "violet" | "amber" | "red" | "green";
  urgent?: boolean;
  href: string;
}) {
  const styles = {
    blue:   { icon: "bg-blue-50 text-blue-600",   val: "text-blue-700",   border: "border-blue-100"   },
    violet: { icon: "bg-violet-50 text-violet-600",val: "text-violet-700", border: "border-violet-100" },
    amber:  { icon: "bg-amber-50 text-amber-600",  val: "text-amber-700",  border: "border-amber-100"  },
    red:    { icon: "bg-red-50 text-red-600",       val: "text-red-700",    border: "border-red-100"    },
    green:  { icon: "bg-emerald-50 text-emerald-600",val:"text-emerald-700",border:"border-emerald-100" },
  }[color];

  return (
    <Link href={href}>
      <div className={cn(
        "group relative overflow-hidden rounded-xl border bg-white px-5 py-4 shadow-sm transition-all hover:shadow-md",
        urgent ? styles.border : "border-slate-200",
      )}>
        {urgent && (
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-current opacity-[0.03]" />
        )}
        <div className="flex items-start justify-between gap-2">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", styles.icon)}>
            {icon}
          </div>
          {urgent && value > 0 && (
            <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
          )}
        </div>
        <div className="mt-3">
          <p className={cn("text-2xl font-bold tabular-nums", styles.val)}>{value}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
        </div>
      </div>
    </Link>
  );
}

function SectionHeader({
  title, count, countColor, href, viewAllLabel,
}: {
  title: string;
  count?: number;
  countColor?: "amber" | "red";
  href: string;
  viewAllLabel: string;
}) {
  const badgeClass =
    countColor === "amber" ? "bg-amber-50 text-amber-700 border-amber-200" :
    countColor === "red"   ? "bg-red-50 text-red-700 border-red-200" :
                              "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {count !== undefined && (
          <span className={cn("rounded-full border px-1.5 py-0.5 text-[11px] font-semibold", badgeClass)}>
            {count}
          </span>
        )}
      </div>
      <Link
        href={href}
        className="flex items-center gap-1 text-[12px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        {viewAllLabel}
        <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function EmptyState({
  icon, message, action, compact,
}: {
  icon: React.ReactNode;
  message: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "py-6 px-4" : "py-10 px-6")}>
      <div className="mb-2 text-slate-300">{icon}</div>
      <p className="text-sm text-slate-400">{message}</p>
      {action}
    </div>
  );
}

function QuickActionCard({
  Icon, label, color,
}: {
  Icon: React.ElementType;
  label: string;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; text: string; hover: string }> = {
    indigo: { bg: "bg-indigo-50",  text: "text-indigo-600", hover: "hover:bg-indigo-100 hover:border-indigo-200" },
    blue:   { bg: "bg-blue-50",    text: "text-blue-600",   hover: "hover:bg-blue-100 hover:border-blue-200"     },
    violet: { bg: "bg-violet-50",  text: "text-violet-600", hover: "hover:bg-violet-100 hover:border-violet-200" },
    amber:  { bg: "bg-amber-50",   text: "text-amber-600",  hover: "hover:bg-amber-100 hover:border-amber-200"   },
    cyan:   { bg: "bg-cyan-50",    text: "text-cyan-600",   hover: "hover:bg-cyan-100 hover:border-cyan-200"     },
    purple: { bg: "bg-purple-50",  text: "text-purple-600", hover: "hover:bg-purple-100 hover:border-purple-200" },
  };
  const c = colorMap[color] ?? colorMap.indigo;

  return (
    <div className={cn(
      "flex flex-col items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-5 text-center transition-all cursor-pointer",
      c.hover,
    )}>
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", c.bg)}>
        <Icon className={cn("h-5 w-5", c.text)} />
      </div>
      <span className="text-[12px] font-semibold text-slate-700 leading-tight">{label}</span>
    </div>
  );
}
