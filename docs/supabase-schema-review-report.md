# Supabase Schema Review Report

Prompt 2 reviewed the Supabase schema and migration foundation before production backend service-role handlers, storage upload runtime, approved snapshots, credits, jobs, render readiness, provider attempts, and tool-call records are implemented. This report is documentation and validation infrastructure only. It does not apply migrations or enable production execution.

## A. Executive Summary

- Current schema readiness level: `needs_review`. The repo has a broad local/review-ready schema foundation, but active migrations contain overlapping table concepts and two schema eras that must be reconciled before production backend work depends on them.
- Local validation readiness: ready for disposable local validation as a gap-finding exercise only. The chain has enough files and SQL smoke tests to run locally, but Prompt 2 did not reset a local Supabase database or execute SQL tests.
- Staging/production validation readiness: not ready. Staging requires a schema gap fix plan, explicit human approval, backup/rollback plan, Supabase advisor review, and RLS/storage policy verification.
- Safe to build next: a documentation-backed schema gap fix plan, then auth/profile/workspace/RLS production path after conflicts are resolved.
- Blocked: production service-role handlers, remote migrations, staging migrations, storage signed routes, real credit ledger mutation, job worker claims, provider attempts, render execution, and tool runtime execution.

Recommended next prompt: Prompt 2A - Schema Gap Fix Plan before Prompt 3.

## Prompt 2A Follow-Up Note

Prompt 2A created the schema gap fix plan, canonical schema contract, table concept resolution matrix, schema era deprecation plan, and Prompt 3 schema target guardrails. The decision is docs-only: future backend work must target the newer RP-DATA/runtime contract for duplicated runtime concepts, while older RP-DB tables remain legacy/reference unless they are unique planning-domain tables that still need service-specific review.

Prompt 3 may proceed after Prompt 2A, but only for `auth.users`, `profiles`, `workspaces`, `workspace_members`, and `projects`. SQL schema cleanup, local/staging migration validation, storage/upload runtime, approved snapshots, credits, jobs, workers, providers, rendering, Stripe, and tool execution remain blocked for later prompts.

## B. Migration Inventory

The static audit scanned 21 active migration files, 8 draft migration files, and 5 test SQL files. Active migrations currently include 161 `create table` statements, 148 `create type` statements, 36 `create function` statements, 378 `create policy` statements, 1022 `create index` statements, 7 views, 113 triggers, 151 RLS enable statements, and 2 storage bucket insert groups. See `docs/generated/supabase-schema-static-audit.json` for machine-readable details.

