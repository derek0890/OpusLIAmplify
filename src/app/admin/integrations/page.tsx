import { prisma } from "@/lib/prisma";

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        ok ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      {label}
    </span>
  );
}

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ teams?: string; message?: string }>;
}) {
  const { teams: teamsStatus, message } = await searchParams;

  const teamsIntegration = await prisma.teamsIntegration.findFirst({
    include: { connectedBy: { select: { name: true, email: true } } },
  });

  const slackBotConfigured = !!process.env.SLACK_BOT_TOKEN && !!process.env.SLACK_CHANNEL_NAME;
  const slackWebhookConfigured = !!process.env.SLACK_WEBHOOK_URL;
  const teamsEnvConfigured =
    !!process.env.TEAMS_CLIENT_ID && !!process.env.TEAMS_TENANT_ID && !!process.env.TEAMS_TEAM_ID;
  const teamsWebhookConfigured = !!process.env.TEAMS_WEBHOOK_URL;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Integrations</h1>
        <p className="mt-1 text-sm text-slate-500">
          Connect Slack and Microsoft Teams so a new published post
          automatically creates (or reuses) a notification channel and drops
          a message in it.
        </p>
      </div>

      {teamsStatus && (
        <div
          className={`mb-6 rounded-md border px-4 py-3 text-sm ${
            teamsStatus === "connected"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {teamsStatus === "connected"
            ? "Microsoft Teams connected successfully."
            : `Couldn't connect Microsoft Teams${message ? `: ${message}` : "."}`}
        </div>
      )}

      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-slate-900">Slack</h2>
            {slackBotConfigured ? (
              <StatusBadge ok label={`Posting to #${process.env.SLACK_CHANNEL_NAME}`} />
            ) : slackWebhookConfigured ? (
              <StatusBadge ok label="Webhook configured" />
            ) : (
              <StatusBadge ok={false} label="Not configured" />
            )}
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Set <code className="rounded bg-slate-100 px-1">SLACK_BOT_TOKEN</code> and{" "}
            <code className="rounded bg-slate-100 px-1">SLACK_CHANNEL_NAME</code> so the app
            can create (or reuse) that channel and post into it directly. No
            per-admin connect step needed — a bot token works as soon as the
            Slack app is installed to the workspace. See the README for setup.
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-slate-900">Microsoft Teams</h2>
            {teamsIntegration ? (
              <StatusBadge ok label="Connected" />
            ) : teamsWebhookConfigured ? (
              <StatusBadge ok label="Webhook configured" />
            ) : (
              <StatusBadge ok={false} label="Not connected" />
            )}
          </div>

          {teamsIntegration ? (
            <>
              <p className="mt-2 text-sm text-slate-500">
                Connected by {teamsIntegration.connectedBy.name} (
                {teamsIntegration.connectedBy.email}
                ). Posting to channel{" "}
                {teamsIntegration.channelId
                  ? `"${process.env.TEAMS_CHANNEL_NAME}"`
                  : "— created on first publish"}{" "}
                in team <code className="rounded bg-slate-100 px-1">{process.env.TEAMS_TEAM_ID}</code>.
              </p>
              <form action="/api/integrations/teams/disconnect" method="POST" className="mt-3">
                <button className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                  Disconnect
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-slate-500">
                Microsoft Graph only allows creating and posting to a Teams
                channel on behalf of a real signed-in account — there&rsquo;s no
                app-only credential for it. Connect a dedicated service
                account that&rsquo;s already a member of the target team; this app
                stores its refresh token and uses it to create the
                notification channel and post into it going forward.
              </p>
              {teamsEnvConfigured ? (
                <a
                  href="/api/integrations/teams/connect"
                  className="mt-3 inline-block rounded-md border border-accent-strong px-3 py-1.5 text-xs font-medium text-accent-strong hover:bg-accent-soft"
                >
                  Connect Microsoft Teams
                </a>
              ) : (
                <p className="mt-3 text-xs text-amber-700">
                  Set <code className="rounded bg-slate-100 px-1">TEAMS_CLIENT_ID</code>,{" "}
                  <code className="rounded bg-slate-100 px-1">TEAMS_CLIENT_SECRET</code>,{" "}
                  <code className="rounded bg-slate-100 px-1">TEAMS_TENANT_ID</code>, and{" "}
                  <code className="rounded bg-slate-100 px-1">TEAMS_TEAM_ID</code> first — see
                  the README.
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
