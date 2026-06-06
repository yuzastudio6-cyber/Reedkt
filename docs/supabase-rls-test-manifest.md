# Supabase RLS Test Manifest

Prompt 19 inventories the current SQL/RLS files and records how each file should move toward future local/staging validation. This manifest does not make any file executable and does not authorize SQL execution.

| File | Prompt/milestone | Domain | Canonical tables covered | Blocked domains avoided | Expected environment | Current status | Dependencies | Fixture requirements | Cleanup requirements | Risks | Conversion notes | Owner milestone |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `001_rls_smoke_tests.sql` | RP-DATA-04 | Broad RLS | workspaces, workspace_members, projects, legacy runtime checklist tables | Production data, production SQL | local_only_future, staging_future, production_never | needs_schema_review | Applied migration chain | Two synthetic users, two workspaces, projects, memberships | Delete test workspaces and dependent rows | References older job/media/table-era names | Split into canonical per-domain executable tests | Prompt 20 |
| `002_approved_snapshot_immutability_tests.sql` | RP-DATA-04 | Approved snapshots | approved_plan_snapshots, approval_records | Worker/provider/render execution | local_only_future, staging_future, production_never | needs_schema_review | Snapshot immutability trigger and canonical approval schema | Approved snapshot fixture through backend/service-role test harness | Delete fixture snapshot chain | May reference compatibility-era fields | Convert after Prompt 5 canonical fields are verified | Prompt 20 |
| `003_storage_policy_smoke_tests.sql` | RP-DATA-04 | Storage policy | storage buckets, storage_object_records by policy reference | Public source media, signed URL persistence | local_only_future, staging_future, production_never | needs_fixture_design | Bucket policy and local storage emulator support | Synthetic workspace/project and private object path | Remove local/staging test objects | Old path convention may conflict with Prompt 4 canonical paths | Update path expectations before execution | Prompt 20 |
| `004_credit_audit_append_only_tests.sql` | RP-DATA-04 | Credit/audit append-only | credit_ledger_entries, audit_events | Stripe, real credit mutation | local_only_future, staging_future, production_never | needs_schema_review | Append-only triggers or policies | Backend-owned synthetic ledger/audit rows | Delete test project cascade where allowed | Normal cleanup may be blocked by append-only policy | Use disposable database reset for destructive cases | Prompt 20 |
| `005_e2e_runtime_readiness_smoke_tests.sql` | RP-E2E-READY-01 | Runtime table existence | approved_plan_snapshots, api_idempotency_keys, upload_intents, storage_object_records, signed_url_events, worker_job_claims, tool_runtime_checks, runtime tables | Runtime execution | local_only_future, staging_future, production_never | needs_schema_review | Runtime readiness migration chain | None for read-only table-existence checks | None | Table-era drift may make expected names stale | Keep read-only; update canonical table list before execution | Prompt 20 |
| `006_auth_workspace_rls_smoke_tests.draft.sql` | Prompt 3 | Auth/workspace/project | auth.users, profiles, workspaces, workspace_members, projects | user_profiles, chat/media/storage/execution tables | draft_only, local_only_future, staging_future, production_never | draft_only | Canonical Prompt 3 schema and fixture IDs | Two users, profiles, workspace, membership, project | Delete synthetic workspace/project/user fixtures | Requires role simulation and auth.uid() handling | Convert first; it is the narrowest RLS executable candidate | Prompt 20 |
| `007_storage_upload_rls_smoke_tests.draft.sql` | Prompt 4 | Storage/upload | workspaces, workspace_members, projects, upload_intents, storage_object_records, signed_url_events, media_assets | Media analysis, planning, credits, jobs, providers, render, tools | draft_only, local_only_future, staging_future, production_never | draft_only | Prompt 4 canonical storage paths and private buckets | Synthetic project, upload intent, object records, private bucket fixture | Delete project-scoped rows and local objects | Signed URL values must never be persisted | Convert after auth/project RLS passes | Prompt 20 |
| `008_approved_snapshot_rls_smoke_tests.draft.sql` | Prompt 5 | Approved snapshots | workspaces, workspace_members, projects, edit_plan_versions, credit_estimates, approval_records, credit_reservations, approved_plan_snapshots | Providers, rendering, workers, tool execution | draft_only, local_only_future, staging_future, production_never | draft_only | Prompt 5 canonical snapshot contract | Approved plan/version, estimate, approval, reservation, snapshot | Reset disposable DB or delete fixture cascade | Immutable rows may intentionally resist cleanup | Convert after fixture cleanup strategy is proven | Prompt 20 |
| `009_credit_ledger_approval_gate_rls_smoke_tests.draft.sql` | Prompt 6 | Credits | projects, workspaces, workspace_members, credit_estimates, credit_estimate_items, approval_records, approved_plan_snapshots, credit_reservations, credit_ledger_entries, refund_records | Stripe, provider/render/job execution | draft_only, local_only_future, staging_future, production_never | draft_only | Credit ledger schema and append-only policy | Approved estimate, reservation, ledger/refund fixtures | Prefer disposable reset for append-only cases | Append-only policies can make cleanup nontrivial | Split read checks from destructive append-only checks | Prompt 20 |
| `010_job_worker_lease_idempotency_rls_smoke_tests.draft.sql` | Prompt 8 | Jobs/workers | job_batches, jobs, job_dependencies, job_events, worker_leases, worker_job_claims, job_claim_attempts, backend_runtime_messages, api_idempotency_keys | Real worker execution, providers, render/tools | draft_only, local_only_future, staging_future, production_never | draft_only | Prompt 8 compatibility target and idempotency schema | Project job, dependency, lease/claim attempts | Delete synthetic job graph or reset DB | Duplicate claim tests can be destructive | Keep claim mutation tests backend-only and local | Prompt 20 |
| `011_media_readiness_probe_timing_rls_smoke_tests.draft.sql` | Prompt 9 | Media readiness | media_assets, uploaded_clips, source_sequence_items, storage_object_records, upload_intents, master_timing_maps | ffprobe/FFmpeg, media analysis, jobs/workers | draft_only, local_only_future, staging_future, production_never | draft_only | Prompt 9 readiness tables and storage references | Synthetic media asset, uploaded clip, source sequence | Delete project-scoped media rows | Must not require private media files | Convert as metadata-only RLS tests first | Prompt 20 |
| `012_render_preview_export_rls_smoke_tests.draft.sql` | Prompt 10 | Render/export | render_jobs, render_job_inputs, renders, render_events, final_exports, approved snapshots, credits, media/storage, QA references | Remotion, FFmpeg, real render/export | draft_only, local_only_future, staging_future, production_never | draft_only | Prompt 10 canonical render/export target tables | Snapshot, reservation, media readiness, render/export summaries | Delete project-scoped render/export rows | Must not create real artifacts | Keep request/execution mutation backend-only | Prompt 20 |
| `013_qa_revision_fallback_rls_smoke_tests.draft.sql` | Prompt 11 | QA/revision/fallback | qa_reports, qa_check_results, preview_reviews, review_comments, revision_requests, approval_records | QA workers, provider/render/tool/job execution | draft_only, local_only_future, staging_future, production_never | draft_only | Prompt 11 route/service contract and canonical QA tables | Project render, QA report, review/revision fixtures | Delete project-scoped QA/review rows | Revision tests can imply replanning if not scoped | Convert only RLS/read/write-block tests | Prompt 20 |
| `014_tool_call_foundation_rls_smoke_tests.draft.sql` | Prompt 12 | Tool-call | tool_call_intents, tool_call_executions, tool_runtime_checks, approved snapshots, credits, media/storage, renders, QA references | Tool execution, package install, providers | draft_only, local_only_future, staging_future, production_never | draft_only | Canonical tool-call tables may need schema review | Tool-call intent/execution summary rows | Delete tool-call fixtures or reset DB | Some tool tables may remain future concepts | Keep draft until canonical table application is confirmed | Prompt 20 |
| `015_tool_readiness_worker_runtime_rls_smoke_tests.draft.sql` | Prompt 13 | Tool readiness | tool_readiness_records, tool_runtime_requirements, worker_runtime_status, tool_call_intents, tool_call_executions | Tool runtime execution, workers | draft_only, local_only_future, staging_future, production_never | needs_schema_review | Prompt 13 future readiness tables | Readiness records and disabled runtime states | Delete readiness fixture rows | Expected future table names may not exist | Keep draft until readiness schema target is present | Prompt 20 |
| `016_worker_claim_execution_contract_rls_smoke_tests.draft.sql` | Prompt 14 | Worker execution contract | worker_job_claims, worker_leases, jobs, job_events, approved_plan_snapshots, credit_reservations, tool readiness references | Real worker execution, providers, render/tool/media | draft_only, local_only_future, staging_future, production_never | draft_only | Prompt 14 worker execution contract | Job, snapshot, reservation, claim/lease fixture | Reset disposable DB for backend-only mutation checks | Claim tests must not claim production jobs | Convert after job/worker canonical schema is verified | Prompt 20 |
| `017_provider_gateway_rls_smoke_tests.draft.sql` | Prompt 15 | Provider gateway | generation_providers, generation_provider_models, provider_request_attempts, provider_webhook_events, jobs, tool intents, storage refs | Provider calls, webhooks, generated assets | draft_only, local_only_future, staging_future, production_never | draft_only | Prompt 15 provider gateway schema | Provider catalog/model and sanitized attempt summaries | Delete project-scoped provider fixtures | Must not store webhook raw payloads or secrets | Convert as backend-only mutation denial tests | Prompt 20 |
| `018_compliance_license_security_review_rls_smoke_tests.draft.sql` | Prompt 16 | Compliance | future compliance review records, audit_events | Legal approval, production unlock, dependency mutation | draft_only, local_only_future, staging_future, production_never | needs_schema_review | Compliance tables may be future concepts | Compliance subject/review fixtures if schema exists | Delete review fixtures or reset DB | AI output cannot be treated as legal approval | Keep draft until compliance schema is canonical | Prompt 20 |
| `019_observability_audit_abuse_cost_rls_smoke_tests.draft.sql` | Prompt 17 | Observability/audit/cost | audit_events, backend_runtime_messages, api_idempotency_keys, future rate/abuse/usage/cost tables | Telemetry sends, billing, production persistence | draft_only, local_only_future, staging_future, production_never | draft_only | Observability schema target review | Audit/rate/abuse/cost summary rows | Reset DB for append-only audit cases | Append-only audit cleanup may be restricted | Split audit append-only from read-scope checks | Prompt 20 |
| `020_e2e_staging_smoke_readiness_rls_smoke_tests.draft.sql` | Prompt 18 | E2E readiness | Synthetic fixtures across auth, storage, snapshots, credits, jobs/workers, media, render/QA, tools, providers, compliance, observability | Runtime execution, staging/prod unlock | draft_only, local_only_future, staging_future, production_never | draft_only | Prompt 18 scenario matrix and fixture contract | Full synthetic E2E fixture set | Test-run scoped cleanup and disposable reset | Broad scope can hide root-cause failures | Run only after narrower domain tests pass | Prompt 21 or later |

