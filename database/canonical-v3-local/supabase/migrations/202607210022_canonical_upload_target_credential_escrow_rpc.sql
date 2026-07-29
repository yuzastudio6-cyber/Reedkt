-- ReEditPro canonical V3 local baseline: envelope-encrypted temporary upload
-- target credential escrow.
--
-- This migration belongs only to the isolated canonical-v3-local chain. It is
-- not a production migration and must never be copied into supabase/migrations.
-- PostgreSQL receives AES-GCM ciphertext, wrapped data-key material, immutable
-- lineage, and deletion audit evidence only. Upload URLs, upload headers,
-- bearer credentials, plaintext data keys, and wrapping keys are never accepted
-- by these RPCs or stored in these tables.

create table public.canonical_upload_target_credential_escrow (
  record_id text primary key check (
    length(record_id) between 1 and 240
    and record_id ~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]*$'
    and strpos(record_id, '..') = 0
  ),
  upload_intent_id text not null,
  owner_user_id uuid not null,
  workspace_id uuid not null,
  project_id uuid not null,
  attempt_id text not null check (
    length(attempt_id) between 1 and 240
    and attempt_id ~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]*$'
    and strpos(attempt_id, '..') = 0
  ),
  credential_digest_sha256 text not null check (
    credential_digest_sha256 ~ '^[a-f0-9]{64}$'
  ),
  expires_at timestamptz not null,
  state text not null check (state in ('active', 'deleted')),
  content_encryption_algorithm text check (
    content_encryption_algorithm is null
    or content_encryption_algorithm = 'aes-256-gcm'
  ),
  key_wrap_algorithm text check (
    key_wrap_algorithm is null
    or key_wrap_algorithm = 'aes-256-gcm-local-proof'
  ),
  key_reference_digest_sha256 text check (
    key_reference_digest_sha256 is null
    or key_reference_digest_sha256 ~ '^[a-f0-9]{64}$'
  ),
  payload_ciphertext_base64 text,
  payload_iv_base64 text,
  payload_auth_tag_base64 text,
  wrapped_data_key_base64 text,
  key_wrap_iv_base64 text,
  key_wrap_auth_tag_base64 text,
  associated_data_digest_sha256 text check (
    associated_data_digest_sha256 is null
    or associated_data_digest_sha256 ~ '^[a-f0-9]{64}$'
  ),
  plaintext_digest_sha256 text check (
    plaintext_digest_sha256 is null
    or plaintext_digest_sha256 ~ '^[a-f0-9]{64}$'
  ),
  envelope_digest_sha256 text check (
    envelope_digest_sha256 is null
    or envelope_digest_sha256 ~ '^[a-f0-9]{64}$'
  ),
  created_at timestamptz not null,
  deleted_at timestamptz,
  unique (upload_intent_id, attempt_id),
  foreign key (upload_intent_id, workspace_id, project_id, owner_user_id)
    references public.canonical_upload_intents(
      upload_intent_id, workspace_id, project_id, owner_user_id
    ) on delete restrict,
  check (record_id = 'upload_target_escrow_' || attempt_id),
  check (expires_at > created_at),
  check (
    (
      state = 'active'
      and deleted_at is null
      and content_encryption_algorithm is not null
      and key_wrap_algorithm is not null
      and key_reference_digest_sha256 is not null
      and payload_ciphertext_base64 is not null
      and payload_iv_base64 is not null
      and payload_auth_tag_base64 is not null
      and wrapped_data_key_base64 is not null
      and key_wrap_iv_base64 is not null
      and key_wrap_auth_tag_base64 is not null
      and associated_data_digest_sha256 is not null
      and plaintext_digest_sha256 is not null
      and envelope_digest_sha256 is not null
    )
    or (
      state = 'deleted'
      and deleted_at is not null
      and content_encryption_algorithm is null
      and key_wrap_algorithm is null
      and key_reference_digest_sha256 is null
      and payload_ciphertext_base64 is null
      and payload_iv_base64 is null
      and payload_auth_tag_base64 is null
      and wrapped_data_key_base64 is null
      and key_wrap_iv_base64 is null
      and key_wrap_auth_tag_base64 is null
      and associated_data_digest_sha256 is null
      and plaintext_digest_sha256 is null
      and envelope_digest_sha256 is null
    )
  )
);

