-- ReeditPro active migration file.
-- Created by RP-DATA-04.
-- Do not run against production until local/staging tests pass and the migration is approved.
-- This file is intended for Supabase migration testing, not direct SQL editor changes.

create or replace function public.safe_uuid(value text)
returns uuid
language plpgsql
immutable
set search_path = public
as $$
begin
  return value::uuid;
exception
  when others then
    return null;
end;
$$;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_owner_or_admin(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'admin')
  ) or exists (
    select 1
    from public.workspaces w
    where w.id = target_workspace_id
      and w.owner_id = auth.uid()
  );
$$;

create or replace function public.is_project_member(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = project_uuid
      and public.is_workspace_member(p.workspace_id)
  );
$$;

create or replace function public.is_project_editor(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    join public.workspace_members wm on wm.workspace_id = p.workspace_id
    where p.id = project_uuid
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'admin', 'editor')
  );
$$;

comment on function public.is_workspace_member(uuid) is 'SECURITY DEFINER helper for RLS. Must be reviewed before production.';
comment on function public.is_project_member(uuid) is 'Project access is workspace-membership scoped. Must be tested in local/staging before production.';

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.edit_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.user_confirmations enable row level security;
alter table public.media_assets enable row level security;
alter table public.uploaded_clips enable row level security;
alter table public.source_sequence_items enable row level security;
alter table public.clip_analysis_snapshots enable row level security;
alter table public.edit_intent_snapshots enable row level security;
alter table public.edit_settings_snapshots enable row level security;
alter table public.edit_plan_versions enable row level security;
alter table public.plan_component_snapshots enable row level security;
alter table public.edit_plan_segments enable row level security;
alter table public.edit_operations enable row level security;
alter table public.credit_estimates enable row level security;
alter table public.credit_estimate_items enable row level security;
alter table public.credit_reservations enable row level security;
alter table public.credit_ledger_entries enable row level security;
alter table public.refund_records enable row level security;
alter table public.approval_records enable row level security;
alter table public.approved_plan_snapshots enable row level security;
alter table public.generation_requests enable row level security;
alter table public.generation_events enable row level security;
alter table public.generated_assets enable row level security;
alter table public.generated_asset_versions enable row level security;
alter table public.editing_jobs enable row level security;
alter table public.job_steps enable row level security;
alter table public.worker_events enable row level security;
alter table public.qa_reports enable row level security;
alter table public.qa_check_results enable row level security;
alter table public.revision_requests enable row level security;
alter table public.final_exports enable row level security;
alter table public.audit_events enable row level security;
alter table public.production_readiness_snapshots enable row level security;
alter table public.license_review_snapshots enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "workspaces_select_member" on public.workspaces;
create policy "workspaces_select_member" on public.workspaces
for select to authenticated
using (public.is_workspace_member(id));

drop policy if exists "workspaces_insert_owner" on public.workspaces;
create policy "workspaces_insert_owner" on public.workspaces
for insert to authenticated
with check (owner_id = auth.uid());

drop policy if exists "workspaces_update_owner_admin" on public.workspaces;
create policy "workspaces_update_owner_admin" on public.workspaces
for update to authenticated
using (public.is_workspace_owner_or_admin(id))
with check (public.is_workspace_owner_or_admin(id));

drop policy if exists "workspaces_delete_owner_admin" on public.workspaces;
create policy "workspaces_delete_owner_admin" on public.workspaces
for delete to authenticated
using (public.is_workspace_owner_or_admin(id));

drop policy if exists "workspace_members_select_member" on public.workspace_members;
create policy "workspace_members_select_member" on public.workspace_members
for select to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace_members_manage_owner_admin" on public.workspace_members;
create policy "workspace_members_manage_owner_admin" on public.workspace_members
for all to authenticated
using (public.is_workspace_owner_or_admin(workspace_id))
with check (public.is_workspace_owner_or_admin(workspace_id));

drop policy if exists "projects_select_member" on public.projects;
create policy "projects_select_member" on public.projects
for select to authenticated
using (public.is_project_member(id));

drop policy if exists "projects_insert_workspace_member" on public.projects;
create policy "projects_insert_workspace_member" on public.projects
for insert to authenticated
with check (owner_id = auth.uid() and public.is_workspace_member(workspace_id));

drop policy if exists "projects_update_editor" on public.projects;
create policy "projects_update_editor" on public.projects
for update to authenticated
using (public.is_project_editor(id))
with check (public.is_project_editor(id));

drop policy if exists "projects_delete_owner_admin" on public.projects;
create policy "projects_delete_owner_admin" on public.projects
for delete to authenticated
using (public.is_workspace_owner_or_admin(workspace_id));

