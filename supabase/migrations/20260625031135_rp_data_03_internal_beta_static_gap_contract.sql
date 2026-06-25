-- RP-DATA-03 Supabase migration draft static implementation.
-- Static repository draft only. Do not apply to local, staging, or production
-- until a later guarded execution prompt names the target environment.
--
-- This migration draft does not execute in this phase, does not create public
-- buckets, does not create signed URLs, does not run workers, does not call
-- providers/models, and does not unlock internal beta.

create table if not exists public.artifact_manifests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid references public.edit_sessions(id) on delete set null,
  edit_plan_version_id uuid references public.edit_plan_versions(id) on delete set null,
  approved_plan_snapshot_id uuid references public.approved_plan_snapshots(id) on delete restrict,
  editing_job_id uuid references public.editing_jobs(id) on delete set null,
  qa_report_id uuid references public.qa_reports(id) on delete set null,
  final_export_id uuid references public.final_exports(id) on delete set null,
  manifest_role text not null default 'preview'
    check (manifest_role in (
      'source',
      'generated_asset',
      'processed_media',
      'preview',
      'export',
      'thumbnail',
      'qa',
      'worker_temp',
      'cleanup'
    )),
  status text not null default 'planned'
    check (status in (
      'planned',
      'writing',
      'ready',
      'qa_reviewed',
      'archived',
      'cleanup_pending',
      'cleaned',
      'failed'
    )),
  storage_bucket text,
  storage_path text,
  manifest_json jsonb not null default '{}'::jsonb,
  checksum_manifest_json jsonb not null default '[]'::jsonb,
  cleanup_policy_json jsonb not null default '{}'::jsonb,
  retention_policy_json jsonb not null default '{}'::jsonb,
  created_by_worker_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artifact_manifest_items (
  id uuid primary key default gen_random_uuid(),
  artifact_manifest_id uuid not null references public.artifact_manifests(id) on delete cascade,
  item_role text not null default 'artifact'
    check (item_role in (
      'source',
      'generated_asset',
      'processed_media',
      'preview',
      'export',
      'thumbnail',
      'qa_report',
      'sidecar',
      'temporary',
      'other'
    )),
  storage_bucket text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  checksum_sha256 text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (artifact_manifest_id, storage_bucket, storage_path)
);

comment on table public.artifact_manifests is
'Internal beta artifact manifests for private source, generated, processed, preview, export, thumbnail, QA, and worker-temp artifacts. Backend/workers create manifests; project members can read scoped manifests. This table stores bucket/path/checksum metadata only, never signed URLs.';
comment on table public.artifact_manifest_items is
'Line items for artifact manifests. Each item records private bucket/path/checksum metadata only. Generated files remain private and cleanup/retention policy is explicit.';
comment on column public.artifact_manifests.approved_plan_snapshot_id is
'When present, ties artifacts to the immutable approved snapshot workers executed. Workers must not execute raw chat.';
comment on column public.artifact_manifests.checksum_manifest_json is
'Manifest-level checksum evidence. Must not contain signed URLs, provider secrets, service-role keys, or private credential payloads.';

create index if not exists idx_artifact_manifests_project_status
on public.artifact_manifests(project_id, status);

create index if not exists idx_artifact_manifests_snapshot_role
on public.artifact_manifests(approved_plan_snapshot_id, manifest_role);

create index if not exists idx_artifact_manifests_job
on public.artifact_manifests(editing_job_id);

create index if not exists idx_artifact_manifest_items_manifest
on public.artifact_manifest_items(artifact_manifest_id);

create index if not exists idx_artifact_manifest_items_bucket_path
on public.artifact_manifest_items(storage_bucket, storage_path);

drop trigger if exists set_artifact_manifests_updated_at on public.artifact_manifests;
create trigger set_artifact_manifests_updated_at before update on public.artifact_manifests
for each row execute function public.set_updated_at();

alter table public.artifact_manifests enable row level security;
alter table public.artifact_manifest_items enable row level security;

create policy artifact_manifests_select_project_member
on public.artifact_manifests for select
to authenticated
using (public.is_project_member(project_id));

create policy artifact_manifest_items_select_project_member
on public.artifact_manifest_items for select
to authenticated
using (
  exists (
    select 1
    from public.artifact_manifests am
    where am.id = artifact_manifest_items.artifact_manifest_id
      and public.is_project_member(am.project_id)
  )
);

-- Explicit Data API exposure for current Supabase behavior. Grants only expose
-- tables to the API; RLS policies above and in prior migrations still decide
-- which rows are visible or writable.
grant usage on schema public to authenticated, service_role;

grant select, insert, update on table
  public.profiles,
  public.workspaces,
  public.workspace_members,
  public.projects,
  public.edit_sessions,
  public.chat_messages,
  public.user_confirmations,
  public.media_assets,
  public.uploaded_clips,
  public.source_sequence_items,
  public.edit_intent_snapshots,
  public.edit_settings_snapshots,
  public.edit_plan_versions,
  public.plan_component_snapshots,
  public.edit_plan_segments,
  public.edit_operations,
  public.revision_requests
to authenticated;

grant select on table
  public.clip_analysis_snapshots,
  public.credit_estimates,
  public.credit_estimate_items,
  public.approval_records,
  public.approved_plan_snapshots,
  public.credit_reservations,
  public.credit_ledger_entries,
  public.refund_records,
  public.generation_requests,
  public.generation_events,
  public.generated_assets,
  public.generated_asset_versions,
  public.editing_jobs,
  public.job_steps,
  public.worker_events,
  public.qa_reports,
  public.qa_check_results,
  public.final_exports,
  public.audit_events,
  public.production_readiness_snapshots,
  public.license_review_snapshots,
  public.artifact_manifests,
  public.artifact_manifest_items
to authenticated;

revoke insert, update, delete on table
  public.clip_analysis_snapshots,
  public.credit_reservations,
  public.credit_ledger_entries,
  public.refund_records,
  public.approval_records,
  public.approved_plan_snapshots,
  public.generation_requests,
  public.generation_events,
  public.generated_assets,
  public.generated_asset_versions,
  public.editing_jobs,
  public.job_steps,
  public.worker_events,
  public.qa_reports,
  public.qa_check_results,
  public.final_exports,
  public.audit_events,
  public.production_readiness_snapshots,
  public.license_review_snapshots,
  public.artifact_manifests,
  public.artifact_manifest_items
from authenticated;

revoke all on table
  public.artifact_manifests,
  public.artifact_manifest_items
from public, anon;

grant select, insert, update, delete on table
  public.artifact_manifests,
  public.artifact_manifest_items
to service_role;

comment on table public.editing_jobs is
'Editing jobs remain backend/service-role controlled. Project members may read scoped status only; workers execute approved snapshots and use separate claim/idempotency records.';
comment on table public.worker_events is
'Worker events remain backend/service-role controlled. Project members may read scoped sanitized status only.';
comment on table public.credit_reservations is
'Credit reservations remain backend/service-role controlled. Authenticated users may read scoped reservation status only after approval.';
comment on table public.final_exports is
'Final export records remain backend/service-role controlled and private. This draft does not unlock final delivery or public artifacts.';