| Migration | Declared purpose | Domain | Depends on | Creates tables | Creates enums | Functions | Triggers/views/indexes | RLS/storage/seed | Notes/risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `202605130001_core_reeditpro_tables.sql` | Core ReeditPro tables | account/workspace/projects/chat/media | Auth users, pgcrypto | 15: plans, user profiles, workspaces, members, subscriptions, projects, chat, media, source sequence, references | 15 | 5 helper/update functions | 12 triggers, 64 indexes | 50 policies, RLS on 15 tables, plan seed rows | First schema era. Later migrations recreate `workspaces`, `workspace_members`, `projects`, `chat_messages`, and `media_assets`. |
| `202605130002_intent_edit_planning_tables.sql` | Intent and edit planning | planning | core project/chat/media/source records | 12: intent analyses, sequence maps, edit plans, story beats, segments, routes, notes | 11 | 4 helpers | 9 triggers, 72 indexes | 36 policies, RLS on 12 tables | Includes broad planning shape; later RP-DATA migration creates newer plan-version tables and another `edit_plan_segments`. |
| `202605130003_professional_edit_quality_engine.sql` | Professional edit quality engine | edit quality | core + planning | 10: quality profiles, pacing, cuts, transitions, audio, music, SFX, captions, checks | 25 | 4 helpers | 10 triggers, 74 indexes | 30 policies, RLS on 10 tables | Useful planning layer; must link cleanly to approved snapshots before execution. |
| `202605130004_credit_ledger_approval_gate.sql` | Credit ledger and approval gate | credits/approval | core + edit plans/routes | 9: wallets, grants, ledger, estimates, approvals, reservations, refunds | 10 | `set_updated_at`, `can_start_generation` | 7 triggers, 1 view, 76 indexes | 26 policies, RLS on 9 tables | Credit tables are duplicated later by RP-DATA. Transactional reserve/spend/refund is not implemented. |
| `202605130005_job_orchestration_agent_runs.sql` | Job orchestration and agent runs | jobs/workers | core + plans + credits | 9: batches, jobs, dependencies, events, agent runs/outputs, worker configs/heartbeats, event log | 12 | `set_updated_at`, `can_run_job` | 5 triggers, 1 view, 99 indexes | 24 policies, RLS on 9 tables | Helper relies on approvals/reservations. Real service-role queue and claim path absent. |
| `202605130006_stroke_motion_data_model.sql` | Stroke Motion planning | Stroke Motion | core + planning + credits + jobs | 12 Stroke Motion planning/spec/example tables | 11 | `set_updated_at` | 10 triggers, 75 indexes | 34 policies, RLS on 12 tables | Planning-only. No animation generation or provider/render execution. |
| `202605130007_generation_providers_generated_assets.sql` | Providers and generated assets | provider/assets | core + planning + credits + jobs + Stroke Motion | 10: providers, models, generation requests, generated assets/versions, timing maps, events, costs | 11 | `set_updated_at` | 6 triggers, 87 indexes | 21 policies, RLS on 10 tables | Provider keys are not stored, but secret reference fields need validation. Duplicate generation/assets tables appear later. |
| `202605130008_render_preview_export_revision_qa.sql` | Render, preview, export, revision, QA | render/export/QA | all prior RP-DB migrations | 12: render jobs/inputs, renders/events, exports/variants, reviews, revisions, QA | 18 | `set_updated_at`, `can_export_render` | 9 triggers, 1 view, 145 indexes | 39 policies, RLS on 12 tables | Render records exist, but no Remotion/FFmpeg execution. Duplicate QA/revision concepts appear later. |
| `202605180001_reeditpro_core_workspace_projects.sql` | RP-DATA core workspace/projects | account/workspace/projects/chat | active core concepts | 7: profiles, workspaces, members, projects, edit sessions, chat messages, confirmations | 0 | `set_updated_at` | 4 triggers, 7 indexes | no direct RLS in this file | Second schema era recreates several core table names. Critical conflict if run after RP-DB core without guards. |
| `202605180002_reeditpro_media_source_sequence.sql` | Media/source sequence | media/source order | RP-DATA core | 4: media assets, uploaded clips, source sequence items, clip analysis snapshots | 0 | 0 | 3 triggers, 5 indexes | no direct RLS in this file | Recreates `media_assets`; source sequence names differ from RP-DB chain. |
| `202605180003_reeditpro_intent_plan_versions.sql` | Intent and plan versions | planning/snapshots | RP-DATA core/media | 6: intent/settings snapshots, plan versions/components/segments/operations | 0 | 0 | 1 trigger, 6 indexes | no direct RLS in this file | Introduces versioned planning model, but overlaps with RP-DB edit plans/segments. |
| `202605180004_reeditpro_credits_approval_snapshots.sql` | Credits, approvals, approved snapshots | credits/snapshots | RP-DATA planning | 7: estimates/items, reservations, ledger, refunds, approvals, approved snapshots | 0 | 2 immutability helpers | 5 triggers, 7 indexes | no direct RLS in this file | Recreates credit tables and adds approved snapshots. Needs canonical choice before production. |
| `202605180005_reeditpro_generation_assets_jobs.sql` | Generation/assets/jobs | generation/jobs/assets | RP-DATA snapshots/credits | 7: generation requests/events, generated assets/versions, editing jobs, job steps, worker events | 0 | 0 | 2 triggers, 9 indexes | no direct RLS in this file | Recreates generation and generated asset tables with different job names. |
| `202605180006_reeditpro_qa_exports_audit.sql` | QA, exports, audit | QA/export/audit | RP-DATA jobs/assets | 7: QA reports/checks, revisions, final exports, audit/readiness/license snapshots | 0 | 1 append-only helper | 2 triggers, 8 indexes | no direct RLS in this file | Recreates `qa_reports` and `revision_requests`; uses `final_exports` instead of RP-DB `exports`. |
| `202605180007_reeditpro_rls_policies.sql` | Consolidated RLS policies | RLS | RP-DATA tables | 0 | 0 | 5 RLS helpers | no triggers/indexes | 63 policies, RLS on 38 tables | Likely targets RP-DATA table set. Must be reconciled with earlier RP-DB RLS policies. |
| `202605180008_reeditpro_storage_buckets_policies.sql` | Storage buckets/policies | storage | RP-DATA projects/RLS helpers | 0 | 0 | 0 | none | 3 policies, 1 bucket insert group | Creates private buckets with older `<project_id>/...` path convention. |
| `202605190001_sfx_director_tables.sql` | SoundSync SFX Director tables | SFX | RP-DB foundations + shared helpers | 12 SFX plan/provider/prompt/generated/trim/mix/QA/library tables | 20 | `set_updated_at` | 10 triggers, 1 view, 138 indexes | 36 policies, RLS on 12 tables | Planning and metadata only. No SFX provider execution. |
| `202605190002_storytiming_master_tables.sql` | StoryTiming master tables | timing/render readiness | RP-DB + SFX | 11 timing maps/segments/anchors/events/conflicts/manifests tables | 15 | `set_updated_at` | 10 triggers, 3 views, 128 indexes | no direct RLS in this file | Timing coordination is present, but real transcript/audio alignment is not. RLS must be verified. |
| `202605200001_storage_upload_pipeline_readiness.sql` | Storage upload policy readiness | storage/upload | RP-DATA RLS/storage buckets | 0 | 0 | 0 | none | 3 policies, 1 bucket insert group | Adds workspace/project path policies. Conflicts with old path convention require tests. |
| `202605200002_worker_leases_runtime_transport.sql` | Worker leases/runtime transport | worker leases/messages | core projects/jobs/helpers | 3: worker leases, backend runtime messages, claim attempts | 0 | 0 | 9 indexes | 3 policies, RLS on 3 tables | Mutation is service-role-only by design, but no service implementation exists. |
| `202605210001_e2e_runtime_readiness_tables.sql` | Runtime readiness tables | snapshots/idempotency/storage/worker/tool/provider | core, planning, credits, jobs, storage, worker readiness | 8: idempotency, upload intents, storage records, signed URL events, worker claims, tool checks, provider attempts/webhooks | 0 | 4 gate helpers | 8 triggers, 13 indexes | 10 policies, RLS on 9 tables | Useful production-boundary additions, but only review-ready until validated locally/staging. |