## Conversion Decision

The first executable candidate should be `006_auth_workspace_rls_smoke_tests.draft.sql` after Prompt 20 verifies the local Supabase environment and fixture strategy. Broad E2E RLS smoke remains draft-only until local domain tests pass.

## Prompt 26E-1 Local Candidate Update

Prompt 26E-1 adds a second local SQL candidate:

| File | Prompt 26E-1 status | Prompt 26E-1 execution result | Prompt 26E-1 blocker |
| --- | --- | --- | --- |
| `database/test-sql/local/002_rls_no_policy_advisor_tables_local.sql` | local_executable_candidate | not_run | Requires localhost-only DB URL, guarded runner approval, and all six advisor tables present in local schema. |

The candidate is catalog-only and does not insert fixture rows. It verifies the Prompt 26E-1 RLS policy names and deny-only shape for `activation_artifacts`, `activation_qa_gates`, `activation_runs`, `feature_gates`, `readiness_snapshots`, and `tool_capabilities`.

## Prompt 26E-2 Local Candidate Validation Fix Update

Prompt 26E-2 retried local validation for `database/test-sql/local/002_rls_no_policy_advisor_tables_local.sql`, but no SQL ran.

| File | Prompt 26E-2 status | Prompt 26E-2 execution result | Prompt 26E-2 blocker |
| --- | --- | --- | --- |
| `database/test-sql/local/002_rls_no_policy_advisor_tables_local.sql` | local_executable_candidate | not_run | Preflight blocked local validation: `supabase_cli_arch_mismatch`, `docker_daemon_unavailable`, and `local_db_url_missing`. |

