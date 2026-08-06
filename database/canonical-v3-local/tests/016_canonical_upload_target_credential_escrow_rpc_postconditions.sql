\set ON_ERROR_STOP on
\echo 'canonical-v3-local: encrypted upload-target credential escrow postconditions'

do $$
declare
  active_record public.canonical_upload_target_credential_escrow%rowtype;
  envelope_value jsonb;
begin
  if not exists (
    select 1
    from pg_catalog.pg_class relation
    join pg_catalog.pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname in (
        'canonical_upload_target_credential_escrow',
        'canonical_upload_target_credential_escrow_audit_events'
      )
      and relation.relrowsecurity
      and relation.relforcerowsecurity
    group by namespace.nspname
    having count(*) = 2
  ) then
    raise exception 'UPLOAD_TARGET_ESCROW_FORCED_RLS_MISSING';
  end if;

  if exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name in (
        'canonical_upload_target_credential_escrow',
        'canonical_upload_target_credential_escrow_audit_events'
      )
      and grantee in ('anon', 'authenticated', 'service_role')
  ) then
    raise exception 'UPLOAD_TARGET_ESCROW_DIRECT_TABLE_GRANT_PRESENT';
  end if;

  if not has_function_privilege(
      'authenticated',
      'public.reeditpro_put_upload_target_credential_envelope_v1(text,jsonb)',
      'EXECUTE'
    )
    or not has_function_privilege(
      'authenticated',
      'public.reeditpro_read_upload_target_credential_envelope_v1(text,jsonb)',
      'EXECUTE'
    )
    or not has_function_privilege(
      'authenticated',
      'public.reeditpro_delete_upload_target_credential_envelope_v1(text,jsonb)',
      'EXECUTE'
    )
    or has_function_privilege(
      'anon',
      'public.reeditpro_put_upload_target_credential_envelope_v1(text,jsonb)',
      'EXECUTE'
    )
    or has_function_privilege(
      'service_role',
      'public.reeditpro_read_upload_target_credential_envelope_v1(text,jsonb)',
      'EXECUTE'
    )
  then
    raise exception 'UPLOAD_TARGET_ESCROW_RPC_ROLE_BOUNDARY_INVALID';
  end if;

  if (select count(*) from public.canonical_upload_target_credential_escrow) <> 3
    or (
      select count(*)
      from public.canonical_upload_target_credential_escrow
      where state = 'active'
    ) <> 1
    or (
      select count(*)
      from public.canonical_upload_target_credential_escrow
      where state = 'deleted'
    ) <> 2
    or (
      select count(*)
      from public.canonical_upload_target_credential_escrow_audit_events
    ) <> 5
    or (
      select count(*)
      from public.canonical_upload_target_credential_escrow_audit_events
      where operation = 'put_encrypted'
    ) <> 3
    or (
      select count(*)
      from public.canonical_upload_target_credential_escrow_audit_events
      where operation = 'delete_encrypted'
    ) <> 2
  then
    raise exception 'UPLOAD_TARGET_ESCROW_LIFECYCLE_COUNTS_INVALID';
  end if;

  select * into active_record
  from public.canonical_upload_target_credential_escrow
  where upload_intent_id = 'upload_local_target_success';
  if not found
    or active_record.state <> 'active'
    or active_record.content_encryption_algorithm <> 'aes-256-gcm'
    or active_record.key_wrap_algorithm <> 'aes-256-gcm-local-proof'
    or length(active_record.payload_ciphertext_base64) < 100
    or length(active_record.payload_iv_base64) <> 16
    or length(active_record.payload_auth_tag_base64) <> 24
    or length(active_record.wrapped_data_key_base64) <> 44
    or length(active_record.key_wrap_iv_base64) <> 16
    or length(active_record.key_wrap_auth_tag_base64) <> 24
  then
    raise exception 'UPLOAD_TARGET_ESCROW_ACTIVE_ENVELOPE_INVALID';
  end if;

  envelope_value := jsonb_build_object(
    'schemaVersion', 'canonical-upload-target-credential-envelope-v1',
    'contentEncryptionAlgorithm', active_record.content_encryption_algorithm,
    'keyWrapAlgorithm', active_record.key_wrap_algorithm,
    'keyReferenceDigestSha256', active_record.key_reference_digest_sha256,
    'payloadCiphertextBase64', active_record.payload_ciphertext_base64,
    'payloadIvBase64', active_record.payload_iv_base64,
    'payloadAuthTagBase64', active_record.payload_auth_tag_base64,
    'wrappedDataKeyBase64', active_record.wrapped_data_key_base64,
    'keyWrapIvBase64', active_record.key_wrap_iv_base64,
    'keyWrapAuthTagBase64', active_record.key_wrap_auth_tag_base64,
    'associatedDataDigestSha256', active_record.associated_data_digest_sha256,
    'plaintextDigestSha256', active_record.plaintext_digest_sha256
  );
  if active_record.envelope_digest_sha256
    <> public.reeditpro_sha256_json(envelope_value)
  then
    raise exception 'UPLOAD_TARGET_ESCROW_ENVELOPE_HASH_INVALID';
  end if;

  if exists (
    select 1
    from public.canonical_upload_target_credential_escrow escrow
    join public.canonical_upload_intents intent
      on intent.upload_intent_id = escrow.upload_intent_id
    where escrow.credential_digest_sha256
        <> intent.record_json->'issuance'->>'credentialDigestSha256'
      or escrow.attempt_id <> intent.record_json->'issuance'->>'attemptId'
      or escrow.expires_at <> (
        intent.record_json->'issuance'->>'expiresAt'
      )::timestamptz
  ) then
    raise exception 'UPLOAD_TARGET_ESCROW_INTENT_LINEAGE_INVALID';
  end if;

  if exists (
    select 1
    from public.canonical_upload_target_credential_escrow
    where state = 'deleted'
      and (
        payload_ciphertext_base64 is not null
        or payload_iv_base64 is not null
        or payload_auth_tag_base64 is not null
        or wrapped_data_key_base64 is not null
        or key_wrap_iv_base64 is not null
        or key_wrap_auth_tag_base64 is not null
        or envelope_digest_sha256 is not null
      )
  ) then
    raise exception 'UPLOAD_TARGET_ESCROW_DELETED_CIPHERTEXT_RETAINED';
  end if;

  if exists (
    select 1
    from public.canonical_upload_target_credential_escrow_audit_events event
    where event.event_sha256 <> public.reeditpro_sha256_json(jsonb_build_object(
      'recordId', event.record_id,
      'uploadIntentId', event.upload_intent_id,
      'attemptId', event.attempt_id,
      'operation', event.operation,
      'credentialDigestSha256', event.credential_digest_sha256,
      'envelopeDigestSha256', event.envelope_digest_sha256,
      'occurredAt', to_char(
        event.occurred_at at time zone 'UTC',
        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
      )
    ))
  ) then
    raise exception 'UPLOAD_TARGET_ESCROW_AUDIT_HASH_INVALID';
  end if;

  if exists (
    select 1
    from public.canonical_upload_target_credential_escrow escrow
    where to_jsonb(escrow)::text ~* (
      'https?://|storage[.]invalid|uploadUrl|uploadHeaders|'
      || 'authorization|bearerToken|sessionUri'
    )
  ) then
    raise exception 'UPLOAD_TARGET_ESCROW_PLAINTEXT_CREDENTIAL_PERSISTED';
  end if;

  begin
    update public.canonical_upload_target_credential_escrow_audit_events
      set event_sha256 = repeat('f', 64);
    raise exception 'UPLOAD_TARGET_ESCROW_AUDIT_MUTATION_ALLOWED';
  exception when sqlstate '55000' then null;
  end;
end;
$$;

begin;
set local role authenticated;
do $$
begin
  begin
    update public.canonical_upload_target_credential_escrow
      set state = 'deleted'
      where record_id = 'missing';
    raise exception 'UPLOAD_TARGET_ESCROW_DIRECT_UPDATE_ALLOWED';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.reeditpro_read_upload_target_credential_envelope_v1(
      'canonical-upload-target-credential-escrow-rpc-v1',
      jsonb_build_object(
        'recordId', 'upload_target_escrow_missing',
        'uploadIntentId', 'upload_missing',
        'attemptId', 'attempt_missing'
      )
    );
    raise exception 'UPLOAD_TARGET_ESCROW_UNSIGNED_RPC_ALLOWED';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;

\echo 'PASS 016_canonical_upload_target_credential_escrow_rpc_postconditions'
