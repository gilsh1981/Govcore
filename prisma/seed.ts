import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const org = await db.organization.upsert({
    where: { slug: "demo-cooperative" },
    update: {},
    create: {
      name: "Demo Cooperative",
      slug: "demo-cooperative",
    },
  });

  console.log(`Organization: ${org.name} (${org.id})`);

  const admin = await db.user.upsert({
    where: { orgId_email: { orgId: org.id, email: "admin@govcore.local" } },
    update: {},
    create: {
      email: "admin@govcore.local",
      name: "Admin User",
      role: "ADMIN",
      orgId: org.id,
    },
  });

  console.log(`Admin user:   ${admin.email} (${admin.id})`);
  console.log("\nSeed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
