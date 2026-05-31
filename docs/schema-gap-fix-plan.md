# Schema Gap Fix Plan

Prompt 2A resolves the planning confusion found by Prompt 2 without changing SQL. It chooses the canonical schema targets future backend prompts must use until a later migration-preparation prompt reconciles duplicate active migrations.

This document is an architecture decision record only. It does not create migrations, rewrite history, run SQL, connect to Supabase, add service-role handlers, enable uploads, execute workers, call providers, render media, enable Stripe, install packages, or execute tools.

## A. Executive Decision Summary

- Prompt 2 found two active schema eras in `supabase/migrations/`: the broader RP-DB chain from `20260513...` and the newer RP-DATA/runtime chain from `20260518...` onward.
- Duplicate schema eras are dangerous because service code can target a table shape that differs from RLS policies, FK assumptions, SQL smoke tests, or future worker/provider/render records.
- Future backend work must target the newer RP-DATA/runtime contract for duplicated runtime concepts. Older RP-DB tables remain legacy/reference unless they are unique planning-domain tables not yet represented in RP-DATA/runtime.
- Active migrations remain the source of implementation truth, but duplicated concepts must follow the Prompt 2A canonical table contract until SQL cleanup resolves the active migration history.
- Draft migrations remain planning references only.
- Prompt 3 may proceed after Prompt 2A, but only for the narrow auth/profile/workspace/project path: `auth.users`, `profiles`, `workspaces`, `workspace_members`, and `projects`.
- Prompt 3 must not touch chat/media/planning/credit/job/storage/provider/render/tool/execution tables.
- Future schema/migration work is still required to remove duplicate create-table conflicts, align RLS tests, update TypeScript types, and validate migrations locally/staging.

## B. Canonical Schema Principle

- The active migration chain in `supabase/migrations/` is the implementation truth unless a later approved migration milestone explicitly supersedes it.
- For duplicated concepts, this plan chooses one canonical table family for future backend services even if older active SQL still exists.
- Draft migrations under `database/migration-drafts/` are planning references only and must not drive backend code directly.
- Docs that conflict with active migrations or this contract must not drive backend implementation.
- Future services must reference canonical table names only.
- Approved snapshots, credit ledger records, job/worker records, storage object records, render/export records, QA records, and audit records preserve history. They must not be casually renamed, dropped, or rewritten.
- SQL cleanup must be explicit, reviewed, locally validated, and separately approved.

## C. Schema Era Classification

Classification labels:

| Label | Meaning |
| --- | --- |
| `canonical_active` | Active source that future prompts should target for the stated domain. |
| `active_but_needs_review` | Active source that may still be useful, but must be reviewed before production service code writes to it. |
| `draft_only` | Planning reference only; not a backend implementation target. |
| `legacy_reference` | Historical or earlier-era source preserved for context, not the target for new duplicated runtime concepts. |
| `superseded` | Source fully replaced by a newer contract. No Prompt 2A source is deleted or marked for removal yet. |
| `unknown_needs_review` | Source whose role cannot be decided without more inspection. No required Prompt 2A source remains unknown after this review. |

