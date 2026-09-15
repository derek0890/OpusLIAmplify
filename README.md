# Opus Amplify

An employee advocacy portal for Opus Technologies. Marketing uploads posts
(caption, creative image, links) in an admin panel. Employees browse them in
a LinkedIn-style feed and can "Amplify" any post — Claude writes them a
unique repost caption or comment, styled from an editable Markdown voice
guide, which they copy and paste onto their own LinkedIn profile.

## Why there's no LinkedIn API integration

This app deliberately does **not** call the LinkedIn API to read posts or to
post/repost/comment on a user's behalf. Doing that without going through
LinkedIn's official Community Management API partner program would violate
LinkedIn's User Agreement and API Terms and risk account bans or legal
exposure. The "amplify" step here is manual by design: Claude generates the
copy, the employee copies it, and they paste it into LinkedIn themselves.
This is how most commercial employee-advocacy tools (EveryoneSocial,
GaggleAMP, Sociabble, etc.) work at that step, for the same reason.

If you later want true one-click posting, that requires applying to
LinkedIn's Marketing Developer Platform for Community Management API access
— a real partnership process, not something this app can route around.

## Architecture

- **Next.js 16** (App Router, TypeScript, Tailwind CSS 4)
- **Prisma + SQLite** for data (swap to Postgres for production — see below)
- **Auth.js / NextAuth v5** with a credentials (email + password) provider
  and two roles: `ADMIN` (marketing) and `EMPLOYEE`
- **Claude API** (`@anthropic-ai/sdk`, model `claude-opus-5`) generates each
  piece of amplification copy from the post + an editable style guide

### Data model (`prisma/schema.prisma`)

- `User` — email/password login, `ADMIN` or `EMPLOYEE` role
- `Post` — caption, creative image path, links (JSON), status
  (`DRAFT` / `PUBLISHED` / `ARCHIVED`)
- `StyleGuide` — the Markdown voice guide, editable from the admin panel
- `AmplifiedCopy` — every piece of generated copy is saved, both as a
  history/audit trail and so regeneration can be told "don't repeat these"

### Guaranteeing unique copy

Every generation call:
1. Includes a fresh random seed in the prompt.
2. Is shown the last 5 pieces of copy already generated for that post (of
   the same type — repost or comment) and is told to write something
   clearly different in opening line, structure, and wording.
2. Runs through Claude fresh each time — nothing is templated or cached.

## Getting started

```bash
npm install
cp .env.example .env   # if you don't already have a .env — see below
npx prisma db push     # create the SQLite database from the schema
npm run db:seed        # create an admin user, a sample employee, sample posts
npm run dev
```

Open http://localhost:3000.

### Environment variables (`.env`)

```bash
DATABASE_URL="file:./dev.db"
AUTH_SECRET="generate-a-random-string-for-production"
ANTHROPIC_API_KEY="sk-ant-..."   # required for AI copy generation — get one at https://console.anthropic.com/
```

Without `ANTHROPIC_API_KEY` set, everything else works (admin panel, feed,
login) but clicking "Amplify" shows a friendly "not configured yet" message
instead of generated copy.

### Seeded logins

The seed script (`prisma/seed.ts`) creates:

- **Admin:** `derekfrancis.14@gmail.com` / `ChangeMe123!`
- **Employee:** `employee@opustech.example` / `ChangeMe123!`

**Change these passwords (or delete/recreate the users) before using this
anywhere real** — they're seeded for local development only. You can also
override them via `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`,
`SEED_EMPLOYEE_EMAIL`, `SEED_EMPLOYEE_PASSWORD` env vars before running
`npm run db:seed`.

### Editing the AI voice guide

Go to **Admin → Style Guide** while logged in as an admin. It's a plain
Markdown textarea — it's seeded from `prisma/seed-content/default-style-guide.md`,
but once you save an edit from the UI, the database copy is what's used
(the file is only the initial seed). Every future "Amplify" generation
uses whatever is saved there.

## Production notes

- **Database:** SQLite is fine for local dev or a small single-instance
  deployment. For anything with concurrent writers or multiple app
  instances, switch `datasource db` in `prisma/schema.prisma` to
  `provider = "postgresql"`, point `DATABASE_URL` at your Postgres instance,
  and re-run `npx prisma db push` (or set up `prisma migrate` instead).
- **Uploaded creatives:** currently saved to `public/uploads` on local disk
  (fine for a single persistent server; not suitable for serverless/Vercel,
  where the filesystem isn't persistent — swap `saveCreative` in
  `src/lib/actions/posts.ts` for a cloud storage upload, e.g. S3 or Vercel
  Blob, if you deploy there).
- **`AUTH_SECRET`:** set a real random value in production
  (`openssl rand -base64 32`).
- **Model/cost tuning:** copy generation uses `claude-opus-5` at
  `effort: "low"` in `src/lib/claude.ts` — cheap for short social copy.
  Adjust the model or effort there if you want higher-effort writing or
  lower cost (e.g. `claude-sonnet-5` or `claude-haiku-4-5`).