drop policy if exists "edit_sessions_select_project_member" on public.edit_sessions;
create policy "edit_sessions_select_project_member" on public.edit_sessions
for select to authenticated
using (public.is_project_member(project_id));

drop policy if exists "edit_sessions_insert_project_editor" on public.edit_sessions;
create policy "edit_sessions_insert_project_editor" on public.edit_sessions
for insert to authenticated
with check (public.is_project_editor(project_id));

drop policy if exists "edit_sessions_update_project_editor" on public.edit_sessions;
create policy "edit_sessions_update_project_editor" on public.edit_sessions
for update to authenticated
using (public.is_project_editor(project_id))
with check (public.is_project_editor(project_id));

drop policy if exists "chat_messages_select_project_member" on public.chat_messages;
create policy "chat_messages_select_project_member" on public.chat_messages
for select to authenticated
using (exists (
  select 1 from public.edit_sessions es
  where es.id = chat_messages.edit_session_id
    and public.is_project_member(es.project_id)
));

drop policy if exists "chat_messages_insert_project_member" on public.chat_messages;
create policy "chat_messages_insert_project_member" on public.chat_messages
for insert to authenticated
with check (exists (
  select 1 from public.edit_sessions es
  where es.id = chat_messages.edit_session_id
    and public.is_project_member(es.project_id)
));

drop policy if exists "user_confirmations_select_project_member" on public.user_confirmations;
create policy "user_confirmations_select_project_member" on public.user_confirmations
for select to authenticated
using (exists (
  select 1 from public.edit_sessions es
  where es.id = user_confirmations.edit_session_id
    and public.is_project_member(es.project_id)
));

drop policy if exists "user_confirmations_insert_project_member" on public.user_confirmations;
create policy "user_confirmations_insert_project_member" on public.user_confirmations
for insert to authenticated
with check (exists (
  select 1 from public.edit_sessions es
  where es.id = user_confirmations.edit_session_id
    and public.is_project_member(es.project_id)
));

drop policy if exists "user_confirmations_update_project_editor" on public.user_confirmations;
create policy "user_confirmations_update_project_editor" on public.user_confirmations
for update to authenticated
using (exists (
  select 1 from public.edit_sessions es
  where es.id = user_confirmations.edit_session_id
    and public.is_project_editor(es.project_id)
))
with check (exists (
  select 1 from public.edit_sessions es
  where es.id = user_confirmations.edit_session_id
    and public.is_project_editor(es.project_id)
));

drop policy if exists "media_assets_select_project_member" on public.media_assets;
create policy "media_assets_select_project_member" on public.media_assets
for select to authenticated
using (public.is_project_member(project_id));

drop policy if exists "media_assets_insert_project_editor" on public.media_assets;
create policy "media_assets_insert_project_editor" on public.media_assets
for insert to authenticated
with check (public.is_project_editor(project_id));

drop policy if exists "media_assets_update_project_editor" on public.media_assets;
create policy "media_assets_update_project_editor" on public.media_assets
for update to authenticated
using (public.is_project_editor(project_id))
with check (public.is_project_editor(project_id));

drop policy if exists "uploaded_clips_select_project_member" on public.uploaded_clips;
create policy "uploaded_clips_select_project_member" on public.uploaded_clips
for select to authenticated
using (public.is_project_member(project_id));

drop policy if exists "uploaded_clips_insert_project_editor" on public.uploaded_clips;
create policy "uploaded_clips_insert_project_editor" on public.uploaded_clips
for insert to authenticated
with check (public.is_project_editor(project_id));

drop policy if exists "uploaded_clips_update_project_editor" on public.uploaded_clips;
create policy "uploaded_clips_update_project_editor" on public.uploaded_clips
for update to authenticated
using (public.is_project_editor(project_id))
with check (public.is_project_editor(project_id));

drop policy if exists "source_sequence_select_project_member" on public.source_sequence_items;
create policy "source_sequence_select_project_member" on public.source_sequence_items
for select to authenticated
using (public.is_project_member(project_id));

drop policy if exists "source_sequence_insert_project_editor" on public.source_sequence_items;
create policy "source_sequence_insert_project_editor" on public.source_sequence_items
for insert to authenticated
with check (public.is_project_editor(project_id));

drop policy if exists "source_sequence_update_project_editor" on public.source_sequence_items;
create policy "source_sequence_update_project_editor" on public.source_sequence_items
for update to authenticated
using (public.is_project_editor(project_id))
with check (public.is_project_editor(project_id));

