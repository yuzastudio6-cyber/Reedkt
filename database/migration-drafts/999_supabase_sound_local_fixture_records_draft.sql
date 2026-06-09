-- DRAFT ONLY.
-- DO NOT APPLY.
-- DO NOT DEPLOY.
-- SUPABASE-SOUND-2 planning artifact only.
-- No SQL from this file was executed by this prompt.
-- Correct source of truth: Supabase row + private GCS path + manifest + checksum + approved plan snapshot.
-- Signed URLs are not source of truth.
-- Raw prompts must not become worker execution payloads.
-- Public artifacts remain blocked.
-- generated_local_fixture_passed is not claimed.

comment on schema public is
  'SUPABASE-SOUND-2 draft-only local fixture record planning. Reuse existing runtime tables where possible. Do not apply or deploy this draft without SUPABASE_RLS_STORAGE_DATABASE owner acceptance, migration-order review, RLS review, storage policy review, security advisor review, and milestone sync.';

-- ---------------------------------------------------------------------------
-- Existing surfaces to reuse
-- ---------------------------------------------------------------------------
-- Existing migrations already define the main runtime surfaces:
-- approved_plan_snapshots, storage_object_records, signed_url_events,
-- generation_requests, generated_assets, jobs, job_events, qa_reports,
-- credit_estimates, credit_approvals, credit_reservations,
-- feature_gates, tool_capabilities, worker_runtime_configs,
-- audio_environment_analysis, ambient_sound_plans, music_plans,
-- and sound_effect_plans.
--
-- This draft sketches future fixture-specific guard fields and policies only.
-- It does not create data, seed gates, seed capabilities, seed worker configs,
-- create storage buckets, create storage objects, or enable execution.

-- ---------------------------------------------------------------------------
-- approved_plan_snapshots fixture linkage
-- ---------------------------------------------------------------------------
alter table public.approved_plan_snapshots
  add column if not exists fixture_scope text not null default 'none'
    check (fixture_scope in ('none', 'sound_generated_local_fixture')),
  add column if not exists source_finding_ids text[] not null default array[]::text[],
  add column if not exists source_intent_ids text[] not null default array[]::text[],
  add column if not exists snapshot_checksum text,
  add column if not exists immutable_plan_version integer,
  add column if not exists revision_id uuid,
  add column if not exists fixture_metadata_json jsonb not null default '{}'::jsonb,
  add column if not exists raw_prompt_execution_allowed boolean not null default false;

comment on column public.approved_plan_snapshots.fixture_scope is
  'Future fixture-only scope. It must not imply staging, beta, production, public artifact, signed URL, provider, worker, or export readiness.';
comment on column public.approved_plan_snapshots.source_finding_ids is
  'Structured agent finding IDs that feed the approved snapshot. Chat text alone is not a worker execution source.';
comment on column public.approved_plan_snapshots.source_intent_ids is
  'Edit intent IDs that feed the approved snapshot before worker execution can ever be considered.';
comment on column public.approved_plan_snapshots.snapshot_checksum is
  'Future fixture checksum/hash for immutable approved snapshot evidence.';
comment on column public.approved_plan_snapshots.immutable_plan_version is
  'Future immutable version marker. Material plan changes require a new approved snapshot.';
comment on column public.approved_plan_snapshots.raw_prompt_execution_allowed is
  'Must remain false. Workers execute approved snapshots and manifests, not mutable chat prompts.';

alter table public.approved_plan_snapshots
  add constraint approved_plan_snapshots_no_raw_prompt_execution_check
  check (raw_prompt_execution_allowed = false);

-- Future migration review should confirm the existing immutable snapshot trigger
-- still blocks updates to snapshot payload/hash columns for fixture-scoped rows.

