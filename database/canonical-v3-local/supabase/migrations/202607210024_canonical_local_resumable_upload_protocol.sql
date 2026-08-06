-- Forward-only local canonical proof. Historical migration 021 remains
-- immutable. This widens only the durable upload-target protocol enum so a
-- large authenticated local source can use bounded Content-Range chunks while
-- preserving the same intent-first, one-target issuance transaction.

create or replace function public.reeditpro_claim_upload_target_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  current_intent public.canonical_upload_intents%rowtype;
  key_hash text;
  existing_receipt record;
  issuance_body jsonb;
  issuance_value jsonb;
  record_body jsonb;
  record_value jsonb;
begin
  if p_contract_version <> 'canonical-durable-upload-target-authority-port-v1' then
    raise exception using errcode = '22023', message = 'UPLOAD_TARGET_CONTRACT_VERSION_INVALID';
  end if;
  perform public.reeditpro_upload_target_require_keys(
    p_request,
    array[
      'idempotencyKey','requestHash','requestedAt','uploadIntentId','expectedRevision',
      'attemptId','leaseHash','claimLeaseExpiresAt','targetProtocol','expiresAt'
    ],
    'UPLOAD_TARGET_CLAIM_REQUEST'
  );
  perform public.reeditpro_upload_target_assert_local_internal_authority(
    'reeditpro_claim_upload_target_v1', p_request
  );
  select * into current_intent from public.canonical_upload_intents
  where upload_intent_id = p_request->>'uploadIntentId';
  if not found then
    raise exception using errcode = 'P0002', message = 'UPLOAD_TARGET_INTENT_NOT_FOUND';
  end if;
  perform public.reeditpro_upload_target_assert_actor(
    current_intent.owner_user_id, current_intent.workspace_id, current_intent.project_id
  );
  key_hash := public.reeditpro_upload_target_idempotency_key_hash(
    p_request->>'idempotencyKey'
  );
  perform pg_advisory_xact_lock(hashtextextended(
    current_intent.owner_user_id::text || ':' || current_intent.workspace_id::text
      || ':claim_target:' || key_hash,
    0
  ));
  select receipt.request_sha256, receipt.result_json into existing_receipt
  from public.canonical_upload_target_idempotency_receipts receipt
  where receipt.owner_user_id = current_intent.owner_user_id
    and receipt.workspace_id = current_intent.workspace_id
    and receipt.operation = 'claim_target'
    and receipt.idempotency_key_sha256 = key_hash;
  if found then
    if existing_receipt.request_sha256 <> p_request->>'requestHash' then
      raise exception using errcode = '23505', message = 'UPLOAD_TARGET_IDEMPOTENCY_CONFLICT';
    end if;
    return public.reeditpro_upload_target_exact_replay(existing_receipt.result_json);
  end if;
  select * into current_intent from public.canonical_upload_intents
  where upload_intent_id = p_request->>'uploadIntentId' for update;
  if current_intent.revision <> (p_request->>'expectedRevision')::bigint
    or current_intent.state <> 'ready_for_target'
    or p_request->>'targetProtocol' not in (
      'single_put',
      'gcs_resumable',
      'resumable_content_range_v1'
    )
    or coalesce(p_request->>'leaseHash', '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'requestHash', '') !~ '^[a-f0-9]{64}$'
    or (p_request->>'claimLeaseExpiresAt')::timestamptz
      <= (p_request->>'requestedAt')::timestamptz
    or (p_request->>'expiresAt')::timestamptz <> current_intent.expires_at then
    raise exception using errcode = '40001', message = 'UPLOAD_TARGET_CLAIM_STATE_INVALID';
  end if;
  issuance_body := jsonb_build_object(
    'schemaVersion', 'canonical-durable-upload-target-issuance-v1',
    'state', 'issuing',
    'attemptId', p_request->>'attemptId',
    'leaseHash', p_request->>'leaseHash',
    'claimLeaseExpiresAt', p_request->>'claimLeaseExpiresAt',
    'targetProtocol', p_request->>'targetProtocol',
    'uploadMethod', null,
    'supportsResume', null,
    'recommendedChunkSizeBytes', null,
    'expiresAt', p_request->>'expiresAt',
    'credentialDigestSha256', null,
    'escrowRecordIdHash', null,
    'targetMetadataHash', null,
    'claimedAt', p_request->>'requestedAt',
    'issuedAt', null,
    'unknownAt', null,
    'unknownReasonCode', null
  );
  issuance_value := public.reeditpro_upload_target_with_hash(
    issuance_body, 'issuanceHash'
  );
  record_body := (current_intent.record_json - 'recordHash') || jsonb_build_object(
    'revision', current_intent.revision + 1,
    'state', 'target_issuing',
    'issuance', issuance_value,
    'updatedAt', p_request->>'requestedAt'
  );
  record_value := public.reeditpro_upload_target_with_hash(record_body, 'recordHash');
  update public.canonical_upload_intents set
    revision = revision + 1,
    state = 'target_issuing',
    record_json = record_value,
    record_sha256 = record_value->>'recordHash',
    updated_at = (p_request->>'requestedAt')::timestamptz
  where upload_intent_id = current_intent.upload_intent_id;
  return public.reeditpro_upload_target_commit_result(
    'claim_target', record_value, current_intent.revision,
    p_request->>'requestHash', key_hash, p_request->>'requestedAt'
  );
end;
$$;

create or replace function public.reeditpro_commit_upload_target_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  current_intent public.canonical_upload_intents%rowtype;
  key_hash text;
  existing_receipt record;
  issued_target jsonb;
  current_issuance jsonb;
  issuance_body jsonb;
  issuance_value jsonb;
  record_body jsonb;
  record_value jsonb;
begin
  if p_contract_version <> 'canonical-durable-upload-target-authority-port-v1' then
    raise exception using errcode = '22023', message = 'UPLOAD_TARGET_CONTRACT_VERSION_INVALID';
  end if;
  perform public.reeditpro_upload_target_require_keys(
    p_request,
    array[
      'idempotencyKey','requestHash','requestedAt','uploadIntentId','expectedRevision',
      'attemptId','leaseHash','issuedTarget'
    ],
    'UPLOAD_TARGET_COMMIT_REQUEST'
  );
  issued_target := p_request->'issuedTarget';
  perform public.reeditpro_upload_target_require_keys(
    issued_target,
    array[
      'uploadMethod','targetProtocol','supportsResume','recommendedChunkSizeBytes',
      'expiresAt','credentialDigestSha256','escrowRecordIdHash','targetMetadataHash'
    ],
    'UPLOAD_TARGET_ISSUED_METADATA'
  );
  perform public.reeditpro_upload_target_assert_local_internal_authority(
    'reeditpro_commit_upload_target_v1', p_request
  );
  select * into current_intent from public.canonical_upload_intents
  where upload_intent_id = p_request->>'uploadIntentId';
  if not found then
    raise exception using errcode = 'P0002', message = 'UPLOAD_TARGET_INTENT_NOT_FOUND';
  end if;
  perform public.reeditpro_upload_target_assert_actor(
    current_intent.owner_user_id, current_intent.workspace_id, current_intent.project_id
  );
  key_hash := public.reeditpro_upload_target_idempotency_key_hash(
    p_request->>'idempotencyKey'
  );
  perform pg_advisory_xact_lock(hashtextextended(
    current_intent.owner_user_id::text || ':' || current_intent.workspace_id::text
      || ':commit_target:' || key_hash,
    0
  ));
  select receipt.request_sha256, receipt.result_json into existing_receipt
  from public.canonical_upload_target_idempotency_receipts receipt
  where receipt.owner_user_id = current_intent.owner_user_id
    and receipt.workspace_id = current_intent.workspace_id
    and receipt.operation = 'commit_target'
    and receipt.idempotency_key_sha256 = key_hash;
  if found then
    if existing_receipt.request_sha256 <> p_request->>'requestHash' then
      raise exception using errcode = '23505', message = 'UPLOAD_TARGET_IDEMPOTENCY_CONFLICT';
    end if;
    return public.reeditpro_upload_target_exact_replay(existing_receipt.result_json);
  end if;
  select * into current_intent from public.canonical_upload_intents
  where upload_intent_id = p_request->>'uploadIntentId' for update;
  current_issuance := current_intent.record_json->'issuance';
  if current_intent.revision <> (p_request->>'expectedRevision')::bigint
    or current_intent.state <> 'target_issuing'
    or current_issuance->>'attemptId' <> p_request->>'attemptId'
    or current_issuance->>'leaseHash' <> p_request->>'leaseHash'
    or issued_target->>'targetProtocol' <> current_issuance->>'targetProtocol'
    or issued_target->>'expiresAt' <> current_issuance->>'expiresAt'
    or issued_target->>'uploadMethod' not in ('PUT', 'POST')
    or issued_target->>'targetProtocol' not in (
      'single_put',
      'gcs_resumable',
      'resumable_content_range_v1'
    )
    or (issued_target->>'supportsResume')::boolean <>
      (
        issued_target->>'targetProtocol'
          in ('gcs_resumable', 'resumable_content_range_v1')
      )
    or coalesce(issued_target->>'credentialDigestSha256', '') !~ '^[a-f0-9]{64}$'
    or coalesce(issued_target->>'escrowRecordIdHash', '') !~ '^[a-f0-9]{64}$'
    or coalesce(issued_target->>'targetMetadataHash', '') !~ '^[a-f0-9]{64}$'
    or (
      issued_target->'recommendedChunkSizeBytes' <> 'null'::jsonb
      and (issued_target->>'recommendedChunkSizeBytes')::bigint <= 0
    ) then
    raise exception using errcode = '40001', message = 'UPLOAD_TARGET_COMMIT_STATE_INVALID';
  end if;
  issuance_body := jsonb_build_object(
    'schemaVersion', 'canonical-durable-upload-target-issuance-v1',
    'state', 'issued',
    'attemptId', p_request->>'attemptId',
    'leaseHash', p_request->>'leaseHash',
    'claimLeaseExpiresAt', current_issuance->>'claimLeaseExpiresAt',
    'targetProtocol', issued_target->>'targetProtocol',
    'uploadMethod', issued_target->>'uploadMethod',
    'supportsResume', (issued_target->>'supportsResume')::boolean,
    'recommendedChunkSizeBytes', issued_target->'recommendedChunkSizeBytes',
    'expiresAt', issued_target->>'expiresAt',
    'credentialDigestSha256', issued_target->>'credentialDigestSha256',
    'escrowRecordIdHash', issued_target->>'escrowRecordIdHash',
    'targetMetadataHash', issued_target->>'targetMetadataHash',
    'claimedAt', current_issuance->>'claimedAt',
    'issuedAt', p_request->>'requestedAt',
    'unknownAt', null,
    'unknownReasonCode', null
  );
  issuance_value := public.reeditpro_upload_target_with_hash(
    issuance_body, 'issuanceHash'
  );
  record_body := (current_intent.record_json - 'recordHash') || jsonb_build_object(
    'revision', current_intent.revision + 1,
    'state', 'target_issued',
    'issuance', issuance_value,
    'updatedAt', p_request->>'requestedAt'
  );
  record_value := public.reeditpro_upload_target_with_hash(record_body, 'recordHash');
  update public.canonical_upload_intents set
    revision = revision + 1,
    state = 'target_issued',
    record_json = record_value,
    record_sha256 = record_value->>'recordHash',
    updated_at = (p_request->>'requestedAt')::timestamptz
  where upload_intent_id = current_intent.upload_intent_id;
  return public.reeditpro_upload_target_commit_result(
    'commit_target', record_value, current_intent.revision,
    p_request->>'requestHash', key_hash, p_request->>'requestedAt'
  );
end;
$$;

revoke all on function public.reeditpro_claim_upload_target_v1(text, jsonb)
  from public, anon, service_role;
revoke all on function public.reeditpro_commit_upload_target_v1(text, jsonb)
  from public, anon, service_role;
grant execute on function public.reeditpro_claim_upload_target_v1(text, jsonb)
  to authenticated;
grant execute on function public.reeditpro_commit_upload_target_v1(text, jsonb)
  to authenticated;
