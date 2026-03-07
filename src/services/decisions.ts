import type { DecisionStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { emitEvent } from "@/lib/events";
import { validateTransition, logStatusTransition, WorkflowError, WorkflowPermissionError } from "@/services/workflow";

// ─── QUERIES ───────────────────────────────────────────────

export async function listDecisions(
  organizationId: string,
  filters?: {
    meetingId?: string;
    status?: DecisionStatus;
    proposedById?: string;
  }
) {
  const where: Prisma.DecisionWhereInput = { organizationId, deletedAt: null };
  if (filters?.meetingId) where.meetingId = filters.meetingId;
  if (filters?.status) where.status = filters.status;
  if (filters?.proposedById) where.proposedById = filters.proposedById;

  return db.decision.findMany({
    where,
    include: {
      meeting: { select: { id: true, title: true } },
      proposedBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDecision(organizationId: string, id: string) {
  return db.decision.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      meeting: { select: { id: true, title: true, committeeId: true } },
      proposedBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      tasks: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

// ─── MUTATIONS ─────────────────────────────────────────────

interface CreateDecisionInput {
  organizationId: string;
  meetingId: string;
  title: string;
  description?: string;
  createdById: string;
}

export async function createDecision(input: CreateDecisionInput) {
  // Meeting model still uses orgId field
  const meeting = await db.meeting.findFirst({
    where: { id: input.meetingId, orgId: input.organizationId, deletedAt: null },
  });
  if (!meeting) return null;

  const decision = await db.decision.create({
    data: {
      organizationId: input.organizationId,
      meetingId: input.meetingId,
      title: input.title,
      description: input.description,
      proposedById: input.createdById,
      createdById: input.createdById,
    },
  });

  await emitEvent({
    orgId: input.organizationId,
    type: "decision.proposed",
    entityId: decision.id,
    payload: { title: decision.title, meetingId: decision.meetingId },
  });

  return decision;
}

interface UpdateDecisionInput {
  organizationId: string;
  id: string;
  title?: string;
  description?: string | null;
}

export async function updateDecision(input: UpdateDecisionInput) {
  const existing = await db.decision.findFirst({
    where: { id: input.id, organizationId: input.organizationId, deletedAt: null },
  });
  if (!existing) return null;

  const data: Prisma.DecisionUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;

  const decision = await db.decision.update({ where: { id: input.id }, data });

  await emitEvent({
    orgId: input.organizationId,
    type: "decision.updated",
    entityId: decision.id,
    payload: { title: decision.title },
  });

  return decision;
}

export async function deleteDecision(organizationId: string, id: string) {
  const existing = await db.decision.findFirst({
    where: { id, organizationId, deletedAt: null },
  });
  if (!existing) return null;

  const decision = await db.decision.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await emitEvent({
    orgId: organizationId,
    type: "decision.updated",
    entityId: id,
    payload: { title: existing.title, deleted: true },
  });

  return decision;
}

// ─── STATUS TRANSITIONS ───────────────────────────────────

export async function transitionDecisionStatus(
  organizationId: string,
  id: string,
  newStatus: DecisionStatus,
  actingUserId: string
) {
  const existing = await db.decision.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: { meeting: { select: { committeeId: true } } },
  });
  if (!existing) return null;

  if (!validateTransition("decision", existing.status, newStatus)) {
    throw new WorkflowError(`Cannot transition from ${existing.status} to ${newStatus}`);
  }

  // APPROVED and REJECTED require ADMIN or committee CHAIR
  if (newStatus === "APPROVED" || newStatus === "REJECTED") {
    const actingUser = await db.user.findUnique({
      where: { id: actingUserId },
      select: { role: true },
    });

    let permitted = actingUser?.role === "ADMIN";

    if (!permitted && existing.meeting?.committeeId) {
      const membership = await db.committeeMember.findFirst({
        where: {
          committeeId: existing.meeting.committeeId,
          userId: actingUserId,
          role: "CHAIR",
        },
      });
      permitted = !!membership;
    }

    if (!permitted) {
      throw new WorkflowPermissionError(
        "Only ADMIN or committee CHAIR can approve or reject decisions"
      );
    }
  }

  const decision = await db.decision.update({
    where: { id },
    data: {
      status: newStatus,
      ...(newStatus === "APPROVED" && {
        approvedById: actingUserId,
        approvedAt: new Date(),
      }),
    },
  });

  await logStatusTransition({
    entityType: "decision",
    entityId: id,
    fromStatus: existing.status,
    toStatus: newStatus,
    changedById: actingUserId,
  });

  const eventType =
    newStatus === "APPROVED"
      ? "decision.approved"
      : newStatus === "REJECTED"
        ? "decision.rejected"
        : "decision.archived";

  await emitEvent({
    orgId: organizationId,
    type: eventType,
    entityId: decision.id,
    payload: { title: decision.title, from: existing.status, to: newStatus },
  });

  return decision;
}

export { WorkflowError, WorkflowPermissionError };
