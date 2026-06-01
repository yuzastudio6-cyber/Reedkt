# Production Milestone Plan

This plan converts the high-level ReeditPro production path into ordered repo milestones. Each milestone must preserve the core rule: no expensive AI editing, rendering, generation, provider calls, worker execution, or credit spending before approved edit plan, approved credit estimate, and the required backend gates.

## 0. Source-Of-Truth Repo Consolidation

- Purpose: create a clean production foundation source of truth.
- Implements: `PRODUCTION_FOUNDATION_STATUS.md`, `docs/source-of-truth-map.md`, this milestone plan, Prompt 0 audit, and Prompt 0 implementation record.
- Must not implement: backend logic, migrations, providers, rendering, Stripe, deployment, package installs, tool execution, or service-role secrets.
- Main files/tables/services: README/AGENTS/docs only; no tables or services.
- Acceptance criteria: source-of-truth docs exist, README and AGENTS point to them, `git diff --check` passes.
- GitHub deliverable: dedicated branch, commit, push, and PR against planning-stack.

## 1. Production Architecture Freeze

- Purpose: lock frontend/backend/Supabase/worker/provider/render/tool boundaries before deeper implementation.
- Implements: architecture decision records for service ownership, trust boundaries, allowed transports, idempotency, auth, secrets, storage, credit, worker, provider, render, and QA boundaries.
- Expected deliverables: `docs/production-architecture-freeze.md`, `docs/architecture-boundary-matrix.md`, `docs/execution-gates-contract.md`, `docs/future-backend-service-map.md`, and `docs/future-worker-lanes.md`.
- Status after Prompt 1: architecture-frozen / docs-only. This does not mark the milestone production-ready.
- Must not implement: production handlers, migrations, provider clients, Stripe, Cloud Run deployment, render workers, or tool execution.
- Main files/tables/services: `PRODUCTION_FOUNDATION_STATUS.md`, `docs/source-of-truth-map.md`, `database-architecture.md`, `worker-tool-runtime-architecture.md`, `docs/backend-api-route-map.md`.
- Acceptance criteria: every future production capability has an owner boundary, blocked/allowed state, required gates, and rollback/validation expectation.
- Next prompt: Prompt 2 - Supabase Schema Review and Migration Validation.
- GitHub deliverable: branch, commit, push, PR with architecture-freeze summary and explicit no-execution statement.

## 2. Supabase Schema Review And Migration Validation

- Purpose: validate the schema chain before any production data path depends on it.
- Implements: migration inventory, active-vs-draft comparison, schema conflict inventory, local/staging/prod validation runbook, RLS/storage policy validation test plan, validation results record, and local-only static audit tooling.
- Expected deliverables: `docs/supabase-schema-review-report.md`, `docs/supabase-migration-validation-runbook.md`, `docs/rls-and-storage-policy-validation-plan.md`, `docs/schema-conflict-inventory.md`, `docs/schema-validation-results.md`, optional `scripts/validation/supabase-schema-static-audit.mjs`, and generated static audit JSON when the script runs.
- Status after Prompt 2: validation-infrastructure / docs-plus-static-audit. This does not mark the milestone production-ready.
- Required follow-up: Prompt 2A - Schema Gap Fix Plan is required because Prompt 2 found duplicate active table concepts across schema eras.
- Status after Prompt 2A: architecture_decision / docs-only. Prompt 2A chooses canonical table targets and Prompt 3 guardrails but does not clean up SQL migrations.
- Prompt 3 decision: Prompt 3 may proceed only for `auth.users`, `profiles`, `workspaces`, `workspace_members`, and `projects`, using `docs/canonical-schema-contract.md` and `docs/prompt-03-schema-target-guardrails.md`.
- Validation expectations: `git diff --check`, base diff whitespace check, static schema audit, and build/lint when code/package files are touched. Local Supabase reset and SQL smoke tests should be run only after schema conflict resolution or explicit disposable-local approval.
- Must not implement: production migration execution, service-role API handlers, provider calls, rendering, Stripe, or worker dispatch.
- Main files/tables/services: `supabase/migration-order.md`, `database-migration-readiness-checklist.md`, `supabase/migrations/`, `database/test-sql/`, runtime tables from `docs/e2e-readiness/RP-E2E-READY-01-runtime-tables.md`.
- Acceptance criteria: migrations are inventoried, active/draft conflicts are documented, RLS/storage tests are documented, validation results are honest about what did and did not run, no credentials are committed, and no production execution is enabled.
- Next prompt recommendation after Prompt 2A: Prompt 3 - Auth/Profile/Workspace/RLS Production Path.
- GitHub deliverable: branch, commit, push, PR with validation evidence and production-migration status.

