-- Phase 2: contacts, secure document storage, and the access trail.
--
-- The dec page upload on revolinsurance.com is the first thing that writes
-- here. A prospect who hands over their declarations page has given us their
-- address, vehicles, drivers and current coverage — treat that accordingly.
--
-- Design decisions encoded below, so nobody has to re-litigate them:
--   1. One contacts table. A lead becomes a client when a policy binds; it is
--      a status change on the same row, not a different table.
--   2. Files live in a PRIVATE bucket. No public URLs, ever. Reads happen
--      through short-lived signed URLs minted per request.
--   3. Access is decided by assignment, enforced in RLS. A route handler bug
--      cannot leak another producer's book because the database says no.
--   4. Every view and download is logged. You will want this the first time a
--      producer leaves.
--   5. Unconverted prospect documents expire. A dec page for someone who never
--      bound is pure liability sitting in a bucket.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type contact_type as enum ('lead', 'client', 'sphere', 'former');
create type contact_line as enum ('insurance', 'real_estate', 'both');
create type document_kind as enum (
  'declarations_page',
  'policy',
  'id_card',
  'ratified_contract',
  'closing_statement',
  'other'
);
create type document_source as enum ('web_form', 'producer_upload', 'admin_upload', 'carrier');

-- ---------------------------------------------------------------------------
-- Contacts
-- ---------------------------------------------------------------------------

create table public.contacts (
  id                uuid primary key default gen_random_uuid(),
  type              contact_type not null default 'lead',
  line              contact_line not null default 'insurance',

  -- The assigned producer. Null means unassigned: sitting in the admin queue,
  -- visible to admins only, waiting to be routed.
  assigned_to       uuid references public.profiles(id) on delete set null,

  first_name        text not null,
  last_name         text not null,
  email             citext,
  phone             text,
  street            text,
  city              text,
  state             text,
  postal_code       text,

  current_carrier   text,
  renewal_date      date,

  -- Verbatim copy of the disclosure the person agreed to, and when.
  consent_text      text,
  consent_at        timestamptz,

  source            text,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index contacts_assigned_to_idx on public.contacts (assigned_to);
create index contacts_email_idx on public.contacts (lower(email::text));
create index contacts_type_idx on public.contacts (type);

-- ---------------------------------------------------------------------------
-- Documents
-- ---------------------------------------------------------------------------

create table public.documents (
  id              uuid primary key default gen_random_uuid(),
  contact_id      uuid not null references public.contacts(id) on delete cascade,
  kind            document_kind not null default 'other',
  source          document_source not null default 'web_form',

  -- Path inside the private bucket. Always contacts/<contact_id>/<document_id>
  -- so the storage policies can derive ownership from the path itself.
  storage_path    text not null unique,
  original_name   text not null,
  mime_type       text not null,
  size_bytes      bigint not null check (size_bytes > 0 and size_bytes <= 26214400),

  uploaded_by     uuid references public.profiles(id) on delete set null,

  -- Retention. Set on prospect uploads; cleared when the contact becomes a
  -- client. The purge job below deletes anything past its date.
  purge_after     date,

  created_at      timestamptz not null default now()
);

create index documents_contact_id_idx on public.documents (contact_id);
create index documents_purge_after_idx on public.documents (purge_after) where purge_after is not null;

-- ---------------------------------------------------------------------------
-- Access log — append only
-- ---------------------------------------------------------------------------

create table public.document_access_log (
  id            bigserial primary key,
  document_id   uuid not null references public.documents(id) on delete cascade,
  actor_id      uuid references public.profiles(id) on delete set null,
  action        text not null check (action in ('view', 'download', 'share', 'delete')),
  at            timestamptz not null default now(),
  ip            inet,
  user_agent    text
);

create index document_access_log_document_idx on public.document_access_log (document_id, at desc);
create index document_access_log_actor_idx on public.document_access_log (actor_id, at desc);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'broker')
      and coalesce(is_active, true)
  );
