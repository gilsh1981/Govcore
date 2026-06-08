/**
 * Background worker process.
 *
 * Run with:  npm run workers
 *
 * Requires Redis. Set REDIS_HOST / REDIS_PORT / REDIS_PASSWORD in .env
 * (defaults: localhost:6379, no password).
 *
 * Workers started:
 *   - recurrence-expansion  always (expands recurring meeting rules daily at 02:00 UTC)
 *   - ad-sync               only when AZURE_AD_TENANT_ID is configured
 */

import "dotenv/config";
import Redis from "ioredis";
import { scheduleRecurrenceJob } from "@/lib/recurrence/job";
import { startSyncWorker } from "@/lib/sync/job";

const REDIS_HOST = process.env.REDIS_HOST ?? "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT ?? "6379");
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

async function main() {
  // ── Verify Redis is reachable before starting workers ──────────────────────
  const probe = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    connectTimeout: 3000,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  try {
    await probe.connect();
    await probe.ping();
    await probe.quit();
  } catch {
    console.error(
      `[workers] Cannot connect to Redis at ${REDIS_HOST}:${REDIS_PORT}.\n` +
      `  Make sure Redis is running: redis-server\n` +
      `  Or set REDIS_HOST / REDIS_PORT / REDIS_PASSWORD in .env`
    );
    process.exit(1);
  }

  console.log(`[workers] Redis OK (${REDIS_HOST}:${REDIS_PORT})`);

  // ── Recurrence expansion (always start) ────────────────────────────────────
  const recurrenceWorker = scheduleRecurrenceJob();
  console.log("[workers] recurrence-expansion worker started (daily at 02:00 UTC)");

  recurrenceWorker.on("error", (err) => {
    console.error("[workers] recurrence worker error:", err.message);
  });

  // ── AD/LDAP sync (only if Azure AD is configured) ──────────────────────────
  const azureConfigured =
    process.env.AZURE_AD_TENANT_ID &&
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET;

  if (azureConfigured) {
    const syncWorker = startSyncWorker();
    console.log("[workers] ad-sync worker started (Azure AD)");

    syncWorker.on("error", (err) => {
      console.error("[workers] sync worker error:", err.message);
    });
  } else {
    console.log("[workers] ad-sync worker skipped (AZURE_AD_* env vars not set)");
  }

  console.log("[workers] all workers running. Press Ctrl+C to stop.");

  process.on("SIGTERM", () => {
    console.log("[workers] SIGTERM received, shutting down.");
    process.exit(0);
  });
}

main();
