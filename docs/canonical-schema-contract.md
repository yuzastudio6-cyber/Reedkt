# Canonical Schema Contract

This is the concise schema contract future backend prompts must use after Prompt 2A. It is documentation-only and does not change SQL.

## Canonical Table List By Domain

| Domain | Canonical tables | Ownership layer | Notes |
| --- | --- | --- | --- |
| Auth/profile/workspace/project | `auth.users`, `profiles`, `workspaces`, `workspace_members`, `projects` | Supabase + backend API | Safe scope for Prompt 3. |
| Chat | `edit_sessions`, `chat_messages`; attachment table pending review | Frontend requests, backend persistence | Do not execute raw chat. |
| Media/source order | `media_assets`, `uploaded_clips`, `source_sequence_items` | Backend/storage services | Source order freezes after approval. |
| Storage runtime | `upload_intents`, `storage_object_records`, `signed_url_events` | Backend API | Bucket/path only as source of truth. |
| Planning/versioning | `edit_intent_snapshots`, `edit_settings_snapshots`, `edit_plan_versions`, `plan_component_snapshots`, `edit_plan_segments` | Backend planner | Approved execution uses snapshots, not raw chat. |
| Approval/snapshots | `approval_records`, `approved_plan_snapshots` | Backend API | Approved snapshot payload immutable. |
| Credits | `credit_estimates`, `credit_estimate_items`, `credit_reservations`, `credit_ledger_entries`, `refund_records` | Backend credit service | Ledger append-only. |
| Jobs/workers | `editing_jobs`, `job_steps`, `worker_events`, `worker_leases`, `backend_runtime_messages`, `job_claim_attempts`, `worker_job_claims` | Backend/worker | No duplicate active worker claims. |
| Generation/provider/assets | `generation_requests`, `generation_events`, `generated_assets`, `generated_asset_versions`, `provider_request_attempts`, `provider_webhook_events` | Backend provider gateway/worker | Provider attempts sanitized; no secrets. |
| Provider catalog | `generation_providers`, `generation_provider_capabilities`, `generation_provider_models` | Backend provider gateway | Active but needs review before real calls. |
| Render/export | `render_jobs`, `render_job_inputs`, `renders`, `render_events`, `final_exports` | Backend render/export services | Render records need later cleanup before execution. |
| QA/revision | `qa_reports`, `qa_check_results`, `revision_requests` | Backend QA/revision services | Blocking QA prevents export. |
| Tool readiness | `tool_runtime_checks` | Backend/worker readiness | Registry is not execution readiness. |
| Audit | `audit_events` | Backend API | Append-only privileged event record. |
| Unique planning systems | `stroke_motion_*`, `sfx_*`, `master_timing_maps`, `story_timing_*`, `timing_*`, `render_timing_*` | Backend/planner/future workers | Active but needs service-specific review. |

## Backend-Only Tables

`approved_plan_snapshots`, `credit_reservations`, `credit_ledger_entries`, `refund_records`, `editing_jobs`, `job_steps`, `worker_events`, `worker_leases`, `backend_runtime_messages`, `job_claim_attempts`, `worker_job_claims`, `provider_request_attempts`, `provider_webhook_events`, `render_jobs`, `render_job_inputs`, `renders`, `render_events`, `final_exports`, `qa_reports`, `qa_check_results`, `tool_runtime_checks`, `storage_object_records`, `signed_url_events`, and `audit_events`.

## User-Readable Tables

Users may read records scoped by workspace/project RLS for `profiles`, `workspaces`, `workspace_members`, `projects`, `edit_sessions`, `chat_messages`, `media_assets`, source sequence records, plan summaries, credit estimates, approved snapshot summaries, job status summaries, generated asset metadata, preview/export status, revision requests, and sanitized QA summaries.

## User-Writable Tables

User writes are limited to RLS-safe profile fields, user-created project metadata where allowed, chat messages, explicit confirmations/approvals, draft source order before approval, preview/revision requests, and other frontend-safe request records. Users must never mutate execution state.

## Append-Only Tables

`credit_ledger_entries`, `refund_records`, `worker_events`, `job_claim_attempts`, `provider_request_attempts`, `provider_webhook_events`, `render_events`, `qa_check_results`, `signed_url_events`, and `audit_events` must be append-only or append-style in production.

## Immutable Tables

`approved_plan_snapshots` payload fields are immutable after creation. Completed `final_exports`, generated asset versions, approved source sequence state, and approved credit/approval records must preserve history and never be overwritten casually.

## Storage Source Of Truth

`storage_object_records` is the canonical storage source-of-truth table. It stores bucket/path and safe metadata only. `upload_intents` request uploads. `signed_url_events` records temporary URL issuance metadata but must never store signed URL values.

## Secret And Signed URL Rules

- No table may store provider API keys, service-role keys, OAuth tokens, webhook signing secrets, raw credentials, or private env values.
- No table may store signed URL values as source of truth.
- Provider request/response rows must store sanitized summaries only.

## Tables Safe For Prompt 3

- `auth.users`
- `profiles`
- `workspaces`
- `workspace_members`
- `projects`
- `audit_events` only if Prompt 3 explicitly adds append-only auth/workspace audit events.

## Tables Prompt 3 Must Avoid

`user_profiles`, all chat/session/message/attachment tables, all media/source/storage tables, all planning and approved snapshot tables, all credit tables, all job/worker tables, all generation/provider/render/export/QA/revision/tool tables, all SFX/StoryTiming tables, all draft-only migration tables, and all production execution state.