drop policy if exists "clip_analysis_select_project_member" on public.clip_analysis_snapshots;
create policy "clip_analysis_select_project_member" on public.clip_analysis_snapshots
for select to authenticated
using (exists (
  select 1
  from public.uploaded_clips uc
  where uc.id = clip_analysis_snapshots.uploaded_clip_id
    and public.is_project_member(uc.project_id)
));

drop policy if exists "intent_snapshots_select_project_member" on public.edit_intent_snapshots;
create policy "intent_snapshots_select_project_member" on public.edit_intent_snapshots
for select to authenticated
using (public.is_project_member(project_id));

drop policy if exists "intent_snapshots_insert_project_editor" on public.edit_intent_snapshots;
create policy "intent_snapshots_insert_project_editor" on public.edit_intent_snapshots
for insert to authenticated
with check (public.is_project_editor(project_id));

drop policy if exists "settings_snapshots_select_project_member" on public.edit_settings_snapshots;
create policy "settings_snapshots_select_project_member" on public.edit_settings_snapshots
for select to authenticated
using (public.is_project_member(project_id));

drop policy if exists "settings_snapshots_insert_project_editor" on public.edit_settings_snapshots;
create policy "settings_snapshots_insert_project_editor" on public.edit_settings_snapshots
for insert to authenticated
with check (public.is_project_editor(project_id));

drop policy if exists "edit_plan_versions_select_project_member" on public.edit_plan_versions;
create policy "edit_plan_versions_select_project_member" on public.edit_plan_versions
for select to authenticated
using (public.is_project_member(project_id));

drop policy if exists "edit_plan_versions_insert_project_editor" on public.edit_plan_versions;
create policy "edit_plan_versions_insert_project_editor" on public.edit_plan_versions
for insert to authenticated
with check (public.is_project_editor(project_id));

drop policy if exists "edit_plan_versions_update_draft_editor" on public.edit_plan_versions;
create policy "edit_plan_versions_update_draft_editor" on public.edit_plan_versions
for update to authenticated
using (public.is_project_editor(project_id) and status <> 'approved')
with check (public.is_project_editor(project_id) and status <> 'approved');

drop policy if exists "plan_components_select_project_member" on public.plan_component_snapshots;
create policy "plan_components_select_project_member" on public.plan_component_snapshots
for select to authenticated
using (exists (
  select 1 from public.edit_plan_versions epv
  where epv.id = plan_component_snapshots.edit_plan_version_id
    and public.is_project_member(epv.project_id)
));

drop policy if exists "plan_segments_select_project_member" on public.edit_plan_segments;
create policy "plan_segments_select_project_member" on public.edit_plan_segments
for select to authenticated
using (exists (
  select 1 from public.edit_plan_versions epv
  where epv.id = edit_plan_segments.edit_plan_version_id
    and public.is_project_member(epv.project_id)
));

drop policy if exists "edit_operations_select_project_member" on public.edit_operations;
create policy "edit_operations_select_project_member" on public.edit_operations
for select to authenticated
using (exists (
  select 1
  from public.edit_plan_segments eps
  join public.edit_plan_versions epv on epv.id = eps.edit_plan_version_id
  where eps.id = edit_operations.edit_plan_segment_id
    and public.is_project_member(epv.project_id)
));

drop policy if exists "credit_estimates_select_project_member" on public.credit_estimates;
create policy "credit_estimates_select_project_member" on public.credit_estimates
for select to authenticated
using (public.is_project_member(project_id));

drop policy if exists "credit_estimate_items_select_project_member" on public.credit_estimate_items;
create policy "credit_estimate_items_select_project_member" on public.credit_estimate_items
for select to authenticated
using (exists (
  select 1 from public.credit_estimates ce
  where ce.id = credit_estimate_items.credit_estimate_id
    and public.is_project_member(ce.project_id)
));

drop policy if exists "credit_reservations_select_workspace_member" on public.credit_reservations;
create policy "credit_reservations_select_workspace_member" on public.credit_reservations
for select to authenticated
using (public.is_workspace_member(workspace_id) and public.is_project_member(project_id));

drop policy if exists "credit_ledger_entries_select_workspace_member" on public.credit_ledger_entries;
create policy "credit_ledger_entries_select_workspace_member" on public.credit_ledger_entries
for select to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "refund_records_select_workspace_member" on public.refund_records;
create policy "refund_records_select_workspace_member" on public.refund_records
for select to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "approval_records_select_project_member" on public.approval_records;
create policy "approval_records_select_project_member" on public.approval_records
for select to authenticated
using (public.is_project_member(project_id));