$$;

create or replace function public.can_see_contact(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
      or exists (
        select 1 from public.contacts c
        where c.id = target
          and c.assigned_to = auth.uid()
      );
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.contacts            enable row level security;
alter table public.documents           enable row level security;
alter table public.document_access_log enable row level security;

-- Contacts: your own book, or everything if you are an admin.
create policy contacts_select on public.contacts
  for select to authenticated
  using (assigned_to = auth.uid() or public.is_admin());

create policy contacts_update on public.contacts
  for update to authenticated
  using (assigned_to = auth.uid() or public.is_admin())
  with check (assigned_to = auth.uid() or public.is_admin());

-- Only admins reassign or create by hand. Web form inserts run server-side
-- with the service role, which bypasses RLS by design.
create policy contacts_insert_admin on public.contacts
  for insert to authenticated
  with check (public.is_admin());

-- Documents follow their contact.
create policy documents_select on public.documents
  for select to authenticated
  using (public.can_see_contact(contact_id));

create policy documents_insert on public.documents
  for insert to authenticated
  with check (public.can_see_contact(contact_id));

-- Nobody updates a document row. Replace it with a new one; keep the history.
create policy documents_delete_admin on public.documents
  for delete to authenticated
  using (public.is_admin());

-- The log is append-only and readable by whoever can see the document.
create policy access_log_insert on public.document_access_log
  for insert to authenticated
  with check (
    exists (select 1 from public.documents d
            where d.id = document_id and public.can_see_contact(d.contact_id))
  );

create policy access_log_select on public.document_access_log
  for select to authenticated
  using (
    exists (select 1 from public.documents d
            where d.id = document_id and public.can_see_contact(d.contact_id))
  );

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

-- PRIVATE. The `false` is the whole security model — do not flip it.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-documents',
  'client-documents',
  false,
  26214400,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/heic', 'image/webp']
)
on conflict (id) do nothing;

-- Path shape: contacts/<contact_id>/<document_id>[.ext]
-- Policies derive the contact from path segment 2 and reuse can_see_contact,
-- so storage and table permissions can never drift apart.
create policy "client docs: read own book"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'client-documents'
    and public.can_see_contact(((storage.foldername(name))[2])::uuid)
  );

create policy "client docs: write own book"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'client-documents'
    and public.can_see_contact(((storage.foldername(name))[2])::uuid)
  );

create policy "client docs: admins delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'client-documents' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Retention
-- ---------------------------------------------------------------------------

-- Prospect uploads get 180 days. Binding a policy should clear purge_after.
create or replace function public.set_default_purge()
returns trigger
language plpgsql
as $$
begin
  if new.purge_after is null then
    if exists (select 1 from public.contacts c where c.id = new.contact_id and c.type = 'lead') then
      new.purge_after := (current_date + interval '180 days')::date;
    end if;
  end if;
  return new;
end;
$$;

create trigger documents_default_purge
  before insert on public.documents
  for each row execute function public.set_default_purge();

create or replace function public.clear_purge_on_conversion()
returns trigger
language plpgsql
as $$
begin
  if new.type = 'client' and old.type is distinct from 'client' then
    update public.documents set purge_after = null where contact_id = new.id;
  end if;
  return new;
end;
$$;

create trigger contacts_clear_purge
  after update of type on public.contacts
  for each row execute function public.clear_purge_on_conversion();

-- Run daily. Deletes the storage object first, then the row.
-- (Schedule with pg_cron, or a Vercel cron hitting an admin route.)
create or replace function public.purge_expired_documents()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  delete from storage.objects
  where bucket_id = 'client-documents'
    and name in (select storage_path from public.documents
                 where purge_after is not null and purge_after < current_date);

  with gone as (
    delete from public.documents
    where purge_after is not null and purge_after < current_date
    returning 1
  )
  select count(*) into removed from gone;

  return removed;
end;
$$;