## C. Active Vs Draft Schema Comparison

- Active implementation target: `supabase/migrations/` is the runnable migration chain candidate, but Prompt 2 identifies it as unresolved because older RP-DB migrations and later RP-DATA/runtime migrations overlap.
- Draft-only artifacts: `database/migration-drafts/001` through `008` mirror the RP-DATA schema shape and should remain review-only until a dedicated migration milestone promotes or replaces active SQL.
- Database planning docs: `database-architecture.md`, `supabase-table-specification.md`, `supabase-schema-planning-bridge.md`, and runtime readiness docs describe the intended domains, but do not resolve every active duplicate table name.
- Duplicate concepts: workspaces, workspace members, projects, chat messages, media assets, edit plan segments, credit estimates, credit reservations, credit ledger entries, generation requests, generation events, generated assets, generated asset versions, QA reports, and revision requests exist in multiple schema eras.
- Renamed table families: `exports` versus `final_exports`, `jobs` versus `editing_jobs`/`job_steps`, `source_clip_sequences`/`source_clip_sequence_items` versus `uploaded_clips`/`source_sequence_items`, and `edit_plans` versus `edit_plan_versions`.
- Outdated docs risk: older draft review docs can still be useful context, but future prompts must not assume draft migrations are active without checking this report and `docs/schema-conflict-inventory.md`.

