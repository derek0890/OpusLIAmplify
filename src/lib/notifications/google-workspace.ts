import crypto from "node:crypto";
import { type NotificationChannel, type PostNotificationPayload } from "./types";

// Gmail API via a service account with domain-wide delegation.
// https://developers.google.com/workspace/gmail/api/guides/sending
// The service account impersonates a real Workspace mailbox (the `sub`
// claim) to call users.messages.send with the gmail.send scope. We sign the
// JWT ourselves with node:crypto so this doesn't need the googleapis SDK.
const TOKEN_URL = "https://oauth2.googleapis.com/token";
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
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL!;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const impersonatedUser = process.env.GOOGLE_WORKSPACE_SENDER_EMAIL!;

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: clientEmail,
      sub: impersonatedUser,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const signingInput = `${header}.${claims}`;
  const signature = base64url(
    crypto.createSign("RSA-SHA256").update(signingInput).sign(privateKey),
  );
  const assertion = `${signingInput}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to get Gmail API token: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
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
