# Schema Conflict Inventory

Prompt 2 documents conflicts, duplicates, and naming inconsistencies only. It does not fix migrations.

## Duplicate Table Concepts

The static audit found active duplicate table names:

- `workspaces`
- `workspace_members`
- `projects`
- `chat_messages`
- `media_assets`
- `edit_plan_segments`
- `credit_estimates`
- `credit_reservations`
- `credit_ledger_entries`
- `generation_requests`
- `generation_events`
- `generated_assets`
- `generated_asset_versions`
- `qa_reports`
- `revision_requests`

These duplicates indicate two active schema eras: the broader RP-DB chain from `20260513...` and the RP-DATA/runtime chain from `20260518...` onward.

## Active Vs Legacy Table Names

| Domain | Earlier active name | Later active/draft name | Risk |
| --- | --- | --- | --- |
| User profile | `user_profiles` | `profiles` | Auth bootstrap may target the wrong profile table. |
| Planning | `edit_plans` | `edit_plan_versions` | Approval/snapshot services need one canonical plan version source. |
| Source order | `source_clip_sequences`, `source_clip_sequence_items` | `uploaded_clips`, `source_sequence_items` | Upload order and source confirmation may fork. |
| Jobs | `job_batches`, `jobs`, `job_dependencies`, `job_events` | `editing_jobs`, `job_steps`, `worker_events`, runtime claims | Worker orchestration could split across incompatible lifecycles. |
| Export | `exports`, `export_variants` | `final_exports` | Final export readiness and storage records may diverge. |
| Audit | `event_log` | `audit_events`, runtime event tables | Audit retention and append-only behavior may split. |

## Inconsistent Status Names

- Job state is represented across job batches, jobs, editing jobs, job steps, worker leases, worker claims, and claim attempts.
- Generation state is represented across generation requests, events, generated assets, asset versions, provider attempts, and provider webhooks.
- Render/export state is represented across render jobs, renders, exports, final exports, QA reports, preview reviews, and revisions.
- Credit state appears in estimates, approvals, reservations, ledger entries, refunds, and refund records.

Resolution should define canonical status families and explicit translation rules where legacy rows remain.

## Inconsistent Workspace/Project Ownership Fields

- Some tables carry direct `workspace_id`.
- Some tables carry only `project_id` and require a project-to-workspace join.
- Storage object paths embed workspace/project ids.
- Policies use both direct workspace checks and project-member helper checks.

Resolution should specify when direct `workspace_id` is mandatory and when project-derived membership is allowed.

## Overlapping Media Tables

- Earlier chain: `media_assets`, `source_clip_sequences`, `source_clip_sequence_items`, `reference_assets`.
- Later chain: `media_assets`, `uploaded_clips`, `source_sequence_items`, `clip_analysis_snapshots`.
- Runtime readiness: `upload_intents`, `storage_object_records`, `signed_url_events`.

Resolution should make `storage_object_records` canonical for bucket/path, define one media asset table, and define one source order table family.

## Overlapping Generation/Render Asset Tables

- Earlier generation chain: provider/model/capability tables, `generation_requests`, `generation_request_inputs`, `generated_assets`, versions, timing maps, events, costs.
- Later generation chain: `generation_requests`, `generation_events`, `generated_assets`, versions, `editing_jobs`, `job_steps`, `worker_events`.
- Render/export chain: `render_jobs`, `renders`, `exports`, `export_variants`, later `final_exports`.

Resolution should decide which table family is canonical for requests, attempts, assets, render outputs, and final exports.

## Old Docs That May Mislead Future Prompts

- `database/migration-drafts/` files are useful design references but should not be treated as active migrations without a dedicated promotion milestone.
- Older SQL draft/review docs may refer to target table names that now exist in active SQL with different shapes.
- Mock runtime docs describe safe frontend or local behavior and should not be read as production readiness.

## Migration Order Risks

- Duplicate `create table` statements can fail if both schema eras run as-is without guards or reconciliation.
- Duplicate helper functions are common and may be safe only where `create or replace` semantics are used.
- RLS policies may target table shapes from one schema era and miss or conflict with another.
- Storage bucket insert statements and path policies need idempotency/path compatibility validation.

## RLS Naming Risks

- Policy names may duplicate or imply broader access than intended.
- Helper function names such as `is_workspace_member` exist across eras and must be reviewed for final body semantics.
- Authenticated user policies must not allow execution-state mutation through owner/editor roles.

## Storage Path Conflicts

- Older storage policy direction uses `<project_id>/...`.
- RP-FIX-07 readiness uses `workspace/{workspace_id}/project/{project_id}/...`.
- Future signed URL routes and storage object records must enforce one canonical path format.

## Recommended Resolution Path

1. Run Prompt 2A - Schema Gap Fix Plan.
2. Choose a canonical schema era or write explicit compatibility migrations.
3. Decide canonical names for profile, plan, media, source sequence, credit, job, generation, asset, QA, revision, export, and audit tables.
4. Update `supabase/migration-order.md` and planning docs to remove ambiguity.
5. Add local-only SQL validation for duplicate table conflicts before staging.
6. Only after local validation passes, proceed to Prompt 3 auth/profile/workspace/RLS production path.