## D. Table Group Review

| Group | Tables | Ownership layer | User writable or backend-only | RLS expectations | Append-only / immutability | Production blockers |
| --- | --- | --- | --- | --- | --- | --- |
| Account/workspace/auth | `user_profiles`, `profiles`, `workspaces`, `workspace_members`, `subscriptions`, `plans` | Supabase source of truth; backend for bootstrap/admin | User profile fields may be user-writable where RLS allows; workspace/member bootstrap needs backend path | Workspace/member scoped reads; no cross-workspace leakage | Membership history/audit should not be silently rewritten | Duplicate profile/workspace model and bootstrap policy need reconciliation. |
| Projects/chat | `projects`, `edit_sessions`, `chat_sessions`, `chat_messages`, `chat_attachments`, `inline_chat_cards`, `chat_actions`, `user_confirmations` | Frontend requests, Supabase records, backend for privileged state | Chat content may be user-writable; execution state backend-only | Project membership scoped | Approved confirmations must survive history/revisions | Duplicate chat/project tables and status lifecycles need canonical mapping. |
| Media/source sequence | `media_assets`, `reference_assets`, `source_clip_sequences`, `source_clip_sequence_items`, `uploaded_clips`, `source_sequence_items`, `clip_analysis_snapshots` | Backend/storage creates canonical records; frontend can request upload/order | Source order edits user-requested until approval; storage records backend-only | Project scoped; source media private | Source order must freeze after approved snapshot unless new revision | Duplicate `media_assets`; path and ownership field differences. |
| Intent/edit planning | `intent_analyses`, `source_sequence_maps`, `recommended_edit_structures`, `edit_plans`, `story_beat_maps`, `story_beats`, `edit_plan_segments`, `signature_routes`, `edit_instructions`, `planning_notes`, `edit_intent_snapshots`, `edit_settings_snapshots`, `edit_plan_versions`, `plan_component_snapshots`, `edit_operations` | Backend planning service owns structured records | Frontend may request changes; backend writes plan versions | Project scoped reads; direct user mutation limited to draft interaction records | Approved plan versions immutable | `edit_plans` and `edit_plan_versions` must be reconciled. |
| Professional edit quality | `edit_quality_profiles`, `pacing_analysis`, `cut_decisions`, `transition_plans`, `audio_environment_analysis`, `ambient_sound_plans`, `music_plans`, `sound_effect_plans`, `caption_plans`, `edit_quality_checks` | Backend/planner records | Backend/planner writes | Project scoped | Quality decisions freeze in approved snapshot | Needs mapping into snapshot and render manifest. |
| Credits/approval/reservations | `credit_wallets`, `credit_grants`, `credit_ledger_entries`, `credit_estimates`, `credit_estimate_line_items`, `credit_estimate_items`, `credit_approvals`, `approval_records`, `credit_reservations`, `credit_reservation_line_items`, `refund_records`, `credit_refunds` | Backend credit service and Supabase ledger | Backend-only for ledger/reservation/spend/refund | User-readable workspace/project summaries; mutation service-role only | Ledger append-only; approvals/reservations auditable | Duplicate credit table families and no transactional runtime. |
| Approved plan snapshots | `approved_plan_snapshots` | Backend-only snapshot service | Backend-only creates; normal users cannot mutate snapshot JSON | Project scoped read after approval | Immutable except explicit audit/status fields | Needs canonical source plan table and local immutability test. |
| Jobs/agent runs/workers | `job_batches`, `jobs`, `job_dependencies`, `job_events`, `agent_runs`, `agent_outputs`, `editing_jobs`, `job_steps`, `worker_events` | Backend job orchestration; workers through backend-safe paths | Backend/worker-only for execution state | Project/workspace scoped reads only | Job events append-only | Duplicate job model and no transactional claim service. |
| Stroke Motion | `stroke_motion_*` tables | Planner/backend | Backend/planner writes | Project scoped | Plans freeze into approved snapshot | Planning-only until renderer/provider/tool lane exists. |
| Generation providers/assets | `generation_providers`, `generation_provider_capabilities`, `generation_provider_models`, `generation_requests`, `generation_request_inputs`, `generated_assets`, `generated_asset_versions`, `generated_asset_timing_maps`, `generation_events`, `generation_request_costs` | Backend provider gateway and workers | Backend/worker-only for requests/results | Users read relevant status/artifacts; no direct execution writes | Attempts/events append-only | Duplicate generation/assets; no provider gateway or secrets runtime. |
| Render/preview/export/revision/QA | `render_jobs`, `render_job_inputs`, `renders`, `render_events`, `exports`, `export_variants`, `preview_reviews`, `review_comments`, `revision_requests`, `revision_request_items`, `qa_reports`, `qa_report_items`, `qa_check_results`, `final_exports` | Backend render/QA/export services and workers | User may write preview reviews/revision requests; execution records backend-only | Project scoped reads; writes restricted by record type | QA/events/audit append-only; exports immutable after completion | Duplicate export/QA/revision models and no render worker. |
| SFX | `sfx_event_plans`, `sfx_provider_routes`, `sfx_prompt_plans`, `sfx_generated_assets`, `sfx_trim_plans`, `sfx_timing_alignments`, `sfx_mix_plans`, `sfx_qa_reports`, `sfx_qa_issues`, `sfx_library_candidates`, `sfx_usage_records`, `sfx_prompt_adapter_tests` | Planner/backend/future SFX worker | Backend/planner writes; worker writes generated/QA records later | Project scoped | Generated SFX provenance and QA should be append-safe | Provider execution remains blocked. |
| StoryTiming | `master_timing_maps`, `story_timing_segments`, `timing_anchors`, `timing_events`, `timing_dependencies`, `timing_conflicts`, `timing_conflict_resolutions`, `story_timing_qa_checks`, `render_timing_manifests`, `render_timing_manifest_tracks`, `render_timing_manifest_events` | Backend timing service/planner | Backend/planner writes | Project scoped | Timing map must freeze in approved snapshot | RLS and status lifecycle need local validation. |
| Storage/upload readiness | `upload_intents`, `storage_object_records`, `signed_url_events`, storage buckets | Backend signed URL/storage services | Backend-only creates canonical records; frontend can request intents | Project scoped; private buckets by default | Signed URL events append-only; no signed URL as truth | Old/new path conventions conflict; no signed route implementation. |
| Worker leases/runtime transport | `worker_leases`, `backend_runtime_messages`, `job_claim_attempts`, `worker_job_claims`, `worker_runtime_configs`, `worker_heartbeats` | Backend/worker | Backend/worker-only mutation | Worker-visible through service role; user read summaries only | Claim attempts/events append-only | Needs transaction-safe claim and heartbeat validation. |
| Tool runtime checks | `tool_runtime_checks` | Backend/worker readiness service | Backend/worker-only writes | Users may read sanitized readiness where relevant | Readiness results auditable | Tool registry does not mean tools are installed or executable. |
| Provider attempts/webhooks | `provider_request_attempts`, `provider_webhook_events` | Backend provider gateway | Backend-only writes | Sanitized user-readable summaries only | Attempts/webhooks append-only | No provider secret runtime, webhook verification, or real calls. |
| Audit/event logs | `event_log`, `audit_events`, runtime events | Backend/Supabase audit | Backend-only append | Admin/project-scoped reads as designed | Append-only | Audit table duplication and mutation locks require validation. |