The migration/test candidate remains unchanged because no candidate bug was exposed before the safety gates blocked execution.

## Prompt 26E-3 Local Candidate Toolchain/Schema Follow-Up Update

Prompt 26E-3 retried local validation for `database/test-sql/local/002_rls_no_policy_advisor_tables_local.sql`, but no SQL ran.

| File | Prompt 26E-3 status | Prompt 26E-3 execution result | Prompt 26E-3 blocker |
| --- | --- | --- | --- |
| `database/test-sql/local/002_rls_no_policy_advisor_tables_local.sql` | local executable candidate; validation blocked by Codex environment | not run | `docker_daemon_unavailable`, `local_db_url_missing` |

Prompt 26E-3 resolved the CLI blocker for the current shell only with a temporary outside-repo shim. The Prompt 26E-1 migration/test candidate remains unchanged and does not provide local pass evidence.

## Prompt 20 Execution Update

Prompt 20 added a local-only safety preflight and guarded RLS runner, but did not execute SQL or convert draft SQL files because the local target is blocked.

Current local blockers:

- `supabase/config.toml` is missing.
- `/usr/local/bin/supabase` is x86_64 and fails on this arm64 host with error `-86`.
- Docker daemon is unavailable to this process.
- `psql` is not on PATH.
- No verified local Supabase database URL is available.
- No local executable SQL candidates exist under `database/test-sql/local/`.

