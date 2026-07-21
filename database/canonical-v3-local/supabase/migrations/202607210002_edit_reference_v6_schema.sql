-- ReEditPro canonical V3 local baseline: Edit Reference persistence contract V6.
-- No provider payload, credential, signed URL, local path, customer price, credit,
-- service-fee, or approved-edit authority is stored by the pre-plan study tables.

create table public.edit_references (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  owner_user_id uuid not null,
  revision bigint not null default 1 check (revision >= 1),
  status text not null default 'active' check (status in ('active', 'archived')),
  name text not null check (length(btrim(name)) between 1 and 120),
  description text,
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, workspace_id),
  foreign key (workspace_id, owner_user_id)
    references public.workspace_members(workspace_id, user_id) on delete restrict
);

create table public.preference_study_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  revision bigint not null default 1 check (revision >= 1),
  status text not null default 'draft' check (status in (
    'draft', 'collecting_evidence', 'ready_to_study', 'studying',
    'needs_clarification', 'evidence_ready', 'dna_ready', 'qa_blocked',
    'needs_user_review', 'approved', 'applied', 'archived', 'failed'
  )),
  title text not null check (length(btrim(title)) between 1 and 160),
  record_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, edit_reference_id, workspace_id),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict
);

create table public.preference_study_messages (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  sequence bigint not null check (sequence >= 1),
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null check (length(btrim(content)) between 1 and 100000),
  content_digest text not null check (content_digest ~ '^[a-f0-9]{64}$'),
  client_message_id text,
  reasoning_attempt_id uuid,
  runtime_source text not null,
  created_at timestamptz not null default clock_timestamp(),
  unique (id, study_session_id, edit_reference_id, workspace_id),
  unique (study_session_id, sequence),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict
);

create table public.preference_evidence (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  revision bigint not null default 1 check (revision >= 1),
  content_digest text not null check (content_digest ~ '^[a-f0-9]{64}$'),
  evidence_type text not null,
  evidence_json jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  unique (id, study_session_id, edit_reference_id, workspace_id),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict
);

