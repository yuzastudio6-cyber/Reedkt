-- ReEditPro production worker artifact manifest persistence.
-- Backend/service-role-only durability for production worker runtime jobs and private output manifests.
-- This does not run tools, process media, issue signed URLs, mutate wallets, or enable production by itself.

create table if not exists public.production_worker_runtime_jobs (
  id text primary key,
  workspace_id text not null,
  project_id text not null,
  job_id text not null,
  tool_execution_plan_id text not null,
  approved_plan_snapshot_id text not null,
  credit_estimate_id text,
  credit_reservation_id text,
  production_readiness_evidence_packet_id text,
  worker_type text not null,
  execution_mode text not null,
  requested_tool_ids jsonb not null default '[]'::jsonb,
  requested_recipe_ids jsonb not null default '[]'::jsonb,
  api_idempotency_key text,
  worker_idempotency_key text not null,
  attempt integer not null,
  max_attempts integer not null,
  status text not null,
  lease_json jsonb not null default '{}'::jsonb,
  output_artifact_ids jsonb not null default '[]'::jsonb,
  failure_category text,
  retry_decision_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint production_worker_runtime_jobs_id_nonempty check (length(trim(id)) > 0),
  constraint production_worker_runtime_jobs_workspace_id_nonempty check (length(trim(workspace_id)) > 0),
  constraint production_worker_runtime_jobs_project_id_nonempty check (length(trim(project_id)) > 0),
  constraint production_worker_runtime_jobs_job_id_nonempty check (length(trim(job_id)) > 0),
  constraint production_worker_runtime_jobs_plan_id_nonempty check (length(trim(tool_execution_plan_id)) > 0),
  constraint production_worker_runtime_jobs_snapshot_id_nonempty check (length(trim(approved_plan_snapshot_id)) > 0),
  constraint production_worker_runtime_jobs_worker_type_nonempty check (length(trim(worker_type)) > 0),
  constraint production_worker_runtime_jobs_execution_mode_nonempty check (length(trim(execution_mode)) > 0),
  constraint production_worker_runtime_jobs_worker_idempotency_nonempty check (length(trim(worker_idempotency_key)) > 0),
  constraint production_worker_runtime_jobs_worker_idempotency_unique unique (worker_idempotency_key),
  constraint production_worker_runtime_jobs_attempt_positive check (attempt > 0),
  constraint production_worker_runtime_jobs_max_attempts_positive check (max_attempts > 0),
  constraint production_worker_runtime_jobs_requested_tool_ids_array check (jsonb_typeof(requested_tool_ids) = 'array'),
  constraint production_worker_runtime_jobs_requested_recipe_ids_array check (jsonb_typeof(requested_recipe_ids) = 'array'),
  constraint production_worker_runtime_jobs_lease_object check (jsonb_typeof(lease_json) = 'object'),
  constraint production_worker_runtime_jobs_output_artifact_ids_array check (jsonb_typeof(output_artifact_ids) = 'array'),
  constraint production_worker_runtime_jobs_retry_decision_object check (jsonb_typeof(retry_decision_json) = 'object')
);

create table if not exists public.production_worker_runtime_artifacts (
  id text primary key,
  workspace_id text not null,
  project_id text not null,
  job_id text not null,
  worker_idempotency_key text not null,
  artifact_type text not null,
  storage_bucket_purpose text not null,
  storage_object_path text not null,
  is_private boolean not null default true,
  source_of_truth boolean not null default true,
  artifact_record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint production_worker_runtime_artifacts_job_fk
    foreign key (worker_idempotency_key)
    references public.production_worker_runtime_jobs(worker_idempotency_key)
    on delete cascade,
  constraint production_worker_runtime_artifacts_id_nonempty check (length(trim(id)) > 0),
  constraint production_worker_runtime_artifacts_workspace_id_nonempty check (length(trim(workspace_id)) > 0),
  constraint production_worker_runtime_artifacts_project_id_nonempty check (length(trim(project_id)) > 0),
  constraint production_worker_runtime_artifacts_job_id_nonempty check (length(trim(job_id)) > 0),
  constraint production_worker_runtime_artifacts_worker_idempotency_nonempty check (length(trim(worker_idempotency_key)) > 0),
  constraint production_worker_runtime_artifacts_type_nonempty check (length(trim(artifact_type)) > 0),
  constraint production_worker_runtime_artifacts_bucket_purpose_nonempty check (length(trim(storage_bucket_purpose)) > 0),
  constraint production_worker_runtime_artifacts_path_nonempty check (length(trim(storage_object_path)) > 0),
  constraint production_worker_runtime_artifacts_private check (is_private),
  constraint production_worker_runtime_artifacts_source_truth check (source_of_truth),
  constraint production_worker_runtime_artifacts_record_object check (jsonb_typeof(artifact_record) = 'object'),
  constraint production_worker_runtime_artifacts_no_url_path check (position('://' in storage_object_path) = 0),
  constraint production_worker_runtime_artifacts_no_secret_path check (
    storage_object_path !~* '(signed.?url|x-goog-signature|x-amz-signature|signature=|token|secret|service.?role|api.?key)'
  )
);

comment on table public.production_worker_runtime_jobs is
'Backend-only worker runtime job records for production tool execution. Rows are idempotent by worker_idempotency_key and store sanitized lease/retry/output manifest metadata only.';
comment on table public.production_worker_runtime_artifacts is
'Backend-only private output artifact manifest rows for production worker results. Rows store source-of-truth storage object paths, not signed URLs or public delivery artifacts.';
comment on column public.production_worker_runtime_artifacts.storage_object_path is
'Private storage object path under the project workspace. Must not be a signed URL, raw URL, public artifact URL, token, secret, API key, or service-role material.';

create index if not exists idx_production_worker_runtime_jobs_workspace_project_created
  on public.production_worker_runtime_jobs(workspace_id, project_id, created_at);

create index if not exists idx_production_worker_runtime_jobs_project_status
  on public.production_worker_runtime_jobs(workspace_id, project_id, status);

create index if not exists idx_production_worker_runtime_artifacts_workspace_project_created
  on public.production_worker_runtime_artifacts(workspace_id, project_id, created_at);

create index if not exists idx_production_worker_runtime_artifacts_worker_idempotency
  on public.production_worker_runtime_artifacts(worker_idempotency_key);

create index if not exists idx_production_worker_runtime_artifacts_storage_path
  on public.production_worker_runtime_artifacts(storage_object_path);

alter table public.production_worker_runtime_jobs enable row level security;
alter table public.production_worker_runtime_artifacts enable row level security;

grant usage on schema public to service_role;
revoke all on table public.production_worker_runtime_jobs from anon;
revoke all on table public.production_worker_runtime_jobs from authenticated;
revoke all on table public.production_worker_runtime_jobs from service_role;
grant select, insert on table public.production_worker_runtime_jobs to service_role;

revoke all on table public.production_worker_runtime_artifacts from anon;
revoke all on table public.production_worker_runtime_artifacts from authenticated;
revoke all on table public.production_worker_runtime_artifacts from service_role;
grant select, insert on table public.production_worker_runtime_artifacts to service_role;

-- Inserts and reads are intentionally backend/service-role only.
-- No authenticated insert/update/delete/select policy is created in this skeleton migration.
-- Explicit grants are required for Supabase Data API compatibility; these tables remain backend-only.
