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
} from "lucide-react";

type LucideIcon = typeof LayoutDashboard;

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("sidebar");

  const navItems: NavItem[] = [
    { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
    { href: "/committees", labelKey: "committees", icon: Users },
    { href: "/calendar", labelKey: "calendar", icon: Calendar },
    { href: "/reports", labelKey: "reports", icon: BarChart3 },
    { href: "/organization", labelKey: "organization", icon: Building2 },
    { href: "/settings", labelKey: "settings", icon: Settings },
  ];

  return (
    <aside className="flex h-full w-64 flex-col border-e bg-sidebar text-sidebar-foreground">
      <div className="p-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="text-sidebar-primary-foreground">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold tracking-tight">{t("appName")}</h1>
        </div>
      </div>
      <Separator />
      <nav className="flex-1 p-4 space-y-1">
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
                "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              {isActive && (
                <span className="absolute inset-y-1 end-0 w-0.5 rounded-full bg-indigo-400" />
              )}
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-400" : "text-slate-500")} />
              {t(item.labelKey)}
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