create table public.preference_assets (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  storage_object_id text not null check (length(storage_object_id) between 1 and 500),
  storage_generation text not null check (length(storage_generation) between 1 and 160),
  storage_etag text not null check (length(storage_etag) between 1 and 240),
  checksum_sha256 text not null check (checksum_sha256 ~ '^[a-f0-9]{64}$'),
  asset_kind text not null check (asset_kind in ('source', 'proxy', 'analysis', 'approved_preview', 'work_output')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp(),
  unique (id, study_session_id, edit_reference_id, workspace_id),
  unique (workspace_id, storage_object_id, storage_generation),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict
);

create table public.preference_study_reasoning_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  actor_user_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  study_revision bigint not null check (study_revision >= 1),
  user_message_id uuid not null,
  saved_direction_evidence_id uuid not null,
  client_message_digest text not null check (client_message_digest ~ '^[a-f0-9]{64}$'),
  structured_context_digest text not null check (structured_context_digest ~ '^[a-f0-9]{64}$'),
  route_contract_version text not null check (route_contract_version = 'reeditpro-reasoning-model-route-v1-kimi-qwen-deepseek'),
  approved_usage_estimate_id text not null,
  internal_cost_budget_id text not null,
  rate_card_snapshot_id text not null,
  maximum_authorized_internal_cost_micros bigint not null check (maximum_authorized_internal_cost_micros >= 0),
  reservation_idempotency_key_digest text not null check (reservation_idempotency_key_digest ~ '^[a-f0-9]{64}$'),
  canonical_request_hash text not null check (canonical_request_hash ~ '^[a-f0-9]{64}$'),
  durable_response_digest text,
  revision bigint not null default 1 check (revision >= 1),
  status text not null default 'reserved' check (status in ('reserved', 'running', 'waiting', 'completed', 'failed', 'cancelled')),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, study_session_id, edit_reference_id, workspace_id),
  unique (workspace_id, actor_user_id, reservation_idempotency_key_digest),
  foreign key (workspace_id, actor_user_id)
    references public.workspace_members(workspace_id, user_id) on delete restrict,
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (user_message_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_messages(id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (saved_direction_evidence_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_evidence(id, study_session_id, edit_reference_id, workspace_id) on delete restrict
);

create table public.preference_study_reasoning_route_attempts (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  reasoning_run_id uuid not null,
  attempt_ordinal integer not null check (attempt_ordinal between 1 and 3),
  revision bigint not null default 1 check (revision >= 1),
  status text not null default 'authorized' check (status in ('authorized', 'submitted', 'waiting', 'completed', 'failed', 'unknown', 'cancelled')),
  route_id text not null check (route_id in ('kimi_k3_primary', 'qwen_3_7_fallback', 'deepseek_v4_pro_fallback')),
  route_authorization_digest text not null check (route_authorization_digest ~ '^[a-f0-9]{64}$'),
  request_digest text not null check (request_digest ~ '^[a-f0-9]{64}$'),
  entry_fallback_trigger text,
  terminal_outcome text,
  terminal_fallback_trigger text,
  usage_digest text,
  provider_cost_digest text,
  infrastructure_cost_digest text,
  fx_snapshot_digest text,
  internal_cost_micros bigint,
  failure_code text,
  started_at timestamptz,
  terminal_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  unique (id, study_session_id, edit_reference_id, workspace_id),
  unique (reasoning_run_id, attempt_ordinal),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (reasoning_run_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_reasoning_runs(id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  check (internal_cost_micros is null or internal_cost_micros >= 0),
  check (
    (status in ('completed', 'failed', 'unknown', 'cancelled') and terminal_at is not null and terminal_outcome is not null)
    or status not in ('completed', 'failed', 'unknown', 'cancelled')
  )
);

create table public.preference_study_reasoning_provider_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  reasoning_run_id uuid not null,
  route_attempt_id uuid not null,
  provider_boundary text not null,
  provider_model_id text not null,
  provider_model_revision text not null,
  provider_request_id_digest text,
  submission_idempotency_key_digest text not null check (submission_idempotency_key_digest ~ '^[a-f0-9]{64}$'),
  one_use_submission_authority_digest text not null check (one_use_submission_authority_digest ~ '^[a-f0-9]{64}$'),
  revision bigint not null default 1 check (revision >= 1),
  status text not null default 'reserved' check (status in ('reserved', 'submitted', 'observed', 'terminal', 'unknown')),
  provider_call_may_have_occurred boolean not null default false,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, study_session_id, edit_reference_id, workspace_id),
  unique (route_attempt_id),
  unique (provider_boundary, submission_idempotency_key_digest),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (reasoning_run_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_reasoning_runs(id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (route_attempt_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_reasoning_route_attempts(id, study_session_id, edit_reference_id, workspace_id) on delete restrict
);

create table public.preference_study_reasoning_provider_observations (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  reasoning_run_id uuid not null,
  route_attempt_id uuid not null,
  provider_request_id uuid not null,
  observation_id_digest text not null check (observation_id_digest ~ '^[a-f0-9]{64}$'),
  observation_digest text not null check (observation_digest ~ '^[a-f0-9]{64}$'),
  status text not null,
  provider_usage_digest text,
  result_digest text,
  observed_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  unique (id, study_session_id, edit_reference_id, workspace_id),
  unique (provider_request_id, observation_id_digest),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (reasoning_run_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_reasoning_runs(id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (route_attempt_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_reasoning_route_attempts(id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (provider_request_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_reasoning_provider_requests(id, study_session_id, edit_reference_id, workspace_id) on delete restrict
);

create table public.preference_study_reasoning_checkbacks (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  reasoning_run_id uuid not null,
  route_attempt_id uuid not null,
  provider_request_id uuid not null,
  workflow_id text not null,
  revision bigint not null default 1 check (revision >= 1),
  status text not null default 'scheduled' check (status in ('scheduled', 'leased', 'waiting', 'completed', 'cancelled', 'expired')),
  lookup_attempt_count integer not null default 0 check (lookup_attempt_count >= 0),
  lease_owner_digest text,
  lease_token_digest text,
  lease_expires_at timestamptz,
  next_check_at timestamptz not null,
  deadline_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, study_session_id, edit_reference_id, workspace_id),
  unique (provider_request_id),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (reasoning_run_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_reasoning_runs(id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (route_attempt_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_reasoning_route_attempts(id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (provider_request_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_reasoning_provider_requests(id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  check (deadline_at > next_check_at),
  check (
    (status = 'leased' and lease_owner_digest ~ '^[a-f0-9]{64}$' and lease_token_digest ~ '^[a-f0-9]{64}$' and lease_expires_at is not null)
    or status <> 'leased'
  )
);

create table public.preference_study_reasoning_run_receipts (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  reasoning_run_id uuid not null,
  assistant_message_id uuid not null,
  request_digest text not null check (request_digest ~ '^[a-f0-9]{64}$'),
  route_attempt_set_digest text not null check (route_attempt_set_digest ~ '^[a-f0-9]{64}$'),
  cost_aggregate_digest text not null check (cost_aggregate_digest ~ '^[a-f0-9]{64}$'),
  failed_attempt_count integer not null check (failed_attempt_count >= 0),
  normalized_internal_cost_micros bigint not null check (normalized_internal_cost_micros >= 0),
  maximum_unverified_exposure_micros bigint not null check (maximum_unverified_exposure_micros >= 0),
  terminal_state text not null check (terminal_state in ('completed', 'failed', 'cancelled')),
  final_result_digest text not null check (final_result_digest ~ '^[a-f0-9]{64}$'),
  receipt_digest text not null check (receipt_digest ~ '^[a-f0-9]{64}$'),
  settled_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  unique (id, study_session_id, edit_reference_id, workspace_id),
  unique (reasoning_run_id),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (reasoning_run_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_reasoning_runs(id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (assistant_message_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_messages(id, study_session_id, edit_reference_id, workspace_id) on delete restrict
);

create table public.preference_long_form_study_plans (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  source_asset_id uuid not null,
  plan_version bigint not null check (plan_version >= 1),
  plan_digest text not null check (plan_digest ~ '^[a-f0-9]{64}$'),
  source_checksum_sha256 text not null check (source_checksum_sha256 ~ '^[a-f0-9]{64}$'),
  rate_card_snapshot_digest text not null check (rate_card_snapshot_digest ~ '^[a-f0-9]{64}$'),
  maximum_authorized_internal_cost_micros bigint not null check (maximum_authorized_internal_cost_micros >= 0),
  currency text not null check (currency = 'USD'),
  study_usage_approval_status text not null check (study_usage_approval_status in ('pending', 'approved', 'revoked')),
  plan_json jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  unique (id, study_session_id, edit_reference_id, workspace_id),
  unique (study_session_id, plan_version),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (source_asset_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_assets(id, study_session_id, edit_reference_id, workspace_id) on delete restrict
);

create table public.preference_long_form_study_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  study_plan_id uuid not null,
  revision bigint not null default 1 check (revision >= 1),
  status text not null default 'queued' check (status in ('queued', 'running', 'paused', 'completed', 'failed', 'cancelled')),
  recovery_generation bigint not null default 0 check (recovery_generation >= 0),
  pause_requested_at timestamptz,
  cancel_requested_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, study_session_id, edit_reference_id, workspace_id),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (study_plan_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_long_form_study_plans(id, study_session_id, edit_reference_id, workspace_id) on delete restrict
);

create table public.preference_long_form_study_work_items (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  study_plan_id uuid not null,
  study_run_id uuid not null,
  sequence bigint not null check (sequence >= 1),
  work_type text not null,
  dependency_digest text not null check (dependency_digest ~ '^[a-f0-9]{64}$'),
  dependency_sequences bigint[] not null default '{}'::bigint[],
  dependency_ids uuid[] not null default '{}'::uuid[],
  idempotency_key_hash text not null check (idempotency_key_hash ~ '^[a-f0-9]{64}$'),
  status text not null default 'queued' check (status in ('queued', 'leased', 'running', 'paused', 'completed', 'failed', 'cancelled', 'blocked')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  lease_owner_digest text,
  lease_token_digest text,
  lease_expires_at timestamptz,
  checkpoint_sequence bigint not null default 0 check (checkpoint_sequence >= 0),
  maximum_authorized_internal_cost_micros bigint not null check (maximum_authorized_internal_cost_micros >= 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, study_run_id, study_plan_id, study_session_id, edit_reference_id, workspace_id),
  unique (study_run_id, sequence),
  unique (study_run_id, idempotency_key_hash),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (study_plan_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_long_form_study_plans(id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (study_run_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_long_form_study_runs(id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  check (
    (status in ('leased', 'running') and lease_owner_digest ~ '^[a-f0-9]{64}$' and lease_token_digest ~ '^[a-f0-9]{64}$' and lease_expires_at is not null)
    or status not in ('leased', 'running')
  )
);

create table public.preference_long_form_study_attempts (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  study_plan_id uuid not null,
  study_run_id uuid not null,
  study_work_item_id uuid not null,
  attempt_number integer not null check (attempt_number >= 1),
  status text not null check (status in ('completed', 'failed', 'cancelled', 'unknown')),
  usage_digest text not null check (usage_digest ~ '^[a-f0-9]{64}$'),
  provider_cost_micros bigint not null default 0 check (provider_cost_micros >= 0),
  infrastructure_cost_micros bigint not null default 0 check (infrastructure_cost_micros >= 0),
  internal_cost_micros bigint not null check (internal_cost_micros >= 0),
  currency text not null check (currency = 'USD'),
  failure_class text,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  unique (id, study_run_id, study_plan_id, study_session_id, edit_reference_id, workspace_id),
  unique (study_work_item_id, attempt_number),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (study_plan_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_long_form_study_plans(id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (study_run_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_long_form_study_runs(id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (study_work_item_id, study_run_id, study_plan_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_long_form_study_work_items(id, study_run_id, study_plan_id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  check (finished_at >= started_at),
  check (internal_cost_micros = provider_cost_micros + infrastructure_cost_micros)
);

create table public.preference_long_form_study_checkpoints (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  study_plan_id uuid not null,
  study_run_id uuid not null,
  study_work_item_id uuid not null,
  study_attempt_id uuid not null,
  sequence bigint not null check (sequence >= 1),
  checkpoint_digest text not null check (checkpoint_digest ~ '^[a-f0-9]{64}$'),
  completed_unit_count bigint not null check (completed_unit_count >= 0),
  heartbeat_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  unique (id, study_run_id, study_plan_id, study_session_id, edit_reference_id, workspace_id),
  unique (study_work_item_id, sequence),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (study_plan_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_long_form_study_plans(id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (study_run_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_long_form_study_runs(id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (study_work_item_id, study_run_id, study_plan_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_long_form_study_work_items(id, study_run_id, study_plan_id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (study_attempt_id, study_run_id, study_plan_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_long_form_study_attempts(id, study_run_id, study_plan_id, study_session_id, edit_reference_id, workspace_id) on delete restrict
);

create table public.preference_long_form_study_work_outputs (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  study_plan_id uuid not null,
  study_run_id uuid not null,
  study_work_item_id uuid not null,
  study_attempt_id uuid not null,
  output_type text not null,
  output_digest text not null check (output_digest ~ '^[a-f0-9]{64}$'),
  storage_object_id text not null,
  storage_generation text not null,
  storage_etag text not null,
  checksum_sha256 text not null check (checksum_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default clock_timestamp(),
  unique (id, study_run_id, study_plan_id, study_session_id, edit_reference_id, workspace_id),
  unique (study_work_item_id),
  unique (workspace_id, storage_object_id, storage_generation),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (study_plan_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_long_form_study_plans(id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (study_run_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_long_form_study_runs(id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (study_work_item_id, study_run_id, study_plan_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_long_form_study_work_items(id, study_run_id, study_plan_id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (study_attempt_id, study_run_id, study_plan_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_long_form_study_attempts(id, study_run_id, study_plan_id, study_session_id, edit_reference_id, workspace_id) on delete restrict
);

-- Durable in-flight checkpoint authority. Terminal completion copies these
-- immutable rows into the V6 attempt-bound checkpoint table in one transaction.
create table public.preference_long_form_study_checkpoint_authority (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  study_plan_id uuid not null,
  study_run_id uuid not null,
  study_work_item_id uuid not null,
  sequence bigint not null check (sequence >= 1),
  checkpoint_digest text not null check (checkpoint_digest ~ '^[a-f0-9]{64}$'),
  completed_unit_count bigint not null check (completed_unit_count >= 0),
  heartbeat_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  unique (study_work_item_id, sequence),
  foreign key (study_work_item_id, study_run_id, study_plan_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_long_form_study_work_items(id, study_run_id, study_plan_id, study_session_id, edit_reference_id, workspace_id) on delete restrict
);

create table public.preference_skill_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  skill_id text not null,
  attempt integer not null check (attempt >= 1),
  status text not null,
  result_digest text not null check (result_digest ~ '^[a-f0-9]{64}$'),
  internal_cost_micros bigint not null default 0 check (internal_cost_micros >= 0),
  created_at timestamptz not null default clock_timestamp(),
  unique (id, study_session_id, edit_reference_id, workspace_id),
  unique (study_session_id, skill_id, attempt),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict
);

create table public.preference_dna_versions (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  version bigint not null check (version >= 1),
  content_digest text not null check (content_digest ~ '^[a-f0-9]{64}$'),
  status text not null check (status in ('draft', 'review_required', 'approved', 'superseded')),
  approval_id text,
  record_json jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  unique (id, study_session_id, edit_reference_id, workspace_id),
  unique (study_session_id, version),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict
);

create table public.preference_dna_qa_results (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  dna_version_id uuid not null,
  dna_content_digest text not null check (dna_content_digest ~ '^[a-f0-9]{64}$'),
  status text not null check (status in ('passed', 'blocked', 'requires_user_review')),
  result_digest text not null check (result_digest ~ '^[a-f0-9]{64}$'),
  record_json jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  unique (id, study_session_id, edit_reference_id, workspace_id),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (dna_version_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_dna_versions(id, study_session_id, edit_reference_id, workspace_id) on delete restrict
);

create table public.preference_applications (
  id uuid primary key,
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  dna_version_id uuid not null,
  dna_qa_result_id uuid not null,
  project_id uuid not null,
  edit_session_id uuid not null,
  version bigint not null check (version >= 1),
  content_digest text not null check (content_digest ~ '^[a-f0-9]{64}$'),
  context_hash text not null check (context_hash ~ '^[a-f0-9]{64}$'),
  target_understanding_package_digest text not null check (target_understanding_package_digest ~ '^[a-f0-9]{64}$'),
  status text not null check (status in ('prepared', 'replaced', 'cleared')),
  connection_state text not null default 'not_connected' check (connection_state in ('not_connected', 'connected', 'invalidated')),
  runtime_source text not null check (runtime_source in ('verified_mock', 'verified_local', 'verified_live')),
  record_json jsonb not null,
  replaces_application_id uuid,
  replaced_by_application_id uuid,
  connected_at timestamptz,
  cleared_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, edit_session_id, project_id, workspace_id),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (dna_version_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_dna_versions(id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (dna_qa_result_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_dna_qa_results(id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (project_id, workspace_id)
    references public.projects(id, workspace_id) on delete restrict,
  foreign key (edit_session_id, project_id, workspace_id)
    references public.edit_sessions(id, project_id, workspace_id) on delete restrict
);

create unique index preference_applications_one_connected_per_exact_edit
  on public.preference_applications(workspace_id, project_id, edit_session_id)
  where connection_state = 'connected';

create table public.preference_usage_events (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  event_type text not null,
  event_digest text not null check (event_digest ~ '^[a-f0-9]{64}$'),
  event_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp(),
  unique (id, edit_reference_id, workspace_id),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict
);

create table public.preference_audit_segments (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  first_sequence bigint not null check (first_sequence >= 1),
  last_sequence bigint not null check (last_sequence >= first_sequence),
  event_count bigint not null check (event_count = last_sequence - first_sequence + 1),
  content_digest text not null check (content_digest ~ '^[a-f0-9]{64}$'),
  previous_segment_digest text,
  created_at timestamptz not null default clock_timestamp(),
  unique (id, edit_reference_id, workspace_id),
  unique (edit_reference_id, first_sequence, last_sequence),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict
);

create table public.preference_application_plan_invalidations (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null,
  edit_session_id uuid not null,
  preference_application_id uuid not null,
  edit_plan_version_id uuid,
  application_content_digest text not null check (application_content_digest ~ '^[a-f0-9]{64}$'),
  context_hash text not null check (context_hash ~ '^[a-f0-9]{64}$'),
  reason text not null,
  execution_authorization_revoked boolean not null,
  invalidated_at timestamptz not null default clock_timestamp(),
  unique (id, edit_session_id, project_id, workspace_id),
  foreign key (preference_application_id, edit_session_id, project_id, workspace_id)
    references public.preference_applications(id, edit_session_id, project_id, workspace_id) on delete restrict,
  foreign key (edit_plan_version_id, edit_session_id, project_id, workspace_id)
    references public.edit_plan_versions(id, edit_session_id, project_id, workspace_id) on delete restrict,
  foreign key (edit_session_id, project_id, workspace_id)
    references public.edit_sessions(id, project_id, workspace_id) on delete restrict
);

create table public.edit_reference_idempotency_receipts (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  actor_user_id uuid not null,
  operation text not null,
  idempotency_key_hash text not null check (idempotency_key_hash ~ '^[a-f0-9]{64}$'),
  request_hash text not null check (request_hash ~ '^[a-f0-9]{64}$'),
  status text not null check (status in ('reserved', 'completed', 'failed', 'unknown')),
  response_digest text,
  response_json jsonb,
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  unique (workspace_id, actor_user_id, operation, idempotency_key_hash),
  foreign key (workspace_id, actor_user_id)
    references public.workspace_members(workspace_id, user_id) on delete restrict,
  check (expires_at > created_at),
  check (
    (status = 'completed' and response_digest ~ '^[a-f0-9]{64}$' and response_json is not null)
    or status <> 'completed'
  )
);

create table public.preference_application_lifecycle_events (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null,
  edit_session_id uuid not null,
  edit_reference_id uuid not null,
  application_id uuid not null,
  mutation text not null check (mutation in ('apply', 'replace', 'remove')),
  committed_reference_revision bigint not null check (committed_reference_revision >= 2),
  committed_planning_input_revision bigint not null check (committed_planning_input_revision >= 1),
  request_digest_sha256 text not null check (request_digest_sha256 ~ '^[a-f0-9]{64}$'),
  receipt_digest_sha256 text not null check (receipt_digest_sha256 ~ '^[a-f0-9]{64}$'),
  request_json jsonb not null,
  receipt_json jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  unique (id, edit_session_id, project_id, workspace_id),
  unique (workspace_id, project_id, edit_session_id, committed_planning_input_revision),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (application_id, edit_session_id, project_id, workspace_id)
    references public.preference_applications(id, edit_session_id, project_id, workspace_id) on delete restrict
);

alter table public.exact_edit_preference_states
  add foreign key (current_application_id, edit_session_id, project_id, workspace_id)
    references public.preference_applications(id, edit_session_id, project_id, workspace_id) on delete restrict;

alter table public.edit_plan_versions
  add foreign key (preference_application_id, edit_session_id, project_id, workspace_id)
    references public.preference_applications(id, edit_session_id, project_id, workspace_id) on delete restrict;

alter table public.approved_plan_snapshots
  add foreign key (preference_application_id, edit_session_id, project_id, workspace_id)
    references public.preference_applications(id, edit_session_id, project_id, workspace_id) on delete restrict;

alter table public.edit_execution_authorizations
  add foreign key (preference_application_id, edit_session_id, project_id, workspace_id)
    references public.preference_applications(id, edit_session_id, project_id, workspace_id) on delete restrict;

create index edit_references_workspace_lookup on public.edit_references(workspace_id, updated_at desc);
create index preference_study_sessions_reference_lookup on public.preference_study_sessions(workspace_id, edit_reference_id, updated_at desc);
create index preference_study_messages_session_lookup on public.preference_study_messages(workspace_id, study_session_id, sequence);
create index preference_evidence_session_lookup on public.preference_evidence(workspace_id, study_session_id, revision);
create index preference_reasoning_runs_status_lookup on public.preference_study_reasoning_runs(workspace_id, status, updated_at);
create index preference_reasoning_attempts_run_lookup on public.preference_study_reasoning_route_attempts(reasoning_run_id, attempt_ordinal);
create index preference_reasoning_checkbacks_due_lookup on public.preference_study_reasoning_checkbacks(status, next_check_at);
create index preference_long_form_work_claim_lookup on public.preference_long_form_study_work_items(status, lease_expires_at, sequence);
create index preference_applications_exact_edit_lookup on public.preference_applications(workspace_id, project_id, edit_session_id, created_at desc);
create index edit_reference_idempotency_expiry_lookup on public.edit_reference_idempotency_receipts(expires_at);
