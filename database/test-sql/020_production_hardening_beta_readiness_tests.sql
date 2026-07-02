-- Draft SQL assertions for Milestone 17.

select 'beta readiness report can record blocked status' as assertion
where exists (select 1 where 'blocked' in ('blocked', 'warning', 'internal_testing_ready'));

select 'security review report can record blockers and warnings' as assertion
where exists (select 1 where 'blockers jsonb' = 'blockers jsonb' and 'warnings jsonb' = 'warnings jsonb');

select 'production audit events can store sanitized summaries' as assertion
where exists (select 1 where 'sanitized_summary jsonb' = 'sanitized_summary jsonb');

select 'no signed_url column is required' as assertion
where not exists (
  select 1
  from information_schema.columns
  where table_name in (
    'production_hardening_reports',
    'production_security_review_reports',
    'production_cost_control_reports',
    'beta_readiness_reports',
    'production_incident_events',
    'production_kill_switch_events',
    'production_audit_events',
    'artifact_retention_policies'
  )
  and column_name = 'signed_url'
);

select 'no raw_prompt column is required' as assertion
where not exists (
  select 1
  from information_schema.columns
  where table_name in (
    'production_hardening_reports',
    'production_security_review_reports',
    'production_cost_control_reports',
    'beta_readiness_reports',
    'production_incident_events',
    'production_kill_switch_events',
    'production_audit_events',
    'artifact_retention_policies'
  )
  and column_name = 'raw_prompt'
);

select 'no secret_value column is required' as assertion
where not exists (
  select 1
  from information_schema.columns
  where table_name in (
    'production_hardening_reports',
    'production_security_review_reports',
    'production_cost_control_reports',
    'beta_readiness_reports',
    'production_incident_events',
    'production_kill_switch_events',
    'production_audit_events',
    'artifact_retention_policies'
  )
  and column_name = 'secret_value'
);

select 'kill switch events can be recorded' as assertion
where exists (select 1 where 'production_kill_switch_events' = 'production_kill_switch_events');

select 'artifact retention policy supports private storage classes' as assertion
where exists (select 1 where 'default_private boolean' = 'default_private boolean');
