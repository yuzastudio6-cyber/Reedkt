-- Prompt 26E-1 local-only RLS advisor table policy catalog smoke test.
-- LOCAL ONLY. PRODUCTION NEVER. Do not run against staging, remote, or production Supabase.
-- Synthetic/catalog-only assertions: this file reads PostgreSQL catalogs and rolls back.
-- No secrets, signed URLs, provider keys, Stripe data, private media, or production data.
-- Run only through the guarded local runner after a localhost-only DB URL is proven.
-- This test intentionally does not insert fixture rows because accepted column/schema
-- evidence for these connected-advisor tables is incomplete.

\set ON_ERROR_STOP on

begin;

set local statement_timeout = '15s';
set local idle_in_transaction_session_timeout = '30s';

do $$
declare
  missing_tables text[];
begin
  with expected(table_name) as (
    values
      ('activation_artifacts'),
      ('activation_qa_gates'),
      ('activation_runs'),
      ('feature_gates'),
      ('readiness_snapshots'),
      ('tool_capabilities')
  )
  select coalesce(array_agg(table_name order by table_name), '{}'::text[])
  into missing_tables
  from expected
  where to_regclass(format('public.%I', table_name)) is null;

  if array_length(missing_tables, 1) is not null then
    raise exception
      'Prompt 26E-1 local RLS precondition failed. Missing advisor tables: %',
      array_to_string(missing_tables, ', ');
  end if;
end
$$;

do $$
declare
  rls_disabled text[];
begin
  with expected(table_name) as (
    values
      ('activation_artifacts'),
      ('activation_qa_gates'),
      ('activation_runs'),
      ('feature_gates'),
      ('readiness_snapshots'),
      ('tool_capabilities')
  )
  select coalesce(array_agg(e.table_name order by e.table_name), '{}'::text[])
  into rls_disabled
  from expected e
  join pg_class c on c.oid = to_regclass(format('public.%I', e.table_name))
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
    and c.relrowsecurity is not true;

  if array_length(rls_disabled, 1) is not null then
    raise exception
      'Prompt 26E-1 local RLS check failed. RLS disabled for: %',
      array_to_string(rls_disabled, ', ');
  end if;
end
$$;

do $$
declare
  missing_policies text[];
begin
  with expected(table_name, policy_name, command_name) as (
    values
      ('activation_artifacts', 'activation_artifacts_select_backend_only', 'SELECT'),
      ('activation_artifacts', 'activation_artifacts_insert_backend_only', 'INSERT'),
      ('activation_artifacts', 'activation_artifacts_update_backend_only', 'UPDATE'),
      ('activation_artifacts', 'activation_artifacts_delete_backend_only', 'DELETE'),
      ('activation_qa_gates', 'activation_qa_gates_select_backend_only', 'SELECT'),
      ('activation_qa_gates', 'activation_qa_gates_insert_backend_only', 'INSERT'),
      ('activation_qa_gates', 'activation_qa_gates_update_backend_only', 'UPDATE'),
      ('activation_qa_gates', 'activation_qa_gates_delete_backend_only', 'DELETE'),
      ('activation_runs', 'activation_runs_select_backend_only', 'SELECT'),
      ('activation_runs', 'activation_runs_insert_backend_only', 'INSERT'),
      ('activation_runs', 'activation_runs_update_backend_only', 'UPDATE'),
      ('activation_runs', 'activation_runs_delete_backend_only', 'DELETE'),
      ('feature_gates', 'feature_gates_select_no_client_access', 'SELECT'),
      ('feature_gates', 'feature_gates_insert_backend_only', 'INSERT'),
      ('feature_gates', 'feature_gates_update_backend_only', 'UPDATE'),
      ('feature_gates', 'feature_gates_delete_backend_only', 'DELETE'),
      ('readiness_snapshots', 'readiness_snapshots_select_backend_only', 'SELECT'),
      ('readiness_snapshots', 'readiness_snapshots_insert_backend_only', 'INSERT'),
      ('readiness_snapshots', 'readiness_snapshots_update_backend_only', 'UPDATE'),
      ('readiness_snapshots', 'readiness_snapshots_delete_backend_only', 'DELETE'),
      ('tool_capabilities', 'tool_capabilities_select_no_client_access', 'SELECT'),
      ('tool_capabilities', 'tool_capabilities_insert_backend_only', 'INSERT'),
      ('tool_capabilities', 'tool_capabilities_update_backend_only', 'UPDATE'),
      ('tool_capabilities', 'tool_capabilities_delete_backend_only', 'DELETE')
  )
  select coalesce(array_agg(e.table_name || '.' || e.policy_name order by e.table_name, e.policy_name), '{}'::text[])
  into missing_policies
  from expected e
  left join pg_policies p
    on p.schemaname = 'public'
   and p.tablename = e.table_name
   and p.policyname = e.policy_name
   and p.cmd = e.command_name
  where p.policyname is null;

  if array_length(missing_policies, 1) is not null then
    raise exception
      'Prompt 26E-1 local RLS check failed. Missing policies: %',
      array_to_string(missing_policies, ', ');
  end if;
