/**
 * Azure Active Directory / Entra ID user provider.
 *
 * Requires the following env vars:
 *   AZURE_AD_TENANT_ID
 *   AZURE_AD_CLIENT_ID
 *   AZURE_AD_CLIENT_SECRET
 *
 * Uses the Microsoft Graph API /users endpoint.
 * In production, install @azure/msal-node and @microsoft/microsoft-graph-client.
 * This stub uses fetch() directly so there are no extra dependencies at runtime.
 */
import type { UserProvider, FetchUsersResult, ExternalUser } from "../types";

interface AzureADConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

export class AzureADProvider implements UserProvider {
  readonly name = "AZURE_AD";
  private readonly config: AzureADConfig;
  private accessToken?: string;
  private tokenExpiry = 0;

  constructor(config?: Partial<AzureADConfig>) {
    this.config = {
      tenantId: config?.tenantId ?? process.env.AZURE_AD_TENANT_ID ?? "",
      clientId: config?.clientId ?? process.env.AZURE_AD_CLIENT_ID ?? "",
      clientSecret:
        config?.clientSecret ?? process.env.AZURE_AD_CLIENT_SECRET ?? "",
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getToken();
      return true;
    } catch {
      return false;
    }
  }

  async fetchUsers(deltaToken?: string): Promise<FetchUsersResult> {
    const token = await this.getToken();

    // Delta query for incremental sync; fall back to full fetch
    const base = `https://graph.microsoft.com/v1.0/users`;
    const select = "id,mail,displayName,givenName,surname,mobilePhone";
    const url = deltaToken
      ? deltaToken // deltaToken is already a full URL
      : `${base}/delta?$select=${select}`;

    const users: ExternalUser[] = [];
    let nextLink: string | undefined = url;
    let nextDelta: string | undefined;

    while (nextLink) {
      const res = await fetch(nextLink, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Azure AD fetch failed ${res.status}: ${text}`);
      }

      const data = (await res.json()) as {
        value: AzureADUser[];
        "@odata.nextLink"?: string;
        "@odata.deltaLink"?: string;
      };

      for (const u of data.value ?? []) {
        if (!u.mail) continue; // skip accounts without email
        users.push(mapUser(u));
      }

      nextLink = data["@odata.nextLink"];
      if (data["@odata.deltaLink"]) {
        nextDelta = data["@odata.deltaLink"];
      }
    }

    return { users, nextToken: nextDelta };
  }

  // ─── Token management ───────────────────────────────────────────────────────

  private async getToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry - 60_000) {
      return this.accessToken;
    }

    const { tenantId, clientId, clientSecret } = this.config;
    if (!tenantId || !clientId || !clientSecret) {
      throw new Error(
        "Azure AD credentials not configured. Set AZURE_AD_TENANT_ID, AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET.",
      );
    }

    const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
    });

    const res = await fetch(url, { method: "POST", body });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Token request failed ${res.status}: ${text}`);
    }

    const json = (await res.json()) as { access_token: string; expires_in: number };
    this.accessToken = json.access_token;
    this.tokenExpiry = Date.now() + json.expires_in * 1000;
    return this.accessToken;
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface AzureADUser {
  id: string;
  mail?: string;
  displayName?: string;
  givenName?: string;
  surname?: string;
  mobilePhone?: string;
}

function mapUser(u: AzureADUser): ExternalUser {
  const name =
    [u.givenName, u.surname].filter(Boolean).join(" ") || u.displayName;
  return {
    externalId: u.id,
    email: u.mail!,
    name: name || undefined,
    displayName: u.displayName || undefined,
    phone: u.mobilePhone || undefined,
    raw: u as unknown as Record<string, unknown>,
  };
}