create table public.canonical_upload_target_credential_escrow_audit_events (
  event_id uuid primary key default extensions.gen_random_uuid(),
  record_id text not null,
  upload_intent_id text not null,
  owner_user_id uuid not null,
  workspace_id uuid not null,
  attempt_id text not null,
  operation text not null check (operation in ('put_encrypted', 'delete_encrypted')),
  credential_digest_sha256 text not null check (
    credential_digest_sha256 ~ '^[a-f0-9]{64}$'
  ),
  envelope_digest_sha256 text,
  event_sha256 text not null unique check (event_sha256 ~ '^[a-f0-9]{64}$'),
  occurred_at timestamptz not null,
  foreign key (record_id)
    references public.canonical_upload_target_credential_escrow(record_id)
      on delete restrict,
  check (
    (operation = 'put_encrypted' and envelope_digest_sha256 ~ '^[a-f0-9]{64}$')
    or (operation = 'delete_encrypted' and envelope_digest_sha256 is null)
  )
);

create index canonical_upload_target_credential_escrow_tenant_lookup
  on public.canonical_upload_target_credential_escrow(
    workspace_id, owner_user_id, upload_intent_id, attempt_id
  );
create index canonical_upload_target_credential_escrow_audit_tenant_lookup
  on public.canonical_upload_target_credential_escrow_audit_events(
    workspace_id, owner_user_id, upload_intent_id, occurred_at
  );

alter table public.canonical_upload_target_credential_escrow enable row level security;
alter table public.canonical_upload_target_credential_escrow force row level security;
alter table public.canonical_upload_target_credential_escrow_audit_events
  enable row level security;
alter table public.canonical_upload_target_credential_escrow_audit_events
  force row level security;

revoke all on table
  public.canonical_upload_target_credential_escrow,
  public.canonical_upload_target_credential_escrow_audit_events
from public, anon, authenticated, service_role;

create trigger canonical_upload_target_credential_escrow_audit_immutable
before update or delete
on public.canonical_upload_target_credential_escrow_audit_events
for each row execute function public.reeditpro_reject_row_mutation();

create or replace function public.reeditpro_upload_target_credential_escrow_record_json(
  p_record public.canonical_upload_target_credential_escrow
)
returns jsonb
language plpgsql
stable
strict
set search_path = pg_catalog, public
as $$
declare
  envelope_value jsonb;
  record_body jsonb;
begin
  if p_record.state = 'active' then
    envelope_value := jsonb_build_object(
      'schemaVersion', 'canonical-upload-target-credential-envelope-v1',
      'contentEncryptionAlgorithm', p_record.content_encryption_algorithm,
      'keyWrapAlgorithm', p_record.key_wrap_algorithm,
      'keyReferenceDigestSha256', p_record.key_reference_digest_sha256,
      'payloadCiphertextBase64', p_record.payload_ciphertext_base64,
      'payloadIvBase64', p_record.payload_iv_base64,
      'payloadAuthTagBase64', p_record.payload_auth_tag_base64,
      'wrappedDataKeyBase64', p_record.wrapped_data_key_base64,
      'keyWrapIvBase64', p_record.key_wrap_iv_base64,
      'keyWrapAuthTagBase64', p_record.key_wrap_auth_tag_base64,
      'associatedDataDigestSha256', p_record.associated_data_digest_sha256,
      'plaintextDigestSha256', p_record.plaintext_digest_sha256,
      'envelopeDigestSha256', p_record.envelope_digest_sha256
    );
  else
    envelope_value := null;
  end if;
  record_body := jsonb_build_object(
    'schemaVersion', 'canonical-upload-target-credential-escrow-record-v1',
    'recordId', p_record.record_id,
    'uploadIntentId', p_record.upload_intent_id,
    'attemptId', p_record.attempt_id,
    'credentialDigestSha256', p_record.credential_digest_sha256,
    'expiresAt', to_char(
      p_record.expires_at at time zone 'UTC',
      'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
    ),
    'state', p_record.state,
    'envelope', envelope_value,
    'createdAt', to_char(
      p_record.created_at at time zone 'UTC',
      'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
    ),
    'deletedAt', case
      when p_record.deleted_at is null then null
      else to_char(
        p_record.deleted_at at time zone 'UTC',
        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
      )
    end
  );
  return public.reeditpro_upload_target_with_hash(record_body, 'recordHash');
