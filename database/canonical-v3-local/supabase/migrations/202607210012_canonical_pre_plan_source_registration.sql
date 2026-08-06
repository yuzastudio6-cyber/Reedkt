-- Canonical V3 local-only finalized source registration.
-- The browser never calls this RPC. A request-scoped server runtime first
-- verifies the private upload and probes the bytes, then submits the exact
-- immutable facts through the fixed loopback/HMAC boundary before enqueue.

alter table public.preference_assets
  add column source_registration_actor_user_id uuid,
  add column source_registration_idempotency_key_hash text,
  add column source_registration_request_hash text,
  add column source_registration_transaction_id uuid,
  add column source_registration_committed_at timestamptz,
  add constraint preference_asset_source_registration_all_or_none check (
    (
      source_registration_actor_user_id is null
      and source_registration_idempotency_key_hash is null
      and source_registration_request_hash is null
      and source_registration_transaction_id is null
      and source_registration_committed_at is null
    )
    or (
      source_registration_actor_user_id is not null
      and source_registration_idempotency_key_hash ~ '^[a-f0-9]{64}$'
      and source_registration_request_hash ~ '^[a-f0-9]{64}$'
      and source_registration_transaction_id is not null
      and source_registration_committed_at is not null
    )
  ),
  add constraint preference_asset_source_registration_actor_fk
    foreign key (workspace_id, source_registration_actor_user_id)
    references public.workspace_members(workspace_id, user_id) on delete restrict;

create unique index preference_asset_source_registration_idempotency
  on public.preference_assets(
    workspace_id,
    source_registration_actor_user_id,
    source_registration_idempotency_key_hash
  )
  where source_registration_idempotency_key_hash is not null;

create or replace function public.reeditpro_register_pre_plan_source_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  workspace_uuid uuid;
  reference_uuid uuid;
  study_uuid uuid;
  source_asset_uuid uuid;
  actor_uuid uuid;
  evidence_row public.preference_evidence_assets%rowtype;
  source_row public.preference_assets%rowtype;
  idempotency_hash text;
  transaction_uuid uuid;
  committed_at timestamptz;
  metadata_value jsonb;
  disposition_value text;
