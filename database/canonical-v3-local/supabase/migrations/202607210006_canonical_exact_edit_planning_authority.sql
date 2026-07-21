-- ReEditPro canonical V3 local baseline: exact-edit planning authority.
-- Forward-only local proof. The historical supabase/migrations chain remains
-- frozen and this file grants no remote or production authority.

alter table public.exact_edit_preference_states
  add column baseline_preference_values jsonb,
  add column baseline_preference_fingerprint_sha256 text,
  add column baseline_preference_snapshot_id text,
  add column baseline_captured_at timestamptz,
  add column baseline_persistence_source text,
  add column baseline_provenance text,
  add column source_preparation_status text not null default 'not_ready',
  add column source_candidate_hash_sha256 text,
  add column source_preparation_evidence_hash_sha256 text,
  add column source_preparation_confirmed_at timestamptz;

update public.exact_edit_preference_states state_row
set baseline_preference_values = state_row.preference_values,
    baseline_preference_fingerprint_sha256 =
      public.reeditpro_sha256_json(state_row.preference_values),
    baseline_preference_snapshot_id = 'exact-edit-baseline-' || substr(
      public.reeditpro_sha256_json(jsonb_build_object(
        'workspaceId', state_row.workspace_id::text,
        'projectId', state_row.project_id::text,
        'editSessionId', state_row.edit_session_id::text,
        'values', state_row.preference_values
      )),
      1,
      48
    ),
    baseline_captured_at = state_row.updated_at,
    baseline_persistence_source = 'authenticated_private_internal_backend',
    baseline_provenance = 'saved_edit_preferences';

alter table public.exact_edit_preference_states
  alter column baseline_preference_values set not null,
  alter column baseline_preference_fingerprint_sha256 set not null,
  alter column baseline_preference_snapshot_id set not null,
  alter column baseline_captured_at set not null,
  alter column baseline_persistence_source set not null,
  alter column baseline_provenance set not null,
  add constraint exact_edit_preference_states_baseline_values_object
    check (jsonb_typeof(baseline_preference_values) = 'object'),
  add constraint exact_edit_preference_states_baseline_fingerprint
    check (baseline_preference_fingerprint_sha256 ~ '^[a-f0-9]{64}$'),
  add constraint exact_edit_preference_states_baseline_snapshot_id
    check (
      length(baseline_preference_snapshot_id) between 1 and 240
      and baseline_preference_snapshot_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]*$'
    ),
  add constraint exact_edit_preference_states_baseline_persistence_source
    check (baseline_persistence_source in (
      'server_defaults', 'authenticated_private_internal_backend'
    )),
  add constraint exact_edit_preference_states_baseline_provenance
    check (baseline_provenance in (
      'server_default_preferences', 'saved_edit_preferences'
    )),
  add constraint exact_edit_preference_states_source_preparation_status
    check (source_preparation_status in (
      'not_ready', 'requires_repreparation', 'ready'
    )),
  add constraint exact_edit_preference_states_source_preparation_shape
    check (
      (source_preparation_status = 'ready'
        and source_candidate_hash_sha256 ~ '^[a-f0-9]{64}$'
        and source_preparation_evidence_hash_sha256 ~ '^[a-f0-9]{64}$'
        and source_preparation_confirmed_at is not null)
      or (source_preparation_status <> 'ready'
        and source_candidate_hash_sha256 is null
        and source_preparation_evidence_hash_sha256 is null
        and source_preparation_confirmed_at is null)
    );

