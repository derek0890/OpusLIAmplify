import { type NotificationChannel, type PostNotificationPayload } from "./types";
import { getGoogleServiceAccountToken } from "@/lib/google-service-account";

// Gmail API via a service account with domain-wide delegation.
// https://developers.google.com/workspace/gmail/api/guides/sending
// The service account impersonates a real Workspace mailbox (the `sub`
// claim) to call users.messages.send with the gmail.send scope.
const SCOPE = "https://www.googleapis.com/auth/gmail.send";

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function recipients(): string[] {
  return (process.env.GOOGLE_WORKSPACE_NOTIFY_RECIPIENTS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

async function getAccessToken(): Promise<string> {
  return getGoogleServiceAccountToken(SCOPE, process.env.GOOGLE_WORKSPACE_SENDER_EMAIL!);
}

function buildRawMessage(from: string, to: string[], subject: string, html: string): string {
  const message = [
    `From: ${from}`,
    `To: ${to.join(", ")}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    html,
  ].join("\r\n");
  return base64url(message);
}

export const googleWorkspaceChannel: NotificationChannel = {
  name: "Google Workspace Email",

  isConfigured() {
    return (
      !!process.env.GOOGLE_CLIENT_EMAIL &&
      !!process.env.GOOGLE_PRIVATE_KEY &&
      !!process.env.GOOGLE_WORKSPACE_SENDER_EMAIL &&
      recipients().length > 0
    );
  },

  async send(post: PostNotificationPayload) {
    const senderEmail = process.env.GOOGLE_WORKSPACE_SENDER_EMAIL!;
    const toRecipients = recipients();
    if (toRecipients.length === 0) return;

    const token = await getAccessToken();
    const raw = buildRawMessage(
      senderEmail,
      toRecipients,
      "New post published on Opus Amplify",
      `<p>A new post is ready to amplify.</p><p>${escapeHtml(post.caption)}</p><p><a href="${post.feedUrl}">Amplify it</a> &middot; <a href="${post.postUrl}">View original</a></p>`,
    );

    const res = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
      },
    );

    if (!res.ok) {
      throw new Error(`Gmail API send returned ${res.status}: ${await res.text()}`);
    }
  },
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
