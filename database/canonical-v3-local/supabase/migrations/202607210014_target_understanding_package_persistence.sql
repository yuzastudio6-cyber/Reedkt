-- Canonical V3 local-only target-video understanding package persistence.
-- The existing immutable package table remains the single package authority.
-- This forward migration appends resumable package revisions through a
-- request-scoped authenticated/HMAC RPC and never reads raw media, invokes a
-- provider, creates a worker, prices a customer, or targets a remote project.

alter table public.edit_reference_target_understanding_packages
  drop constraint edit_reference_target_understanding_packages_status_check,
  add constraint edit_reference_target_understanding_packages_status_check check (
    status in (
      'collecting', 'needs_operator_review', 'review_required', 'ready',
      'cancelled', 'stale', 'blocked'
    )
  ),
  drop constraint edit_reference_target_understanding_packag_runtime_source_check,
  add constraint target_understanding_package_runtime_source_check check (
    runtime_source in ('verified_local', 'verified_live')
  ),
  add column persistence_contract_version text,
  add column saved_by_user_id uuid,
  add column idempotency_key_hash_sha256 text,
  add column request_hash_sha256 text,
  add column transaction_id uuid,
  add column canonical_run_id text,
  add column canonical_run_revision bigint;

alter table public.edit_reference_target_understanding_packages
  add constraint edit_reference_target_package_saved_by_fk
    foreign key (workspace_id, saved_by_user_id)
      references public.workspace_members(workspace_id, user_id) on delete restrict,
  add constraint edit_reference_target_package_idempotency_hash_check check (
    idempotency_key_hash_sha256 is null
      or idempotency_key_hash_sha256 ~ '^[a-f0-9]{64}$'
  ),
  add constraint edit_reference_target_package_request_hash_check check (
    request_hash_sha256 is null or request_hash_sha256 ~ '^[a-f0-9]{64}$'
  ),
  add constraint edit_reference_target_package_run_revision_check check (
    canonical_run_revision is null or canonical_run_revision >= 0
  );

create unique index edit_reference_target_package_actor_idempotency
  on public.edit_reference_target_understanding_packages(
    workspace_id, saved_by_user_id, idempotency_key_hash_sha256
  )
  where saved_by_user_id is not null
    and idempotency_key_hash_sha256 is not null;
create unique index edit_reference_target_package_transaction
  on public.edit_reference_target_understanding_packages(transaction_id)
  where transaction_id is not null;
create index edit_reference_target_package_latest_binding
  on public.edit_reference_target_understanding_packages(
    workspace_id, project_id, edit_session_id, edit_reference_id,
    study_session_id, source_storage_object_record_id,
    edit_brief_digest_sha256, canonical_run_revision desc, created_at desc
  )
  where persistence_contract_version =
    'canonical-v3-local-target-understanding-package-persistence-v1';

create or replace function public.reeditpro_target_understanding_package_uuid(
  p_package jsonb
)
returns uuid
language plpgsql
immutable
strict
set search_path = pg_catalog, public
as $$
declare digest_value text;
begin
  digest_value := public.reeditpro_sha256_json(jsonb_build_object(
    'domain', 'target_video_understanding_package_v1',
    'workspaceId', p_package->>'workspaceId',
    'projectId', p_package->>'projectId',
    'editSessionId', p_package->>'editSessionId',
    'sourceStorageObjectRecordId',
      p_package->'source'->>'storageObjectRecordId',
    'mediaChecksumSha256', p_package->'source'->>'checksumSha256',
    'planDigestSha256', p_package->'study'->>'planDigestSha256',
    'runRevision', (p_package->'study'->>'runRevision')::bigint,
    'contextDigestSha256',
      p_package->'declaredContext'->>'contextDigestSha256'
  ));
  return (
    substr(digest_value, 1, 8) || '-' ||
    substr(digest_value, 9, 4) || '-4' ||
    substr(digest_value, 14, 3) || '-a' ||
    substr(digest_value, 18, 3) || '-' ||
    substr(digest_value, 21, 12)
  )::uuid;
end;
$$;

revoke all on function public.reeditpro_target_understanding_package_uuid(jsonb)
  from public, anon, authenticated, service_role;

