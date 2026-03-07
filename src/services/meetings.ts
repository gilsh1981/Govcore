import type { MeetingStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { emitEvent } from "@/lib/events";

// ─── QUERIES ───────────────────────────────────────────────

export async function listMeetings(
  orgId: string,
  filters?: { committeeId?: string; status?: MeetingStatus }
) {
  const where: Prisma.MeetingWhereInput = { orgId };
  if (filters?.committeeId) where.committeeId = filters.committeeId;
  if (filters?.status) where.status = filters.status;

  return db.meeting.findMany({
    where,
    include: {
      committee: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { decisions: true } },
    },
    orderBy: { scheduledStart: "desc" },
  });
}

export async function getMeeting(orgId: string, id: string) {
  return db.meeting.findFirst({
    where: { id, orgId },
    include: {
      committee: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      decisions: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

// ─── MUTATIONS ─────────────────────────────────────────────

interface CreateMeetingInput {
  orgId: string;
  committeeId: string;
  title: string;
  scheduledAt: string; // ISO date string from the client
  createdById: string;
}

export async function createMeeting(input: CreateMeetingInput) {
  // Verify committee belongs to this org
  const committee = await db.committee.findFirst({
    where: { id: input.committeeId, orgId: input.orgId },
  });
  if (!committee) return null;

  const meeting = await db.meeting.create({
    data: {
      orgId: input.orgId,
      committeeId: input.committeeId,
      title: input.title,
      scheduledStart: new Date(input.scheduledAt),
      createdById: input.createdById,
    },
  });

  await emitEvent({
    orgId: input.orgId,
    type: "meeting.created",
    entityId: meeting.id,
    payload: { title: meeting.title, committeeId: meeting.committeeId },
  });

  return meeting;
}

interface UpdateMeetingInput {
  orgId: string;
  id: string;
  title?: string;
  scheduledAt?: string;
}

export async function updateMeeting(input: UpdateMeetingInput) {
  const existing = await db.meeting.findFirst({
    where: { id: input.id, orgId: input.orgId },
  });
  if (!existing) return null;

  const meeting = await db.meeting.update({
    where: { id: input.id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.scheduledAt !== undefined && {
        scheduledStart: new Date(input.scheduledAt),
      }),
    },
  });

  await emitEvent({
    orgId: input.orgId,
    type: "meeting.updated",
    entityId: meeting.id,
    payload: { title: meeting.title },
  });

  return meeting;
}

export async function deleteMeeting(orgId: string, id: string) {
  const existing = await db.meeting.findFirst({
    where: { id, orgId },
  });
  if (!existing) return null;

  await db.meeting.delete({ where: { id } });

  await emitEvent({
    orgId,
    type: "meeting.cancelled",
    entityId: id,
    payload: { title: existing.title },
  });

  return existing;
}

// ─── STATUS TRANSITIONS ───────────────────────────────────

const VALID_TRANSITIONS: Record<MeetingStatus, MeetingStatus[]> = {
  PLANNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export async function transitionMeetingStatus(
  orgId: string,
  id: string,
  newStatus: MeetingStatus
) {
  const existing = await db.meeting.findFirst({
    where: { id, orgId },
  });
  if (!existing) return null;

  const allowed = VALID_TRANSITIONS[existing.status];
  if (!allowed.includes(newStatus)) {
    return { error: `Cannot transition from ${existing.status} to ${newStatus}` };
  }

  const meeting = await db.meeting.update({
    where: { id },
    data: { status: newStatus },
  });

  const eventType =
    newStatus === "IN_PROGRESS"
      ? "meeting.started"
      : newStatus === "COMPLETED"
        ? "meeting.completed"
        : "meeting.cancelled";

  await emitEvent({
    orgId,
    type: eventType,
    entityId: meeting.id,
    payload: { title: meeting.title, from: existing.status, to: newStatus },
  });

  return meeting;
}

// ─── MINUTES ──────────────────────────────────────────────

export async function updateMinutes(
  orgId: string,
  id: string,
  minutes: Prisma.InputJsonValue
) {
  const existing = await db.meeting.findFirst({
    where: { id, orgId },
  });
  if (!existing) return null;

  const meeting = await db.meeting.update({
    where: { id },
    data: { minutes },
  });

  await emitEvent({
    orgId,
    type: "meeting.minutes_updated",
    entityId: meeting.id,
    payload: { title: meeting.title },
  });

  return meeting;
}
