\set ON_ERROR_STOP on
\echo 'canonical-v3-local: destructive reset and data restore assertions'

do $$
begin
  if not exists (
    select 1 from public.exact_edit_preference_states
    where workspace_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and project_id = 'aaaaaaaa-1000-4000-8000-000000000001'
      and edit_session_id = 'aaaaaaaa-2000-4000-8000-000000000001'
      and record_revision = 1
      and preference_revision = 0
      and planning_input_revision = 1
      and current_application_state = 'connected'
      and current_application_id = 'aaaaaaaa-7000-4000-8000-000000000001'
  ) then raise exception 'RECOVERY_EXACT_EDIT_STATE_MISSING'; end if;
  if not exists (
    select 1 from public.preference_applications
    where id = 'aaaaaaaa-7000-4000-8000-000000000001'
      and connection_state = 'connected'
      and status = 'prepared'
  ) then raise exception 'RECOVERY_CONNECTED_APPLICATION_MISSING'; end if;
  if (select status from public.edit_plan_versions
      where id = 'aaaaaaaa-9000-4000-8000-000000000001') <> 'stale'
    or (select status from public.edit_credit_estimates
      where id = 'aaaaaaaa-a000-4000-8000-000000000001') <> 'stale' then
    raise exception 'RECOVERY_STALE_PLAN_ESTIMATE_MISSING';
  end if;
  if (select count(*) from public.exact_edit_preference_apply_events) <> 1
    or (select count(*) from public.preference_application_lifecycle_events) <> 1
    or (select count(*) from public.preference_application_plan_invalidations) <> 1
    or (select count(*) from public.preference_usage_events) <> 1
    or (select count(*) from public.preference_audit_segments) <> 1
    or (select count(*) from public.edit_reference_idempotency_receipts) <> 2 then
    raise exception 'RECOVERY_AUDIT_OR_IDEMPOTENCY_HISTORY_MISSING';
  end if;
  if not exists (
    select 1 from public.approved_plan_snapshots
    where id = 'aaaaaaaa-b000-4000-8000-000000000001'
      and preference_application_id = 'aaaaaaaa-7000-4000-8000-000000000001'
      and snapshot_json->>'recoveryProof' = 'true'
  ) or not exists (
    select 1 from public.edit_execution_authorizations
    where id = 'aaaaaaaa-c000-4000-8000-000000000001'
      and status = 'active'
  ) then raise exception 'RECOVERY_APPROVED_SNAPSHOT_LINEAGE_MISSING'; end if;

  begin
    update public.approved_plan_snapshots
      set snapshot_json = '{"tampered":true}'::jsonb
      where id = 'aaaaaaaa-b000-4000-8000-000000000001';
    raise exception 'RECOVERY_APPROVED_SNAPSHOT_MUTATION_ALLOWED';
  exception when sqlstate '55000' then null;
  end;
  begin
    delete from public.preference_application_lifecycle_events;
    raise exception 'RECOVERY_LIFECYCLE_HISTORY_DELETE_ALLOWED';
  exception when sqlstate '55000' then null;
  end;
  begin
    update public.preference_audit_segments
      set content_digest = repeat('f', 64);
    raise exception 'RECOVERY_AUDIT_MUTATION_ALLOWED';
  exception when sqlstate '55000' then null;
  end;
end;
$$;

create temporary table recovery_changed_exact_apply_request (
  payload jsonb not null
) on commit preserve rows;
grant select on recovery_changed_exact_apply_request to authenticated;

with changed as (
  select (request_json - 'requestDigestSha256') || jsonb_build_object(
    'requestedAt', '2026-07-21T16:00:01.000Z'
  ) as value
  from public.exact_edit_preference_apply_events
  limit 1
)
insert into recovery_changed_exact_apply_request (payload)
select value || jsonb_build_object(
  'requestDigestSha256', public.reeditpro_sha256_json(value)
) from changed;

begin;
set local role authenticated;
\o /dev/null
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
\o

do $$
declare
  replayed jsonb;
  state_read jsonb;
begin
  if (select count(*) from public.workspaces) <> 1
    or (select count(*) from public.edit_references) <> 1
    or exists (
      select 1 from public.edit_references
      where workspace_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    ) then raise exception 'RECOVERY_TENANT_A_RLS_INVALID'; end if;

  select * into state_read
  from public.read_exact_edit_reference_application_state_v2(
    'edit-reference-production-persistence-contract-v6',
    'edit-reference-production-planning-authority-read-v2',
    jsonb_build_object(
      'actorUserId', '11111111-1111-4111-8111-111111111111',
      'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
      'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001'
    )
  );
  if state_read->>'currentState' <> 'connected'
    or state_read->'application'->>'id'
      <> 'aaaaaaaa-7000-4000-8000-000000000001'
    or state_read->'lifecycleReceipt'->>'mutation' <> 'apply' then
    raise exception 'RECOVERY_CONNECTED_AUTHORITY_READ_INVALID_%', state_read;
  end if;

  select * into replayed
  from public.apply_exact_edit_preferences_and_reference_v1(
    'edit-reference-production-persistence-contract-v6',
    (select request_json from public.exact_edit_preference_apply_events limit 1)
  );
  if replayed->>'transactionId' <> (
      select transaction_id::text from public.exact_edit_preference_apply_events limit 1
    ) or replayed->>'transactionReceiptDigestSha256' <> (
      select receipt_digest_sha256 from public.exact_edit_preference_apply_events limit 1
    ) then raise exception 'RECOVERY_EXACT_IDEMPOTENT_REPLAY_CHANGED_%', replayed; end if;

  begin
    perform * from public.apply_exact_edit_preferences_and_reference_v1(
      'edit-reference-production-persistence-contract-v6',
      (select payload from recovery_changed_exact_apply_request)
    );
    raise exception 'RECOVERY_IDEMPOTENCY_CONFLICT_NOT_PRESERVED';
  exception when unique_violation then null;
  end;
end;
$$;

reset role;
set local role authenticated;
\o /dev/null
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
\o

do $$
begin
  if (select count(*) from public.workspaces) <> 1
    or (select count(*) from public.edit_references) <> 1
    or exists (
      select 1 from public.edit_references
      where workspace_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    ) then raise exception 'RECOVERY_TENANT_B_RLS_INVALID'; end if;
  begin
    perform * from public.read_exact_edit_reference_application_state_v2(
      'edit-reference-production-persistence-contract-v6',
      'edit-reference-production-planning-authority-read-v2',
      jsonb_build_object(
        'actorUserId', '22222222-2222-4222-8222-222222222222',
        'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
        'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001'
      )
    );
    raise exception 'RECOVERY_CROSS_TENANT_AUTHORITY_READ_ALLOWED';
  exception when insufficient_privilege then null;
  end;
end;
$$;

rollback;

\echo 'PASS 009_recovery_restore_assertions'