create or replace function public.reeditpro_target_package_boundaries()
returns jsonb
language sql
immutable
set search_path = pg_catalog
as $$
  select jsonb_build_object(
    'localLoopbackOnly', true,
    'authenticatedRlsVerified', true,
    'exactTargetSourceAndBriefLineageVerified', true,
    'canonicalPrePlanRunLineageVerified', true,
    'browserSuppliedAuthorityAccepted', false,
    'rawMediaTranscriptFrameOrProviderPayloadPersisted', false,
    'remoteMutationAllowed', false,
    'productionAuthority', false
  );
$$;

revoke all on function public.reeditpro_target_package_boundaries()
  from public, anon, authenticated, service_role;

create or replace function public.reeditpro_save_target_understanding_package_v1(
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
  package_uuid uuid;
  source_storage_uuid uuid;
  source_media_uuid uuid;
  brief_uuid uuid;
  brief_revision bigint;
  run_revision bigint;
  source_asset_uuid uuid;
  idempotency_hash text;
  runtime_source_value text;
  transaction_uuid uuid;
  committed_at timestamptz;
  package_value jsonb;
  existing_row public.edit_reference_target_understanding_packages%rowtype;
  inserted_row public.edit_reference_target_understanding_packages%rowtype;
  brief_row public.exact_edit_brief_versions%rowtype;
  run_row public.preference_long_form_study_runs%rowtype;
  plan_row public.preference_long_form_study_plans%rowtype;
  disposition_value text;
begin
  package_value := p_request->'package';
  if p_contract_version <> 'canonical-distributed-pre-plan-study-state-port-v1'
    or jsonb_typeof(p_request) <> 'object'
    or not (p_request ?& array[
      'ownerUserId', 'package', 'idempotencyKey', 'requestHash'
    ])
    or (p_request - array[
      'ownerUserId', 'package', 'idempotencyKey', 'requestHash'
    ]) <> '{}'::jsonb
    or jsonb_typeof(package_value) <> 'object'
    or pg_column_size(package_value) > 4194304
    or not (package_value ?& array[
      'schemaVersion', 'packageId', 'workspaceId', 'projectId',
      'editSessionId', 'editReferenceId', 'studySessionId', 'status',
      'source', 'declaredContext', 'study', 'runtimeProvenance',
      'readyForPreferenceApplication', 'rawTranscriptPersisted',
      'rawFrameBytesPersisted', 'rawProviderPayloadPersisted',
      'signedUrlPersisted', 'localFilePathPersisted',
      'customerPriceCalculated', 'customerCreditsMutated',
      'serviceFeeIncluded', 'remoteMutationMade', 'createdAt', 'updatedAt',
      'packageDigestSha256'
    ])
    or package_value->>'schemaVersion'
      <> 'edit-reference-target-video-understanding-package-v1'
    or package_value->>'status' not in (
      'collecting', 'needs_operator_review', 'review_required', 'ready',
      'cancelled'
    )
    or jsonb_typeof(package_value->'source') <> 'object'
    or jsonb_typeof(package_value->'declaredContext') <> 'object'
    or jsonb_typeof(package_value->'study') <> 'object'
    or jsonb_typeof(package_value->'runtimeProvenance') <> 'object'
    or jsonb_typeof(package_value->'readyForPreferenceApplication') <> 'boolean'
    or jsonb_typeof(package_value->'rawTranscriptPersisted') <> 'boolean'
    or jsonb_typeof(package_value->'rawFrameBytesPersisted') <> 'boolean'
    or jsonb_typeof(package_value->'rawProviderPayloadPersisted') <> 'boolean'
    or jsonb_typeof(package_value->'signedUrlPersisted') <> 'boolean'
    or jsonb_typeof(package_value->'localFilePathPersisted') <> 'boolean'
    or jsonb_typeof(package_value->'customerPriceCalculated') <> 'boolean'
    or jsonb_typeof(package_value->'customerCreditsMutated') <> 'boolean'
    or jsonb_typeof(package_value->'serviceFeeIncluded') <> 'boolean'
    or jsonb_typeof(package_value->'remoteMutationMade') <> 'boolean'
    or (package_value->>'rawTranscriptPersisted')::boolean is not false
    or (package_value->>'rawFrameBytesPersisted')::boolean is not false
    or (package_value->>'rawProviderPayloadPersisted')::boolean is not false
    or (package_value->>'signedUrlPersisted')::boolean is not false
    or (package_value->>'localFilePathPersisted')::boolean is not false
    or (package_value->>'customerPriceCalculated')::boolean is not false
    or (package_value->>'customerCreditsMutated')::boolean is not false
    or (package_value->>'serviceFeeIncluded')::boolean is not false
    or (package_value->>'remoteMutationMade')::boolean is not false
    or length(coalesce(p_request->>'idempotencyKey', '')) not between 16 and 240
    or p_request->>'idempotencyKey' !~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]*$'
    or p_request->>'idempotencyKey' like '%..%'
    or coalesce(p_request->>'requestHash', '') !~ '^[a-f0-9]{64}$'
    or p_request->>'requestHash' <>
      public.reeditpro_pre_plan_request_hash(
        'save_target_understanding_package', p_request
      )
    or coalesce(package_value->>'packageDigestSha256', '')
      !~ '^[a-f0-9]{64}$'
    or package_value->>'packageDigestSha256' <>
      public.reeditpro_sha256_json(
        package_value - 'packageDigestSha256'::text
      )
    or coalesce(
      package_value->'declaredContext'->>'contextDigestSha256', ''
    ) !~ '^[a-f0-9]{64}$'
    or package_value->'declaredContext'->>'contextDigestSha256' <>
      public.reeditpro_sha256_json(
        (package_value->'declaredContext') - 'contextDigestSha256'::text
      )
  then
    raise exception using errcode = '22023',
      message = 'TARGET_UNDERSTANDING_PACKAGE_REQUEST_INVALID';
  end if;
  perform public.reeditpro_pre_plan_assert_local_internal_authority(p_request);
  begin
    actor_uuid := (p_request->>'ownerUserId')::uuid;
    workspace_uuid := (package_value->>'workspaceId')::uuid;
    project_uuid := (package_value->>'projectId')::uuid;
    edit_session_uuid := (package_value->>'editSessionId')::uuid;
    reference_uuid := (package_value->>'editReferenceId')::uuid;
    study_uuid := (package_value->>'studySessionId')::uuid;
    package_uuid := (package_value->>'packageId')::uuid;
    source_storage_uuid :=
      (package_value->'source'->>'storageObjectRecordId')::uuid;
    source_media_uuid := (package_value->'source'->>'mediaAssetId')::uuid;
    brief_uuid := (package_value->'declaredContext'->>'editBriefId')::uuid;
    brief_revision :=
      (package_value->'declaredContext'->>'editBriefRevision')::bigint;
    run_revision := (package_value->'study'->>'runRevision')::bigint;
    perform (package_value->>'createdAt')::timestamptz;
    perform (package_value->>'updatedAt')::timestamptz;
  exception when others then
    raise exception using errcode = '22023',
      message = 'TARGET_UNDERSTANDING_PACKAGE_IDENTITY_INVALID';
  end;
  if auth.uid() is null
    or auth.uid() <> actor_uuid
    or not public.reeditpro_has_workspace_write_access(workspace_uuid)
    or package_uuid <>
      public.reeditpro_target_understanding_package_uuid(package_value)
  then
    raise exception using errcode = '42501',
      message = 'TARGET_UNDERSTANDING_PACKAGE_TENANT_OR_IDENTITY_DENIED';
  end if;
  if not exists (
    select 1
    from public.projects project_row
    join public.edit_sessions edit_row
      on edit_row.project_id = project_row.id
      and edit_row.workspace_id = project_row.workspace_id
    join public.edit_references reference_row
      on reference_row.id = reference_uuid
      and reference_row.workspace_id = project_row.workspace_id
    join public.preference_study_sessions study_row
      on study_row.id = study_uuid
      and study_row.edit_reference_id = reference_row.id
      and study_row.workspace_id = reference_row.workspace_id
    where project_row.id = project_uuid
      and project_row.workspace_id = workspace_uuid
      and edit_row.id = edit_session_uuid
      and reference_row.owner_user_id = actor_uuid
      and reference_row.status = 'active'
      and study_row.status not in ('archived', 'failed')
  ) then
    raise exception using errcode = '42501',
      message = 'TARGET_UNDERSTANDING_PACKAGE_EXACT_SCOPE_DENIED';
  end if;

  select * into strict brief_row
  from public.exact_edit_brief_versions brief
  where brief.id = brief_uuid
    and brief.workspace_id = workspace_uuid
    and brief.project_id = project_uuid
    and brief.edit_session_id = edit_session_uuid;
  if brief_row.revision_number <> brief_revision
    or brief_row.content_digest_sha256 <>
      package_value->'declaredContext'->>'editBriefDigestSha256'
    or brief_row.source_storage_object_record_id <> source_storage_uuid
    or brief_row.source_media_asset_id <> source_media_uuid
    or exists (
      select 1 from public.exact_edit_brief_versions newer
      where newer.workspace_id = workspace_uuid
        and newer.project_id = project_uuid
        and newer.edit_session_id = edit_session_uuid
        and newer.revision_number > brief_revision
    )
  then
    raise exception using errcode = '40001',
      message = 'TARGET_UNDERSTANDING_PACKAGE_BRIEF_CHANGED';
  end if;

  select asset.id into strict source_asset_uuid
  from public.preference_assets asset
  where asset.workspace_id = workspace_uuid
    and asset.edit_reference_id = reference_uuid
    and asset.study_session_id = study_uuid
    and asset.asset_kind = 'source'
    and asset.metadata_json->>'sourceAuthority' = 'target_source_media'
    and asset.metadata_json->>'projectId' = project_uuid::text
    and asset.metadata_json->>'editSessionId' = edit_session_uuid::text
    and asset.metadata_json->>'editBriefId' = brief_uuid::text
    and (asset.metadata_json->>'editBriefRevision')::bigint = brief_revision
    and asset.metadata_json->>'editBriefDigestSha256'
      = brief_row.content_digest_sha256
    and asset.metadata_json->>'sourceStorageObjectRecordId'
      = source_storage_uuid::text
    and asset.metadata_json->>'sourceMediaAssetId' = source_media_uuid::text
    and asset.checksum_sha256 = package_value->'source'->>'checksumSha256';

  select run_source.* into strict run_row
  from public.preference_long_form_study_runs run_source
  where run_source.workspace_id = workspace_uuid
    and run_source.edit_reference_id = reference_uuid
    and run_source.study_session_id = study_uuid
    and run_source.external_run_id = package_value->'study'->>'runId'
    and run_source.revision = run_revision;
  select plan_source.* into strict plan_row
  from public.preference_long_form_study_plans plan_source
  where plan_source.id = run_row.study_plan_id
    and plan_source.workspace_id = workspace_uuid
    and plan_source.edit_reference_id = reference_uuid
    and plan_source.study_session_id = study_uuid
    and plan_source.source_asset_id = source_asset_uuid
    and plan_source.external_plan_id = package_value->'study'->>'planId'
    and plan_source.plan_digest = package_value->'study'->>'planDigestSha256';
  if plan_row.source_checksum_sha256 <>
      package_value->'source'->>'checksumSha256'
    or (package_value->'study'->>'totalWorkItemCount')::bigint <>
      (select count(*) from public.preference_long_form_study_work_items item
       where item.study_run_id = run_row.id)
    or (package_value->'study'->>'completedWorkItemCount')::bigint <>
      (select count(*) from public.preference_long_form_study_work_items item
       where item.study_run_id = run_row.id and item.status = 'completed')
  then
    raise exception using errcode = '40001',
      message = 'TARGET_UNDERSTANDING_PACKAGE_RUN_CHANGED';
  end if;

  runtime_source_value := case
    when package_value->>'status' = 'ready'
      and (package_value->>'readyForPreferenceApplication')::boolean
      and (package_value->'runtimeProvenance'->>'everyRequiredOutputVerified')::boolean
      and (package_value->'runtimeProvenance'->>'everySemanticRuntimeAuthoritative')::boolean
      and (package_value->'runtimeProvenance'->>'everyRequiredOutputCostAuthoritySatisfied')::boolean
      and (package_value->'runtimeProvenance'->>'coverageQaPassed')::boolean
      and not exists (
        select 1
        from jsonb_array_elements_text(
          package_value->'runtimeProvenance'->'runtimeSources'
        ) source_value
        where source_value <> 'verified_live'
      )
      then 'verified_live'
    else 'verified_local'
  end;
  if (
    (package_value->>'status' = 'ready'
      or (package_value->>'readyForPreferenceApplication')::boolean)
    and runtime_source_value <> 'verified_live'
  ) then
    raise exception using errcode = '40001',
      message = 'TARGET_UNDERSTANDING_PACKAGE_READY_AUTHORITY_INVALID';
  end if;

  idempotency_hash := public.reeditpro_pre_plan_idempotency_key_hash(
    p_request->>'idempotencyKey'
  );
  perform pg_advisory_xact_lock(hashtextextended(
    workspace_uuid::text || ':' || actor_uuid::text || ':' || idempotency_hash,
    0
  ));
  select * into existing_row
  from public.edit_reference_target_understanding_packages package_row
  where package_row.workspace_id = workspace_uuid
    and package_row.saved_by_user_id = actor_uuid
    and package_row.idempotency_key_hash_sha256 = idempotency_hash
  for share;
  if found then
    if existing_row.request_hash_sha256 <> p_request->>'requestHash'
      or existing_row.id <> package_uuid
      or existing_row.package_digest_sha256 <>
        package_value->>'packageDigestSha256'
      or existing_row.record_json <> package_value
    then
      raise exception using errcode = '23505',
        message = 'TARGET_UNDERSTANDING_PACKAGE_IDEMPOTENCY_CONFLICT';
    end if;
    inserted_row := existing_row;
    disposition_value := 'idempotent_replay';
  else
    if exists (
      select 1 from public.edit_reference_target_understanding_packages
      where id = package_uuid
    ) then
      raise exception using errcode = '23505',
        message = 'TARGET_UNDERSTANDING_PACKAGE_IDENTITY_CONFLICT';
    end if;
    transaction_uuid := extensions.gen_random_uuid();
    committed_at := clock_timestamp();
    insert into public.edit_reference_target_understanding_packages (
      id, workspace_id, project_id, edit_session_id, edit_reference_id,
      study_session_id, source_storage_object_record_id, source_media_asset_id,
      edit_brief_digest_sha256, package_digest_sha256,
      context_digest_sha256, status, ready_for_preference_application,
      runtime_source, record_json, created_at,
      persistence_contract_version, saved_by_user_id,
      idempotency_key_hash_sha256, request_hash_sha256, transaction_id,
      canonical_run_id, canonical_run_revision
    ) values (
      package_uuid, workspace_uuid, project_uuid, edit_session_uuid,
      reference_uuid, study_uuid, source_storage_uuid, source_media_uuid,
      brief_row.content_digest_sha256,
      package_value->>'packageDigestSha256',
      package_value->'declaredContext'->>'contextDigestSha256',
      package_value->>'status',
      (package_value->>'readyForPreferenceApplication')::boolean,
      runtime_source_value, package_value, committed_at,
      'canonical-v3-local-target-understanding-package-persistence-v1',
      actor_uuid, idempotency_hash, p_request->>'requestHash',
      transaction_uuid, package_value->'study'->>'runId', run_revision
    ) returning * into inserted_row;
    disposition_value := 'inserted';
  end if;

  return jsonb_build_object(
    'schemaVersion',
      'canonical-v3-local-target-understanding-package-save-receipt-v1',
    'disposition', disposition_value,
    'package', inserted_row.record_json,
    'transaction', jsonb_build_object(
      'transactionId', inserted_row.transaction_id::text,
      'committedAt', public.reeditpro_iso_timestamp(inserted_row.created_at)
    ),
    'boundaries', public.reeditpro_target_package_boundaries()
  );
