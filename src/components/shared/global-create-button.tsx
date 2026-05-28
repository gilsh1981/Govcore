"use client";

import { useState } from "react";
import { Plus, Users, Calendar, CalendarDays, ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateCommitteeDialog } from "@/components/committees/create-committee-dialog";
import { CreateMeetingDialog } from "@/components/meetings/create-meeting-dialog";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";

interface Committee {
  id: string;
  name: string;
}

interface GlobalCreateButtonProps {
  committees?: Committee[];
}

type DialogType = "committee" | "meeting" | "event" | "task" | null;

export function GlobalCreateButton({ committees = [] }: GlobalCreateButtonProps) {
  const [open, setOpen] = useState<DialogType>(null);
  const t = useTranslations("globalCreate");

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            {t("button")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            {t("label")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen("committee")}>
            <Users className="h-4 w-4 me-2 text-violet-500" />
            {t("committee")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen("meeting")}>
            <Calendar className="h-4 w-4 me-2 text-blue-500" />
            {t("meeting")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen("event")}>
            <CalendarDays className="h-4 w-4 me-2 text-cyan-500" />
            {t("event")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen("task")}>
            <ClipboardList className="h-4 w-4 me-2 text-amber-500" />
            {t("task")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateCommitteeDialog
        open={open === "committee"}
        onOpenChange={(v) => setOpen(v ? "committee" : null)}
      />

      <CreateMeetingDialog
        committees={committees}
        open={open === "meeting"}
        onOpenChange={(v) => setOpen(v ? "meeting" : null)}
      />

      <CreateMeetingDialog
        committees={committees}
        open={open === "event"}
        onOpenChange={(v) => setOpen(v ? "event" : null)}
        defaultStandalone
      />

      <CreateTaskDialog
        open={open === "task"}
        onOpenChange={(v) => setOpen(v ? "task" : null)}
      />
    </>
  );
}
