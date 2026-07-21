-- ReEditPro canonical V3 local baseline: server-owned Edit Reference
-- application preparation. This RPC re-reads persisted reference, DNA, QA,
-- and exact-target understanding authority, but never connects the prepared
-- application or mutates planning/approval/credit/execution state.

create table public.edit_reference_target_understanding_packages (
  id uuid primary key,
  workspace_id uuid not null,
  project_id uuid not null,
  edit_session_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  source_storage_object_record_id uuid not null,
  source_media_asset_id uuid not null,
  edit_brief_digest_sha256 text not null check (edit_brief_digest_sha256 ~ '^[a-f0-9]{64}$'),
  package_digest_sha256 text not null check (package_digest_sha256 ~ '^[a-f0-9]{64}$'),
  context_digest_sha256 text not null check (context_digest_sha256 ~ '^[a-f0-9]{64}$'),
  status text not null check (status in ('ready', 'stale', 'blocked')),
  ready_for_preference_application boolean not null default false,
  runtime_source text not null check (runtime_source = 'verified_live'),
  record_json jsonb not null check (jsonb_typeof(record_json) = 'object'),
  created_at timestamptz not null default clock_timestamp(),
  unique (id, study_session_id, edit_reference_id, edit_session_id, project_id, workspace_id),
  unique (
    workspace_id, project_id, edit_session_id, edit_reference_id,
    study_session_id, package_digest_sha256
  ),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (project_id, workspace_id)
    references public.projects(id, workspace_id) on delete restrict,
  foreign key (edit_session_id, project_id, workspace_id)
    references public.edit_sessions(id, project_id, workspace_id) on delete restrict
);

create table public.preference_application_preparation_events (
  id uuid primary key default extensions.gen_random_uuid(),
  transaction_id uuid not null unique,
  workspace_id uuid not null,
  project_id uuid not null,
  edit_session_id uuid not null,
  edit_reference_id uuid not null,
  application_id uuid not null,
  actor_user_id uuid not null,
  preparation_request_digest_sha256 text not null check (
    preparation_request_digest_sha256 ~ '^[a-f0-9]{64}$'
  ),
  idempotency_key_hash_sha256 text not null check (
    idempotency_key_hash_sha256 ~ '^[a-f0-9]{64}$'
  ),
  receipt_digest_sha256 text not null check (receipt_digest_sha256 ~ '^[a-f0-9]{64}$'),
  request_json jsonb not null check (jsonb_typeof(request_json) = 'object'),
  receipt_json jsonb not null check (jsonb_typeof(receipt_json) = 'object'),
  prepared_at timestamptz not null,
  unique (workspace_id, actor_user_id, idempotency_key_hash_sha256),
  foreign key (application_id, edit_session_id, project_id, workspace_id)
    references public.preference_applications(id, edit_session_id, project_id, workspace_id) on delete restrict,
  foreign key (workspace_id, actor_user_id)
    references public.workspace_members(workspace_id, user_id) on delete restrict
);

alter table public.edit_reference_target_understanding_packages enable row level security;
alter table public.edit_reference_target_understanding_packages force row level security;
alter table public.preference_application_preparation_events enable row level security;
alter table public.preference_application_preparation_events force row level security;

create policy edit_reference_target_understanding_packages_read_member
  on public.edit_reference_target_understanding_packages
  for select to authenticated
  using (public.reeditpro_is_workspace_member(workspace_id));

create policy preference_application_preparation_events_read_member
  on public.preference_application_preparation_events
  for select to authenticated
  using (public.reeditpro_is_workspace_member(workspace_id));

revoke all on public.edit_reference_target_understanding_packages
  from public, anon, authenticated, service_role;
revoke all on public.preference_application_preparation_events
  from public, anon, authenticated, service_role;
grant select on public.edit_reference_target_understanding_packages,
  public.preference_application_preparation_events to authenticated;

create trigger edit_reference_target_understanding_packages_immutable
before update or delete on public.edit_reference_target_understanding_packages
for each row execute function public.reeditpro_reject_row_mutation();

create trigger preference_application_preparation_events_immutable
before update or delete on public.preference_application_preparation_events
for each row execute function public.reeditpro_reject_row_mutation();

