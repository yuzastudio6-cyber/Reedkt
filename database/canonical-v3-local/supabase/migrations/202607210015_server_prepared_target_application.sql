-- Canonical V3 local-only server-prepared Preference Application persistence.
-- The creative adaptation remains in the reviewed TypeScript authority. This
-- transaction accepts only its server-produced immutable record, re-reads all
-- tenant/reference/DNA/QA/target authorities, and commits the unconnected
-- application exactly once. It never accepts a browser application record.

create or replace function public.prepare_edit_reference_application_v2(
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
  qa_uuid uuid;
  target_package_uuid uuid;
  target_storage_uuid uuid;
  target_media_uuid uuid;
  application_uuid uuid;
  idempotency_key_digest text;
  preparation_request_digest text;
  rpc_request_digest text;
  requested_at timestamptz;
  next_application_version bigint;
  transaction_id uuid := extensions.gen_random_uuid();
  idempotency_receipt_id uuid;
  reference_row public.edit_references%rowtype;
  study_row public.preference_study_sessions%rowtype;
  dna_row public.preference_dna_versions%rowtype;
  qa_row public.preference_dna_qa_results%rowtype;
  target_row public.edit_reference_target_understanding_packages%rowtype;
  target_run_row public.preference_long_form_study_runs%rowtype;
  existing_receipt public.edit_reference_idempotency_receipts%rowtype;
  intent jsonb;
  application_record jsonb;
  target_context jsonb;
  target_binding jsonb;
  immutable_application_content jsonb;
  application_authority jsonb;
  receipt_without_digest jsonb;
  receipt jsonb;
  receipt_digest text;
begin
  if p_contract_version <> 'edit-reference-production-persistence-contract-v6'
    or coalesce(auth.role(), '') <> 'service_role'
    or p_request is null
    or jsonb_typeof(p_request) <> 'object'
    or not (p_request ?& array[
      'schemaVersion', 'rpcName', 'actorUserId', 'workspaceId', 'projectId',
      'editSessionId', 'intent', 'idempotencyKeyHashSha256',
      'preparationRequestDigestSha256', 'preparedApplication', 'requestedAt',
      'authenticatedScopeReboundServerSide', 'browserApplicationRecordAccepted',
      'applicationLifecycleMutationAllowed', 'customerPriceCalculated',
      'customerCreditsMutated', 'serviceFeeIncluded',
      'providerOrWorkerExecutionStarted', 'rpcRequestDigestSha256'
    ])
    or (p_request - array[
      'schemaVersion', 'rpcName', 'actorUserId', 'workspaceId', 'projectId',
      'editSessionId', 'intent', 'idempotencyKeyHashSha256',
      'preparationRequestDigestSha256', 'preparedApplication', 'requestedAt',
      'authenticatedScopeReboundServerSide', 'browserApplicationRecordAccepted',
      'applicationLifecycleMutationAllowed', 'customerPriceCalculated',
      'customerCreditsMutated', 'serviceFeeIncluded',
      'providerOrWorkerExecutionStarted', 'rpcRequestDigestSha256'
    ]) <> '{}'::jsonb
    or p_request->>'schemaVersion'
      <> 'edit-reference-application-preparation-rpc-request-v2'
    or p_request->>'rpcName' <> 'prepare_edit_reference_application_v2'
    or (p_request->>'authenticatedScopeReboundServerSide')::boolean is not true
    or (p_request->>'browserApplicationRecordAccepted')::boolean is not false
    or (p_request->>'applicationLifecycleMutationAllowed')::boolean is not false
    or (p_request->>'customerPriceCalculated')::boolean is not false
    or (p_request->>'customerCreditsMutated')::boolean is not false
    or (p_request->>'serviceFeeIncluded')::boolean is not false
    or (p_request->>'providerOrWorkerExecutionStarted')::boolean is not false
  then
    raise exception using errcode = '22023',
      message = 'EDIT_REFERENCE_PREPARATION_V2_REQUEST_INVALID';
  end if;

  intent := p_request->'intent';
  application_record := p_request->'preparedApplication';
  if jsonb_typeof(intent) <> 'object'
    or not (intent ?& array[
      'schemaVersion', 'workspaceId', 'editReferenceId', 'studySessionId',
      'dnaVersionId', 'expectedReferenceRevision',
      'expectedDNAContentDigestSha256', 'applicationSource',
      'targetUnderstandingPackageId', 'targetUnderstandingPackageDigestSha256',
      'targetUnderstandingSourceStorageObjectRecordId',
      'targetUnderstandingSourceMediaAssetId',
      'targetUnderstandingEditBriefDigestSha256'
    ])
    or (intent - array[
      'schemaVersion', 'workspaceId', 'editReferenceId', 'studySessionId',
      'dnaVersionId', 'expectedReferenceRevision',
      'expectedDNAContentDigestSha256', 'applicationSource',
      'targetUnderstandingPackageId', 'targetUnderstandingPackageDigestSha256',
      'targetUnderstandingSourceStorageObjectRecordId',
      'targetUnderstandingSourceMediaAssetId',
      'targetUnderstandingEditBriefDigestSha256'
    ]) <> '{}'::jsonb
    or intent->>'schemaVersion'
      <> 'edit-reference-application-preparation-intent-v1'
    or intent->>'applicationSource'
      not in ('setup_selector', 'chat_tag', 'session_panel')
    or jsonb_typeof(application_record) <> 'object'
  then
    raise exception using errcode = '22023',
      message = 'EDIT_REFERENCE_PREPARATION_V2_INTENT_OR_APPLICATION_INVALID';
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
    target_storage_uuid :=
      (intent->>'targetUnderstandingSourceStorageObjectRecordId')::uuid;
    target_media_uuid :=
      (intent->>'targetUnderstandingSourceMediaAssetId')::uuid;
    application_uuid := (application_record->>'id')::uuid;
    requested_at := (p_request->>'requestedAt')::timestamptz;
  exception when others then
    raise exception using errcode = '22023',
      message = 'EDIT_REFERENCE_PREPARATION_V2_IDENTITY_INVALID';
  end;

  idempotency_key_digest := p_request->>'idempotencyKeyHashSha256';
  preparation_request_digest := p_request->>'preparationRequestDigestSha256';
  rpc_request_digest := p_request->>'rpcRequestDigestSha256';
  if intent->>'workspaceId' <> workspace_uuid::text
    or coalesce(idempotency_key_digest, '') !~ '^[a-f0-9]{64}$'
    or coalesce(preparation_request_digest, '') !~ '^[a-f0-9]{64}$'
    or coalesce(rpc_request_digest, '') !~ '^[a-f0-9]{64}$'
    or coalesce(intent->>'expectedDNAContentDigestSha256', '')
      !~ '^[a-f0-9]{64}$'
    or coalesce(intent->>'targetUnderstandingPackageDigestSha256', '')
      !~ '^[a-f0-9]{64}$'
    or coalesce(intent->>'targetUnderstandingEditBriefDigestSha256', '')
      !~ '^[a-f0-9]{64}$'
    or rpc_request_digest <>
      public.reeditpro_sha256_json(p_request - 'rpcRequestDigestSha256')
    or preparation_request_digest <> public.reeditpro_sha256_json(
      jsonb_build_object(
        'actorUserId', actor_id::text,
        'projectId', project_uuid::text,
        'editSessionId', edit_session_uuid::text,
        'intent', intent
      )
    )
  then
    raise exception using errcode = '22023',
      message = 'EDIT_REFERENCE_PREPARATION_V2_DIGEST_INVALID';
  end if;

  if not exists (
    select 1 from public.workspace_members member
    where member.workspace_id = workspace_uuid
      and member.user_id = actor_id
      and member.role in ('owner', 'admin', 'editor')
  ) then
    raise exception using errcode = '42501',
      message = 'EDIT_REFERENCE_PREPARATION_V2_WORKSPACE_WRITE_REQUIRED';
  end if;

  select * into existing_receipt
  from public.edit_reference_idempotency_receipts receipt_row
  where receipt_row.workspace_id = workspace_uuid
    and receipt_row.actor_user_id = actor_id
    and receipt_row.operation = 'prepare_edit_reference_application_v2'
    and receipt_row.idempotency_key_hash = idempotency_key_digest
  for update;
  if found then
    if existing_receipt.request_hash <> preparation_request_digest then
      raise exception using errcode = '23505',
        message = 'EDIT_REFERENCE_PREPARATION_V2_IDEMPOTENCY_CONFLICT';
    end if;
    if existing_receipt.status = 'completed'
      and existing_receipt.response_json is not null
    then
      receipt_without_digest :=
        (existing_receipt.response_json - 'receiptDigestSha256' - 'replayed')
        || jsonb_build_object('replayed', true);
      return next receipt_without_digest || jsonb_build_object(
        'receiptDigestSha256',
        public.reeditpro_sha256_json(receipt_without_digest)
      );
      return;
    end if;
    raise exception using errcode = '40001',
      message = 'EDIT_REFERENCE_PREPARATION_V2_IDEMPOTENCY_IN_PROGRESS';
  end if;

  perform 1 from public.exact_edit_preference_states state
  where state.workspace_id = workspace_uuid
    and state.project_id = project_uuid
    and state.edit_session_id = edit_session_uuid
  for update;
  if not found then
    raise exception using errcode = '42501',
      message = 'EDIT_REFERENCE_PREPARATION_V2_EXACT_EDIT_SCOPE_INVALID';
  end if;

  insert into public.edit_reference_idempotency_receipts (
    workspace_id, actor_user_id, operation, idempotency_key_hash,
    request_hash, status, expires_at
  ) values (
    workspace_uuid, actor_id, 'prepare_edit_reference_application_v2',
    idempotency_key_digest, preparation_request_digest, 'reserved',
    requested_at + interval '24 hours'
  ) returning id into idempotency_receipt_id;

  select * into strict reference_row from public.edit_references source
  where source.id = reference_uuid and source.workspace_id = workspace_uuid;
  if reference_row.status <> 'active'
    or reference_row.owner_user_id <> actor_id
    or reference_row.revision <> (intent->>'expectedReferenceRevision')::bigint
  then
    raise exception using errcode = '40001',
      message = 'EDIT_REFERENCE_PREPARATION_V2_REFERENCE_CHANGED';
  end if;

  select * into strict study_row from public.preference_study_sessions source
  where source.id = study_uuid
    and source.edit_reference_id = reference_uuid
    and source.workspace_id = workspace_uuid;
  if study_row.status not in ('approved', 'applied') then
    raise exception using errcode = '40001',
      message = 'EDIT_REFERENCE_PREPARATION_V2_STUDY_NOT_APPROVED';
  end if;

  select * into strict dna_row from public.preference_dna_versions source
  where source.id = dna_uuid
    and source.study_session_id = study_uuid
    and source.edit_reference_id = reference_uuid
    and source.workspace_id = workspace_uuid;
  if dna_row.status <> 'approved'
    or dna_row.approval_id is null
    or dna_row.content_digest <> intent->>'expectedDNAContentDigestSha256'
  then
    raise exception using errcode = '40001',
      message = 'EDIT_REFERENCE_PREPARATION_V2_DNA_CHANGED';
  end if;

  select * into strict qa_row from public.preference_dna_qa_results source
  where source.dna_version_id = dna_uuid
    and source.study_session_id = study_uuid
    and source.edit_reference_id = reference_uuid
    and source.workspace_id = workspace_uuid
    and source.dna_content_digest = dna_row.content_digest
  order by source.created_at desc, source.id desc limit 1;
  qa_uuid := qa_row.id;
  -- A reviewed QA result may legitimately require explicit user review. The
  -- DNA approval transaction is the authority that proves that review was
  -- acknowledged; blocked QA can never produce an approved DNA version.
  if qa_row.status not in ('passed', 'requires_user_review') then
    raise exception using errcode = '40001',
      message = 'EDIT_REFERENCE_PREPARATION_V2_QA_NOT_PASSED';
  end if;

  select * into strict target_row
  from public.edit_reference_target_understanding_packages source
  where source.id = target_package_uuid
    and source.workspace_id = workspace_uuid
    and source.project_id = project_uuid
    and source.edit_session_id = edit_session_uuid
    and source.edit_reference_id = reference_uuid
    and source.study_session_id = study_uuid;
  if target_row.persistence_contract_version is distinct from
      'canonical-v3-local-target-understanding-package-persistence-v1'
    or target_row.status is distinct from 'ready'
    or not target_row.ready_for_preference_application
    or target_row.runtime_source is distinct from 'verified_live'
    or target_row.package_digest_sha256 is distinct from
      intent->>'targetUnderstandingPackageDigestSha256'
    or target_row.source_storage_object_record_id is distinct from target_storage_uuid
    or target_row.source_media_asset_id is distinct from target_media_uuid
    or target_row.edit_brief_digest_sha256 is distinct from
      intent->>'targetUnderstandingEditBriefDigestSha256'
    or target_row.record_json->>'packageId' is distinct from target_package_uuid::text
    or target_row.record_json->>'packageDigestSha256'
      is distinct from target_row.package_digest_sha256
  then
    raise exception using errcode = '40001',
      message = 'EDIT_REFERENCE_PREPARATION_V2_TARGET_STUDY_CHANGED';
  end if;

  select * into strict target_run_row
  from public.preference_long_form_study_runs source
  where source.workspace_id = workspace_uuid
    and source.edit_reference_id = reference_uuid
    and source.study_session_id = study_uuid
    and source.external_run_id = target_row.canonical_run_id
    and source.revision = target_row.canonical_run_revision;
  if target_run_row.status is distinct from 'completed'
    or target_row.record_json->'study'->>'state' is distinct from 'completed'
    or coalesce(
      (target_row.record_json->'study'->>'totalWorkItemCount')::bigint,
      0
    ) < 1
    or (target_row.record_json->'study'->>'completedWorkItemCount')::bigint
      is distinct from
      (target_row.record_json->'study'->>'totalWorkItemCount')::bigint
    or (target_row.record_json->'study'->>'totalWorkItemCount')::bigint
      is distinct from (
        select count(*)
        from public.preference_long_form_study_work_items item
        where item.study_run_id = target_run_row.id
      )
    or (target_row.record_json->'study'->>'completedWorkItemCount')::bigint
      is distinct from (
        select count(*)
        from public.preference_long_form_study_work_items item
        where item.study_run_id = target_run_row.id
          and item.status = 'completed'
      )
    or exists (
      select 1
      from public.preference_long_form_study_work_items item
      where item.study_run_id = target_run_row.id
        and item.required
        and item.status is distinct from 'completed'
    )
    or not exists (
      select 1
      from public.preference_long_form_study_plans plan
      where plan.id = target_run_row.study_plan_id
        and plan.workspace_id = workspace_uuid
        and plan.edit_reference_id = reference_uuid
        and plan.study_session_id = study_uuid
        and plan.plan_digest is not distinct from
          target_row.record_json->'study'->>'planDigestSha256'
    )
  then
    raise exception using errcode = '40001',
      message = 'EDIT_REFERENCE_PREPARATION_V2_TARGET_RUN_NOT_COMPLETE';
  end if;

  select coalesce(max(application.version), 0) + 1
  into next_application_version
  from public.preference_applications application
  where application.workspace_id = workspace_uuid
    and application.project_id = project_uuid
    and application.edit_session_id = edit_session_uuid;

  -- The adaptation engine owns creative content, while this serialized
  -- transaction owns the exact-edit application sequence. Version is not part
  -- of the immutable creative-content digest, so replace only this one
  -- persistence field with the canonical value allocated under the state row
  -- lock. A browser never supplies the application record.
  application_record := jsonb_set(
    application_record,
    '{version}',
    to_jsonb(next_application_version),
    false
  );

  target_context := application_record->'targetContext';
  target_binding := application_record->'targetUnderstanding';
  immutable_application_content := jsonb_build_object(
    'applicationVersion', application_record->'applicationVersion',
    'applicationSource', application_record->'applicationSource',
    'editReferenceId', application_record->'editReferenceId',
    'dnaVersionId', application_record->'dnaVersionId',
    'dnaVersionNumber', application_record->'dnaVersionNumber',
    'dnaContentDigest', application_record->'dnaContentDigest',
    'dnaApprovalId', application_record->'dnaApprovalId',
    'dnaQaResultId', application_record->'dnaQaResultId',
    'targetContext', target_context,
    'targetContextDigest', application_record->'targetContextDigest',
    'targetUnderstanding', target_binding,
    'decisions', application_record->'decisions',
    'hintGroups', application_record->'hintGroups',
    'doNotCopyRules', application_record->'doNotCopyRules',
    'precedencePolicy', application_record->'precedencePolicy',
    'summary', application_record->'summary'
  );

  if not (application_record ?& array[
      'id', 'workspaceId', 'editReferenceId', 'editReferenceName',
      'studySessionId', 'dnaVersionId', 'dnaVersionNumber',
      'dnaContentDigest', 'dnaApprovalId', 'dnaQaResultId', 'projectId',
      'editSessionId', 'version', 'status', 'applicationSource',
      'applicationVersion', 'runtimeSource', 'targetContext',
      'targetContextDigest', 'targetUnderstanding', 'decisions', 'hintGroups',
      'doNotCopyRules', 'precedencePolicy', 'summary', 'targetIdentityStatus',
      'targetIntegrationStatus', 'downstreamInvalidationStatus',
      'contentDigest', 'targetEditMutationMade', 'approvedPlanMutationMade',
      'downstreamContextWritten', 'providerCallMade', 'modelCallMade',
      'fileBytesRead', 'externalUrlFetched', 'mediaProcessingStarted',
      'workerJobCreated', 'generationRequestCreated', 'renderJobCreated',
      'creditReservedOrSpent', 'createdAt', 'updatedAt'
    ])
    or (application_record - array[
      'id', 'workspaceId', 'editReferenceId', 'editReferenceName',
      'studySessionId', 'dnaVersionId', 'dnaVersionNumber',
      'dnaContentDigest', 'dnaApprovalId', 'dnaQaResultId', 'projectId',
      'editSessionId', 'version', 'status', 'applicationSource',
      'applicationVersion', 'runtimeSource', 'targetContext',
      'targetContextDigest', 'targetUnderstanding', 'decisions', 'hintGroups',
      'doNotCopyRules', 'precedencePolicy', 'summary', 'targetIdentityStatus',
      'targetIntegrationStatus', 'downstreamInvalidationStatus',
      'contentDigest', 'targetEditMutationMade', 'approvedPlanMutationMade',
      'downstreamContextWritten', 'providerCallMade', 'modelCallMade',
      'fileBytesRead', 'externalUrlFetched', 'mediaProcessingStarted',
      'workerJobCreated', 'generationRequestCreated', 'renderJobCreated',
      'creditReservedOrSpent', 'createdAt', 'updatedAt'
    ]) <> '{}'::jsonb
    or application_record->>'id' <> application_uuid::text
    or application_record->>'workspaceId' <> workspace_uuid::text
    or application_record->>'projectId' <> project_uuid::text
    or application_record->>'editSessionId' <> edit_session_uuid::text
    or application_record->>'editReferenceId' <> reference_uuid::text
    or application_record->>'editReferenceName' <> reference_row.name
    or application_record->>'studySessionId' <> study_uuid::text
    or application_record->>'dnaVersionId' <> dna_uuid::text
    or (application_record->>'dnaVersionNumber')::bigint <> dna_row.version
    or application_record->>'dnaContentDigest' <> dna_row.content_digest
    or application_record->>'dnaApprovalId' <> dna_row.approval_id
    or application_record->>'dnaQaResultId' <> qa_uuid::text
    or (application_record->>'version')::bigint <> next_application_version
    or application_record->>'status' <> 'prepared'
    or application_record->>'applicationSource' <> intent->>'applicationSource'
    or application_record->>'applicationVersion'
      <> 'edit-reference-target-application-v2'
    or application_record->>'runtimeSource' <> 'verified_live'
    or jsonb_typeof(target_context) <> 'object'
    or not (target_context ?& array[
      'projectId', 'editSessionId', 'projectName', 'editName', 'sourceMode',
      'contentType', 'sourceSummary', 'currentUserInstruction',
      'selectedEditLevel', 'aspectRatio', 'outputFrameConfirmed',
      'platformTarget', 'storyRole', 'budgetPreference', 'directives',
      'approvedConstraints'
    ])
    or (target_context - array[
      'projectId', 'editSessionId', 'projectName', 'editName', 'sourceMode',
      'contentType', 'sourceSummary', 'currentUserInstruction',
      'selectedEditLevel', 'aspectRatio', 'outputFrameConfirmed',
      'platformTarget', 'storyRole', 'budgetPreference', 'directives',
      'approvedConstraints'
    ]) <> '{}'::jsonb
    or application_record->>'targetContextDigest'
      <> public.reeditpro_sha256_json(target_context)
    or target_context->>'projectId' <> project_uuid::text
    or target_context->>'editSessionId' <> edit_session_uuid::text
    or (target_context->>'outputFrameConfirmed')::boolean is not true
    or target_context->>'projectName'
      <> target_row.record_json->'declaredContext'->>'projectName'
    or target_context->>'editName'
      <> target_row.record_json->'declaredContext'->>'editName'
    or target_context->>'sourceMode'
      <> target_row.record_json->'audioState'->>'sourceMode'
    or target_context->>'contentType'
      <> target_row.record_json->'declaredContext'->>'contentType'
    or target_context->>'sourceSummary'
      <> target_row.record_json->>'sourceSummary'
    or target_context->>'currentUserInstruction'
      <> target_row.record_json->'declaredContext'->>'currentUserInstruction'
    or target_context->>'selectedEditLevel'
      <> target_row.record_json->'declaredContext'->>'selectedEditLevel'
    or target_context->>'aspectRatio'
      <> target_row.record_json->'declaredContext'->>'aspectRatio'
    or target_context->>'platformTarget'
      <> target_row.record_json->'declaredContext'->>'platformTarget'
    or target_context->>'storyRole'
      <> target_row.record_json->'declaredContext'->>'storyRole'
    or target_context->>'budgetPreference'
      <> target_row.record_json->'declaredContext'->>'budgetPreference'
    or target_context->'directives'
      <> target_row.record_json->'declaredContext'->'directives'
    or target_context->'approvedConstraints'
      <> target_row.record_json->'declaredContext'->'approvedConstraints'
    or jsonb_typeof(target_binding) <> 'object'
    or not (target_binding ?& array[
      'packageId', 'packageDigestSha256', 'sourceStorageObjectRecordId',
      'sourceMediaAssetId', 'editBriefId', 'editBriefRevision',
      'editBriefDigestSha256', 'studyRunId', 'studyPlanDigestSha256',
      'contextDigestSha256', 'evidenceIds', 'confidence', 'runtimeSources',
      'everyRequiredOutputVerified', 'everySemanticRuntimeAuthoritative',
      'everyRequiredOutputCostAuthoritySatisfied', 'coverageQaPassed',
      'callerSourceSummaryUsedAsStudyEvidence'
    ])
    or (target_binding - array[
      'packageId', 'packageDigestSha256', 'sourceStorageObjectRecordId',
      'sourceMediaAssetId', 'editBriefId', 'editBriefRevision',
      'editBriefDigestSha256', 'studyRunId', 'studyPlanDigestSha256',
      'contextDigestSha256', 'evidenceIds', 'confidence', 'runtimeSources',
      'everyRequiredOutputVerified', 'everySemanticRuntimeAuthoritative',
      'everyRequiredOutputCostAuthoritySatisfied', 'coverageQaPassed',
      'callerSourceSummaryUsedAsStudyEvidence'
    ]) <> '{}'::jsonb
    or target_binding->>'packageId' <> target_package_uuid::text
    or target_binding->>'packageDigestSha256'
      <> target_row.package_digest_sha256
    or target_binding->>'sourceStorageObjectRecordId' <> target_storage_uuid::text
    or target_binding->>'sourceMediaAssetId' <> target_media_uuid::text
    or target_binding->>'editBriefId'
      <> target_row.record_json->'declaredContext'->>'editBriefId'
    or (target_binding->>'editBriefRevision')::bigint <>
      (target_row.record_json->'declaredContext'->>'editBriefRevision')::bigint
    or target_binding->>'editBriefDigestSha256'
      <> target_row.edit_brief_digest_sha256
    or target_binding->>'studyRunId'
      <> target_row.record_json->'study'->>'runId'
    or target_binding->>'studyPlanDigestSha256'
      <> target_row.record_json->'study'->>'planDigestSha256'
    or target_binding->>'contextDigestSha256' <> target_row.context_digest_sha256
    or target_binding->'evidenceIds' <> target_row.record_json->'evidenceIds'
    or target_binding->'runtimeSources'
      <> target_row.record_json->'runtimeProvenance'->'runtimeSources'
    or (target_binding->>'everyRequiredOutputVerified')::boolean is not true
    or (target_binding->>'everySemanticRuntimeAuthoritative')::boolean is not true
    or (target_binding->>'everyRequiredOutputCostAuthoritySatisfied')::boolean
      is not true
    or (target_binding->>'coverageQaPassed')::boolean is not true
    or (target_binding->>'callerSourceSummaryUsedAsStudyEvidence')::boolean
      is not false
    or jsonb_typeof(application_record->'decisions') <> 'array'
    or jsonb_array_length(application_record->'decisions') < 1
    or jsonb_typeof(application_record->'hintGroups') <> 'array'
    or jsonb_array_length(application_record->'hintGroups') < 1
    or jsonb_typeof(application_record->'doNotCopyRules') <> 'array'
    or jsonb_array_length(application_record->'doNotCopyRules') < 1
    or application_record->'precedencePolicy' <> jsonb_build_array(
      'safety_platform_tier_frame_credit_or_approved_constraint',
      'current_user_instruction', 'target_context', 'approved_preference_dna'
    )
    or length(coalesce(application_record->>'summary', '')) not between 1 and 2000
    or application_record->>'targetIdentityStatus'
      <> 'verified_target_video_understanding'
    or application_record->>'targetIntegrationStatus' <> 'not_connected'
    or application_record->>'downstreamInvalidationStatus' <> 'not_required'
    or (application_record->>'targetEditMutationMade')::boolean is not false
    or (application_record->>'approvedPlanMutationMade')::boolean is not false
    or (application_record->>'downstreamContextWritten')::boolean is not false
    or (application_record->>'providerCallMade')::boolean is not false
    or (application_record->>'modelCallMade')::boolean is not false
    or (application_record->>'fileBytesRead')::boolean is not false
    or (application_record->>'externalUrlFetched')::boolean is not false
    or (application_record->>'mediaProcessingStarted')::boolean is not false
    or (application_record->>'workerJobCreated')::boolean is not false
    or (application_record->>'generationRequestCreated')::boolean is not false
    or (application_record->>'renderJobCreated')::boolean is not false
    or (application_record->>'creditReservedOrSpent')::boolean is not false
    or (application_record->>'createdAt')::timestamptz <> requested_at
    or (application_record->>'updatedAt')::timestamptz <> requested_at
    or application_record->>'contentDigest'
      <> public.reeditpro_sha256_json(immutable_application_content)
  then
    raise exception using errcode = '22023',
      message = 'EDIT_REFERENCE_PREPARATION_V2_SERVER_APPLICATION_INVALID';
  end if;

  insert into public.preference_applications (
    id, workspace_id, edit_reference_id, study_session_id, dna_version_id,
    dna_qa_result_id, project_id, edit_session_id, version, content_digest,
    context_hash, target_understanding_package_digest, status,
    connection_state, runtime_source, record_json, created_at, updated_at
  ) values (
    application_uuid, workspace_uuid, reference_uuid, study_uuid, dna_uuid,
    qa_uuid, project_uuid, edit_session_uuid, next_application_version,
    application_record->>'contentDigest',
    application_record->>'targetContextDigest',
    target_row.package_digest_sha256, 'prepared', 'not_connected',
    'verified_live', application_record, requested_at, requested_at
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
    'dnaQaResultId', qa_uuid::text,
    'applicationId', application_uuid::text,
    'applicationVersionNumber', next_application_version,
    'applicationContentDigestSha256', application_record->>'contentDigest',
    'applicationContextHashSha256', application_record->>'targetContextDigest',
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
    'preparedAt', public.reeditpro_iso_timestamp(requested_at),
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
    reference_uuid, application_uuid, actor_id, preparation_request_digest,
    idempotency_key_digest, receipt_digest, p_request, receipt, requested_at
  );

  update public.edit_reference_idempotency_receipts
  set status = 'completed', response_digest = receipt_digest,
      response_json = receipt
  where id = idempotency_receipt_id;

  return next receipt;
end;
$$;

revoke all on function public.prepare_edit_reference_application_v2(text, jsonb)
  from public, anon, authenticated;
grant execute on function public.prepare_edit_reference_application_v2(text, jsonb)
  to service_role;

-- The V1 transaction only understood the retired synthetic target package.
-- Keep its historical definition for migration auditability but make it
-- uncallable after the raw package authority is installed.
revoke execute on function public.prepare_edit_reference_application_v1(text, jsonb)
  from service_role;