## E. Relationship And FK Review

Intended chain:

`project -> chat/session/media/source order -> intent/edit plan/segments/signature routes -> credit estimate/approval/reservation -> approved snapshot -> jobs/agent runs -> generation/tool/provider/render requests -> generated assets/storage -> QA/preview/revision/export`

- Strong links already present: projects to workspaces, many planning/media/job/generation/render records to projects, credit estimates to plans, reservations to estimates, generation/render/job records to credit estimates/reservations, approved snapshots to plan/credit/reservation concepts in the runtime readiness layer.
- Missing or weak links: canonical mapping between `edit_plans` and `edit_plan_versions`; canonical mapping between `jobs` and `editing_jobs`; canonical mapping between `exports` and `final_exports`; canonical mapping from storage object records to all generated/render/export table families.
- Dangerous nullable links: optional credit reservation or approved snapshot references on execution-like records must be blocked before any expensive work; nullable storage paths should not allow "ready" states.
- Cascade concerns: ledger, approvals, approved snapshots, job events, provider attempts, generated assets, QA reports, exports, and audit events must survive project revision history and should not cascade away silently.
- Records that must never be orphaned: approved snapshots, credit ledger/reservations, jobs/job events, provider attempts/webhooks, generated assets/storage records, QA reports, exports, audit events.
- Records that must survive rollback/revision/history: chat, source sequence confirmations, plan versions, approval records, snapshots, credit ledger, job events, provider/render/tool attempts, QA reports, preview reviews, revision requests, exports, audit events.