| Source | Classification | Use |
| --- | --- | --- |
| `supabase/migrations/202605130001_core_reeditpro_tables.sql` through `202605130008_render_preview_export_revision_qa.sql` | `legacy_reference` for duplicated runtime concepts; `active_but_needs_review` for unique planning concepts | Do not target duplicated profile/project/media/credit/job/generation/QA/revision concepts from this era in new backend code. Unique tables such as detailed edit quality, Stroke Motion, provider catalog, render job, and timing-adjacent structures may be referenced only after service-specific review. |
| `supabase/migrations/202605180001_reeditpro_core_workspace_projects.sql` through `202605180008_reeditpro_storage_buckets_policies.sql` | `canonical_active` for duplicated core runtime concepts, with migration cleanup still required | Canonical target for Prompt 3 auth/profile/workspace/project and future duplicated media/planning/credit/job/export/audit concepts. |
| `supabase/migrations/202605190001_sfx_director_tables.sql` | `active_but_needs_review` | SFX planning schema is unique and remains planning/runtime-reference until provider/worker milestones validate it. |
| `supabase/migrations/202605190002_storytiming_master_tables.sql` | `active_but_needs_review` | StoryTiming schema is unique and remains planning/runtime-reference until timing/render milestones validate it. |
| `supabase/migrations/202605200001_storage_upload_pipeline_readiness.sql` | `canonical_active` for storage policy direction, `active_but_needs_review` for path conflicts | Use workspace/project path direction, but local validation must resolve old `<project_id>/...` policy behavior. |
| `supabase/migrations/202605200002_worker_leases_runtime_transport.sql` | `canonical_active` | Canonical worker lease/runtime transport table family for future worker prompts. |
| `supabase/migrations/202605210001_e2e_runtime_readiness_tables.sql` | `canonical_active` | Canonical runtime readiness extension for idempotency, upload intents, storage object records, signed URL events, worker claims, tool runtime checks, provider attempts, and webhooks. |
| `database/migration-drafts/` | `draft_only` | Planning reference only. Do not target from backend code without promotion in a migration milestone. |
| `database/test-sql/` | `active_but_needs_review` | Smoke-test intent is useful, but tests must be updated after canonical contract and migration cleanup. |
| `database-architecture.md` | `legacy_reference` plus product architecture context | Read for domain intent, not as final table target when it conflicts with Prompt 2A. |
| `backend-database-roadmap.md` | `legacy_reference` | Roadmap context only. |
| `supabase-table-specification.md` | `legacy_reference` | Useful table-design context; Prompt 2A contract wins on duplicated names. |
| `supabase-schema-planning-bridge.md` | `legacy_reference` | Bridge context only; not backend target authority. |
| `docs/e2e-readiness/RP-E2E-READY-01-runtime-tables.md` | `canonical_active` for runtime readiness intent | Use with Prompt 2A contract for runtime table families. |
| Prompt 2 generated docs | `canonical_active` for audit findings and validation status | Prompt 2A supersedes only the unresolved decision of which duplicated concept future services target. |

## D. Duplicate Concept Resolution

