import Link from "next/link";
import { requireSuperAdmin } from "@/lib/super-admin";
import { createInstance } from "@/lib/actions/instances";

function Field({
  label,
  name,
  type = "text",
  placeholder,
  help,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  help?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      {help && <span className="mt-1 block text-xs text-slate-400">{help}</span>}
    </label>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-medium text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export default async function NewInstancePage() {
  await requireSuperAdmin();

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/super" className="text-sm text-blue-600 hover:underline">
          ← Back to instances
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">New Whitebox Instance</h1>
        <p className="mt-1 text-sm text-slate-500">
          Leave any section blank to skip that channel for this client — every
          field here is optional except the name. See the Whitebox Instance
          Playbook for where to get each value.
        </p>
      </div>

      <form action={createInstance} className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-medium text-slate-900">Basics</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Company / instance name</span>
              <input
                type="text"
                name="name"
                required
                placeholder="Acme Corp"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Logo</span>
              <input
                type="file"
                name="logo"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="mt-1 block w-full text-sm text-slate-600"
              />
              <span className="mt-1 block text-xs text-slate-400">PNG, JPEG, WEBP, or GIF, up to 8MB.</span>
            </label>
          </div>
        </section>

        <Section title="Slack" description="Either a bot token (recommended — the app will create and post to the channel itself) or a simpler webhook.">
          <Field label="Bot token" name="slackBotToken" placeholder="xoxb-..." />
          <Field label="Channel name" name="slackChannelName" placeholder="opus-amplify-notifications" />
          <Field label="Webhook URL (alternative)" name="slackWebhookUrl" placeholder="https://hooks.slack.com/services/..." />
        </Section>

        <Section title="Microsoft Teams" description="Either delegated OAuth credentials (recommended — connect from /admin/integrations after deploying) or a simpler webhook.">
          <Field label="Client ID" name="teamsClientId" />
          <Field label="Client secret" name="teamsClientSecret" type="password" />
          <Field label="Tenant ID" name="teamsTenantId" />
          <Field label="Team ID" name="teamsTeamId" />
          <Field label="Channel name" name="teamsChannelName" placeholder="opus-amplify-notifications" />
          <Field label="Webhook URL (alternative)" name="teamsWebhookUrl" placeholder="https://..." />
        </Section>

        <Section title="Exchange / Outlook (Microsoft Graph)" description="App-only credentials for sending mail via Mail.Send.">
          <Field label="Tenant ID" name="exchangeTenantId" />
          <Field label="Client ID" name="exchangeClientId" />
          <Field label="Client secret" name="exchangeClientSecret" type="password" />
          <Field label="Sender email" name="exchangeSenderEmail" placeholder="notifications@client.com" />
          <Field label="Notify recipients" name="exchangeNotifyRecipients" placeholder="admin1@client.com,admin2@client.com" help="Comma-separated." />
        </Section>

        <Section title="Google Workspace Email" description="A service account with domain-wide delegation.">
          <Field label="Service account email" name="googleClientEmail" placeholder="svc@project.iam.gserviceaccount.com" />
          <Field label="Private key" name="googlePrivateKey" placeholder="-----BEGIN PRIVATE KEY-----..." help="Paste the full PEM key." />
          <Field label="Sender email" name="googleWorkspaceSenderEmail" placeholder="notifications@client.com" />
          <Field label="Notify recipients" name="googleWorkspaceNotifyRecipients" placeholder="admin@client.com" help="Comma-separated." />
        </Section>

        <Section title="AI (copy generation)" description="The OpenAI API key this instance will use to generate repost/comment copy.">
          <Field label="API key" name="openaiApiKey" type="password" placeholder="sk-..." />
          <Field label="Research model (optional)" name="openaiResearchModel" placeholder="gpt-5.4-nano" />
          <Field label="Copy model (optional)" name="openaiCopyModel" placeholder="gpt-5.5" />
        </Section>

        <div className="flex justify-end gap-3">
          <Link
            href="/admin/super"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Generate instance
          </button>
        </div>
      </form>
    </div>
  );
}
