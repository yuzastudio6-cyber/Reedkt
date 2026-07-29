-- ReEditPro canonical V3 local baseline: durable pre-upload intent and
-- temporary-target issuance authority.
--
-- This migration belongs only to the isolated canonical-v3-local chain. It is
-- not a production migration and must never be copied into supabase/migrations.
-- PostgreSQL stores immutable intent/issuance metadata, exact idempotency
-- responses, and audit lineage. Upload URLs, headers, resumable-session URIs,
-- credentials, and object bytes remain outside this database.

create table public.canonical_upload_intents (
  upload_intent_id text primary key check (
    length(upload_intent_id) between 1 and 240
    and upload_intent_id ~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]*$'
    and strpos(upload_intent_id, '..') = 0
  ),
  owner_user_id uuid not null,
  workspace_id uuid not null,
  project_id uuid not null,
  edit_reference_id text,
  chat_session_id text,
  upload_purpose text not null check (upload_purpose in ('source_media', 'reference_media')),
  target_bucket text not null check (
    length(target_bucket) between 1 and 240
    and target_bucket ~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]*$'
  ),
  target_path text not null check (
    length(target_path) between 1 and 2048
    and left(target_path, 1) <> '/'
    and strpos(target_path, E'\\') = 0
    and target_path !~ '(^|/)([.]|[.][.])(/|$)'
  ),
  original_file_name text not null check (length(btrim(original_file_name)) between 1 and 255),
  mime_type text not null check (length(btrim(mime_type)) between 1 and 160),
  expected_size_bytes bigint not null check (
    expected_size_bytes > 0 and expected_size_bytes <= 1099511627776
  ),
  checksum_sha256 text check (checksum_sha256 ~ '^[a-f0-9]{64}$'),
  request_sha256 text not null check (request_sha256 ~ '^[a-f0-9]{64}$'),
  idempotency_key_sha256 text not null check (idempotency_key_sha256 ~ '^[a-f0-9]{64}$'),
  revision bigint not null check (revision >= 1),
  state text not null check (state in (
    'ready_for_target', 'target_issuing', 'target_issued', 'target_issue_unknown'
  )),
  record_json jsonb not null,
  record_sha256 text not null check (record_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  expires_at timestamptz not null,
  unique (upload_intent_id, workspace_id, project_id, owner_user_id),
  unique (workspace_id, upload_intent_id),
  foreign key (project_id, workspace_id)
    references public.projects(id, workspace_id) on delete restrict,
  foreign key (workspace_id, owner_user_id)
    references public.workspace_members(workspace_id, user_id) on delete restrict,
  check (expires_at > created_at),
  check (record_json->>'recordHash' = record_sha256),
  check (record_json->>'uploadIntentId' = upload_intent_id),
  check ((record_json->>'revision')::bigint = revision),
  check (record_json->>'state' = state),
  check (record_json::text !~* '"(uploadUrl|uploadHeaders|sessionUri|bearerToken|authorization)"[[:space:]]*:')
);

create table public.canonical_upload_target_idempotency_receipts (
  receipt_id uuid primary key default extensions.gen_random_uuid(),
  upload_intent_id text not null,
  owner_user_id uuid not null,
  workspace_id uuid not null,
  project_id uuid not null,
  operation text not null check (operation in (
    'resolve_intent', 'claim_target', 'commit_target', 'mark_target_unknown'
  )),
  idempotency_key_sha256 text not null check (idempotency_key_sha256 ~ '^[a-f0-9]{64}$'),
  request_sha256 text not null check (request_sha256 ~ '^[a-f0-9]{64}$'),
  result_json jsonb not null,
  result_sha256 text not null check (result_sha256 ~ '^[a-f0-9]{64}$'),
  committed_at timestamptz not null,
  unique (owner_user_id, workspace_id, operation, idempotency_key_sha256),
  foreign key (upload_intent_id, workspace_id, project_id, owner_user_id)
    references public.canonical_upload_intents(
      upload_intent_id, workspace_id, project_id, owner_user_id
    ) on delete restrict,
  check (result_json->>'resultHash' = result_sha256),
  check (result_json::text !~* '"(uploadUrl|uploadHeaders|sessionUri|bearerToken|authorization)"[[:space:]]*:')
);

