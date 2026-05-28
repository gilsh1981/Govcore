import { z } from "zod";

// ── Business-oriented capabilities ───────────────────────────────────────────
// These represent what a person CAN DO in the organization.
// Never use developer-facing CRUD labels (committee:read, meeting:create, etc.)

export const CAPABILITIES = [
  // Documents
  "view_documents",
  "upload_documents",
  "delete_documents",
  "access_confidential_documents",
  // Meetings
  "create_meetings",
  "manage_meetings",
  "manage_participants",
  "manage_agenda",
  "present_topics",
  "approve_protocol",
  // Decisions & Voting
  "manage_decisions",
  "vote_on_decisions",
  "approve_decisions",
  // Tasks
  "manage_tasks",
  "assign_tasks",
  // Committees
  "view_committees",
  "manage_committees",
  "manage_committee_members",
  // Users & Roles
  "manage_users",
  "manage_roles",
  // Organization
  "view_reports",
  "manage_organization",
  "run_sync",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

// Grouped categories used to render the capability checkbox UI
export const CAPABILITY_CATEGORIES: Array<{
  key: string;
  label: string;
  description: string;
  items: Array<{ key: Capability; label: string; description: string }>;
}> = [
  {
    key: "documents",
    label: "Documents",
    description: "File upload, access, and management",
    items: [
      { key: "view_documents", label: "View Documents", description: "Browse and read uploaded files" },
      { key: "upload_documents", label: "Upload Documents", description: "Add new files to meetings, committees, or the organization" },
      { key: "delete_documents", label: "Delete Documents", description: "Permanently remove documents" },
      { key: "access_confidential_documents", label: "Access Confidential Documents", description: "View restricted or confidential files" },
    ],
  },
  {
    key: "meetings",
    label: "Meetings",
    description: "Meeting lifecycle and governance",
    items: [
      { key: "create_meetings", label: "Create Meetings", description: "Schedule new meetings" },
      { key: "manage_meetings", label: "Manage Meetings", description: "Edit, reschedule, or cancel meetings" },
      { key: "manage_participants", label: "Manage Participants", description: "Invite or remove meeting participants" },
      { key: "manage_agenda", label: "Manage Agenda", description: "Create and edit meeting agenda items" },
      { key: "present_topics", label: "Present Topics", description: "Present agenda items during a meeting" },
      { key: "approve_protocol", label: "Approve Protocol / Minutes", description: "Sign off on meeting minutes and official protocols" },
    ],
  },
  {
    key: "decisions",
    label: "Decisions & Voting",
    description: "Governance decisions and voting rights",
    items: [
      { key: "manage_decisions", label: "Manage Decisions", description: "Create, edit, and track decisions" },
      { key: "vote_on_decisions", label: "Vote on Decisions", description: "Cast votes on proposed decisions" },
      { key: "approve_decisions", label: "Approve / Reject Decisions", description: "Formally approve or reject decisions" },
    ],
  },
  {
    key: "tasks",
    label: "Tasks",
    description: "Action items and follow-ups",
    items: [
      { key: "manage_tasks", label: "Manage Tasks", description: "Create, update, and close tasks" },
      { key: "assign_tasks", label: "Assign Tasks", description: "Delegate tasks to other members" },
    ],
  },
  {
    key: "committees",
    label: "Committees",
    description: "Committee structure and membership",
    items: [
      { key: "view_committees", label: "View Committees", description: "See committee details and membership" },
      { key: "manage_committees", label: "Manage Committees", description: "Create and configure committees" },
      { key: "manage_committee_members", label: "Manage Committee Members", description: "Add or remove members from committees" },
    ],
  },
  {
    key: "governance",
    label: "Users & Roles",
    description: "People and permission management",
    items: [
      { key: "manage_users", label: "Manage Users", description: "Invite, edit, or deactivate user accounts" },
      { key: "manage_roles", label: "Manage Roles & Permissions", description: "Create roles and assign permissions to users" },
    ],
  },
  {
    key: "organization",
    label: "Organization",
    description: "Organization-level settings and reports",
    items: [
      { key: "view_reports", label: "View Reports", description: "Access governance reports and analytics" },
      { key: "manage_organization", label: "Manage Organization Settings", description: "Update organization details and configuration" },
      { key: "run_sync", label: "Run Directory Sync", description: "Trigger Azure AD / LDAP user synchronization" },
    ],
  },
];

// ── Zod schemas ───────────────────────────────────────────────────────────────

export const createRoleSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  scope: z.enum(["ORGANIZATION", "COMMITTEE", "MEETING", "EVENT"]),
  permissions: z.array(z.enum(CAPABILITIES)).min(1),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  permissions: z.array(z.enum(CAPABILITIES)).optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
