# revolinsurance.com

Next.js 16 (App Router) + TypeScript. Deploys to Vercel. Producers, leads and
dec pages live in the REVOL Team Supabase project (see "Phase 2" below). Without
Supabase credentials the site still builds and renders, with an empty producer
directory and email-only leads.

```
app/
  page.tsx                  homepage
  agents/page.tsx           producer directory
  agents/[slug]/page.tsx    producer pages — all three license variants
  quote/page.tsx            standalone quote form
  claims/page.tsx           report-a-claim guidance
  api/lead/route.ts         instant-quote leads
  api/formal-quote/route.ts formal-quote leads + declarations page upload
  api/health/route.ts       is this deployment connected? plain-English answer
components/
  Chrome.tsx                nav (collapses at 900px) + footer
  QuoteForm.tsx             instant quote; owns SUBMIT_LABEL + CONSENT_TEXT
  FormalQuoteForm.tsx       formal quote; dec page upload, Canopy slot
  QuoteChooser.tsx          instant/formal tabs, P&C pages and /quote
  CarrierWall.tsx           renders only carriers approved for display
supabase/migrations/
  0001_preflight_check.sql  read-only checks — run first, read results
  0002_client_contacts_and_documents.sql   contacts, client_documents, RLS, bucket
  0003_producer_pages.sql   insurance page fields on profiles
lib/
  agency.ts                 address, phone, email, legal entity — one source
  documents.ts              lead intake → contacts + private bucket
  supabase-server.ts        server-only service-role helper
  producers.ts              producer pages, read from REVOL Team profiles
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

- [ ] **Producers.** Published from REVOL Team `profiles` (Phase 2, step 4).
      Until one is published, the directory and homepage show an honest empty
      state rather than fake people. Bio, headshot, phone and email come from
      the producer's existing REVOL Team profile, so fill those in there.
- [x] **Carrier display approval.** Confirmed 15 Oct 2026; all ten are live.
      The `displayApproved` flag stays in `lib/carriers.ts` — set one to `false`
      and that logo disappears site-wide.
- [x] **Consent wording.** Approved text is in `QuoteForm.tsx` as `CONSENT_TEXT`,
      shown under the submit button and stored verbatim on every lead. It names
      the button by its label, so `SUBMIT_LABEL` and the sentence must change
      together or not at all.
- [x] **State license numbers.** Agency NPN and MD license are in
      `lib/agency.ts` (20 Oct 2026); add a row to `licenses` for each new state.
- [ ] **Headshots.** Stock portraits on producer pages undercut the whole site.
- [ ] **Claims page.** Carrier claim numbers and links. Must never read as
      though a form submitted to REVOL files the claim.
- [x] **Legal pages.** `/privacy`, `/terms` and `/accessibility` approved by
      the broker on 20 Oct 2026; the review notes are removed.
- [ ] **Medicare content.** If a producer markets Medicare, that page needs its
      own CMS compliance review.

## Lead routing

`POST /api/lead` takes every form. `POST /api/formal-quote` takes the dec page version.
With Supabase connected, each lead becomes a contact in REVOL Team (see "What
happens to a lead" below). The email heads-up goes to the producer whose page
it came from; anything else goes to `LEADS_FALLBACK_EMAIL`, flagged UNASSIGNED.

Two deliberate behaviours:

- The endpoint returns `{ ok: true }` to the visitor even when email delivery
  fails, and logs the full lead to the server console. A broken integration
  should never show a prospect an error — but it does mean you must watch the
  logs until delivery is confirmed working.
- Speed-to-lead escalation (re-routing a lead nobody claims) is not built
  yet. Unassigned leads notify every admin and wait in the queue.

## The two quote paths

`QuoteChooser` shows both on P&C producer pages and on `/quote`. Life-only
producers keep the single conversational form — a dec page does not apply.

- **Instant** → `POST /api/lead`. A few fields, a ballpark back.
- **Formal** → `POST /api/formal-quote` as multipart. The client uploads their
  declarations page (PDF or photo, 10MB cap, validated server-side as well as
  in the browser). It is stored in the private `client-documents` bucket and
  the producer gets a link to REVOL Team, not an attachment. Only if that
  storage write fails does the email carry the file, so the lead is never lost.

The Canopy Connect button is rendered disabled and labelled "coming soon"
rather than hidden, so producers can show clients it is on the way. Wire it in
`FormalQuoteForm.tsx` when the integration exists.

## Phase 2: REVOL Team is the source of truth

Producers, leads and dec pages all live in the REVOL Team Supabase project.
The site works without it (empty producer directory, email-only leads), so
nothing breaks before these steps are done.

### Turning it on

1. **Run `0001_preflight_check.sql`** in the Supabase SQL Editor on the REVOL
   Team project. Read all three results. If any existing gate policy comes back
   `PERMISSIVE`, stop and fix that first — it means any active user can read
   every row of that table today.
2. **Run `0002_client_contacts_and_documents.sql`**, then
   **`0003_producer_pages.sql`**, each in full, in that order.
3. **Add two env vars to the revolinsurance Vercel project** (all environments),
   then redeploy:
   - `SUPABASE_URL` — Project Settings → Data API → Project URL
     (`https://<ref>.supabase.co`; a trailing `/rest/v1` is tolerated)
   - `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API Keys: the legacy
     `service_role` key (`eyJ…`) or a new secret key (`sb_secret_…`). **Not**
     the anon or publishable key — those return zero rows without an error.
     Server-only. Never a `NEXT_PUBLIC_` name.
   - Then open **`/api/health`** on the deployment. Its `diagnosis` line says
     what is wrong, or lists the live producer pages. If `/api/health` itself
     404s, the deployment is running older code than this README.
4. **Publish producers** in the Supabase Table Editor → `profiles`. For each:
   `sells_insurance = true`, `ins_slug` (e.g. `ryan-sebeck`), `ins_lines`
   (`{pc}`, `{life}` or `{pc,life}`), `ins_states` (`{MD,VA}`), `npn`, then
   `ins_page_published = true`. Bio, photo, phone, email and socials already
   come from their existing profile. The page appears within five minutes.

### What happens to a lead

- **Instant quote** → contact in `contacts`, assigned to the producer whose page
  it came from, or into the insurance unassigned queue. Notification row for
  the producer (or every admin, if unassigned). Email heads-up as well.
- **Formal quote** → same, plus the dec page into the private
  `client-documents` bucket. The email links to REVOL Team and carries **no
  attachment**. If the database write fails for any reason, the route falls
  back to emailing the attachment so the lead is never lost.
- A returning email address updates the existing contact rather than creating
  a duplicate, and notifies its producer.

### Security model

- Contacts and documents: assigned producer, admins, or — while unassigned —
  anyone on the insurance side, mirroring the existing `referrals` policy.
- `active people only` and `two step only` are **restrictive**. Client documents
  need two-step, same as `agent_files`.
- `can_see_contact()` checks `is_active()` itself, so a deactivated producer
  loses file access immediately even if still assigned.
- Storage policies use `uuid_or_null()`, never a bare `::uuid`, so a non-uuid
  path in another bucket can't throw and break file access app-wide.
- Leads' documents expire after 180 days; becoming a client clears that.
  Schedule `purge_expired_client_documents()` daily (pg_cron snippet in 0002).
- The service role key lives on this site's server. Every query names its
  columns, which is what keeps payroll and comp fields off the public pages.

### Still to build — in the REVOL Team repo, not here

The data now lands in REVOL Team, but REVOL Team has no screen for it yet.
Notification links point at `/contacts/<id>`, which will 404 until that page
exists. Needed there: a contacts list with the unassigned queue and a Claim
button, a contact detail page, and a document viewer that mints signed URLs
as the signed-in producer and writes to `client_document_access`.
