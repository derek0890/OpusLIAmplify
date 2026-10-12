import { prisma } from "@/lib/prisma";

// Microsoft Graph has no application (app-only/client-credentials)
// permission for posting a normal channel message — only Teamwork.Migrate.All,
// which is for one-time data migration and isn't meant for ongoing
// notifications. So this channel authenticates as a real signed-in service
// account via the delegated OAuth authorization-code flow (see
// src/app/api/integrations/teams/{connect,callback}), and this module keeps
// that account's tokens fresh.
export const TEAMS_SCOPES = [
  "offline_access",
  "https://graph.microsoft.com/Channel.Create",
  "https://graph.microsoft.com/ChannelMessage.Send",
  "https://graph.microsoft.com/Team.ReadBasic.All",
].join(" ");

function tokenUrl(): string {
  return `https://login.microsoftonline.com/${process.env.TEAMS_TENANT_ID}/oauth2/v2.0/token`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

async function persistTokens(integrationId: string, tokens: TokenResponse) {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  await prisma.teamsIntegration.update({
    where: { id: integrationId },
    data: {
      accessToken: tokens.access_token,
      expiresAt,
      // Microsoft may rotate or omit the refresh token on any given
      // response; only overwrite ours when a new one actually came back,
      // and always persist it immediately since the old value can be
      // invalidated once a new one is issued.
      ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
    },
  });
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const res = await fetch(tokenUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.TEAMS_CLIENT_ID!,
      client_secret: process.env.TEAMS_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      scope: TEAMS_SCOPES,
    }),
  });
  if (!res.ok) {
    throw new Error(`Microsoft token exchange failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as TokenResponse;
}

/**
 * Returns a valid access token for the connected Teams service account,
 * refreshing it first if it's expired (or about to be). Throws if nobody
 * has completed the connect flow yet.
 */
export async function getValidTeamsAccessToken(): Promise<string> {
  const integration = await prisma.teamsIntegration.findFirst();
  if (!integration) {
    throw new Error(
      "Teams isn't connected yet — an admin needs to visit /admin/integrations to connect it.",
    );
  }

  const bufferMs = 60_000;
  if (integration.accessToken && integration.expiresAt && integration.expiresAt.getTime() - bufferMs > Date.now()) {
    return integration.accessToken;
  }

  const res = await fetch(tokenUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.TEAMS_CLIENT_ID!,
      client_secret: process.env.TEAMS_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: integration.refreshToken,
      scope: TEAMS_SCOPES,
    }),
  });
  if (!res.ok) {
    throw new Error(`Microsoft token refresh failed: ${res.status} ${await res.text()}`);
  }
  const tokens = (await res.json()) as TokenResponse;
  await persistTokens(integration.id, tokens);
  return tokens.access_token;
}

/**
 * Returns the cached channel id for this deployment's notification channel,
 * creating it in the configured team on first use.
 */
export async function getOrCreateTeamsChannelId(accessToken: string): Promise<string> {
  const integration = await prisma.teamsIntegration.findFirst();
  if (integration?.channelId) return integration.channelId;

  const teamId = process.env.TEAMS_TEAM_ID!;
  const channelName = process.env.TEAMS_CHANNEL_NAME!;

  const existing = await findChannelByName(accessToken, teamId, channelName);
  const channelId = existing ?? (await createChannel(accessToken, teamId, channelName));

  if (integration) {
    await prisma.teamsIntegration.update({ where: { id: integration.id }, data: { channelId } });
  }
  return channelId;
}

async function findChannelByName(
  accessToken: string,
  teamId: string,
  name: string,
): Promise<string | null> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/teams/${teamId}/channels?$filter=${encodeURIComponent(`displayName eq '${name}'`)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    throw new Error(`Failed to list Teams channels: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { value: { id: string }[] };
  return data.value[0]?.id ?? null;
}

async function createChannel(accessToken: string, teamId: string, name: string): Promise<string> {
  const res = await fetch(`https://graph.microsoft.com/v1.0/teams/${teamId}/channels`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      "@odata.type": "#Microsoft.Graph.channel",
      displayName: name,
      description: "Posts published on Relay, ready to amplify.",
      membershipType: "standard",
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create Teams channel: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}
