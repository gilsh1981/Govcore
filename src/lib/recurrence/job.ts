/**
 * BullMQ job: expand recurrence rules and create Meeting rows
 * for the next 90-day rolling window.
 *
 * Schedule this job to run once per day via a cron repeatable.
 *
 * Usage (from your app startup):
 *   import { scheduleRecurrenceJob } from "@/lib/recurrence/job";
 *   scheduleRecurrenceJob();
 */
import { createQueue, createWorker, QUEUE_RECURRENCE } from "@/lib/queue";
import { expandRule } from "./engine";
import { db } from "@/lib/db";
import { emitEvent } from "@/lib/events";

const queue = createQueue(QUEUE_RECURRENCE);

/** Add a repeatable daily job that expands all active recurrence rules. */
export function scheduleRecurrenceJob() {
  queue.add(
    "expand-all",
    {},
    {
      repeat: { pattern: "0 2 * * *" }, // 02:00 UTC daily
      jobId: "recurrence-daily",
    },
  );

  const worker = createWorker(QUEUE_RECURRENCE, async () => {
    await expandAllRules();
  });

  worker.on("failed", (job, err) => {
    console.error("[recurrence] job failed", job?.id, err);
  });

  return worker;
}

/** Trigger expansion immediately (for on-demand use). */
export async function triggerRecurrenceExpansion() {
  return queue.add("expand-all-now", {});
}

// ─── Core expansion logic ─────────────────────────────────────────────────────

async function expandAllRules() {
  const rules = await db.recurrenceRule.findMany({
    where: {
      OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
    },
  });

  for (const rule of rules) {
    await expandRuleForCommittees(rule);
    await expandRuleForMeetings(rule);
  }
}

async function expandRuleForCommittees(rule: Awaited<ReturnType<typeof db.recurrenceRule.findFirst>> & object) {
  if (!rule) return;
  const committees = await db.committee.findMany({
    where: { recurrenceRuleId: rule.id, deletedAt: null },
    select: { id: true, orgId: true, name: true },
  });

  for (const committee of committees) {
    const occurrences = expandRule(rule);
    for (const instanceId of occurrences) {
      const existing = await db.meeting.findFirst({
        where: {
          committeeId: committee.id,
          recurrenceRuleId: rule.id,
          recurrenceInstanceId: instanceId,
        },
      });
      if (existing) continue;

      const scheduledStart = new Date(`${instanceId}T09:00:00.000Z`);
      const meeting = await db.meeting.create({
        data: {
          orgId: committee.orgId,
          committeeId: committee.id,
          title: committee.name,
          scheduledStart,
          recurrenceRuleId: rule.id,
          recurrenceInstanceId: instanceId,
        },
      });

      await emitEvent({
        orgId: committee.orgId,
        type: "meeting.created",
        entityId: meeting.id,
        payload: { source: "recurrence", instanceId },
      });
    }
  }
}

async function expandRuleForMeetings(rule: Awaited<ReturnType<typeof db.recurrenceRule.findFirst>> & object) {
  if (!rule) return;
  // Standalone recurring meetings (no committeeId) are handled here
  const templateMeetings = await db.meeting.findMany({
    where: {
      recurrenceRuleId: rule.id,
      recurrenceInstanceId: null, // template row (no instance)
      deletedAt: null,
    },
    select: { id: true, orgId: true, title: true, committeeId: true },
  });

  for (const template of templateMeetings) {
    const occurrences = expandRule(rule);
    for (const instanceId of occurrences) {
      const existing = await db.meeting.findFirst({
        where: {
          recurrenceRuleId: rule.id,
          recurrenceInstanceId: instanceId,
        },
      });
      if (existing) continue;

      const scheduledStart = new Date(`${instanceId}T09:00:00.000Z`);
      const meeting = await db.meeting.create({
        data: {
          orgId: template.orgId,
          committeeId: template.committeeId,
          title: template.title,
          scheduledStart,
          recurrenceRuleId: rule.id,
          recurrenceInstanceId: instanceId,
        },
      });

      await emitEvent({
        orgId: template.orgId,
        type: "meeting.created",
        entityId: meeting.id,
        payload: { source: "recurrence", instanceId, templateId: template.id },
      });
    }
  }
}
