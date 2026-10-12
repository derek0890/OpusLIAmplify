import { type NotificationChannel, type PostNotificationPayload, truncate } from "./types";

// Slack Incoming Webhooks: https://api.slack.com/messaging/webhooks
// POST a JSON body to the per-workspace webhook URL; Slack replies with the
// literal text "ok" (not JSON) on success.
export const slackChannel: NotificationChannel = {
  name: "Slack",

  isConfigured() {
    return !!process.env.SLACK_WEBHOOK_URL;
  },

  async send(post: PostNotificationPayload) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return;

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `📣 New post published: ${truncate(post.caption, 120)}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*📣 New post published*\n${truncate(post.caption, 300)}`,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "Amplify it" },
                url: post.feedUrl,
              },
              {
                type: "button",
                text: { type: "plain_text", text: "View original" },
                url: post.postUrl,
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`Slack webhook returned ${res.status}: ${await res.text()}`);
    }
  },
};
