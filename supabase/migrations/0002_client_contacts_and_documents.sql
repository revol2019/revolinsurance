-- ============================================================================
-- Phase 2: client contacts and secure client documents
--
-- Written against the live REVOL Team schema (15 Oct 2026). Reuses what is
-- already there rather than duplicating it:
--
--   profiles.role      user_role enum: admin, staff, agent, insurance_manager, bookkeeper
--   profiles.company   company enum:   real_estate, mortgage, title, insurance
--   profiles.active    boolean (NOT is_active)
--   is_active(), is_admin(), is_staff(), is_two_step(), my_company()
--                      existing helper functions — the ONLY definition of
--                      "who is an admin" lives there; this file never redefines it
--   notifications      existing table — a new lead becomes a row here. Whether
--                      a row insert ALSO sends a phone push depends on how REVOL
--                      Team dispatches push today; verify before relying on it
--
-- Name collision avoided: `documents` is REVOL University's library. Client
-- files are `client_documents`.
--
-- Access model, copied from the existing `referrals` read policy because it
-- is exactly right for leads:
--   - the assigned producer sees it
--   - admins see everything
--   - an UNASSIGNED insurance contact is visible to everyone on the insurance
--     side until someone claims it — that is the unassigned queue
--
-- Documents are gated behind is_two_step(), the same as agent_files. A dec
-- page carries address, vehicles, drivers and coverage; it earns the same
-- protection as a producer's own ACH form. Drop to is_active() in the two
-- marked places if the friction proves too much.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.contact_stage as enum ('lead', 'quoting', 'client', 'former', 'sphere');
create type public.client_document_kind as enum (
  'declarations_page',
  'policy',
  'id_card',
  'binder',
  'ratified_contract',
  'closing_statement',
  'other'
);

-- ---------------------------------------------------------------------------
-- Contacts
-- ---------------------------------------------------------------------------

