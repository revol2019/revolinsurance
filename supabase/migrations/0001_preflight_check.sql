-- ============================================================================
-- PRE-FLIGHT. Read-only. Run this BEFORE 0002 and 0003, and read the results.
-- ============================================================================

-- 1. Are REVOL Team's existing gate policies RESTRICTIVE?
--
-- Every existing table has "active people only" and some have "two step only".
-- Postgres ORs PERMISSIVE policies together. If these two are PERMISSIVE,
-- then any active user passes them and can read EVERY row of that table —
-- every agent's ACH form and license in agent_files, every referral —
-- regardless of the owner/admin rules beside them.
--
-- Expected: every row below says RESTRICTIVE.
-- If any say PERMISSIVE: stop, and fix those before running anything else.
select tablename, policyname, permissive
from pg_policies
where schemaname = 'public'
  and policyname in ('active people only', 'two step only')
order by permissive, tablename;

-- 2. my_company() must return the `company` enum — 0002 compares it to
--    contacts.company. Expected: company
select p.proname, pg_catalog.format_type(p.prorettype, null) as returns
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('my_company', 'is_admin', 'is_active', 'is_staff', 'is_two_step');

-- 3. Nothing should already exist under the names 0002 and 0003 create.
--    Expected: zero rows.
select 'table' as kind, table_name as name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('contacts', 'client_documents', 'client_document_access')
union all
select 'column', column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles' and column_name like 'ins\_%'
union all
select 'bucket', id from storage.buckets where id = 'client-documents';
