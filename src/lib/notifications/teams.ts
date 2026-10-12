import { prisma } from "@/lib/prisma";
import { getValidTeamsAccessToken, getOrCreateTeamsChannelId } from "@/lib/integrations/teams-token";
import { type NotificationChannel, type PostNotificationPayload, truncate } from "./types";

// Two ways to configure Teams, either is fine:
//  - TEAMS_CLIENT_ID/.../TEAMS_TEAM_ID/TEAMS_CHANNEL_NAME + a completed
//    connect flow (see /admin/integrations): the app creates (or reuses)
//    that channel in the team and posts a real channel message into it via
//    Microsoft Graph, authenticated as the connected service account.
//  - TEAMS_WEBHOOK_URL: posts to a Power Automate flow webhook wired to a
//    channel an admin set up by hand (simpler, no OAuth connect step, but
//    no automatic channel creation).
async function sendViaGraph(post: PostNotificationPayload) {
  const accessToken = await getValidTeamsAccessToken();
  const channelId = await getOrCreateTeamsChannelId(accessToken);
  const teamId = process.env.TEAMS_TEAM_ID!;

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: {
          contentType: "html",
          content: `<h3>📣 New post published</h3><p>${escapeHtml(truncate(post.caption, 300))}</p><p><a href="${post.feedUrl}">Amplify it</a> &middot; <a href="${post.postUrl}">View original</a></p>`,
        },
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Teams channel message failed: ${res.status} ${await res.text()}`);
  }
}

async function sendViaWebhook(post: PostNotificationPayload) {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL!;

  const card = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            { type: "TextBlock", text: "📣 New post published", weight: "Bolder", size: "Medium" },
            { type: "TextBlock", text: truncate(post.caption, 300), wrap: true },
          ],
          actions: [
            { type: "Action.OpenUrl", title: "Amplify it", url: post.feedUrl },
            { type: "Action.OpenUrl", title: "View original", url: post.postUrl },
          ],
        },
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(card),
  });

  if (!res.ok) {
    throw new Error(`Teams webhook returned ${res.status}: ${await res.text()}`);
  }
}

export const teamsChannel: NotificationChannel = {
  name: "Microsoft Teams",

  isConfigured() {
    return (
      (!!process.env.TEAMS_CLIENT_ID &&
        !!process.env.TEAMS_TENANT_ID &&
        !!process.env.TEAMS_TEAM_ID &&
        !!process.env.TEAMS_CHANNEL_NAME) ||
      !!process.env.TEAMS_WEBHOOK_URL
    );
  },

  async send(post: PostNotificationPayload) {
    if (
      process.env.TEAMS_CLIENT_ID &&
      process.env.TEAMS_TENANT_ID &&
      process.env.TEAMS_TEAM_ID &&
      process.env.TEAMS_CHANNEL_NAME
    ) {
      const connected = await prisma.teamsIntegration.findFirst({ select: { id: true } });
      if (connected) {
        await sendViaGraph(post);
        return;
      }
      if (!process.env.TEAMS_WEBHOOK_URL) {
        throw new Error(
          "Teams env vars are set but nobody has connected it yet — visit /admin/integrations.",
        );
      }
    }
    if (process.env.TEAMS_WEBHOOK_URL) {
      await sendViaWebhook(post);
    }
  },
};

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