## F. RLS Review

RLS appears broad across the first schema era, the consolidated RP-DATA RLS migration, storage policy migrations, worker transport tables, and runtime readiness tables. The static audit found 151 active RLS enable statements and 378 policies.

- User-readable: profiles, own workspaces/memberships, project records, chat, media metadata, plan summaries, approved snapshot summaries, credit balances/estimates, job status summaries, generated asset metadata, preview/export records relevant to the project, sanitized QA and audit summaries.
- User-writable: own profile fields, chat messages/attachments, allowed project metadata, source order confirmations before approval, preview review comments, revision requests, and explicit user approvals where policy allows.
- Backend/service-role-only: execution state, canonical storage object records, signed URL events, credit ledger/reservation/spend/refund, approved snapshot creation/mutation, job claims/events, worker leases/heartbeats, provider attempts/webhooks, render jobs/results, QA writes, exports, audit events.
- Workspace/project scoping must apply everywhere a record has `workspace_id`, `project_id`, or can join to project membership. Active migrations use both direct workspace fields and project-derived membership, which needs validation.
- Normal users must never mutate execution state such as worker claims, provider attempts, render job state, credit ledger, reservation state, approved snapshot JSON, QA results, export completion, or audit events.

Explicit classification:

| Record family | Classification |
| --- | --- |
| Approved snapshots | User-readable after project access; backend-only create; immutable JSON; no normal user mutation. |
| Credit ledger entries | User-readable summaries only; backend-only append; no update/delete. |
| Credit reservations | User-readable status; backend-only create/spend/release/refund. |
| Job events | User-readable sanitized timeline; backend/worker-only append. |
| Worker claims | Backend/worker-only mutation; users may read status summaries if exposed. |
| Generation requests | Backend/provider gateway-only mutation; users read status/artifact metadata. |
| Provider attempts | Backend-only sanitized records; no raw secrets/payloads. |
| Render jobs | Backend-only creation/execution mutation; users read preview/export status. |
| QA reports | Backend/worker-only writes; users read relevant results and blockers. |
| Exports | Backend/worker-only completion; users request/export and read status. |
| Audit events | Backend-only append; scoped read/admin review only. |

## G. Storage Policy Review

