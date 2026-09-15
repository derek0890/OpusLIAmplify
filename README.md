# Opus Amplify

An employee advocacy portal for Opus Technologies. Marketing uploads posts
(caption, creative image, public links, and optional reference links for AI
context) in an admin panel. Employees browse them in a LinkedIn-style feed
and hit **Comment** or **Repost** directly on any post — two OpenAI agents
research the post's sources and write a unique caption or comment, styled
from an editable Markdown writing guide, which the employee copies and
pastes onto their own LinkedIn profile.

## Why there's no LinkedIn API integration

This app deliberately does **not** call the LinkedIn API to read posts or to
post/repost/comment on a user's behalf. Doing that without going through
LinkedIn's official Community Management API partner program would violate
LinkedIn's User Agreement and API Terms and risk account bans or legal
exposure. The "amplify" step here is manual by design: the AI generates the
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
- **OpenAI API** (`openai` SDK, Responses API) — two agents, each on a model
  picked for its job (see below)

### Two AI agents

1. **Research agent** (`src/lib/openai.ts` → `researchLinks`, model
   `gpt-5.4-nano` by default) — crawls the post's reference + public links
   server-side (`src/lib/link-crawler.ts`, via `fetch` + `cheerio`) and
   extracts only facts that are explicitly present in the source pages. This
   is a cheap, high-throughput model because the task is mechanical
   extraction, not judgment. The result is cached on the post
   (`Post.contextBrief`) so it isn't re-crawled on every generation —only
   when the admin changes the reference links.
2. **Copywriter agent** (`src/lib/openai.ts` → `generateAmplifiedCopy`,
   model `gpt-5.5` by default) — writes the actual repost caption or
   comment. It's given the full writing-instructions document (the style
   guide, below) as its instructions, the original post caption, the
   research agent's grounded facts, and the employee's chosen type
   (repost/comment). This step gets the flagship model because it has to
   reliably follow a long, nuanced style guide (single takeaway, strict
   sentence-to-sentence causality, exact word-count targets, a banned-phrase
   list, etc.) — a cheaper model is much more likely to drift from those
   rules.

Both models are configurable via `OPENAI_RESEARCH_MODEL` / `OPENAI_COPY_MODEL`
env vars — see the note on model naming under Production notes below.

### Data model (`prisma/schema.prisma`)

- `User` — email/password login, `ADMIN` or `EMPLOYEE` role
- `Post` — caption, creative image path, public links shown in the feed
  (`linksJson`), admin-only reference links crawled for AI context
  (`contextLinksJson`), the cached research brief (`contextBrief`), status
  (`DRAFT` / `PUBLISHED` / `ARCHIVED`)
- `StyleGuide` — the Markdown writing-instructions document, editable from
  the admin panel (seeded from the uploaded LinkedIn writing-instructions
  doc)
- `AmplifiedCopy` — every piece of generated copy is saved, both as a
  history/audit trail and so regeneration can be told "don't repeat these"

### Reference links vs. public links

Each post has two separate link fields in the admin form:
- **Links** — shown to employees in the feed under the post (e.g. a blog
  post URL the caption references).
- **Reference links for AI context** — admin-only, never shown to
  employees. Use this for source articles, press releases, or any page the
  post is based on that the AI should ground its writing in but that
  doesn't need to be public. Both link sets get crawled by the research
  agent; only the first is rendered in the feed.

### Guaranteeing unique copy

Every generation call:
1. Includes a fresh random seed in the prompt.
2. Is shown the last 5 pieces of copy already generated for that post (of
   the same type — repost or comment) and is told to open and structure its
   response differently from every one of them.
3. Runs the copywriter agent fresh each time — nothing is templated or
   cached (only the research brief is cached, since the underlying source
   facts don't change between requests).

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
OPENAI_API_KEY="sk-..."          # required for AI copy generation — get one at https://platform.openai.com/api-keys
OPENAI_RESEARCH_MODEL="gpt-5.4-nano"  # optional, see Production notes
OPENAI_COPY_MODEL="gpt-5.5"           # optional, see Production notes
```

Without `OPENAI_API_KEY` set, everything else works (admin panel, feed,
login) but clicking "Comment" or "Repost" shows a friendly "not configured
yet" message instead of generated copy.

### Seeded logins

The seed script (`prisma/seed.ts`) creates:

- **Admin:** `derekfrancis.14@gmail.com` / `ChangeMe123!`
- **Employee:** `employee@opustech.example` / `ChangeMe123!`

**Change these passwords (or delete/recreate the users) before using this
anywhere real** — they're seeded for local development only. You can also
override them via `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`,
`SEED_EMPLOYEE_EMAIL`, `SEED_EMPLOYEE_PASSWORD` env vars before running
`npm run db:seed`.

### Editing the AI writing instructions

Go to **Admin → Style Guide** while logged in as an admin. It's a plain
Markdown textarea, seeded from `prisma/seed-content/default-style-guide.md`
(currently the LinkedIn Repost Captions & Comments writing-instructions
doc). Once you save an edit from the UI, the database copy is what's used
(the file is only the initial seed) — every future generation sends
whatever is saved there as the copywriter agent's instructions verbatim.

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
- **Model names change fast.** The defaults in `src/lib/openai.ts`
  (`gpt-5.4-nano` for research, `gpt-5.5` for copywriting) were verified
  against OpenAI's live docs and the installed SDK's own examples at build
  time, but OpenAI ships new model tiers often. If a generation request
  fails with a "model not found"-style error, check
  [platform.openai.com/docs/models](https://platform.openai.com/docs/models)
  for the current lineup and set `OPENAI_RESEARCH_MODEL` /
  `OPENAI_COPY_MODEL` in `.env` — no code change needed.
- **Crawling reference links:** `src/lib/link-crawler.ts` fetches admin-
  supplied URLs server-side with an 8s timeout and blocks obviously
  internal/private hostnames as a basic SSRF guard. It only reads public
  HTML pages — it can't get past auth walls or JS-rendered content.
