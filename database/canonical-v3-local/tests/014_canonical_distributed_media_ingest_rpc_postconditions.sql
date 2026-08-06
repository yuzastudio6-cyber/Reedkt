\set ON_ERROR_STOP on
\echo 'canonical-v3-local: durable distributed media-ingest RPC postconditions'

do $$
declare
  table_names text[] := array[
    'canonical_media_ingest_source_authorities',
    'canonical_media_ingest_jobs',
    'canonical_media_ingest_attempts',
    'canonical_media_ingest_idempotency_receipts',
    'canonical_media_ingest_audit_events'
  ];
  rpc_signatures text[] := array[
    'public.reeditpro_register_media_ingest_source_v1(text,jsonb)',
    'public.reeditpro_enqueue_media_ingest_v1(text,jsonb)',
    'public.reeditpro_claim_and_start_media_ingest_v1(text,jsonb)',
    'public.reeditpro_record_media_ingest_progress_v1(text,jsonb)',
    'public.reeditpro_reconcile_media_ingest_completion_v1(text,jsonb)',
    'public.reeditpro_reconcile_media_ingest_failure_v1(text,jsonb)',
    'public.reeditpro_request_media_ingest_cancellation_v1(text,jsonb)',
    'public.reeditpro_finalize_expired_media_ingest_attempt_v1(text,jsonb)'
  ];
  helper_signatures text[] := array[
    'public.reeditpro_media_ingest_idempotency_key_hash(text)',
    'public.reeditpro_media_ingest_request_hash(text,jsonb)',
    'public.reeditpro_media_ingest_identifier(text,jsonb)',
    'public.reeditpro_media_ingest_empty_audit_hash()',
    'public.reeditpro_media_ingest_boundaries()',
    'public.reeditpro_media_ingest_assert_local_internal_authority(jsonb)',
    'public.reeditpro_media_ingest_require_request(text,jsonb)',
    'public.reeditpro_media_ingest_create_terminal(jsonb,jsonb,text,text,text,text,jsonb,text,text)',
    'public.reeditpro_media_ingest_mutate(text,jsonb)',
    'public.reeditpro_media_ingest_finalize_timeout(jsonb)'
  ];
  table_name text;
  signature text;
  operation_count integer;
  race_job_id text;
  unsafe_text text;
