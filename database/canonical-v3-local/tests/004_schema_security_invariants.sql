\set ON_ERROR_STOP on
\echo 'canonical-v3-local: schema, RLS, grant, and RPC security invariants'

do $$
declare
  expected_tables text[] := array[
    'profiles', 'workspaces', 'workspace_members', 'projects', 'edit_sessions',
    'exact_edit_brief_versions', 'exact_edit_preference_states',
    'edit_plan_versions', 'edit_credit_estimates',
    'approved_plan_snapshots', 'edit_execution_authorizations',
    'edit_references', 'preference_study_sessions', 'preference_study_messages',
    'preference_evidence', 'preference_assets', 'preference_evidence_assets',
    'preference_evidence_asset_long_form_events',
    'edit_reference_domain_states', 'edit_reference_domain_audit_events',
    'edit_reference_domain_idempotency_receipts',
    'preference_study_reasoning_runs',
    'preference_study_reasoning_route_attempts',
    'preference_study_reasoning_provider_requests',
    'preference_study_reasoning_provider_observations',
    'preference_study_reasoning_checkbacks',
    'preference_study_reasoning_run_receipts',
    'preference_long_form_study_plans', 'preference_long_form_study_runs',
    'preference_long_form_study_work_items', 'preference_long_form_study_attempts',
    'preference_long_form_study_checkpoints', 'preference_long_form_study_work_outputs',
    'preference_long_form_study_checkpoint_authority',
    'preference_long_form_study_idempotency_receipts',
    'preference_long_form_study_lease_escrow',
    'preference_long_form_study_audit_events',
    'preference_skill_runs', 'preference_dna_versions', 'preference_dna_qa_results',
    'preference_dna_lifecycle_events',
    'preference_applications', 'preference_usage_events', 'preference_audit_segments',
    'preference_application_plan_invalidations', 'edit_reference_idempotency_receipts',
    'preference_application_lifecycle_events', 'exact_edit_preference_apply_events'
  ];
  expected_table text;
  actual_count integer;