| Concept | Canonical table(s) | Alternate/legacy/draft table name(s) | Canonical source file | Future backend service | Risk if wrong table is used | Resolution action |
| --- | --- | --- | --- | --- | --- | --- |
| User/profile table concept | `auth.users`, `profiles` | `user_profiles` | `202605180001_reeditpro_core_workspace_projects.sql` | `AuthBootstrapService` | User bootstrap can write a profile row invisible to Prompt 3 RLS tests. | Use canonical; legacy do not target. |
| Workspace/member table concept | `workspaces`, `workspace_members` from RP-DATA era | Duplicate same names from RP-DB era | `202605180001_reeditpro_core_workspace_projects.sql` | `WorkspaceAccessService` | Service code may assume wrong owner/member columns or policy helpers. | Use canonical; future migration cleanup needed. |
| Project table concept | `projects` from RP-DATA era | Duplicate `projects` from RP-DB era | `202605180001_reeditpro_core_workspace_projects.sql` | `ProjectService` | Project authorization can join through the wrong workspace shape. | Use canonical; future migration cleanup needed. |
| Chat session/message/attachment concept | `edit_sessions`, `chat_messages`; `chat_attachments` is review-only until a canonical attachment table is added | `chat_sessions`, `chat_attachments`, `inline_chat_cards`, `chat_actions` | `202605180001_reeditpro_core_workspace_projects.sql` | `ChatPersistenceService` | Raw chat and attachments may fork across incompatible session tables. | Use canonical for sessions/messages; attachment manual review. |
| Media asset concept | `media_assets` from RP-DATA era | Duplicate `media_assets` from RP-DB era | `202605180002_reeditpro_media_source_sequence.sql` | `MediaReadinessService`, `StorageObjectService` | Media readiness/storage joins can use the wrong ownership and status columns. | Use canonical; future migration cleanup needed. |
| Uploaded clip/source sequence concept | `uploaded_clips`, `source_sequence_items` | `source_clip_sequences`, `source_clip_sequence_items` | `202605180002_reeditpro_media_source_sequence.sql` | `UploadIntentService`, `MediaReadinessService` | Source order could be approved in one table and executed from another. | Use canonical. |
| Reference asset concept | `reference_assets` pending RP-DATA-compatible review | Draft or mock reference records | `202605130001_core_reeditpro_tables.sql` | `StorageObjectService`, `IntentPlanningService` | Reference video DNA may be stored outside canonical storage policy. | Keep compatibility/read-only; future cleanup needed. |
| Intent analysis concept | `edit_intent_snapshots` | `intent_analyses` | `202605180003_reeditpro_intent_plan_versions.sql` | `IntentPlanningService` | Workers may execute stale raw intent instead of versioned snapshots. | Use canonical. |
| Edit plan/version concept | `edit_plan_versions`, `plan_component_snapshots` | `edit_plans`, `recommended_edit_structures` | `202605180003_reeditpro_intent_plan_versions.sql` | `IntentPlanningService`, `ApprovedSnapshotService` | Approval could bind to a mutable or non-versioned plan. | Use canonical. |
| Edit plan segment concept | `edit_plan_segments` from RP-DATA era | Duplicate `edit_plan_segments` from RP-DB era | `202605180003_reeditpro_intent_plan_versions.sql` | `IntentPlanningService`, `RenderJobService` | Segment IDs may not match approved plan version or render manifest. | Use canonical; future migration cleanup needed. |
| Signature route concept | `signature_routes` pending RP-DATA-compatible review | Draft route concepts | `202605130002_intent_edit_planning_tables.sql` | `IntentPlanningService`, `ProviderGatewayService` | Tier/model rules may be enforced against noncanonical segment IDs. | Keep as compatibility/read-only; manual review required. |
| Credit estimate/approval/reservation/ledger concept | `credit_estimates`, `credit_estimate_items`, `approval_records`, `credit_reservations`, `credit_ledger_entries`, `refund_records` | `credit_estimate_line_items`, `credit_approvals`, `credit_reservation_line_items`, `credit_refunds` | `202605180004_reeditpro_credits_approval_snapshots.sql` | `CreditEstimateService`, `CreditReservationService`, `CreditLedgerService` | Credit reservation and spend can split across ledgers. | Use canonical; future migration cleanup needed. |
| Approved plan snapshot concept | `approved_plan_snapshots` | Policy-only approved snapshot docs | `202605180004_reeditpro_credits_approval_snapshots.sql`, extended by `202605210001_e2e_runtime_readiness_tables.sql` | `ApprovedSnapshotService` | Workers may execute mutable plans or raw chat. | Use canonical. |
| Job/job batch/job event/agent run concept | `editing_jobs`, `job_steps`, `worker_events`; `agent_runs` is review-only | `job_batches`, `jobs`, `job_dependencies`, `job_events`, `agent_runs`, `agent_outputs` | `202605180005_reeditpro_generation_assets_jobs.sql` | `JobOrchestrationService` | Workers may claim a job family different from orchestration status. | Use canonical for new work; old job tables compatibility/read-only until cleanup. |
| Worker lease/worker claim concept | `worker_leases`, `backend_runtime_messages`, `job_claim_attempts`, `worker_job_claims` | `worker_runtime_configs`, `worker_heartbeats` | `202605200002_worker_leases_runtime_transport.sql`, `202605210001_e2e_runtime_readiness_tables.sql` | `WorkerClaimService`, `WorkerHeartbeatService` | Duplicate active claims or stale worker state can bypass gates. | Use canonical. |
| Generation provider/model/capability concept | `generation_providers`, `generation_provider_capabilities`, `generation_provider_models` | Provider planning docs | `202605130007_generation_providers_generated_assets.sql` | `ProviderGatewayService` | Provider route policy may lose model/tier constraints. | Keep compatibility/read-only; manual review required. |
| Generation request/input/asset/version/timing/event/cost concept | `generation_requests`, `generation_events`, `generated_assets`, `generated_asset_versions`; request inputs/timing/costs require review | Duplicate RP-DB generation tables, `generation_request_inputs`, `generated_asset_timing_maps`, `generation_request_costs` | `202605180005_reeditpro_generation_assets_jobs.sql` | `ProviderGatewayService`, `StorageObjectService` | Provider output can bypass QA/storage/credit links. | Use canonical core tables; manual review for inputs/timing/costs. |
| Render job/render input/render/render event concept | `render_jobs`, `render_job_inputs`, `renders`, `render_events` | Render strategy docs | `202605130008_render_preview_export_revision_qa.sql` | `RenderJobService` | Render workers may run without approved snapshot or timing references. | Compatibility possible; future cleanup needed. |
| Export/final export/export variant concept | `final_exports` | `exports`, `export_variants` | `202605180006_reeditpro_qa_exports_audit.sql` | `ExportService` | Final export readiness may split from private storage and QA status. | Use canonical for final export; variants need future cleanup. |
| QA report/QA item concept | `qa_reports`, `qa_check_results` from RP-DATA era | Duplicate `qa_reports`, `qa_report_items` | `202605180006_reeditpro_qa_exports_audit.sql` | `QAReportService` | Blocking QA may not stop export. | Use canonical; future migration cleanup needed. |
| Revision request/comment/review concept | `revision_requests`; `preview_reviews` and `review_comments` require review | Duplicate `revision_requests`, `revision_request_items` | `202605180006_reeditpro_qa_exports_audit.sql` | `RevisionService` | User revisions may not create new plan approvals. | Use canonical; review comments future cleanup. |
| Storage object/upload intent/signed URL event concept | `upload_intents`, `storage_object_records`, `signed_url_events` | Storage draft docs | `202605210001_e2e_runtime_readiness_tables.sql` | `UploadIntentService`, `SignedUrlService`, `StorageObjectService` | Signed URLs or frontend-invented paths can become source of truth. | Use canonical. |
| Tool runtime check concept | `tool_runtime_checks` | Tool registry docs only | `202605210001_e2e_runtime_readiness_tables.sql` | `ToolReadinessService` | Tool registry can be mistaken for installed/executable tools. | Use canonical. |
| Provider request attempt/webhook concept | `provider_request_attempts`, `provider_webhook_events` | Provider planning docs | `202605210001_e2e_runtime_readiness_tables.sql` | `ProviderGatewayService` | Raw provider payloads/secrets can leak or bypass audit. | Use canonical. |
| Audit/event log concept | `audit_events` | `event_log`, `worker_events`, generated/provider/render events | `202605180006_reeditpro_qa_exports_audit.sql` | `AuditEventService` | Privileged actions may not be append-only or scoped. | Use canonical audit table; domain events remain supporting records. |