-- ---------------------------------------------------------------------------
-- storage_object_records private fixture source of truth
-- ---------------------------------------------------------------------------
alter table public.storage_object_records
  add column if not exists storage_scope text not null default 'private'
    check (storage_scope in ('private')),
  add column if not exists private_object_path text,
  add column if not exists checksum_algorithm text not null default 'sha256'
    check (checksum_algorithm = 'sha256'),
  add column if not exists checksum_value text,
  add column if not exists manifest_ref text,
  add column if not exists manifest_json jsonb not null default '{}'::jsonb,
  add column if not exists approved_plan_snapshot_id uuid references public.approved_plan_snapshots(id) on delete restrict,
  add column if not exists timing_cue_manifest_ref text,
  add column if not exists private_audio_artifact_manifest_ref text,
  add column if not exists public_artifact_allowed boolean not null default false,
  add column if not exists signed_url_source_of_truth_allowed boolean not null default false,
  add column if not exists source_media_overwrite_allowed boolean not null default false,
  add column if not exists provenance_json jsonb not null default '{}'::jsonb,
  add column if not exists qa_evidence_refs text[] not null default array[]::text[],
  add column if not exists fixture_scope text not null default 'none'
    check (fixture_scope in ('none', 'sound_generated_local_fixture')),
  add column if not exists artifact_stage text not null default 'planned'
    check (artifact_stage in ('planned', 'fixture_reference_only', 'ready', 'blocked', 'failed'));

comment on column public.storage_object_records.private_object_path is
  'Private object path expectation only. This draft creates no bucket and no object.';
comment on column public.storage_object_records.manifest_ref is
  'Reference to private audio artifact manifest metadata. It is not a public URL.';
comment on column public.storage_object_records.approved_plan_snapshot_id is
  'Future fixture records must link back to the approved snapshot source of truth.';
comment on column public.storage_object_records.public_artifact_allowed is
  'Must remain false until public artifact delivery has separate owner acceptance.';
comment on column public.storage_object_records.signed_url_source_of_truth_allowed is
  'Must remain false because signed URLs are temporary delivery events only.';
comment on column public.storage_object_records.source_media_overwrite_allowed is
  'Must remain false. Source media immutability is required for fixture provenance.';

alter table public.storage_object_records
  add constraint storage_object_records_private_scope_check
  check (storage_scope = 'private'),
  add constraint storage_object_records_no_public_artifact_check
  check (public_artifact_allowed = false),
  add constraint storage_object_records_no_signed_url_source_truth_check
  check (signed_url_source_of_truth_allowed = false),
  add constraint storage_object_records_no_source_overwrite_check
  check (source_media_overwrite_allowed = false);

-- ---------------------------------------------------------------------------
-- signed_url_events audit-only shape
-- ---------------------------------------------------------------------------
alter table public.signed_url_events
  add column if not exists source_of_truth_allowed boolean not null default false,
  add column if not exists access_context_json jsonb not null default '{}'::jsonb,
  add column if not exists fixture_scope text not null default 'none'
    check (fixture_scope in ('none', 'sound_generated_local_fixture'));

comment on table public.signed_url_events is
  'Audit events for temporary links only. This table must not store link values and must not become source of truth.';
comment on column public.signed_url_events.source_of_truth_allowed is
  'Must remain false. Source of truth is Supabase row + private GCS path + manifest + checksum + approved plan snapshot.';

alter table public.signed_url_events
  add constraint signed_url_events_not_source_of_truth_check
  check (source_of_truth_allowed = false);

-- ---------------------------------------------------------------------------
-- generation_requests fixture gating
-- ---------------------------------------------------------------------------
alter table public.generation_requests
  add column if not exists approved_plan_snapshot_id uuid references public.approved_plan_snapshots(id) on delete restrict,
  add column if not exists fixture_scope text not null default 'none'
    check (fixture_scope in ('none', 'sound_generated_local_fixture')),
  add column if not exists execution_stage text not null default 'blocked'
    check (execution_stage in ('blocked', 'draft_local_fixture', 'generated_local_fixture')),
  add column if not exists idempotency_key text,
  add column if not exists provider_execution_allowed boolean not null default false,
  add column if not exists worker_dispatch_allowed boolean not null default false,
  add column if not exists raw_prompt_execution_allowed boolean not null default false,
  add column if not exists signed_url_input_allowed boolean not null default false,
  add column if not exists fixture_contract_json jsonb not null default '{}'::jsonb;

