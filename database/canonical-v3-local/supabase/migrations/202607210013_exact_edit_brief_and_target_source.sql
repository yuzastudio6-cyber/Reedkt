-- Canonical V3 local-only exact Edit Brief and target-source authority.
-- This isolated migration never belongs to the blocked raw migration chain.
-- Browser requests enter the existing API; only the request-scoped server
-- runtime may call these loopback/HMAC-bound RPCs with the authenticated JWT.

create table public.exact_edit_brief_versions (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null,
  edit_session_id uuid not null,
  revision_number bigint not null check (revision_number >= 1),
  brief_text text not null check (length(btrim(brief_text)) between 1 and 16000),
  source_storage_object_record_id uuid not null,
  source_media_asset_id uuid not null,
  content_digest_sha256 text not null check (content_digest_sha256 ~ '^[a-f0-9]{64}$'),
  saved_by_user_id uuid not null,
  idempotency_key_hash_sha256 text not null check (
    idempotency_key_hash_sha256 ~ '^[a-f0-9]{64}$'
  ),
  request_hash_sha256 text not null check (request_hash_sha256 ~ '^[a-f0-9]{64}$'),
  transaction_id uuid not null unique,
  created_at timestamptz not null,
  unique (id, edit_session_id, project_id, workspace_id),
  unique (workspace_id, project_id, edit_session_id, revision_number),
  unique (workspace_id, saved_by_user_id, idempotency_key_hash_sha256),
  foreign key (edit_session_id, project_id, workspace_id)
    references public.edit_sessions(id, project_id, workspace_id) on delete restrict,
  foreign key (workspace_id, saved_by_user_id)
    references public.workspace_members(workspace_id, user_id) on delete restrict
);

alter table public.exact_edit_brief_versions enable row level security;
alter table public.exact_edit_brief_versions force row level security;
create policy exact_edit_brief_versions_read_member
  on public.exact_edit_brief_versions
  for select to authenticated
  using (public.reeditpro_is_workspace_member(workspace_id));
revoke all on public.exact_edit_brief_versions
  from public, anon, authenticated, service_role;
grant select on public.exact_edit_brief_versions to authenticated;
create trigger exact_edit_brief_versions_immutable
  before update or delete on public.exact_edit_brief_versions
  for each row execute function public.reeditpro_reject_row_mutation();

create or replace function public.reeditpro_exact_edit_brief_record(
  p_row public.exact_edit_brief_versions
)
returns jsonb
language sql
stable
strict
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'id', p_row.id::text,
    'workspaceId', p_row.workspace_id::text,
    'projectId', p_row.project_id::text,
    'editSessionId', p_row.edit_session_id::text,
    'briefText', p_row.brief_text,
    'sourceStorageObjectRecordId', p_row.source_storage_object_record_id::text,
    'sourceMediaAssetId', p_row.source_media_asset_id::text,
    'revisionNumber', p_row.revision_number,
    'savedByUserId', p_row.saved_by_user_id::text,
    'createdAt', public.reeditpro_iso_timestamp(p_row.created_at),
    'updatedAt', public.reeditpro_iso_timestamp(p_row.created_at),
    'contentDigestSha256', p_row.content_digest_sha256,
    'persistenceAuthority', 'canonical_v3_local_supabase_rls',
    'runtimeSource', 'verified_live',
    'readbackVerified', true,
    'providerCallMade', false,
    'workerJobCreated', false,
    'renderJobCreated', false,
    'creditReservedOrSpent', false,
    'supabaseWriteMade', true,
    'gcsWriteMade', false,
    'remoteMutationMade', false,
    'productReady', false,
    'mockOnly', false
  );
$$;

revoke all on function public.reeditpro_exact_edit_brief_record(
  public.exact_edit_brief_versions
) from public, anon, authenticated, service_role;

