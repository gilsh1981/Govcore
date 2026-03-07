/**
 * Core sync runner: fetches external users and upserts them in the DB.
 * Creates a SyncLog record tracking the run.
 */
import { db } from "@/lib/db";
import { emitEvent } from "@/lib/events";
import type { SyncConfig, SyncStats } from "./types";

export async function runSync(config: SyncConfig): Promise<SyncStats> {
  const { orgId, provider, defaultRole = "MEMBER" } = config;

  // Create a RUNNING log entry
  const syncLog = await db.syncLog.create({
    data: {
      orgId,
      provider: provider.name as "AZURE_AD" | "LDAP",
      status: "RUNNING",
    },
  });

  const stats: SyncStats = {
    usersCreated: 0,
    usersUpdated: 0,
    usersDisabled: 0,
    errors: [],
  };

  try {
    const { users: externalUsers } = await provider.fetchUsers();

    // Build index of existing users by externalId
    const existing = await db.user.findMany({
      where: { orgId, provider: provider.name as "AZURE_AD" | "LDAP" },
      select: { id: true, externalId: true, email: true, status: true },
    });

    const byExternalId = new Map(existing.map((u) => [u.externalId, u]));
    const seenExternalIds = new Set<string>();

    for (const ext of externalUsers) {
      seenExternalIds.add(ext.externalId);
      const existing = byExternalId.get(ext.externalId);

      try {
        if (!existing) {
          // Create new user
          const created = await db.user.create({
            data: {
              orgId,
              email: ext.email,
              name: ext.name,
              displayName: ext.displayName,
              phone: ext.phone,
              externalId: ext.externalId,
              provider: provider.name as "AZURE_AD" | "LDAP",
              role: defaultRole,
              status: "ACTIVE",
            },
          });

          await emitEvent({
            orgId,
            type: "committee.created", // reuse closest available — future: "user.created"
            entityId: created.id,
            payload: { source: "sync", provider: provider.name, email: ext.email },
          });

          stats.usersCreated++;
        } else {
          // Update existing user (re-enable if disabled)
          const needsUpdate =
            existing.email !== ext.email || existing.status === "DISABLED";

          if (needsUpdate) {
            await db.user.update({
              where: { id: existing.id },
              data: {
                email: ext.email,
                name: ext.name,
                displayName: ext.displayName,
                phone: ext.phone,
                status: "ACTIVE",
              },
            });
            stats.usersUpdated++;
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        stats.errors.push(`${ext.externalId}: ${msg}`);
      }
    }

    // Disable users no longer in the directory
    for (const u of existing) {
      if (u.externalId && !seenExternalIds.has(u.externalId) && u.status === "ACTIVE") {
        await db.user.update({
          where: { id: u.id },
          data: { status: "DISABLED" },
        });
        stats.usersDisabled++;
      }
    }

    await db.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "COMPLETED",
        usersCreated: stats.usersCreated,
        usersUpdated: stats.usersUpdated,
        usersDisabled: stats.usersDisabled,
        errors: stats.errors.length > 0 ? stats.errors : undefined,
        completedAt: new Date(),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    stats.errors.push(msg);

    await db.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "FAILED",
        errors: [msg],
        completedAt: new Date(),
      },
    });

    throw err;
  }

  return stats;
}
