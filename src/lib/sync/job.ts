/**
 * BullMQ job: run AD/LDAP sync for an organization.
 *
 * Usage (from app startup or admin action):
 *   import { enqueueSyncJob } from "@/lib/sync/job";
 *   await enqueueSyncJob({ orgId: "...", providerName: "AZURE_AD" });
 */
import { createQueue, createWorker, QUEUE_SYNC } from "@/lib/queue";
import { runSync } from "./index";
import { AzureADProvider } from "./providers/azure-ad";

interface SyncJobData {
  orgId: string;
  providerName: "AZURE_AD" | "LDAP";
}

const queue = createQueue(QUEUE_SYNC);

export async function enqueueSyncJob(data: SyncJobData) {
  return queue.add("sync", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5_000 },
  });
}

export function startSyncWorker() {
  const worker = createWorker(QUEUE_SYNC, async (job) => {
    const { orgId, providerName } = job.data as SyncJobData;

    const provider = resolveProvider(providerName);
    const stats = await runSync({ orgId, provider });

    return stats;
  });

  worker.on("failed", (job, err) => {
    console.error("[sync] job failed", job?.id, err);
  });

  worker.on("completed", (job, result) => {
    console.log("[sync] job completed", job.id, result);
  });

  return worker;
}

function resolveProvider(name: string) {
  switch (name) {
    case "AZURE_AD":
      return new AzureADProvider();
    // Add LDAP provider here when implemented
    default:
      throw new Error(`Unknown sync provider: ${name}`);
  }
}