| File | Prompt 20 status | Prompt 20 execution result | Prompt 20 blocker |
| --- | --- | --- | --- |
| `001_rls_smoke_tests.sql` | manual_legacy_or_review_needed | not_run | Needs schema review and local toolchain repair. |
| `002_approved_snapshot_immutability_tests.sql` | manual_legacy_or_review_needed | not_run | Needs schema review and local toolchain repair. |
| `003_storage_policy_smoke_tests.sql` | manual_legacy_or_review_needed | not_run | Needs fixture design, local storage policy path, and local toolchain repair. |
| `004_credit_audit_append_only_tests.sql` | manual_legacy_or_review_needed | not_run | Needs schema review, append-only cleanup/reset strategy, and local toolchain repair. |
| `005_e2e_runtime_readiness_smoke_tests.sql` | manual_legacy_or_review_needed | not_run | Needs canonical table review and local toolchain repair. |
| `006_auth_workspace_rls_smoke_tests.draft.sql` | draft_only | not_run | Safest first candidate, but local target, role simulation, migration reset, and cleanup are not proven. |
| `007_storage_upload_rls_smoke_tests.draft.sql` | draft_only | not_run | Convert only after auth/workspace RLS passes and storage fixture policy is safe. |
| `008_approved_snapshot_rls_smoke_tests.draft.sql` | draft_only | not_run | Immutable snapshot cleanup strategy not proven. |
| `009_credit_ledger_approval_gate_rls_smoke_tests.draft.sql` | draft_only | not_run | Append-only credit/audit cleanup and transactional fixture strategy not proven. |
| `010_job_worker_lease_idempotency_rls_smoke_tests.draft.sql` | draft_only | not_run | Backend-only claim/lease mutation checks require local transactional fixture safety. |
| `011_media_readiness_probe_timing_rls_smoke_tests.draft.sql` | draft_only | not_run | Metadata-only fixture path is future-only. |
| `012_render_preview_export_rls_smoke_tests.draft.sql` | draft_only | not_run | Render/export schema and no-execution fixture path remain future-only. |
| `013_qa_revision_fallback_rls_smoke_tests.draft.sql` | draft_only | not_run | QA/revision fixture path remains future-only. |
| `014_tool_call_foundation_rls_smoke_tests.draft.sql` | draft_only | not_run | Tool-call table application and runtime-disabled fixtures remain unvalidated. |
| `015_tool_readiness_worker_runtime_rls_smoke_tests.draft.sql` | draft_only | not_run | Expected readiness tables need schema review. |
| `016_worker_claim_execution_contract_rls_smoke_tests.draft.sql` | draft_only | not_run | Worker execution contract fixtures require backend-only mutation safety. |
| `017_provider_gateway_rls_smoke_tests.draft.sql` | draft_only | not_run | Provider attempt/webhook fixtures must stay sanitized and backend-only. |
| `018_compliance_license_security_review_rls_smoke_tests.draft.sql` | draft_only | not_run | Compliance tables remain future/schema-review targets. |
| `019_observability_audit_abuse_cost_rls_smoke_tests.draft.sql` | draft_only | not_run | Audit/observability append-only and future cost/rate tables need review. |
| `020_e2e_staging_smoke_readiness_rls_smoke_tests.draft.sql` | draft_only | not_run | Broad E2E RLS waits for narrower domain tests to pass first. |

