# Supabase Table Specification

This specification describes planned MVP Supabase tables for a future migration. It does not create tables, migrations, SQL, clients, storage buckets, or backend routes.

## Table Pattern

Each MVP table should define purpose, key fields, JSONB fields, indexes, RLS notes, status values, and relationships. JSONB fields preserve full planning details while normalized columns support ownership, lookup, approval, job, and audit workflows.

## MVP Tables

### profiles

- Purpose: user-facing profile metadata.
- Key fields: `id`, `user_id`, `display_name`, `avatar_url`, `created_at`, `updated_at`.
- JSONB fields: none.
- Indexes: unique `user_id`.
- RLS notes: users read/update their own profile.
- Status values: none.
- Relationships: auth user to profile.

### workspaces

- Purpose: workspace ownership and plan grouping.
- Key fields: `id`, `owner_id`, `name`, `plan_type`, `created_at`, `updated_at`.
- JSONB fields: none.
- Indexes: `owner_id`.
- RLS notes: owners and members access scoped workspaces.
- Status values: `personal`, `business`.
- Relationships: owner profile/user to workspace.

### workspace_members

- Purpose: workspace membership and role access.
- Key fields: `id`, `workspace_id`, `user_id`, `role`, `created_at`.
- JSONB fields: none.
- Indexes: `workspace_id`, unique `user_id + workspace_id`.
- RLS notes: workspace members can read membership scoped to their workspace.
- Status values: `owner`, `admin`, `editor`, `viewer`.
- Relationships: workspace to users.

### projects

- Purpose: top-level ReeditPro edit project.
- Key fields: `id`, `workspace_id`, `owner_id`, `title`, `editing_category`, `status`, `current_edit_session_id`, `created_at`, `updated_at`.
- JSONB fields: none.
- Indexes: `workspace_id`, `owner_id`, `status`.
- RLS notes: workspace/project membership required.
- Status values: `draft`, `planning`, `approved`, `processing`, `review`, `exported`, `archived`.
- Relationships: workspace to projects; project to current edit session.

### edit_sessions

- Purpose: chat-native planning session state.
- Key fields: `id`, `project_id`, `status`, `current_plan_version_id`, `current_intent_snapshot_id`, `source_order_confirmed`, `created_at`, `updated_at`.
- JSONB fields: none.
- Indexes: `project_id`, `current_plan_version_id`.
- RLS notes: project member scoped.
- Status values: `active`, `awaiting_user`, `approved`, `archived`.
- Relationships: project to sessions; session to current plan and intent.

### chat_messages

- Purpose: chat messages and attachments that shaped planning.
- Key fields: `id`, `edit_session_id`, `role`, `content`, `attachments_json`, `related_clip_ids_json`, `created_at`.
- JSONB fields: `attachments_json`, `related_clip_ids_json`.
- Indexes: `edit_session_id + created_at`.
- RLS notes: project/session member scoped.
- Status values: `user`, `assistant`, `system`.
- Relationships: edit session to messages.

### media_assets

- Purpose: storage references for uploaded, generated, processed, preview, and export media.
- Key fields: `id`, `project_id`, `asset_type`, `storage_bucket`, `storage_path`, `file_name`, `mime_type`, `duration_seconds`, `width`, `height`, `size_bytes`, `status`, `metadata_json`, `created_at`.
- JSONB fields: `metadata_json`.
- Indexes: `project_id`, `asset_type`, `status`.
- RLS notes: private project-scoped access; signed URLs for reads.
- Status values: `uploaded`, `processing`, `ready`, `failed`, `archived`.
- Relationships: project to media assets.

### uploaded_clips

- Purpose: source clip metadata and uploaded-order planning context.
- Key fields: `id`, `project_id`, `media_asset_id`, `uploaded_order`, `source_role`, `user_notes`, `is_important`, `is_optional`, `status`, `created_at`.
- JSONB fields: none.
- Indexes: `project_id + uploaded_order`, `media_asset_id`.
- RLS notes: project member scoped.
- Status values: `active`, `optional`, `excluded`, `archived`.
- Relationships: project to uploaded clips; clip to media asset.

### source_sequence_items