## 3. Auth/Profile/Workspace/RLS Production Path

- Purpose: make user, profile, workspace, and membership bootstrap production safe.
- Implements: authenticated backend route/service boundaries for current user, profile ensure, workspace ensure/current, workspace membership checks, and project access checks.
- Expected deliverables: `docs/auth-profile-workspace-production-path.md`, `docs/auth-profile-workspace-rls-test-plan.md`, `docs/auth-profile-workspace-route-contract.md`, `docs/prompt-03-validation-results.md`, `database/test-sql/006_auth_workspace_rls_smoke_tests.draft.sql`, narrow server route/service updates, and implementation prompt tracking.
- Status after Prompt 3: partially_implemented / limited auth-profile-workspace-project foundation only. This does not mark the milestone fully production-ready.
- Validation status after Prompt 3: build/lint/static audit results are recorded in `docs/prompt-03-validation-results.md`; local/remote RLS execution is not assumed unless that file says it ran.
- Prompt 3A hardening result: broad project creation remains fail-closed, access IDs use UUID validation, project reads return explicit access status, and service-role summaries remain limited to safe auth/profile/workspace/project fields.
- Prompt 3A build/lint status: lint and server typecheck pass; full build is blocked by a Vite/Rolldown native binding code-signature issue. See `docs/prompt-03a-auth-rls-fix-results.md`.
- Prompt 3A RLS status: `database/test-sql/006_auth_workspace_rls_smoke_tests.draft.sql` remains draft-only until local fixtures and schema-era cleanup are ready.
- Prompt 3B validation state: validation environment runbook and diagnostics script exist. `npm ci`, lint, and server typecheck pass when npm uses the arm64 Codex Node path. Full build remains blocked by Vite/Rolldown Darwin native binding loading. Supabase CLI remains blocked by architecture mismatch. RLS SQL remains draft-only and unexecuted.
- Prompt 3C validation toolchain: foundation validation runner, default/with-build package scripts, and Linux CI workflow exist. Default validation runs lint, server typecheck, static schema audit, and auth/RLS diagnostics. Full build is separated into the with-build path so local native-binding blockers are classified instead of confused with code failures.
- Must not implement: provider calls, rendering, Stripe, media processing, storage uploads, planning records, approved snapshots, credits, jobs, workers, tools, broad admin routes, SQL migrations, or bypasses around RLS.
- Main files/tables/services: `auth.users`, `profiles`, `workspaces`, `workspace_members`, `projects`, `docs/canonical-schema-contract.md`, `docs/prompt-03-schema-target-guardrails.md`, auth bootstrap docs, backend auth middleware, service-role boundary docs.
- What remains blocked: full build on this host, local Supabase/RLS execution, broad project create/update/list behavior, membership admin/invites, remote Supabase validation, audit event writes, and all non-auth production capabilities.
- Prompt 4 guardrail: Prompt 4 should wait until Prompt 3C default validation passes and the Linux CI full-build path is green; local/staging RLS may remain documented as blocked only if Prompt 4 does not depend on executing auth/RLS SQL.
- Acceptance criteria: Prompt 3 uses only canonical allowed tables, avoids legacy/draft/blocked tables, documents route contracts and RLS tests, honestly records validation, and enables no production capability outside the auth/profile/workspace/project boundary.
- Next prompt recommendation: Prompt 4 - Storage/Upload Production Runtime if Prompt 3C validation/CI passes; otherwise Prompt 3D - CI/Local Supabase Validation Repair.
- GitHub deliverable: branch, commit, push, PR with tests and clear capability enabled statement.

## 4. Storage/Upload Production Runtime