create or replace function public.reeditpro_exact_edit_preference_values_valid(
  preference_values jsonb
)
returns boolean
language sql
immutable
set search_path = pg_catalog, public
as $$
  select jsonb_typeof(preference_values) = 'object'
    and (select count(*) from jsonb_object_keys(preference_values)) = 7
    and preference_values ?& array[
      'editLevel', 'workflowType', 'cleanupPreference', 'visualPreference',
      'moodStyle', 'creditPreference', 'targetPlatform'
    ]
    and preference_values->>'editLevel' in ('basic', 'pro', 'premium')
    and preference_values->>'workflowType' in (
      'simple_clean_edit', 'social_short_viral_clip',
      'talking_head_personal_brand', 'podcast_clip', 'vlog_lifestyle',
      'product_demo', 'real_estate_property_tour', 'education_explainer',
      'marketing_ad', 'testimonial_case_study', 'custom_let_ai_decide'
    )
    and preference_values->>'cleanupPreference' in (
      'preserve_natural', 'light_cleanup', 'balanced_cleanup',
      'tight_retention_cleanup', 'aggressive_cleanup',
      'documentary_faithful', 'tutorial_complete', 'custom'
    )
    and preference_values->>'visualPreference' in (
      'let_ai_decide', 'keep_visuals_minimal', 'balanced_visual_mix',
      'more_stroke_motion', 'more_graphic_design', 'real_motion_if_useful',
      'no_extra_visuals'
    )
    and preference_values->>'moodStyle' in (
      'clean', 'premium', 'cinematic', 'energetic', 'emotional',
      'educational', 'luxury', 'funny_playful', 'corporate',
      'viral_fast_paced', 'let_ai_decide'
    )
    and preference_values->>'creditPreference' in (
      'low_credit_cost', 'balanced', 'premium_best_result',
      'let_ai_estimate'
    )
    and preference_values->>'targetPlatform' in (
      'tiktok_reels_shorts', 'youtube', 'website', 'course_training',
      'client_review', 'custom'
    );
$$;

revoke all on function public.reeditpro_exact_edit_preference_values_valid(jsonb)
  from public, anon, authenticated, service_role;

create or replace function public.reeditpro_guard_exact_edit_planning_authority()
returns trigger
language plpgsql
set search_path = pg_catalog, public, extensions
as $$
begin
  if tg_op = 'INSERT' then
    if new.baseline_preference_values is null then
      new.baseline_preference_values := new.preference_values;
    end if;
    if new.baseline_preference_fingerprint_sha256 is null then
      new.baseline_preference_fingerprint_sha256 :=
        public.reeditpro_sha256_json(new.baseline_preference_values);
    end if;
    if new.baseline_preference_snapshot_id is null then
      new.baseline_preference_snapshot_id := 'exact-edit-baseline-' || substr(
        public.reeditpro_sha256_json(jsonb_build_object(
          'workspaceId', new.workspace_id::text,
          'projectId', new.project_id::text,
          'editSessionId', new.edit_session_id::text,
          'values', new.baseline_preference_values
        )),
        1,
        48
      );
    end if;
    new.baseline_captured_at := coalesce(new.baseline_captured_at, new.updated_at, clock_timestamp());
    new.baseline_persistence_source := coalesce(
      new.baseline_persistence_source,
      'authenticated_private_internal_backend'
    );
    new.baseline_provenance := coalesce(
      new.baseline_provenance,
      'saved_edit_preferences'
    );
  elsif old.baseline_preference_values is distinct from new.baseline_preference_values
    or old.baseline_preference_fingerprint_sha256
      is distinct from new.baseline_preference_fingerprint_sha256
    or old.baseline_preference_snapshot_id
      is distinct from new.baseline_preference_snapshot_id
    or old.baseline_captured_at is distinct from new.baseline_captured_at
    or old.baseline_persistence_source
      is distinct from new.baseline_persistence_source
    or old.baseline_provenance is distinct from new.baseline_provenance then
    raise exception using errcode = '23514', message = 'EXACT_EDIT_BASELINE_IMMUTABLE';
  end if;

  if tg_op = 'UPDATE'
    and old.preference_values->'cleanupPreference'
      is distinct from new.preference_values->'cleanupPreference' then
    new.source_preparation_status := 'requires_repreparation';
    new.source_candidate_hash_sha256 := null;
    new.source_preparation_evidence_hash_sha256 := null;
    new.source_preparation_confirmed_at := null;
  end if;

  if not public.reeditpro_exact_edit_preference_values_valid(new.preference_values)
    or not public.reeditpro_exact_edit_preference_values_valid(
      new.baseline_preference_values
    )
    or new.preference_fingerprint_sha256
      <> public.reeditpro_sha256_json(new.preference_values)
    or new.baseline_preference_fingerprint_sha256
      <> public.reeditpro_sha256_json(new.baseline_preference_values) then
    raise exception using errcode = '23514', message = 'EXACT_EDIT_PLANNING_VALUES_INVALID';
  end if;
  return new;