## E. Canonical Relationship Chain

| Link | Canonical table(s) | Required FK or reference | Nullable allowed? | Backend-only write? | Immutable/append-only? | Validation needed |
| --- | --- | --- | --- | --- | --- | --- |
| Workspace/user | `auth.users`, `profiles`, `workspaces`, `workspace_members` | `profiles.user_id -> auth.users.id`; membership links user/workspace | No for profile/workspace/member bootstrap | Backend for privileged bootstrap; user-safe profile updates where RLS allows | Membership/audit history should be preserved | Prompt 3 RLS/member tests. |
| Project | `projects` | `projects.workspace_id -> workspaces.id` | No | Backend for privileged create; user edits only where RLS allows | Project history/audit preserved | Prompt 3 project access tests. |
| Chat session/message/attachment | `edit_sessions`, `chat_messages`; attachment table pending review | Project/session reference | Session/message no; attachments require review | Chat writes can be user-initiated; execution state backend-only | Chat history preserved | Later chat persistence prompt. |
| Media/source sequence | `media_assets`, `uploaded_clips`, `source_sequence_items` | Project/media/source references | Ready media cannot have null storage reference | Canonical storage/media writes backend-only | Source order freezes after approval | Prompt 4 and media readiness validation. |
| Intent/edit plan/segments/signature routes | `edit_intent_snapshots`, `edit_plan_versions`, `edit_plan_segments`, reviewed `signature_routes` | Project, plan version, segment refs | No for approved plan execution | Backend/planner writes | Approved versions immutable through snapshot | Prompt 5 and planning validation. |
| Credit estimate/approval/reservation | `credit_estimates`, `credit_estimate_items`, `approval_records`, `credit_reservations`, `credit_ledger_entries` | Estimate to plan; approval/reservation to estimate and project | No for credit-bearing execution | Backend-only for reservations/ledger | Ledger append-only | Prompt 6 transactional tests. |
| Approved snapshot | `approved_plan_snapshots` | Approved plan, estimate, approval, reservation when credits apply | No for execution | Backend-only create/update of allowed status/audit fields | Snapshot payload immutable | Prompt 5 immutability tests. |
| Jobs/agent runs/worker claims | `editing_jobs`, `job_steps`, `worker_events`, `worker_leases`, `job_claim_attempts`, `worker_job_claims` | Approved snapshot/job refs | No for executable jobs | Backend/worker-only | Events/claim attempts append-only | Prompt 8 claim/concurrency tests. |
| Generation/tool/provider/render requests | `generation_requests`, `tool_runtime_checks`, `provider_request_attempts`, `render_jobs` | Approved snapshot, job, storage, reservation refs | No when execution starts | Backend/worker/provider-gateway only | Attempts/events append-only | Later provider/tool/render gates. |
| Generated assets/storage object records | `generated_assets`, `generated_asset_versions`, `storage_object_records` | Project, storage object, generating request/job | Ready assets cannot have null canonical storage refs | Backend/worker-only | Asset versions preserved | Prompt 4/9/10 storage validation. |
| QA/preview/revision/export | `qa_reports`, `qa_check_results`, `revision_requests`, `final_exports` | Project, snapshot, render/asset refs | Blocking QA/export refs no | QA/export backend/worker-only; revision request user-initiated | QA/audit append-only; exports immutable after completion | Prompt 10/11 export and QA gates. |
| Audit events | `audit_events` | Actor, workspace/project where applicable | Actor may be service actor; project nullable only for global events | Backend-only append | Append-only | Prompt 16 audit policy and tests. |