create table public.contacts (
  id              uuid primary key default gen_random_uuid(),

  -- Which side of the house owns this record. Mirrors profiles.company so
  -- my_company() can gate the unassigned queue.
  company         public.company not null default 'insurance',
  stage           public.contact_stage not null default 'lead',

  -- Null = unassigned, sitting in the queue for that company.
  assigned_to     uuid references public.profiles(id) on delete set null,

  first_name      text not null,
  last_name       text not null,
  email           text,
  phone           text,
  street          text,
  city            text,
  state           text,
  postal_code     text,

  current_carrier text,
  renewal_date    date,

  -- What the person agreed to, word for word, and when.
  consent_text    text,
  consent_at      timestamptz,

  -- Where this came from: 'web-instant', 'web-formal', 'producer-page:<slug>',
  -- 'referral', 'manual'.
  source          text,

  -- When a real estate agent hands off a client, keep the thread. Lets the
  -- cross-sell report answer "how many of our buyers did we write?".
  referral_id     uuid references public.referrals(id) on delete set null,

  notes           text,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index contacts_assigned_idx  on public.contacts (assigned_to);
create index contacts_company_idx   on public.contacts (company, stage);
create index contacts_email_idx     on public.contacts (lower(email));
create index contacts_queue_idx     on public.contacts (company) where assigned_to is null;

create or replace function public.contacts_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

create trigger contacts_touch before update on public.contacts
  for each row execute function public.contacts_touch_updated_at();

-- ---------------------------------------------------------------------------
-- Client documents
-- ---------------------------------------------------------------------------

create table public.client_documents (
  id             uuid primary key default gen_random_uuid(),
  contact_id     uuid not null references public.contacts(id) on delete cascade,
  kind           public.client_document_kind not null default 'other',

  -- Always client-documents/<contact_id>/<document_id>[.ext]. The storage
  -- policies read the contact id out of the path, so bucket permissions and
  -- table permissions cannot disagree.
  storage_path   text not null unique,
  original_name  text not null,
  mime_type      text not null,
  size_bytes     bigint not null check (size_bytes > 0 and size_bytes <= 26214400),

  -- Null when the client uploaded it themselves from the public site.
  uploaded_by    uuid references public.profiles(id) on delete set null,

  -- Retention. Leads get 180 days; conversion to client clears it.
  purge_after    date,

  created_at     timestamptz not null default now()
);

create index client_documents_contact_idx on public.client_documents (contact_id);
create index client_documents_purge_idx   on public.client_documents (purge_after)
  where purge_after is not null;

-- ---------------------------------------------------------------------------
-- Access log — append only, nobody edits it
-- ---------------------------------------------------------------------------

create table public.client_document_access (
  id           bigserial primary key,
  document_id  uuid not null references public.client_documents(id) on delete cascade,
  actor_id     uuid references public.profiles(id) on delete set null,
  action       text not null check (action in ('view', 'download', 'delete')),
  at           timestamptz not null default now(),
  ip           inet,
  user_agent   text
);

create index client_document_access_doc_idx   on public.client_document_access (document_id, at desc);
create index client_document_access_actor_idx on public.client_document_access (actor_id, at desc);

-- ---------------------------------------------------------------------------
-- One visibility rule, used by the table AND the bucket
-- ---------------------------------------------------------------------------

create or replace function public.can_see_contact(target uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  -- is_active() here matters: this function is SECURITY DEFINER and is what
  -- the storage policies call, so it bypasses the table's restrictive gates.
  -- Without it, a deactivated producer still assigned to a contact could keep
  -- opening that client's files.
  select public.is_active() and exists (
    select 1 from public.contacts c
    where c.id = target
      and (
        public.is_admin()
        or c.assigned_to = auth.uid()
        -- the unassigned queue: anyone on that company's side may claim it
        or (c.assigned_to is null and c.company = public.my_company())
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.contacts               enable row level security;
alter table public.client_documents       enable row level security;
alter table public.client_document_access enable row level security;

-- Gate policies are RESTRICTIVE. Postgres ORs permissive policies together,
-- so a permissive "is_active()" policy would let every active user read every
-- row and the assignment rules below would never matter. Restrictive policies
-- are ANDed: you must pass this AND one of the permissive ones.
create policy "active people only" on public.contacts
  as restrictive for all to authenticated
  using (public.is_active()) with check (public.is_active());

create policy "contacts read" on public.contacts
  for select to authenticated
  using (
    public.is_admin()
    or assigned_to = auth.uid()
    or (assigned_to is null and company = public.my_company())
  );

create policy "contacts insert" on public.contacts
  for insert to authenticated
  with check (public.is_active());

-- Claim from the queue, or edit your own. Reassigning someone else's is admin.
create policy "contacts update" on public.contacts
  for update to authenticated
  using (
    public.is_admin()
    or assigned_to = auth.uid()
    or (assigned_to is null and company = public.my_company())
  )
  with check (
    public.is_admin()
    or assigned_to = auth.uid()
  );

create policy "contacts delete" on public.contacts
  for delete to authenticated using (public.is_admin());

-- Documents: active AND two-step, like agent_files. Both RESTRICTIVE.
-- To drop the two-step requirement, delete the second policy here and the
-- is_two_step() line in the storage read policy below — nothing else.
create policy "active people only" on public.client_documents
  as restrictive for all to authenticated
  using (public.is_active()) with check (public.is_active());
create policy "two step only" on public.client_documents
  as restrictive for all to authenticated
  using (public.is_two_step()) with check (public.is_two_step());

create policy "client docs read" on public.client_documents
  for select to authenticated using (public.can_see_contact(contact_id));

create policy "client docs insert" on public.client_documents
  for insert to authenticated with check (public.can_see_contact(contact_id));

create policy "client docs delete" on public.client_documents
  for delete to authenticated using (public.is_admin());

-- Access log: append-only; readable by whoever can see the document.
create policy "active people only" on public.client_document_access
  as restrictive for all to authenticated
  using (public.is_active()) with check (public.is_active());
create policy "access log insert" on public.client_document_access
  for insert to authenticated
  with check (exists (
    select 1 from public.client_documents d
    where d.id = document_id and public.can_see_contact(d.contact_id)
  ));

create policy "access log read" on public.client_document_access
  for select to authenticated
  using (exists (
    select 1 from public.client_documents d
    where d.id = document_id and public.can_see_contact(d.contact_id)
  ));

-- ---------------------------------------------------------------------------
-- Safe uuid cast for storage paths
--
-- Postgres does not promise to evaluate `bucket_id = 'client-documents'`
-- before the rest of a policy. A bare `::uuid` cast on the folder name could
-- therefore run against a file in ANOTHER bucket (agent-files, documents…),
-- whose paths are not uuids, and throw — breaking file access app-wide.
-- This returns null instead of throwing, and can_see_contact(null) is false.
-- ---------------------------------------------------------------------------

create or replace function public.uuid_or_null(v text)
returns uuid
language sql immutable
as $$
  select case
    when v ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then v::uuid
  end;
$$;

-- ---------------------------------------------------------------------------
-- Storage: private bucket, policies derived from the path
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-documents', 'client-documents', false, 26214400,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/heic', 'image/webp']
)
on conflict (id) do nothing;

create policy "client docs: read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'client-documents'
    and public.is_two_step()                                      -- <-- same switch
    and public.can_see_contact(public.uuid_or_null((storage.foldername(name))[1]))
  );

create policy "client docs: write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'client-documents'
    and public.can_see_contact(public.uuid_or_null((storage.foldername(name))[1]))
  );

