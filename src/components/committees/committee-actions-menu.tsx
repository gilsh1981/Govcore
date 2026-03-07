"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Plus, Users, Calendar, Zap, FileQuestion } from "lucide-react";

interface CommitteeActionsMenuProps {
  onAction: (action: "committee" | "meeting" | "standalone" | "unplanned") => void;
}

export function CommitteeActionsMenu({ onAction }: CommitteeActionsMenuProps) {
  const { data: session } = useSession();
  const t = useTranslations("committeeActions");

  if (session?.user.role !== "ADMIN") return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="me-2 h-4 w-4" />
          {t("newAction")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onAction("committee")}>
          <Users className="me-2 h-4 w-4" />
          {t("newCommittee")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction("meeting")}>
          <Calendar className="me-2 h-4 w-4" />
          {t("newMeeting")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("standalone")}>
          <Zap className="me-2 h-4 w-4" />
          {t("standaloneMeeting")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("unplanned")}>
          <FileQuestion className="me-2 h-4 w-4" />
          {t("unplannedEvent")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
