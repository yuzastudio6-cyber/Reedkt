\set ON_ERROR_STOP on
\echo 'canonical-v3-local: distributed pre-plan study RPC persistence and security postconditions'

do $$
declare
  support_tables text[] := array[
    'preference_long_form_study_audit_events',
    'preference_long_form_study_idempotency_receipts',
    'preference_long_form_study_lease_escrow'
  ];
  rpc_signatures text[] := array[
    'public.reeditpro_claim_and_start_pre_plan_study_v1(text,jsonb)',
    'public.reeditpro_complete_pre_plan_study_v1(text,jsonb)',
    'public.reeditpro_control_pre_plan_study_v1(text,jsonb)',
    'public.reeditpro_enqueue_pre_plan_study_v1(text,jsonb)',
    'public.reeditpro_fail_pre_plan_study_v1(text,jsonb)',
    'public.reeditpro_heartbeat_pre_plan_study_v1(text,jsonb)',
    'public.reeditpro_recover_expired_pre_plan_study_lease_v1(text,jsonb)'
  ];
  helper_signatures text[] := array[
    'public.reeditpro_constant_time_hex_equal(text,text)',
    'public.reeditpro_pre_plan_assert_local_internal_authority(jsonb)',
    'public.reeditpro_pre_plan_commit_mutation(uuid,text,jsonb,uuid,uuid,timestamp with time zone,bigint,text,timestamp with time zone)',
    'public.reeditpro_pre_plan_escrow_secret()',
    'public.reeditpro_pre_plan_replay(uuid,text,text,text,boolean)'
  ];
  table_name text;
  signature text;
  operation_count integer;
  unsafe_text text;