create or replace function public.reeditpro_save_exact_edit_brief_v1(
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
  actor_uuid uuid;
  workspace_uuid uuid;
  project_uuid uuid;
  edit_session_uuid uuid;
  source_storage_uuid uuid;
  source_media_uuid uuid;
  idempotency_hash text;
  next_revision bigint;
  brief_uuid uuid;
  transaction_uuid uuid;
  committed_at timestamptz;
  digest_value text;
  existing_row public.exact_edit_brief_versions%rowtype;
  inserted_row public.exact_edit_brief_versions%rowtype;
  disposition_value text;
begin
  if p_contract_version <> 'canonical-distributed-pre-plan-study-state-port-v1'
    or jsonb_typeof(p_request) <> 'object'
    or not (p_request ?& array[
      'ownerUserId', 'workspaceId', 'projectId', 'editSessionId',
      'briefText', 'sourceStorageObjectRecordId', 'sourceMediaAssetId',
      'idempotencyKey', 'requestHash'
    ])
    or (p_request - array[
      'ownerUserId', 'workspaceId', 'projectId', 'editSessionId',
      'briefText', 'sourceStorageObjectRecordId', 'sourceMediaAssetId',
      'idempotencyKey', 'requestHash'
    ]) <> '{}'::jsonb
    or length(btrim(coalesce(p_request->>'briefText', ''))) not between 1 and 16000
    or length(coalesce(p_request->>'idempotencyKey', '')) not between 16 and 240
    or p_request->>'idempotencyKey' !~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]*$'
    or p_request->>'idempotencyKey' like '%..%'
    or coalesce(p_request->>'requestHash', '') !~ '^[a-f0-9]{64}$'
    or p_request->>'requestHash' <>
      public.reeditpro_pre_plan_request_hash('save_exact_edit_brief', p_request)
  then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_BRIEF_SAVE_REQUEST_INVALID';
  end if;

  perform public.reeditpro_pre_plan_assert_local_internal_authority(p_request);
  begin
    actor_uuid := (p_request->>'ownerUserId')::uuid;
    workspace_uuid := (p_request->>'workspaceId')::uuid;
    project_uuid := (p_request->>'projectId')::uuid;
    edit_session_uuid := (p_request->>'editSessionId')::uuid;
    source_storage_uuid := (p_request->>'sourceStorageObjectRecordId')::uuid;
    source_media_uuid := (p_request->>'sourceMediaAssetId')::uuid;
  exception when others then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_BRIEF_SAVE_IDENTITY_INVALID';
  end;
  if auth.uid() is null
    or auth.uid() <> actor_uuid
    or not public.reeditpro_has_workspace_write_access(workspace_uuid)
    or not exists (
      select 1
      from public.projects project_row
      join public.edit_sessions edit_row
        on edit_row.project_id = project_row.id
       and edit_row.workspace_id = project_row.workspace_id
      where project_row.id = project_uuid
        and project_row.workspace_id = workspace_uuid
        and edit_row.id = edit_session_uuid
    )
  then
    raise exception using errcode = '42501', message = 'EXACT_EDIT_BRIEF_SAVE_TENANT_DENIED';
  end if;

  idempotency_hash := public.reeditpro_pre_plan_idempotency_key_hash(
    p_request->>'idempotencyKey'
  );
  perform pg_advisory_xact_lock(hashtextextended(
    workspace_uuid::text || ':' || project_uuid::text || ':' || edit_session_uuid::text,
    0
  ));
  select * into existing_row
  from public.exact_edit_brief_versions brief
  where brief.workspace_id = workspace_uuid
    and brief.saved_by_user_id = actor_uuid
    and brief.idempotency_key_hash_sha256 = idempotency_hash;
  if found then
    if existing_row.request_hash_sha256 <> p_request->>'requestHash'
      or existing_row.project_id <> project_uuid
      or existing_row.edit_session_id <> edit_session_uuid
    then
      raise exception using errcode = '23505', message = 'EXACT_EDIT_BRIEF_SAVE_IDEMPOTENCY_CONFLICT';
    end if;
    inserted_row := existing_row;
    disposition_value := 'idempotent_replay';
  else
    select coalesce(max(brief.revision_number), 0) + 1
      into next_revision
    from public.exact_edit_brief_versions brief
    where brief.workspace_id = workspace_uuid
      and brief.project_id = project_uuid
      and brief.edit_session_id = edit_session_uuid;
    brief_uuid := extensions.gen_random_uuid();
    transaction_uuid := extensions.gen_random_uuid();
    committed_at := clock_timestamp();
    digest_value := public.reeditpro_sha256_json(jsonb_build_object(
      'editBriefId', brief_uuid::text,
      'workspaceId', workspace_uuid::text,
      'projectId', project_uuid::text,
      'editSessionId', edit_session_uuid::text,
      'briefText', btrim(p_request->>'briefText'),
      'sourceStorageObjectRecordId', source_storage_uuid::text,
      'sourceMediaAssetId', source_media_uuid::text,
      'revisionNumber', next_revision,
      'savedByUserId', actor_uuid::text,
      'updatedAt', public.reeditpro_iso_timestamp(committed_at)
    ));
    insert into public.exact_edit_brief_versions (
      id, workspace_id, project_id, edit_session_id, revision_number,
      brief_text, source_storage_object_record_id, source_media_asset_id,
      content_digest_sha256, saved_by_user_id,
      idempotency_key_hash_sha256, request_hash_sha256,
      transaction_id, created_at
    ) values (
      brief_uuid, workspace_uuid, project_uuid, edit_session_uuid, next_revision,
      btrim(p_request->>'briefText'), source_storage_uuid, source_media_uuid,
      digest_value, actor_uuid, idempotency_hash, p_request->>'requestHash',
      transaction_uuid, committed_at
    ) returning * into inserted_row;
    disposition_value := 'inserted';
  end if;

  return jsonb_build_object(
    'schemaVersion', 'canonical-v3-local-exact-edit-brief-save-receipt-v1',
    'disposition', disposition_value,
    'record', public.reeditpro_exact_edit_brief_record(inserted_row),
    'transaction', jsonb_build_object(
      'transactionId', inserted_row.transaction_id::text,
      'committedAt', public.reeditpro_iso_timestamp(inserted_row.created_at)
    ),
    'boundaries', jsonb_build_object(
      'localLoopbackOnly', true,
      'authenticatedRlsVerified', true,
      'browserSuppliedAuthorityAccepted', false,
      'remoteMutationAllowed', false,
      'productionAuthority', false
    )
  );