end;
$$;

revoke all on function public.reeditpro_guard_exact_edit_planning_authority()
  from public, anon, authenticated, service_role;

create trigger exact_edit_preference_states_planning_authority_guard
before insert or update
on public.exact_edit_preference_states
for each row execute function public.reeditpro_guard_exact_edit_planning_authority();

create or replace function public.reeditpro_build_exact_edit_planning_authority(
  exact_state public.exact_edit_preference_states,
  authority_read_receipt_id uuid,
  read_at timestamptz
)
returns jsonb
language plpgsql
stable
set search_path = pg_catalog, public, extensions
as $$
declare
  source_preparation jsonb;
  frame_confirmation jsonb;
begin
  if not public.reeditpro_exact_edit_preference_values_valid(
      exact_state.preference_values
    )
    or not public.reeditpro_exact_edit_preference_values_valid(
      exact_state.baseline_preference_values
    )
    or exact_state.preference_fingerprint_sha256
      <> public.reeditpro_sha256_json(exact_state.preference_values)
    or exact_state.baseline_preference_fingerprint_sha256
      <> public.reeditpro_sha256_json(exact_state.baseline_preference_values) then
    raise exception using errcode = '23514', message = 'EXACT_EDIT_PLANNING_AUTHORITY_INTEGRITY_INVALID';
  end if;

  source_preparation := case
    when exact_state.source_preparation_status = 'ready' then
      jsonb_build_object(
        'status', 'ready',
        'sourceCandidateHashSha256', exact_state.source_candidate_hash_sha256,
        'evidenceHashSha256', exact_state.source_preparation_evidence_hash_sha256,
        'confirmedAt', public.reeditpro_iso_timestamp(
          exact_state.source_preparation_confirmed_at
        )
      )
    else jsonb_build_object(
      'status', exact_state.source_preparation_status,
      'sourceCandidateHashSha256', null,
      'evidenceHashSha256', null,
      'confirmedAt', null
    )
  end;

  frame_confirmation := case
    when exact_state.output_frame_confirmed then jsonb_build_object(
      'status', 'confirmed',
      'confirmationId', exact_state.output_frame_confirmation_id::text,
      'aspectRatio', exact_state.output_frame_aspect_ratio,
      'confirmedAt', public.reeditpro_iso_timestamp(
        exact_state.output_frame_confirmed_at
      ),
      'authorityDigestSha256', exact_state.output_frame_authority_digest_sha256
    )
    else jsonb_build_object(
      'status', 'not_confirmed',
      'confirmationId', null,
      'aspectRatio', null,
      'confirmedAt', null,
      'authorityDigestSha256', null
    )
  end;

  return jsonb_build_object(
    'schemaVersion', 'canonical-exact-edit-planning-authority-read-v1',
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
    'baseline', jsonb_build_object(
      'preferenceSnapshotId', exact_state.baseline_preference_snapshot_id,
      'values', exact_state.baseline_preference_values,
      'preferenceFingerprintSha256',
        exact_state.baseline_preference_fingerprint_sha256,
      'capturedAt', public.reeditpro_iso_timestamp(exact_state.baseline_captured_at),
      'persistenceSource', exact_state.baseline_persistence_source,
      'provenance', exact_state.baseline_provenance
    ),
    'sourcePreparation', source_preparation,
    'frameConfirmation', frame_confirmation,
    'lifecyclePhase', exact_state.lifecycle_phase,
    'locked', exact_state.locked,
    'currentApplicationState', exact_state.current_application_state,
    'currentApplicationId', exact_state.current_application_id,
    'readAt', public.reeditpro_iso_timestamp(read_at),
    'browserMutationAuthorityGranted', false,
    'productionReleaseReadinessEvaluatedSeparately', true
  );