comment on column public.generation_requests.provider_execution_allowed is
  'Must remain false until PROVIDER_GATEWAY_MODELS accepts real transport.';
comment on column public.generation_requests.worker_dispatch_allowed is
  'Must remain false until WORKER_RUNTIME_JOBS accepts execution.';
comment on column public.generation_requests.raw_prompt_execution_allowed is
  'Must remain false. Future requests reference approved snapshots and manifests.';
comment on column public.generation_requests.signed_url_input_allowed is
  'Must remain false. Future workers read private source-of-truth records, not temporary links.';

alter table public.generation_requests
  add constraint generation_requests_no_provider_execution_check
  check (provider_execution_allowed = false),
  add constraint generation_requests_no_worker_dispatch_check
  check (worker_dispatch_allowed = false),
  add constraint generation_requests_no_raw_prompt_execution_check
  check (raw_prompt_execution_allowed = false),
  add constraint generation_requests_no_signed_url_input_check
  check (signed_url_input_allowed = false);

-- ---------------------------------------------------------------------------
-- generated_assets private fixture linkage
-- ---------------------------------------------------------------------------
alter table public.generated_assets
  add column if not exists storage_object_record_id uuid references public.storage_object_records(id) on delete restrict,
  add column if not exists approved_plan_snapshot_id uuid references public.approved_plan_snapshots(id) on delete restrict,
  add column if not exists checksum_algorithm text not null default 'sha256'
    check (checksum_algorithm = 'sha256'),
  add column if not exists checksum_value text,
  add column if not exists public_artifact_allowed boolean not null default false,
  add column if not exists fixture_scope text not null default 'none'
    check (fixture_scope in ('none', 'sound_generated_local_fixture')),
  add column if not exists provenance_json jsonb not null default '{}'::jsonb,
  add column if not exists source_manifest_refs text[] not null default array[]::text[];

comment on column public.generated_assets.public_artifact_allowed is
  'Must remain false until public artifact policy, QA, abuse, retention, and owner acceptance are complete.';

alter table public.generated_assets
  add constraint generated_assets_no_public_artifact_check
  check (public_artifact_allowed = false);

-- ---------------------------------------------------------------------------
-- jobs and job_events fixture gating
-- ---------------------------------------------------------------------------
alter table public.jobs
  add column if not exists approved_plan_snapshot_id uuid references public.approved_plan_snapshots(id) on delete restrict,
  add column if not exists idempotency_key text,
  add column if not exists execution_stage text not null default 'blocked'
    check (execution_stage in ('blocked', 'draft_local_fixture', 'generated_local_fixture')),
  add column if not exists worker_dispatch_allowed boolean not null default false,
  add column if not exists raw_prompt_execution_allowed boolean not null default false,
  add column if not exists signed_url_input_allowed boolean not null default false;

alter table public.jobs
  add constraint jobs_no_worker_dispatch_check
  check (worker_dispatch_allowed = false),
  add constraint jobs_no_raw_prompt_execution_check
  check (raw_prompt_execution_allowed = false),
  add constraint jobs_no_signed_url_input_check
  check (signed_url_input_allowed = false);

alter table public.job_events
  add column if not exists approved_plan_snapshot_id uuid references public.approved_plan_snapshots(id) on delete set null,
  add column if not exists fixture_scope text not null default 'none'
    check (fixture_scope in ('none', 'sound_generated_local_fixture')),
  add column if not exists sanitized_event_json jsonb not null default '{}'::jsonb;

comment on table public.job_events is
  'Future job events must remain sanitized and must not include secrets, temporary link values, provider credentials, or raw prompt execution payloads.';

-- ---------------------------------------------------------------------------
-- SOUND planning tables fixture linkage
-- ---------------------------------------------------------------------------
-- The SOUND planning tables remain planning records only. They do not enable
-- provider execution, worker dispatch, public artifacts, storage writes, or
-- final mux/export. Lyria metadata is music/song/soundtrack planning only and
-- must not be represented as SFX, foley, whoosh, hit, riser, room-tone, or
-- ambience execution.