drop policy if exists "approved_snapshots_select_project_member" on public.approved_plan_snapshots;
create policy "approved_snapshots_select_project_member" on public.approved_plan_snapshots
for select to authenticated
using (public.is_project_member(project_id));

drop policy if exists "generation_requests_select_project_member" on public.generation_requests;
create policy "generation_requests_select_project_member" on public.generation_requests
for select to authenticated
using (public.is_project_member(project_id));

drop policy if exists "generation_events_select_project_member" on public.generation_events;
create policy "generation_events_select_project_member" on public.generation_events
for select to authenticated
using (exists (
  select 1 from public.generation_requests gr
  where gr.id = generation_events.generation_request_id
    and public.is_project_member(gr.project_id)
));

drop policy if exists "generated_assets_select_project_member" on public.generated_assets;
create policy "generated_assets_select_project_member" on public.generated_assets
for select to authenticated
using (public.is_project_member(project_id));

drop policy if exists "generated_asset_versions_select_project_member" on public.generated_asset_versions;
create policy "generated_asset_versions_select_project_member" on public.generated_asset_versions
for select to authenticated
using (exists (
  select 1 from public.generated_assets ga
  where ga.id = generated_asset_versions.generated_asset_id
    and public.is_project_member(ga.project_id)
));

drop policy if exists "editing_jobs_select_project_member" on public.editing_jobs;
create policy "editing_jobs_select_project_member" on public.editing_jobs
for select to authenticated
using (public.is_project_member(project_id));

drop policy if exists "job_steps_select_project_member" on public.job_steps;
create policy "job_steps_select_project_member" on public.job_steps
for select to authenticated
using (exists (
  select 1 from public.editing_jobs ej
  where ej.id = job_steps.editing_job_id
    and public.is_project_member(ej.project_id)
));

drop policy if exists "worker_events_select_project_member" on public.worker_events;
create policy "worker_events_select_project_member" on public.worker_events
for select to authenticated
using (exists (
  select 1 from public.editing_jobs ej
  where ej.id = worker_events.editing_job_id
    and public.is_project_member(ej.project_id)
));

drop policy if exists "qa_reports_select_project_member" on public.qa_reports;
create policy "qa_reports_select_project_member" on public.qa_reports
for select to authenticated
using (public.is_project_member(project_id));

drop policy if exists "qa_check_results_select_project_member" on public.qa_check_results;
create policy "qa_check_results_select_project_member" on public.qa_check_results
for select to authenticated
using (exists (
  select 1 from public.qa_reports qr
  where qr.id = qa_check_results.qa_report_id
    and public.is_project_member(qr.project_id)
));

drop policy if exists "revision_requests_select_project_member" on public.revision_requests;
create policy "revision_requests_select_project_member" on public.revision_requests
for select to authenticated
using (public.is_project_member(project_id));

drop policy if exists "revision_requests_insert_project_member" on public.revision_requests;
create policy "revision_requests_insert_project_member" on public.revision_requests
for insert to authenticated
with check (public.is_project_member(project_id) and requested_by = auth.uid());

drop policy if exists "final_exports_select_project_member" on public.final_exports;
create policy "final_exports_select_project_member" on public.final_exports
for select to authenticated
using (public.is_project_member(project_id));

drop policy if exists "audit_events_select_member" on public.audit_events;
create policy "audit_events_select_member" on public.audit_events
for select to authenticated
using (
  (workspace_id is not null and public.is_workspace_member(workspace_id))
  or (project_id is not null and public.is_project_member(project_id))
);

drop policy if exists "production_readiness_select_project_member" on public.production_readiness_snapshots;
create policy "production_readiness_select_project_member" on public.production_readiness_snapshots
for select to authenticated
using (project_id is not null and public.is_project_member(project_id));

drop policy if exists "license_review_select_workspace_member" on public.license_review_snapshots;
create policy "license_review_select_workspace_member" on public.license_review_snapshots
for select to authenticated
using (workspace_id is not null and public.is_workspace_member(workspace_id));

comment on table public.approved_plan_snapshots is 'No user insert/update/delete policy is defined. Backend/service role creates snapshots, and immutable trigger protects updates/deletes.';
comment on table public.credit_ledger_entries is 'No user insert/update/delete policy is defined. Future credit ledger writes are service-controlled and append-only.';
comment on table public.audit_events is 'No user insert/update/delete policy is defined. Audit writes are service/backend controlled and append-only.';
comment on table public.job_steps is 'No user insert/update policy is defined. Worker steps are backend/service-role controlled.';
comment on table public.worker_events is 'No user insert/update policy is defined. Worker events are backend/service-role controlled.';