- Purpose: confirmed source/story order.
- Key fields: `id`, `project_id`, `edit_session_id`, `uploaded_clip_id`, `source_order`, `confirmed_order`, `user_confirmed`, `notes`, `created_at`, `updated_at`.
- JSONB fields: none.
- Indexes: `edit_session_id + source_order`.
- RLS notes: project/session member scoped.
- Status values: none.
- Relationships: session to uploaded clips.

### edit_intent_snapshots

- Purpose: versioned compiled intent and professional directive.
- Key fields: `id`, `project_id`, `edit_session_id`, `version`, `status`, `editing_category`, `edit_level`, `target_platform`, `aspect_ratio`, `frame_template_type`, `goal_summary`, `compiled_intent_json`, `professional_editing_directive_json`, `created_from_message_ids_json`, `created_at`.
- JSONB fields: `compiled_intent_json`, `professional_editing_directive_json`, `created_from_message_ids_json`.
- Indexes: `project_id`, `edit_session_id`, `version`.
- RLS notes: project/session member read; backend creates versions.
- Status values: `draft`, `presented`, `approved`, `superseded`.
- Relationships: session to intent snapshots.

### edit_plan_versions

- Purpose: versioned full edit plans.
- Key fields: `id`, `project_id`, `edit_session_id`, `intent_snapshot_id`, `version`, `status`, `goal_summary`, `plan_summary_json`, `full_plan_json`, `credit_estimate_id`, `approval_required`, `approved_at`, `approved_by`, `superseded_by_plan_version_id`, `created_at`, `updated_at`.
- JSONB fields: `plan_summary_json`, `full_plan_json`.
- Indexes: `project_id`, `edit_session_id`, `intent_snapshot_id`, `version`, `status`.
- RLS notes: project member read; backend creates/supersedes versions.
- Status values: `draft`, `presented`, `approved`, `superseded`, `archived`.
- Relationships: plan version to intent snapshot and credit estimate.

### credit_estimates

- Purpose: versioned user-facing credit estimate.
- Key fields: `id`, `project_id`, `edit_plan_version_id`, `estimate_version`, `edit_level`, `editing_category`, `total_credits`, `fallback_allowance_credits`, `risk_level`, `estimate_json`, `status`, `created_at`.
- JSONB fields: `estimate_json`.
- Indexes: `project_id`, `edit_plan_version_id`, `status`.
- RLS notes: user reads estimates; backend creates estimates.
- Status values: `draft`, `presented`, `approved`, `superseded`, `expired`.
- Relationships: plan version to credit estimates.

### credit_estimate_items

- Purpose: itemized credit estimate lines.
- Key fields: `id`, `credit_estimate_id`, `label`, `credits`, `reason`, `category`, `metadata_json`.
- JSONB fields: `metadata_json`.
- Indexes: `credit_estimate_id`.
- RLS notes: follows parent estimate access.
- Status values: none.
- Relationships: credit estimate to items.

### approval_records

- Purpose: exact plan/credit/snapshot approval audit.
- Key fields: `id`, `project_id`, `edit_session_id`, `edit_plan_version_id`, `credit_estimate_id`, `approval_type`, `approved_by`, `approved_at`, `approved_snapshot_id`, `approved_snapshot_summary_json`, `audit_metadata_json`.
- JSONB fields: `approved_snapshot_summary_json`, `audit_metadata_json`.
- Indexes: `project_id`, `edit_plan_version_id`, `approved_snapshot_id`.
- RLS notes: user can create approval through backend flow only; no direct snapshot mutation.
- Status values: `pending`, `approved`, `revoked`, `superseded`.
- Relationships: approval to plan, estimate, snapshot.

### approved_plan_snapshots

- Purpose: immutable worker execution contract.
- Key fields: `id`, `project_id`, `edit_session_id`, `edit_plan_version_id`, `credit_estimate_id`, `approved_by`, `approved_at`, `snapshot_version`, `snapshot_json`, `immutable`, `status`, `created_at`.
- JSONB fields: `snapshot_json`.
- Indexes: `project_id`, `edit_plan_version_id`, `status`.
- RLS notes: user cannot mutate; service role can append/create through approval flow.
- Status values: `active`, `superseded`, `revoked`.
- Relationships: snapshot to plan and credit estimate.

