"use client";

import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useLocale } from "next-intl";
import type { CalendarEvent } from "@/types";
import { CalendarToolbar } from "./calendar-toolbar";
import { CalendarEventCard } from "./calendar-event-card";

interface CalendarViewProps {
  events: CalendarEvent[];
}

export function CalendarView({ events }: CalendarViewProps) {
  const locale = useLocale();
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentView, setCurrentView] = useState<string>("dayGridMonth");
  const [title, setTitle] = useState("");

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) setTitle(api.view.title);
  }, []);

  const fcEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    backgroundColor: e.color,
    borderColor: e.color,
    extendedProps: {
      type: e.type,
      committeeName: e.committeeName,
      participationMethod: e.participationMethod,
      location: e.location,
      meetingLink: e.meetingLink,
    },
  }));

  function handleViewChange(view: string) {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.changeView(view);
      setCurrentView(view);
      setTitle(api.view.title);
    }
  }

  function handleNav(action: "prev" | "next" | "today") {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    if (action === "prev") api.prev();
    else if (action === "next") api.next();
    else api.today();
    setTitle(api.view.title);
  }

  function handleEventClick(info: { event: { id: string } }) {
    const event = events.find((e) => e.id === info.event.id);
    if (event) setSelectedEvent(event);
  }

  return (
    <div className="space-y-4">
      <CalendarToolbar
        currentView={currentView}
        onViewChange={handleViewChange}
        onNav={handleNav}
        title={title}
      />
      <div className="rounded-lg border bg-card p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={fcEvents}
          eventClick={handleEventClick}
          locale={locale}
          direction={locale === "he" ? "rtl" : "ltr"}
          headerToolbar={false}
          height="auto"
          dayMaxEvents={3}
          datesSet={() => {
            const api = calendarRef.current?.getApi();
            if (api) setTitle(api.view.title);
          }}
        />
      </div>
      {selectedEvent && (
        <CalendarEventCard
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
