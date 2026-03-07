/** A user record returned by an external identity provider. */
export interface ExternalUser {
  externalId: string;
  email: string;
  name?: string;
  displayName?: string;
  phone?: string;
  /** Provider-specific raw attributes (kept for future mapping) */
  raw?: Record<string, unknown>;
}

/** Result returned by UserProvider.fetchUsers() */
export interface FetchUsersResult {
  users: ExternalUser[];
  /** Optional cursor / delta token for incremental sync */
  nextToken?: string;
}

/**
 * Abstraction over an external identity directory (Azure AD, LDAP, etc.).
 * Implement one class per provider.
 */
export interface UserProvider {
  /** Human-readable provider name (matches AuthProvider enum) */
  readonly name: string;

  /**
   * Fetch all (or delta) users from the directory.
   * @param deltaToken - token from previous sync for incremental fetch
   */
  fetchUsers(deltaToken?: string): Promise<FetchUsersResult>;

  /** Optional: test the connection before running a full sync. */
  testConnection?(): Promise<boolean>;
}

/** Config passed to the sync runner */
export interface SyncConfig {
  orgId: string;
  provider: UserProvider;
  /** Default role assigned to newly created users */
  defaultRole?: "ADMIN" | "SECRETARY" | "MEMBER";
}

/** Stats from a completed sync run */
export interface SyncStats {
  usersCreated: number;
  usersUpdated: number;
  usersDisabled: number;
  errors: string[];
}
