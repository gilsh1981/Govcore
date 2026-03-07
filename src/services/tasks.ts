import type { TaskStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { emitEvent } from "@/lib/events";
import { validateTransition, logStatusTransition, WorkflowError, WorkflowPermissionError } from "@/services/workflow";

// ─── QUERIES ───────────────────────────────────────────────

export async function listTasks(
  organizationId: string,
  filters?: {
    assignedToId?: string;
    status?: TaskStatus;
    meetingId?: string;
    decisionId?: string;
    overdue?: boolean;
  }
) {
  const where: Prisma.TaskWhereInput = { organizationId, deletedAt: null };
  if (filters?.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters?.status) where.status = filters.status;
  if (filters?.meetingId) where.meetingId = filters.meetingId;
  if (filters?.decisionId) where.decisionId = filters.decisionId;
  if (filters?.overdue) where.dueDate = { lt: new Date() };

  return db.task.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      meeting: { select: { id: true, title: true } },
      decision: { select: { id: true, title: true } },
    },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
  });
}

export async function getTask(organizationId: string, id: string) {
  return db.task.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      meeting: { select: { id: true, title: true, committeeId: true } },
      decision: { select: { id: true, title: true } },
    },
  });
}

// ─── MUTATIONS ─────────────────────────────────────────────

interface CreateTaskInput {
  organizationId: string;
  title: string;
  description?: string;
  meetingId?: string;
  decisionId?: string;
  assignedToId?: string;
  dueDate?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  createdById: string;
}

export async function createTask(input: CreateTaskInput) {
  // Meeting model still uses orgId field
  if (input.meetingId) {
    const meeting = await db.meeting.findFirst({
      where: { id: input.meetingId, orgId: input.organizationId, deletedAt: null },
    });
    if (!meeting) return null;
  }

  // Decision model uses organizationId field
  if (input.decisionId) {
    const decision = await db.decision.findFirst({
      where: { id: input.decisionId, organizationId: input.organizationId, deletedAt: null },
    });
    if (!decision) return null;
  }

  const task = await db.task.create({
    data: {
      organizationId: input.organizationId,
      title: input.title,
      description: input.description,
      meetingId: input.meetingId,
      decisionId: input.decisionId,
      assignedToId: input.assignedToId,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      priority: input.priority ?? "MEDIUM",
      createdById: input.createdById,
    },
  });

  await emitEvent({
    orgId: input.organizationId,
    type: "task.created",
    entityId: task.id,
    payload: { title: task.title, assignedToId: task.assignedToId },
  });

  return task;
}

interface UpdateTaskInput {
  organizationId: string;
  id: string;
  title?: string;
  description?: string | null;
  assignedToId?: string | null;
  dueDate?: string | null;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export async function updateTask(input: UpdateTaskInput) {
  const existing = await db.task.findFirst({
    where: { id: input.id, organizationId: input.organizationId, deletedAt: null },
  });
  if (!existing) return null;

  const data: Prisma.TaskUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.assignedToId !== undefined) {
    data.assignedTo = input.assignedToId
      ? { connect: { id: input.assignedToId } }
      : { disconnect: true };
  }
  if (input.dueDate !== undefined) {
    data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  }
  if (input.priority !== undefined) data.priority = input.priority;

  const task = await db.task.update({ where: { id: input.id }, data });

  await emitEvent({
    orgId: input.organizationId,
    type: "task.updated",
    entityId: task.id,
    payload: { title: task.title },
  });

  return task;
}

export async function deleteTask(organizationId: string, id: string) {
  const existing = await db.task.findFirst({
    where: { id, organizationId, deletedAt: null },
  });
  if (!existing) return null;

  const task = await db.task.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await emitEvent({
    orgId: organizationId,
    type: "task.updated",
    entityId: id,
    payload: { title: existing.title, deleted: true },
  });

  return task;
}

// ─── STATUS TRANSITIONS ───────────────────────────────────

export async function transitionTaskStatus(
  organizationId: string,
  id: string,
  newStatus: TaskStatus,
  actingUserId: string
) {
  const existing = await db.task.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      meeting: { select: { committeeId: true } },
    },
  });
  if (!existing) return null;

  if (!validateTransition("task", existing.status, newStatus)) {
    throw new WorkflowError(`Cannot transition from ${existing.status} to ${newStatus}`);
  }

  // Permission: assignee, ADMIN, or committee CHAIR
  if (actingUserId !== existing.assignedToId) {
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
        "Only the assignee, ADMIN, or committee CHAIR can update this task's status"
      );
    }
  }

  const task = await db.task.update({
    where: { id },
    data: { status: newStatus },
  });

  await logStatusTransition({
    entityType: "task",
    entityId: id,
    fromStatus: existing.status,
    toStatus: newStatus,
    changedById: actingUserId,
  });

  const eventType =
    newStatus === "COMPLETED"
      ? "task.completed"
      : newStatus === "CANCELLED"
        ? "task.cancelled"
        : "task.updated";

  await emitEvent({
    orgId: organizationId,
    type: eventType,
    entityId: task.id,
    payload: { title: task.title, from: existing.status, to: newStatus },
  });

  return task;
}

export { WorkflowError, WorkflowPermissionError };
