"use client";

import { useState } from "react";
import { Plus, Users, Calendar, CalendarDays, CheckSquare, ClipboardList } from "lucide-react";
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

type DialogType = "committee" | "meeting" | "event" | "decision" | "task" | null;

export function GlobalCreateButton({ committees = [] }: GlobalCreateButtonProps) {
  const [open, setOpen] = useState<DialogType>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            What would you like to create?
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen("committee")}>
            <Users className="h-4 w-4 me-2 text-violet-500" />
            New Committee
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen("meeting")}>
            <Calendar className="h-4 w-4 me-2 text-blue-500" />
            New Meeting
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen("event")}>
            <CalendarDays className="h-4 w-4 me-2 text-cyan-500" />
            New Event
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen("task")}>
            <ClipboardList className="h-4 w-4 me-2 text-amber-500" />
            New Task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Committee dialog */}
      <CreateCommitteeDialog
        open={open === "committee"}
        onOpenChange={(v) => setOpen(v ? "committee" : null)}
      />

      {/* Meeting dialog */}
      <CreateMeetingDialog
        committees={committees}
        open={open === "meeting"}
        onOpenChange={(v) => setOpen(v ? "meeting" : null)}
      />

      {/* Event dialog (standalone / unplanned) */}
      <CreateMeetingDialog
        committees={committees}
        open={open === "event"}
        onOpenChange={(v) => setOpen(v ? "event" : null)}
        defaultStandalone
      />

      {/* Task dialog */}
      <CreateTaskDialog
        open={open === "task"}
        onOpenChange={(v) => setOpen(v ? "task" : null)}
      />
    </>
  );
}