create table public.canonical_upload_target_audit_events (
  upload_intent_id text not null,
  owner_user_id uuid not null,
  workspace_id uuid not null,
  project_id uuid not null,
  revision bigint not null check (revision >= 1),
  operation text not null check (operation in (
    'resolve_intent', 'claim_target', 'commit_target', 'mark_target_unknown'
  )),
  transaction_id text not null unique check (
    transaction_id ~ '^upload_target_transaction_[a-f0-9-]{36}$'
  ),
  event_sha256 text not null unique check (event_sha256 ~ '^[a-f0-9]{64}$'),
  committed_at timestamptz not null,
  primary key (upload_intent_id, revision),
  foreign key (upload_intent_id, workspace_id, project_id, owner_user_id)
    references public.canonical_upload_intents(
      upload_intent_id, workspace_id, project_id, owner_user_id
    ) on delete restrict
);

create index canonical_upload_intents_tenant_lookup
  on public.canonical_upload_intents(workspace_id, project_id, upload_intent_id);
create index canonical_upload_target_receipts_tenant_lookup
  on public.canonical_upload_target_idempotency_receipts(
    workspace_id, owner_user_id, upload_intent_id, operation
  );
create index canonical_upload_target_audit_tenant_lookup
  on public.canonical_upload_target_audit_events(
    workspace_id, upload_intent_id, revision
  );

alter table public.canonical_upload_intents enable row level security;
alter table public.canonical_upload_intents force row level security;
alter table public.canonical_upload_target_idempotency_receipts enable row level security;
alter table public.canonical_upload_target_idempotency_receipts force row level security;
alter table public.canonical_upload_target_audit_events enable row level security;
alter table public.canonical_upload_target_audit_events force row level security;

revoke all on table
  public.canonical_upload_intents,
  public.canonical_upload_target_idempotency_receipts,
  public.canonical_upload_target_audit_events
from public, anon, authenticated, service_role;

create trigger canonical_upload_target_receipts_immutable
before update or delete on public.canonical_upload_target_idempotency_receipts
for each row execute function public.reeditpro_reject_row_mutation();
create trigger canonical_upload_target_audit_immutable
before update or delete on public.canonical_upload_target_audit_events
for each row execute function public.reeditpro_reject_row_mutation();

create or replace function public.reeditpro_upload_target_idempotency_key_hash(
  p_value text
)
returns text
language sql
immutable
strict
set search_path = pg_catalog, public
as $$
  select public.reeditpro_sha256_json(to_jsonb(p_value));
$$;

create or replace function public.reeditpro_upload_target_with_hash(
  p_value jsonb,
  p_field text
)
returns jsonb
language sql
immutable
strict
set search_path = pg_catalog, public
as $$
  select p_value || jsonb_build_object(p_field, public.reeditpro_sha256_json(p_value));
$$;

create or replace function public.reeditpro_upload_target_require_keys(
  p_value jsonb,
  p_keys text[],
  p_label text
)
returns void
language plpgsql
immutable
strict
set search_path = pg_catalog
as $$
declare
  actual_count integer;
begin
  if jsonb_typeof(p_value) <> 'object' then
    raise exception using errcode = '22023', message = p_label || '_NOT_OBJECT';
  end if;
  select count(*) into actual_count from jsonb_object_keys(p_value);
  if actual_count <> cardinality(p_keys)
    or exists (
      select 1 from jsonb_object_keys(p_value) key_name
      where not (key_name = any(p_keys))
    )
    or exists (
      select 1 from unnest(p_keys) expected_key
      where not (p_value ? expected_key)
    ) then
    raise exception using errcode = '22023', message = p_label || '_KEY_SET_INVALID';
  end if;
end;
$$;

create or replace function public.reeditpro_upload_target_assert_local_internal_authority(
  p_function_name text,
  p_request jsonb
)
returns void
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  headers jsonb;
  host_value text;
  port_value text;
  provided_signature text;
  local_secret text;
  expected_signature text;