### generation_requests

- Purpose: future provider/model generation requests after approval.
- Key fields: `id`, `project_id`, `edit_plan_version_id`, `approved_plan_snapshot_id`, `visual_asset_plan_item_id`, `provider_model`, `provider_route_json`, `prompt_plan_json`, `status`, `credit_reservation_id`, `created_at`, `updated_at`.
- JSONB fields: `provider_route_json`, `prompt_plan_json`.
- Indexes: `project_id`, `approved_plan_snapshot_id`, `status`.
- RLS notes: backend/worker creates and updates; user reads project-scoped state.
- Status values: `planned`, `queued`, `blocked`, `generating`, `completed`, `failed`, `cancelled`.
- Relationships: generation request to approved snapshot and generated assets.

### generated_assets

- Purpose: generated asset storage references.
- Key fields: `id`, `project_id`, `generation_request_id`, `asset_type`, `storage_bucket`, `storage_path`, `width`, `height`, `duration_seconds`, `background_color`, `metadata_json`, `status`, `created_at`.
- JSONB fields: `metadata_json`.
- Indexes: `project_id`, `generation_request_id`, `status`.
- RLS notes: private project-scoped reads; worker writes.
- Status values: `uploaded`, `processing`, `ready`, `failed`, `archived`.
- Relationships: generation request to generated assets.

### editing_jobs

- Purpose: future worker job records.
- Key fields: `id`, `project_id`, `edit_plan_version_id`, `approved_plan_snapshot_id`, `job_type`, `status`, `worker_runtime_plan_json`, `created_at`, `started_at`, `completed_at`.
- JSONB fields: `worker_runtime_plan_json`.
- Indexes: `project_id`, `approved_plan_snapshot_id`, `status`.
- RLS notes: service role writes; project members read job status.
- Status values: `planned`, `queued`, `running`, `blocked`, `completed`, `failed`, `cancelled`.
- Relationships: job to approved snapshot and job steps.

### job_steps

- Purpose: ordered worker step events and IO envelopes.
- Key fields: `id`, `editing_job_id`, `step_order`, `step_type`, `worker_group`, `status`, `input_json`, `output_json`, `error_json`, `started_at`, `completed_at`.
- JSONB fields: `input_json`, `output_json`, `error_json`.
- Indexes: `editing_job_id + step_order`.
- RLS notes: follows parent job access; service role writes.
- Status values: `planned`, `queued`, `running`, `completed`, `failed`, `skipped`.
- Relationships: editing job to steps.

### qa_reports

- Purpose: QA summaries and structured check results.
- Key fields: `id`, `project_id`, `edit_plan_version_id`, `editing_job_id`, `approved_plan_snapshot_id`, `status`, `summary`, `report_json`, `created_at`.
- JSONB fields: `report_json`.
- Indexes: `project_id`, `approved_plan_snapshot_id`, `status`.
- RLS notes: project member reads; backend/worker writes.
- Status values: `planned`, `passed`, `warning`, `failed`, `blocked`.
- Relationships: QA to plan, job, and snapshot.

### final_exports

- Purpose: final export records and storage references.
- Key fields: `id`, `project_id`, `edit_plan_version_id`, `approved_plan_snapshot_id`, `renderer_composition_plan_id`, `export_format`, `aspect_ratio`, `storage_bucket`, `storage_path`, `status`, `created_at`.
- JSONB fields: none for MVP.
- Indexes: `project_id`, `approved_plan_snapshot_id`, `status`.
- RLS notes: private project-scoped export access; signed URLs for download.
- Status values: `planned`, `queued`, `rendering`, `ready`, `failed`, `cancelled`.
- Relationships: export to approved snapshot.

### audit_events

- Purpose: append-only audit events.
- Key fields: `id`, `workspace_id`, `project_id`, `actor_user_id`, `event_type`, `event_json`, `created_at`.
- JSONB fields: `event_json`.
- Indexes: `workspace_id`, `project_id`, `created_at`.
- RLS notes: service role inserts; users cannot update/delete.
- Status values: none.
- Relationships: workspace/project to audit events.