exception
  when no_data_found then
    raise exception using errcode = '42501',
      message = 'TARGET_UNDERSTANDING_PACKAGE_LINEAGE_INVALID';
end;
$$;

create or replace function public.reeditpro_read_latest_target_understanding_package_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  actor_uuid uuid;
  workspace_uuid uuid;
  project_uuid uuid;
  edit_session_uuid uuid;
  reference_uuid uuid;
  study_uuid uuid;
  source_storage_uuid uuid;
  package_row public.edit_reference_target_understanding_packages%rowtype;
begin
  if p_contract_version <> 'canonical-distributed-pre-plan-study-state-port-v1'
    or jsonb_typeof(p_request) <> 'object'
    or not (p_request ?& array[
      'ownerUserId', 'workspaceId', 'projectId', 'editSessionId',
      'editReferenceId', 'studySessionId', 'storageObjectRecordId',
      'editBriefDigestSha256', 'idempotencyKey', 'requestHash'
    ])
    or (p_request - array[
      'ownerUserId', 'workspaceId', 'projectId', 'editSessionId',
      'editReferenceId', 'studySessionId', 'storageObjectRecordId',
      'editBriefDigestSha256', 'idempotencyKey', 'requestHash'
    ]) <> '{}'::jsonb
    or coalesce(p_request->>'editBriefDigestSha256', '')
      !~ '^[a-f0-9]{64}$'
    or length(coalesce(p_request->>'idempotencyKey', '')) not between 16 and 240
    or p_request->>'idempotencyKey' !~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]*$'
    or p_request->>'idempotencyKey' like '%..%'
    or coalesce(p_request->>'requestHash', '') !~ '^[a-f0-9]{64}$'
    or p_request->>'requestHash' <>
      public.reeditpro_pre_plan_request_hash(
        'read_latest_target_understanding_package', p_request
      )
  then
    raise exception using errcode = '22023',
      message = 'TARGET_UNDERSTANDING_PACKAGE_READ_REQUEST_INVALID';
  end if;
  perform public.reeditpro_pre_plan_assert_local_internal_authority(p_request);
  begin
    actor_uuid := (p_request->>'ownerUserId')::uuid;
    workspace_uuid := (p_request->>'workspaceId')::uuid;
    project_uuid := (p_request->>'projectId')::uuid;
    edit_session_uuid := (p_request->>'editSessionId')::uuid;
    reference_uuid := (p_request->>'editReferenceId')::uuid;
    study_uuid := (p_request->>'studySessionId')::uuid;
    source_storage_uuid := (p_request->>'storageObjectRecordId')::uuid;
  exception when others then
    raise exception using errcode = '22023',
      message = 'TARGET_UNDERSTANDING_PACKAGE_READ_IDENTITY_INVALID';
  end;
  if auth.uid() is null
    or auth.uid() <> actor_uuid
    or not public.reeditpro_is_workspace_member(workspace_uuid)
  then
    raise exception using errcode = '42501',
      message = 'TARGET_UNDERSTANDING_PACKAGE_READ_TENANT_DENIED';
  end if;
  select * into package_row
  from public.edit_reference_target_understanding_packages candidate
  where candidate.workspace_id = workspace_uuid
    and candidate.project_id = project_uuid
    and candidate.edit_session_id = edit_session_uuid
    and candidate.edit_reference_id = reference_uuid
    and candidate.study_session_id = study_uuid
    and candidate.source_storage_object_record_id = source_storage_uuid
    and candidate.edit_brief_digest_sha256 =
      p_request->>'editBriefDigestSha256'
    and candidate.persistence_contract_version =
      'canonical-v3-local-target-understanding-package-persistence-v1'
  order by candidate.canonical_run_revision desc, candidate.created_at desc,
    candidate.id desc
  limit 1;
  return jsonb_build_object(
    'schemaVersion',
      'canonical-v3-local-target-understanding-package-read-receipt-v1',
    'found', found,
    'package', case when found then package_row.record_json else null end,
    'boundaries', public.reeditpro_target_package_boundaries()
  );
end;
$$;

revoke all on function public.reeditpro_save_target_understanding_package_v1(
  text, jsonb
) from public, anon, service_role;
grant execute on function public.reeditpro_save_target_understanding_package_v1(
  text, jsonb
) to authenticated;
revoke all on function public.reeditpro_read_latest_target_understanding_package_v1(
  text, jsonb
) from public, anon, service_role;
grant execute on function public.reeditpro_read_latest_target_understanding_package_v1(
  text, jsonb
) to authenticated;
