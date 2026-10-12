import { type NotificationChannel, type PostNotificationPayload, truncate } from "./types";

// Two ways to configure Slack, either is fine:
//  - SLACK_BOT_TOKEN + SLACK_CHANNEL_NAME: the app creates (or reuses) that
//    channel itself and posts into it via the Slack Web API.
//  - SLACK_WEBHOOK_URL: posts to a pre-existing Incoming Webhook (simpler,
//    but the channel it posts to is fixed when the webhook was created).
async function slackApi(method: string, token: string, body: Record<string, unknown>) {
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { ok: boolean; error?: string; [key: string]: unknown };
  if (!res.ok || !data.ok) {
    throw new Error(`Slack ${method} failed: ${data.error ?? res.status}`);
  }
  return data;
}

async function findChannelByName(token: string, name: string): Promise<string | null> {
  let cursor: string | undefined;
  do {
    const data = await slackApi("conversations.list", token, {
      types: "public_channel,private_channel",
      exclude_archived: true,
      limit: 200,
      ...(cursor ? { cursor } : {}),
    });
    const channels = data.channels as { id: string; name: string }[];
    const match = channels.find((c) => c.name === name);
    if (match) return match.id;
    cursor = (data.response_metadata as { next_cursor?: string } | undefined)?.next_cursor || undefined;
  } while (cursor);
  return null;
}

async function getOrCreateChannel(token: string, name: string): Promise<string> {
  try {
    const data = await slackApi("conversations.create", token, { name });
    return (data.channel as { id: string }).id;
  } catch (err) {
    if (err instanceof Error && err.message.includes("name_taken")) {
      const existing = await findChannelByName(token, name);
      if (existing) return existing;
    }
    throw err;
  }
}

async function sendViaBotToken(post: PostNotificationPayload) {
  const token = process.env.SLACK_BOT_TOKEN!;
  const channelName = process.env.SLACK_CHANNEL_NAME!;

  const channelId = await getOrCreateChannel(token, channelName);

  await slackApi("chat.postMessage", token, {
    channel: channelId,
    text: `📣 New post published: ${truncate(post.caption, 120)}`,
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: `*📣 New post published*\n${truncate(post.caption, 300)}` },
      },
      {
        type: "actions",
        elements: [
          { type: "button", text: { type: "plain_text", text: "Amplify it" }, url: post.feedUrl },
          { type: "button", text: { type: "plain_text", text: "View original" }, url: post.postUrl },
        ],
      },
    ],
  });
}

async function sendViaWebhook(post: PostNotificationPayload) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL!;

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `📣 New post published: ${truncate(post.caption, 120)}`,
      blocks: [
        {
          type: "section",
          text: { type: "mrkdwn", text: `*📣 New post published*\n${truncate(post.caption, 300)}` },
        },
        {
          type: "actions",
          elements: [
            { type: "button", text: { type: "plain_text", text: "Amplify it" }, url: post.feedUrl },
            { type: "button", text: { type: "plain_text", text: "View original" }, url: post.postUrl },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Slack webhook returned ${res.status}: ${await res.text()}`);
  }
}

export const slackChannel: NotificationChannel = {
  name: "Slack",

  isConfigured() {
    return (
      (!!process.env.SLACK_BOT_TOKEN && !!process.env.SLACK_CHANNEL_NAME) ||
      !!process.env.SLACK_WEBHOOK_URL
    );
  },

  async send(post: PostNotificationPayload) {
    if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_NAME) {
      await sendViaBotToken(post);
    } else if (process.env.SLACK_WEBHOOK_URL) {
      await sendViaWebhook(post);
    }
  },
};