end;
$$;

create or replace function public.reeditpro_read_exact_edit_brief_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  actor_uuid uuid;
  workspace_uuid uuid;
  project_uuid uuid;
  edit_session_uuid uuid;
  brief_row public.exact_edit_brief_versions%rowtype;
begin
  if p_contract_version <> 'canonical-distributed-pre-plan-study-state-port-v1'
    or jsonb_typeof(p_request) <> 'object'
    or not (p_request ?& array[
      'ownerUserId', 'workspaceId', 'projectId', 'editSessionId',
      'idempotencyKey', 'requestHash'
    ])
    or (p_request - array[
      'ownerUserId', 'workspaceId', 'projectId', 'editSessionId',
      'idempotencyKey', 'requestHash'
    ]) <> '{}'::jsonb
    or length(coalesce(p_request->>'idempotencyKey', '')) not between 16 and 240
    or p_request->>'idempotencyKey' !~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]*$'
    or p_request->>'idempotencyKey' like '%..%'
    or coalesce(p_request->>'requestHash', '') !~ '^[a-f0-9]{64}$'
    or p_request->>'requestHash' <>
      public.reeditpro_pre_plan_request_hash('read_exact_edit_brief', p_request)
  then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_BRIEF_READ_REQUEST_INVALID';
  end if;
  perform public.reeditpro_pre_plan_assert_local_internal_authority(p_request);
  begin
    actor_uuid := (p_request->>'ownerUserId')::uuid;
    workspace_uuid := (p_request->>'workspaceId')::uuid;
    project_uuid := (p_request->>'projectId')::uuid;
    edit_session_uuid := (p_request->>'editSessionId')::uuid;
  exception when others then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_BRIEF_READ_IDENTITY_INVALID';
  end;
  if auth.uid() is null
    or auth.uid() <> actor_uuid
    or not public.reeditpro_is_workspace_member(workspace_uuid)
    or not exists (
      select 1 from public.edit_sessions edit_row
      where edit_row.id = edit_session_uuid
        and edit_row.project_id = project_uuid
        and edit_row.workspace_id = workspace_uuid
    )
  then
    raise exception using errcode = '42501', message = 'EXACT_EDIT_BRIEF_READ_TENANT_DENIED';
  end if;
  select * into brief_row
  from public.exact_edit_brief_versions brief
  where brief.workspace_id = workspace_uuid
    and brief.project_id = project_uuid
    and brief.edit_session_id = edit_session_uuid
  order by brief.revision_number desc
  limit 1;
  return jsonb_build_object(
    'schemaVersion', 'canonical-v3-local-exact-edit-brief-read-receipt-v1',
    'found', found,
    'record', case when found
      then public.reeditpro_exact_edit_brief_record(brief_row)
      else null end,
    'boundaries', jsonb_build_object(
      'localLoopbackOnly', true,
      'authenticatedRlsVerified', true,
      'browserSuppliedAuthorityAccepted', false,
      'remoteMutationAllowed', false,
      'productionAuthority', false
    )
  );