begin
  foreach table_name in array support_tables loop
    if not exists (
      select 1
      from pg_catalog.pg_class relation
      join pg_catalog.pg_namespace namespace on namespace.oid = relation.relnamespace
      where namespace.nspname = 'public'
        and relation.relname = table_name
        and relation.relkind = 'r'
        and relation.relrowsecurity
        and relation.relforcerowsecurity
    ) then
      raise exception 'PRE_PLAN_SUPPORT_TABLE_RLS_NOT_FORCED_%', table_name;
    end if;
    if has_table_privilege('anon', 'public.' || table_name, 'SELECT,INSERT,UPDATE,DELETE')
      or has_table_privilege(
        'authenticated', 'public.' || table_name, 'SELECT,INSERT,UPDATE,DELETE'
      )
      or has_table_privilege(
        'service_role', 'public.' || table_name, 'SELECT,INSERT,UPDATE,DELETE'
      ) then
      raise exception 'PRE_PLAN_SUPPORT_TABLE_DIRECT_GRANT_PRESENT_%', table_name;
    end if;
  end loop;

  foreach signature in array rpc_signatures loop
    if has_function_privilege('anon', signature, 'EXECUTE')
      or has_function_privilege('service_role', signature, 'EXECUTE')
      or not has_function_privilege('authenticated', signature, 'EXECUTE') then
      raise exception 'PRE_PLAN_RPC_ROLE_BOUNDARY_INVALID_%', signature;
    end if;
  end loop;
  foreach signature in array helper_signatures loop
    if has_function_privilege('anon', signature, 'EXECUTE')
      or has_function_privilege('authenticated', signature, 'EXECUTE')
      or has_function_privilege('service_role', signature, 'EXECUTE') then
      raise exception 'PRE_PLAN_HELPER_RPC_EXPOSED_%', signature;
    end if;
  end loop;
  if (
    select procedure.provolatile
    from pg_catalog.pg_proc procedure
    join pg_catalog.pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname = 'reeditpro_pre_plan_assert_request'
  ) <> 'v' then
    raise exception 'PRE_PLAN_REQUEST_AUTHORITY_FUNCTION_NOT_VOLATILE';
  end if;

  select count(distinct operation) into operation_count
  from public.preference_long_form_study_idempotency_receipts;
  if operation_count <> 7
    or not exists (
      select 1 from public.preference_long_form_study_idempotency_receipts
      where operation = 'enqueue'
    )
    or not exists (
      select 1 from public.preference_long_form_study_idempotency_receipts
      where operation = 'claim_and_start' and lease_escrow_id is not null
    )
    or not exists (
      select 1 from public.preference_long_form_study_idempotency_receipts
      where operation = 'heartbeat_and_checkpoint'
    )
    or not exists (
      select 1 from public.preference_long_form_study_idempotency_receipts
      where operation = 'complete'
    )
    or not exists (
      select 1 from public.preference_long_form_study_idempotency_receipts
      where operation = 'fail'
    )
    or not exists (
      select 1 from public.preference_long_form_study_idempotency_receipts
      where operation = 'control'
    )
    or not exists (
      select 1 from public.preference_long_form_study_idempotency_receipts
      where operation = 'recover_expired_lease'
    ) then
    raise exception 'PRE_PLAN_FIXED_SEVEN_OPERATION_RECEIPTS_MISSING_%', operation_count;
  end if;

  if exists (
    select 1
    from public.preference_long_form_study_work_items work
    join public.preference_long_form_study_attempts attempt
      on attempt.study_work_item_id = work.id
    where attempt.status = 'running'
    group by work.id
    having count(*) > 1
  ) then
    raise exception 'PRE_PLAN_MULTIPLE_ACTIVE_ATTEMPTS_PRESENT';
  end if;
  if not exists (
    select 1
    from public.preference_long_form_study_attempts attempt
    join public.preference_long_form_study_work_items work
      on work.id = attempt.study_work_item_id
    join public.preference_long_form_study_work_outputs output
      on output.study_attempt_id = attempt.id
    where attempt.status = 'completed'
      and work.status = 'completed'
      and attempt.internal_cost_micros = 800
      and work.cumulative_internal_cost_micros = 800
      and attempt.terminal_json->>'terminalKind' = 'completion'
      and output.storage_object_id like 'private/evidence/%'
      and output.storage_generation is null
      and output.storage_etag is null
  ) then
    raise exception 'PRE_PLAN_TERMINAL_OUTPUT_COST_TRANSACTION_MISSING';
  end if;
  if exists (
    select 1
    from public.preference_long_form_study_plans plan
    join public.preference_assets asset on asset.id = plan.source_asset_id
    where plan.external_plan_id is not null
      and plan.source_storage_object_identity_hash <>
        public.reeditpro_pre_plan_hash(
          'canonical_v3_local_preference_asset_storage_identity_v1',
          jsonb_build_object(
            'workspaceId', asset.workspace_id::text,
            'assetId', asset.id::text,
            'storageObjectId', asset.storage_object_id,
            'storageGeneration', asset.storage_generation,
            'storageEtag', asset.storage_etag,
            'checksumSha256', asset.checksum_sha256
          )
        )
  ) then
    raise exception 'PRE_PLAN_SOURCE_STORAGE_IDENTITY_NOT_CANONICAL';
  end if;
  if not exists (
    select 1
    from public.preference_long_form_study_attempts attempt
    join public.preference_long_form_study_work_items work
      on work.id = attempt.study_work_item_id
    where attempt.failure_class = 'provider_unknown_outcome'
      and attempt.status = 'failed'
      and work.status = 'blocked'
      and attempt.terminal_json->'costEvidence'->>'evidenceStatus'
        = 'provisional_provider_reconciliation_required'
      and attempt.terminal_json->>'unknownOutcomeReconciliationRequired' = 'true'
  ) then
    raise exception 'PRE_PLAN_PROVIDER_UNKNOWN_OUTCOME_NOT_BLOCKED';
  end if;
  if not exists (
    select 1 from public.preference_long_form_study_attempts
    where status = 'timed_out'
      and terminal_json->>'terminalKind' = 'timeout'
  ) or not exists (
    select 1 from public.preference_long_form_study_attempts
    where attempt_number = 2
      and status = 'running'
      and attempt_start_json->>'resumeCheckpointHash' is not null
  ) then
    raise exception 'PRE_PLAN_EXPIRED_LEASE_RECOVERY_LINEAGE_MISSING';
  end if;

  select concat_ws(
    E'\n',
    coalesce((select string_agg(seed_json::text, E'\n')
      from public.preference_long_form_study_work_items), ''),
    coalesce((select string_agg(response_json::text, E'\n')
      from public.preference_long_form_study_idempotency_receipts), ''),
    coalesce((select string_agg(attempt_start_json::text, E'\n')
      from public.preference_long_form_study_attempts), ''),
    coalesce((select string_agg(terminal_json::text, E'\n')
      from public.preference_long_form_study_attempts), ''),
    coalesce((select string_agg(latest_checkpoint_json::text, E'\n')
      from public.preference_long_form_study_work_items), ''),
    coalesce((select string_agg(storage_object_id, E'\n')
      from public.preference_long_form_study_work_outputs), '')
  ) into unsafe_text;
  if unsafe_text ~* '(rppsl_v1_|bearer[[:space:]]|https?://|postgres(ql)?://|/volumes/|/users/|eyj[a-za-z0-9_-]+\.[a-za-z0-9_-]+\.[a-za-z0-9_-]+)' then
    raise exception 'PRE_PLAN_FORBIDDEN_PERSISTED_AUTHORITY_MATERIAL_PRESENT';
  end if;
  if exists (
    select 1 from public.preference_long_form_study_idempotency_receipts
    where response_json ? 'transientLeaseCredential'
      or response_json::text ~ 'rppsl_v1_'
  ) then
    raise exception 'PRE_PLAN_TRANSIENT_LEASE_PERSISTED_IN_REPLAY_RESPONSE';
  end if;
  if exists (
    select 1
    from public.preference_long_form_study_lease_escrow escrow
    join public.preference_long_form_study_attempts attempt
      on attempt.id = escrow.study_attempt_id
    where length(escrow.encrypted_credential) = 0
      or escrow.lease_credential_hash_sha256 !~ '^[a-f0-9]{64}$'
      or escrow.expires_at <>
        (attempt.attempt_start_json->>'attemptDeadlineAt')::timestamptz
      or escrow.expires_at <= attempt.started_at
  ) then
    raise exception 'PRE_PLAN_ENCRYPTED_LEASE_ESCROW_INVALID';
  end if;
