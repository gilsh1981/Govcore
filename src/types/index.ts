import type { UserRole } from "@prisma/client";

/** Session user — the authenticated user with tenant context */
export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  orgId: string;
  role: UserRole;
}

/** Extend NextAuth session to include our user fields */
declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    orgId: string;
    role: UserRole;
  }
}

// ─── EVENT / MEETING TYPES ──────────────────────────────────
export type EventType = "COMMITTEE" | "MEETING" | "STANDALONE_MEETING" | "UNPLANNED_EVENT";
export type ParticipationMethod = "PHYSICAL" | "TEAMS" | "ZOOM" | "WEBEX" | "HYBRID";
export type RecurrencePattern = "NONE" | "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";

// ─── ORGANIZATION FEATURES ──────────────────────────────────
export interface OrganizationFeatures {
  committeeManagement: boolean;
  smartMinutes: boolean;
  voiceAiTranscription: boolean;
}

export interface OrganizationWithFeatures {
  id: string;
  name: string;
  slug: string;
  features: OrganizationFeatures;
}

// ─── CALENDAR EVENT ─────────────────────────────────────────
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: EventType;
  color: string;
  committeeId?: string;
  committeeName?: string;
  participationMethod?: ParticipationMethod;
  location?: string;
  meetingLink?: string;
}

// ─── ENHANCED MEETING FORM ──────────────────────────────────
export interface MeetingFormData {
  title: string;
  committeeId?: string;
  scheduledAt: string;
  endTime?: string;
  participationMethod: ParticipationMethod;
  location?: string;
  meetingLink?: string;
  recurrence: RecurrencePattern;
  memberIds: string[];
  enableAiTranscription: boolean;
}
