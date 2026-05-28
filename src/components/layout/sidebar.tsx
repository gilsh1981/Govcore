"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LanguageToggle } from "@/components/layout/language-toggle";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Building2,
  Settings,
  ShieldCheck,
  CalendarDays,
  CheckSquare,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",    labelKey: "dashboard",    icon: LayoutDashboard },
  { href: "/committees",   labelKey: "committees",   icon: Users },
  { href: "/meetings",     labelKey: "meetings",     icon: CalendarDays },
  { href: "/decisions",    labelKey: "decisions",    icon: CheckSquare },
  { href: "/calendar",     labelKey: "calendar",     icon: Calendar },
  { href: "/reports",      labelKey: "reports",      icon: BarChart3 },
] as const;

const BOTTOM_ITEMS = [
  { href: "/organization", labelKey: "organization", icon: Building2 },
  { href: "/permissions",  labelKey: "permissions",  icon: ShieldCheck },
  { href: "/settings",     labelKey: "settings",     icon: Settings },
] as const;

type NavItemProps = {
  href: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  label: string;
};

function NavLink({ href, icon: Icon, active, label }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-100",
        active
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
      )}
    >
      {/* Active pill on the inner edge — end-0 = right in LTR, left in RTL */}
      {active && (
        <span className="absolute inset-y-2 end-0 w-[3px] rounded-full bg-indigo-600" />
      )}
      <Icon
        className={cn(
          "h-[15px] w-[15px] shrink-0 transition-colors",
          active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600",
        )}
      />
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("sidebar");

  function isActive(href: string) {
    return href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);
  }

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-e border-slate-200/80 bg-white/95 backdrop-blur-sm">

      {/* Brand */}
      <div className="flex h-[60px] shrink-0 items-center gap-2.5 border-b border-slate-100 px-5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-600">
          <svg
            width="14" height="14"
            fill="none" viewBox="0 0 24 24"
            strokeWidth={1.5} stroke="currentColor"
            className="text-white"
          >
            <path
              strokeLinecap="round" strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
            />
          </svg>
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-slate-800">
          {t("appName")}
        </span>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, labelKey, icon }) => (
          <NavLink
            key={href}
            href={href}
            labelKey={labelKey}
            icon={icon}
            active={isActive(href)}
            label={t(labelKey)}
          />
        ))}
      </nav>

      {/* Bottom: org / permissions / settings + language */}
      <div className="shrink-0 border-t border-slate-100 px-3 py-3 space-y-0.5">
        {BOTTOM_ITEMS.map(({ href, labelKey, icon }) => (
          <NavLink
            key={href}
            href={href}
            labelKey={labelKey}
            icon={icon}
            active={isActive(href)}
            label={t(labelKey)}
          />
        ))}
        <div className="pt-2">
          <LanguageToggle />
        </div>
      </div>
    </aside>
  );
}