Prompt 20 recommendation: use Prompt 20A to repair the local Supabase toolchain before converting `006_auth_workspace_rls_smoke_tests.draft.sql`.

## Prompt 20A Toolchain Repair Update

Prompt 20A adds local-only `supabase/config.toml` and hardens the local preflight/runner, but still does not execute SQL and does not convert draft SQL.

Resolved or improved:

- `supabase/config.toml` now exists and is local-only.
- Docker daemon is reachable on this host.
- runner run mode requires `--confirm-local-only`.
- generated evidence is written only to ignored local paths.

Remaining blockers:

- `/usr/local/bin/supabase` is x86_64 and fails on arm64 with error `-86`.
- `psql` is not on PATH.
- no verified local DB URL exists.
- no executable local-only SQL candidate exists.

Conversion decision after Prompt 20A: keep all files draft-only or manual-review-only. `006_auth_workspace_rls_smoke_tests.draft.sql` remains the first candidate for Prompt 20B only after preflight reports `canRunLocalSql=true`.

## Prompt 20C Manual Setup Update

Prompt 20C does not convert or execute any SQL file. It adds manual environment setup docs and improves preflight/runner blocker output.

Manifest state after Prompt 20C:

- files `001` through `005` remain manual legacy or review-needed SQL checklists;
- files `006` through `020` remain draft-only;
- no file under `database/test-sql/local/` is executable;
- no local, staging, remote, or production SQL was run;
- `006_auth_workspace_rls_smoke_tests.draft.sql` remains the first candidate for Prompt 20B only after preflight reports `canRunLocalSql=true`.

Remaining local blockers after Prompt 20C:

- arm64-compatible Supabase CLI required;
- `psql` or an approved local SQL executor required;
- verified local Supabase DB URL required;
- first local-only executable SQL candidate required.

## Prompt 20D Environment Verification Update

Prompt 20D does not convert or execute any SQL file. It verifies Docker remains reachable, makes local runner dry-run status-free by default, and records `canProceedToPrompt20B=false`.

Manifest state after Prompt 20D:

- files `001` through `005` remain manual legacy or review-needed SQL checklists;
- files `006` through `020` remain draft-only;
- no file under `database/test-sql/local/` is executable;
- no local, staging, remote, or production SQL was run;
- `006_auth_workspace_rls_smoke_tests.draft.sql` remains the first candidate for Prompt 20B only after preflight reports `canProceedToPrompt20B=true`.

## Prompt 20E Manual Setup Follow-Up Update

Prompt 20E does not convert or execute any SQL file. It adds a manual-only host toolchain probe and records that host setup is still blocked.

Manifest state after Prompt 20E:

- files `001` through `005` remain manual legacy or review-needed SQL checklists;
- files `006` through `020` remain draft-only;
- no file under `database/test-sql/local/` is executable;
- no local, staging, remote, or production SQL was run;
- no host tools were installed or downloaded;
- `006_auth_workspace_rls_smoke_tests.draft.sql` remains the first candidate for Prompt 20B only after preflight or host probe reports `canProceedToPrompt20B=true`.

Remaining local blockers after Prompt 20E:

- arm64-compatible Supabase CLI required;
- `psql` or an approved local SQL executor required;
- verified localhost-only local Supabase DB URL required;
- first local-only executable SQL candidate required.

## Prompt 20F Manual Host Repair Verification Update

Prompt 20F does not convert or execute any SQL file. It verifies manual host repair has not happened and records that host setup is still blocked.

Manifest state after Prompt 20F:

- files `001` through `005` remain manual legacy or review-needed SQL checklists;
- files `006` through `020` remain draft-only;
- no file under `database/test-sql/local/` is executable;
- no local, staging, remote, or production SQL was run;
- no host tools were installed or downloaded;
- `006_auth_workspace_rls_smoke_tests.draft.sql` remains the first candidate for Prompt 20B only after preflight or host probe reports `canProceedToPrompt20B=true`.

