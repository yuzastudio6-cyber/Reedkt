create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  create type public.job_batch_status as enum (
    'draft',
    'queued',
    'running',
    'waiting_dependency',
    'waiting_user_input',
    'waiting_user_approval',
    'waiting_credit_reservation',
    'completed',
    'failed',
    'cancelled',
    'retrying'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.job_status as enum (
    'draft',
    'queued',
    'running',
    'waiting_dependency',
    'waiting_user_input',
    'waiting_user_approval',
    'waiting_credit_reservation',
    'completed',
    'failed',
    'cancelled',
    'retrying',
    'blocked'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.job_type as enum (
    'chat_context_collection',
    'transcription',
    'media_analysis',
    'frame_extraction',
    'scene_detection',
    'audio_analysis',
    'reference_analysis',
    'source_sequence_mapping',
    'intent_analysis',
    'edit_quality_planning',
    'pacing_analysis',
    'transition_planning',
    'audio_environment_analysis',
    'music_planning',
    'sfx_planning',
    'caption_planning',
    'signature_investigation',
    'stroke_motion_planning',
    'credit_estimation',
    'credit_reservation',
    'generation_orchestration',
    'generation',
    'stroke_motion_generation',
    'graphic_design_generation',
    'real_motion_generation',
    'soundsync_generation',
    'render_preview',
    'quality_check',
    'preview_delivery',
    'export',
    'revision_planning',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.agent_type as enum (
    'chat_intent_agent',
    'media_analysis_agent',
    'source_sequence_agent',
    'edit_quality_agent',
    'pacing_agent',
    'transition_agent',
    'audio_environment_agent',
    'music_supervisor_agent',
    'sfx_agent',
    'caption_agent',
    'signature_investigation_agent',
    'stroke_motion_story_agent',
    'credit_estimation_agent',
    'generation_orchestrator',
    'stroke_motion_generation_worker',
    'graphic_design_worker',
    'real_motion_worker',
    'soundsync_worker',
    'render_worker',
    'quality_check_agent',
    'human_editor',
    'system',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.worker_runtime_type as enum (
    'frontend_mock',
    'backend_api',
    'supabase_edge_function',
    'cloud_run_service',
    'cloud_run_job',
    'gpu_worker',
    'google_cloud_shell_manual',
    'external_ai_provider',
    'human',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.job_priority as enum (
    'low',
    'normal',
    'high',
    'urgent'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.job_event_type as enum (
    'created',
    'queued',
    'started',
    'progress',
    'waiting_dependency',
    'waiting_user_input',
    'waiting_user_approval',
    'waiting_credit_reservation',
    'completed',
    'failed',
    'cancelled',
    'retry_scheduled',
    'retried',
    'blocked',
    'unblocked',
    'output_created',
    'note_added'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.agent_run_status as enum (
    'queued',
    'running',
    'completed',
    'failed',
    'cancelled',
    'retrying'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.agent_output_type as enum (
    'intent_analysis',
    'source_sequence_map',
    'reference_dna',
    'edit_quality_profile',
    'pacing_analysis',
    'cut_decisions',
    'transition_plan',
    'audio_environment_analysis',
    'music_plan',
    'sfx_plan',
    'caption_plan',
    'signature_routes',
    'stroke_motion_plan',
    'credit_estimate',
    'generation_spec',
    'render_instruction',
    'quality_check',
    'chat_message',
    'inline_chat_card',
    'worker_note',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.event_actor_type as enum (
    'user',
    'assistant',
    'agent',
    'worker',
    'system',
    'admin'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.event_type as enum (
    'project_created',
    'chat_message_created',
    'clip_attached',
    'source_sequence_created',
    'analysis_started',
    'intent_detected',
    'edit_plan_created',
    'credit_estimate_created',
    'credit_approved',
    'credit_reserved',
    'job_batch_created',
    'job_created',
    'job_started',
    'job_completed',
    'job_failed',
    'agent_run_started',
    'agent_run_completed',
    'agent_run_failed',
    'generation_started',
    'render_started',
    'preview_ready',
    'revision_requested',
    'export_ready',
    'credits_refunded',
    'manual_note_added',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.job_failure_category as enum (
    'none',
    'input_missing',
    'dependency_failed',
    'user_cancelled',
    'credit_not_approved',
    'credit_not_reserved',
    'provider_error',
    'timeout',
    'validation_failed',
    'worker_error',
    'render_error',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

create table public.job_batches (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  edit_plan_id uuid references public.edit_plans(id) on delete set null,
  credit_estimate_id uuid references public.credit_estimates(id) on delete set null,
  credit_reservation_id uuid references public.credit_reservations(id) on delete set null,
  status public.job_batch_status not null default 'draft',
  batch_name text,
  batch_purpose text,
  current_stage text,
  progress_percent numeric not null default 0,
  priority public.job_priority not null default 'normal',
  created_by_user_id uuid references public.user_profiles(id) on delete set null,
  created_by_agent text,
  idempotency_key text,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_batches_progress_percent_range check (progress_percent >= 0 and progress_percent <= 100)
);

comment on table public.job_batches is
'Coordinated ReeditPro AI editing workflow batch, such as planning, generation, rendering, revision, or preview delivery orchestration.';
comment on column public.job_batches.status is
'Batch-level orchestration status. Waiting states make approval and credit reservation blockers explicit.';
comment on column public.job_batches.credit_reservation_id is
'Credit reservation associated with generation-capable batches. Future workers must verify approval and reserved credits before expensive work.';

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  job_batch_id uuid references public.job_batches(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  chat_message_id uuid references public.chat_messages(id) on delete set null,
  edit_plan_id uuid references public.edit_plans(id) on delete set null,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete set null,
  credit_estimate_id uuid references public.credit_estimates(id) on delete set null,
  credit_reservation_id uuid references public.credit_reservations(id) on delete set null,
  job_type public.job_type not null,
  status public.job_status not null default 'queued',
  priority public.job_priority not null default 'normal',
  worker_target public.agent_type not null default 'system',
  runtime_type public.worker_runtime_type not null default 'backend_api',
  job_name text,
  job_description text,
  depends_on_all boolean not null default true,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb not null default '{}'::jsonb,
  error_payload jsonb not null default '{}'::jsonb,
  failure_category public.job_failure_category not null default 'none',
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  idempotency_key text,
  lock_key text,
  locked_by text,
  locked_at timestamptz,
  scheduled_for timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  cancelled_at timestamptz,
  last_heartbeat_at timestamptz,
  progress_percent numeric not null default 0,
  progress_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_attempt_count_nonnegative check (attempt_count >= 0),
  constraint jobs_max_attempts_positive check (max_attempts >= 1),
  constraint jobs_progress_percent_range check (progress_percent >= 0 and progress_percent <= 100)
);

comment on table public.jobs is
'Individual units of ReeditPro AI/editor work. Generation and render jobs must wait for approved edit plans and reserved credits.';
comment on column public.jobs.status is
'Job lifecycle state, including waiting_dependency, waiting_user_approval, and waiting_credit_reservation blockers.';
comment on column public.jobs.depends_on_all is
'When true, all dependency rows must satisfy their required status before the job may run.';
comment on column public.jobs.credit_reservation_id is
'Reservation that gates expensive generation/rendering work. Future workers must not run generation without reserved credits.';
comment on column public.jobs.idempotency_key is
'Caller-provided idempotency key for safe retries and duplicate prevention.';
comment on column public.jobs.error_payload is
'Structured error details for failed or blocked jobs. Do not store credentials, provider secrets, or signed URLs.';

create table public.job_dependencies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  depends_on_job_id uuid not null references public.jobs(id) on delete cascade,
  dependency_reason text,
  required_status public.job_status not null default 'completed',
  created_at timestamptz not null default now(),
  constraint job_dependencies_not_self check (job_id <> depends_on_job_id),
  unique (job_id, depends_on_job_id)
);

comment on table public.job_dependencies is
'Directed dependency graph between ReeditPro jobs. Workers should not run jobs until dependencies reach the required status.';
comment on column public.job_dependencies.required_status is
'Required upstream job status before the dependent job can run.';

create table public.job_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  job_batch_id uuid references public.job_batches(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  event_type public.job_event_type not null,
  message text,
  progress_percent numeric,
  actor_type public.event_actor_type not null default 'system',
  actor_user_id uuid references public.user_profiles(id) on delete set null,
  actor_agent_type public.agent_type,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint job_events_progress_percent_range check (
    progress_percent is null or (progress_percent >= 0 and progress_percent <= 100)
  )
);

comment on table public.job_events is
'Append-style timeline of what happened during individual job orchestration.';
comment on column public.job_events.payload is
'Structured event payload for orchestration details. Do not store credentials, provider secrets, or signed URLs.';

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade,
  job_batch_id uuid references public.job_batches(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  edit_plan_id uuid references public.edit_plans(id) on delete set null,
  agent_type public.agent_type not null,
  runtime_type public.worker_runtime_type not null default 'backend_api',
  status public.agent_run_status not null default 'queued',
  model_name text,
  provider_name text,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb not null default '{}'::jsonb,
  error_payload jsonb not null default '{}'::jsonb,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  estimated_cost_cents integer,
  execution_time_ms integer,
  idempotency_key text,
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agent_runs_prompt_tokens_nonnegative check (prompt_tokens is null or prompt_tokens >= 0),
  constraint agent_runs_completion_tokens_nonnegative check (completion_tokens is null or completion_tokens >= 0),
  constraint agent_runs_total_tokens_nonnegative check (total_tokens is null or total_tokens >= 0),
  constraint agent_runs_estimated_cost_nonnegative check (estimated_cost_cents is null or estimated_cost_cents >= 0),
  constraint agent_runs_execution_time_nonnegative check (execution_time_ms is null or execution_time_ms >= 0)
);

comment on table public.agent_runs is
'Each controlled AI agent or worker execution, with inputs, outputs, status, timing, error, and cost metadata.';
comment on column public.agent_runs.input_payload is
'Structured input summary. Workers should load trusted records server-side instead of storing secrets or full private media payloads here.';
comment on column public.agent_runs.error_payload is
'Structured failure information for retry and audit. Do not store credentials, provider secrets, or signed URLs.';

create table public.agent_outputs (
  id uuid primary key default gen_random_uuid(),
  agent_run_id uuid not null references public.agent_runs(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  job_batch_id uuid references public.job_batches(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid references public.edit_plans(id) on delete set null,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete set null,
  output_type public.agent_output_type not null,
  title text,
  summary text,
  payload jsonb not null default '{}'::jsonb,
  confidence public.planning_confidence,
  visible_to_user boolean not null default false,
  created_record_table text,
  created_record_id uuid,
  created_at timestamptz not null default now()
);

comment on table public.agent_outputs is
'Normalized outputs from controlled ReeditPro agents and workers. Outputs may point to structured records created by the run.';
comment on column public.agent_outputs.created_record_table is
'Optional table name for a structured record created by the agent run. This is an audit pointer, not a free-form execution target.';

create table public.worker_runtime_configs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  runtime_type public.worker_runtime_type not null,
  agent_type public.agent_type not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  region text,
  service_name text,
  job_name text,
  queue_name text,
  topic_name text,
  bucket_name text,
  gpu_required boolean not null default false,
  estimated_compute_class text,
  secret_reference_name text,
  config_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.worker_runtime_configs is
'Non-secret worker/runtime configuration for future backend, Supabase Edge Function, Cloud Run, GPU, external provider, or human workflows.';
comment on column public.worker_runtime_configs.secret_reference_name is
'Reference label for a future secret manager entry. Do not store API keys, service role keys, provider keys, signed URLs, or credentials in this table.';
comment on column public.worker_runtime_configs.config_payload is
'Non-secret runtime configuration only.';

create table public.worker_heartbeats (
  id uuid primary key default gen_random_uuid(),
  worker_runtime_config_id uuid references public.worker_runtime_configs(id) on delete set null,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  runtime_type public.worker_runtime_type not null,
  agent_type public.agent_type not null,
  worker_name text not null,
  status text not null default 'online',
  current_job_id uuid references public.jobs(id) on delete set null,
  last_seen_at timestamptz not null default now(),
  heartbeat_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint worker_heartbeats_status_check check (status in ('online', 'busy', 'idle', 'offline', 'error'))
);

comment on table public.worker_heartbeats is
'Last-seen worker health and status records for future background workers. This does not deploy or run workers.';
comment on column public.worker_heartbeats.heartbeat_payload is
'Non-secret heartbeat details for observability. Do not store credentials, provider secrets, or signed URLs.';

create table public.event_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  chat_message_id uuid references public.chat_messages(id) on delete set null,
  edit_plan_id uuid references public.edit_plans(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  agent_run_id uuid references public.agent_runs(id) on delete set null,
  actor_type public.event_actor_type not null default 'system',
  actor_user_id uuid references public.user_profiles(id) on delete set null,
  actor_agent_type public.agent_type,
  event_type public.event_type not null default 'other',
  event_name text,
  event_summary text,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.event_log is
'Global audit log for the ReeditPro AI editor workflow across chat, plans, credits, jobs, agent runs, previews, and future exports.';
comment on column public.event_log.event_payload is
'Structured event metadata. Do not store credentials, provider secrets, or signed URLs.';

create index job_batches_workspace_id_idx on public.job_batches (workspace_id);
create index job_batches_project_id_idx on public.job_batches (project_id);
create index job_batches_chat_session_id_idx on public.job_batches (chat_session_id);
create index job_batches_edit_plan_id_idx on public.job_batches (edit_plan_id);
create index job_batches_credit_estimate_id_idx on public.job_batches (credit_estimate_id);
create index job_batches_credit_reservation_id_idx on public.job_batches (credit_reservation_id);
create index job_batches_status_idx on public.job_batches (status);
create index job_batches_priority_idx on public.job_batches (priority);
create index job_batches_started_at_idx on public.job_batches (started_at);
create index job_batches_completed_at_idx on public.job_batches (completed_at);
create index job_batches_failed_at_idx on public.job_batches (failed_at);
create unique index job_batches_idempotency_key_uidx
on public.job_batches (idempotency_key)
where idempotency_key is not null;

create index jobs_job_batch_id_idx on public.jobs (job_batch_id);
create index jobs_workspace_id_idx on public.jobs (workspace_id);
create index jobs_project_id_idx on public.jobs (project_id);
create index jobs_chat_session_id_idx on public.jobs (chat_session_id);
create index jobs_chat_message_id_idx on public.jobs (chat_message_id);
create index jobs_edit_plan_id_idx on public.jobs (edit_plan_id);
create index jobs_edit_plan_segment_id_idx on public.jobs (edit_plan_segment_id);
create index jobs_credit_estimate_id_idx on public.jobs (credit_estimate_id);
create index jobs_credit_reservation_id_idx on public.jobs (credit_reservation_id);
create index jobs_job_type_idx on public.jobs (job_type);
create index jobs_status_idx on public.jobs (status);
create index jobs_priority_idx on public.jobs (priority);
create index jobs_worker_target_idx on public.jobs (worker_target);
create index jobs_runtime_type_idx on public.jobs (runtime_type);
create index jobs_scheduled_for_idx on public.jobs (scheduled_for);
create index jobs_locked_at_idx on public.jobs (locked_at);
create index jobs_last_heartbeat_at_idx on public.jobs (last_heartbeat_at);
create unique index jobs_idempotency_key_uidx
on public.jobs (idempotency_key)
where idempotency_key is not null;

create index job_dependencies_workspace_id_idx on public.job_dependencies (workspace_id);
create index job_dependencies_project_id_idx on public.job_dependencies (project_id);
create index job_dependencies_job_id_idx on public.job_dependencies (job_id);
create index job_dependencies_depends_on_job_id_idx on public.job_dependencies (depends_on_job_id);
create index job_dependencies_required_status_idx on public.job_dependencies (required_status);

create index job_events_job_id_idx on public.job_events (job_id);
create index job_events_job_batch_id_idx on public.job_events (job_batch_id);
create index job_events_workspace_id_idx on public.job_events (workspace_id);
create index job_events_project_id_idx on public.job_events (project_id);
create index job_events_event_type_idx on public.job_events (event_type);
create index job_events_actor_type_idx on public.job_events (actor_type);
create index job_events_actor_user_id_idx on public.job_events (actor_user_id);
create index job_events_actor_agent_type_idx on public.job_events (actor_agent_type);
create index job_events_created_at_idx on public.job_events (created_at);

create index agent_runs_job_id_idx on public.agent_runs (job_id);
create index agent_runs_job_batch_id_idx on public.agent_runs (job_batch_id);
create index agent_runs_workspace_id_idx on public.agent_runs (workspace_id);
create index agent_runs_project_id_idx on public.agent_runs (project_id);
create index agent_runs_chat_session_id_idx on public.agent_runs (chat_session_id);
create index agent_runs_edit_plan_id_idx on public.agent_runs (edit_plan_id);
create index agent_runs_agent_type_idx on public.agent_runs (agent_type);
create index agent_runs_runtime_type_idx on public.agent_runs (runtime_type);
create index agent_runs_status_idx on public.agent_runs (status);
create index agent_runs_provider_model_idx on public.agent_runs (provider_name, model_name);
create index agent_runs_started_at_idx on public.agent_runs (started_at);
create index agent_runs_completed_at_idx on public.agent_runs (completed_at);
create index agent_runs_failed_at_idx on public.agent_runs (failed_at);
create unique index agent_runs_idempotency_key_uidx
on public.agent_runs (idempotency_key)
where idempotency_key is not null;

create index agent_outputs_agent_run_id_idx on public.agent_outputs (agent_run_id);
create index agent_outputs_job_id_idx on public.agent_outputs (job_id);
create index agent_outputs_job_batch_id_idx on public.agent_outputs (job_batch_id);
create index agent_outputs_workspace_id_idx on public.agent_outputs (workspace_id);
create index agent_outputs_project_id_idx on public.agent_outputs (project_id);
create index agent_outputs_edit_plan_id_idx on public.agent_outputs (edit_plan_id);
create index agent_outputs_segment_id_idx on public.agent_outputs (edit_plan_segment_id);
create index agent_outputs_output_type_idx on public.agent_outputs (output_type);
create index agent_outputs_confidence_idx on public.agent_outputs (confidence);
create index agent_outputs_visible_to_user_idx on public.agent_outputs (visible_to_user);
create index agent_outputs_created_record_table_idx on public.agent_outputs (created_record_table);
create index agent_outputs_created_record_id_idx on public.agent_outputs (created_record_id);

create index worker_runtime_configs_workspace_id_idx on public.worker_runtime_configs (workspace_id);
create index worker_runtime_configs_runtime_type_idx on public.worker_runtime_configs (runtime_type);
create index worker_runtime_configs_agent_type_idx on public.worker_runtime_configs (agent_type);
create index worker_runtime_configs_is_active_idx on public.worker_runtime_configs (is_active);
create index worker_runtime_configs_region_idx on public.worker_runtime_configs (region);
create index worker_runtime_configs_service_name_idx on public.worker_runtime_configs (service_name);
create index worker_runtime_configs_job_name_idx on public.worker_runtime_configs (job_name);
create index worker_runtime_configs_queue_name_idx on public.worker_runtime_configs (queue_name);
create index worker_runtime_configs_topic_name_idx on public.worker_runtime_configs (topic_name);

create index worker_heartbeats_runtime_config_id_idx on public.worker_heartbeats (worker_runtime_config_id);
create index worker_heartbeats_workspace_id_idx on public.worker_heartbeats (workspace_id);
create index worker_heartbeats_runtime_type_idx on public.worker_heartbeats (runtime_type);
create index worker_heartbeats_agent_type_idx on public.worker_heartbeats (agent_type);
create index worker_heartbeats_worker_name_idx on public.worker_heartbeats (worker_name);
create index worker_heartbeats_status_idx on public.worker_heartbeats (status);
create index worker_heartbeats_current_job_id_idx on public.worker_heartbeats (current_job_id);
create index worker_heartbeats_last_seen_at_idx on public.worker_heartbeats (last_seen_at);

create index event_log_workspace_id_idx on public.event_log (workspace_id);
create index event_log_project_id_idx on public.event_log (project_id);
create index event_log_chat_session_id_idx on public.event_log (chat_session_id);
create index event_log_chat_message_id_idx on public.event_log (chat_message_id);
create index event_log_edit_plan_id_idx on public.event_log (edit_plan_id);
create index event_log_job_id_idx on public.event_log (job_id);
create index event_log_agent_run_id_idx on public.event_log (agent_run_id);
create index event_log_actor_type_idx on public.event_log (actor_type);
create index event_log_actor_user_id_idx on public.event_log (actor_user_id);
create index event_log_actor_agent_type_idx on public.event_log (actor_agent_type);
create index event_log_event_type_idx on public.event_log (event_type);
create index event_log_created_at_idx on public.event_log (created_at);

create trigger job_batches_set_updated_at
before update on public.job_batches
for each row execute function public.set_updated_at();

create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

create trigger agent_runs_set_updated_at
before update on public.agent_runs
for each row execute function public.set_updated_at();

create trigger worker_runtime_configs_set_updated_at
before update on public.worker_runtime_configs
for each row execute function public.set_updated_at();

create trigger worker_heartbeats_set_updated_at
before update on public.worker_heartbeats
for each row execute function public.set_updated_at();

create or replace view public.job_progress_view
with (security_invoker = true)
as
select
  jb.id as job_batch_id,
  jb.workspace_id,
  jb.project_id,
  jb.chat_session_id,
  jb.edit_plan_id,
  jb.status as batch_status,
  jb.progress_percent as batch_progress_percent,
  count(j.id) as total_jobs,
  count(*) filter (where j.status = 'completed') as completed_jobs,
  count(*) filter (where j.status = 'failed') as failed_jobs,
  count(*) filter (where j.status in ('queued', 'waiting_dependency', 'waiting_user_approval', 'waiting_credit_reservation')) as waiting_jobs,
  count(*) filter (where j.status = 'running') as running_jobs
from public.job_batches jb
left join public.jobs j on j.job_batch_id = jb.id
group by jb.id;

comment on view public.job_progress_view is
'Simple progress summary for job batches. The view uses security_invoker so underlying job batch/job RLS applies.';

create or replace function public.can_run_job(target_job_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.jobs j
    where j.id = target_job_id
      and j.status in ('queued', 'retrying')
      and not exists (
        select 1
        from public.job_dependencies jd
        join public.jobs dependency_job
          on dependency_job.id = jd.depends_on_job_id
        where jd.job_id = j.id
          and dependency_job.status <> jd.required_status
      )
      and (
        j.job_type not in (
          'generation_orchestration',
          'generation',
          'stroke_motion_generation',
          'graphic_design_generation',
          'real_motion_generation',
          'soundsync_generation',
          'render_preview',
          'preview_delivery',
          'export'
        )
        or (
          j.edit_plan_id is not null
          and j.credit_reservation_id is not null
          and public.can_start_generation(j.edit_plan_id)
          and exists (
            select 1
            from public.credit_reservations cr
            where cr.id = j.credit_reservation_id
              and cr.status = 'reserved'
              and (cr.expires_at is null or cr.expires_at > now())
          )
        )
      )
  );
$$;

comment on function public.can_run_job(uuid) is
'Read-only helper for future orchestration services. It checks queued/retrying status, dependencies, and approval plus credit reservation for generation/render/export-like jobs.';

alter table public.job_batches enable row level security;
alter table public.jobs enable row level security;
alter table public.job_dependencies enable row level security;
alter table public.job_events enable row level security;
alter table public.agent_runs enable row level security;
alter table public.agent_outputs enable row level security;
alter table public.worker_runtime_configs enable row level security;
alter table public.worker_heartbeats enable row level security;
alter table public.event_log enable row level security;

create policy job_batches_select_member
on public.job_batches for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy job_batches_insert_owner_admin
on public.job_batches for insert
to authenticated
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy job_batches_update_owner_admin
on public.job_batches for update
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id))
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy jobs_select_member
on public.jobs for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy jobs_insert_owner_admin
on public.jobs for insert
to authenticated
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy jobs_update_owner_admin
on public.jobs for update
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id))
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy job_dependencies_select_member
on public.job_dependencies for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy job_dependencies_insert_owner_admin
on public.job_dependencies for insert
to authenticated
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy job_dependencies_update_owner_admin
on public.job_dependencies for update
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id))
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy job_events_select_member
on public.job_events for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy job_events_insert_owner_admin
on public.job_events for insert
to authenticated
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy agent_runs_select_member
on public.agent_runs for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy agent_runs_insert_owner_admin
on public.agent_runs for insert
to authenticated
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy agent_runs_update_owner_admin
on public.agent_runs for update
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id))
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy agent_outputs_select_member
on public.agent_outputs for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy agent_outputs_insert_owner_admin
on public.agent_outputs for insert
to authenticated
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy worker_runtime_configs_select_member
on public.worker_runtime_configs for select
to authenticated
using (workspace_id is not null and public.is_workspace_member(workspace_id));

create policy worker_runtime_configs_insert_owner_admin
on public.worker_runtime_configs for insert
to authenticated
with check (workspace_id is not null and public.is_workspace_owner_or_admin(workspace_id));

create policy worker_runtime_configs_update_owner_admin
on public.worker_runtime_configs for update
to authenticated
using (workspace_id is not null and public.is_workspace_owner_or_admin(workspace_id))
with check (workspace_id is not null and public.is_workspace_owner_or_admin(workspace_id));

create policy worker_heartbeats_select_member
on public.worker_heartbeats for select
to authenticated
using (workspace_id is not null and public.is_workspace_member(workspace_id));

create policy worker_heartbeats_insert_owner_admin
on public.worker_heartbeats for insert
to authenticated
with check (workspace_id is not null and public.is_workspace_owner_or_admin(workspace_id));

create policy worker_heartbeats_update_owner_admin
on public.worker_heartbeats for update
to authenticated
using (workspace_id is not null and public.is_workspace_owner_or_admin(workspace_id))
with check (workspace_id is not null and public.is_workspace_owner_or_admin(workspace_id));

create policy event_log_select_member
on public.event_log for select
to authenticated
using (workspace_id is not null and public.is_workspace_member(workspace_id));

create policy event_log_insert_owner_admin
on public.event_log for insert
to authenticated
with check (workspace_id is not null and public.is_workspace_owner_or_admin(workspace_id));

grant usage on type public.job_batch_status to authenticated, service_role;
grant usage on type public.job_status to authenticated, service_role;
grant usage on type public.job_type to authenticated, service_role;
grant usage on type public.agent_type to authenticated, service_role;
grant usage on type public.worker_runtime_type to authenticated, service_role;
grant usage on type public.job_priority to authenticated, service_role;
grant usage on type public.job_event_type to authenticated, service_role;
grant usage on type public.agent_run_status to authenticated, service_role;
grant usage on type public.agent_output_type to authenticated, service_role;
grant usage on type public.event_actor_type to authenticated, service_role;
grant usage on type public.event_type to authenticated, service_role;
grant usage on type public.job_failure_category to authenticated, service_role;

revoke all on table public.job_batches from public, anon;
revoke all on table public.jobs from public, anon;
revoke all on table public.job_dependencies from public, anon;
revoke all on table public.job_events from public, anon;
revoke all on table public.agent_runs from public, anon;
revoke all on table public.agent_outputs from public, anon;
revoke all on table public.worker_runtime_configs from public, anon;
revoke all on table public.worker_heartbeats from public, anon;
revoke all on table public.event_log from public, anon;
revoke all on table public.job_progress_view from public, anon;

grant select, insert, update on table public.job_batches to authenticated;
grant select, insert, update on table public.jobs to authenticated;
grant select, insert, update on table public.job_dependencies to authenticated;
grant select, insert on table public.job_events to authenticated;
grant select, insert, update on table public.agent_runs to authenticated;
grant select, insert on table public.agent_outputs to authenticated;
grant select, insert, update on table public.worker_runtime_configs to authenticated;
grant select, insert, update on table public.worker_heartbeats to authenticated;
grant select, insert on table public.event_log to authenticated;
grant select on table public.job_progress_view to authenticated;

grant select, insert, update, delete on table public.job_batches to service_role;
grant select, insert, update, delete on table public.jobs to service_role;
grant select, insert, update, delete on table public.job_dependencies to service_role;
grant select, insert, update, delete on table public.job_events to service_role;
grant select, insert, update, delete on table public.agent_runs to service_role;
grant select, insert, update, delete on table public.agent_outputs to service_role;
grant select, insert, update, delete on table public.worker_runtime_configs to service_role;
grant select, insert, update, delete on table public.worker_heartbeats to service_role;
grant select, insert, update, delete on table public.event_log to service_role;
grant select on table public.job_progress_view to service_role;

revoke execute on function public.can_run_job(uuid) from public, anon;
grant execute on function public.can_run_job(uuid) to authenticated, service_role;
