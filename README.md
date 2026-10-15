# revolinsurance.com

Next.js 16 (App Router) + TypeScript. Deploys to Vercel. No database required to
launch — leads are delivered by email until the phase 2 Supabase layer exists.

```
app/
  page.tsx                  homepage
  agents/page.tsx           producer directory
  agents/[slug]/page.tsx    producer pages — all three license variants
  quote/page.tsx            standalone quote form
  claims/page.tsx           report-a-claim guidance
  api/lead/route.ts         instant-quote leads
  api/formal-quote/route.ts formal-quote leads + declarations page upload
components/
  Chrome.tsx                nav (collapses at 900px) + footer
  QuoteForm.tsx             instant quote; owns SUBMIT_LABEL + CONSENT_TEXT
  FormalQuoteForm.tsx       formal quote; dec page upload, Canopy slot
  QuoteChooser.tsx          instant/formal tabs, P&C pages and /quote
  CarrierWall.tsx           renders only carriers approved for display
supabase/migrations/
  0002_client_documents.sql contacts, documents, RLS, storage, retention
lib/
  agency.ts                 address, phone, email, legal entity — one source
  documents.ts              phase 2 intake + signed URLs — NOT wired yet
  producers.ts              producer records — swap for Supabase later
  carriers.ts               carrier marks + display approval flags
public/carriers, public/photos
```

## Run it

```bash
npm install
cp .env.example .env.local   # fill in LEADS_FALLBACK_EMAIL at minimum
npm run dev
```

`npm run build` needs network access to fonts.googleapis.com, because
`next/font` downloads and self-hosts the fonts at build time. Vercel's builders
have it; a locked-down sandbox may not.

## Deploy

1. Push this directory to a new **private** GitHub repo.
2. In Vercel, New Project → import that repo. Framework auto-detects as Next.js;
   no build settings to change.
3. Add the environment variables from `.env.example` to all three environments.
4. Add `revolinsurance.com` and `www.revolinsurance.com` under the project's
   Domains tab, then point DNS at the records Vercel shows.

Subdomains per producer (`lastname.revolinsurance.com`) would require moving the
apex domain's nameservers to Vercel so it can issue wildcard SSL. Paths
(`/agents/lastname`) are what this build uses and what the plan recommends.

## Before this goes live

Nothing here is a style preference — each one is either a legal exposure or a
page that will read as broken.

- [ ] **Producers.** `lib/producers.ts` ships with an empty array, so the
      directory and homepage show an honest empty state rather than fake people.
      Add real entries and the pages appear. Needs per producer: name, title,
      licenses, states, NPN, direct line, email, bio, headshot, carrier slugs.
- [x] **Carrier display approval.** Confirmed 15 Oct 2026; all ten are live.
      The `displayApproved` flag stays in `lib/carriers.ts` — set one to `false`
      and that logo disappears site-wide.
- [x] **Consent wording.** Approved text is in `QuoteForm.tsx` as `CONSENT_TEXT`,
      shown under the submit button and stored verbatim on every lead. It names
      the button by its label, so `SUBMIT_LABEL` and the sentence must change
      together or not at all.
- [ ] **State license numbers.** The only remaining footer placeholder.
      Everything else in `lib/agency.ts` is filled in.
- [ ] **Office address and main phone.** Footer placeholders.
- [ ] **Headshots.** Stock portraits on producer pages undercut the whole site.
- [ ] **Claims page.** Carrier claim numbers and links. Must never read as
      though a form submitted to REVOL files the claim.
- [ ] **Legal pages.** `/privacy`, `/terms` and `/accessibility` now exist and
      describe what the site actually does, so no footer link 404s. Each carries
      a visible "needs counsel review" note — have an attorney read them and
      remove the note.
- [ ] **Medicare content.** If a producer markets Medicare, that page needs its
      own CMS compliance review.

## Lead routing

`POST /api/lead` takes every form. A lead from a producer page goes to that
producer's email; anything else goes to `LEADS_FALLBACK_EMAIL`, flagged
UNASSIGNED in the subject line.

Two deliberate behaviours:

- The endpoint returns `{ ok: true }` to the visitor even when email delivery
  fails, and logs the full lead to the server console. A broken integration
  should never show a prospect an error — but it does mean you must watch the
  logs until delivery is confirmed working.
- There is no unassigned queue, no assignment log and no speed-to-lead
  escalation yet. Those need the Supabase tables from phase 2. Set `SUPABASE_URL`
  and `SUPABASE_SERVICE_ROLE_KEY` and the route starts writing to a `leads`
  table as well as emailing.

## The two quote paths

`QuoteChooser` shows both on P&C producer pages and on `/quote`. Life-only
producers keep the single conversational form — a dec page does not apply.

- **Instant** → `POST /api/lead`. A few fields, a ballpark back.
- **Formal** → `POST /api/formal-quote` as multipart. The client uploads their
  declarations page (PDF or photo, 10MB cap, validated server-side as well as
  in the browser) and it goes to the assigned producer as an email attachment.

**No file is stored anywhere.** A dec page carries the client's address,
vehicles, drivers and coverage detail. Emailing it to the one producer who needs
it and keeping no copy is a far smaller footprint than a storage bucket nobody
has secured yet. When the phase 2 document store lands with real access control,
move it there — not before.

The Canopy Connect button is rendered disabled and labelled "coming soon"
rather than hidden, so producers can show clients it is on the way. Wire it in
`FormalQuoteForm.tsx` when the integration exists.

## Phase 2: secure document storage

Written and ready, deliberately not switched on. Run
`supabase/migrations/0002_client_documents.sql`, then replace the
email-attachment block in `app/api/formal-quote/route.ts` with
`intakeDecPage()` from `lib/documents.ts`. The form does not change.

What the migration sets up:

- `contacts` — one table, `type` moves lead → client when a policy binds.
- `documents` — metadata; files live in the private `client-documents` bucket
  at `contacts/<contact_id>/<document_id>`.
- `document_access_log` — append-only record of every view and download.
- RLS on all three plus `storage.objects`, keyed off `assigned_to`. Storage
  policies read the contact id out of the path, so file permissions and row
  permissions cannot drift apart.
- Retention: prospect uploads get 180 days, cleared automatically when the
  contact converts. `purge_expired_documents()` runs daily via pg_cron or a
  Vercel cron.

Two rules the helpers enforce:

- **Public form writes use the service role.** The submitter is anonymous and
  must never hold a token that reads anything back.
- **Producer reads use the producer's JWT**, so RLS decides. Passing the
  service key to `signedDocumentUrl()` would hand any producer the whole
  bucket. There is no code path that produces a public link.