Remaining local blockers after Prompt 20F:

- arm64-compatible Supabase CLI required;
- local Docker daemon required;
- `psql` or an approved local SQL executor required;
- verified localhost-only local Supabase DB URL required;
- first local-only executable SQL candidate required.

## Prompt 20B First Local Candidate Update

Prompt 20B creates the first local-only executable SQL candidate:

| File | Prompt 20B status | Prompt 20B execution result | Prompt 20B blocker |
| --- | --- | --- | --- |
| `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` | local_executable_candidate | not_run | Local `supabase start` failed at `202605180001_reeditpro_core_workspace_projects.sql` before a localhost-only DB URL could be captured. |

Manifest state after Prompt 20B:

- files `001` through `005` remain manual legacy or review-needed SQL checklists;
- files `006` through `020` remain draft-only;
- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` is the first local executable candidate;
- no local, staging, remote, or production SQL was run;
- no localhost-only DB URL was captured;
- the local migration chain is blocked by `public.projects.current_edit_session_id` missing when `projects_current_edit_session_id_fkey` is added in `202605180001_reeditpro_core_workspace_projects.sql`.

Prompt 20H is required before the Prompt 20B SQL candidate can be run.

## Prompt 20H Migration Chain Repair Update

Prompt 20H repairs the missing `public.projects.current_edit_session_id` blocker in `supabase/migrations/202605180001_reeditpro_core_workspace_projects.sql`. Local retries also repair same-migration compatibility blockers for `workspaces.owner_id`, `projects.owner_id`, and `chat_messages.edit_session_id`.

Manifest state after Prompt 20H:

- files `001` through `005` remain manual legacy or review-needed SQL checklists;
- files `006` through `020` remain draft-only;
- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` remains the first local executable candidate;
- no local, staging, remote, or production SQL was run;
- no localhost-only DB URL was captured;
- local `supabase start` passed `202605180001_reeditpro_core_workspace_projects.sql`;
- local `supabase start` now fails in `202605180002_reeditpro_media_source_sequence.sql` because `public.media_assets.status` does not exist in the earlier schema-era table before `idx_media_assets_project_status` is created.

Prompt 20I is required before the Prompt 20B SQL candidate can be run.

## Prompt 20I Migration Chain Repair Update

Prompt 20I repairs the missing `public.media_assets.status` blocker in `supabase/migrations/202605180002_reeditpro_media_source_sequence.sql`. The repair also adds Prompt 4-era compatibility columns for `media_assets.size_bytes` and `media_assets.metadata_json`, guarded legacy-column backfills, and guarded `idx_media_assets_project_status` creation.

Manifest state after Prompt 20I:

- files `001` through `005` remain manual legacy or review-needed SQL checklists;
- files `006` through `020` remain draft-only;
- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` remains the first local executable candidate;
- no local, staging, remote, or production SQL was run;
- no localhost-only DB URL was captured;
- local `supabase start` passed `202605180002_reeditpro_media_source_sequence.sql`;
- local `supabase start` then failed in `202605180003_reeditpro_intent_plan_versions.sql` because `public.edit_plan_segments.edit_plan_version_id` did not exist in the earlier schema-era table before `idx_edit_plan_segments_plan_order` was created.

Prompt 20J repaired this blocker.

## Prompt 20J Migration Chain Repair Update

Prompt 20J repairs the missing `public.edit_plan_segments.edit_plan_version_id` blocker in `supabase/migrations/202605180003_reeditpro_intent_plan_versions.sql`. The repair also ensures `segment_order` exists when missing, guards `edit_plan_segments_edit_plan_version_id_fkey`, and guards `idx_edit_plan_segments_plan_order` creation.

Manifest state after Prompt 20J:

- files `001` through `005` remain manual legacy or review-needed SQL checklists;
- files `006` through `020` remain draft-only;
- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` remains the first local executable candidate;
- no local, staging, remote, or production SQL was run;
- no localhost-only DB URL was captured;
- local `supabase start` passed `202605180003_reeditpro_intent_plan_versions.sql`;
- local `supabase start` now fails in `202605180004_reeditpro_credits_approval_snapshots.sql` because `public.credit_reservations.approved_plan_snapshot_id` does not exist in the earlier schema-era table before `credit_reservations_approved_plan_snapshot_id_fkey` is added.