begin
  foreach expected_table in array expected_tables loop
    if to_regclass('public.' || expected_table) is null then
      raise exception 'SCHEMA_EXPECTED_TABLE_MISSING_%', expected_table;
    end if;
    if not exists (
      select 1 from pg_class relation
      join pg_namespace namespace on namespace.oid = relation.relnamespace
      where namespace.nspname = 'public'
        and relation.relname = expected_table
        and relation.relrowsecurity
        and relation.relforcerowsecurity
    ) then
      raise exception 'SCHEMA_RLS_NOT_FORCED_%', expected_table;
    end if;
  end loop;

  select count(*) into actual_count
  from pg_class relation
  join pg_namespace namespace on namespace.oid = relation.relnamespace
  where namespace.nspname = 'public'
    and relation.relkind = 'r'
    and relation.relname = any(expected_tables);
  if actual_count <> cardinality(expected_tables) then
    raise exception 'SCHEMA_TABLE_COUNT_%_EXPECTED_%', actual_count, cardinality(expected_tables);
  end if;

  if exists (
    select 1
    from information_schema.role_table_grants grant_row
    where grant_row.table_schema = 'public'
      and grant_row.grantee in ('anon', 'authenticated', 'service_role')
      and grant_row.privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'TRIGGER', 'REFERENCES')
      and grant_row.table_name = any(expected_tables)
  ) then
    raise exception 'SCHEMA_DIRECT_MUTATION_GRANT_PRESENT';
  end if;

  if exists (
    select 1 from pg_policies policy
    where policy.schemaname = 'public'
      and policy.tablename = any(expected_tables)
      and policy.cmd <> 'SELECT'
  ) then
    raise exception 'SCHEMA_DIRECT_WRITE_RLS_POLICY_PRESENT';
  end if;

  if has_function_privilege('anon', 'public.read_exact_edit_apply_authority_v1(text,text,jsonb)', 'EXECUTE')
    or has_function_privilege('anon', 'public.apply_exact_edit_preferences_and_reference_v1(text,jsonb)', 'EXECUTE')
    or has_function_privilege('anon', 'public.mutate_edit_reference_application_lifecycle_v3(text,jsonb)', 'EXECUTE')
    or has_function_privilege('anon', 'public.reserve_edit_reference_study_chat_run_v1(jsonb)', 'EXECUTE')
    or has_function_privilege('anon', 'public.read_edit_reference_domain_aggregate_v1(text,jsonb)', 'EXECUTE')
    or has_function_privilege('anon', 'public.mutate_edit_reference_domain_command_v1(text,uuid,jsonb,text,text)', 'EXECUTE')
    or has_function_privilege('anon', 'public.read_edit_reference_domain_aggregate_v2(text,jsonb)', 'EXECUTE')
    or has_function_privilege('anon', 'public.read_edit_reference_domain_idempotency_v1(uuid,uuid,text,text,text)', 'EXECUTE')
    or has_function_privilege('anon', 'public.mutate_edit_reference_domain_command_v2(text,uuid,jsonb,text,text)', 'EXECUTE')
    or has_function_privilege('anon', 'public.mutate_edit_reference_long_form_domain_command_v1(text,uuid,jsonb,text,text)', 'EXECUTE')
    or has_function_privilege('anon', 'public.reeditpro_register_pre_plan_source_v1(text,jsonb)', 'EXECUTE')
    or has_function_privilege('anon', 'public.reeditpro_register_target_pre_plan_source_v1(text,jsonb)', 'EXECUTE')
    or has_function_privilege('anon', 'public.reeditpro_save_exact_edit_brief_v1(text,jsonb)', 'EXECUTE')
    or has_function_privilege('anon', 'public.reeditpro_read_exact_edit_brief_v1(text,jsonb)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.read_edit_reference_domain_aggregate_v1(text,jsonb)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.mutate_edit_reference_domain_command_v1(text,uuid,jsonb,text,text)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.read_edit_reference_domain_aggregate_v2(text,jsonb)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.read_edit_reference_domain_idempotency_v1(uuid,uuid,text,text,text)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.mutate_edit_reference_domain_command_v2(text,uuid,jsonb,text,text)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.mutate_edit_reference_long_form_domain_command_v1(text,uuid,jsonb,text,text)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.enqueue_edit_reference_long_form_study_v1(jsonb)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.authorize_edit_reference_study_chat_route_attempt_v1(jsonb)', 'EXECUTE') then
    raise exception 'SCHEMA_RPC_ROLE_BOUNDARY_TOO_BROAD';
  end if;

  if not has_function_privilege('authenticated', 'public.read_exact_edit_apply_authority_v1(text,text,jsonb)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.apply_exact_edit_preferences_and_reference_v1(text,jsonb)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.mutate_edit_reference_application_lifecycle_v3(text,jsonb)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.read_exact_edit_reference_application_state_v2(text,text,jsonb)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.assert_preference_application_plan_current_v1(text,jsonb,uuid,text,text,uuid,text)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.reserve_edit_reference_study_chat_run_v1(jsonb)', 'EXECUTE')
    or not has_function_privilege('service_role', 'public.read_edit_reference_domain_aggregate_v1(text,jsonb)', 'EXECUTE')
    or not has_function_privilege('service_role', 'public.mutate_edit_reference_domain_command_v1(text,uuid,jsonb,text,text)', 'EXECUTE')
    or not has_function_privilege('service_role', 'public.read_edit_reference_domain_aggregate_v2(text,jsonb)', 'EXECUTE')
    or not has_function_privilege('service_role', 'public.read_edit_reference_domain_idempotency_v1(uuid,uuid,text,text,text)', 'EXECUTE')
    or not has_function_privilege('service_role', 'public.mutate_edit_reference_domain_command_v2(text,uuid,jsonb,text,text)', 'EXECUTE')
    or not has_function_privilege('service_role', 'public.mutate_edit_reference_long_form_domain_command_v1(text,uuid,jsonb,text,text)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.reeditpro_register_pre_plan_source_v1(text,jsonb)', 'EXECUTE')
    or has_function_privilege('service_role', 'public.reeditpro_register_pre_plan_source_v1(text,jsonb)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.reeditpro_register_target_pre_plan_source_v1(text,jsonb)', 'EXECUTE')
    or has_function_privilege('service_role', 'public.reeditpro_register_target_pre_plan_source_v1(text,jsonb)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.reeditpro_save_exact_edit_brief_v1(text,jsonb)', 'EXECUTE')
    or has_function_privilege('service_role', 'public.reeditpro_save_exact_edit_brief_v1(text,jsonb)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.reeditpro_read_exact_edit_brief_v1(text,jsonb)', 'EXECUTE')
    or has_function_privilege('service_role', 'public.reeditpro_read_exact_edit_brief_v1(text,jsonb)', 'EXECUTE')
    or not has_function_privilege('service_role', 'public.enqueue_edit_reference_long_form_study_v1(jsonb)', 'EXECUTE')
    or not has_function_privilege('service_role', 'public.authorize_edit_reference_study_chat_route_attempt_v1(jsonb)', 'EXECUTE') then
    raise exception 'SCHEMA_REQUIRED_RPC_GRANT_MISSING';
  end if;

  if exists (
    select 1
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.prosecdef
      and (
        procedure.proname like '%edit_reference%'
        or procedure.proname like '%exact_edit%'
        or procedure.proname like '%pre_plan%'
      )
      and not exists (
        select 1 from unnest(coalesce(procedure.proconfig, '{}'::text[])) setting
        where setting like 'search_path=%'
      )
  ) then
    raise exception 'SCHEMA_SECURITY_DEFINER_WITHOUT_FIXED_SEARCH_PATH';
  end if;
end;
$$;

\echo 'PASS 004_schema_security_invariants'