- Purpose: add private source media upload and storage record runtime without enabling editing execution.
- Implements: backend-gated upload intent creation, upload validation, canonical private storage paths, local/mock upload targets, storage object record boundaries, signed URL event boundaries, source media finalization boundaries, workspace/project access checks, route contracts, diagnostics, and draft RLS validation tests.
- Deliverables after Prompt 4: `docs/storage-upload-production-runtime.md`, `docs/storage-upload-route-contract.md`, `docs/storage-upload-rls-test-plan.md`, `docs/prompt-04-validation-results.md`, `database/test-sql/007_storage_upload_rls_smoke_tests.draft.sql`, `scripts/validation/storage-upload-scope-diagnostics.mjs`, storage/upload route metadata updates, and storage/upload server hardening.
- Implementation status after Prompt 4: partially implemented / limited storage-upload route-service foundation only. Production remote storage execution remains backend-required and unvalidated in this milestone.
- Validation status after Prompt 4: lint, server typecheck, static schema audit, auth/RLS diagnostics, storage diagnostics, and foundation validation should pass locally; full build may remain locally environment-blocked and should rely on the Prompt 3C CI path; SQL/RLS remains draft-only unless a working local Supabase environment is available.
- Must not implement: provider calls, media transforms, transcript analysis, edit planning, approved snapshots, credits, jobs, workers, rendering, export execution, public buckets, persistent signed URLs, tools, Stripe, remote Supabase migrations, or production deployment.
- Main files/tables/services: `upload_intents`, `storage_object_records`, `signed_url_events`, `media_assets`, `uploaded_clips`, `source_sequence_items`, `projects`, `workspaces`, `workspace_members`, private Supabase/GCS storage services, `server/services/upload-service.ts`, `server/routes/upload-routes.ts`, `server/validation/upload-schemas.ts`, and `server/storage/*`.
- What remains blocked: remote Supabase/storage validation, local/staging RLS execution, deployed bucket policy verification, production signed URL runtime without configured backend credentials, media analysis, planning, snapshots, credits, jobs, workers, providers, rendering, tools, and billing.
- Acceptance criteria: upload boundaries are private, canonical records store bucket/path only, signed URLs are temporary response data, source media finalization does not trigger analysis/planning/execution, unauthorized access fails closed, diagnostics and validation results are honest, and no blocked domain capability is enabled.
- Next prompt recommendation: Prompt 5 - Approved Plan Snapshot Service if Prompt 4 validation and CI pass; otherwise Prompt 4A - Storage Upload Validation Hardening.
- GitHub deliverable: branch, commit, push, PR with storage validation and no provider/render/tool execution statement.

## 5. Approved Plan Snapshot Service

- Purpose: create the immutable execution contract future workers must use.
- Implements: approved snapshot readiness checks, backend-required creation boundary, canonical approval/estimate/reservation gate validation, deterministic snapshot hash, integrity verification, blockers route, metadata reads/lists, route contracts, diagnostics, and draft RLS validation tests.
- Deliverables after Prompt 5: `docs/approved-plan-snapshot-service.md`, `docs/approved-plan-snapshot-contract.md`, `docs/approved-snapshot-route-contract.md`, `docs/prompt-05-validation-results.md`, `database/test-sql/008_approved_snapshot_rls_smoke_tests.draft.sql`, `scripts/validation/approved-snapshot-scope-diagnostics.mjs`, `server/services/approved-snapshot-service.ts`, `server/routes/approval-routes.ts`, `server/validation/approved-snapshot-schemas.ts`, and approved snapshot route metadata.
- Implementation status after Prompt 5: partially implemented / limited approved snapshot route-service foundation only. Production execution remains blocked.
- Validation status after Prompt 5: lint, server typecheck, static schema audit, auth/RLS diagnostics, storage diagnostics, snapshot diagnostics, and foundation validation should pass locally; full build may rely on the Prompt 3C Linux CI route if local Rolldown remains environment-blocked; SQL/RLS remains draft-only unless a working local Supabase environment is available.
- Must not implement: worker execution, job creation, provider calls, rendering, Stripe, credit reserve/spend/refund mutation, storage upload/download execution, media analysis, planning generation, tool execution, production migrations, remote Supabase validation, deployment, or broad service-role handlers.
- Main files/tables/services: `approved_plan_snapshots`, `approval_records`, `edit_plan_versions`, `credit_estimates`, `credit_reservations`, `projects`, `workspaces`, `workspace_members`, approved snapshot policy docs, route metadata, and the approved snapshot service.
- What remains blocked: credit mutation, job/work graph creation, workers, providers, rendering/export, tools, media analysis, revision execution, local/staging RLS execution, and schema cleanup for compatibility-era fields.
- Acceptance criteria: workers cannot use raw chat as execution input, approved snapshots are immutable execution records, creation fails closed without backend runtime, canonical Prompt 2A tables are targeted, `credit_approvals` is compatibility-only, diagnostics are honest, and no blocked domain capability is enabled.
- Next prompt recommendation: Prompt 6 - Credit Ledger and Approval Gate Production Runtime if Prompt 5 validation and CI pass; otherwise Prompt 5A - Approved Snapshot Validation Hardening.
- GitHub deliverable: branch, commit, push, PR with validation and explicit production capability scope.

## 6. Credit Ledger And Approval Gate Production Runtime