Prompt 20K is required before the Prompt 20B SQL candidate can be run.

## Prompt 20K Migration Chain Repair Update

Prompt 20K repairs the missing `public.credit_reservations.approved_plan_snapshot_id` blocker in `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql`. The repair also adds nullable compatibility columns for `credit_ledger_entries.approved_plan_snapshot_id` and `credit_estimates.edit_plan_version_id`, guards approved snapshot FK creation, and guards `idx_credit_estimates_project_plan`.

Manifest state after Prompt 20K:

- files `001` through `005` remain manual legacy or review-needed SQL checklists;
- files `006` through `020` remain draft-only;
- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` remains the first local executable candidate;
- no local, staging, remote, or production SQL was run;
- no localhost-only DB URL was captured;
- local `supabase start` passed `202605180004_reeditpro_credits_approval_snapshots.sql`;
- local `supabase start` now fails in `202605180005_reeditpro_generation_assets_jobs.sql` because `public.generation_requests.approved_plan_snapshot_id` does not exist before `idx_generation_requests_project_snapshot` is created.

Prompt 20L is required before the Prompt 20B SQL candidate can be run.

## Prompt 20L Migration Chain Repair Update

Prompt 20L repairs the missing `public.generation_requests.approved_plan_snapshot_id` blocker in `supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql`. The repair also adds nullable compatibility column `generated_asset_versions.version`, backfills it from `version_number` where available, guards the approved snapshot FK, and guards the generation request and generated asset version indexes.

Manifest state after Prompt 20L:

- files `001` through `005` remain manual legacy or review-needed SQL checklists;
- files `006` through `020` remain draft-only;
- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` remains the first local executable candidate;
- no local, staging, remote, or production SQL was run;
- no localhost-only DB URL was captured;
- local `supabase start` passed `202605180005_reeditpro_generation_assets_jobs.sql`;
- local `supabase start` now fails in `202605180006_reeditpro_qa_exports_audit.sql` because `qa_check_results.check text` is parsed as invalid SQL syntax.

Prompt 20M is required before the Prompt 20B SQL candidate can be run.

## Prompt 20M Migration Chain Repair Update

Prompt 20M repairs the `qa_check_results.check text` syntax blocker in `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql`. The repair renames the column to `check_type`, adds nullable compatibility column `qa_reports.approved_plan_snapshot_id`, guards the approved snapshot FK, and guards `idx_qa_reports_project_snapshot`.

Manifest state after Prompt 20M:

- files `001` through `005` remain manual legacy or review-needed SQL checklists;
- files `006` through `020` remain draft-only;
- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` remains the first local executable candidate;
- no local, staging, remote, or production SQL was run;
- no localhost-only DB URL was captured;
- local `supabase start` passed `202605180006_reeditpro_qa_exports_audit.sql`;
- local `supabase start` now fails in `202605180007_reeditpro_rls_policies.sql` because `create or replace function public.is_workspace_member(workspace_uuid uuid)` attempts to rename an existing input parameter from `target_workspace_id`.

Prompt 20N is required before the Prompt 20B SQL candidate can be run.

## Prompt 20N Migration Chain Repair Update

Prompt 20N repairs the RLS helper input parameter-name blocker in `supabase/migrations/202605180007_reeditpro_rls_policies.sql`. It preserves `target_workspace_id` for the workspace helper functions so `create or replace function` does not attempt to rename existing function parameters.

Manifest state after Prompt 20N:

- files `001` through `005` remain manual legacy or review-needed SQL checklists;
- files `006` through `020` remain draft-only;
- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` remains the first local executable candidate;
- no local, staging, remote, or production SQL was run;
- no localhost-only DB URL was captured;
- local `supabase start` did not reach migration application because port `54322` was already bound by `rapportd`;
- the Prompt 20N migration repair has not yet been proven by a successful local start.

Prompt 20O is required before the Prompt 20B SQL candidate can be run.

## Prompt 20O Local Start Retry Update

Prompt 20O changes local Supabase DB/Studio ports to `54330`/`54331`, resolving the local `54322`/`54323` conflict with `rapportd` without killing any non-Supabase process.

Manifest state after Prompt 20O:

- files `001` through `005` remain manual legacy or review-needed SQL checklists;
- files `006` through `020` remain draft-only;
- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` remains the first local executable candidate;
- no local, staging, remote, or production SQL was run;
- no localhost-only DB URL was captured;
- local `supabase start` now passes `202605180007_reeditpro_rls_policies.sql`;
- local `supabase start` now fails in `202605180008_reeditpro_storage_buckets_policies.sql` with `SQLSTATE 42501` because the migration attempts to comment on `storage.buckets` without table ownership.

Prompt 20P is required before the Prompt 20B SQL candidate can be run.

## Prompt 20P Storage Migration Chain Repair Update

Prompt 20P repairs the storage comment ownership blocker in `supabase/migrations/202605180008_reeditpro_storage_buckets_policies.sql` by replacing direct `COMMENT ON` statements for Supabase-owned storage objects with plain SQL comments.

Manifest state after Prompt 20P:

- files `001` through `005` remain manual legacy or review-needed SQL checklists;
- files `006` through `020` remain draft-only;
- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` remains the first local executable candidate;
- no local, staging, remote, or production SQL was run;
- no localhost-only DB URL was captured;
- local `supabase start` now passes `202605180008_reeditpro_storage_buckets_policies.sql`;
- local `supabase start` now fails in `202605200001_storage_upload_pipeline_readiness.sql` with `SQLSTATE 42501` because a later migration attempts to `COMMENT ON POLICY ... ON storage.objects` without relation ownership.

Prompt 20P2 is required before the Prompt 20B SQL candidate can be run.

## Prompt 20P2 Storage Ownership/Privilege Follow-Up Update

Prompt 20P2 repairs the remaining storage policy comment ownership blocker in `supabase/migrations/202605200001_storage_upload_pipeline_readiness.sql` by replacing direct `COMMENT ON POLICY ... ON storage.objects` statements with plain SQL comments.

Manifest state after Prompt 20P2:

- files `001` through `005` remain manual legacy or review-needed SQL checklists;
- files `006` through `020` remain draft-only;
- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` remains the first local executable candidate;
- no local, staging, remote, or production SQL was run;
- local `supabase start` now passes the migration chain;
- localhost DB evidence was captured safely as host `127.0.0.1`, port `54330`, database `postgres`, local-only yes;
- `npm run supabase:rls:list-tests` and `npm run supabase:rls:local:dry-run` ran without SQL execution.

Prompt 20B-Retry can run the first local executable SQL candidate once its guarded runner receives or inspects the approved localhost-only local DB target.

## Prompt 20B-Retry Local SQL Execution Update

Prompt 20B-Retry runs the first local executable SQL candidate through the guarded runner.

Manifest state after Prompt 20B-Retry:

- files `001` through `005` remain manual legacy or review-needed SQL checklists;
- files `006` through `020` remain draft-only;
- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` is the first local executable candidate and has now passed locally through the guarded runner;
- local `supabase start` passes;
- localhost DB evidence was captured safely as host `127.0.0.1`, port `54330`, database `postgres`, local-only yes;
- the guarded runner executed exactly one SQL file;
- no staging, remote, or production SQL was run.

The first guarded run failed on a SQL fixture/schema mismatch:

```text
ERROR: column "metadata_json" of relation "workspaces" does not exist
```

The SQL candidate was minimally adjusted to support the migrated local schema-era bridge by seeding `public.user_profiles`, using `workspaces.owner_user_id`, and using `projects.created_by`. The final guarded run passed and rolled back the synthetic transaction.

Prompt 21 can prepare the staging Supabase/RLS validation approval packet. Broader local domain tests remain draft-only until explicitly converted in later milestones.

## Prompt 21 Staging Selection Update

Prompt 21 adds `docs/staging-rls-test-selection-matrix.md` as the staging approval classification for existing SQL files.

Manifest state after Prompt 21:

- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` remains the only local-passed SQL file;
- that local-passed file is a staging-candidate only after human approval and staging fixture adaptation;
- files `001` through `005` remain legacy/manual or schema-review-needed;
- files `006` through `020` remain draft-only;
- storage, snapshots, credits, jobs/workers, media, render/export, QA/revision, tools, providers, compliance, observability, and E2E domains require fixture design or schema review before staging selection;
- no staging SQL ran;
- no remote or production SQL ran;
- production readiness remains blocked.

Prompt 22 can review the approval packet. It must not treat Prompt 21 as staging execution approval.