end;
$$;

create or replace function public.reeditpro_put_upload_target_credential_envelope_v1(
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
  current_issuance jsonb;
  existing_record public.canonical_upload_target_credential_escrow%rowtype;
  inserted_record public.canonical_upload_target_credential_escrow%rowtype;
  envelope_value jsonb;
  event_body jsonb;
  requested_at_value timestamptz;
begin
  if p_contract_version <> 'canonical-upload-target-credential-escrow-rpc-v1' then
    raise exception using errcode = '22023', message = 'UPLOAD_TARGET_ESCROW_CONTRACT_INVALID';
  end if;
  perform public.reeditpro_upload_target_require_keys(
    p_request,
    array[
      'recordId','uploadIntentId','attemptId','credentialDigestSha256',
      'expiresAt','envelope','requestedAt'
    ],
    'UPLOAD_TARGET_ESCROW_PUT_REQUEST'
  );
  perform public.reeditpro_upload_target_assert_local_internal_authority(
    'reeditpro_put_upload_target_credential_envelope_v1', p_request
  );
  envelope_value := p_request->'envelope';
  perform public.reeditpro_upload_target_require_keys(
    envelope_value,
    array[
      'schemaVersion','contentEncryptionAlgorithm','keyWrapAlgorithm',
      'keyReferenceDigestSha256','payloadCiphertextBase64','payloadIvBase64',
      'payloadAuthTagBase64','wrappedDataKeyBase64','keyWrapIvBase64',
      'keyWrapAuthTagBase64','associatedDataDigestSha256',
      'plaintextDigestSha256','envelopeDigestSha256'
    ],
    'UPLOAD_TARGET_ESCROW_ENVELOPE'
  );
  select * into current_intent
  from public.canonical_upload_intents
  where upload_intent_id = p_request->>'uploadIntentId';
  if not found then
    raise exception using errcode = 'P0002', message = 'UPLOAD_TARGET_ESCROW_INTENT_NOT_FOUND';
  end if;
  perform public.reeditpro_upload_target_assert_actor(
    current_intent.owner_user_id,
    current_intent.workspace_id,
    current_intent.project_id
  );
  current_issuance := current_intent.record_json->'issuance';
  requested_at_value := (p_request->>'requestedAt')::timestamptz;
  if current_intent.state not in ('target_issuing', 'target_issued')
    or current_issuance->>'attemptId' <> p_request->>'attemptId'
    or p_request->>'recordId' <> 'upload_target_escrow_' || (p_request->>'attemptId')
    or p_request->>'expiresAt' <> current_issuance->>'expiresAt'
    or (p_request->>'expiresAt')::timestamptz <= requested_at_value
    or coalesce(p_request->>'credentialDigestSha256', '') !~ '^[a-f0-9]{64}$'
    or envelope_value->>'schemaVersion'
      <> 'canonical-upload-target-credential-envelope-v1'
    or envelope_value->>'contentEncryptionAlgorithm' <> 'aes-256-gcm'
    or envelope_value->>'keyWrapAlgorithm' <> 'aes-256-gcm-local-proof'
    or coalesce(envelope_value->>'keyReferenceDigestSha256', '') !~ '^[a-f0-9]{64}$'
    or coalesce(envelope_value->>'associatedDataDigestSha256', '') !~ '^[a-f0-9]{64}$'
    or coalesce(envelope_value->>'plaintextDigestSha256', '') !~ '^[a-f0-9]{64}$'
    or coalesce(envelope_value->>'envelopeDigestSha256', '') !~ '^[a-f0-9]{64}$'
    or envelope_value->>'envelopeDigestSha256'
      <> public.reeditpro_sha256_json(envelope_value - 'envelopeDigestSha256')
    or coalesce(length(envelope_value->>'payloadCiphertextBase64'), 0) not between 4 and 131072
    or coalesce(length(envelope_value->>'payloadIvBase64'), 0) not between 4 and 128
    or coalesce(length(envelope_value->>'payloadAuthTagBase64'), 0) not between 4 and 128
    or coalesce(length(envelope_value->>'wrappedDataKeyBase64'), 0) not between 4 and 128
    or coalesce(length(envelope_value->>'keyWrapIvBase64'), 0) not between 4 and 128
    or coalesce(length(envelope_value->>'keyWrapAuthTagBase64'), 0) not between 4 and 128
    or envelope_value->>'payloadCiphertextBase64' !~ '^[A-Za-z0-9+/]+={0,2}$'
    or envelope_value->>'payloadIvBase64' !~ '^[A-Za-z0-9+/]+={0,2}$'
    or envelope_value->>'payloadAuthTagBase64' !~ '^[A-Za-z0-9+/]+={0,2}$'
    or envelope_value->>'wrappedDataKeyBase64' !~ '^[A-Za-z0-9+/]+={0,2}$'
    or envelope_value->>'keyWrapIvBase64' !~ '^[A-Za-z0-9+/]+={0,2}$'
    or envelope_value->>'keyWrapAuthTagBase64' !~ '^[A-Za-z0-9+/]+={0,2}$'
  then
    raise exception using errcode = '22023', message = 'UPLOAD_TARGET_ESCROW_PUT_INVALID';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_request->>'recordId', 0));
  select * into existing_record
  from public.canonical_upload_target_credential_escrow
  where record_id = p_request->>'recordId'
  for update;
  if found then
    if existing_record.state <> 'active'
      or existing_record.upload_intent_id <> p_request->>'uploadIntentId'
      or existing_record.attempt_id <> p_request->>'attemptId'
      or existing_record.credential_digest_sha256
        <> p_request->>'credentialDigestSha256'
      or existing_record.expires_at <> (p_request->>'expiresAt')::timestamptz
    then
      raise exception using errcode = '23505', message = 'UPLOAD_TARGET_ESCROW_IDENTITY_CONFLICT';
    end if;
    return public.reeditpro_upload_target_credential_escrow_record_json(existing_record);
  end if;

  insert into public.canonical_upload_target_credential_escrow (
    record_id, upload_intent_id, owner_user_id, workspace_id, project_id,
    attempt_id, credential_digest_sha256, expires_at, state,
    content_encryption_algorithm, key_wrap_algorithm, key_reference_digest_sha256,
    payload_ciphertext_base64, payload_iv_base64, payload_auth_tag_base64,
    wrapped_data_key_base64, key_wrap_iv_base64, key_wrap_auth_tag_base64,
    associated_data_digest_sha256, plaintext_digest_sha256,
    envelope_digest_sha256, created_at, deleted_at
  ) values (
    p_request->>'recordId',
    p_request->>'uploadIntentId',
    current_intent.owner_user_id,
    current_intent.workspace_id,
    current_intent.project_id,
    p_request->>'attemptId',
    p_request->>'credentialDigestSha256',
    (p_request->>'expiresAt')::timestamptz,
    'active',
    envelope_value->>'contentEncryptionAlgorithm',
    envelope_value->>'keyWrapAlgorithm',
    envelope_value->>'keyReferenceDigestSha256',
    envelope_value->>'payloadCiphertextBase64',
    envelope_value->>'payloadIvBase64',
    envelope_value->>'payloadAuthTagBase64',
    envelope_value->>'wrappedDataKeyBase64',
    envelope_value->>'keyWrapIvBase64',
    envelope_value->>'keyWrapAuthTagBase64',
    envelope_value->>'associatedDataDigestSha256',
    envelope_value->>'plaintextDigestSha256',
    envelope_value->>'envelopeDigestSha256',
    requested_at_value,
    null
  ) returning * into inserted_record;

  event_body := jsonb_build_object(
    'recordId', inserted_record.record_id,
    'uploadIntentId', inserted_record.upload_intent_id,
    'attemptId', inserted_record.attempt_id,
    'operation', 'put_encrypted',
    'credentialDigestSha256', inserted_record.credential_digest_sha256,
    'envelopeDigestSha256', inserted_record.envelope_digest_sha256,
    'occurredAt', p_request->>'requestedAt'
  );
  insert into public.canonical_upload_target_credential_escrow_audit_events (
    record_id, upload_intent_id, owner_user_id, workspace_id, attempt_id,
    operation, credential_digest_sha256, envelope_digest_sha256,
    event_sha256, occurred_at
  ) values (
    inserted_record.record_id,
    inserted_record.upload_intent_id,
    inserted_record.owner_user_id,
    inserted_record.workspace_id,
    inserted_record.attempt_id,
    'put_encrypted',
    inserted_record.credential_digest_sha256,
    inserted_record.envelope_digest_sha256,
    public.reeditpro_sha256_json(event_body),
    requested_at_value
  );
  return public.reeditpro_upload_target_credential_escrow_record_json(inserted_record);
