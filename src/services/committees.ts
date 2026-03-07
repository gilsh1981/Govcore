import { db } from "@/lib/db";
import { emitEvent } from "@/lib/events";

// ─── QUERIES ───────────────────────────────────────────────

export async function listCommittees(orgId: string) {
  return db.committee.findMany({
    where: { orgId },
    include: {
      _count: { select: { members: true, meetings: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCommittee(orgId: string, id: string) {
  return db.committee.findFirst({
    where: { id, orgId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { meetings: true } },
    },
  });
}

// ─── MUTATIONS ─────────────────────────────────────────────

interface CreateCommitteeInput {
  orgId: string;
  name: string;
  description?: string;
}

export async function createCommittee(input: CreateCommitteeInput) {
  const committee = await db.committee.create({
    data: {
      orgId: input.orgId,
      name: input.name,
      description: input.description,
    },
  });

  await emitEvent({
    orgId: input.orgId,
    type: "committee.created",
    entityId: committee.id,
    payload: { name: committee.name },
  });

  return committee;
}

interface UpdateCommitteeInput {
  orgId: string;
  id: string;
  name?: string;
  description?: string;
}

export async function updateCommittee(input: UpdateCommitteeInput) {
  // Verify the committee belongs to this org
  const existing = await db.committee.findFirst({
    where: { id: input.id, orgId: input.orgId },
  });
  if (!existing) return null;

  const committee = await db.committee.update({
    where: { id: input.id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
    },
  });

  await emitEvent({
    orgId: input.orgId,
    type: "committee.updated",
    entityId: committee.id,
    payload: { name: committee.name },
  });

  return committee;
}

export async function deleteCommittee(orgId: string, id: string) {
  const existing = await db.committee.findFirst({
    where: { id, orgId },
  });
  if (!existing) return null;

  await db.committee.delete({ where: { id } });

  await emitEvent({
    orgId,
    type: "committee.deleted",
    entityId: id,
    payload: { name: existing.name },
  });

  return existing;
}

// ─── MEMBER MANAGEMENT ────────────────────────────────────

interface AddMemberInput {
  orgId: string;
  committeeId: string;
  userId: string;
  role?: "CHAIR" | "SECRETARY" | "MEMBER";
}

export async function addMember(input: AddMemberInput) {
  // Verify committee belongs to org
  const committee = await db.committee.findFirst({
    where: { id: input.committeeId, orgId: input.orgId },
  });
  if (!committee) return null;

  // Verify user belongs to the same org
  const user = await db.user.findFirst({
    where: { id: input.userId, orgId: input.orgId },
  });
  if (!user) return null;

  const member = await db.committeeMember.create({
    data: {
      committeeId: input.committeeId,
      userId: input.userId,
      role: input.role ?? "MEMBER",
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  await emitEvent({
    orgId: input.orgId,
    type: "committee.member_added",
    entityId: input.committeeId,
    payload: { userId: input.userId, role: member.role },
  });

  return member;
}

export async function removeMember(
  orgId: string,
  committeeId: string,
  userId: string
) {
  const committee = await db.committee.findFirst({
    where: { id: committeeId, orgId },
  });
  if (!committee) return null;

  const member = await db.committeeMember.findUnique({
    where: { committeeId_userId: { committeeId, userId } },
  });
  if (!member) return null;

  await db.committeeMember.delete({
    where: { committeeId_userId: { committeeId, userId } },
  });

  await emitEvent({
    orgId,
    type: "committee.member_removed",
    entityId: committeeId,
    payload: { userId },
  });

  return member;
}
