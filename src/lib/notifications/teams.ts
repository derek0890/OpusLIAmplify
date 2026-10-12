import { type NotificationChannel, type PostNotificationPayload, truncate } from "./types";

// Microsoft retired the legacy Office 365 Connector webhooks; the current
// path is a Power Automate flow built from the "Post to a channel when a
// webhook request is received" template, which expects the request body to
// be the Adaptive Card payload it should relay into the channel.
export const teamsChannel: NotificationChannel = {
  name: "Microsoft Teams",

  isConfigured() {
    return !!process.env.TEAMS_WEBHOOK_URL;
  },

  async send(post: PostNotificationPayload) {
    const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
    if (!webhookUrl) return;

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
              {
                type: "TextBlock",
                text: "📣 New post published",
                weight: "Bolder",
                size: "Medium",
              },
              {
                type: "TextBlock",
                text: truncate(post.caption, 300),
                wrap: true,
              },
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
  },
};