create or replace function public.prepare_edit_reference_application_v1(
  p_contract_version text,
  p_request jsonb
)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  actor_id uuid;
  workspace_uuid uuid;
  project_uuid uuid;
  edit_session_uuid uuid;
  reference_uuid uuid;
  study_uuid uuid;
  dna_uuid uuid;
  target_package_uuid uuid;
  target_storage_uuid uuid;
  target_media_uuid uuid;
  idempotency_key_digest text;
  preparation_request_digest text;
  rpc_request_digest text;
  requested_at timestamptz;
  request_key_count integer;
  intent_key_count integer;
  next_application_version bigint;
  transaction_id uuid := extensions.gen_random_uuid();
  application_id uuid := extensions.gen_random_uuid();
  prepared_at timestamptz := clock_timestamp();
  prepared_at_text text;
  reference_row public.edit_references%rowtype;
  study_row public.preference_study_sessions%rowtype;
  dna_row public.preference_dna_versions%rowtype;
  qa_row public.preference_dna_qa_results%rowtype;
  target_row public.edit_reference_target_understanding_packages%rowtype;
  existing_receipt public.edit_reference_idempotency_receipts%rowtype;
  idempotency_receipt_id uuid;
  application_without_digest jsonb;
  application_record jsonb;
  application_content_digest text;
  application_authority jsonb;
  receipt_without_digest jsonb;
  receipt jsonb;
  receipt_digest text;
  intent jsonb;