- Purpose: harden the credit ledger and approval gate boundary before backend execution uses it.
- Deliverables after Prompt 6: `docs/credit-ledger-approval-gate-runtime.md`, `docs/credit-ledger-route-contract.md`, `docs/credit-gate-contract.md`, `docs/prompt-06-validation-results.md`, `database/test-sql/009_credit_ledger_approval_gate_rls_smoke_tests.draft.sql`, `scripts/validation/credit-scope-diagnostics.mjs`, `server/services/credit-service.ts`, hardened credit routes/schemas, and backend-required credit route metadata.
- Implementation status after Prompt 6: partially implemented / limited credit route-service foundation only. Real credit mutation remains blocked.
- Validation status after Prompt 6: lint, server typecheck, static schema audit, auth/RLS diagnostics, storage diagnostics, snapshot diagnostics, credit diagnostics, and foundation validation should pass locally; full build may rely on the Prompt 3C Linux CI route if local Rolldown remains environment-blocked; SQL/RLS remains draft-only unless a working local Supabase environment is available.
- Implements: canonical read-only credit readiness/gate checks, fail-closed estimate/approval/reservation/spend/release/refund mutation boundaries, idempotency enforcement for mutation routes, safe metadata checks, route contracts, and diagnostics.
- Must not implement: Stripe checkout/webhooks/payment processing, real credit reserve/spend/release/refund/estimate/approval/wallet mutation, provider calls, rendering, worker dispatch, job creation, tool execution, storage upload/download execution, media analysis, planning generation, remote Supabase validation, deployment, production migrations, or broad service-role handlers.
- Main files/tables/services: `credit_estimates`, `credit_estimate_items`, `approval_records`, `approved_plan_snapshots`, `credit_reservations`, `credit_ledger_entries`, `refund_records`, `projects`, `workspaces`, `workspace_members`, credit service, credit routes, and credit diagnostics.
- What remains blocked: transactional credit RPC/service-role mutation, wallet/grant/purchase semantics, local/staging RLS execution, Stripe, execution-time spends/refunds, audit dashboarding, and schema cleanup for legacy credit-era tables.
- Acceptance criteria: mutation routes fail closed instead of faking success, canonical Prompt 2A/5 credit tables are targeted, legacy credit approval/wallet/refund tables are not production-path targets, no expensive job can start from credit routes, diagnostics are honest, and no blocked domain capability is enabled.
- Next prompt recommendation: Prompt 7 - Backend API Runtime And Route Hardening if Prompt 6 validation and CI pass; otherwise Prompt 6A - Credit Gate Validation Hardening.
- GitHub deliverable: branch, commit, push, PR with validation and explicit statement that no Stripe/provider/render/job/worker/tool/storage/planning execution or real credit mutation was enabled.

## 7. Backend API Runtime And Route Hardening

- Purpose: harden the backend API route surface before job/worker/provider/render/tool implementation begins.
- Deliverables after Prompt 7: `docs/backend-api-runtime-hardening.md`, `docs/backend-api-route-hardening-contract.md`, `docs/backend-api-security-and-fail-closed-policy.md`, `docs/backend-api-route-hardening-test-plan.md`, `docs/prompt-07-validation-results.md`, `scripts/validation/backend-api-route-scope-diagnostics.mjs`, safe response helpers, route capability endpoints, derived route readiness, and fail-closed blocked route groups.
- Implementation status after Prompt 7: partially implemented / limited backend API route hardening only. Production execution remains blocked.
- Validation status after Prompt 7: lint, server typecheck, static schema audit, auth/RLS diagnostics, storage diagnostics, snapshot diagnostics, credit diagnostics, backend API diagnostics, and foundation validation should pass locally; full build may rely on Linux CI if local Rolldown remains environment-blocked.
- Implements: request-ID-aware response envelopes, safe redacted error envelopes, backend-required/blocked response helpers, route capability reporting, mock-router fail-closed behavior, and fail-closed server routes for chat/jobs/workers/providers/render.
- Must not implement: production deployment, provider transport, render/export execution, Stripe checkout/webhooks/payment processing, worker dispatch, job creation, media analysis, generation, tool execution, remote Supabase validation, migrations, storage execution beyond Prompt 4 boundaries, snapshot mutation beyond Prompt 5 boundaries, credit mutation beyond Prompt 6 fail-closed boundaries, or broad admin/service-role mutation.
- Main files/tables/services: `server/app.ts`, `server/routes/route-helpers.ts`, `server/routes/health-routes.ts`, blocked server route groups, `src/backend/api/api-route-registry.ts`, `src/backend/api/mock-api-router.ts`, backend API docs, and diagnostics.
- What remains blocked: deployed backend runtime, rate limits, production audit events, job orchestration, worker claims/leases, providers, render/export, tools, Stripe, media analysis, generation, remote Supabase validation, local RLS execution, and broad service-role mutation.
- Acceptance criteria: backend-required routes are either limited Prompt 3-6 foundations or explicit blockers, execution-capable route groups fail closed, frontend cannot access privileged data, diagnostics pass, and no blocked domain capability is enabled.
- Next prompt recommendation: Prompt 8 - Job Orchestration, Worker Claims, Leases, and Idempotency if Prompt 7 validation and CI pass; otherwise Prompt 7A - Backend API Route Hardening Fix.
- GitHub deliverable: branch, commit, push, PR with validation and explicit production capability scope.

