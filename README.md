# Opus Amplify

An employee advocacy portal for Opus Technologies. Marketing uploads posts
in an admin panel — caption, any LinkedIn content type (single image, GIF,
multi-image carousel, video, or PDF document), public links, and optional
reference links for AI context. Employees browse them in a feed rendered to
look and behave like the real LinkedIn feed, and hit **Comment** or
**Repost** directly on any post — two OpenAI agents research the post's
sources and write a unique, properly paragraphed caption or comment, styled
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
- **Auth.js / NextAuth v5** with email/password and an optional enterprise
  SSO (OIDC) provider, and two roles: `ADMIN` (marketing) and `EMPLOYEE` —
  see "Deploying for a company's SSO" below
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
- `Post` — caption, required `postUrl` (the original LinkedIn post),
  media type + uploaded files (`mediaType`/`mediaJson`), public links shown
  in the feed (`linksJson`), admin-only reference links crawled for AI
  context (`contextLinksJson`), the cached research brief (`contextBrief`),
  status (`DRAFT` / `PUBLISHED` / `ARCHIVED`)
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

### Copy formatting

Generated captions and comments are formatted like a real LinkedIn post —
short paragraphs (roughly one beat of the storyline each: hook, development,
close) separated by blank lines, not one dense block of text. This comes
from an explicit formatting instruction in `src/lib/openai.ts`
(`generateAmplifiedCopy`); the `\n\n` breaks flow straight through the
editable textarea and the clipboard copy into LinkedIn's own post composer.

### Post content types

Posts support every content type LinkedIn itself supports, chosen per-post
in the admin form:

| Type | Admin uploads | Feed renders as |
|---|---|---|
| Text only | — | caption only |
| Image | 1 image (PNG/JPEG/WEBP/GIF, ≤8MB) | full-width image; an uploaded GIF gets a "GIF" badge and is served unoptimized so the animation isn't stripped |
| Carousel | 2–20 images | swipeable carousel (`src/components/media-carousel.tsx`) with arrow controls, a page counter, and dot indicators |
| Video | 1 file (MP4/WEBM/MOV, ≤100MB) | native HTML5 `<video controls>` |
| Document | 1 PDF (≤20MB) | swipeable, paginated document viewer (`src/components/document-viewer.tsx`, via `react-pdf`/pdfjs) with a title bar and page counter, matching LinkedIn's PDF "document post" carousel |

Uploaded files are validated by MIME type and size in
`src/lib/actions/posts.ts` and saved to `public/uploads` (see Production
notes on swapping this for cloud storage). A post's media type and files are
stored as `Post.mediaType` + `Post.mediaJson` (an array of `{ url, name,
mimeType }`), not a single `creativeUrl` — see `src/lib/media.ts`.

Any URL typed directly into the caption text is rendered as a clickable
link in the feed (`src/components/linkified-text.tsx`), the same way
LinkedIn auto-links URLs typed into a real post — this is in addition to,
not instead of, the separate "Links within the copy" field.

### Required fields

The admin form requires three things for every post: **post copy** (the
caption), **post creative** (an image/carousel/video/document), and the
**link to the original post** (the real LinkedIn URL, shown to employees in
the Comment/Repost dialog — see below). Post creative is the one exception:
check **"This is a text-only post"** next to the media picker to mark a post
as intentionally text-only — the media picker greys out and creative is no
longer required, but the original-post link still is. "Links within the
copy" (shown in the feed under the caption) stays optional and supports
multiple URLs, one per line.

### Original post link

Every post also carries a required `postUrl` — the actual URL of the post
on LinkedIn. It's shown as a "View the original post on LinkedIn ↗" link at
the top of the Comment/Repost dialog (`src/components/amplify-modal.tsx`),
so an employee generating copy can jump straight to the real post to paste
it there — this is separate from, and always required regardless of, the
optional "Links within the copy" field.

## Deploying for a company's SSO

This app is built to be "whiteboxed" — handed to a company as its own
deployment, with its own database, its own branding, and its own identity
provider. It is **not** multi-tenant: one deployment serves one company. If
you need one shared deployment serving many companies at once, that's a
bigger change (tenant isolation on every table, per-tenant IdP config in the
database instead of env vars) that this architecture doesn't attempt.

### Connecting the company's identity provider