alter table public.sound_effect_plans
  add column if not exists approved_plan_snapshot_id uuid references public.approved_plan_snapshots(id) on delete set null,
  add column if not exists timing_cue_manifest_ref text,
  add column if not exists fixture_scope text not null default 'none'
    check (fixture_scope in ('none', 'sound_generated_local_fixture'));

alter table public.ambient_sound_plans
  add column if not exists approved_plan_snapshot_id uuid references public.approved_plan_snapshots(id) on delete set null,
  add column if not exists timing_cue_manifest_ref text,
  add column if not exists fixture_scope text not null default 'none'
    check (fixture_scope in ('none', 'sound_generated_local_fixture'));

alter table public.music_plans
  add column if not exists approved_plan_snapshot_id uuid references public.approved_plan_snapshots(id) on delete set null,
  add column if not exists timing_cue_manifest_ref text,
  add column if not exists fixture_scope text not null default 'none'
    check (fixture_scope in ('none', 'sound_generated_local_fixture'));

alter table public.audio_environment_analysis
  add column if not exists approved_plan_snapshot_id uuid references public.approved_plan_snapshots(id) on delete set null,
  add column if not exists private_audio_artifact_manifest_ref text,
  add column if not exists fixture_scope text not null default 'none'
    check (fixture_scope in ('none', 'sound_generated_local_fixture'));

-- ---------------------------------------------------------------------------
-- QA, observability, and billing handoff comments
-- ---------------------------------------------------------------------------
comment on table public.qa_reports is
  'QA rows remain owner-gated. SOUND local fixture QA evidence must be accepted before generated_local_fixture_passed can be claimed.';

comment on table public.credit_estimates is
  'Credit placeholder rows remain blocked until BILLING_STRIPE_CREDITS accepts local fixture placeholder policy.';
comment on table public.credit_approvals is
  'Credit approval rows remain blocked until BILLING_STRIPE_CREDITS accepts fixture approval semantics.';
comment on table public.credit_reservations is
  'Credit reservation, spend, refund, and release rows remain blocked for SOUND local fixture draft planning.';

comment on table public.feature_gates is
  'SUPABASE-SOUND-2 does not seed or mutate feature gates. Runtime remains fail-closed.';
comment on table public.tool_capabilities is
  'SUPABASE-SOUND-2 does not seed tool capabilities. Provider and worker capability unlock remains owner-gated.';
comment on table public.worker_runtime_configs is
  'SUPABASE-SOUND-2 does not create worker runtime configs. Worker execution remains blocked.';

-- ---------------------------------------------------------------------------
-- RLS policy draft
-- ---------------------------------------------------------------------------
-- Future policies must preserve workspace/project isolation:
-- 1. Authenticated users may select fixture rows only when they are workspace
--    or project members.
-- 2. No anon access to runtime rows.
-- 3. No frontend/client writes to approved snapshots, runtime rows,
--    generated assets, job rows, signed URL audit rows, or storage records.
-- 4. Service-owned backend paths may insert/update/delete only after
--    idempotency, owner acceptance, approved snapshot, private manifest,
--    checksum, and storage policy gates pass.
-- 5. Feature gate, tool capability, and worker runtime config writes remain
--    service-owned and stage-scoped.
-- 6. RLS helper functions must be reviewed for stable search_path behavior
--    before any active migration is created.

-- Draft policy names for future review only:
-- approved_plan_snapshots_sound_fixture_select_member
-- storage_object_records_sound_fixture_select_member
-- signed_url_events_sound_fixture_select_member
-- generation_requests_sound_fixture_select_member
-- generated_assets_sound_fixture_select_member
-- jobs_sound_fixture_select_member
-- job_events_sound_fixture_select_member
-- sound_planning_fixture_select_member
-- No insert, update, or delete policy for normal clients.