## F. Service-To-Table Target Map

| Service | Canonical tables | Tables to avoid | Schema blocker status | Safe implementation prompt |
| --- | --- | --- | --- | --- |
| `AuthBootstrapService` | `auth.users`, `profiles`, `workspaces`, `workspace_members`, `projects`, `audit_events` | `user_profiles`; draft profile tables | Prompt 3 can proceed with narrow scope | Prompt 3 |
| `WorkspaceAccessService` | `workspaces`, `workspace_members`, `projects` | RP-DB-era assumptions about duplicate table shape | Prompt 3 can proceed with RLS tests | Prompt 3 |
| `ProjectService` | `projects`, `workspaces`, `workspace_members`, `audit_events` | `chat_sessions`, media/planning/execution tables | Prompt 3 can proceed for project access only | Prompt 3 |
| `ChatPersistenceService` | `edit_sessions`, `chat_messages`; attachment table pending review | `chat_sessions` as new target; raw chat as execution source | Needs attachment/session cleanup | Later backend route prompt |
| `UploadIntentService` | `upload_intents`, `storage_object_records`, `media_assets`, `uploaded_clips`, `source_sequence_items` | `source_clip_sequences`, frontend-invented canonical rows | Needs storage policy validation | Prompt 4 |
| `StorageObjectService` | `storage_object_records`, `media_assets`, `generated_assets`, `generated_asset_versions` | Signed URL values in source-of-truth rows | Needs storage path validation | Prompt 4 |
| `MediaReadinessService` | `media_assets`, `storage_object_records`, `uploaded_clips`, `source_sequence_items` | RP-DB media/source sequence tables as new targets | Needs media readiness workers/tests | Prompt 9 |
| `IntentPlanningService` | `edit_intent_snapshots`, `edit_settings_snapshots`, `edit_plan_versions`, `plan_component_snapshots`, `edit_plan_segments` | `intent_analyses`, `edit_plans` as new targets | Needs planning service contract | Prompt 5 or planning-specific prompt |
| `ApprovedSnapshotService` | `approved_plan_snapshots`, `edit_plan_versions`, `credit_estimates`, `approval_records`, `credit_reservations` | Mutable draft plans, raw chat | Needs snapshot service and immutability tests | Prompt 5 |
| `CreditEstimateService` | `credit_estimates`, `credit_estimate_items` | `credit_estimate_line_items` as new target | Needs credit table cleanup/tests | Prompt 6 |
| `CreditReservationService` | `credit_reservations`, `credit_estimates`, `approval_records`, `approved_plan_snapshots` | RP-DB reservation line tables as new target | Needs transactional runtime | Prompt 6 |
| `CreditLedgerService` | `credit_ledger_entries`, `refund_records` | `credit_refunds` as new target | Needs append-only validation | Prompt 6 |
| `JobOrchestrationService` | `editing_jobs`, `job_steps`, `worker_events`, `approved_plan_snapshots` | `jobs`, `job_batches`, `job_events` as new targets | Needs job model cleanup | Prompt 8 |
| `WorkerClaimService` | `worker_job_claims`, `worker_leases`, `job_claim_attempts`, `editing_jobs` | `worker_heartbeats` as new target without review | Needs concurrency tests | Prompt 8 |
| `ProviderGatewayService` | `provider_request_attempts`, `provider_webhook_events`, `generation_requests`, `generated_assets` | Raw provider payloads/secrets; RP-DB cost/input tables without review | Needs gateway and secrets design | Prompt 14 |
| `ToolCallIntentService` | Future tool intent table; `tool_runtime_checks` for readiness | Tool registry as execution table | Needs new schema contract | Prompt 12 |
| `ToolReadinessService` | `tool_runtime_checks` | Frontend tool execution records | Needs worker runtime validation | Prompt 13 |
| `RenderJobService` | `render_jobs`, `render_job_inputs`, `approved_plan_snapshots`, `storage_object_records` | Rendering from raw plan/chat | Needs render schema review | Prompt 10 |
| `QAReportService` | `qa_reports`, `qa_check_results` | RP-DB `qa_report_items` as new target | Needs QA/export blocker tests | Prompt 11 |
| `RevisionService` | `revision_requests`, reviewed preview/comment records | Duplicate RP-DB revision item tables as new target | Needs revision/versioning tests | Prompt 11 |
| `ExportService` | `final_exports`, `storage_object_records`, `qa_reports` | `exports`, `export_variants` as new target | Needs final export cleanup | Prompt 10 |
| `AuditEventService` | `audit_events` | `event_log` as new target | Needs append-only/audit policy tests | Prompt 16 |

