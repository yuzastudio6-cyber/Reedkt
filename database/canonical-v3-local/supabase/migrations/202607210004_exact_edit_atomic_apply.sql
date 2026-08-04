-- ReEditPro canonical V3 local baseline: one exact-edit Apply transaction.
-- The Edit Reference lifecycle remains owned by the V6 lifecycle RPC and is
-- invoked only as a nested subcommand inside this outer transaction.

create table public.exact_edit_preference_apply_events (
  id uuid primary key default extensions.gen_random_uuid(),
  transaction_id uuid not null,
  workspace_id uuid not null,
  project_id uuid not null,
  edit_session_id uuid not null,
  actor_user_id uuid not null,
  request_digest_sha256 text not null check (request_digest_sha256 ~ '^[a-f0-9]{64}$'),
  changed_preference_fields jsonb not null check (jsonb_typeof(changed_preference_fields) = 'array'),
  preference_values_before jsonb not null check (jsonb_typeof(preference_values_before) = 'object'),
  preference_values_after jsonb not null check (jsonb_typeof(preference_values_after) = 'object'),
  preference_fingerprint_before_sha256 text not null check (preference_fingerprint_before_sha256 ~ '^[a-f0-9]{64}$'),
  preference_fingerprint_after_sha256 text not null check (preference_fingerprint_after_sha256 ~ '^[a-f0-9]{64}$'),
  reference_mutation text check (reference_mutation in ('apply', 'replace', 'remove')),
  reference_lifecycle_receipt jsonb,
  committed_preference_record_revision bigint not null check (committed_preference_record_revision >= 1),
  committed_preference_revision bigint not null check (committed_preference_revision >= 0),
  committed_planning_input_revision bigint not null check (committed_planning_input_revision >= 1),
  source_preparation_disposition text not null check (
    source_preparation_disposition in ('unchanged', 'requires_repreparation')
  ),
  output_frame_disposition text not null check (
    output_frame_disposition in ('unchanged', 'requires_reconfirmation')
  ),
  receipt_digest_sha256 text not null check (receipt_digest_sha256 ~ '^[a-f0-9]{64}$'),
  request_json jsonb not null,
  receipt_json jsonb not null,
  committed_at timestamptz not null default clock_timestamp(),
  unique (transaction_id),
  unique (id, edit_session_id, project_id, workspace_id),
  unique (workspace_id, actor_user_id, request_digest_sha256),
  foreign key (edit_session_id, project_id, workspace_id)
    references public.edit_sessions(id, project_id, workspace_id) on delete restrict,
  foreign key (workspace_id, actor_user_id)
    references public.workspace_members(workspace_id, user_id) on delete restrict,
  check (
    (reference_mutation is null and reference_lifecycle_receipt is null)
    or (reference_mutation is not null and jsonb_typeof(reference_lifecycle_receipt) = 'object')
  )
);

alter table public.exact_edit_preference_apply_events enable row level security;
alter table public.exact_edit_preference_apply_events force row level security;

create policy exact_edit_preference_apply_events_read_member
  on public.exact_edit_preference_apply_events
  for select to authenticated
  using (public.reeditpro_is_workspace_member(workspace_id));

revoke all on public.exact_edit_preference_apply_events
  from public, anon, authenticated, service_role;
grant select on public.exact_edit_preference_apply_events to authenticated;

create trigger exact_edit_preference_apply_events_immutable
before update or delete on public.exact_edit_preference_apply_events
for each row execute function public.reeditpro_reject_row_mutation();