begin
  foreach table_name in array table_names loop
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
      raise exception 'MEDIA_INGEST_TABLE_RLS_NOT_FORCED_%', table_name;
    end if;
    if has_table_privilege('anon', 'public.' || table_name, 'SELECT,INSERT,UPDATE,DELETE')
      or has_table_privilege('authenticated', 'public.' || table_name, 'SELECT,INSERT,UPDATE,DELETE')
      or has_table_privilege('service_role', 'public.' || table_name, 'SELECT,INSERT,UPDATE,DELETE') then
      raise exception 'MEDIA_INGEST_DIRECT_TABLE_GRANT_PRESENT_%', table_name;
    end if;
  end loop;
  foreach signature in array rpc_signatures loop
    if has_function_privilege('anon', signature, 'EXECUTE')
      or has_function_privilege('service_role', signature, 'EXECUTE')
      or not has_function_privilege('authenticated', signature, 'EXECUTE') then
      raise exception 'MEDIA_INGEST_RPC_ROLE_BOUNDARY_INVALID_%', signature;
    end if;
  end loop;
  foreach signature in array helper_signatures loop
    if has_function_privilege('anon', signature, 'EXECUTE')
      or has_function_privilege('authenticated', signature, 'EXECUTE')
      or has_function_privilege('service_role', signature, 'EXECUTE') then
      raise exception 'MEDIA_INGEST_HELPER_EXPOSED_%', signature;
    end if;
  end loop;

  if (select count(*) from public.canonical_media_ingest_source_authorities) < 5
    or exists (
      select 1 from public.canonical_media_ingest_source_authorities
      where seed_json#>>'{identity,authorityClass}' <> 'pre_plan_technical_media_ingest'
        or seed_json#>>'{identity,storageMode}' <> 'gcs'
        or seed_json#>>'{policy,rateCardVersion}' <> 'rp-ratecard-01-mock-safe'
    ) then
    raise exception 'MEDIA_INGEST_IMMUTABLE_SOURCE_REGISTRATION_MISSING';
  end if;
  select source_authority.job_id into race_job_id
  from public.canonical_media_ingest_source_authorities source_authority
  where source_authority.upload_intent_id = 'upload_local_media_terminal_race';
  if race_job_id is null then
    raise exception 'MEDIA_INGEST_POSTGRES_TERMINAL_RACE_SOURCE_MISSING';
  end if;
  if (select count(*) from public.canonical_media_ingest_attempts
      where job_id = race_job_id) <> 1
    or (select count(*) from public.canonical_media_ingest_attempts
      where job_id = race_job_id and state in ('running', 'cancellation_requested')) <> 0
    or (select count(*) from public.canonical_media_ingest_attempts
      where job_id = race_job_id and state in ('completed', 'failed', 'timed_out')) <> 1
    or (select count(*) from public.canonical_media_ingest_idempotency_receipts
      where job_id = race_job_id and operation = 'claim_and_start') <> 1
    or (select count(*) from public.canonical_media_ingest_idempotency_receipts
      where job_id = race_job_id
        and operation in ('reconcile_completion', 'reconcile_failure')) <> 1
    or (select count(*) from public.canonical_media_ingest_audit_events
      where job_id = race_job_id and operation = 'claim_and_start') <> 1
    or (select count(*) from public.canonical_media_ingest_audit_events
      where job_id = race_job_id
        and operation in ('reconcile_completion', 'reconcile_failure')) <> 1
    or not exists (
      select 1
      from public.canonical_media_ingest_attempts attempt
      where attempt.job_id = race_job_id
        and (attempt.attempt_json#>>'{terminal,terminalCost,actualInternalCostMicros}')::bigint > 0
        and attempt.attempt_json#>>'{terminal,terminalCost,customerPriceCreditsServiceFeeWalletOrBillingIncluded}' = 'false'
        and (
          (
            attempt.attempt_json#>>'{terminal,terminalKind}' = 'completion'
            and jsonb_typeof(attempt.attempt_json#>'{terminal,completionResult}') = 'object'
            and attempt.attempt_json#>'{terminal,failureCategory}' = 'null'::jsonb
          ) or (
            attempt.attempt_json#>>'{terminal,terminalKind}' = 'failure'
            and attempt.attempt_json#>'{terminal,completionResult}' = 'null'::jsonb
            and jsonb_typeof(attempt.attempt_json#>'{terminal,failureCategory}') = 'string'
          )
        )
    ) then
    raise exception 'MEDIA_INGEST_POSTGRES_TERMINAL_OR_CLAIM_RACE_NOT_EXCLUSIVE';
  end if;
  select count(distinct operation) into operation_count
  from public.canonical_media_ingest_idempotency_receipts;
  if operation_count <> 7 then
    raise exception 'MEDIA_INGEST_FIXED_SEVEN_OPERATION_RECEIPTS_MISSING_%', operation_count;
  end if;
  if not exists (
    select 1
    from public.canonical_media_ingest_attempts attempt
    where attempt.state = 'completed'
      and attempt.attempt_json->'terminal'->>'terminalKind' = 'completion'
      and (attempt.attempt_json->'terminal'->'terminalCost'->>'actualInternalCostMicros')::bigint > 0
      and attempt.attempt_json->'terminal'->'terminalCost'->>'customerPriceCreditsServiceFeeWalletOrBillingIncluded' = 'false'
      and attempt.attempt_json->'terminal'->'terminalCost'->>'invoiceReconciled' = 'false'
  ) then
    raise exception 'MEDIA_INGEST_COMPLETION_INTERNAL_COST_NOT_RETAINED';
  end if;
  if not exists (
    select 1 from public.canonical_media_ingest_attempts
    where state = 'timed_out'
      and attempt_json->'terminal'->>'terminalKind' = 'timeout'
  ) or not exists (
    select 1 from public.canonical_media_ingest_attempts
    where attempt_number = 2
      and state = 'running'
      and attempt_json#>>'{attemptStart,resumeCheckpointHash}' is not null
      and (attempt_json#>>'{attemptStart,resumeOffsetBytes}')::bigint > 0
  ) then
    raise exception 'MEDIA_INGEST_TIMEOUT_OR_CHECKPOINT_RESUME_NOT_PERSISTED';
  end if;
  if exists (
    select 1 from public.canonical_media_ingest_attempts
    where state in ('running', 'cancellation_requested')
    group by job_id having count(*) > 1
  ) then
    raise exception 'MEDIA_INGEST_MULTIPLE_ACTIVE_ATTEMPTS_PRESENT';
  end if;
  if exists (
    select 1
    from public.canonical_media_ingest_audit_events audit
    join public.canonical_media_ingest_jobs job using (job_id)
    where audit.revision > job.revision
  ) or exists (
    select 1
    from public.canonical_media_ingest_jobs job
    where job.audit_chain_head_sha256 <>
      coalesce((
        select audit.event_sha256
        from public.canonical_media_ingest_audit_events audit
        where audit.job_id = job.job_id
        order by audit.revision desc limit 1
      ), public.reeditpro_media_ingest_empty_audit_hash())
  ) then
    raise exception 'MEDIA_INGEST_AUDIT_CHAIN_HEAD_INVALID';
  end if;
  select concat_ws(E'\n',
    coalesce((select string_agg(seed_json::text, E'\n')
      from public.canonical_media_ingest_source_authorities), ''),
    coalesce((select string_agg(job_json::text, E'\n')
      from public.canonical_media_ingest_jobs), ''),
    coalesce((select string_agg(attempt_json::text, E'\n')
      from public.canonical_media_ingest_attempts), ''),
    coalesce((select string_agg(result_json::text, E'\n')
      from public.canonical_media_ingest_idempotency_receipts), '')
  ) into unsafe_text;
  if unsafe_text ~* '"(signedUrl|bearerToken|authorization|credential|leaseCredential|localPath|providerUrl)"[[:space:]]*:' then
    raise exception 'MEDIA_INGEST_PERSISTED_SECRET_OR_COMMERCIAL_AUTHORITY';
  end if;
end;
$$;
