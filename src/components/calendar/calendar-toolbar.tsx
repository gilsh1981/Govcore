"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarToolbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onNav: (action: "prev" | "next" | "today") => void;
  title: string;
}

export function CalendarToolbar({
  currentView,
  onViewChange,
  onNav,
  title,
}: CalendarToolbarProps) {
  const t = useTranslations("calendar");

  const views = [
    { key: "dayGridMonth", label: t("month") },
    { key: "timeGridWeek", label: t("week") },
    { key: "timeGridDay", label: t("day") },
  ];

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => onNav("prev")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => onNav("next")}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNav("today")}>
          {t("today")}
        </Button>
        <h2 className="text-lg font-semibold ms-2">{title}</h2>
      </div>
      <div className="flex gap-1">
        {views.map((v) => (
          <Button
            key={v.key}
            variant={currentView === v.key ? "default" : "outline"}
            size="sm"
            onClick={() => onViewChange(v.key)}
          >
            {v.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