create policy "client docs: admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'client-documents' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Retention
-- ---------------------------------------------------------------------------

create or replace function public.client_documents_default_purge()
returns trigger language plpgsql as $$
begin
  if new.purge_after is null and exists (
    select 1 from public.contacts c where c.id = new.contact_id and c.stage in ('lead', 'quoting')
  ) then
    new.purge_after := (current_date + interval '180 days')::date;
  end if;
  return new;
end $$;

create trigger client_documents_default_purge
  before insert on public.client_documents
  for each row execute function public.client_documents_default_purge();

create or replace function public.contacts_clear_purge_on_client()
returns trigger language plpgsql as $$
begin
  if new.stage = 'client' and old.stage is distinct from 'client' then
    update public.client_documents set purge_after = null where contact_id = new.id;
  end if;
  return new;
end $$;

create trigger contacts_clear_purge
  after update of stage on public.contacts
  for each row execute function public.contacts_clear_purge_on_client();

-- Daily: pg_cron (`select cron.schedule('purge-client-docs', '0 4 * * *',
-- $$select public.purge_expired_client_documents()$$)`) or a Vercel cron
-- hitting an admin-only route.
create or replace function public.purge_expired_client_documents()
returns integer
language plpgsql security definer
set search_path = public
as $$
declare removed integer;
begin
  delete from storage.objects
  where bucket_id = 'client-documents'
    and name in (select storage_path from public.client_documents
                 where purge_after is not null and purge_after < current_date);

  with gone as (
    delete from public.client_documents
    where purge_after is not null and purge_after < current_date
    returning 1
  ) select count(*) into removed from gone;

  return removed;
end $$;

-- ---------------------------------------------------------------------------
-- Notify the producer via the existing notifications table
-- ---------------------------------------------------------------------------

create or replace function public.notify_new_contact()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  if new.assigned_to is not null then
    insert into public.notifications (user_id, kind, title, body, url)
    values (
      new.assigned_to,
      'new_lead',
      'New lead: ' || new.first_name || ' ' || new.last_name,
      coalesce(new.source, 'web') || case when new.current_carrier is not null
        then ' · currently with ' || new.current_carrier else '' end,
      '/contacts/' || new.id
    );
  else
    -- Unassigned: ping every active admin so it gets routed.
    insert into public.notifications (user_id, kind, title, body, url)
    select p.id, 'unassigned_lead',
           'Unassigned lead: ' || new.first_name || ' ' || new.last_name,
           'Route this one — ' || coalesce(new.source, 'web'),
           '/contacts/' || new.id
    from public.profiles p
    where p.role = 'admin' and coalesce(p.active, true);
  end if;
  return new;
end $$;

create trigger contacts_notify after insert on public.contacts
  for each row execute function public.notify_new_contact();
