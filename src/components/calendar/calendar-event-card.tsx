"use client";

import { useTranslations } from "next-intl";
import type { CalendarEvent } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Video, Users } from "lucide-react";

interface CalendarEventCardProps {
  event: CalendarEvent;
  onClose: () => void;
}

export function CalendarEventCard({ event, onClose }: CalendarEventCardProps) {
  const t = useTranslations("calendarEvent");

  const startStr = event.start instanceof Date
    ? event.start.toLocaleString()
    : new Date(event.start).toLocaleString();

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Badge style={{ backgroundColor: event.color, color: "white" }}>
            {t(event.type)}
          </Badge>
          <p className="text-sm text-muted-foreground">{startStr}</p>
          {event.committeeName && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              {event.committeeName}
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {event.location}
            </div>
          )}
          {event.meetingLink && (
            <div className="flex items-center gap-2 text-sm">
              <Video className="h-4 w-4 text-muted-foreground" />
              <a
                href={event.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {t("joinLink")}
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
