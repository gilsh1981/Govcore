import type { Prisma } from "@prisma/client";
import { db } from "./db";

export type DomainEventType =
  | "committee.created"
  | "committee.updated"
  | "committee.deleted"
  | "committee.member_added"
  | "committee.member_removed"
  | "meeting.created"
  | "meeting.updated"
  | "meeting.started"
  | "meeting.completed"
  | "meeting.cancelled"
  | "meeting.minutes_updated"
  | "decision.created"
  | "decision.updated"
  | "decision.proposed"
  | "decision.approved"
  | "decision.rejected"
  | "decision.archived"
  | "task.created"
  | "task.updated"
  | "task.completed"
  | "task.cancelled";

interface DomainEvent {
  orgId: string;
  type: DomainEventType;
  entityId: string;
  payload: Prisma.InputJsonValue;
}

export async function emitEvent(event: DomainEvent) {
  return db.auditLog.create({
    data: {
      orgId: event.orgId,
      type: event.type,
      entityId: event.entityId,
      payload: event.payload,
    },
  });

  // Future hooks:
  // - Publish to message queue (BullMQ, Inngest, etc.)
  // - Trigger webhook delivery
  // - Feed AI processing pipeline
  // - Push real-time notifications
}