begin
  begin
    headers := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    headers := null;
  end;
  host_value := lower(split_part(coalesce(headers->>'x-forwarded-host', ''), ':', 1));
  port_value := coalesce(headers->>'x-forwarded-port', '');
  provided_signature := lower(coalesce(
    headers->>'x-reeditpro-local-upload-target-authority', ''
  ));
  local_secret := nullif(current_setting('app.settings.jwt_secret', true), '');
  if host_value not in ('127.0.0.1', 'localhost')
    or port_value <> '57431'
    or coalesce(length(local_secret), 0) < 32
    or provided_signature !~ '^[a-f0-9]{64}$' then
    raise exception using
      errcode = '42501', message = 'UPLOAD_TARGET_LOCAL_INTERNAL_AUTHORITY_REQUIRED';
  end if;
  expected_signature := encode(extensions.hmac(
    'canonical_upload_target_local_internal_v1:' || p_function_name || ':'
      || public.reeditpro_sha256_json(p_request),
    local_secret,
    'sha256'
  ), 'hex');
  if not public.reeditpro_constant_time_hex_equal(provided_signature, expected_signature) then
    raise exception using
      errcode = '42501', message = 'UPLOAD_TARGET_LOCAL_INTERNAL_AUTHORITY_INVALID';
  end if;
end;
$$;

create or replace function public.reeditpro_upload_target_assert_actor(
  p_owner_user_id uuid,
  p_workspace_id uuid,
  p_project_id uuid default null
)
returns void
language plpgsql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.uid() is null or auth.uid() <> p_owner_user_id then
    raise exception using errcode = '42501', message = 'UPLOAD_TARGET_ACTOR_SCOPE_DENIED';
  end if;
  if not exists (
    select 1 from public.workspace_members member
    where member.workspace_id = p_workspace_id
      and member.user_id = p_owner_user_id
  ) then
    raise exception using errcode = '42501', message = 'UPLOAD_TARGET_WORKSPACE_SCOPE_DENIED';
  end if;
  if p_project_id is not null and not exists (
    select 1 from public.projects project
    where project.id = p_project_id
      and project.workspace_id = p_workspace_id
      and project.owner_user_id = p_owner_user_id
  ) then
    raise exception using errcode = '42501', message = 'UPLOAD_TARGET_PROJECT_SCOPE_DENIED';
  end if;
end;
$$;

create or replace function public.reeditpro_upload_target_exact_replay(
  p_result jsonb
)
returns jsonb
language sql
immutable
strict
set search_path = pg_catalog, public
as $$
  select public.reeditpro_upload_target_with_hash(
    (p_result - 'resultHash') || jsonb_build_object('idempotencyStatus', 'exact_replay'),
    'resultHash'
  );
$$;

