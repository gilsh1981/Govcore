"use client";

import { useSession } from "next-auth/react";
import { OrgSwitcher } from "./org-switcher";
import { UserMenu } from "./user-menu";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export function Header() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-6">
      <OrgSwitcher currentOrgId={session.user.orgId} />

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <UserMenu />
      </div>
    </header>
  );
}