## 8. Job Orchestration, Worker Claims, Leases, And Idempotency

- Purpose: make jobs claimable and recoverable without duplicate expensive work.
- Deliverables after Prompt 8: `docs/job-orchestration-worker-runtime.md`, `docs/job-orchestration-route-contract.md`, `docs/job-worker-gate-contract.md`, `docs/prompt-08-validation-results.md`, `database/test-sql/010_job_worker_lease_idempotency_rls_smoke_tests.draft.sql`, `scripts/validation/job-worker-scope-diagnostics.mjs`, hardened job/worker services, expanded validation schemas, split worker API route metadata, and foundation validation runner coverage.
- Implementation status after Prompt 8: partially implemented / limited job/worker route/service foundation only. Production job and worker execution remain blocked.
- Validation status after Prompt 8: lint, server typecheck, static schema audit, auth/RLS diagnostics, storage diagnostics, snapshot diagnostics, credit diagnostics, backend API diagnostics, job/worker diagnostics, and foundation validation should pass locally; full build may rely on Linux CI if local Rolldown remains environment-blocked.
- Implements: job readiness checks, job batch/job creation boundaries, dependency/event/status/retry/cancel route boundaries, worker claim/lease/heartbeat/release/complete/fail/stale recovery boundaries, idempotency requirements for mutations, static worker runtime metadata, and diagnostics.
- Must not implement: real worker execution, provider calls, rendering, media processing, tool execution, Stripe checkout/webhooks/payment processing, Cloud Run/Pub/Sub/Cloud Tasks dispatch, remote Supabase validation, schema-changing migrations, credit mutation beyond Prompt 6 fail-closed boundaries, storage execution beyond Prompt 4 boundaries, approved snapshot mutation beyond Prompt 5 boundaries, or deployment.
- Main files/tables/services: `job_batches`, `jobs`, `job_dependencies`, `job_events`, `worker_leases`, `worker_job_claims`, `job_claim_attempts`, `backend_runtime_messages`, `api_idempotency_keys`, `server/services/job-service.ts`, `server/services/worker-claim-service.ts`, `server/routes/job-routes.ts`, `server/routes/worker-routes.ts`, and route metadata.
- What remains blocked: transactional service-role job/worker mutation runtime, real worker claims, real leases/heartbeats, worker execution, provider/render/tool/media execution, local/staging RLS validation, stale recovery execution, retry execution, monitoring, and concurrency proof against a live database.
- Acceptance criteria: mutation routes require idempotency, services do not write job/worker runtime tables, route/service responses fail closed with blockers, worker execution remains disabled, diagnostics pass, draft SQL/RLS test exists, and no blocked domain capability is enabled.
- Next prompt recommendation: Prompt 9 - Media Readiness, Probe, Transcript, and Timing Foundation if Prompt 8 validation and CI pass; otherwise Prompt 8A - Job/Worker Validation Hardening.
- GitHub deliverable: branch, commit, push, PR with validation evidence and no-expensive-execution statement.

## 9. Media Readiness, Probe, Transcript, And Timing Foundation

- Purpose: prepare trusted source media facts for planning and execution.
- Deliverables after Prompt 9: `docs/media-readiness-probe-timing-foundation.md`, `docs/media-readiness-route-contract.md`, `docs/media-readiness-gate-contract.md`, `docs/prompt-09-validation-results.md`, `database/test-sql/011_media_readiness_probe_timing_rls_smoke_tests.draft.sql`, `scripts/validation/media-readiness-scope-diagnostics.mjs`, media readiness service/routes/schemas, API route metadata, and foundation validation runner coverage.
- Implementation status after Prompt 9: partially implemented / limited media readiness route/service foundation only. Real media analysis and worker/tool execution remain blocked.
- Validation status after Prompt 9: lint, server typecheck, static schema audit, auth/RLS diagnostics, storage diagnostics, snapshot diagnostics, credit diagnostics, backend API diagnostics, job/worker diagnostics, media readiness diagnostics, and foundation validation should pass locally; full build may rely on Linux CI if local Rolldown remains environment-blocked.
- Implements: media metadata readiness checks, storage object dependency checks, source sequence readiness summaries, probe readiness/request blockers, transcript placeholders, visual/audio observation placeholders, timing seed placeholders, gate contracts, route contracts, and diagnostics.
- Must not implement: real user-media processing, FFmpeg/ffprobe production route execution, transcript/OCR/VLM/audio/visual analysis, job creation, worker claims/execution, provider calls, rendering, tool execution, Stripe checkout/webhooks/payment processing, remote Supabase validation, schema-changing migrations, credit mutation beyond Prompt 6 fail-closed boundaries, storage execution beyond Prompt 4 boundaries, approved snapshot mutation beyond Prompt 5 boundaries, planning generation, or deployment.
- Main files/tables/services: `media_assets`, `uploaded_clips`, `source_sequence_items`, `storage_object_records`, `upload_intents`, `master_timing_maps` as readiness reference only, `server/services/media-readiness-service.ts`, `server/routes/media-readiness-routes.ts`, `server/validation/media-readiness-schemas.ts`, and route metadata.
- What remains blocked: probe result persistence, transcript alignment, visual/audio observation, master timing persistence, frame-accurate timing validation, local/staging RLS validation, media worker execution, provider/render/tool/media execution, and production tool/legal review.
- Acceptance criteria: routes require auth, probe request requires idempotency, service does not write media/probe/timing/job/worker/provider/render/tool records, missing runtime returns blockers, diagnostics pass, draft SQL/RLS test exists, and no blocked domain capability is enabled.
- Next prompt recommendation: Prompt 10 - Render/Preview/Export Foundation if Prompt 9 validation and CI pass; otherwise Prompt 9A - Media Readiness Validation Hardening.
- GitHub deliverable: branch, commit, push, PR with validation evidence and no-media-execution statement.

