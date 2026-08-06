-- ReEditPro canonical V3 local baseline: sanitized exact-edit Apply authority.
-- This is a read-only optimistic-concurrency projection. The outer Apply RPC
-- re-reads and locks every row again before committing any mutation.

create or replace function public.reeditpro_reseal_exact_edit_output_frame_authority()
returns trigger
language plpgsql
set search_path = pg_catalog, public, extensions
as $$
declare
  frame_without_digest jsonb;
begin
  if new.output_frame_confirmed then
    if new.output_frame_confirmation_id is null
      or new.output_frame_aspect_ratio is null
      or new.output_frame_confirmed_at is null then
      raise exception using errcode = '23514', message = 'EXACT_EDIT_OUTPUT_FRAME_STATE_INCOMPLETE';
    end if;
    frame_without_digest := jsonb_build_object(
      'schemaVersion', 'edit-reference-production-output-frame-authority-v1',
      'sourceAuthority', 'canonical_exact_edit_preference_frame_confirmation',
      'repositoryAuthority', 'supabase_rls_transactional',
      'workspaceId', new.workspace_id::text,
      'projectId', new.project_id::text,
      'editSessionId', new.edit_session_id::text,
      'exactEditPreferenceRecordRevision', new.record_revision,
      'planningInputRevision', new.planning_input_revision,
      'confirmationId', new.output_frame_confirmation_id::text,
      'aspectRatio', new.output_frame_aspect_ratio,
      'confirmedAt', public.reeditpro_iso_timestamp(new.output_frame_confirmed_at),
      'browserSuppliedAuthorityAccepted', false
    );
    new.output_frame_authority_digest_sha256 :=
      public.reeditpro_sha256_json(frame_without_digest);
  elsif new.output_frame_confirmation_id is not null
    or new.output_frame_aspect_ratio is not null
    or new.output_frame_confirmed_at is not null
    or new.output_frame_authority_digest_sha256 is not null then
    raise exception using errcode = '23514', message = 'EXACT_EDIT_OUTPUT_FRAME_CLEAR_INCOMPLETE';
  end if;
  return new;
end;
$$;

revoke all on function public.reeditpro_reseal_exact_edit_output_frame_authority()
  from public, anon, authenticated, service_role;

create trigger exact_edit_preference_states_reseal_output_frame
before update of record_revision, planning_input_revision,
  output_frame_confirmed, output_frame_confirmation_id,
  output_frame_aspect_ratio, output_frame_confirmed_at,
  output_frame_authority_digest_sha256
on public.exact_edit_preference_states
for each row execute function public.reeditpro_reseal_exact_edit_output_frame_authority();

create or replace function public.read_exact_edit_apply_authority_v1(
  p_contract_version text,
  p_read_version text,
  p_scope jsonb
)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  actor_id uuid := auth.uid();
  workspace_uuid uuid;
  project_uuid uuid;
  edit_session_uuid uuid;
  selected_application_uuid uuid;
  scope_key_count integer;
  exact_state public.exact_edit_preference_states%rowtype;
  application_row public.preference_applications%rowtype;
  reference_revision bigint;
  authority_read_receipt_id uuid := extensions.gen_random_uuid();
  read_at timestamptz := clock_timestamp();
  frame_without_digest jsonb;
  frame_authority jsonb;
  selected_application_authority jsonb;
  result jsonb;