create or replace function public.reeditpro_upload_target_commit_result(
  p_operation text,
  p_record jsonb,
  p_revision_before bigint,
  p_request_sha256 text,
  p_idempotency_key_sha256 text,
  p_requested_at text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  transaction_id_value text;
  audit_body jsonb;
  audit_hash text;
  transaction_body jsonb;
  transaction_value jsonb;
  result_body jsonb;
  result_value jsonb;
begin
  transaction_id_value := 'upload_target_transaction_' || extensions.gen_random_uuid()::text;
  audit_body := jsonb_build_object(
    'operation', p_operation,
    'uploadIntentId', p_record->>'uploadIntentId',
    'revision', (p_record->>'revision')::bigint,
    'state', p_record->>'state',
    'committedAt', p_requested_at
  );
  audit_hash := public.reeditpro_sha256_json(audit_body);
  transaction_body := jsonb_build_object(
    'schemaVersion', 'canonical-durable-upload-target-transaction-v1',
    'transactionId', transaction_id_value,
    'operation', p_operation,
    'uploadIntentId', p_record->>'uploadIntentId',
    'revisionBefore', p_revision_before,
    'revisionAfter', (p_record->>'revision')::bigint,
    'requestHash', p_request_sha256,
    'idempotencyKeyHash', p_idempotency_key_sha256,
    'auditEventHash', audit_hash,
    'committedAt', p_requested_at
  );
  transaction_value := public.reeditpro_upload_target_with_hash(
    transaction_body, 'transactionHash'
  );
  result_body := jsonb_build_object(
    'schemaVersion', 'canonical-durable-upload-target-mutation-result-v1',
    'operation', p_operation,
    'idempotencyStatus', 'inserted',
    'intent', p_record,
    'transaction', transaction_value
  );
  result_value := public.reeditpro_upload_target_with_hash(result_body, 'resultHash');

  insert into public.canonical_upload_target_audit_events (
    upload_intent_id, owner_user_id, workspace_id, project_id,
    revision, operation, transaction_id, event_sha256, committed_at
  ) values (
    p_record->>'uploadIntentId',
    (p_record->>'ownerUserId')::uuid,
    (p_record->>'workspaceId')::uuid,
    (p_record->>'projectId')::uuid,
    (p_record->>'revision')::bigint,
    p_operation,
    transaction_id_value,
    audit_hash,
    p_requested_at::timestamptz
  );
  insert into public.canonical_upload_target_idempotency_receipts (
    upload_intent_id, owner_user_id, workspace_id, project_id, operation,
    idempotency_key_sha256, request_sha256, result_json, result_sha256, committed_at
  ) values (
    p_record->>'uploadIntentId',
    (p_record->>'ownerUserId')::uuid,
    (p_record->>'workspaceId')::uuid,
    (p_record->>'projectId')::uuid,
    p_operation,
    p_idempotency_key_sha256,
    p_request_sha256,
    result_value,
    result_value->>'resultHash',
    p_requested_at::timestamptz
  );
  return result_value;
end;
$$;

create or replace function public.reeditpro_resolve_upload_intent_v1(
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
  candidate jsonb;
  owner_id uuid;
  workspace_id_value uuid;
  project_id_value uuid;
  key_hash text;
  request_hash text;
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
    array['idempotencyKey','requestHash','requestedAt','candidate','authorizationEvidenceHash'],
    'UPLOAD_TARGET_RESOLVE_REQUEST'
  );
  candidate := p_request->'candidate';
  perform public.reeditpro_upload_target_require_keys(
    candidate,
    array[
      'schemaVersion','uploadIntentId','ownerUserId','workspaceId','projectId',
      'editReferenceId','chatSessionId','uploadPurpose','targetBucket','targetPath',
      'originalFileName','mimeType','expectedSizeBytes','checksumSha256','requestHash',
      'createdAt','expiresAt','candidateHash'
    ],
    'UPLOAD_TARGET_CANDIDATE'
  );
  perform public.reeditpro_upload_target_assert_local_internal_authority(
    'reeditpro_resolve_upload_intent_v1', p_request
  );
  owner_id := (candidate->>'ownerUserId')::uuid;
  workspace_id_value := (candidate->>'workspaceId')::uuid;
  project_id_value := (candidate->>'projectId')::uuid;
  perform public.reeditpro_upload_target_assert_actor(
    owner_id, workspace_id_value, project_id_value
  );
  if candidate->>'schemaVersion' <> 'canonical-durable-upload-intent-candidate-v1'
    or candidate->>'candidateHash' <> public.reeditpro_sha256_json(candidate - 'candidateHash')
    or coalesce(p_request->>'authorizationEvidenceHash', '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'requestHash', '') !~ '^[a-f0-9]{64}$'
    or candidate->>'requestHash' <> p_request->>'requestHash'
    or coalesce(p_request->>'idempotencyKey', '') !~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]{15,239}$'
    or strpos(p_request->>'idempotencyKey', '..') > 0
    or candidate->>'uploadPurpose' not in ('source_media', 'reference_media')
    or (candidate->>'expectedSizeBytes')::bigint <= 0
    or (candidate->>'expectedSizeBytes')::bigint > 1099511627776
    or (candidate->>'expiresAt')::timestamptz <= (candidate->>'createdAt')::timestamptz
    or left(candidate->>'targetPath', 1) = '/'
    or strpos(candidate->>'targetPath', E'\\') > 0
    or candidate->>'targetPath' ~ '(^|/)([.]|[.][.])(/|$)'
    or (
      candidate->'checksumSha256' <> 'null'::jsonb
      and candidate->>'checksumSha256' !~ '^[a-f0-9]{64}$'
    ) then
    raise exception using errcode = '22023', message = 'UPLOAD_TARGET_RESOLVE_REQUEST_INVALID';
  end if;
  request_hash := p_request->>'requestHash';
  if request_hash <> public.reeditpro_sha256_json(jsonb_build_object(
    'schemaVersion', 'canonical-durable-upload-intent-domain-request-v1',
    'ownerUserId', candidate->>'ownerUserId',
    'workspaceId', candidate->>'workspaceId',
    'projectId', candidate->>'projectId',
    'editReferenceId', candidate->'editReferenceId',
    'chatSessionId', candidate->'chatSessionId',
    'uploadPurpose', candidate->>'uploadPurpose',
    'targetBucket', candidate->>'targetBucket',
    'originalFileName', candidate->>'originalFileName',
    'mimeType', candidate->>'mimeType',
    'expectedSizeBytes', (candidate->>'expectedSizeBytes')::bigint,
    'checksumSha256', candidate->'checksumSha256'
  )) then
    raise exception using errcode = '22023', message = 'UPLOAD_TARGET_DOMAIN_REQUEST_HASH_INVALID';
  end if;
  key_hash := public.reeditpro_upload_target_idempotency_key_hash(
    p_request->>'idempotencyKey'
  );
  perform pg_advisory_xact_lock(hashtextextended(
    owner_id::text || ':' || workspace_id_value::text || ':resolve_intent:' || key_hash,
    0
  ));
  select receipt.request_sha256, receipt.result_json
    into existing_receipt
  from public.canonical_upload_target_idempotency_receipts receipt
  where receipt.owner_user_id = owner_id
    and receipt.workspace_id = workspace_id_value
    and receipt.operation = 'resolve_intent'
    and receipt.idempotency_key_sha256 = key_hash;
  if found then
    if existing_receipt.request_sha256 <> request_hash then
      raise exception using errcode = '23505', message = 'UPLOAD_TARGET_IDEMPOTENCY_CONFLICT';
    end if;
    return public.reeditpro_upload_target_exact_replay(existing_receipt.result_json);
  end if;
  if exists (
    select 1 from public.canonical_upload_intents intent
    where intent.upload_intent_id = candidate->>'uploadIntentId'
  ) then
    raise exception using errcode = '23505', message = 'UPLOAD_TARGET_IDENTITY_CONFLICT';
  end if;

  issuance_body := jsonb_build_object(
    'schemaVersion', 'canonical-durable-upload-target-issuance-v1',
    'state', 'not_started',
    'attemptId', null,
    'leaseHash', null,
    'claimLeaseExpiresAt', null,
    'targetProtocol', null,
    'uploadMethod', null,
    'supportsResume', null,
    'recommendedChunkSizeBytes', null,
    'expiresAt', null,
    'credentialDigestSha256', null,
    'escrowRecordIdHash', null,
    'targetMetadataHash', null,
    'claimedAt', null,
    'issuedAt', null,
    'unknownAt', null,
    'unknownReasonCode', null
  );
  issuance_value := public.reeditpro_upload_target_with_hash(
    issuance_body, 'issuanceHash'
  );
  record_body := jsonb_build_object(
    'schemaVersion', 'canonical-durable-upload-intent-record-v1',
    'authorityClass', 'pre_media_upload_intent_and_temporary_target',
    'uploadIntentId', candidate->>'uploadIntentId',
    'ownerUserId', candidate->>'ownerUserId',
    'workspaceId', candidate->>'workspaceId',
    'projectId', candidate->>'projectId',
    'editReferenceId', candidate->'editReferenceId',
    'chatSessionId', candidate->'chatSessionId',
    'uploadPurpose', candidate->>'uploadPurpose',
    'targetBucket', candidate->>'targetBucket',
    'targetPath', candidate->>'targetPath',
    'originalFileName', candidate->>'originalFileName',
    'mimeType', candidate->>'mimeType',
    'expectedSizeBytes', (candidate->>'expectedSizeBytes')::bigint,
    'checksumSha256', candidate->'checksumSha256',
    'requestHash', request_hash,
    'idempotencyKeyHash', key_hash,
    'revision', 1,
    'state', 'ready_for_target',
    'issuance', issuance_value,
    'createdAt', candidate->>'createdAt',
    'updatedAt', p_request->>'requestedAt',
    'expiresAt', candidate->>'expiresAt'
  );
  record_value := public.reeditpro_upload_target_with_hash(record_body, 'recordHash');
  insert into public.canonical_upload_intents (
    upload_intent_id, owner_user_id, workspace_id, project_id,
    edit_reference_id, chat_session_id, upload_purpose, target_bucket, target_path,
    original_file_name, mime_type, expected_size_bytes, checksum_sha256,
    request_sha256, idempotency_key_sha256, revision, state,
    record_json, record_sha256, created_at, updated_at, expires_at
  ) values (
    candidate->>'uploadIntentId', owner_id, workspace_id_value, project_id_value,
    candidate->>'editReferenceId', candidate->>'chatSessionId',
    candidate->>'uploadPurpose', candidate->>'targetBucket', candidate->>'targetPath',
    candidate->>'originalFileName', candidate->>'mimeType',
    (candidate->>'expectedSizeBytes')::bigint, candidate->>'checksumSha256',
    request_hash, key_hash, 1, 'ready_for_target',
    record_value, record_value->>'recordHash',
    (candidate->>'createdAt')::timestamptz,
    (p_request->>'requestedAt')::timestamptz,
    (candidate->>'expiresAt')::timestamptz
  );
  return public.reeditpro_upload_target_commit_result(
    'resolve_intent', record_value, 0, request_hash, key_hash, p_request->>'requestedAt'
  );
end;
$$;

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
    or p_request->>'targetProtocol' not in ('single_put', 'gcs_resumable')
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
    or issued_target->>'targetProtocol' not in ('single_put', 'gcs_resumable')
    or (issued_target->>'supportsResume')::boolean <>
      (issued_target->>'targetProtocol' = 'gcs_resumable')
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

create or replace function public.reeditpro_mark_upload_target_unknown_v1(
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
      'attemptId','leaseHash','reasonCode'
    ],
    'UPLOAD_TARGET_UNKNOWN_REQUEST'
  );
  perform public.reeditpro_upload_target_assert_local_internal_authority(
    'reeditpro_mark_upload_target_unknown_v1', p_request
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
      || ':mark_target_unknown:' || key_hash,
    0
  ));
  select receipt.request_sha256, receipt.result_json into existing_receipt
  from public.canonical_upload_target_idempotency_receipts receipt
  where receipt.owner_user_id = current_intent.owner_user_id
    and receipt.workspace_id = current_intent.workspace_id
    and receipt.operation = 'mark_target_unknown'
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
    or p_request->>'reasonCode' not in (
      'TARGET_CREATION_OUTCOME_UNKNOWN',
      'TARGET_ESCROW_WRITE_FAILED',
      'TARGET_COMMIT_OUTCOME_UNKNOWN',
      'TARGET_ESCROW_RECOVERY_FAILED'
    ) then
    raise exception using errcode = '40001', message = 'UPLOAD_TARGET_UNKNOWN_STATE_INVALID';
  end if;
  issuance_body := jsonb_build_object(
    'schemaVersion', 'canonical-durable-upload-target-issuance-v1',
    'state', 'unknown',
    'attemptId', p_request->>'attemptId',
    'leaseHash', p_request->>'leaseHash',
    'claimLeaseExpiresAt', current_issuance->>'claimLeaseExpiresAt',
    'targetProtocol', current_issuance->>'targetProtocol',
    'uploadMethod', null,
    'supportsResume', null,
    'recommendedChunkSizeBytes', null,
    'expiresAt', current_issuance->>'expiresAt',
    'credentialDigestSha256', null,
    'escrowRecordIdHash', null,
    'targetMetadataHash', null,
    'claimedAt', current_issuance->>'claimedAt',
    'issuedAt', null,
    'unknownAt', p_request->>'requestedAt',
    'unknownReasonCode', p_request->>'reasonCode'
  );
  issuance_value := public.reeditpro_upload_target_with_hash(
    issuance_body, 'issuanceHash'
  );
  record_body := (current_intent.record_json - 'recordHash') || jsonb_build_object(
    'revision', current_intent.revision + 1,
    'state', 'target_issue_unknown',
    'issuance', issuance_value,
    'updatedAt', p_request->>'requestedAt'
  );
  record_value := public.reeditpro_upload_target_with_hash(record_body, 'recordHash');
  update public.canonical_upload_intents set
    revision = revision + 1,
    state = 'target_issue_unknown',
    record_json = record_value,
    record_sha256 = record_value->>'recordHash',
    updated_at = (p_request->>'requestedAt')::timestamptz
  where upload_intent_id = current_intent.upload_intent_id;
  return public.reeditpro_upload_target_commit_result(
    'mark_target_unknown', record_value, current_intent.revision,
    p_request->>'requestHash', key_hash, p_request->>'requestedAt'
  );