## 10. Render/Preview/Export Foundation

- Purpose: create the controlled render path that can later assemble approved assets into previews and exports.
- Deliverables after Prompt 10: `docs/render-preview-export-foundation.md`, `docs/render-preview-export-route-contract.md`, `docs/render-readiness-gate-contract.md`, `docs/prompt-10-validation-results.md`, `database/test-sql/012_render_preview_export_rls_smoke_tests.draft.sql`, `scripts/validation/render-export-scope-diagnostics.mjs`, render service/routes/schemas, API route metadata, and foundation validation runner coverage.
- Implementation status after Prompt 10: partially implemented / limited render/preview/export route/service foundation only. Real rendering/export and worker execution remain blocked.
- Validation status after Prompt 10: PR #94 GitHub Foundation Validation failed at default foundation validation because `backend:api:diagnostics` and `render:export:diagnostics` misclassified the new fail-closed render service boundary. Prompt 10A is required before Prompt 11.
- Prompt 10A status: validation hardening only. It updates diagnostics to allow the Prompt 10 render boundary when service/runtime blockers, no render job writes, and idempotent request routes are present, and to treat blocker prose separately from executable calls. GitHub Foundation Validation passed on PR #95.
- Implements: render readiness checks, render manifest DTO validation/build boundary, preview readiness/request boundary, render status/list/event reads, export readiness/request boundary, final export status/list reads, route contracts, gate contracts, diagnostics, and draft SQL/RLS validation plan.
- Must not implement: real Remotion execution, real FFmpeg execution, render/export job creation, worker claims/execution, provider calls, media analysis, tool execution, Stripe checkout/webhooks/payment processing, remote Supabase validation, schema-changing migrations, credit mutation beyond Prompt 6 fail-closed boundaries, storage execution beyond Prompt 4 boundaries, approved snapshot mutation beyond Prompt 5 boundaries, planning generation, or deployment.
- Main files/tables/services: `render_jobs`, `render_job_inputs`, `renders`, `render_events`, `final_exports`, `qa_reports`, `qa_check_results`, `approved_plan_snapshots`, `credit_reservations`, `media_assets`, `storage_object_records`, `server/services/render-service.ts`, `server/routes/render-routes.ts`, `server/validation/render-schemas.ts`, and route metadata. `exports` and `export_variants` remain future-cleanup/compatibility concepts.
- What remains blocked: persisted render/export mutation runtime, Remotion workers, FFmpeg postprocess/export workers, preview/export artifact storage writes, signed delivery URLs, local/staging RLS validation, production QA execution, worker execution, providers, tools, and deployment.
- Acceptance criteria: routes require auth, preview/export/manifest build requests require idempotency, service does not write render/export/job/worker/provider/tool/media/storage/credit records, missing runtime returns blockers, diagnostics pass, draft SQL/RLS test exists, and no blocked domain capability is enabled.
- Next prompt recommendation: Prompt 11 - QA, Revision, and Fallback Execution Foundation.
- GitHub deliverable: branch, commit, push, PR with validation evidence and no-render/export-execution statement.

## 11. QA, Revision, And Fallback Execution Foundation

