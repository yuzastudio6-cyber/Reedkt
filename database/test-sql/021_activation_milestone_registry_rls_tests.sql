-- Local SQL assertions for activation milestone registry schema/RLS.
-- These are intended for local validation only and must not run production SQL.

select 'activation milestone registry has required tables' as assertion
where exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'activation_milestones')
  and exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'activation_phase_runs')
  and exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'activation_tool_readiness')
  and exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'activation_pr_evidence')
  and exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'activation_artifact_manifests')
  and exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'activation_blockers')
  and exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'activation_allowed_scopes')
  and exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'activation_blocked_scopes')
  and exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'activation_next_phases')
  and exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'activation_human_approvals')
  and exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'activation_sync_audit_log');

select 'activation registry RLS is enabled on every table' as assertion
where not exists (
  select 1
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in (
      'activation_milestones',
      'activation_phase_runs',
      'activation_tool_readiness',
      'activation_pr_evidence',
      'activation_artifact_manifests',
      'activation_blockers',
      'activation_allowed_scopes',
      'activation_blocked_scopes',
      'activation_next_phases',
      'activation_human_approvals',
      'activation_sync_audit_log'
    )
    and c.relrowsecurity = false
);

select 'activation registry has no anon/authenticated table privileges' as assertion
where not exists (
  select 1
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in (
      'activation_milestones',
      'activation_phase_runs',
      'activation_tool_readiness',
      'activation_pr_evidence',
      'activation_artifact_manifests',
      'activation_blockers',
      'activation_allowed_scopes',
      'activation_blocked_scopes',
      'activation_next_phases',
      'activation_human_approvals',
      'activation_sync_audit_log'
    )
    and grantee in ('anon', 'authenticated', 'public')
);

select 'activation registry has no unsafe payload columns' as assertion
where not exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name like 'activation_%'
    and column_name in (
      'secret_value',
      'service_role_key',
      'provider_key',
      'signed_url',
      'raw_prompt',
      'raw_payload',
      'private_artifact_contents',
      'user_pii'
    )
);

select 'activation registry hard safety flags default false' as assertion
where exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'activation_milestones'
    and column_name = 'production_allowed'
    and column_default ilike '%false%'
)
and exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'activation_milestones'
    and column_name = 'public_output_allowed'
    and column_default ilike '%false%'
)
and exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'activation_milestones'
    and column_name = 'provider_calls_allowed'
    and column_default ilike '%false%'
);