begin
  if p_contract_version <> 'edit-reference-production-persistence-contract-v6' then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_PREPARATION_CONTRACT_VERSION_INVALID';
  end if;
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'EDIT_REFERENCE_PREPARATION_SERVER_ROLE_REQUIRED';
  end if;
  if p_request is null or jsonb_typeof(p_request) <> 'object' then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_PREPARATION_REQUEST_INVALID';
  end if;
  select count(*) into request_key_count from jsonb_object_keys(p_request);
  if request_key_count <> 18 or not (p_request ?& array[
    'schemaVersion', 'rpcName', 'actorUserId', 'workspaceId', 'projectId',
    'editSessionId', 'intent', 'idempotencyKeyHashSha256',
    'preparationRequestDigestSha256', 'requestedAt',
    'authenticatedScopeReboundServerSide', 'browserApplicationRecordAccepted',
    'applicationLifecycleMutationAllowed', 'customerPriceCalculated',
    'customerCreditsMutated', 'serviceFeeIncluded',
    'providerOrWorkerExecutionStarted', 'rpcRequestDigestSha256'
  ]) then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_PREPARATION_REQUEST_SHAPE_INVALID';
  end if;
  if p_request->>'schemaVersion' <> 'edit-reference-application-preparation-rpc-request-v1'
    or p_request->>'rpcName' <> 'prepare_edit_reference_application_v1'
    or (p_request->>'authenticatedScopeReboundServerSide')::boolean is not true
    or (p_request->>'browserApplicationRecordAccepted')::boolean is not false
    or (p_request->>'applicationLifecycleMutationAllowed')::boolean is not false
    or (p_request->>'customerPriceCalculated')::boolean is not false
    or (p_request->>'customerCreditsMutated')::boolean is not false
    or (p_request->>'serviceFeeIncluded')::boolean is not false
    or (p_request->>'providerOrWorkerExecutionStarted')::boolean is not false then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_PREPARATION_POLICY_INVALID';
  end if;

  intent := p_request->'intent';
  if intent is null or jsonb_typeof(intent) <> 'object' then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_PREPARATION_INTENT_INVALID';
  end if;
  select count(*) into intent_key_count from jsonb_object_keys(intent);
  if intent_key_count <> 13 or not (intent ?& array[
    'schemaVersion', 'workspaceId', 'editReferenceId', 'studySessionId',
    'dnaVersionId', 'expectedReferenceRevision',
    'expectedDNAContentDigestSha256', 'applicationSource',
    'targetUnderstandingPackageId', 'targetUnderstandingPackageDigestSha256',
    'targetUnderstandingSourceStorageObjectRecordId',
    'targetUnderstandingSourceMediaAssetId',
    'targetUnderstandingEditBriefDigestSha256'
  ]) or intent->>'schemaVersion' <> 'edit-reference-application-preparation-intent-v1'
    or intent->>'applicationSource' not in ('setup_selector', 'chat_tag', 'session_panel') then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_PREPARATION_INTENT_SHAPE_INVALID';
  end if;

  begin
    actor_id := (p_request->>'actorUserId')::uuid;
    workspace_uuid := (p_request->>'workspaceId')::uuid;
    project_uuid := (p_request->>'projectId')::uuid;
    edit_session_uuid := (p_request->>'editSessionId')::uuid;
    reference_uuid := (intent->>'editReferenceId')::uuid;
    study_uuid := (intent->>'studySessionId')::uuid;
    dna_uuid := (intent->>'dnaVersionId')::uuid;
    target_package_uuid := (intent->>'targetUnderstandingPackageId')::uuid;
    target_storage_uuid := (intent->>'targetUnderstandingSourceStorageObjectRecordId')::uuid;
    target_media_uuid := (intent->>'targetUnderstandingSourceMediaAssetId')::uuid;
    requested_at := (p_request->>'requestedAt')::timestamptz;
  exception when others then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_PREPARATION_IDENTITY_INVALID';
  end;
  if intent->>'workspaceId' <> workspace_uuid::text then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_PREPARATION_WORKSPACE_MISMATCH';
  end if;
  if not exists (
    select 1 from public.workspace_members member
    where member.workspace_id = workspace_uuid
      and member.user_id = actor_id
      and member.role in ('owner', 'admin', 'editor')
  ) then
    raise exception using errcode = '42501', message = 'EDIT_REFERENCE_PREPARATION_WORKSPACE_WRITE_REQUIRED';
  end if;
  if not exists (
    select 1 from public.projects project_row
    join public.edit_sessions edit_row
      on edit_row.project_id = project_row.id
      and edit_row.workspace_id = project_row.workspace_id
    where project_row.id = project_uuid
      and project_row.workspace_id = workspace_uuid
      and edit_row.id = edit_session_uuid
  ) then
    raise exception using errcode = '42501', message = 'EDIT_REFERENCE_PREPARATION_EXACT_EDIT_SCOPE_INVALID';
  end if;

  idempotency_key_digest := p_request->>'idempotencyKeyHashSha256';
  preparation_request_digest := p_request->>'preparationRequestDigestSha256';
  rpc_request_digest := p_request->>'rpcRequestDigestSha256';
  if coalesce(idempotency_key_digest, '') !~ '^[a-f0-9]{64}$'
    or coalesce(preparation_request_digest, '') !~ '^[a-f0-9]{64}$'
    or coalesce(rpc_request_digest, '') !~ '^[a-f0-9]{64}$'
    or coalesce(intent->>'expectedDNAContentDigestSha256', '') !~ '^[a-f0-9]{64}$'
    or coalesce(intent->>'targetUnderstandingPackageDigestSha256', '') !~ '^[a-f0-9]{64}$'
    or coalesce(intent->>'targetUnderstandingEditBriefDigestSha256', '') !~ '^[a-f0-9]{64}$'
    or rpc_request_digest <> public.reeditpro_sha256_json(p_request - 'rpcRequestDigestSha256')
    or preparation_request_digest <> public.reeditpro_sha256_json(jsonb_build_object(
      'actorUserId', actor_id::text,
      'projectId', project_uuid::text,
      'editSessionId', edit_session_uuid::text,
      'intent', intent
    )) then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_PREPARATION_DIGEST_INVALID';
  end if;

  select * into existing_receipt
  from public.edit_reference_idempotency_receipts receipt_row
  where receipt_row.workspace_id = workspace_uuid
    and receipt_row.actor_user_id = actor_id
    and receipt_row.operation = 'prepare_edit_reference_application_v1'
    and receipt_row.idempotency_key_hash = idempotency_key_digest
  for update;
  if found then
    if existing_receipt.request_hash <> preparation_request_digest then
      raise exception using errcode = '23505', message = 'EDIT_REFERENCE_PREPARATION_IDEMPOTENCY_CONFLICT';
    end if;
    if existing_receipt.status = 'completed' and existing_receipt.response_json is not null then
      return next existing_receipt.response_json;
      return;
    end if;
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_PREPARATION_IDEMPOTENCY_IN_PROGRESS';
  end if;

  insert into public.edit_reference_idempotency_receipts (
    workspace_id, actor_user_id, operation, idempotency_key_hash,
    request_hash, status, expires_at
  ) values (
    workspace_uuid, actor_id, 'prepare_edit_reference_application_v1',
    idempotency_key_digest, preparation_request_digest, 'reserved',
    prepared_at + interval '24 hours'
  ) returning id into idempotency_receipt_id;

  select * into reference_row from public.edit_references reference_source
  where reference_source.id = reference_uuid
    and reference_source.workspace_id = workspace_uuid
  for share;
  if not found
    or reference_row.status <> 'active'
    or reference_row.revision <> (intent->>'expectedReferenceRevision')::bigint then
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_PREPARATION_REFERENCE_CHANGED';
  end if;

  select * into study_row from public.preference_study_sessions study_source
  where study_source.id = study_uuid
    and study_source.edit_reference_id = reference_uuid
    and study_source.workspace_id = workspace_uuid
  for share;
  if not found or study_row.status not in ('approved', 'applied') then
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_PREPARATION_STUDY_NOT_APPROVED';
  end if;

  select * into dna_row from public.preference_dna_versions dna_source
  where dna_source.id = dna_uuid
    and dna_source.study_session_id = study_uuid
    and dna_source.edit_reference_id = reference_uuid
    and dna_source.workspace_id = workspace_uuid
  for share;
  if not found
    or dna_row.status <> 'approved'
    or dna_row.approval_id is null
    or dna_row.content_digest <> intent->>'expectedDNAContentDigestSha256' then
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_PREPARATION_DNA_CHANGED';
  end if;

  select * into qa_row from public.preference_dna_qa_results qa_source
  where qa_source.dna_version_id = dna_uuid
    and qa_source.study_session_id = study_uuid
    and qa_source.edit_reference_id = reference_uuid
    and qa_source.workspace_id = workspace_uuid
    and qa_source.dna_content_digest = dna_row.content_digest
  order by qa_source.created_at desc, qa_source.id desc
  limit 1
  for share;
  if not found or qa_row.status <> 'passed' then
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_PREPARATION_QA_NOT_PASSED';
  end if;

  select * into target_row
  from public.edit_reference_target_understanding_packages target_source
  where target_source.id = target_package_uuid
    and target_source.workspace_id = workspace_uuid
    and target_source.project_id = project_uuid
    and target_source.edit_session_id = edit_session_uuid
    and target_source.edit_reference_id = reference_uuid
    and target_source.study_session_id = study_uuid
  for share;
  if not found
    or target_row.status <> 'ready'
    or not target_row.ready_for_preference_application
    or target_row.runtime_source <> 'verified_live'
    or target_row.package_digest_sha256 <> intent->>'targetUnderstandingPackageDigestSha256'
    or target_row.source_storage_object_record_id <> target_storage_uuid
    or target_row.source_media_asset_id <> target_media_uuid
    or target_row.edit_brief_digest_sha256 <> intent->>'targetUnderstandingEditBriefDigestSha256' then
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_PREPARATION_TARGET_STUDY_CHANGED';
  end if;

  select coalesce(max(application.version), 0) + 1
  into next_application_version
  from public.preference_applications application
  where application.workspace_id = workspace_uuid
    and application.project_id = project_uuid
    and application.edit_session_id = edit_session_uuid;

  prepared_at_text := public.reeditpro_iso_timestamp(prepared_at);
  application_without_digest := jsonb_build_object(
    'schemaVersion', 'preference-application-record-v3',
    'id', application_id::text,
    'workspaceId', workspace_uuid::text,
    'projectId', project_uuid::text,
    'editSessionId', edit_session_uuid::text,
    'editReferenceId', reference_uuid::text,
    'studySessionId', study_uuid::text,
    'dnaVersionId', dna_uuid::text,
    'dnaQaResultId', qa_row.id::text,
    'version', next_application_version,
    'applicationSource', intent->>'applicationSource',
    'contextHash', target_row.context_digest_sha256,
    'targetUnderstandingPackageDigest', target_row.package_digest_sha256,
    'status', 'prepared',
    'targetIntegrationStatus', 'not_connected',
    'runtimeSource', 'verified_live',
    'targetContext', target_row.record_json->'targetContext',
    'guidance', coalesce(target_row.record_json->'guidance', '[]'::jsonb),
    'heldBack', coalesce(target_row.record_json->'heldBack', '[]'::jsonb),
    'doNotCopyRules', coalesce(target_row.record_json->'doNotCopyRules', '[]'::jsonb),
    'createdAt', prepared_at_text,
    'updatedAt', prepared_at_text
  );
  application_content_digest := public.reeditpro_sha256_json(application_without_digest);
  application_record := application_without_digest || jsonb_build_object(
    'contentDigest', application_content_digest
  );

  insert into public.preference_applications (
    id, workspace_id, edit_reference_id, study_session_id, dna_version_id,
    dna_qa_result_id, project_id, edit_session_id, version, content_digest,
    context_hash, target_understanding_package_digest, status,
    connection_state, runtime_source, record_json, created_at, updated_at
  ) values (
    application_id, workspace_uuid, reference_uuid, study_uuid, dna_uuid,
    qa_row.id, project_uuid, edit_session_uuid, next_application_version,
    application_content_digest, target_row.context_digest_sha256,
    target_row.package_digest_sha256, 'prepared', 'not_connected',
    'verified_live', application_record, prepared_at, prepared_at
  );

  application_authority := jsonb_build_object(
    'schemaVersion', 'edit-reference-production-prepared-application-authority-v1',
    'sourceAuthority', 'canonical_preference_application_repository',
    'runtimeSource', 'verified_live',
    'authorityReadReceiptId', 'application-preparation-read-' || transaction_id::text,
    'workspaceId', workspace_uuid::text,
    'projectId', project_uuid::text,
    'editSessionId', edit_session_uuid::text,
    'editReferenceId', reference_uuid::text,
    'studySessionId', study_uuid::text,
    'dnaVersionId', dna_uuid::text,
    'dnaQaResultId', qa_row.id::text,
    'applicationId', application_id::text,
    'applicationVersionNumber', next_application_version,
    'applicationContentDigestSha256', application_content_digest,
    'applicationContextHashSha256', target_row.context_digest_sha256,
    'targetUnderstandingPackageDigestSha256', target_row.package_digest_sha256,
    'expectedReferenceRevision', reference_row.revision,
    'status', 'prepared',
    'connectionState', 'not_connected'
  );
  receipt_without_digest := jsonb_build_object(
    'schemaVersion', 'edit-reference-application-preparation-receipt-v1',
    'sourceAuthority', 'canonical_preference_application_preparation',
    'runtimeSource', 'controlled_local',
    'transactionId', transaction_id::text,
    'preparationRequestDigestSha256', preparation_request_digest,
    'applicationAuthority', application_authority,
    'editReferenceName', reference_row.name,
    'replayed', false,
    'preparedAt', prepared_at_text,
    'authenticatedScopeReboundServerSide', true,
    'canonicalReferenceDnaQaAndTargetStudyReRead', true,
    'applicationConnectedToEdit', false,
    'planOrEstimateInvalidated', false,
    'approvedSnapshotMutated', false,
    'customerPriceCalculated', false,
    'customerCreditsMutated', false,
    'serviceFeeIncluded', false,
    'providerOrWorkerExecutionStarted', false
  );
  receipt_digest := public.reeditpro_sha256_json(receipt_without_digest);
  receipt := receipt_without_digest || jsonb_build_object(
    'receiptDigestSha256', receipt_digest
  );

  insert into public.preference_application_preparation_events (
    transaction_id, workspace_id, project_id, edit_session_id,
    edit_reference_id, application_id, actor_user_id,
    preparation_request_digest_sha256, idempotency_key_hash_sha256,
    receipt_digest_sha256, request_json, receipt_json, prepared_at
  ) values (
    transaction_id, workspace_uuid, project_uuid, edit_session_uuid,
    reference_uuid, application_id, actor_id, preparation_request_digest,
    idempotency_key_digest, receipt_digest, p_request, receipt, prepared_at
  );

  update public.edit_reference_idempotency_receipts
  set status = 'completed', response_digest = receipt_digest,
      response_json = receipt
  where id = idempotency_receipt_id;

  return next receipt;
end;
$$;

revoke all on function public.prepare_edit_reference_application_v1(text, jsonb)
  from public, anon, authenticated;
grant execute on function public.prepare_edit_reference_application_v1(text, jsonb)
  to service_role;
