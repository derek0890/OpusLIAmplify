import { type NotificationChannel, type PostNotificationPayload } from "./types";

// Microsoft Graph app-only auth (client credentials) + sendMail.
// https://learn.microsoft.com/en-us/graph/api/user-sendmail
// Requires an Entra app registration with the Mail.Send *application*
// permission, admin-consented, and a mailbox to send from.
function recipients(): string[] {
  return (process.env.EXCHANGE_NOTIFY_RECIPIENTS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

async function getAccessToken(): Promise<string> {
  const tenantId = process.env.EXCHANGE_TENANT_ID!;
  const clientId = process.env.EXCHANGE_CLIENT_ID!;
  const clientSecret = process.env.EXCHANGE_CLIENT_SECRET!;

  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to get Microsoft Graph token: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export const exchangeChannel: NotificationChannel = {
  name: "Exchange (Microsoft Graph)",

  isConfigured() {
    return (
      !!process.env.EXCHANGE_TENANT_ID &&
      !!process.env.EXCHANGE_CLIENT_ID &&
      !!process.env.EXCHANGE_CLIENT_SECRET &&
      !!process.env.EXCHANGE_SENDER_EMAIL &&
      recipients().length > 0
    );
  },

  async send(post: PostNotificationPayload) {
    const senderEmail = process.env.EXCHANGE_SENDER_EMAIL!;
    const toRecipients = recipients();
    if (toRecipients.length === 0) return;

    const token = await getAccessToken();

    const res = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderEmail)}/sendMail`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            subject: "New post published on Opus Amplify",
            body: {
              contentType: "HTML",
              content: `<p>A new post is ready to amplify.</p><p>${escapeHtml(post.caption)}</p><p><a href="${post.feedUrl}">Amplify it</a> &middot; <a href="${post.postUrl}">View original</a></p>`,
            },
            toRecipients: toRecipients.map((address) => ({ emailAddress: { address } })),
          },
          saveToSentItems: false,
        }),
      },
    );

    if (!res.ok) {
      throw new Error(`Microsoft Graph sendMail returned ${res.status}: ${await res.text()}`);
    }
  },
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