end;
$$;

create or replace function public.reeditpro_read_upload_intent_v1(
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
  owner_id uuid;
  workspace_id_value uuid;
  current_intent public.canonical_upload_intents%rowtype;
begin
  if p_contract_version <> 'canonical-durable-upload-target-authority-port-v1' then
    raise exception using errcode = '22023', message = 'UPLOAD_TARGET_CONTRACT_VERSION_INVALID';
  end if;
  perform public.reeditpro_upload_target_require_keys(
    p_request,
    array['ownerUserId','workspaceId','uploadIntentId','authorizationEvidenceHash'],
    'UPLOAD_TARGET_READ_REQUEST'
  );
  perform public.reeditpro_upload_target_assert_local_internal_authority(
    'reeditpro_read_upload_intent_v1', p_request
  );
  owner_id := (p_request->>'ownerUserId')::uuid;
  workspace_id_value := (p_request->>'workspaceId')::uuid;
  if coalesce(p_request->>'authorizationEvidenceHash', '') !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '22023', message = 'UPLOAD_TARGET_READ_REQUEST_INVALID';
  end if;
  perform public.reeditpro_upload_target_assert_actor(owner_id, workspace_id_value, null);
  select * into current_intent from public.canonical_upload_intents
  where upload_intent_id = p_request->>'uploadIntentId';
  if not found then return null; end if;
  if current_intent.owner_user_id <> owner_id
    or current_intent.workspace_id <> workspace_id_value then
    raise exception using errcode = '42501', message = 'UPLOAD_TARGET_READ_SCOPE_DENIED';
  end if;
  return current_intent.record_json;
end;
$$;

do $$
declare
  signature text;
begin
  foreach signature in array array[
    'reeditpro_resolve_upload_intent_v1(text,jsonb)',
    'reeditpro_claim_upload_target_v1(text,jsonb)',
    'reeditpro_commit_upload_target_v1(text,jsonb)',
    'reeditpro_mark_upload_target_unknown_v1(text,jsonb)',
    'reeditpro_read_upload_intent_v1(text,jsonb)'
  ] loop
    execute format('revoke all on function public.%s from public, anon, service_role', signature);
    execute format('grant execute on function public.%s to authenticated', signature);
  end loop;
  foreach signature in array array[
    'reeditpro_upload_target_idempotency_key_hash(text)',
    'reeditpro_upload_target_with_hash(jsonb,text)',
    'reeditpro_upload_target_require_keys(jsonb,text[],text)',
    'reeditpro_upload_target_assert_local_internal_authority(text,jsonb)',
    'reeditpro_upload_target_assert_actor(uuid,uuid,uuid)',
    'reeditpro_upload_target_exact_replay(jsonb)',
    'reeditpro_upload_target_commit_result(text,jsonb,bigint,text,text,text)'
  ] loop
    execute format(
      'revoke all on function public.%s from public, anon, authenticated, service_role',
      signature
    );
  end loop;
end;
$$;
