"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { LanguageToggle } from "@/components/layout/language-toggle";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Building2,
  Settings,
  ShieldCheck,
} from "lucide-react";

type LucideIcon = typeof LayoutDashboard;

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  label?: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("sidebar");

  const navItems: NavItem[] = [
    { href: "/dashboard",    label: "Dashboard",    labelKey: "dashboard",    icon: LayoutDashboard },
    { href: "/committees",   label: "Committees",   labelKey: "committees",   icon: Users },
    { href: "/calendar",     label: "Calendar",     labelKey: "calendar",     icon: Calendar },
    { href: "/reports",      label: "Reports",      labelKey: "reports",      icon: BarChart3 },
    { href: "/organization", label: "Organization", labelKey: "organization", icon: Building2 },
    { href: "/permissions",  label: "Permissions",  labelKey: "permissions",  icon: ShieldCheck },
    { href: "/settings",     label: "Settings",     labelKey: "settings",     icon: Settings },
  ];

  return (
    <aside className="flex h-full w-64 flex-col border-e bg-sidebar text-sidebar-foreground shadow-sm">
      <div className="p-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="text-white">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-800">{t("appName")}</h1>
        </div>
      </div>
      <Separator />
      <nav className="flex-1 p-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {isActive && (
                <span className="absolute inset-y-1.5 end-0 w-0.5 rounded-full bg-indigo-600" />
              )}
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-600" : "text-slate-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Separator />
      <div className="p-4">
        <LanguageToggle />
      </div>
    </aside>
  );
}