end;
$$;

revoke all on function public.reeditpro_save_exact_edit_brief_v1(text,jsonb)
  from public, anon, service_role;
revoke all on function public.reeditpro_read_exact_edit_brief_v1(text,jsonb)
  from public, anon, service_role;
grant execute on function public.reeditpro_save_exact_edit_brief_v1(text,jsonb)
  to authenticated;
grant execute on function public.reeditpro_read_exact_edit_brief_v1(text,jsonb)
  to authenticated;

-- The existing preference_assets table is the fixed source registry consumed
-- by the one distributed pre-plan queue. Target media receives a distinct,
-- deterministic source id and exact Brief lineage; it is not represented as
-- user preference evidence and no second queue or source registry is created.
create or replace function public.reeditpro_register_target_pre_plan_source_v1(
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
  actor_uuid uuid;
  workspace_uuid uuid;
  project_uuid uuid;
  edit_session_uuid uuid;
  reference_uuid uuid;
  study_uuid uuid;
  brief_uuid uuid;
  source_asset_uuid uuid;
  brief_revision bigint;
  brief_row public.exact_edit_brief_versions%rowtype;
  source_row public.preference_assets%rowtype;
  idempotency_hash text;
  transaction_uuid uuid;
  committed_at timestamptz;
  disposition_value text;
  metadata_value jsonb;
begin
  if p_contract_version <> 'canonical-distributed-pre-plan-study-state-port-v1'
    or jsonb_typeof(p_request) <> 'object'
    or not (p_request ?& array[
      'ownerUserId', 'workspaceId', 'editReferenceId', 'studySessionId',
      'projectId', 'editSessionId', 'editBriefId', 'editBriefRevision',
      'editBriefDigestSha256', 'sourceAssetId',
      'sourcePrivateMediaArtifactId', 'sourceStorageObjectRecordId',
      'sourceMediaAssetId', 'sourceStorageObjectId', 'sourceStorageGeneration',
      'sourceStorageEtag', 'sourceChecksumSha256', 'sourceSizeBytes',
      'sourceDurationMilliseconds', 'sourceMimeType', 'sourceHasAudio',
      'idempotencyKey', 'requestedAt', 'requestHash'
    ])
    or (p_request - array[
      'ownerUserId', 'workspaceId', 'editReferenceId', 'studySessionId',
      'projectId', 'editSessionId', 'editBriefId', 'editBriefRevision',
      'editBriefDigestSha256', 'sourceAssetId',
      'sourcePrivateMediaArtifactId', 'sourceStorageObjectRecordId',
      'sourceMediaAssetId', 'sourceStorageObjectId', 'sourceStorageGeneration',
      'sourceStorageEtag', 'sourceChecksumSha256', 'sourceSizeBytes',
      'sourceDurationMilliseconds', 'sourceMimeType', 'sourceHasAudio',
      'idempotencyKey', 'requestedAt', 'requestHash'
    ]) <> '{}'::jsonb
    or coalesce(p_request->>'sourcePrivateMediaArtifactId', '')
      <> coalesce(p_request->>'sourceStorageObjectRecordId', '')
    or length(coalesce(p_request->>'sourceStorageObjectId', '')) not between 1 and 500
    or p_request->>'sourceStorageObjectId' like '%..%'
    or p_request->>'sourceStorageObjectId' like '%://%'
    or p_request->>'sourceStorageObjectId' like '%?%'
    or p_request->>'sourceStorageObjectId' like '%#%'
    or length(coalesce(p_request->>'sourceStorageGeneration', '')) not between 1 and 160
    or length(coalesce(p_request->>'sourceStorageEtag', '')) not between 1 and 240
    or coalesce(p_request->>'editBriefDigestSha256', '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'sourceChecksumSha256', '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'sourceSizeBytes', '') !~ '^[1-9][0-9]*$'
    or (p_request->>'sourceSizeBytes')::numeric > 1099511627776
    or coalesce(p_request->>'sourceDurationMilliseconds', '') !~ '^[1-9][0-9]*$'
    or (p_request->>'sourceDurationMilliseconds')::numeric > 2592000000
    or coalesce(p_request->>'sourceMimeType', '') !~ '^video/[A-Za-z0-9.+-]{1,120}$'
    or jsonb_typeof(p_request->'sourceHasAudio') <> 'boolean'
    or length(coalesce(p_request->>'idempotencyKey', '')) not between 16 and 240
    or p_request->>'idempotencyKey' !~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]*$'
    or p_request->>'idempotencyKey' like '%..%'
    or coalesce(p_request->>'requestHash', '') !~ '^[a-f0-9]{64}$'
    or p_request->>'requestHash' <>
      public.reeditpro_pre_plan_request_hash('register_target_source', p_request)
  then
    raise exception using errcode = '22023', message = 'TARGET_PRE_PLAN_SOURCE_REQUEST_INVALID';
  end if;
  perform public.reeditpro_pre_plan_assert_local_internal_authority(p_request);
  begin
    actor_uuid := (p_request->>'ownerUserId')::uuid;
    workspace_uuid := (p_request->>'workspaceId')::uuid;
    reference_uuid := (p_request->>'editReferenceId')::uuid;
    study_uuid := (p_request->>'studySessionId')::uuid;
    project_uuid := (p_request->>'projectId')::uuid;
    edit_session_uuid := (p_request->>'editSessionId')::uuid;
    brief_uuid := (p_request->>'editBriefId')::uuid;
    brief_revision := (p_request->>'editBriefRevision')::bigint;
    source_asset_uuid := (p_request->>'sourceAssetId')::uuid;
    perform (p_request->>'sourceStorageObjectRecordId')::uuid;
    perform (p_request->>'sourceMediaAssetId')::uuid;
    perform (p_request->>'requestedAt')::timestamptz;
  exception when others then
    raise exception using errcode = '22023', message = 'TARGET_PRE_PLAN_SOURCE_IDENTITY_INVALID';
  end;
  if auth.uid() is null
    or auth.uid() <> actor_uuid
    or not public.reeditpro_has_workspace_write_access(workspace_uuid)
    or not exists (
      select 1 from public.edit_references reference
      where reference.id = reference_uuid
        and reference.workspace_id = workspace_uuid
        and reference.owner_user_id = actor_uuid
    )
    or not exists (
      select 1 from public.preference_study_sessions study
      where study.id = study_uuid
        and study.edit_reference_id = reference_uuid
        and study.workspace_id = workspace_uuid
    )
  then
    raise exception using errcode = '42501', message = 'TARGET_PRE_PLAN_SOURCE_TENANT_DENIED';
  end if;
  select * into strict brief_row
  from public.exact_edit_brief_versions brief
  where brief.id = brief_uuid
    and brief.workspace_id = workspace_uuid
    and brief.project_id = project_uuid
    and brief.edit_session_id = edit_session_uuid;
  if brief_row.revision_number <> brief_revision
    or brief_row.content_digest_sha256 <> p_request->>'editBriefDigestSha256'
    or brief_row.source_storage_object_record_id::text
      <> p_request->>'sourceStorageObjectRecordId'
    or brief_row.source_media_asset_id::text <> p_request->>'sourceMediaAssetId'
  then
    raise exception using errcode = '40001', message = 'TARGET_PRE_PLAN_SOURCE_BRIEF_CHANGED';
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
    raise exception using errcode = '23505', message = 'TARGET_PRE_PLAN_SOURCE_IDEMPOTENCY_CONFLICT';
  end if;
  if not found then
    if exists (select 1 from public.preference_assets where id = source_asset_uuid) then
      raise exception using errcode = '23505', message = 'TARGET_PRE_PLAN_SOURCE_IDENTITY_CONFLICT';
    end if;
    transaction_uuid := extensions.gen_random_uuid();
    committed_at := clock_timestamp();
    metadata_value := jsonb_build_object(
      'sourceAuthority', 'target_source_media',
      'sourcePrivateMediaArtifactId', p_request->>'sourcePrivateMediaArtifactId',
      'sourceStorageObjectRecordId', p_request->>'sourceStorageObjectRecordId',
      'sourceMediaAssetId', p_request->>'sourceMediaAssetId',
      'projectId', project_uuid::text,
      'editSessionId', edit_session_uuid::text,
      'editBriefId', brief_uuid::text,
      'editBriefRevision', brief_revision,
      'editBriefDigestSha256', brief_row.content_digest_sha256,
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
      p_request->>'sourceStorageObjectId', p_request->>'sourceStorageGeneration',
      p_request->>'sourceStorageEtag', p_request->>'sourceChecksumSha256',
      'source', metadata_value, actor_uuid, idempotency_hash,
      p_request->>'requestHash', transaction_uuid, committed_at, committed_at
    ) returning * into source_row;
    disposition_value := 'inserted';
  else
    if source_row.edit_reference_id <> reference_uuid
      or source_row.study_session_id <> study_uuid
      or source_row.storage_object_id <> p_request->>'sourceStorageObjectId'
      or source_row.storage_generation <> p_request->>'sourceStorageGeneration'
      or source_row.storage_etag <> p_request->>'sourceStorageEtag'
      or source_row.checksum_sha256 <> p_request->>'sourceChecksumSha256'
      or source_row.asset_kind <> 'source'
      or source_row.metadata_json->>'sourceAuthority' <> 'target_source_media'
      or source_row.metadata_json->>'projectId' <> project_uuid::text
      or source_row.metadata_json->>'editSessionId' <> edit_session_uuid::text
      or source_row.metadata_json->>'editBriefId' <> brief_uuid::text
      or (source_row.metadata_json->>'editBriefRevision')::bigint <> brief_revision
      or source_row.metadata_json->>'editBriefDigestSha256'
        <> brief_row.content_digest_sha256
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
      raise exception using errcode = '23505', message = 'TARGET_PRE_PLAN_SOURCE_REPLAY_CONFLICT';
    end if;
    disposition_value := 'idempotent_replay';
  end if;

  return jsonb_build_object(
    'schemaVersion', 'canonical-v3-local-target-source-registration-receipt-v1',
    'sourceAssetId', source_row.id::text,
    'status', 'registered',
    'disposition', disposition_value,
    'transaction', jsonb_build_object(
      'transactionId', source_row.source_registration_transaction_id::text,
      'committedAt', public.reeditpro_iso_timestamp(
        source_row.source_registration_committed_at
      ),
      'authenticatedRlsVerified', true,
      'databaseTransactionVerified', true,
      'exactEditBriefLineageVerified', true
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
    raise exception using errcode = '42501', message = 'TARGET_PRE_PLAN_SOURCE_BRIEF_INVALID';
end;
$$;

revoke all on function public.reeditpro_register_target_pre_plan_source_v1(text,jsonb)
  from public, anon, service_role;
grant execute on function public.reeditpro_register_target_pre_plan_source_v1(text,jsonb)
  to authenticated;
