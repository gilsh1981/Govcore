import type { OrganizationWithFeatures, CalendarEvent, EventType } from "@/types";

// ─── MOCK ORGANIZATIONS ─────────────────────────────────────
export const mockOrganizations: OrganizationWithFeatures[] = [
  {
    id: "org-1",
    name: "Demo Cooperative",
    slug: "demo-cooperative",
    features: {
      committeeManagement: true,
      smartMinutes: true,
      voiceAiTranscription: false,
    },
  },
  {
    id: "org-2",
    name: "City Council Alpha",
    slug: "city-council-alpha",
    features: {
      committeeManagement: true,
      smartMinutes: true,
      voiceAiTranscription: true,
    },
  },
  {
    id: "org-3",
    name: "Regional Board Beta",
    slug: "regional-board-beta",
    features: {
      committeeManagement: true,
      smartMinutes: false,
      voiceAiTranscription: false,
    },
  },
];

// ─── EVENT TYPE COLORS ──────────────────────────────────────
export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  COMMITTEE: "#6366f1",
  MEETING: "#3b82f6",
  STANDALONE_MEETING: "#8b5cf6",
  UNPLANNED_EVENT: "#f59e0b",
};

// ─── MOCK CALENDAR EVENTS ───────────────────────────────────
export function generateMockCalendarEvents(): CalendarEvent[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const events: CalendarEvent[] = [
    {
      id: "mock-1",
      title: "Budget Review Committee",
      start: new Date(year, month, 3, 10, 0),
      end: new Date(year, month, 3, 12, 0),
      type: "COMMITTEE",
      color: EVENT_TYPE_COLORS.COMMITTEE,
      committeeName: "Finance Committee",
    },
    {
      id: "mock-2",
      title: "Weekly Standup",
      start: new Date(year, month, 5, 9, 0),
      end: new Date(year, month, 5, 9, 30),
      type: "MEETING",
      color: EVENT_TYPE_COLORS.MEETING,
      committeeName: "Engineering",
      participationMethod: "TEAMS",
      meetingLink: "https://teams.microsoft.com/meet/123",
    },
    {
      id: "mock-3",
      title: "Board Strategy Session",
      start: new Date(year, month, 8, 14, 0),
      end: new Date(year, month, 8, 17, 0),
      type: "COMMITTEE",
      color: EVENT_TYPE_COLORS.COMMITTEE,
      committeeName: "Board of Directors",
      participationMethod: "HYBRID",
      location: "Main Conference Room",
    },
    {
      id: "mock-4",
      title: "Emergency Security Briefing",
      start: new Date(year, month, 10, 8, 0),
      end: new Date(year, month, 10, 9, 0),
      type: "UNPLANNED_EVENT",
      color: EVENT_TYPE_COLORS.UNPLANNED_EVENT,
    },
    {
      id: "mock-5",
      title: "Vendor Evaluation",
      start: new Date(year, month, 12, 11, 0),
      end: new Date(year, month, 12, 12, 30),
      type: "STANDALONE_MEETING",
      color: EVENT_TYPE_COLORS.STANDALONE_MEETING,
      participationMethod: "ZOOM",
      meetingLink: "https://zoom.us/j/456",
    },
    {
      id: "mock-6",
      title: "HR Policy Committee",
      start: new Date(year, month, 14, 10, 0),
      end: new Date(year, month, 14, 12, 0),
      type: "COMMITTEE",
      color: EVENT_TYPE_COLORS.COMMITTEE,
      committeeName: "HR Committee",
      participationMethod: "PHYSICAL",
      location: "Room 302",
    },
    {
      id: "mock-7",
      title: "Q1 Retrospective",
      start: new Date(year, month, 16, 15, 0),
      end: new Date(year, month, 16, 16, 30),
      type: "MEETING",
      color: EVENT_TYPE_COLORS.MEETING,
      committeeName: "Product Team",
      participationMethod: "TEAMS",
    },
    {
      id: "mock-8",
      title: "Compliance Review",
      start: new Date(year, month, 18, 9, 0),
      end: new Date(year, month, 18, 11, 0),
      type: "COMMITTEE",
      color: EVENT_TYPE_COLORS.COMMITTEE,
      committeeName: "Compliance Committee",
    },
    {
      id: "mock-9",
      title: "Town Hall",
      start: new Date(year, month, 20, 16, 0),
      end: new Date(year, month, 20, 17, 0),
      type: "STANDALONE_MEETING",
      color: EVENT_TYPE_COLORS.STANDALONE_MEETING,
      participationMethod: "HYBRID",
      location: "Auditorium",
    },
    {
      id: "mock-10",
      title: "Infrastructure Incident Debrief",
      start: new Date(year, month, 22, 10, 0),
      end: new Date(year, month, 22, 11, 0),
      type: "UNPLANNED_EVENT",
      color: EVENT_TYPE_COLORS.UNPLANNED_EVENT,
    },
    {
      id: "mock-11",
      title: "Annual Budget Planning",
      start: new Date(year, month, 24, 9, 0),
      end: new Date(year, month, 24, 13, 0),
      type: "COMMITTEE",
      color: EVENT_TYPE_COLORS.COMMITTEE,
      committeeName: "Finance Committee",
      participationMethod: "PHYSICAL",
      location: "Board Room",
    },
    {
      id: "mock-12",
      title: "Partner Sync",
      start: new Date(year, month, 26, 14, 0),
      end: new Date(year, month, 26, 15, 0),
      type: "STANDALONE_MEETING",
      color: EVENT_TYPE_COLORS.STANDALONE_MEETING,
      participationMethod: "WEBEX",
      meetingLink: "https://webex.com/meet/789",
    },
    {
      id: "mock-13",
      title: "Ethics Committee",
      start: new Date(year, month, 28, 10, 0),
      end: new Date(year, month, 28, 12, 0),
      type: "COMMITTEE",
      color: EVENT_TYPE_COLORS.COMMITTEE,
      committeeName: "Ethics Committee",
    },
  ];

  return events;
}

// ─── MOCK USERS ─────────────────────────────────────────────
export const mockUsers = [
  { id: "user-1", name: "Admin User", email: "admin@govcore.local" },
  { id: "user-2", name: "Sarah Cohen", email: "sarah@govcore.local" },
  { id: "user-3", name: "David Levy", email: "david@govcore.local" },
  { id: "user-4", name: "Rachel Green", email: "rachel@govcore.local" },
  { id: "user-5", name: "Michael Stern", email: "michael@govcore.local" },
];