- Private bucket strategy: active migrations define private `source-media`, `generated-assets`, `processed-media`, `previews`, `exports`, `thumbnails`, `qa-artifacts`, and `worker-temp` buckets.
- Source media: private by default; direct browser writes need upload-intent and policy validation or backend signed upload routes.
- Generated assets, processed media, previews, exports, thumbnails, QA artifacts: private by default; worker/backend writes only unless a dedicated route grants temporary access.
- Worker temp: private, worker-only, and must have cleanup/lifecycle policy before production.
- Canonical path policy: canonical records should store bucket/path only, not signed URLs.
- Signed URL event policy: events should record request metadata and expiry context without persisting the signed URL value.
- Workspace/project path parsing: old storage policies mention `<project_id>/...`; RP-FIX-07 adds `workspace/{workspace_id}/project/{project_id}/...`. This conflict needs local policy smoke tests.
- Upload intent flow: `upload_intents`, `storage_object_records`, and `signed_url_events` exist in runtime readiness SQL, but backend signed routes are not implemented.

What appears ready: private bucket names, canonical object record concept, upload intent concept, signed URL audit concept, and source-media/thumbnails conservative policy direction.

Needs local validation: object path parsing, member/editor policy boundaries, storage object canonical record RLS, signed URL event append behavior, worker-temp isolation, generated/previews/exports/QA artifact write boundaries.

Must remain private: source media, generated assets, previews, exports, thumbnails, QA artifacts, worker-temp objects, provider/tool intermediate artifacts, and private user media.

## H. Helper Function Review

| Function | Purpose | Input assumptions | Tables touched | Production risk | Validation needed |
| --- | --- | --- | --- | --- | --- |
| `set_updated_at` | Shared updated timestamp trigger | Row has `updated_at` column | Many tables | Low, but duplicated across migrations | Confirm function replacement order and trigger coverage. |
| `is_workspace_member` | RLS membership helper | User/project/workspace can be resolved | Workspaces/members/projects | Medium if duplicate schema eras differ | Validate against both direct workspace and project-derived membership. |
| `has_workspace_role` | Role helper | Role enum/string matches table shape | Workspace members | Medium | Confirm role values align across schema eras. |
| `is_workspace_owner_record` | Owner record helper | Ownership column exists | Workspaces/members | Medium | Validate with RP-DB and RP-DATA workspace tables. |
| `is_workspace_owner_or_admin` | Admin/owner helper | Role and membership fields align | Workspaces/members/projects | Medium | Confirm admin bypass is not too broad. |
| `is_project_member` | Project RLS helper | Project joins workspace/member records | Projects/workspace members | High if duplicate project tables conflict | Local RLS tests for member/non-member reads. |
| `is_project_editor` | Project edit helper | Editor roles normalized | Projects/workspace members | High | Local write-policy tests by role. |
| `can_start_generation` | Approval/credit gate helper | Edit plan approved and reservation exists | Edit plans, credits/reservations | High | Must not pass with missing approved snapshot once snapshots become canonical. |
| `can_run_job` | Job run gate helper | Job dependencies, approval, reservation valid | Jobs, dependencies, credits | High | Needs transaction/idempotency/claim tests; no raw chat execution. |
| `can_export_render` | Render export helper | Render ready and QA not blocking | Renders/QA/exports | High | Validate blocking QA, asset readiness, approved snapshot requirements. |
| `prevent_immutable_approved_snapshot_change` | Snapshot immutability | Snapshot JSON should be immutable | Approved snapshots | Critical | Run immutability tests locally before backend snapshot service. |
| `prevent_credit_ledger_mutation` | Ledger append-only | Ledger rows cannot be updated/deleted | Credit ledger entries | Critical | Local tests for update/delete blocking. |
| `prevent_audit_event_mutation` | Audit append-only | Audit rows immutable | Audit events | Critical | Local tests for update/delete blocking. |
| `can_create_approved_plan_snapshot` | Snapshot creation gate | Approved plan/estimate/reservation ready | Plans, credits, reservations, snapshots | Critical | Must use canonical plan tables after conflict resolution. |
| `active_worker_claim_exists` | Duplicate active claim check | Claim status lifecycle consistent | Worker claims | Critical | Concurrency test before workers. |
| `can_claim_worker_job` | Worker claim gate | Job status, dependencies, reservation, snapshot, readiness valid | Jobs, claims, credits/snapshots | Critical | Transaction-safe claim tests; no duplicate active claim. |

