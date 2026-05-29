"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { OrgSwitcher } from "./org-switcher";
import { UserMenu } from "./user-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Search } from "lucide-react";

export function Header() {
  const { data: session } = useSession();
  const t = useTranslations("header");

  if (!session) return null;

  return (
    <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/95 px-5 backdrop-blur-sm">

      {/* Left: org switcher */}
      <OrgSwitcher orgName={session.user.orgName} />

      {/* Divider */}
      <div className="h-5 w-px bg-slate-200" />

      {/* Centre: search — hidden on small screens */}
      <div className="hidden flex-1 md:block max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder={t("searchShort")}
            className="h-8 border-slate-200 bg-slate-50 ps-9 text-sm focus:bg-white"
          />
        </div>
      </div>

      {/* Right: actions */}
      <div className="ms-auto flex items-center gap-1">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8 text-slate-500 hover:text-slate-800">
          <Bell className="h-4 w-4" />
          {/* Dot for unread — hidden when zero, shown when there are notifications */}
          {/* <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" /> */}
        </Button>

        <div className="h-5 w-px bg-slate-200 mx-1" />

        {/* User menu */}
        <UserMenu />
      </div>
    </header>
  );
}