Auth.js's generic OIDC provider (`src/auth.ts`) covers any OpenID Connect
compliant IdP without custom code — Okta, Azure AD / Entra ID, Google
Workspace, OneLogin, Ping, Auth0, and most others. Set three env vars from
the company's IdP admin console (app type: "OIDC / OAuth2", redirect URI:
`https://<your-deployment>/api/auth/callback/sso`):

```bash
SSO_ISSUER="https://your-company.okta.com"      # the IdP's OIDC issuer URL
SSO_CLIENT_ID="..."
SSO_CLIENT_SECRET="..."
SSO_PROVIDER_NAME="Okta"                         # shown on the login button
```

Leave all three unset and the app falls back to email/password only — no
code change needed either way, `src/auth.ts` builds the provider list from
whichever env vars are present. Once SSO is confirmed working, set
`DISABLE_PASSWORD_LOGIN="true"` to drop the password form entirely and go
SSO-only.

If a company's IdP is SAML-only (no OIDC support — mostly older on-prem
setups), don't hand-roll SAML: add
[BoxyHQ SAML Jackson](https://github.com/boxyhq/jackson) (open source,
self-hostable) as a SAML→OIDC broker in front of it, then point `SSO_ISSUER`
at Jackson instead of the IdP directly. The same pattern Retool, Cal.com,
and Vercel use for enterprise SSO.

The first time someone signs in via SSO, a `User` row is created for them
automatically ("just-in-time provisioning" — nobody has to be pre-created).
New SSO users default to `EMPLOYEE`. To auto-grant `ADMIN` on first login
instead (useful for the people setting the deployment up), list their
emails in `INITIAL_ADMIN_EMAILS` (comma-separated) before they sign in —
after that, admin status is managed from the app itself (next section).

### Adding and removing admins

**Admin → Team** (`/admin/team`) lists everyone who has ever signed in,
whether via SSO or password, and lets an admin:

- **Make admin / Remove admin** — toggles the `ADMIN` ↔ `EMPLOYEE` role.
- **Deactivate / Reactivate** — revokes or restores login access entirely,
  without deleting the account or their post/copy history.

Both actions are blocked from leaving the deployment with zero active
admins (the button disables itself on the last one), and nobody can
deactivate their own account — both enforced server-side in
`src/lib/actions/users.ts`, not just hidden in the UI.

Role and active-status changes take effect on the user's **next request**,
not next login: `src/auth.ts`'s `jwt` callback re-reads the user's current
role/`isActive` from the database on every request rather than trusting
what was baked into the token at sign-in, and ends the session outright if
the account is deactivated or gone.

### What changed in the data model to support this

- `User.passwordHash` is now optional — SSO users never set one.
- `User.isActive` — the deactivate/reactivate flag.
- `Account` / `Session` / `VerificationToken` — Auth.js's standard Prisma
  adapter schema, added so first-time SSO sign-ins can provision a `User`
  row automatically (`@auth/prisma-adapter`). `Session` goes unused while
  `session.strategy` stays `"jwt"`, but is kept so switching to database
  sessions later doesn't need another migration.

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

# Optional — enterprise SSO, see "Deploying for a company's SSO" above.
# SSO_ISSUER="https://your-company.okta.com"
# SSO_CLIENT_ID="..."
# SSO_CLIENT_SECRET="..."
# SSO_PROVIDER_NAME="Okta"
# INITIAL_ADMIN_EMAILS="admin@your-company.com"
# DISABLE_PASSWORD_LOGIN="false"
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
- **Uploaded media:** currently saved to `public/uploads` on local disk
  (fine for a single persistent server; not suitable for serverless/Vercel,
  where the filesystem isn't persistent — swap `saveFile` in
  `src/lib/actions/posts.ts` for a cloud storage upload, e.g. S3 or Vercel
  Blob, if you deploy there). Server Actions' body size limit is raised to
  100MB in `next.config.ts` to allow video/PDF uploads — adjust alongside
  `MAX_VIDEO_BYTES` / `MAX_DOCUMENT_BYTES` in `src/lib/media.ts` if you need
  different caps.
- **PDF rendering browser support:** `src/components/document-viewer.tsx`
  includes a small polyfill for `Map.prototype.getOrInsertComputed`, a very
  recent JS feature pdfjs-dist 6.x calls unconditionally — needed for
  Chromium builds around version 141 and older (it's a no-op once the
  browser supports the method natively). If PDF pages fail to render in a
  particular browser, this is the first thing to check.
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