## I. Status Lifecycle Review

Status values are rich but not yet normalized across schema eras.

- Projects: likely draft/active/archived-style statuses plus RP-DATA variants; need canonical project lifecycle.
- Chat sessions/messages: RP-DB has explicit chat session/message role/status enums; RP-DATA chat messages may use simpler fields.
- Media: status appears in both RP-DB `media_assets` and RP-DATA `media_assets`; readiness/probe lifecycle must map to storage object readiness.
- Edit plans: RP-DB `edit_plan_status` and RP-DATA `edit_plan_versions` states must reconcile with approval records and approved snapshots.
- Credit estimates/reservations: status values exist in the RP-DB credit chain and RP-DATA credit chain. Names must normalize before runtime.
- Jobs: `jobs`, `job_batches`, `editing_jobs`, `job_steps`, worker leases, and worker claims have overlapping lifecycle names. Runtime should define one execution-state vocabulary.
- Generation requests/assets/provider attempts: request status, asset status, provider attempt status, webhook status, and cost records must align.
- Render/renders/exports/QA/revisions: render job status, render output status, export/final export status, QA report status, revision status need one transition map.
- Worker claims/provider attempts: active/stale/failed/succeeded states need strict terminal-state handling.

Future normalization should prefer explicit status families per domain, but route/service code must translate them through one gateway contract.

## J. JSONB Field Review

Acceptable flexible metadata:

- user-facing preferences, planning settings, capability metadata, non-secret provider/model metadata, QA summaries, sanitized worker summaries, optional analysis details, non-canonical UI display metadata.

Should later get schema validation:

- approved snapshot payloads, render manifests, generation request inputs, tool call intents, provider attempt request summaries, media probe results, timing maps, QA item payloads, fallback decisions, storage object metadata.

Should not store secrets:

- provider API keys, service-role keys, bearer tokens, passwords, private credentials, Secret Manager payloads, raw OAuth tokens, webhook signing secrets.

Should not store signed URLs:

- canonical storage records, generated assets, media assets, exports, previews, provider attempts, job events, audit events. Store bucket/path and signed URL event metadata instead.

Should not store raw provider payloads:

- provider attempts and webhooks should store sanitized request/response summaries, provider ids, statuses, hashes, and redacted diagnostics only.

Should not store raw chat as execution source:

- chat can be persisted, but workers must execute approved snapshots and structured plan/tool/provider/render records.

## K. Production Blockers

Critical:

- Active migration chain has duplicate core table names across schema eras and may not apply cleanly as-is.
- Canonical table ownership is unresolved for plans, credits, jobs, media, generation assets, QA, revision, and export records.
- Approved snapshot, credit reservation, worker claim, and append-only ledger/audit behavior has not been locally validated.
- Remote/staging/prod migrations were intentionally not run.

High:

- RLS policies target mixed table shapes and need member/non-member/editor/service-role tests.
- Storage path conventions conflict between old `<project_id>/...` and newer `workspace/{workspace_id}/project/{project_id}/...`.
- Status lifecycle names are inconsistent across execution domains.
- No backend service-role handlers exist for credit mutation, snapshot creation, storage records, job claims, provider attempts, render jobs, QA, or exports.

Medium:

- JSONB contracts need validation schemas before production writes.
- Helper functions need local smoke tests and concurrency tests.
- Audit/event table naming and retention policies need consolidation.
- Draft docs may mislead future prompts if they are treated as active SQL.

Low:

- Static audit flags terms such as `secret`, `token`, and signed URL references for review. Prompt 2 found no committed secret values from the static scanner output, but human review should continue before deployment.
- Generated audit JSON should be regenerated whenever migrations change.

## L. Prompt 3 Readiness Recommendation

Recommended next prompt: Prompt 2A - Schema Gap Fix Plan before Prompt 3.

Rationale: the repo has enough schema material to plan production auth/profile/workspace/RLS, but active migration conflicts should be resolved before building service-role handlers or assuming a canonical table graph.