end;
$$;

create or replace function public.reeditpro_read_upload_target_credential_envelope_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  current_record public.canonical_upload_target_credential_escrow%rowtype;
begin
  if p_contract_version <> 'canonical-upload-target-credential-escrow-rpc-v1' then
    raise exception using errcode = '22023', message = 'UPLOAD_TARGET_ESCROW_CONTRACT_INVALID';
  end if;
  perform public.reeditpro_upload_target_require_keys(
    p_request,
    array['recordId','uploadIntentId','attemptId'],
    'UPLOAD_TARGET_ESCROW_READ_REQUEST'
  );
  perform public.reeditpro_upload_target_assert_local_internal_authority(
    'reeditpro_read_upload_target_credential_envelope_v1', p_request
  );
  select * into current_record
  from public.canonical_upload_target_credential_escrow
  where record_id = p_request->>'recordId';
  if not found then return null; end if;
  perform public.reeditpro_upload_target_assert_actor(
    current_record.owner_user_id,
    current_record.workspace_id,
    current_record.project_id
  );
  if current_record.upload_intent_id <> p_request->>'uploadIntentId'
    or current_record.attempt_id <> p_request->>'attemptId' then
    raise exception using errcode = '42501', message = 'UPLOAD_TARGET_ESCROW_READ_SCOPE_DENIED';
  end if;
  return public.reeditpro_upload_target_credential_escrow_record_json(current_record);
