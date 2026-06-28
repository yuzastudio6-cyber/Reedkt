-- ReEditPro tool cost metering events.
-- Created for the backend tool cost metering skeleton.
-- Do not run against production until local/staging migration, RLS, and billing-owner review pass.

create table if not exists public.tool_cost_events (
  id text primary key,
  idempotency_key text not null unique,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id text,
  job_id text,
  job_batch_id text,
  generation_request_id text,
  render_job_id text,
  credit_estimate_id text,
  credit_reservation_id text,
  tool_id text not null,
  tool_name text not null,
  usage_category text not null,
  provider_type text not null,
  provider_name text,
  model_name text,
  quality_level text not null,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  wall_clock_ms integer not null,
  billable_ms integer not null,
  vcpu_count numeric not null default 0,
  memory_gib numeric not null default 0,
  gpu_type text,
  gpu_count integer not null default 0,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  input_video_seconds numeric not null default 0,
  output_video_seconds numeric not null default 0,
  input_audio_seconds numeric not null default 0,
  output_audio_seconds numeric not null default 0,
  image_count integer not null default 0,
  render_duration_seconds numeric not null default 0,
  output_resolution text,
  output_frame_rate numeric not null default 0,
  rate_card_version text not null,
  pricing_snapshot jsonb not null default '{}'::jsonb,
  estimated_internal_cost_cents integer not null default 0,
  actual_internal_cost_cents integer not null default 0,
  actual_internal_cost_micros bigint not null default 0,
  tool_cost_credits integer not null default 0,
  retry_attempt integer not null default 0,
  retry_reason text,
  failure_category text not null default 'none',
  billable_to_user boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint tool_cost_events_id_nonempty check (length(trim(id)) > 0),
  constraint tool_cost_events_idempotency_key_nonempty check (length(trim(idempotency_key)) > 0),
  constraint tool_cost_events_tool_id_nonempty check (length(trim(tool_id)) > 0),
  constraint tool_cost_events_tool_name_nonempty check (length(trim(tool_name)) > 0),
  constraint tool_cost_events_wall_clock_nonnegative check (wall_clock_ms >= 0),
  constraint tool_cost_events_billable_ms_nonnegative check (billable_ms >= 0),
  constraint tool_cost_events_gpu_count_nonnegative check (gpu_count >= 0),
  constraint tool_cost_events_cost_nonnegative check (actual_internal_cost_cents >= 0 and actual_internal_cost_micros >= 0 and tool_cost_credits >= 0),
  constraint tool_cost_events_completed_after_started check (completed_at >= started_at)
);

comment on table public.tool_cost_events is
'Append-only internal tool cost event records. ReEditPro service/edit fees are excluded; production user billing requires separate wallet/ledger owner approval.';

comment on column public.tool_cost_events.idempotency_key is
'Backend idempotency key. Duplicate writes must replay the first event and must not double-charge.';

comment on column public.tool_cost_events.pricing_snapshot is
'Sanitized static rate-card snapshot. Must never contain secrets, raw prompts, service-role keys, API keys, or signed URLs.';

comment on column public.tool_cost_events.metadata is
'Sanitized execution metadata. Must never contain secrets, raw prompts, service-role keys, API keys, or signed URLs.';

create index if not exists idx_tool_cost_events_workspace_project_started
  on public.tool_cost_events(workspace_id, project_id, started_at);

create index if not exists idx_tool_cost_events_tool_id_started
  on public.tool_cost_events(tool_id, started_at);

create index if not exists idx_tool_cost_events_credit_reservation
  on public.tool_cost_events(credit_reservation_id)
  where credit_reservation_id is not null;

alter table public.tool_cost_events enable row level security;

drop policy if exists "tool_cost_events_select_workspace_member" on public.tool_cost_events;

create policy "tool_cost_events_select_workspace_member" on public.tool_cost_events
for select to authenticated
using (public.is_workspace_member(workspace_id) and public.is_project_member(project_id));

-- Inserts are intentionally service-role/backend only. No authenticated insert/update/delete policy is created.;