begin
  if p_contract_version <> 'canonical-distributed-pre-plan-study-state-port-v1'
    or jsonb_typeof(p_request) <> 'object'
    or not (p_request ?& array[
      'ownerUserId', 'workspaceId', 'editReferenceId', 'studySessionId',
      'sourceAssetId', 'sourcePrivateMediaArtifactId',
      'sourceStorageObjectRecordId', 'sourceMediaAssetId',
      'sourceStorageObjectId', 'sourceStorageGeneration', 'sourceStorageEtag',
      'sourceChecksumSha256', 'sourceSizeBytes',
      'sourceDurationMilliseconds', 'sourceMimeType', 'sourceHasAudio',
      'idempotencyKey', 'requestedAt', 'requestHash'
    ])
    or (p_request - array[
      'ownerUserId', 'workspaceId', 'editReferenceId', 'studySessionId',
      'sourceAssetId', 'sourcePrivateMediaArtifactId',
      'sourceStorageObjectRecordId', 'sourceMediaAssetId',
      'sourceStorageObjectId', 'sourceStorageGeneration', 'sourceStorageEtag',
      'sourceChecksumSha256', 'sourceSizeBytes',
      'sourceDurationMilliseconds', 'sourceMimeType', 'sourceHasAudio',
      'idempotencyKey', 'requestedAt', 'requestHash'
    ]) <> '{}'::jsonb
    or coalesce(p_request->>'sourcePrivateMediaArtifactId', '')
      <> coalesce(p_request->>'sourceStorageObjectRecordId', '')
    or length(coalesce(p_request->>'sourceStorageObjectRecordId', '')) not between 1 and 240
    or length(coalesce(p_request->>'sourceMediaAssetId', '')) not between 1 and 240
    or length(coalesce(p_request->>'sourceStorageObjectId', '')) not between 1 and 500
    or p_request->>'sourceStorageObjectId' like '%..%'
    or p_request->>'sourceStorageObjectId' like '%://%'
    or p_request->>'sourceStorageObjectId' like '%?%'
    or p_request->>'sourceStorageObjectId' like '%#%'
    or length(coalesce(p_request->>'sourceStorageGeneration', '')) not between 1 and 160
    or length(coalesce(p_request->>'sourceStorageEtag', '')) not between 1 and 240
    or coalesce(p_request->>'sourceChecksumSha256', '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'sourceSizeBytes', '') !~ '^[1-9][0-9]*$'
    or (p_request->>'sourceSizeBytes')::numeric > 1099511627776
    or coalesce(p_request->>'sourceDurationMilliseconds', '') !~ '^[1-9][0-9]*$'
    or (p_request->>'sourceDurationMilliseconds')::numeric > 2592000000
    or coalesce(p_request->>'sourceMimeType', '')
      !~ '^video/[A-Za-z0-9.+-]{1,120}$'
    or jsonb_typeof(p_request->'sourceHasAudio') <> 'boolean'
    or length(coalesce(p_request->>'idempotencyKey', '')) not between 16 and 240
    or p_request->>'idempotencyKey' !~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]*$'
    or p_request->>'idempotencyKey' like '%..%'
    or coalesce(p_request->>'requestHash', '') !~ '^[a-f0-9]{64}$'
    or p_request->>'requestHash' <>
      public.reeditpro_pre_plan_request_hash('register_source', p_request)
  then
    raise exception using
      errcode = '22023', message = 'PRE_PLAN_SOURCE_REGISTRATION_REQUEST_INVALID';
  end if;

  perform public.reeditpro_pre_plan_assert_local_internal_authority(p_request);
  begin
    actor_uuid := (p_request->>'ownerUserId')::uuid;
    workspace_uuid := (p_request->>'workspaceId')::uuid;
    reference_uuid := (p_request->>'editReferenceId')::uuid;
    study_uuid := (p_request->>'studySessionId')::uuid;
    source_asset_uuid := (p_request->>'sourceAssetId')::uuid;
    perform (p_request->>'requestedAt')::timestamptz;
  exception when others then
    raise exception using
      errcode = '22023', message = 'PRE_PLAN_SOURCE_REGISTRATION_IDENTITY_INVALID';
  end;

  if auth.uid() is null
    or auth.uid() <> actor_uuid
    or not public.reeditpro_has_workspace_write_access(workspace_uuid)
    or not exists (
      select 1
      from public.edit_references reference
      where reference.id = reference_uuid
        and reference.workspace_id = workspace_uuid
        and reference.owner_user_id = actor_uuid
    )
  then
    raise exception using
      errcode = '42501', message = 'PRE_PLAN_SOURCE_REGISTRATION_TENANT_DENIED';
  end if;

  select * into strict evidence_row
  from public.preference_evidence_assets evidence
  where evidence.id = source_asset_uuid
    and evidence.workspace_id = workspace_uuid
    and evidence.edit_reference_id = reference_uuid
    and evidence.study_session_id = study_uuid;
  if evidence_row.storage_object_record_id <> p_request->>'sourceStorageObjectRecordId'
    or evidence_row.media_asset_id <> p_request->>'sourceMediaAssetId'
    or evidence_row.record_json->>'id' <> source_asset_uuid::text
    or evidence_row.record_json->>'workspaceId' <> workspace_uuid::text
    or evidence_row.record_json->>'editReferenceId' <> reference_uuid::text
    or evidence_row.record_json->>'studySessionId' <> study_uuid::text
    or evidence_row.record_json->>'assetKind' <> 'reference_video_metadata'
    or evidence_row.record_json->>'storageObjectRecordId'
      <> p_request->>'sourceStorageObjectRecordId'
    or evidence_row.record_json->>'mediaAssetId' <> p_request->>'sourceMediaAssetId'
    or evidence_row.record_json->>'privateAssetId' <> p_request->>'sourceMediaAssetId'
    or evidence_row.record_json->>'rightsBasis'
      not in ('user_owned', 'licensed_or_authorized', 'reference_only')
  then
    raise exception using
      errcode = '42501', message = 'PRE_PLAN_SOURCE_REGISTRATION_EVIDENCE_INVALID';
  end if;

  idempotency_hash := public.reeditpro_pre_plan_idempotency_key_hash(
    p_request->>'idempotencyKey'
  );
  perform pg_advisory_xact_lock(hashtextextended(
    workspace_uuid::text || ':' || actor_uuid::text || ':' || idempotency_hash,
    0
  ));

  select * into source_row
  from public.preference_assets asset
  where asset.workspace_id = workspace_uuid
    and asset.source_registration_actor_user_id = actor_uuid
    and asset.source_registration_idempotency_key_hash = idempotency_hash
  for update;
  if found and (
    source_row.id <> source_asset_uuid
    or source_row.source_registration_request_hash <> p_request->>'requestHash'
  ) then
    raise exception using
      errcode = '23505', message = 'PRE_PLAN_SOURCE_REGISTRATION_IDEMPOTENCY_CONFLICT';
  end if;

  if not found then
    select * into source_row
    from public.preference_assets asset
    where asset.id = source_asset_uuid
    for update;
    if found then
      raise exception using
        errcode = '23505', message = 'PRE_PLAN_SOURCE_REGISTRATION_IDENTITY_CONFLICT';
    end if;

    transaction_uuid := extensions.gen_random_uuid();
    committed_at := clock_timestamp();
    metadata_value := jsonb_build_object(
      'sourcePrivateMediaArtifactId', p_request->>'sourcePrivateMediaArtifactId',
      'sourceStorageObjectRecordId', p_request->>'sourceStorageObjectRecordId',
      'sourceMediaAssetId', p_request->>'sourceMediaAssetId',
      'sizeBytes', (p_request->>'sourceSizeBytes')::bigint,
      'durationMilliseconds', (p_request->>'sourceDurationMilliseconds')::bigint,
      'mimeType', p_request->>'sourceMimeType',
      'hasAudio', (p_request->>'sourceHasAudio')::boolean,
      'registrationAuthority', 'server_verified_local_private_media'
    );
    insert into public.preference_assets (
      id, workspace_id, edit_reference_id, study_session_id,
      storage_object_id, storage_generation, storage_etag, checksum_sha256,
      asset_kind, metadata_json,
      source_registration_actor_user_id,
      source_registration_idempotency_key_hash,
      source_registration_request_hash,
      source_registration_transaction_id,
      source_registration_committed_at,
      created_at
    ) values (
      source_asset_uuid, workspace_uuid, reference_uuid, study_uuid,
      p_request->>'sourceStorageObjectId',
      p_request->>'sourceStorageGeneration',
      p_request->>'sourceStorageEtag',
      p_request->>'sourceChecksumSha256',
      'source', metadata_value,
      actor_uuid, idempotency_hash, p_request->>'requestHash',
      transaction_uuid, committed_at, committed_at
    )
    returning * into source_row;
    disposition_value := 'inserted';
  else
    if source_row.edit_reference_id <> reference_uuid
      or source_row.study_session_id <> study_uuid
      or source_row.storage_object_id <> p_request->>'sourceStorageObjectId'
      or source_row.storage_generation <> p_request->>'sourceStorageGeneration'
      or source_row.storage_etag <> p_request->>'sourceStorageEtag'
      or source_row.checksum_sha256 <> p_request->>'sourceChecksumSha256'
      or source_row.asset_kind <> 'source'
      or source_row.metadata_json->>'sourcePrivateMediaArtifactId'
        <> p_request->>'sourcePrivateMediaArtifactId'
      or source_row.metadata_json->>'sourceStorageObjectRecordId'
        <> p_request->>'sourceStorageObjectRecordId'
      or source_row.metadata_json->>'sourceMediaAssetId'
        <> p_request->>'sourceMediaAssetId'
      or (source_row.metadata_json->>'sizeBytes')::bigint
        <> (p_request->>'sourceSizeBytes')::bigint
      or (source_row.metadata_json->>'durationMilliseconds')::bigint
        <> (p_request->>'sourceDurationMilliseconds')::bigint
      or source_row.metadata_json->>'mimeType' <> p_request->>'sourceMimeType'
      or (source_row.metadata_json->>'hasAudio')::boolean
        <> (p_request->>'sourceHasAudio')::boolean
    then
      raise exception using
        errcode = '23505', message = 'PRE_PLAN_SOURCE_REGISTRATION_REPLAY_CONFLICT';
    end if;
    disposition_value := 'idempotent_replay';
  end if;

  return jsonb_build_object(
    'schemaVersion',
      'canonical-v3-local-preference-asset-source-registration-receipt-v1',
    'sourceAssetId', source_row.id::text,
    'status', 'registered',
    'disposition', disposition_value,
    'transaction', jsonb_build_object(
      'transactionId', source_row.source_registration_transaction_id::text,
      'committedAt',
        public.reeditpro_iso_timestamp(source_row.source_registration_committed_at),
      'authenticatedRlsVerified', true,
      'databaseTransactionVerified', true
    ),
    'boundaries', jsonb_build_object(
      'localLoopbackOnly', true,
      'privateEvidenceIdentityVerified', true,
      'browserSuppliedStorageAuthorityAccepted', false,
      'rawMediaPathSignedUrlOrCredentialReturned', false,
      'remoteMutationAllowed', false,
      'productionAuthority', false
    )
  );