end;
$$;

begin;
set local app.settings.jwt_secret = '';
select set_config(
  'request.headers',
  '{"x-forwarded-host":"127.0.0.1","x-forwarded-port":"57431","x-reeditpro-local-pre-plan-authority":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}',
  true
);
do $$
begin
  begin
    perform public.reeditpro_pre_plan_assert_local_internal_authority(
      jsonb_build_object(
        'requestHash', repeat('b', 64),
        'idempotencyKey', 'missing-secret-denial-0001'
      )
    );
    raise exception 'PRE_PLAN_MISSING_LOCAL_INTERNAL_SECRET_ALLOWED';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;

create temporary table browser_unsigned_pre_plan_request (
  payload jsonb not null
) on commit preserve rows;
grant select on browser_unsigned_pre_plan_request to authenticated;

with request_without_hash as (
  select jsonb_build_object(
    'runId', plan.plan_json->>'runId',
    'studyIdentityHash', plan.study_identity_hash,
    'idempotencyKey', 'browser-unsigned-enqueue-0001',
    'seed', plan.plan_json,
    'controllerIdentityEvidenceHash', plan.controller_identity_evidence_hash,
    'requestedAt', '2026-07-21T18:02:00.000Z'
  ) as value
  from public.preference_long_form_study_plans plan
  where plan.external_plan_id = 'local-plan-local-complete'
)
insert into browser_unsigned_pre_plan_request (payload)
select value || jsonb_build_object(
  'requestHash', public.reeditpro_pre_plan_request_hash('enqueue', value)
)
from request_without_hash;

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
begin
  begin
    perform count(*) from public.preference_long_form_study_lease_escrow;
    raise exception 'PRE_PLAN_AUTHENTICATED_DIRECT_ESCROW_READ_ALLOWED';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.reeditpro_enqueue_pre_plan_study_v1(
      'canonical-distributed-pre-plan-study-state-port-v1',
      (select payload from browser_unsigned_pre_plan_request)
    );
    raise exception 'PRE_PLAN_BROWSER_TOKEN_WITHOUT_INTERNAL_SIGNATURE_ALLOWED';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;

\echo 'PASS 013_canonical_distributed_pre_plan_study_rpc_postconditions'
