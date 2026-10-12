import { slackChannel } from "./slack";
import { teamsChannel } from "./teams";
import { exchangeChannel } from "./exchange";
import { googleWorkspaceChannel } from "./google-workspace";
import type { NotificationChannel, PostNotificationPayload } from "./types";

const CHANNELS: NotificationChannel[] = [
  slackChannel,
  teamsChannel,
  exchangeChannel,
  googleWorkspaceChannel,
];

/**
 * Fires every notification channel configured for this deployment's
 * environment. Each channel is independent — one failing (bad webhook,
 * expired credentials) never blocks the others or the post publish itself.
 */
export async function notifyNewPost(post: PostNotificationPayload): Promise<void> {
  const configured = CHANNELS.filter((channel) => channel.isConfigured());
  if (configured.length === 0) return;

  const results = await Promise.allSettled(configured.map((channel) => channel.send(post)));

  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(`[notifications] ${configured[i].name} failed:`, result.reason);
    }
  });
}

export type { PostNotificationPayload } from "./types";
