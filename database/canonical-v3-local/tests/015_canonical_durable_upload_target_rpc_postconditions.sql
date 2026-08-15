\set ON_ERROR_STOP on
\echo 'canonical-v3-local: durable upload-target RPC postconditions'

do $$
declare
  table_names text[] := array[
    'canonical_upload_intents',
    'canonical_upload_target_idempotency_receipts',
    'canonical_upload_target_audit_events'
  ];
  rpc_signatures text[] := array[
    'public.reeditpro_resolve_upload_intent_v1(text,jsonb)',
    'public.reeditpro_claim_upload_target_v1(text,jsonb)',
    'public.reeditpro_commit_upload_target_v1(text,jsonb)',
    'public.reeditpro_mark_upload_target_unknown_v1(text,jsonb)',
    'public.reeditpro_read_upload_intent_v1(text,jsonb)'
  ];
  helper_signatures text[] := array[
    'public.reeditpro_upload_target_idempotency_key_hash(text)',
    'public.reeditpro_upload_target_with_hash(jsonb,text)',
    'public.reeditpro_upload_target_require_keys(jsonb,text[],text)',
    'public.reeditpro_upload_target_assert_local_internal_authority(text,jsonb)',
    'public.reeditpro_upload_target_assert_actor(uuid,uuid,uuid)',
    'public.reeditpro_upload_target_exact_replay(jsonb)',
    'public.reeditpro_upload_target_commit_result(text,jsonb,bigint,text,text,text)'
  ];
  table_name text;
  signature text;
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
      raise exception 'UPLOAD_TARGET_TABLE_RLS_NOT_FORCED_%', table_name;
    end if;
    if has_table_privilege('anon', 'public.' || table_name, 'SELECT,INSERT,UPDATE,DELETE')
      or has_table_privilege('authenticated', 'public.' || table_name, 'SELECT,INSERT,UPDATE,DELETE')
      or has_table_privilege('service_role', 'public.' || table_name, 'SELECT,INSERT,UPDATE,DELETE') then
      raise exception 'UPLOAD_TARGET_DIRECT_TABLE_GRANT_PRESENT_%', table_name;
    end if;
  end loop;
  foreach signature in array rpc_signatures loop
    if has_function_privilege('anon', signature, 'EXECUTE')
      or has_function_privilege('service_role', signature, 'EXECUTE')
      or not has_function_privilege('authenticated', signature, 'EXECUTE') then
      raise exception 'UPLOAD_TARGET_RPC_ROLE_BOUNDARY_INVALID_%', signature;
    end if;
  end loop;
  foreach signature in array helper_signatures loop
    if has_function_privilege('anon', signature, 'EXECUTE')
      or has_function_privilege('authenticated', signature, 'EXECUTE')
      or has_function_privilege('service_role', signature, 'EXECUTE') then
      raise exception 'UPLOAD_TARGET_HELPER_EXPOSED_%', signature;
    end if;
  end loop;

  if (select count(*) from public.canonical_upload_intents) <> 5
    or (select count(*) from public.canonical_upload_target_idempotency_receipts) <> 13
    or (select count(*) from public.canonical_upload_target_audit_events) <> 13 then
    raise exception 'UPLOAD_TARGET_EXPECTED_PERSISTED_LIFECYCLE_COUNTS_MISSING';
  end if;
  if not exists (
    select 1 from public.canonical_upload_intents
    where upload_intent_id = 'upload_local_target_concurrency'
      and revision = 1
      and state = 'ready_for_target'
  ) or not exists (
    select 1 from public.canonical_upload_intents
    where upload_intent_id = 'upload_local_target_success'
      and revision = 3
      and state = 'target_issued'
      and record_json#>>'{issuance,state}' = 'issued'
      and record_json#>>'{issuance,targetProtocol}' = 'resumable_content_range_v1'
  ) or not exists (
    select 1 from public.canonical_upload_intents
    where upload_intent_id = 'upload_local_target_unknown'
      and revision = 3
      and state = 'target_issue_unknown'
      and record_json#>>'{issuance,unknownReasonCode}' =
        'TARGET_CREATION_OUTCOME_UNKNOWN'
  ) then
    raise exception 'UPLOAD_TARGET_LIFECYCLE_STATE_NOT_DURABLE';
  end if;
  if (
    select count(distinct operation)
    from public.canonical_upload_target_idempotency_receipts
  ) <> 4 then
    raise exception 'UPLOAD_TARGET_FIXED_MUTATION_SET_NOT_EXERCISED';
  end if;
  if exists (
    select 1
    from public.canonical_upload_target_audit_events audit
    join public.canonical_upload_intents intent using (upload_intent_id)
    where audit.revision > intent.revision
  ) or exists (
    select 1
    from public.canonical_upload_target_idempotency_receipts receipt
    where receipt.result_json#>>'{transaction,auditEventHash}' not in (
      select event_sha256
      from public.canonical_upload_target_audit_events audit
      where audit.upload_intent_id = receipt.upload_intent_id
    )
  ) then
    raise exception 'UPLOAD_TARGET_AUDIT_OR_RECEIPT_LINEAGE_INVALID';
  end if;
  select concat_ws(E'\n',
    coalesce((select string_agg(record_json::text, E'\n')
      from public.canonical_upload_intents), ''),
    coalesce((select string_agg(result_json::text, E'\n')
      from public.canonical_upload_target_idempotency_receipts), '')
  ) into unsafe_text;
  if unsafe_text ~* '"(uploadUrl|uploadHeaders|sessionUri|bearerToken|authorization)"[[:space:]]*:'
    or unsafe_text like '%storage.invalid%' then
    raise exception 'UPLOAD_TARGET_RAW_CREDENTIAL_PERSISTED';
  end if;
  if exists (
    select 1 from public.canonical_upload_intents
    where record_sha256 <> public.reeditpro_sha256_json(record_json - 'recordHash')
      or record_json#>>'{issuance,issuanceHash}' <>
        public.reeditpro_sha256_json((record_json->'issuance') - 'issuanceHash')
  ) or exists (
    select 1 from public.canonical_upload_target_idempotency_receipts
    where result_sha256 <> public.reeditpro_sha256_json(result_json - 'resultHash')
      or result_json#>>'{transaction,transactionHash}' <>
        public.reeditpro_sha256_json((result_json->'transaction') - 'transactionHash')
  ) then
    raise exception 'UPLOAD_TARGET_CANONICAL_HASH_INVALID';
  end if;
end;
$$;