end
$$;

do $$
declare
  invalid_policies text[];
begin
  with expected(table_name, policy_name, command_name, expects_qual, expects_check) as (
    values
      ('activation_artifacts', 'activation_artifacts_select_backend_only', 'SELECT', true, false),
      ('activation_artifacts', 'activation_artifacts_insert_backend_only', 'INSERT', false, true),
      ('activation_artifacts', 'activation_artifacts_update_backend_only', 'UPDATE', true, true),
      ('activation_artifacts', 'activation_artifacts_delete_backend_only', 'DELETE', true, false),
      ('activation_qa_gates', 'activation_qa_gates_select_backend_only', 'SELECT', true, false),
      ('activation_qa_gates', 'activation_qa_gates_insert_backend_only', 'INSERT', false, true),
      ('activation_qa_gates', 'activation_qa_gates_update_backend_only', 'UPDATE', true, true),
      ('activation_qa_gates', 'activation_qa_gates_delete_backend_only', 'DELETE', true, false),
      ('activation_runs', 'activation_runs_select_backend_only', 'SELECT', true, false),
      ('activation_runs', 'activation_runs_insert_backend_only', 'INSERT', false, true),
      ('activation_runs', 'activation_runs_update_backend_only', 'UPDATE', true, true),
      ('activation_runs', 'activation_runs_delete_backend_only', 'DELETE', true, false),
      ('feature_gates', 'feature_gates_select_no_client_access', 'SELECT', true, false),
      ('feature_gates', 'feature_gates_insert_backend_only', 'INSERT', false, true),
      ('feature_gates', 'feature_gates_update_backend_only', 'UPDATE', true, true),
      ('feature_gates', 'feature_gates_delete_backend_only', 'DELETE', true, false),
      ('readiness_snapshots', 'readiness_snapshots_select_backend_only', 'SELECT', true, false),
      ('readiness_snapshots', 'readiness_snapshots_insert_backend_only', 'INSERT', false, true),
      ('readiness_snapshots', 'readiness_snapshots_update_backend_only', 'UPDATE', true, true),
      ('readiness_snapshots', 'readiness_snapshots_delete_backend_only', 'DELETE', true, false),
      ('tool_capabilities', 'tool_capabilities_select_no_client_access', 'SELECT', true, false),
      ('tool_capabilities', 'tool_capabilities_insert_backend_only', 'INSERT', false, true),
      ('tool_capabilities', 'tool_capabilities_update_backend_only', 'UPDATE', true, true),
      ('tool_capabilities', 'tool_capabilities_delete_backend_only', 'DELETE', true, false)
  ),
  policy_shape as (
    select
      e.table_name,
      e.policy_name,
      e.command_name,
      e.expects_qual,
      e.expects_check,
      p.roles::text[] as roles,
      lower(regexp_replace(coalesce(p.qual, ''), '[[:space:]]', '', 'g')) as normalized_qual,
      lower(regexp_replace(coalesce(p.with_check, ''), '[[:space:]]', '', 'g')) as normalized_check
    from expected e
    join pg_policies p
      on p.schemaname = 'public'
     and p.tablename = e.table_name
     and p.policyname = e.policy_name
     and p.cmd = e.command_name
  )
  select coalesce(array_agg(table_name || '.' || policy_name order by table_name, policy_name), '{}'::text[])
  into invalid_policies
  from policy_shape
  where coalesce(array_length(roles, 1), 0) <> 2
     or not (roles @> array['anon', 'authenticated']::text[])
     or (expects_qual and normalized_qual not in ('false', '(false)'))
     or (not expects_qual and normalized_qual <> '')
     or (expects_check and normalized_check not in ('false', '(false)'))
     or (not expects_check and normalized_check <> '');

  if array_length(invalid_policies, 1) is not null then
    raise exception
      'Prompt 26E-1 local RLS check failed. Policies are not explicit deny-only anon/authenticated catalog entries: %',
      array_to_string(invalid_policies, ', ');
  end if;
end
$$;

rollback;