begin
  if p_contract_version <> 'edit-reference-production-persistence-contract-v6'
    or p_read_version <> 'edit-reference-production-exact-edit-apply-authority-read-v1' then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_APPLY_READ_VERSION_INVALID';
  end if;
  if p_scope is null or jsonb_typeof(p_scope) <> 'object' then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_APPLY_READ_SCOPE_INVALID';
  end if;
  select count(*) into scope_key_count from jsonb_object_keys(p_scope);
  if scope_key_count <> 5 or not (p_scope ?& array[
    'actorUserId', 'workspaceId', 'projectId', 'editSessionId',
    'selectedApplicationId'
  ]) then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_APPLY_READ_SCOPE_SHAPE_INVALID';
  end if;
  if actor_id is null or p_scope->>'actorUserId' <> actor_id::text then
    raise exception using errcode = '42501', message = 'EXACT_EDIT_APPLY_READ_ACTOR_INVALID';
  end if;
  begin
    workspace_uuid := (p_scope->>'workspaceId')::uuid;
    project_uuid := (p_scope->>'projectId')::uuid;
    edit_session_uuid := (p_scope->>'editSessionId')::uuid;
    if p_scope->'selectedApplicationId' <> 'null'::jsonb then
      selected_application_uuid := (p_scope->>'selectedApplicationId')::uuid;
    end if;
  exception when others then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_APPLY_READ_IDENTITY_INVALID';
  end;

  if not public.reeditpro_has_workspace_write_access(workspace_uuid) then
    raise exception using errcode = '42501', message = 'EXACT_EDIT_APPLY_READ_WORKSPACE_WRITE_REQUIRED';
  end if;
  if not exists (
    select 1
    from public.projects project_row
    join public.edit_sessions edit_row
      on edit_row.project_id = project_row.id
      and edit_row.workspace_id = project_row.workspace_id
    where project_row.id = project_uuid
      and project_row.workspace_id = workspace_uuid
      and edit_row.id = edit_session_uuid
  ) then
    raise exception using errcode = '42501', message = 'EXACT_EDIT_APPLY_READ_SCOPE_DENIED';
  end if;

  select * into exact_state
  from public.exact_edit_preference_states state_row
  where state_row.workspace_id = workspace_uuid
    and state_row.project_id = project_uuid
    and state_row.edit_session_id = edit_session_uuid;
  if not found then
    raise exception using errcode = 'P0002', message = 'EXACT_EDIT_APPLY_READ_STATE_MISSING';
  end if;
  if jsonb_typeof(exact_state.preference_values) <> 'object'
    or (select count(*) from jsonb_object_keys(exact_state.preference_values)) <> 7
    or not (exact_state.preference_values ?& array[
      'editLevel', 'workflowType', 'cleanupPreference', 'visualPreference',
      'moodStyle', 'creditPreference', 'targetPlatform'
    ])
    or exact_state.preference_values->>'editLevel' not in ('basic', 'pro', 'premium')
    or exact_state.preference_values->>'workflowType' not in (
      'simple_clean_edit', 'social_short_viral_clip', 'talking_head_personal_brand',
      'podcast_clip', 'vlog_lifestyle', 'product_demo', 'real_estate_property_tour',
      'education_explainer', 'marketing_ad', 'testimonial_case_study',
      'custom_let_ai_decide'
    )
    or exact_state.preference_values->>'cleanupPreference' not in (
      'preserve_natural', 'light_cleanup', 'balanced_cleanup',
      'tight_retention_cleanup', 'aggressive_cleanup', 'documentary_faithful',
      'tutorial_complete', 'custom'
    )
    or exact_state.preference_values->>'visualPreference' not in (
      'let_ai_decide', 'keep_visuals_minimal', 'balanced_visual_mix',
      'more_stroke_motion', 'more_graphic_design', 'real_motion_if_useful',
      'no_extra_visuals'
    )
    or exact_state.preference_values->>'moodStyle' not in (
      'clean', 'premium', 'cinematic', 'energetic', 'emotional', 'educational',
      'luxury', 'funny_playful', 'corporate', 'viral_fast_paced', 'let_ai_decide'
    )
    or exact_state.preference_values->>'creditPreference' not in (
      'low_credit_cost', 'balanced', 'premium_best_result', 'let_ai_estimate'
    )
    or exact_state.preference_values->>'targetPlatform' not in (
      'tiktok_reels_shorts', 'youtube', 'website', 'course_training',
      'client_review', 'custom'
    )
    or exact_state.preference_fingerprint_sha256
      <> public.reeditpro_sha256_json(exact_state.preference_values) then
    raise exception using errcode = '23514', message = 'EXACT_EDIT_APPLY_READ_PREFERENCE_INTEGRITY_INVALID';
  end if;

  if exact_state.output_frame_confirmed then
    frame_without_digest := jsonb_build_object(
      'schemaVersion', 'edit-reference-production-output-frame-authority-v1',
      'sourceAuthority', 'canonical_exact_edit_preference_frame_confirmation',
      'repositoryAuthority', 'supabase_rls_transactional',
      'workspaceId', exact_state.workspace_id::text,
      'projectId', exact_state.project_id::text,
      'editSessionId', exact_state.edit_session_id::text,
      'exactEditPreferenceRecordRevision', exact_state.record_revision,
      'planningInputRevision', exact_state.planning_input_revision,
      'confirmationId', exact_state.output_frame_confirmation_id::text,
      'aspectRatio', exact_state.output_frame_aspect_ratio,
      'confirmedAt', public.reeditpro_iso_timestamp(exact_state.output_frame_confirmed_at),
      'browserSuppliedAuthorityAccepted', false
    );
    if exact_state.output_frame_authority_digest_sha256
      <> public.reeditpro_sha256_json(frame_without_digest) then
      raise exception using errcode = '23514', message = 'EXACT_EDIT_APPLY_READ_FRAME_INTEGRITY_INVALID';
    end if;
    frame_authority := frame_without_digest || jsonb_build_object(
      'authorityDigestSha256', exact_state.output_frame_authority_digest_sha256
    );
  else
    frame_authority := null;
  end if;

  if selected_application_uuid is not null then
    select application_source.*
      into application_row
    from public.preference_applications application_source
    where application_source.id = selected_application_uuid
      and application_source.workspace_id = workspace_uuid
      and application_source.project_id = project_uuid
      and application_source.edit_session_id = edit_session_uuid;
    if not found then
      raise exception using errcode = '40001', message = 'EXACT_EDIT_APPLY_READ_APPLICATION_CHANGED';
    end if;
    select reference_source.revision
      into reference_revision
    from public.edit_references reference_source
    where reference_source.id = application_row.edit_reference_id
      and reference_source.workspace_id = workspace_uuid;
    if not found
      or application_row.status <> 'prepared'
      or application_row.connection_state not in ('not_connected', 'connected')
      or application_row.runtime_source <> 'verified_live'
      or application_row.content_digest !~ '^[a-f0-9]{64}$'
      or application_row.context_hash !~ '^[a-f0-9]{64}$'
      or application_row.target_understanding_package_digest !~ '^[a-f0-9]{64}$'
      or reference_revision < 1 then
      raise exception using errcode = '40001', message = 'EXACT_EDIT_APPLY_READ_APPLICATION_CHANGED';
    end if;
    selected_application_authority := jsonb_build_object(
      'schemaVersion', 'edit-reference-production-prepared-application-authority-v1',
      'sourceAuthority', 'canonical_preference_application_repository',
      'runtimeSource', 'verified_live',
      'authorityReadReceiptId', authority_read_receipt_id::text || ':application',
      'workspaceId', application_row.workspace_id::text,
      'projectId', application_row.project_id::text,
      'editSessionId', application_row.edit_session_id::text,
      'editReferenceId', application_row.edit_reference_id::text,
      'studySessionId', application_row.study_session_id::text,
      'dnaVersionId', application_row.dna_version_id::text,
      'dnaQaResultId', application_row.dna_qa_result_id::text,
      'applicationId', application_row.id::text,
      'applicationVersionNumber', application_row.version,
      'applicationContentDigestSha256', application_row.content_digest,
      'applicationContextHashSha256', application_row.context_hash,
      'targetUnderstandingPackageDigestSha256',
        application_row.target_understanding_package_digest,
      'expectedReferenceRevision', reference_revision,
      'status', 'prepared',
      'connectionState', application_row.connection_state
    );
  else
    selected_application_authority := null;
  end if;

  result := jsonb_build_object(
    'schemaVersion', 'edit-reference-production-exact-edit-apply-authority-read-v1',
    'sourceAuthority', 'canonical_exact_edit_preference_repository',
    'runtimeSource', 'verified_live',
    'authorityReadReceiptId', authority_read_receipt_id::text,
    'workspaceId', exact_state.workspace_id::text,
    'projectId', exact_state.project_id::text,
    'editSessionId', exact_state.edit_session_id::text,
    'recordRevision', exact_state.record_revision,
    'preferenceRevision', exact_state.preference_revision,
    'planningInputRevision', exact_state.planning_input_revision,
    'preferenceFingerprintSha256', exact_state.preference_fingerprint_sha256,
    'values', exact_state.preference_values,
    'lifecyclePhase', exact_state.lifecycle_phase,
    'locked', exact_state.locked,
    'currentApplicationState', exact_state.current_application_state,
    'currentApplicationId', exact_state.current_application_id,
    'outputFrameAuthority', frame_authority,
    'selectedApplicationAuthority', selected_application_authority,
    'readAt', public.reeditpro_iso_timestamp(read_at),
    'browserMutationAuthorityGranted', false,
    'productionReleaseReadinessEvaluatedSeparately', true
  );
  return next result;
end;
$$;

revoke all on function public.read_exact_edit_apply_authority_v1(text, text, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.read_exact_edit_apply_authority_v1(text, text, jsonb)
  to authenticated;