- Purpose: add backend-safe QA readiness, preview review, revision request, fallback decision, repair-planning, and export-blocker boundaries before downstream execution work.
- Deliverables after Prompt 11: `docs/qa-revision-fallback-foundation.md`, `docs/qa-revision-fallback-route-contract.md`, `docs/qa-revision-fallback-gate-contract.md`, `docs/prompt-11-validation-results.md`, `database/test-sql/013_qa_revision_fallback_rls_smoke_tests.draft.sql`, `scripts/validation/qa-revision-scope-diagnostics.mjs`, `server/services/qa-revision-service.ts`, `server/routes/qa-revision-routes.ts`, `server/validation/qa-revision-schemas.ts`, and QA/revision route metadata.
- Implementation status after Prompt 11: partially implemented / limited QA-revision-fallback route-service foundation only. Real QA/revision/fallback execution remains blocked.
- Validation status after Prompt 11: local Node/npm remained blocked by `env: node: Bad CPU type in executable`, but GitHub Foundation Validation passed by manual workflow dispatch on PR #96, including lint, server typecheck, static schema audit, all diagnostics, QA/revision diagnostics, foundation validation, and full Linux build. SQL/RLS remains draft-only unless local Supabase is repaired.
- Implements: fail-closed QA readiness, QA report creation boundary, QA blocker listing/resolution boundary, preview review/comment boundaries, revision request and estimate/approval readiness, fallback decision plan boundary, repair plan readiness, export blocker summaries, route contracts, gate contracts, diagnostics, and draft SQL/RLS validation plan.
- Must not implement: real QA workers, media inspection, revision/regeneration/repair execution, provider calls, real rendering/export, tool execution, worker execution, job creation, storage upload/download execution beyond Prompt 4, credit mutation beyond Prompt 6, approved snapshot mutation beyond Prompt 5, planning generation, Stripe, remote Supabase validation, schema-changing migrations, or deployment.
- Main files/tables/services: `qa_reports`, `qa_check_results`, `preview_reviews`, `review_comments`, `revision_requests`, `approved_plan_snapshots`, `credit_estimates`, `credit_reservations`, `media_assets`, `storage_object_records`, `render_jobs`, `renders`, `render_events`, `final_exports`, `projects`, `workspace_members`, and `server/services/qa-revision-service.ts`.
- What remains blocked: transactional QA/revision/fallback writes, QA workers, media inspection, fallback execution, repair workers, final export unblock automation, production audit writes, local/staging RLS validation, providers, tools, render/export execution, jobs/workers, and deployment.
- Acceptance criteria: routes require auth, mutation boundaries require idempotency, service does not write QA/revision/fallback or downstream execution records, missing runtime returns blockers, diagnostics pass, draft SQL/RLS test exists, and no blocked domain capability is enabled.
- Next prompt recommendation: Prompt 12 - Tool-Call Foundation after Prompt 11 PR review.
- GitHub deliverable: branch, commit, push, PR with validation evidence and no-QA/revision/fallback-execution statement.

## 12. Tool-Call Foundation

- Purpose: define safe backend/worker calls for deterministic tools without installing or executing production tools by default.
- Deliverables after Prompt 12: `docs/tool-call-foundation.md`, `docs/tool-call-context-envelope-contract.md`, `docs/tool-call-route-contract.md`, `docs/tool-intelligence-catalog-contract.md`, `docs/tool-chain-decision-contract.md`, `docs/prompt-12-validation-results.md`, `database/test-sql/014_tool_call_foundation_rls_smoke_tests.draft.sql`, `scripts/validation/tool-call-scope-diagnostics.mjs`, `server/services/tool-call-service.ts`, `server/routes/tool-call-routes.ts`, `server/validation/tool-call-schemas.ts`, and tool-call route metadata.
- Implementation status after Prompt 12: partially implemented / limited tool-call route-service foundation only. Real tool execution remains blocked.
- Implements: static planning catalog and chain metadata, tool-call context-envelope schemas, decision preview summaries, call-intent readiness/create/read/list boundaries, explicit execution/runtime/license blockers, route metadata, diagnostics, and draft SQL/RLS validation plan.
- Must not implement: package installation, arbitrary shell execution, media processing, browser capture, map/chart capture, GPU/model execution, provider calls, rendering/export, job creation, worker execution, storage transfer, credit mutation, remote Supabase, schema-changing migrations, Stripe, or deployment.
- Main files/tables/services: `tool_catalog`, `tool_profiles`, `tool_capabilities`, `tool_chain_templates`, `tool_call_intents`, `tool_call_executions`, `tool_runtime_checks`, `approved_plan_snapshots`, `credit_estimates`, `credit_reservations`, `media_assets`, `storage_object_records`, `renders`, `qa_reports`, `projects`, `workspace_members`, and `server/services/tool-call-service.ts`.
- What remains blocked: canonical tool-call table/RLS application, transactional intent writes, runtime checks, package/license/security approval, worker isolation, actual tool execution, media/tool artifact persistence, local/staging RLS validation, providers, rendering/export, jobs/workers, and deployment.
- Acceptance criteria: routes require auth, future intent creation requires idempotency, service does not write tool-call or downstream execution records, missing runtime returns blockers, diagnostics pass, draft SQL/RLS test exists, and no blocked domain capability is enabled.
- Next prompt recommendation: Prompt 13 - Tool Readiness And Worker Runtime Checks after Prompt 12 PR review.
- GitHub deliverable: branch, commit, push, PR with contracts/tests and explicit no-tool-execution statement unless a later milestone enables a narrow check.

