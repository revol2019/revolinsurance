-- ============================================================================
-- Phase 2: producer pages on revolinsurance.com, driven from REVOL Team
--
-- profiles already carries what a producer page needs: full_name, title, bio,
-- phone, email, avatar_path (public `avatars` bucket), instagram, facebook,
-- linkedin, sells_insurance, sells_real_estate. This adds only the
-- insurance-specific fields. Every column is nullable or defaulted; no
-- existing row or query changes.
--
-- A page appears on the site only when ALL of these are true:
--   active = true, sells_insurance = true, ins_page_published = true
-- so turning a page on is a deliberate act, and deactivating a departed
-- producer takes their page down with nothing else to remember.
-- ============================================================================

alter table public.profiles
  -- URL: revolinsurance.com/agents/<ins_slug>. Lowercase, letters, digits, dashes.
  add column if not exists ins_slug text,

  -- Which quote modules render: 'pc', 'life', or both.
  add column if not exists ins_lines text[] not null default '{}',

  -- Two-letter state codes, e.g. {MD,VA,DC}.
  add column if not exists ins_states text[] not null default '{}',

  add column if not exists npn text,

  -- Carrier slugs matching lib/carriers.ts on the site, e.g. {travelers,safeco}.
  -- Empty = show every approved carrier for the producer's lines.
  add column if not exists ins_carriers text[] not null default '{}',

  -- Scheduling link for the "Book a 15-minute call" button. Optional.
  add column if not exists ins_calendar_url text,

  -- Insurance-specific social links. When null, the page falls back to the
  -- general instagram / facebook / linkedin columns.
  add column if not exists ins_instagram text,
  add column if not exists ins_facebook text,
  add column if not exists ins_linkedin text,

  -- The switch. Nothing is public until an admin turns this on.
  add column if not exists ins_page_published boolean not null default false;

-- Constraints added separately so a re-run does not fail on existing ones.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_ins_slug_format') then
    alter table public.profiles add constraint profiles_ins_slug_format
      check (ins_slug is null or ins_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_ins_lines_valid') then
    alter table public.profiles add constraint profiles_ins_lines_valid
      check (ins_lines <@ array['pc', 'life']::text[]);
  end if;

  -- A published page must have somewhere to live and something to quote.
  if not exists (select 1 from pg_constraint where conname = 'profiles_ins_page_complete') then
    alter table public.profiles add constraint profiles_ins_page_complete
      check (not ins_page_published or (ins_slug is not null and cardinality(ins_lines) > 0));
  end if;
end $$;

create unique index if not exists profiles_ins_slug_key
  on public.profiles (ins_slug) where ins_slug is not null;

-- Only an admin publishes or unpublishes a page. A producer can still edit
-- their own bio and links through the existing "profiles update" policy;
-- this trigger stops them flipping the switch themselves.
--
-- auth.uid() is null when there is no app user — the Supabase dashboard's
-- table editor, SQL editor, or a service-role script. Those are already
-- privileged, so the guard applies only to signed-in app users.
create or replace function public.profiles_guard_ins_publish()
returns trigger language plpgsql as $$
begin
  if new.ins_page_published is distinct from old.ins_page_published
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only an admin can publish or unpublish an insurance page.';
  end if;
  return new;
end $$;

drop trigger if exists profiles_guard_ins_publish on public.profiles;
create trigger profiles_guard_ins_publish
  before update on public.profiles
  for each row execute function public.profiles_guard_ins_publish();