## G. Prompt 3 Readiness Decision

Prompt 3 may proceed after Prompt 2A with strict limits.

Prompt 3 may touch/read/write only:

- `auth.users` as Supabase Auth identity input.
- `profiles`.
- `workspaces`.
- `workspace_members`.
- `projects`.
- `audit_events` only for append-style audit records if Prompt 3 explicitly includes audit events; otherwise defer.

Prompt 3 must not touch:

- `user_profiles`.
- `chat_sessions`, `edit_sessions`, `chat_messages`, `chat_attachments`, `inline_chat_cards`, `chat_actions`.
- `media_assets`, `uploaded_clips`, `source_sequence_items`, `storage_object_records`, `upload_intents`, `signed_url_events`.
- Planning, approved snapshot, credit, job, worker, generation, provider, render, QA, revision, export, tool, SFX, StoryTiming, and draft-only tables.

Prompt 3 blockers:

- If `profiles`, `workspaces`, `workspace_members`, or `projects` cannot be validated against the RP-DATA-era schema, stop and open Prompt 2B - Canonical Schema Contract/Migration Preparation.
- If Prompt 3 requires SQL schema changes, stop and create a migration-preparation prompt.
- If Prompt 3 needs storage uploads, signed URLs, credit mutation, worker claims, provider calls, render execution, or Stripe, stop and defer to later milestones.

## H. Future Cleanup Plan

1. Docs cleanup: add warning banners to legacy/draft schema docs after Prompt 2A merges.
2. TypeScript type alignment: update app/backend types to the canonical schema contract only after SQL cleanup path is chosen.
3. Migration review: decide whether to squash, guard, rename, or create compatibility views for duplicated active table concepts.
4. RLS test update: align SQL smoke tests with canonical table families and Prompt 3 guardrails.
5. Service map update: revise `docs/future-backend-service-map.md` to reflect Prompt 2A canonical targets before implementing each service.
6. Deprecation notes: label RP-DB-era duplicated runtime tables as legacy/reference in docs, not deleted.
7. Compatibility views: consider only after local SQL validation proves the active chain can apply cleanly.
8. Migration renames/additions: defer until a migration-preparation prompt with backup, rollback, local validation, and staging approval.