end;
$$;

revoke all on function public.reeditpro_build_exact_edit_planning_authority(
  public.exact_edit_preference_states, uuid, timestamptz
) from public, anon, authenticated, service_role;

create or replace function public.read_exact_edit_planning_authority_v1(
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
  exact_state public.exact_edit_preference_states%rowtype;
begin
  if p_read_version <> 'canonical-exact-edit-planning-authority-read-v1'
    or p_scope is null
    or jsonb_typeof(p_scope) <> 'object'
    or (select count(*) from jsonb_object_keys(p_scope)) <> 4
    or not (p_scope ?& array[
      'actorUserId', 'workspaceId', 'projectId', 'editSessionId'
    ]) then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_PLANNING_READ_INVALID';
  end if;
  if actor_id is null or p_scope->>'actorUserId' <> actor_id::text then
    raise exception using errcode = '42501', message = 'EXACT_EDIT_PLANNING_READ_ACTOR_INVALID';
  end if;
  begin
    workspace_uuid := (p_scope->>'workspaceId')::uuid;
    project_uuid := (p_scope->>'projectId')::uuid;
    edit_session_uuid := (p_scope->>'editSessionId')::uuid;
  exception when others then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_PLANNING_READ_IDENTITY_INVALID';
  end;
  if not public.reeditpro_has_workspace_write_access(workspace_uuid) then
    raise exception using errcode = '42501', message = 'EXACT_EDIT_PLANNING_READ_WRITE_REQUIRED';
  end if;
  select * into exact_state
  from public.exact_edit_preference_states state_row
  where state_row.workspace_id = workspace_uuid
    and state_row.project_id = project_uuid
    and state_row.edit_session_id = edit_session_uuid;
  if not found then
    raise exception using errcode = 'P0002', message = 'EXACT_EDIT_PLANNING_STATE_MISSING';
  end if;
  return next public.reeditpro_build_exact_edit_planning_authority(
    exact_state,
    extensions.gen_random_uuid(),
    clock_timestamp()
  );
end;
$$;

revoke all on function public.read_exact_edit_planning_authority_v1(text, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.read_exact_edit_planning_authority_v1(text, jsonb)
  to authenticated;

create or replace function public.record_exact_edit_planning_evidence_v1(
  p_request jsonb
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
  exact_state public.exact_edit_preference_states%rowtype;
  committed_state public.exact_edit_preference_states%rowtype;
  committed_at timestamptz := clock_timestamp();
  evidence_matches boolean;
begin
  if p_request is null
    or jsonb_typeof(p_request) <> 'object'
    or (select count(*) from jsonb_object_keys(p_request)) <> 12
    or not (p_request ?& array[
      'schemaVersion', 'actorUserId', 'workspaceId', 'projectId',
      'editSessionId', 'expectedPreferenceRevision',
      'expectedPlanningInputRevision', 'expectedPreferenceFingerprintSha256',
      'expectedBaselinePreferenceSnapshotId', 'sourceCandidateHashSha256',
      'sourcePreparationEvidenceHashSha256', 'confirmedAspectRatio'
    ])
    or p_request->>'schemaVersion'
      <> 'canonical-exact-edit-planning-evidence-request-v1'
    or p_request->>'sourceCandidateHashSha256' !~ '^[a-f0-9]{64}$'
    or p_request->>'sourcePreparationEvidenceHashSha256' !~ '^[a-f0-9]{64}$'
    or p_request->>'expectedPreferenceFingerprintSha256' !~ '^[a-f0-9]{64}$'
    or p_request->>'confirmedAspectRatio' not in ('9:16', '16:9', '1:1', '4:5', '4:3') then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_PLANNING_EVIDENCE_INVALID';
  end if;
  if actor_id is null or p_request->>'actorUserId' <> actor_id::text then
    raise exception using errcode = '42501', message = 'EXACT_EDIT_PLANNING_EVIDENCE_ACTOR_INVALID';
  end if;
  begin
    workspace_uuid := (p_request->>'workspaceId')::uuid;
    project_uuid := (p_request->>'projectId')::uuid;
    edit_session_uuid := (p_request->>'editSessionId')::uuid;
  exception when others then
    raise exception using errcode = '22023', message = 'EXACT_EDIT_PLANNING_EVIDENCE_IDENTITY_INVALID';
  end;
  if not public.reeditpro_has_workspace_write_access(workspace_uuid) then
    raise exception using errcode = '42501', message = 'EXACT_EDIT_PLANNING_EVIDENCE_WRITE_REQUIRED';
  end if;

  select * into exact_state
  from public.exact_edit_preference_states state_row
  where state_row.workspace_id = workspace_uuid
    and state_row.project_id = project_uuid
    and state_row.edit_session_id = edit_session_uuid
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'EXACT_EDIT_PLANNING_STATE_MISSING';
  end if;
  if exact_state.preference_revision
      <> (p_request->>'expectedPreferenceRevision')::bigint
    or exact_state.planning_input_revision
      <> (p_request->>'expectedPlanningInputRevision')::bigint
    or exact_state.preference_fingerprint_sha256
      <> p_request->>'expectedPreferenceFingerprintSha256'
    or exact_state.baseline_preference_snapshot_id
      <> p_request->>'expectedBaselinePreferenceSnapshotId' then
    raise exception using errcode = '40001', message = 'EXACT_EDIT_PLANNING_AUTHORITY_CHANGED';
  end if;
  if not exact_state.output_frame_confirmed
    or exact_state.output_frame_aspect_ratio
      <> p_request->>'confirmedAspectRatio' then
    raise exception using errcode = '40001', message = 'EXACT_EDIT_PLANNING_FRAME_NOT_CONFIRMED';
  end if;

  evidence_matches := exact_state.source_preparation_status = 'ready'
    and exact_state.source_candidate_hash_sha256
      = p_request->>'sourceCandidateHashSha256'
    and exact_state.source_preparation_evidence_hash_sha256
      = p_request->>'sourcePreparationEvidenceHashSha256';
  if not evidence_matches then
    if exact_state.locked then
      raise exception using errcode = '40001', message = 'EXACT_EDIT_LOCKED_EVIDENCE_CHANGED';
    end if;
    update public.exact_edit_preference_states
    set record_revision = exact_state.record_revision + 1,
        source_preparation_status = 'ready',
        source_candidate_hash_sha256 = p_request->>'sourceCandidateHashSha256',
        source_preparation_evidence_hash_sha256 =
          p_request->>'sourcePreparationEvidenceHashSha256',
        source_preparation_confirmed_at = committed_at,
        updated_at = committed_at
    where workspace_id = workspace_uuid
      and project_id = project_uuid
      and edit_session_id = edit_session_uuid;
  end if;

  select * into committed_state
  from public.exact_edit_preference_states state_row
  where state_row.workspace_id = workspace_uuid
    and state_row.project_id = project_uuid
    and state_row.edit_session_id = edit_session_uuid;
  if committed_state.source_preparation_status <> 'ready'
    or committed_state.source_candidate_hash_sha256
      <> p_request->>'sourceCandidateHashSha256'
    or committed_state.source_preparation_evidence_hash_sha256
      <> p_request->>'sourcePreparationEvidenceHashSha256' then
    raise exception using errcode = '40001', message = 'EXACT_EDIT_PLANNING_EVIDENCE_COMMIT_FAILED';
  end if;
  return next public.reeditpro_build_exact_edit_planning_authority(
    committed_state,
    extensions.gen_random_uuid(),
    clock_timestamp()
  );
end;
$$;

revoke all on function public.record_exact_edit_planning_evidence_v1(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.record_exact_edit_planning_evidence_v1(jsonb)
  to authenticated;
