# Prompt 3 Schema Target Guardrails

Prompt 3 remains: Auth/Profile/Workspace/RLS Production Path. Prompt 2A allows Prompt 3 to proceed only inside the canonical auth/profile/workspace/project boundary.

## Allowed Scope

Prompt 3 may implement or document:

- Authenticated user bootstrap.
- Profile creation/read/update for safe profile fields.
- Workspace creation/bootstrap.
- Workspace membership and role checks.
- Project access checks and project bootstrap where needed for auth/RLS validation.
- RLS tests for owner/member/editor/non-member behavior.
- Backend route boundaries for auth/profile/workspace/project access.

## Exact Canonical Tables Prompt 3 May Target

- `auth.users`
- `profiles`
- `workspaces`
- `workspace_members`
- `projects`
- `audit_events` only if Prompt 3 explicitly includes append-only audit events for auth/workspace actions.

## Exact Tables Prompt 3 Must Avoid

- `user_profiles`
- `edit_sessions`, `chat_messages`, `chat_sessions`, `chat_attachments`, `inline_chat_cards`, `chat_actions`
- `media_assets`, `uploaded_clips`, `source_sequence_items`, `reference_assets`
- `upload_intents`, `storage_object_records`, `signed_url_events`
- `edit_intent_snapshots`, `edit_settings_snapshots`, `edit_plan_versions`, `plan_component_snapshots`, `edit_plan_segments`, `signature_routes`
- `credit_estimates`, `credit_estimate_items`, `approval_records`, `credit_reservations`, `credit_ledger_entries`, `refund_records`
- `approved_plan_snapshots`
- `editing_jobs`, `job_steps`, `worker_events`, `worker_leases`, `backend_runtime_messages`, `job_claim_attempts`, `worker_job_claims`
- `generation_requests`, `generation_events`, `generated_assets`, `generated_asset_versions`, provider catalog tables, provider attempt tables, and webhooks
- `render_jobs`, `render_job_inputs`, `renders`, `render_events`, `final_exports`
- `qa_reports`, `qa_check_results`, `revision_requests`
- `tool_runtime_checks`
- SFX, StoryTiming, and draft-only tables

## RLS Tests Prompt 3 Should Prepare

- Authenticated user can read own `profiles` row.
- User cannot read another user's private profile fields.
- Workspace owner can read own workspace and membership.
- Workspace member can read assigned workspace/project records.
- Non-member cannot read workspace/project records.
- Viewer/member/editor role differences are enforced where roles exist.
- Normal user cannot create privileged membership for another user.
- Bootstrap path is idempotent.
- Service-role/admin path, if added, emits sanitized audit events and never returns service-role-only data to frontend.

## Service-Role Handler Boundaries

Prompt 3 may add service-role handlers only for auth/profile/workspace/project bootstrap if explicitly scoped. It must not add service-role handlers for storage, credits, snapshots, jobs, workers, providers, rendering, tools, Stripe, or execution state.

## Backend Route Boundaries

Allowed route groups:

- `auth`
- `profiles`
- `workspaces`
- `projects` only for access/bootstrap behavior

Blocked route groups:

- `storage`
- `media`
- `planning`
- `approval/snapshots`
- `credits`
- `jobs`
- `workers`
- `providers`
- `tools`
- `render`
- `qa`
- `revisions`
- `exports`
- `billing`

## Validation Required

- `git diff --check`.
- Base diff whitespace check.
- Build/lint/tests as required by code touched.
- RLS smoke tests if Prompt 3 touches SQL or RLS test files.
- Explicit statement of what production capability was enabled and what remains blocked.

## Blockers That Stop Prompt 3

- Need to modify SQL migrations before auth/profile/workspace behavior can be safe.
- Need to target `user_profiles` or any legacy RP-DB duplicate table.
- Need to write media/storage/credit/job/provider/render/tool execution records.
- Missing ability to validate RLS for `profiles`, `workspaces`, `workspace_members`, and `projects`.
- Any requirement to run remote Supabase migrations or staging migrations inside Prompt 3 without separate approval.