## 13. Tool Readiness And Worker Runtime Checks

- Purpose: verify approved worker environments can report tool availability honestly.
- Implements: readiness checks for required tools, optional tool reporting, Docker/local worker readiness summaries, and production blocker output.
- Must not implement: media transforms, browser automation against user targets, model downloads, optional tool installs, provider calls, or rendering.
- Main files/tables/services: `tool_runtime_checks`, worker readiness routes, `docs/e2e-readiness/RP-E2E-READY-01-worker-tool-readiness.md`, Docker worker readiness image.
- Acceptance criteria: required and optional tools are clearly marked available/unavailable, strict mode blocks when required tools are absent, checks run safe version/import commands only.
- GitHub deliverable: branch, commit, push, PR with readiness logs and tool execution boundary statement.

## 14. Provider Gateway Foundation

- Purpose: create a backend-only gateway for future provider attempts without exposing secrets or bypassing gates.
- Implements: provider request attempts, sanitized webhook/checkback records, Secret Manager reference handling, disabled real clients, provider mode flags, retry/refund hooks, and policy validation.
- Must not implement: live provider calls unless a later prompt explicitly enables one provider behind all gates; no frontend provider calls ever.
- Main files/tables/services: `provider_request_attempts`, `provider_webhook_events`, generation request tables, Secret Manager references, provider gateway service.
- Acceptance criteria: provider secrets never enter frontend/database/logs, all attempts require approved snapshot and credit reservation, Basic/Pro no-Veo and Premium fallback-only Veo are enforced.
- GitHub deliverable: branch, commit, push, PR with provider-disabled tests and exact real-call status.

## 15. Compliance/License/Dependency/Security Review Foundation

- Purpose: clear production blockers for dependencies, tools, media processing, and data/security practices.
- Implements: dependency inventory, license review status, FFmpeg/LGPL configuration review, security scan plan, model/tool approval policy, privacy retention checks, and risk register.
- Must not implement: package installs, model downloads, provider calls, tool execution, deployment, or production media processing.
- Main files/tables/services: `open-source-tool-registry.md`, `tool-license-risk-policy.md`, `launch-tool-stack-update.md`, dependency audit docs, privacy/retention docs.
- Acceptance criteria: each launch-core tool/dependency has approved, blocked, or evaluation-only status; blockers are explicit before execution milestones.
- GitHub deliverable: branch, commit, push, PR with review matrix and no-execution statement.

## 16. Observability, Audit, Abuse Prevention, And Cost Controls

- Purpose: make production behavior traceable, rate-limited, and cost-safe.
- Implements: sanitized audit events, request tracing, rate-limit policy, cost counters, anomaly flags, admin review boundaries, alerting plan, and incident rollback hooks.
- Must not implement: broad admin powers, secret logging, raw provider payload logging, public media access, or cost spending without gates.
- Main files/tables/services: audit/event tables, backend middleware, job/provider/render events, credit ledger records, monitoring service configuration.
- Acceptance criteria: privileged actions are auditable, secrets/signed URLs are redacted, abuse controls exist for upload/provider/render/Stripe paths, cost overrun blocks or asks for approval.
- GitHub deliverable: branch, commit, push, PR with observability tests or dry-run evidence and production-control status.

## 17. End-To-End Staging Smoke Test

- Purpose: verify the staged production path from upload through approved mock or limited real execution under explicit flags.
- Implements: staging-only smoke plan, seeded project, upload, intent/plan, approval, credit reservation, job claim, readiness checks, allowed worker path, QA, preview/export readiness report, and cleanup.
- Must not implement: unapproved provider calls, production customer data processing, public artifacts, unlimited credit spend, or merged production rollout.
- Main files/tables/services: all prior milestone services and tables, staging Supabase/GCS/Cloud Run resources if approved, smoke scripts, audit logs.
- Acceptance criteria: smoke test passes or produces documented blockers; every expensive action is gated, logged, idempotent, private, and tied to an approved snapshot.
- GitHub deliverable: branch, commit, push, PR with staging evidence, blockers, rollback notes, and exact production capability enabled statement.
