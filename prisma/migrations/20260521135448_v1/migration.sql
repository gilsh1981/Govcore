/*
  Warnings:

  - The values [OPEN,IN_PROGRESS,COMPLETED,DEFERRED] on the enum `DecisionStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [SCHEDULED] on the enum `MeetingStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `assigneeId` on the `decisions` table. All the data in the column will be lost.
  - You are about to drop the column `body` on the `decisions` table. All the data in the column will be lost.
  - You are about to drop the column `closedAt` on the `decisions` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `decisions` table. All the data in the column will be lost.
  - You are about to drop the column `orgId` on the `decisions` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledAt` on the `meetings` table. All the data in the column will be lost.
  - You are about to drop the `events` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[orgId,email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `org_id` to the `decisions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduledStart` to the `meetings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'AZURE_AD', 'LDAP');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "RoleScope" AS ENUM ('ORGANIZATION', 'COMMITTEE', 'MEETING');

-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocVisibility" AS ENUM ('ORGANIZATION', 'COMMITTEE', 'MEETING', 'PRIVATE');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "DecisionStatus_new" AS ENUM ('PROPOSED', 'APPROVED', 'REJECTED', 'ARCHIVED');
ALTER TABLE "public"."decisions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "decisions" ALTER COLUMN "status" TYPE "DecisionStatus_new" USING ("status"::text::"DecisionStatus_new");
ALTER TYPE "DecisionStatus" RENAME TO "DecisionStatus_old";
ALTER TYPE "DecisionStatus_new" RENAME TO "DecisionStatus";
DROP TYPE "public"."DecisionStatus_old";
ALTER TABLE "decisions" ALTER COLUMN "status" SET DEFAULT 'PROPOSED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "MeetingStatus_new" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."meetings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "meetings" ALTER COLUMN "status" TYPE "MeetingStatus_new" USING ("status"::text::"MeetingStatus_new");
ALTER TYPE "MeetingStatus" RENAME TO "MeetingStatus_old";
ALTER TYPE "MeetingStatus_new" RENAME TO "MeetingStatus";
DROP TYPE "public"."MeetingStatus_old";
ALTER TABLE "meetings" ALTER COLUMN "status" SET DEFAULT 'PLANNED';
COMMIT;

-- DropForeignKey
ALTER TABLE "decisions" DROP CONSTRAINT "decisions_assigneeId_fkey";

-- DropForeignKey
ALTER TABLE "decisions" DROP CONSTRAINT "decisions_createdById_fkey";

-- DropForeignKey
ALTER TABLE "decisions" DROP CONSTRAINT "decisions_orgId_fkey";

-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_orgId_fkey";

-- DropForeignKey
ALTER TABLE "meetings" DROP CONSTRAINT "meetings_committeeId_fkey";

-- DropForeignKey
ALTER TABLE "meetings" DROP CONSTRAINT "meetings_createdById_fkey";

-- DropIndex
DROP INDEX "decisions_assigneeId_idx";

-- DropIndex
DROP INDEX "decisions_orgId_idx";

-- DropIndex
DROP INDEX "meetings_scheduledAt_idx";

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "committees" ADD COLUMN     "chairUserId" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "recurrenceRuleId" TEXT;

-- AlterTable
ALTER TABLE "decisions" DROP COLUMN "assigneeId",
DROP COLUMN "body",
DROP COLUMN "closedAt",
DROP COLUMN "dueDate",
DROP COLUMN "orgId",
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "org_id" TEXT NOT NULL,
ADD COLUMN     "proposedById" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PROPOSED',
ALTER COLUMN "createdById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "meetings" DROP COLUMN "scheduledAt",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "recurrenceInstanceId" TEXT,
ADD COLUMN     "recurrenceRuleId" TEXT,
ADD COLUMN     "scheduledEnd" TIMESTAMP(3),
ADD COLUMN     "scheduledStart" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "committeeId" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PLANNED',
ALTER COLUMN "createdById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- DropTable
DROP TABLE "events";

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "RoleScope" NOT NULL,
    "permissions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "scopeType" "RoleScope" NOT NULL,
    "scopeId" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurrence_rules" (
    "id" TEXT NOT NULL,
    "frequency" "RecurrenceFrequency" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "daysOfWeek" INTEGER[],
    "dayOfMonth" INTEGER,
    "monthOfYear" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurrence_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "meetingId" TEXT,
    "decisionId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedToId" TEXT,
    "dueDate" TIMESTAMP(3),
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_transitions" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "linkedEntityType" TEXT,
    "linkedEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "meetingId" TEXT,
    "uploadedById" TEXT,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "visibility" "DocVisibility" NOT NULL DEFAULT 'ORGANIZATION',
    "isVoiceRecord" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "granted" BOOLEAN NOT NULL,
    "reason" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "usersCreated" INTEGER NOT NULL DEFAULT 0,
    "usersUpdated" INTEGER NOT NULL DEFAULT 0,
    "usersDisabled" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "roles_orgId_idx" ON "roles"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_orgId_name_scope_key" ON "roles"("orgId", "name", "scope");

-- CreateIndex
CREATE INDEX "user_role_assignments_userId_idx" ON "user_role_assignments"("userId");

-- CreateIndex
CREATE INDEX "user_role_assignments_roleId_idx" ON "user_role_assignments"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_assignments_userId_roleId_scopeId_key" ON "user_role_assignments"("userId", "roleId", "scopeId");

-- CreateIndex
CREATE INDEX "tasks_org_id_idx" ON "tasks"("org_id");

-- CreateIndex
CREATE INDEX "tasks_assignedToId_idx" ON "tasks"("assignedToId");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_dueDate_idx" ON "tasks"("dueDate");

-- CreateIndex
CREATE INDEX "status_transitions_entityType_entityId_idx" ON "status_transitions"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "status_transitions_changedAt_idx" ON "status_transitions"("changedAt");

-- CreateIndex
CREATE INDEX "calendar_events_orgId_idx" ON "calendar_events"("orgId");

-- CreateIndex
CREATE INDEX "calendar_events_startDate_idx" ON "calendar_events"("startDate");

-- CreateIndex
CREATE INDEX "calendar_events_linkedEntityType_linkedEntityId_idx" ON "calendar_events"("linkedEntityType", "linkedEntityId");

-- CreateIndex
CREATE INDEX "documents_orgId_idx" ON "documents"("orgId");

-- CreateIndex
CREATE INDEX "documents_meetingId_idx" ON "documents"("meetingId");

-- CreateIndex
CREATE INDEX "documents_uploadedById_idx" ON "documents"("uploadedById");

-- CreateIndex
CREATE INDEX "permission_logs_userId_idx" ON "permission_logs"("userId");

-- CreateIndex
CREATE INDEX "permission_logs_entityType_entityId_idx" ON "permission_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "permission_logs_createdAt_idx" ON "permission_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_orgId_idx" ON "audit_logs"("orgId");

-- CreateIndex
CREATE INDEX "audit_logs_type_idx" ON "audit_logs"("type");

-- CreateIndex
CREATE INDEX "audit_logs_entityId_idx" ON "audit_logs"("entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "sync_logs_orgId_idx" ON "sync_logs"("orgId");

-- CreateIndex
CREATE INDEX "sync_logs_status_idx" ON "sync_logs"("status");

-- CreateIndex
CREATE INDEX "committees_isActive_idx" ON "committees"("isActive");

-- CreateIndex
CREATE INDEX "decisions_org_id_idx" ON "decisions"("org_id");

-- CreateIndex
CREATE INDEX "decisions_proposedById_idx" ON "decisions"("proposedById");

-- CreateIndex
CREATE INDEX "meetings_scheduledStart_idx" ON "meetings"("scheduledStart");

-- CreateIndex
CREATE INDEX "meetings_status_idx" ON "meetings"("status");

-- CreateIndex
CREATE INDEX "meetings_recurrenceRuleId_recurrenceInstanceId_idx" ON "meetings"("recurrenceRuleId", "recurrenceInstanceId");

-- CreateIndex
CREATE INDEX "users_externalId_idx" ON "users"("externalId");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "users_orgId_email_key" ON "users"("orgId", "email");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committees" ADD CONSTRAINT "committees_chairUserId_fkey" FOREIGN KEY ("chairUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committees" ADD CONSTRAINT "committees_recurrenceRuleId_fkey" FOREIGN KEY ("recurrenceRuleId") REFERENCES "recurrence_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "committees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_recurrenceRuleId_fkey" FOREIGN KEY ("recurrenceRuleId") REFERENCES "recurrence_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "decisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_transitions" ADD CONSTRAINT "status_transitions_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_logs" ADD CONSTRAINT "permission_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