exception
  when no_data_found then
    raise exception using
      errcode = '42501', message = 'PRE_PLAN_SOURCE_REGISTRATION_EVIDENCE_INVALID';
end;
$$;

revoke all on function public.reeditpro_register_pre_plan_source_v1(text,jsonb)
  from public, anon, service_role;
grant execute on function public.reeditpro_register_pre_plan_source_v1(text,jsonb)
  to authenticated;

-- Long-form study state is an append-only projection over the immutable
-- Preference evidence asset. The original asset row is never rewritten.
create table public.preference_evidence_asset_long_form_events (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  reference_asset_id uuid not null,
  actor_user_id uuid not null,
  event_sequence bigint not null check (event_sequence >= 1),
  operation text not null check (operation in (
    'preference_study.long_form_study.start',
    'preference_study.long_form_study.control.pause',
    'preference_study.long_form_study.control.resume',
    'preference_study.long_form_study.control.cancel',
    'preference_study.long_form_study.control.recover'
  )),
  study_run_id uuid not null,
  external_run_id text not null check (length(external_run_id) between 1 and 200),
  run_revision bigint not null check (run_revision >= 1),
  summary_json jsonb not null,
  media_metadata_json jsonb not null,
  assistant_message_id uuid not null,
  transaction_id uuid not null,
  committed_at timestamptz not null,
  unique (reference_asset_id, event_sequence),
  unique (reference_asset_id, external_run_id, run_revision, operation),
  unique (id, reference_asset_id, study_session_id, edit_reference_id, workspace_id),
  foreign key (reference_asset_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_evidence_assets(
      id, study_session_id, edit_reference_id, workspace_id
    ) on delete restrict,
  foreign key (workspace_id, actor_user_id)
    references public.workspace_members(workspace_id, user_id) on delete restrict,
  foreign key (study_run_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_long_form_study_runs(
      id, study_session_id, edit_reference_id, workspace_id
    ) on delete restrict,
  foreign key (assistant_message_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_messages(
      id, study_session_id, edit_reference_id, workspace_id
    ) on delete restrict
);

alter table public.preference_evidence_asset_long_form_events
  enable row level security;
alter table public.preference_evidence_asset_long_form_events
  force row level security;
revoke all on public.preference_evidence_asset_long_form_events
  from public, anon, authenticated, service_role;

create trigger preference_evidence_asset_long_form_events_immutable
  before update or delete on public.preference_evidence_asset_long_form_events
  for each row execute function public.reeditpro_reject_row_mutation();

-- Preserve the evidence/DNA/QA builder as a private helper, then layer the
-- latest append-only long-form projection onto assets and their source
-- evidence. Existing readers keep the same aggregate function name.
alter function public.reeditpro_build_edit_reference_domain_aggregate_v2(uuid, uuid)
  rename to reeditpro_build_edit_reference_domain_aggregate_v2_base;

create or replace function public.reeditpro_build_edit_reference_domain_aggregate_v2(
  p_actor_user_id uuid,
  p_workspace_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  aggregate_json jsonb;
begin
  aggregate_json :=
    public.reeditpro_build_edit_reference_domain_aggregate_v2_base(
      p_actor_user_id,
      p_workspace_id
    );
  if aggregate_json is null then return null; end if;

  aggregate_json := jsonb_set(
    aggregate_json,
    '{assets}',
    coalesce((
      select jsonb_agg(
        asset.record_json
        || case when latest_event.id is null then '{}'::jsonb else
          jsonb_build_object(
            'longFormStudy', latest_event.summary_json,
            'mediaMetadata', latest_event.media_metadata_json
          )
        end
        order by asset.created_at, asset.id
      )
      from public.preference_evidence_assets asset
      join public.edit_references reference
        on reference.id = asset.edit_reference_id
       and reference.workspace_id = asset.workspace_id
      left join lateral (
        select event.*
        from public.preference_evidence_asset_long_form_events event
        where event.reference_asset_id = asset.id
          and event.study_session_id = asset.study_session_id
          and event.edit_reference_id = asset.edit_reference_id
          and event.workspace_id = asset.workspace_id
        order by event.event_sequence desc
        limit 1
      ) latest_event on true
      where asset.workspace_id = p_workspace_id
        and reference.owner_user_id = p_actor_user_id
    ), '[]'::jsonb),
    true
  );

  aggregate_json := jsonb_set(
    aggregate_json,
    '{evidence}',
    coalesce((
      select jsonb_agg(
        evidence.evidence_json
        || case when latest_event.id is null then '{}'::jsonb else
          jsonb_build_object('mediaMetadata', latest_event.media_metadata_json)
        end
        order by evidence.created_at, evidence.id
      )
      from public.preference_evidence evidence
      join public.edit_references reference
        on reference.id = evidence.edit_reference_id
       and reference.workspace_id = evidence.workspace_id
      left join lateral (
        select event.*
        from public.preference_evidence_assets asset
        join public.preference_evidence_asset_long_form_events event
          on event.reference_asset_id = asset.id
         and event.study_session_id = asset.study_session_id
         and event.edit_reference_id = asset.edit_reference_id
         and event.workspace_id = asset.workspace_id
        where asset.study_session_id = evidence.study_session_id
          and asset.edit_reference_id = evidence.edit_reference_id
          and asset.workspace_id = evidence.workspace_id
          and asset.record_json->>'privateAssetId'
            = evidence.evidence_json->'provenance'->>'privateAssetId'
        order by event.event_sequence desc
        limit 1
      ) latest_event on true
      where evidence.workspace_id = p_workspace_id
        and reference.owner_user_id = p_actor_user_id
        and evidence.evidence_json ? 'provenance'
    ), '[]'::jsonb),
    true
  );

  return aggregate_json;
end;
$$;

revoke all on function
  public.reeditpro_build_edit_reference_domain_aggregate_v2_base(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function
  public.reeditpro_build_edit_reference_domain_aggregate_v2(uuid, uuid)
  from public, anon, authenticated, service_role;

create or replace function public.mutate_edit_reference_long_form_domain_command_v1(
  p_contract_version text,
  p_actor_user_id uuid,
  p_command jsonb,
  p_idempotency_key_hash_sha256 text,
  p_request_hash_sha256 text
)
returns setof jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  operation_name text;
  action_name text;
  request_json jsonb;
  input_json jsonb;
  prepared_json jsonb;
  summary_json jsonb;
  media_metadata_json jsonb;
  message_json jsonb;
  workspace_uuid uuid;
  study_uuid uuid;
  reference_uuid uuid;
  reference_asset_uuid uuid;
  message_uuid uuid;
  audit_uuid uuid;
  receipt_uuid uuid;
  event_uuid uuid;
  transaction_uuid uuid;
  domain_state public.edit_reference_domain_states%rowtype;
  existing_receipt public.edit_reference_domain_idempotency_receipts%rowtype;
  study_row public.preference_study_sessions%rowtype;
  reference_row public.edit_references%rowtype;
  reference_asset_row public.preference_evidence_assets%rowtype;
  source_asset_row public.preference_assets%rowtype;
  plan_row public.preference_long_form_study_plans%rowtype;
  run_row public.preference_long_form_study_runs%rowtype;
  latest_event public.preference_evidence_asset_long_form_events%rowtype;
  expected_study_revision bigint;
  next_revision bigint;
  next_audit_sequence bigint;
  next_receipt_sequence bigint;
  next_message_sequence bigint;
  next_event_sequence bigint;
  completed_count bigint;
  running_count bigint;
  retry_wait_count bigint;
  blocked_count bigint;
  total_count bigint;
  completed_weight bigint;
  total_weight bigint;
  expected_chunk_count bigint;
  expected_state text;
  expected_duration_class text;
  expected_source_binding_digest text;
  study_status text;
  audit_event_type text;
  committed_at timestamptz := clock_timestamp();
  study_record jsonb;
  reference_record jsonb;
  result_json jsonb;
  receipt_json jsonb;
begin
  if p_contract_version <> 'edit-reference-domain-command-v2'
    or jsonb_typeof(p_command) <> 'object'
    or p_command->>'schemaVersion' <> 'edit-reference-domain-command-v2'
    or p_idempotency_key_hash_sha256 !~ '^[a-f0-9]{64}$'
    or p_request_hash_sha256 !~ '^[a-f0-9]{64}$'
  then
    raise exception using
      errcode = '22023', message = 'REEDITPRO_LONG_FORM_DOMAIN_COMMAND_INVALID';
  end if;

  operation_name := p_command->>'operation';
  if operation_name not in (
    'preference_study.long_form_study.start',
    'preference_study.long_form_study.control.pause',
    'preference_study.long_form_study.control.resume',
    'preference_study.long_form_study.control.cancel',
    'preference_study.long_form_study.control.recover'
  ) then
    raise exception using
      errcode = '22023', message = 'REEDITPRO_LONG_FORM_DOMAIN_OPERATION_INVALID';
  end if;

  request_json := p_command->'request';
  input_json := request_json->'input';
  prepared_json := request_json->'prepared';
  summary_json := prepared_json->'summary';
  media_metadata_json := prepared_json->'mediaMetadata';
  message_json := prepared_json->'assistantMessage';
  if jsonb_typeof(request_json) <> 'object'
    or jsonb_typeof(input_json) <> 'object'
    or jsonb_typeof(prepared_json) <> 'object'
    or jsonb_typeof(summary_json) <> 'object'
    or jsonb_typeof(media_metadata_json) <> 'object'
    or jsonb_typeof(message_json) <> 'object'
    or input_json->>'workspaceId' !~ '^[a-f0-9-]{36}$'
    or request_json->>'studyId' !~ '^[a-f0-9-]{36}$'
    or request_json->>'referenceAssetId' !~ '^[a-f0-9-]{36}$'
    or (input_json->>'expectedStudyRevision') !~ '^[1-9][0-9]*$'
  then
    raise exception using
      errcode = '22023', message = 'REEDITPRO_LONG_FORM_DOMAIN_COMMAND_SHAPE_INVALID';
  end if;

  workspace_uuid := (input_json->>'workspaceId')::uuid;
  study_uuid := (request_json->>'studyId')::uuid;
  reference_asset_uuid := (request_json->>'referenceAssetId')::uuid;
  expected_study_revision := (input_json->>'expectedStudyRevision')::bigint;
  action_name := case
    when operation_name = 'preference_study.long_form_study.start' then 'start'
    else replace(operation_name, 'preference_study.long_form_study.control.', '')
  end;

  if not exists (
    select 1
    from public.workspace_members member
    where member.workspace_id = workspace_uuid
      and member.user_id = p_actor_user_id
      and member.role in ('owner', 'admin', 'editor')
  ) then
    raise exception using
      errcode = '42501', message = 'REEDITPRO_DOMAIN_WRITE_DENIED';
  end if;

  select * into domain_state
  from public.edit_reference_domain_states state
  where state.workspace_id = workspace_uuid
    and state.owner_user_id = p_actor_user_id
  for update;
  if not found then
    raise exception using
      errcode = '55000', message = 'REEDITPRO_DOMAIN_STATE_MISSING';
  end if;

  select * into existing_receipt
  from public.edit_reference_domain_idempotency_receipts receipt
  where receipt.workspace_id = workspace_uuid
    and receipt.actor_user_id = p_actor_user_id
    and receipt.idempotency_key_hash_sha256 = p_idempotency_key_hash_sha256;
  if found then
    if existing_receipt.operation <> operation_name
      or existing_receipt.request_hash_sha256 <> p_request_hash_sha256
    then
      raise exception using
        errcode = '23505', message = 'REEDITPRO_IDEMPOTENCY_CONFLICT';
    end if;
    return next jsonb_build_object(
      'aggregate', public.reeditpro_build_edit_reference_domain_aggregate_v2(
        p_actor_user_id,
        workspace_uuid
      ),
      'auditEvents', public.reeditpro_read_edit_reference_domain_audit_events(
        p_actor_user_id,
        workspace_uuid
      ),
      'receipt', existing_receipt.receipt_json,
      'replayed', true
    );
    return;
  end if;

  select * into study_row
  from public.preference_study_sessions study
  where study.id = study_uuid
    and study.workspace_id = workspace_uuid
  for update;
  if not found then
    raise exception using
      errcode = 'P0002', message = 'REEDITPRO_STUDY_NOT_FOUND';
  end if;
  if study_row.revision <> expected_study_revision then
    raise exception using
      errcode = '40001', message = 'REEDITPRO_STUDY_REVISION_CONFLICT';
  end if;

  select * into reference_row
  from public.edit_references reference
  where reference.id = study_row.edit_reference_id
    and reference.workspace_id = workspace_uuid
    and reference.owner_user_id = p_actor_user_id
  for update;
  if not found then
    raise exception using
      errcode = '42501', message = 'REEDITPRO_DOMAIN_WRITE_DENIED';
  end if;
  reference_uuid := reference_row.id;
  if reference_row.status = 'archived' or study_row.status = 'archived' then
    raise exception using
      errcode = '22023', message = 'REEDITPRO_STUDY_ARCHIVED';
  end if;

  select * into reference_asset_row
  from public.preference_evidence_assets asset
  where asset.id = reference_asset_uuid
    and asset.study_session_id = study_uuid
    and asset.edit_reference_id = reference_uuid
    and asset.workspace_id = workspace_uuid
  for update;
  if not found
    or reference_asset_row.storage_object_record_id is null
    or reference_asset_row.media_asset_id is null
    or reference_asset_row.record_json->>'assetKind' <> 'reference_video_metadata'
  then
    raise exception using
      errcode = '22023', message = 'REEDITPRO_LONG_FORM_REFERENCE_ASSET_INVALID';
  end if;

  select * into source_asset_row
  from public.preference_assets source
  where source.id = reference_asset_uuid
    and source.study_session_id = study_uuid
    and source.edit_reference_id = reference_uuid
    and source.workspace_id = workspace_uuid
    and source.asset_kind = 'source';
  if not found
    or source_asset_row.source_registration_committed_at is null
    or source_asset_row.metadata_json->>'sourceStorageObjectRecordId'
      <> reference_asset_row.storage_object_record_id
    or source_asset_row.metadata_json->>'sourceMediaAssetId'
      <> reference_asset_row.media_asset_id
  then
    raise exception using
      errcode = '22023', message = 'REEDITPRO_LONG_FORM_SOURCE_REGISTRATION_INVALID';
  end if;

  select plan.* into plan_row
  from public.preference_long_form_study_plans plan
  where plan.workspace_id = workspace_uuid
    and plan.edit_reference_id = reference_uuid
    and plan.study_session_id = study_uuid
    and plan.source_asset_id = reference_asset_uuid
    and plan.external_plan_id = summary_json->>'planId';
  if not found then
    raise exception using
      errcode = '22023', message = 'REEDITPRO_LONG_FORM_PLAN_BINDING_INVALID';
  end if;

  select run.* into run_row
  from public.preference_long_form_study_runs run
  where run.workspace_id = workspace_uuid
    and run.edit_reference_id = reference_uuid
    and run.study_session_id = study_uuid
    and run.study_plan_id = plan_row.id
    and run.external_run_id = summary_json->>'runId'
  for update;
  if not found then
    raise exception using
      errcode = '22023', message = 'REEDITPRO_LONG_FORM_RUN_BINDING_INVALID';
  end if;

  select
    count(*) filter (where work.required),
    count(*) filter (where work.required and work.status = 'completed'),
    count(*) filter (where work.required and work.status in ('leased', 'running')),
    count(*) filter (where work.required and work.status = 'retry_wait'),
    count(*) filter (where work.required and work.status in ('blocked', 'failed')),
    coalesce(sum(work.weight_basis_points) filter (where work.required), 0),
    coalesce(sum(work.weight_basis_points)
      filter (where work.required and work.status = 'completed'), 0)
  into total_count, completed_count, running_count, retry_wait_count,
    blocked_count, total_weight, completed_weight
  from public.preference_long_form_study_work_items work
  where work.study_run_id = run_row.id;

  expected_state := case
    when run_row.status = 'queued' and completed_count > 0 then 'running'
    when run_row.status = 'failed' then 'needs_operator_review'
    else run_row.status
  end;
  expected_duration_class := case
    when plan_row.source_duration_milliseconds <= 900000 then 'short'
    when plan_row.source_duration_milliseconds <= 3600000 then 'standard'
    when plan_row.source_duration_milliseconds <= 10800000 then 'long'
    else 'extended'
  end;
  expected_chunk_count := case
    when plan_row.source_duration_milliseconds <= 900000 then 1
    else ceil(plan_row.source_duration_milliseconds::numeric / 600000)::bigint
  end;
  expected_source_binding_digest := public.reeditpro_sha256_json(
    jsonb_build_object(
      'referenceAssetId', reference_asset_uuid::text,
      'workspaceId', workspace_uuid::text,
      'editReferenceId', reference_uuid::text,
      'studySessionId', study_uuid::text,
      'privateMediaArtifactId',
        plan_row.plan_json->'identity'->>'sourcePrivateMediaArtifactId',
      'mediaChecksumSha256', plan_row.source_checksum_sha256,
      'sourceSizeBytes', plan_row.source_size_bytes,
      'sourceDurationSeconds',
        to_jsonb(plan_row.source_duration_milliseconds::double precision / 1000),
      'sourceMimeType', plan_row.source_mime_type,
      'planId', plan_row.external_plan_id,
      'planDigestSha256', plan_row.plan_digest
    )
  );

  if not (summary_json ?& array[
      'schemaVersion', 'runId', 'runRevision', 'planId', 'planDigestSha256',
      'sourceBindingDigestSha256', 'referenceAssetId', 'state',
      'durationClass', 'sourceDurationSeconds', 'sourceSizeBytes',
      'sourceHasAudio', 'chunkCount', 'completedWorkItemCount',
      'totalWorkItemCount', 'runningWorkItemCount', 'retryWaitWorkItemCount',
      'blockedWorkItemCount', 'progressPercent', 'temporalCoverageRatio',
      'fullyStudied', 'phaseLabel', 'etaLowerRemainingSeconds',
      'etaUpperRemainingSeconds', 'etaConfidence', 'operatorReviewRequired',
      'controls', 'originalRemainsImmutable', 'analysisProxyProfile',
      'fullTemporalCoverageRequired', 'globalReconciliationRequired',
      'coverageQaRequired', 'providerCallMade', 'customerPriceCalculated',
      'customerCreditsMutated', 'remoteMutationMade', 'updatedAt'
    ])
    or summary_json->>'schemaVersion'
      <> 'edit-reference-long-form-study-summary-v1'
    or summary_json->>'referenceAssetId' <> reference_asset_uuid::text
    or prepared_json->>'referenceAssetId' <> reference_asset_uuid::text
    or prepared_json->>'referenceId' <> reference_uuid::text
    or summary_json->>'planDigestSha256' <> plan_row.plan_digest
    or summary_json->>'sourceBindingDigestSha256'
      <> expected_source_binding_digest
    or (summary_json->>'runRevision')::bigint <> run_row.revision
    or summary_json->>'state' <> expected_state
    or summary_json->>'durationClass' <> expected_duration_class
    or (summary_json->>'sourceDurationSeconds')::numeric
      <> plan_row.source_duration_milliseconds::numeric / 1000
    or (summary_json->>'sourceSizeBytes')::bigint <> plan_row.source_size_bytes
    or (summary_json->>'sourceHasAudio')::boolean
      <> (plan_row.plan_json->'identity'->>'sourceHasAudio')::boolean
    or (summary_json->>'chunkCount')::bigint <> expected_chunk_count
    or (summary_json->>'completedWorkItemCount')::bigint <> completed_count
    or (summary_json->>'totalWorkItemCount')::bigint <> total_count
    or (summary_json->>'runningWorkItemCount')::bigint <> running_count
    or (summary_json->>'retryWaitWorkItemCount')::bigint <> retry_wait_count
    or (summary_json->>'blockedWorkItemCount')::bigint <> blocked_count
    or (summary_json->>'progressPercent')::numeric
      <> round((case when total_weight = 0 then 0
        else completed_weight::numeric * 100 / total_weight end), 2)
    or (summary_json->>'temporalCoverageRatio')::numeric not between 0 and 1
    or (summary_json->>'fullyStudied')::boolean
      <> (expected_state = 'completed' and completed_count = total_count)
    or length(btrim(summary_json->>'phaseLabel')) not between 1 and 160
    or (summary_json->>'etaLowerRemainingSeconds')::bigint < 0
    or (summary_json->>'etaUpperRemainingSeconds')::bigint
      < (summary_json->>'etaLowerRemainingSeconds')::bigint
    or summary_json->>'etaConfidence'
      not in ('planning', 'observed_low', 'observed_medium')
    or (summary_json->>'operatorReviewRequired')::boolean
      <> (expected_state = 'needs_operator_review')
    or summary_json->>'analysisProxyProfile' <> 'reeditpro-analysis-proxy-v1'
    or coalesce((summary_json->>'originalRemainsImmutable')::boolean, false)
      is not true
    or coalesce((summary_json->>'fullTemporalCoverageRequired')::boolean, false)
      is not true
    or coalesce((summary_json->>'globalReconciliationRequired')::boolean, false)
      is not true
    or coalesce((summary_json->>'coverageQaRequired')::boolean, false)
      is not true
    or coalesce((summary_json->>'providerCallMade')::boolean, true)
    or coalesce((summary_json->>'customerPriceCalculated')::boolean, true)
    or coalesce((summary_json->>'customerCreditsMutated')::boolean, true)
    or coalesce((summary_json->>'remoteMutationMade')::boolean, true)
    or summary_json->>'updatedAt'
      <> public.reeditpro_iso_timestamp(run_row.updated_at)
    or jsonb_typeof(summary_json->'controls') <> 'object'
    or (summary_json->'controls'->>'canPause')::boolean
      <> (expected_state in ('queued', 'running'))
    or (summary_json->'controls'->>'canResume')::boolean
      <> (expected_state = 'paused')
    or (summary_json->'controls'->>'canCancel')::boolean
      <> (expected_state in ('queued', 'running', 'paused', 'needs_operator_review'))
    or (summary_json->'controls'->>'canRecover')::boolean
      <> (expected_state = 'needs_operator_review')
    or coalesce((summary_json->'controls'->>'pauseCompletesCurrentBoundedStep')::boolean, false)
      is not true
    or coalesce((summary_json->'controls'->>'completedCheckpointsPreserved')::boolean, false)
      is not true
    or media_metadata_json->>'orientation'
      not in ('portrait', 'landscape', 'square', 'unknown')
    or (media_metadata_json->>'durationSeconds')::numeric
      <> plan_row.source_duration_milliseconds::numeric / 1000
    or (media_metadata_json->>'hasAudio')::boolean
      <> (plan_row.plan_json->'identity'->>'sourceHasAudio')::boolean
    or (media_metadata_json ? 'width'
      and (media_metadata_json->>'width')::bigint < 1)
    or (media_metadata_json ? 'height'
      and (media_metadata_json->>'height')::bigint < 1)
  then
    raise exception using
      errcode = '22023', message = 'REEDITPRO_LONG_FORM_PREPARED_PROJECTION_INVALID';
  end if;

  select * into latest_event
  from public.preference_evidence_asset_long_form_events event
  where event.reference_asset_id = reference_asset_uuid
    and event.study_session_id = study_uuid
    and event.edit_reference_id = reference_uuid
    and event.workspace_id = workspace_uuid
  order by event.event_sequence desc
  limit 1
  for update;

  if action_name = 'start' then
    if latest_event.id is not null then
      raise exception using
        errcode = '40001', message = 'REEDITPRO_LONG_FORM_START_STATE_CONFLICT';
    end if;
  else
    if prepared_json->>'action' <> action_name
      or input_json->>'action' <> action_name
      or input_json->>'expectedRunRevision' !~ '^[1-9][0-9]*$'
      or latest_event.id is null
      or latest_event.external_run_id <> run_row.external_run_id
      or (input_json->>'expectedRunRevision')::bigint
        <> (latest_event.summary_json->>'runRevision')::bigint
    then
      raise exception using
        errcode = '40001', message = 'REEDITPRO_LONG_FORM_CONTROL_STATE_CONFLICT';
    end if;
    if jsonb_typeof(prepared_json->'activeWorkFinishesBeforePause') <> 'boolean'
      or jsonb_typeof(prepared_json->'recoveredWorkItemCount') <> 'number'
      or (prepared_json->>'recoveredWorkItemCount')::bigint < 0
    then
      raise exception using
        errcode = '22023', message = 'REEDITPRO_LONG_FORM_CONTROL_RECEIPT_INVALID';
    end if;
  end if;

  select coalesce(max(message.sequence), 0) + 1 into next_message_sequence
  from public.preference_study_messages message
  where message.study_session_id = study_uuid;
  if message_json->>'id' !~ '^[a-f0-9-]{36}$'
    or message_json->>'workspaceId' <> workspace_uuid::text
    or message_json->>'editReferenceId' <> reference_uuid::text
    or message_json->>'studySessionId' <> study_uuid::text
    or message_json->>'role' <> 'assistant'
    or message_json->>'runtimeSource' <> 'deterministic_evidence'
    or (message_json->>'sequence')::bigint <> next_message_sequence
    or length(btrim(message_json->>'content')) not between 1 and 8000
  then
    raise exception using
      errcode = '22023', message = 'REEDITPRO_LONG_FORM_MESSAGE_INVALID';
  end if;
  message_uuid := (message_json->>'id')::uuid;

  next_revision := domain_state.revision + 1;
  next_audit_sequence := domain_state.audit_event_count + 1;
  next_receipt_sequence := domain_state.idempotency_receipt_count + 1;
  select coalesce(max(event.event_sequence), 0) + 1 into next_event_sequence
  from public.preference_evidence_asset_long_form_events event
  where event.reference_asset_id = reference_asset_uuid;
  transaction_uuid := extensions.gen_random_uuid();
  event_uuid := extensions.gen_random_uuid();

  insert into public.preference_study_messages (
    id, workspace_id, edit_reference_id, study_session_id, sequence,
    role, content, content_digest, runtime_source, created_at
  ) values (
    message_uuid, workspace_uuid, reference_uuid, study_uuid,
    next_message_sequence, 'assistant', message_json->>'content',
    encode(extensions.digest(
      convert_to(message_json->>'content', 'UTF8'), 'sha256'
    ), 'hex'),
    'deterministic_evidence', (message_json->>'createdAt')::timestamptz
  );

  insert into public.preference_evidence_asset_long_form_events (
    id, workspace_id, edit_reference_id, study_session_id,
    reference_asset_id, actor_user_id, event_sequence, operation,
    study_run_id, external_run_id, run_revision, summary_json,
    media_metadata_json, assistant_message_id, transaction_id, committed_at
  ) values (
    event_uuid, workspace_uuid, reference_uuid, study_uuid,
    reference_asset_uuid, p_actor_user_id, next_event_sequence, operation_name,
    run_row.id, run_row.external_run_id, run_row.revision, summary_json,
    media_metadata_json, message_uuid, transaction_uuid, committed_at
  );

  study_status := case when action_name = 'cancel'
    then 'needs_user_review' else 'studying' end;
  study_record := jsonb_set(jsonb_set(jsonb_set(
    study_row.record_json,
    '{status}', to_jsonb(study_status)),
    '{revision}', to_jsonb(study_row.revision + 1)),
    '{updatedAt}', to_jsonb(public.reeditpro_iso_timestamp(committed_at))
  );
  update public.preference_study_sessions
  set status = study_status,
      revision = revision + 1,
      record_json = study_record,
      updated_at = committed_at
  where id = study_uuid;

  reference_record := jsonb_set(
    reference_row.record_json,
    '{updatedAt}',
    to_jsonb(public.reeditpro_iso_timestamp(committed_at))
  );
  update public.edit_references
  set record_json = reference_record,
      updated_at = committed_at
  where id = reference_uuid;

  audit_event_type := case when action_name = 'start'
    then 'preference_long_form_study_started'
    else 'preference_long_form_study_' || action_name
  end;
  audit_uuid := extensions.gen_random_uuid();
  insert into public.edit_reference_domain_audit_events (
    id, workspace_id, actor_user_id, sequence, aggregate_revision,
    event_type, edit_reference_id, study_session_id, event_json, created_at
  ) values (
    audit_uuid, workspace_uuid, p_actor_user_id, next_audit_sequence,
    next_revision, audit_event_type, reference_uuid, study_uuid,
    jsonb_build_object(
      'id', audit_uuid::text,
      'sequence', next_audit_sequence,
      'eventType', audit_event_type,
      'actorUserId', p_actor_user_id::text,
      'editReferenceId', reference_uuid::text,
      'studySessionId', study_uuid::text,
      'referenceAssetId', reference_asset_uuid::text,
      'longFormStudyRunId', run_row.external_run_id,
      'longFormStudyRunRevision', run_row.revision,
      'aggregateRevision', next_revision,
      'createdAt', public.reeditpro_iso_timestamp(committed_at)
    ),
    committed_at
  );

  update public.edit_reference_domain_states
  set revision = next_revision,
      audit_event_count = next_audit_sequence,
      idempotency_receipt_count = next_receipt_sequence,
      updated_at = committed_at
  where workspace_id = workspace_uuid
    and owner_user_id = p_actor_user_id;

  result_json := jsonb_build_object(
    'resultKind', 'edit_reference_detail',
    'editReferenceId', reference_uuid::text,
    'studySessionId', study_uuid::text,
    'stableResultIds', jsonb_build_array(
      reference_uuid::text,
      study_uuid::text,
      reference_asset_uuid::text,
      message_uuid::text
    )
  );
  result_json := result_json || jsonb_build_object(
    'resultDigestSha256', public.reeditpro_sha256_json(result_json)
  );
  receipt_uuid := extensions.gen_random_uuid();
  receipt_json := jsonb_build_object(
    'receiptVersion', 'edit-reference-idempotency-receipt-v2',
    'receiptId', receipt_uuid::text,
    'ledgerSequence', next_receipt_sequence,
    'operation', operation_name,
    'idempotencyKeyHashSha256', p_idempotency_key_hash_sha256,
    'requestHashSha256', p_request_hash_sha256,
    'result', result_json,
    'committedRevision', next_revision,
    'completedAt', public.reeditpro_iso_timestamp(committed_at)
  );
  insert into public.edit_reference_domain_idempotency_receipts (
    id, workspace_id, actor_user_id, ledger_sequence, operation,
    idempotency_key_hash_sha256, request_hash_sha256, committed_revision,
    result_json, receipt_json, receipt_digest_sha256, completed_at
  ) values (
    receipt_uuid, workspace_uuid, p_actor_user_id, next_receipt_sequence,
    operation_name, p_idempotency_key_hash_sha256, p_request_hash_sha256,
    next_revision, result_json, receipt_json,
    public.reeditpro_sha256_json(receipt_json), committed_at
  );

  return next jsonb_build_object(
    'aggregate', public.reeditpro_build_edit_reference_domain_aggregate_v2(
      p_actor_user_id,
      workspace_uuid
    ),
    'auditEvents', public.reeditpro_read_edit_reference_domain_audit_events(
      p_actor_user_id,
      workspace_uuid
    ),
    'receipt', receipt_json,
    'replayed', false
  );
end;
$$;

revoke all on function
  public.mutate_edit_reference_long_form_domain_command_v1(
    text, uuid, jsonb, text, text
  )
  from public, anon, authenticated, service_role;
grant execute on function
  public.mutate_edit_reference_long_form_domain_command_v1(
    text, uuid, jsonb, text, text
  )
  to service_role;