-- ---------------------------------------------------------------------------
-- Storage policy draft
-- ---------------------------------------------------------------------------
-- Future storage policies must require private buckets/objects only.
-- No public bucket policy is allowed.
-- Temporary link events are audit-only and are not source of truth.
-- Public artifact delivery needs a separate approved policy covering
-- retention, deletion, user approval, abuse controls, visibility rules,
-- access logging, QA evidence, and owner acceptance.
-- Storage owner acceptance is required before any bucket/object mutation.

-- ---------------------------------------------------------------------------
-- Index and performance draft
-- ---------------------------------------------------------------------------
create index if not exists approved_plan_snapshots_sound_fixture_idx
  on public.approved_plan_snapshots(workspace_id, project_id, edit_plan_id, fixture_scope, snapshot_status, created_at);

create index if not exists approved_plan_snapshots_sound_fixture_checksum_idx
  on public.approved_plan_snapshots(snapshot_checksum)
  where fixture_scope = 'sound_generated_local_fixture';

create index if not exists storage_object_records_sound_fixture_idx
  on public.storage_object_records(workspace_id, project_id, storage_scope, object_purpose, status, created_at);

create index if not exists storage_object_records_sound_fixture_checksum_idx
  on public.storage_object_records(checksum_algorithm, checksum_value)
  where fixture_scope = 'sound_generated_local_fixture';

create index if not exists generation_requests_sound_fixture_idx
  on public.generation_requests(project_id, status, provider_id, created_at);

create index if not exists generated_assets_sound_fixture_idx
  on public.generated_assets(project_id, asset_type, status, storage_object_record_id);

create index if not exists jobs_sound_fixture_idx
  on public.jobs(job_type, status, project_id, created_at);

create index if not exists job_events_sound_fixture_idx
  on public.job_events(job_id, event_type, created_at);

create index if not exists sound_effect_plans_sound_fixture_idx
  on public.sound_effect_plans(project_id, edit_plan_id, fixture_scope);

create index if not exists ambient_sound_plans_sound_fixture_idx
  on public.ambient_sound_plans(project_id, edit_plan_id, fixture_scope);

create index if not exists music_plans_sound_fixture_idx
  on public.music_plans(project_id, edit_plan_id, fixture_scope);

create index if not exists credit_estimates_sound_fixture_idx
  on public.credit_estimates(project_id, status, created_at);

-- ---------------------------------------------------------------------------
-- Advisor blockers to resolve before any active migration
-- ---------------------------------------------------------------------------
-- Carry forward known advisor blockers from SUPABASE-SOUND-1:
-- - RLS enabled but no policy findings on activation, readiness, feature,
--   and tool tables.
-- - Mutable search_path warnings on runtime helper functions.
-- - SECURITY DEFINER exposure warnings.
-- - Unindexed foreign key findings including approved_plan_snapshots.
-- - Duplicate index findings on approved_plan_snapshots and
--   storage_object_records.
-- - Empty storage bucket/object evidence and no fixture rows.

-- ---------------------------------------------------------------------------
-- Migration-order and milestone sync
-- ---------------------------------------------------------------------------
-- This 999 draft is intentionally outside the active timestamped migration
-- ledger. A future prompt must reconcile migration order, local migration
-- history, live migration metadata, RLS tests, schema-health checks, and
-- advisor findings before creating an active migration under supabase/migrations.

-- ---------------------------------------------------------------------------
-- Rollback and cleanup draft
-- ---------------------------------------------------------------------------
-- Future rollback should:
-- - drop fixture-specific constraints only after verifying no accepted rows use
--   the fixture scope;
-- - drop fixture-specific policies and indexes created by the active migration;
-- - drop fixture-specific columns only when owner-approved and data-safe;
-- - delete fixture-only rows only in a separate cleanup prompt;
-- - clean storage objects only after SUPABASE_RLS_STORAGE_DATABASE owner
--   acceptance and private storage inventory review;
-- - leave production, beta, public artifact, signed URL delivery, worker
--   dispatch, provider execution, and credit execution locked.