end;
$$;

create or replace function public.reeditpro_delete_upload_target_credential_envelope_v1(
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
  current_record public.canonical_upload_target_credential_escrow%rowtype;
  deleted_record public.canonical_upload_target_credential_escrow%rowtype;
  event_body jsonb;
  requested_at_value timestamptz;
begin
  if p_contract_version <> 'canonical-upload-target-credential-escrow-rpc-v1' then
    raise exception using errcode = '22023', message = 'UPLOAD_TARGET_ESCROW_CONTRACT_INVALID';
  end if;
  perform public.reeditpro_upload_target_require_keys(
    p_request,
    array['recordId','uploadIntentId','attemptId','requestedAt'],
    'UPLOAD_TARGET_ESCROW_DELETE_REQUEST'
  );
  perform public.reeditpro_upload_target_assert_local_internal_authority(
    'reeditpro_delete_upload_target_credential_envelope_v1', p_request
  );
  requested_at_value := (p_request->>'requestedAt')::timestamptz;
  perform pg_advisory_xact_lock(hashtextextended(p_request->>'recordId', 0));
  select * into current_record
  from public.canonical_upload_target_credential_escrow
  where record_id = p_request->>'recordId'
  for update;
  if not found then return null; end if;
  perform public.reeditpro_upload_target_assert_actor(
    current_record.owner_user_id,
    current_record.workspace_id,
    current_record.project_id
  );
  if current_record.upload_intent_id <> p_request->>'uploadIntentId'
    or current_record.attempt_id <> p_request->>'attemptId' then
    raise exception using errcode = '42501', message = 'UPLOAD_TARGET_ESCROW_DELETE_SCOPE_DENIED';
  end if;
  if current_record.state = 'deleted' then
    return public.reeditpro_upload_target_credential_escrow_record_json(current_record);
  end if;
  if requested_at_value < current_record.created_at then
    raise exception using errcode = '22023', message = 'UPLOAD_TARGET_ESCROW_DELETE_TIME_INVALID';
  end if;

  update public.canonical_upload_target_credential_escrow set
    state = 'deleted',
    content_encryption_algorithm = null,
    key_wrap_algorithm = null,
    key_reference_digest_sha256 = null,
    payload_ciphertext_base64 = null,
    payload_iv_base64 = null,
    payload_auth_tag_base64 = null,
    wrapped_data_key_base64 = null,
    key_wrap_iv_base64 = null,
    key_wrap_auth_tag_base64 = null,
    associated_data_digest_sha256 = null,
    plaintext_digest_sha256 = null,
    envelope_digest_sha256 = null,
    deleted_at = requested_at_value
  where record_id = current_record.record_id
  returning * into deleted_record;

  event_body := jsonb_build_object(
    'recordId', deleted_record.record_id,
    'uploadIntentId', deleted_record.upload_intent_id,
    'attemptId', deleted_record.attempt_id,
    'operation', 'delete_encrypted',
    'credentialDigestSha256', deleted_record.credential_digest_sha256,
    'envelopeDigestSha256', null,
    'occurredAt', p_request->>'requestedAt'
  );
  insert into public.canonical_upload_target_credential_escrow_audit_events (
    record_id, upload_intent_id, owner_user_id, workspace_id, attempt_id,
    operation, credential_digest_sha256, envelope_digest_sha256,
    event_sha256, occurred_at
  ) values (
    deleted_record.record_id,
    deleted_record.upload_intent_id,
    deleted_record.owner_user_id,
    deleted_record.workspace_id,
    deleted_record.attempt_id,
    'delete_encrypted',
    deleted_record.credential_digest_sha256,
    null,
    public.reeditpro_sha256_json(event_body),
    requested_at_value
  );
  return public.reeditpro_upload_target_credential_escrow_record_json(deleted_record);
end;
$$;

revoke all on function
  public.reeditpro_upload_target_credential_escrow_record_json(
    public.canonical_upload_target_credential_escrow
  ),
  public.reeditpro_put_upload_target_credential_envelope_v1(text, jsonb),
  public.reeditpro_read_upload_target_credential_envelope_v1(text, jsonb),
  public.reeditpro_delete_upload_target_credential_envelope_v1(text, jsonb)
from public, anon, authenticated, service_role;

grant execute on function
  public.reeditpro_put_upload_target_credential_envelope_v1(text, jsonb),
  public.reeditpro_read_upload_target_credential_envelope_v1(text, jsonb),
  public.reeditpro_delete_upload_target_credential_envelope_v1(text, jsonb)
to authenticated;