create or replace function public.apply_exact_edit_preferences_and_reference_v1(
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
  request_digest text;
  key_digest text;
  requested_at timestamptz;
  request_key_count integer;
  patch_key_count integer;
  execution_revoke_count integer := 0;
  existing_receipt public.edit_reference_idempotency_receipts%rowtype;
  idempotency_receipt_id uuid;
  exact_state public.exact_edit_preference_states%rowtype;
  committed_state public.exact_edit_preference_states%rowtype;
  preference_patch jsonb;
  next_values jsonb;
  next_fingerprint text;
  derived_changed_fields jsonb;
  reference_request jsonb;
  lifecycle_receipt jsonb;
  reference_mutation text;
  transaction_id uuid := extensions.gen_random_uuid();
  event_id uuid := extensions.gen_random_uuid();
  committed_at timestamptz := clock_timestamp();
  committed_at_text text;
  receipt_without_digest jsonb;
  receipt jsonb;
  receipt_digest text;
begin
  if p_contract_version <> 'edit-reference-production-persistence-contract-v6' then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_APPLY_CONTRACT_VERSION_INVALID';
  end if;
  if p_request is null or jsonb_typeof(p_request) <> 'object' then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_APPLY_REQUEST_INVALID';
  end if;

  select count(*) into request_key_count from jsonb_object_keys(p_request);
  if request_key_count <> 29 or not (p_request ?& array[
    'schemaVersion', 'rpcName', 'actorUserId', 'workspaceId', 'projectId',
    'editSessionId', 'accessCheckReceiptId', 'exactEditPreferenceAuthorityReadReceiptId',
    'expectedPreferenceRecordRevision', 'expectedPreferenceRevision',
    'expectedPlanningInputRevision', 'expectedPreferenceFingerprintSha256',
    'preferencePatch', 'changedPreferenceFields', 'referenceLifecycleRequest',
    'referenceLifecycleExecutionPolicy', 'planningInputRevisionIncrement',
    'sourcePreparationDisposition', 'outputFrameDisposition',
    'freshPlanAndEstimateRequired', 'approvedSnapshotPreserved',
    'historicalPrivatePreviewPreserved', 'idempotencyKeyHashSha256',
    'requestedAt', 'customerPriceCalculated', 'customerCreditsMutated',
    'serviceFeeIncluded', 'providerOrWorkerExecutionStarted', 'requestDigestSha256'
  ]) then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_APPLY_REQUEST_SHAPE_INVALID';
  end if;
  if p_request->>'schemaVersion' <> 'edit-reference-production-exact-edit-apply-boundary-v1'
    or p_request->>'rpcName' <> 'apply_exact_edit_preferences_and_reference_v1'
    or p_request->>'referenceLifecycleExecutionPolicy' <> 'nested_same_transaction_never_called_separately'
    or (p_request->>'planningInputRevisionIncrement')::integer <> 1
    or (p_request->>'freshPlanAndEstimateRequired')::boolean is not true
    or (p_request->>'approvedSnapshotPreserved')::boolean is not true
    or (p_request->>'historicalPrivatePreviewPreserved')::boolean is not true
    or (p_request->>'customerPriceCalculated')::boolean is not false
    or (p_request->>'customerCreditsMutated')::boolean is not false
    or (p_request->>'serviceFeeIncluded')::boolean is not false
    or (p_request->>'providerOrWorkerExecutionStarted')::boolean is not false then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_APPLY_REQUEST_POLICY_INVALID';
  end if;

  actor_id := auth.uid();
  if actor_id is null or p_request->>'actorUserId' <> actor_id::text then
    raise exception using errcode = '42501', message = 'EXACT_EDIT_APPLY_ACTOR_NOT_AUTHORIZED';
  end if;
  begin
    workspace_uuid := (p_request->>'workspaceId')::uuid;
    project_uuid := (p_request->>'projectId')::uuid;
    edit_session_uuid := (p_request->>'editSessionId')::uuid;
    requested_at := (p_request->>'requestedAt')::timestamptz;
  exception when others then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_APPLY_IDENTITY_INVALID';
  end;
  if not public.reeditpro_has_workspace_write_access(workspace_uuid) then
    raise exception using errcode = '42501', message = 'EXACT_EDIT_APPLY_WORKSPACE_WRITE_REQUIRED';
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
    raise exception using errcode = '42501', message = 'EXACT_EDIT_APPLY_SCOPE_INVALID';
  end if;
  if coalesce(p_request->>'accessCheckReceiptId', '') !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$'
    or coalesce(p_request->>'exactEditPreferenceAuthorityReadReceiptId', '') !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$' then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_APPLY_AUTHORITY_RECEIPT_INVALID';
  end if;

  request_digest := p_request->>'requestDigestSha256';
  key_digest := p_request->>'idempotencyKeyHashSha256';
  if coalesce(request_digest, '') !~ '^[a-f0-9]{64}$'
    or coalesce(key_digest, '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'expectedPreferenceFingerprintSha256', '') !~ '^[a-f0-9]{64}$'
    or request_digest <> public.reeditpro_sha256_json(p_request - 'requestDigestSha256') then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_APPLY_DIGEST_INVALID';
  end if;

  select * into existing_receipt
  from public.edit_reference_idempotency_receipts receipt_row
  where receipt_row.workspace_id = workspace_uuid
    and receipt_row.actor_user_id = actor_id
    and receipt_row.operation = 'apply_exact_edit_preferences_and_reference_v1'
    and receipt_row.idempotency_key_hash = key_digest
  for update;
  if found then
    if existing_receipt.request_hash <> request_digest then
      raise exception using errcode = '23505', message = 'EXACT_EDIT_APPLY_IDEMPOTENCY_CONFLICT';
    end if;
    if existing_receipt.status = 'completed' and existing_receipt.response_json is not null then
      return next existing_receipt.response_json;
      return;
    end if;
    raise exception using errcode = '40001', message = 'EXACT_EDIT_APPLY_IDEMPOTENCY_IN_PROGRESS';
  end if;

  insert into public.edit_reference_idempotency_receipts (
    workspace_id, actor_user_id, operation, idempotency_key_hash,
    request_hash, status, expires_at
  ) values (
    workspace_uuid, actor_id, 'apply_exact_edit_preferences_and_reference_v1',
    key_digest, request_digest, 'reserved', committed_at + interval '24 hours'
  ) returning id into idempotency_receipt_id;

  select * into exact_state from public.exact_edit_preference_states state_row
  where state_row.workspace_id = workspace_uuid
    and state_row.project_id = project_uuid
    and state_row.edit_session_id = edit_session_uuid
  for update;
  if not found
    or exact_state.record_revision <> (p_request->>'expectedPreferenceRecordRevision')::bigint
    or exact_state.preference_revision <> (p_request->>'expectedPreferenceRevision')::bigint
    or exact_state.planning_input_revision <> (p_request->>'expectedPlanningInputRevision')::bigint
    or exact_state.preference_fingerprint_sha256 <> p_request->>'expectedPreferenceFingerprintSha256'
    or exact_state.preference_fingerprint_sha256 <> public.reeditpro_sha256_json(exact_state.preference_values)
    or exact_state.locked
    or exact_state.lifecycle_phase <> 'planning' then
    raise exception using errcode = '40001', message = 'EXACT_EDIT_APPLY_AUTHORITY_CHANGED';
  end if;

  preference_patch := p_request->'preferencePatch';
  if preference_patch is null or jsonb_typeof(preference_patch) <> 'object' then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_APPLY_PATCH_INVALID';
  end if;
  select count(*) into patch_key_count from jsonb_object_keys(preference_patch);
  if patch_key_count > 7 or exists (
    select 1 from jsonb_object_keys(preference_patch) patch_key
    where patch_key not in (
      'editLevel', 'workflowType', 'cleanupPreference', 'visualPreference',
      'moodStyle', 'creditPreference', 'targetPlatform'
    )
  ) or exists (
    select 1 from jsonb_each(preference_patch) patch_entry
    where patch_entry.value = 'null'::jsonb
  ) then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_APPLY_PATCH_SHAPE_INVALID';
  end if;

  next_values := exact_state.preference_values || preference_patch;
  if jsonb_typeof(next_values) <> 'object'
    or (select count(*) from jsonb_object_keys(next_values)) <> 7
    or not (next_values ?& array[
      'editLevel', 'workflowType', 'cleanupPreference', 'visualPreference',
      'moodStyle', 'creditPreference', 'targetPlatform'
    ])
    or next_values->>'editLevel' not in ('basic', 'pro', 'premium')
    or next_values->>'workflowType' not in (
      'simple_clean_edit', 'social_short_viral_clip', 'talking_head_personal_brand',
      'podcast_clip', 'vlog_lifestyle', 'product_demo', 'real_estate_property_tour',
      'education_explainer', 'marketing_ad', 'testimonial_case_study',
      'custom_let_ai_decide'
    )
    or next_values->>'cleanupPreference' not in (
      'preserve_natural', 'light_cleanup', 'balanced_cleanup',
      'tight_retention_cleanup', 'aggressive_cleanup', 'documentary_faithful',
      'tutorial_complete', 'custom'
    )
    or next_values->>'visualPreference' not in (
      'let_ai_decide', 'keep_visuals_minimal', 'balanced_visual_mix',
      'more_stroke_motion', 'more_graphic_design', 'real_motion_if_useful',
      'no_extra_visuals'
    )
    or next_values->>'moodStyle' not in (
      'clean', 'premium', 'cinematic', 'energetic', 'emotional', 'educational',
      'luxury', 'funny_playful', 'corporate', 'viral_fast_paced', 'let_ai_decide'
    )
    or next_values->>'creditPreference' not in (
      'low_credit_cost', 'balanced', 'premium_best_result', 'let_ai_estimate'
    )
    or next_values->>'targetPlatform' not in (
      'tiktok_reels_shorts', 'youtube', 'website', 'course_training',
      'client_review', 'custom'
    ) then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_APPLY_VALUES_INVALID';
  end if;

  select coalesce(jsonb_agg(field_name order by field_order), '[]'::jsonb)
  into derived_changed_fields
  from unnest(array[
    'editLevel', 'workflowType', 'cleanupPreference', 'visualPreference',
    'moodStyle', 'creditPreference', 'targetPlatform'
  ]) with ordinality as field_list(field_name, field_order)
  where exact_state.preference_values->field_name is distinct from next_values->field_name;
  if jsonb_typeof(p_request->'changedPreferenceFields') <> 'array'
    or p_request->'changedPreferenceFields' <> derived_changed_fields then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_APPLY_CHANGED_FIELDS_INVALID';
  end if;

  if p_request->>'sourcePreparationDisposition' <> (case
      when derived_changed_fields ? 'cleanupPreference' then 'requires_repreparation'
      else 'unchanged'
    end)
    or p_request->>'outputFrameDisposition' <> (case
      when derived_changed_fields ? 'targetPlatform' then 'requires_reconfirmation'
      else 'unchanged'
    end) then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_APPLY_DISPOSITION_INVALID';
  end if;

  reference_request := p_request->'referenceLifecycleRequest';
  if reference_request = 'null'::jsonb then
    reference_request := null;
  elsif jsonb_typeof(reference_request) <> 'object' then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_APPLY_REFERENCE_REQUEST_INVALID';
  end if;
  if jsonb_array_length(derived_changed_fields) = 0 and reference_request is null then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_APPLY_NO_EFFECT';
  end if;
  if exact_state.current_application_state = 'connected'
    and (derived_changed_fields ? 'editLevel' or derived_changed_fields ? 'targetPlatform')
    and (reference_request is null or reference_request->>'mutation' <> 'remove') then
    raise exception using errcode = '40001', message = 'EXACT_EDIT_APPLY_CONNECTED_REFERENCE_CONTEXT_REQUIRES_REMOVE';
  end if;

  if reference_request is not null then
    if reference_request->>'workspaceId' <> workspace_uuid::text
      or reference_request->>'projectId' <> project_uuid::text
      or reference_request->>'editSessionId' <> edit_session_uuid::text
      or (reference_request->>'expectedPlanningInputRevision')::bigint <> exact_state.planning_input_revision
      or reference_request->>'idempotencyKeyHashSha256' <> key_digest then
      raise exception using errcode = '22023', message = 'EXACT_EDIT_APPLY_REFERENCE_SCOPE_INVALID';
    end if;
    if reference_request->>'mutation' <> 'remove'
      and (derived_changed_fields ? 'editLevel' or derived_changed_fields ? 'targetPlatform') then
      raise exception using errcode = '22023', message = 'EXACT_EDIT_APPLY_REFERENCE_CONTEXT_CHANGED';
    end if;
    reference_mutation := reference_request->>'mutation';
    select * into lifecycle_receipt
    from public.mutate_edit_reference_application_lifecycle_v3(
      p_contract_version,
      reference_request
    );
    if lifecycle_receipt is null
      or lifecycle_receipt->>'mutation' <> reference_mutation
      or (lifecycle_receipt->>'committedPlanningInputRevision')::bigint
        <> exact_state.planning_input_revision + 1 then
      raise exception using errcode = '40001', message = 'EXACT_EDIT_APPLY_REFERENCE_RECEIPT_INVALID';
    end if;
  else
    update public.edit_plan_versions
    set status = 'stale', stale_reason = 'exact_edit_preferences_changed', updated_at = committed_at
    where id = exact_state.current_draft_plan_version_id and status = 'draft';
    update public.edit_credit_estimates
    set status = 'stale', updated_at = committed_at
    where id = exact_state.current_draft_estimate_id and status = 'draft';
    update public.edit_execution_authorizations
    set status = 'revoked', revoked_at = committed_at,
        revoke_reason = 'exact_edit_preferences_changed', updated_at = committed_at
    where workspace_id = workspace_uuid and project_id = project_uuid
      and edit_session_id = edit_session_uuid and status = 'active';
    get diagnostics execution_revoke_count = row_count;

    update public.edit_sessions
    set planning_input_revision = exact_state.planning_input_revision + 1,
        status = 'planning', updated_at = committed_at
    where id = edit_session_uuid and project_id = project_uuid and workspace_id = workspace_uuid;
    update public.exact_edit_preference_states
    set record_revision = exact_state.record_revision + 1,
        planning_input_revision = exact_state.planning_input_revision + 1,
        current_draft_plan_version_id = null,
        current_draft_estimate_id = null,
        updated_at = committed_at
    where workspace_id = workspace_uuid and project_id = project_uuid
      and edit_session_id = edit_session_uuid;
  end if;

  next_fingerprint := public.reeditpro_sha256_json(next_values);
  update public.exact_edit_preference_states
  set preference_values = next_values,
      preference_fingerprint_sha256 = next_fingerprint,
      preference_revision = exact_state.preference_revision
        + case when jsonb_array_length(derived_changed_fields) > 0 then 1 else 0 end,
      output_frame_confirmed = case
        when derived_changed_fields ? 'targetPlatform' then false else output_frame_confirmed end,
      output_frame_confirmation_id = case
        when derived_changed_fields ? 'targetPlatform' then null else output_frame_confirmation_id end,
      output_frame_aspect_ratio = case
        when derived_changed_fields ? 'targetPlatform' then null else output_frame_aspect_ratio end,
      output_frame_confirmed_at = case
        when derived_changed_fields ? 'targetPlatform' then null else output_frame_confirmed_at end,
      output_frame_authority_digest_sha256 = case
        when derived_changed_fields ? 'targetPlatform' then null else output_frame_authority_digest_sha256 end,
      updated_at = committed_at
  where workspace_id = workspace_uuid and project_id = project_uuid
    and edit_session_id = edit_session_uuid;

  select * into committed_state from public.exact_edit_preference_states state_row
  where state_row.workspace_id = workspace_uuid
    and state_row.project_id = project_uuid
    and state_row.edit_session_id = edit_session_uuid;
  if committed_state.record_revision <> exact_state.record_revision + 1
    or committed_state.planning_input_revision <> exact_state.planning_input_revision + 1
    or committed_state.preference_revision <> exact_state.preference_revision
      + (case when jsonb_array_length(derived_changed_fields) > 0 then 1 else 0 end)
    or committed_state.preference_fingerprint_sha256 <> next_fingerprint then
    raise exception using errcode = '40001', message = 'EXACT_EDIT_APPLY_COMMIT_INVARIANT_FAILED';
  end if;

  committed_at_text := public.reeditpro_iso_timestamp(committed_at);
  receipt_without_digest := jsonb_build_object(
    'schemaVersion', 'edit-reference-production-exact-edit-apply-receipt-v1',
    'sourceAuthority', 'canonical_exact_edit_apply_rpc',
    'canonicalReceiptValidatedServerSide', true,
    'transactionId', transaction_id::text,
    'changedPreferenceFields', derived_changed_fields,
    'referenceMutation', reference_mutation,
    'committedPreferenceRecordRevision', committed_state.record_revision,
    'committedPreferenceRevision', committed_state.preference_revision,
    'committedPlanningInputRevision', committed_state.planning_input_revision,
    'sourcePreparationDisposition', p_request->>'sourcePreparationDisposition',
    'outputFrameDisposition', p_request->>'outputFrameDisposition',
    'freshPlanAndEstimateRequired', true,
    'approvedSnapshotPreserved', true,
    'historicalPrivatePreviewPreserved', true,
    'committedAt', committed_at_text,
    'productionReleaseReadinessEvaluatedSeparately', true,
    'customerPriceCalculated', false,
    'customerCreditsMutated', false,
    'serviceFeeIncluded', false,
    'providerOrWorkerExecutionStarted', false
  );
  receipt_digest := public.reeditpro_sha256_json(receipt_without_digest);
  receipt := receipt_without_digest || jsonb_build_object(
    'transactionReceiptDigestSha256', receipt_digest
  );

  insert into public.exact_edit_preference_apply_events (
    id, transaction_id, workspace_id, project_id, edit_session_id,
    actor_user_id, request_digest_sha256, changed_preference_fields,
    preference_values_before, preference_values_after,
    preference_fingerprint_before_sha256, preference_fingerprint_after_sha256,
    reference_mutation, reference_lifecycle_receipt,
    committed_preference_record_revision, committed_preference_revision,
    committed_planning_input_revision, source_preparation_disposition,
    output_frame_disposition, receipt_digest_sha256, request_json,
    receipt_json, committed_at
  ) values (
    event_id, transaction_id, workspace_uuid, project_uuid, edit_session_uuid,
    actor_id, request_digest, derived_changed_fields,
    exact_state.preference_values, next_values,
    exact_state.preference_fingerprint_sha256, next_fingerprint,
    reference_mutation, lifecycle_receipt,
    committed_state.record_revision, committed_state.preference_revision,
    committed_state.planning_input_revision,
    p_request->>'sourcePreparationDisposition',
    p_request->>'outputFrameDisposition', receipt_digest, p_request,
    receipt, committed_at
  );

  update public.edit_reference_idempotency_receipts
  set status = 'completed', response_digest = receipt_digest, response_json = receipt
  where id = idempotency_receipt_id;

  return next receipt;
end;
$$;

revoke all on function public.apply_exact_edit_preferences_and_reference_v1(text, jsonb)
  from public, anon;
grant execute on function public.apply_exact_edit_preferences_and_reference_v1(text, jsonb)
  to authenticated;
