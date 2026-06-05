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

- Purpose: classify tool readiness and worker runtime requirements before any future tool activation.
- Deliverables after Prompt 13: `docs/tool-readiness-worker-runtime-foundation.md`, `docs/tool-readiness-policy.md`, `docs/tool-readiness-api.md`, `docs/tool-readiness-diagnostics.md`, `docs/prompt-13-tool-readiness-worker-runtime-checks.md`, `docs/prompt-13-validation-results.md`, `database/test-sql/015_tool_readiness_worker_runtime_rls_smoke_tests.draft.sql`, `scripts/validation/tool-readiness-worker-runtime-diagnostics.mjs`, `server/foundation/tool-readiness/`, read-only tool readiness routes, API metadata, CLIs, and smoke coverage.
- Implementation status after Prompt 13: partially implemented / read-only readiness-planning diagnostics only. Real tool execution remains blocked.
- Prompt 13A CI validation record: Prompt 13 local validation passed, but PR #99 had no GitHub Foundation Validation run because the workflow branch allowlist omitted `codex/rp-foundation-12-tool-call-foundation`. Prompt 13A adds the Prompt 12 and Prompt 13 foundation branches to the workflow trigger and records local/GitHub validation evidence in `docs/prompt-13a-ci-validation-record.md`. GitHub Foundation Validation passed on PR #101 run 26785174523.
- Implements: static readiness states, worker runtime requirement metadata, Track A/Track B tool registry coverage, VLM/Demucs blockers, provider-disabled checks, frontend/worker boundary diagnostics, read-only `/v1/tool-readiness` routes, and draft RLS expectations.
- Must not implement: tool package installation, real readiness probes, media transforms, browser automation, model downloads, tool runtime execution, job creation, worker claim/execution, provider calls, rendering/export, storage transfer, signed URL creation, SQL execution, deployment, Stripe, or production/beta unlocks.
- Main files/tables/services: future `tool_readiness_records`, `tool_runtime_requirements`, `worker_runtime_status`, `tool_call_intents`, `tool_call_executions`, `server/foundation/tool-readiness/`, and `server/routes/tool-readiness-routes.ts`.
- What remains blocked: canonical readiness table/RLS application, worker runtime status persistence, tool package/license/security approval, worker isolation, actual tool execution, local/staging RLS validation, providers, rendering/export, jobs/workers, and deployment.
- Acceptance criteria: routes are read-only, every tool has an explicit state and blocked reason when blocked, all production/beta/broad-media flags are false, no tool is runtime-enabled, diagnostics pass, draft SQL/RLS test exists, and no blocked domain capability is enabled.
- Next prompt recommendation: Prompt 14 - Worker Claim And Execution Contract Hardening.
- GitHub deliverable: branch, commit, push, PR with readiness logs and tool execution boundary statement.

## 14. Worker Claim And Execution Contract Hardening

- Purpose: harden the future worker claim/execution contract before any tool runtime can move beyond readiness reporting.
- Deliverables after Prompt 14: `docs/worker-claim-execution-contract-hardening.md`, `docs/worker-execution-envelope-contract.md`, `docs/worker-claim-route-contract.md`, `docs/worker-execution-gate-contract.md`, `docs/prompt-14-validation-results.md`, `database/test-sql/016_worker_claim_execution_contract_rls_smoke_tests.draft.sql`, `scripts/validation/worker-execution-contract-diagnostics.mjs`, worker execution route/service/schema updates, and worker route metadata.
- Implementation status after Prompt 14: partially implemented / limited worker claim-execution contract foundation only. Real worker execution remains blocked.
- Validation status after Prompt 14: local `git diff --check`, lint, server typecheck, static schema audit, auth/RLS diagnostics, storage diagnostics, snapshot diagnostics, credit diagnostics, backend API diagnostics, job/worker diagnostics, media readiness diagnostics, render/export diagnostics, QA/revision diagnostics, tool-call diagnostics, tool readiness diagnostics, worker execution diagnostics, default foundation validation, full build, server build, and with-build foundation validation passed. GitHub Foundation Validation passed on PR #103 run 26787232436.
- Implements: service-role worker claim constraints, approved snapshot requirements, credit reservation references, media/storage readiness references, tool readiness integration, idempotency, lease/heartbeat contract verification, complete/fail/cancel/stale recovery blockers, audit event shape, and no-op/fail-closed execution paths.
- Must not implement: real worker execution, tool runtime execution, provider calls, rendering/export, media processing, storage transfer, Cloud Run dispatch, deployment, SQL execution, or production/beta unlocks.
- Main files/tables/services: `worker_job_claims`, `worker_leases`, `worker_runtime_status`, `tool_call_intents`, `tool_call_executions`, approved snapshots, credit reservations, jobs, job events, idempotency keys, worker execution contract service, and job/worker route contracts.
- What remains blocked: transactional worker claims, leases, heartbeats, completion/failure/cancel writes, stale recovery mutation, worker execution, tool execution, providers, render/export, media processing, storage transfer, credit mutation, local/staging RLS validation, deployment, and production/beta unlock.
- Acceptance criteria: worker claims remain backend-only, service-role-only, idempotent, approved-snapshot-bound, and fail-closed until a later runtime activation phase explicitly enables execution.
- Next prompt recommendation: Prompt 15 - Provider Gateway Foundation.
- GitHub deliverable: branch, commit, push, PR with worker execution contract hardening and explicit no-runtime-execution status.

## 15. Provider Gateway Foundation

- Purpose: harden backend-safe provider gateway boundaries before any provider execution, webhook processing, or generated asset persistence.
- Deliverables after Prompt 15: `docs/provider-gateway-foundation.md`, `docs/provider-request-envelope-contract.md`, `docs/provider-gateway-route-contract.md`, `docs/provider-gateway-gate-contract.md`, `docs/provider-secret-boundary-policy.md`, `docs/prompt-15-validation-results.md`, `database/test-sql/017_provider_gateway_rls_smoke_tests.draft.sql`, `scripts/validation/provider-gateway-scope-diagnostics.mjs`, provider route/service/schema updates, and provider route metadata.
- Implementation status after Prompt 15: partially implemented / limited provider gateway route-service foundation only. Real provider execution remains blocked.
- Validation status after Prompt 15: pending final local validation and GitHub Foundation Validation.
- Implements: provider readiness, static catalog/model summaries, secret-reference checks without secret reads, route previews, request-envelope validation, request-attempt create boundaries, webhook receive boundaries, output-readiness blockers, fail-closed execution blockers, diagnostics, and draft SQL/RLS validation plan.
- Must not implement: real provider calls, provider SDK installation, Secret Manager access, provider secret reads, provider webhook processing, generated asset creation, worker execution, production job claims, Cloud Run/Pub/Sub/Cloud Tasks dispatch, render/export, tool execution, media processing, storage transfer, credit mutation, Stripe, migrations, remote Supabase, deployment, or production/beta unlocks.
- Main files/tables/services: `generation_providers`, `generation_provider_models`, `provider_request_attempts`, `provider_webhook_events`, approved snapshots, credit reservations, jobs/worker records as readiness references, tool-call intents, storage object records, QA blockers, provider gateway route/service/contracts, and idempotency keys.
- What remains blocked: provider transport, provider secrets, webhook verification, attempt persistence, generated asset persistence, provider output storage, local/staging RLS validation, workers, tools, render/export, credit mutation, and deployment.
- Acceptance criteria: routes require auth, request boundaries require idempotency, service does not write provider records or call providers, missing runtime returns blockers, diagnostics pass, draft SQL/RLS test exists, and no blocked downstream capability is enabled.
- Next prompt recommendation: Prompt 16 - Compliance, License, Dependency, and Security Review Foundation if Prompt 15 validation and CI pass; otherwise Prompt 15A - Provider Gateway Validation Hardening.
- GitHub deliverable: branch, commit, push, PR with provider gateway foundation and explicit no-provider-execution status.

## 16. Compliance, License, Dependency, And Security Review Foundation

- Purpose: add backend-safe compliance/license/dependency/security review boundaries before any future tool, provider, worker, render, or production-enablement milestone can execute.
- Deliverables after Prompt 16: `docs/compliance-license-security-review-foundation.md`, `docs/compliance-review-contract.md`, `docs/compliance-route-contract.md`, `docs/compliance-gate-contract.md`, `docs/dependency-security-review-runbook.md`, `docs/tool-provider-compliance-matrix.md`, `docs/prompt-16-validation-results.md`, `database/test-sql/018_compliance_license_security_review_rls_smoke_tests.draft.sql`, `scripts/validation/compliance-scope-diagnostics.mjs`, compliance route/service/schema updates, and compliance route metadata.
- Implementation status after Prompt 16: partially implemented / limited compliance route-service foundation only. Legal approval, production approval, dependency approval, and runtime approval remain blocked.
- Implements: static compliance subject inventory from tool readiness/provider/dependency metadata, review preview/create boundaries, license/security/dependency/runtime readiness blockers, production-unlock blocked response, audit summary boundary, route metadata, diagnostics, and draft SQL/RLS validation plan.
- Must not implement: legal advice, production approval, dependency mutation, audit fix, package installs beyond `npm ci`, tool package installs, provider SDK installs, Secret Manager access, provider secret reads, provider calls, tool execution, worker execution, render/export, media processing, storage transfer, credit mutation, Stripe, migrations, remote Supabase, deployment, or production/beta unlocks.
- Main files/tables/services: future `compliance_review_records`, `tool_license_compliance`, `dependency_review_records`, `package_review_records`, `license_review_records`, `security_review_records`, `runtime_approval_records`, `model_provenance_review_records`, `compliance_audit_events`, `audit_events`, and `server/services/compliance-service.ts`.
- What remains blocked: compliance table/RLS application, human review workflow, dependency remediation, runtime approval persistence, production unlocks, local/staging RLS validation, and all runtime execution domains.
- Acceptance criteria: routes require auth, request boundaries require idempotency, service does not write compliance or runtime records, missing review runtime returns blockers, diagnostics pass, draft SQL/RLS test exists, and no legal/production/runtime approval is granted.
- Next prompt recommendation: Prompt 17 - Observability, Audit, Abuse Prevention, and Cost Controls if Prompt 16 validation and CI pass; otherwise Prompt 16A - Compliance Validation Hardening.
- GitHub deliverable: branch, commit, push, PR with compliance foundation and explicit no-approval/no-execution status.

## 17. Observability, Audit, Abuse Prevention, And Cost Controls

- Purpose: add backend-safe operational safety boundaries for request tracing, audit previews, rate-limit readiness, abuse-prevention readiness, cost-control readiness, usage previews, route-risk summaries, and operational runbooks.
- Deliverables after Prompt 17: `docs/observability-audit-abuse-cost-foundation.md`, `docs/audit-event-contract.md`, `docs/rate-limit-abuse-cost-control-contract.md`, `docs/observability-route-contract.md`, `docs/observability-gate-contract.md`, `docs/operational-runbook-foundation.md`, `docs/prompt-17-validation-results.md`, `database/test-sql/019_observability_audit_abuse_cost_rls_smoke_tests.draft.sql`, `scripts/validation/observability-scope-diagnostics.mjs`, observability route/service/schema updates, and observability route metadata.
- Implementation status after Prompt 17: partially implemented / limited observability, audit, abuse-prevention, and cost-control route-service foundation only. Production persistence and enforcement remain blocked.
- Implements: safe runtime status, current request trace summary, static route-risk summary, sanitized audit event preview, audit create boundary, audit list/summary boundaries, rate-limit/abuse/cost-control readiness and policy previews, usage summary preview, explicit cost-control execution block, operational alert readiness, operational alert preview, diagnostics, and draft SQL/RLS validation plan.
- Must not implement: external telemetry integration, production audit persistence, production rate-limit enforcement, paid billing, Stripe, provider calls, provider secret reads, Secret Manager access, tool execution, worker execution, production job claims, Cloud Run/Pub/Sub/Cloud Tasks dispatch, render/export, media processing, storage transfer, credit mutation, migrations, remote Supabase, deployment, production/beta unlocks, or broad service-role handlers.
- Main files/tables/services: `audit_events`, `backend_runtime_messages`, `api_idempotency_keys`, `job_events`, `provider_request_attempts`, `worker_job_claims`, `worker_leases`, `signed_url_events`, future `rate_limit_events`, future `abuse_prevention_events`, future `usage_metering_records`, future `cost_control_records`, future `operational_alert_records`, future `runtime_health_snapshots`, future `audit_event_summaries`, and `server/services/observability-service.ts`.
- What remains blocked: audit/rate-limit/abuse/cost-control table/RLS application, external monitoring/alert transport, production enforcement, billing/payment controls, local/staging RLS validation, deployment, and all runtime execution domains.
- Acceptance criteria: routes require auth, request boundaries require idempotency, service does not write operational records or send telemetry, missing persistence returns blockers, diagnostics pass, draft SQL/RLS test exists, and no billing/execution/production unlock capability is granted.
- Next prompt recommendation: Prompt 18 - End-to-End Staging Smoke Test Plan if Prompt 17 validation and CI pass; otherwise Prompt 17A - Observability Validation Hardening.
- GitHub deliverable: branch, commit, push, PR with observability foundation and explicit no-telemetry/no-billing/no-execution status.

## 18. End-To-End Staging Smoke Test

- Purpose: create the first comprehensive E2E staging smoke-test plan and beta readiness gate after Prompt 0-17 foundations.
- Deliverables after Prompt 18: `docs/e2e-staging-smoke-test-plan.md`, `docs/beta-readiness-gate-contract.md`, `docs/e2e-smoke-scenario-matrix.md`, `docs/staging-smoke-fixture-contract.md`, `docs/staging-smoke-runbook.md`, `docs/beta-readiness-scorecard.md`, `docs/production-beta-blocker-inventory.md`, `docs/e2e-staging-smoke-validation-results.md`, `database/test-sql/020_e2e_staging_smoke_readiness_rls_smoke_tests.draft.sql`, `scripts/validation/e2e-staging-smoke-plan-diagnostics.mjs`, and implementation prompt tracking.
- Implementation status after Prompt 18: validation infrastructure / E2E staging smoke plan and diagnostics only. No staging execution, production execution, or beta unlock is enabled.
- Implements: static E2E smoke scenario matrix, future local Supabase path, future staging path, future production beta go/no-go path, synthetic fixture contract, beta readiness gates, beta readiness scorecard, production beta blocker inventory, draft SQL/RLS test plan, workflow trigger coverage, and default foundation validation coverage.
- Must not implement: staging deployment, production deployment, local/staging/remote Supabase execution, SQL execution, provider calls, render/export, tool execution, real worker execution, production job claims, media processing, browser capture, storage transfer, signed URL creation, credit mutation, Stripe, external telemetry, schema-changing migrations, or broad service-role handlers.
- Main files/tables/services: docs and diagnostics only; draft RLS references synthetic fixtures across auth/workspace/project, storage, snapshots, credits, jobs/workers, media, render/export, QA, tools, providers, compliance, observability, and audit boundaries.
- What remains blocked: E2E staging smoke not run, local/staging/remote Supabase not executed, no production deployment, no real execution path, no real persistence for blocked runtime domains, no billing, no external telemetry, no production beta approval.
- Acceptance criteria: E2E staging smoke plan exists, beta readiness gate contract exists, scenario matrix exists, fixture contract exists, staging runbook exists, scorecard and blocker inventory exist, diagnostics pass, draft SQL/RLS file remains draft-only, and validation results honestly record what did and did not run.
- Next prompt recommendation: Prompt 19 - Staging Supabase/RLS Validation Preparation if Prompt 18 validation and CI pass; otherwise Prompt 18A - E2E Smoke Plan Hardening.
- GitHub deliverable: branch, commit, push, PR with validation evidence and explicit no-staging/no-production-execution statement.

## 19. Staging Supabase/RLS Validation Preparation

- Purpose: prepare the Supabase/RLS validation path before any local or staging SQL execution.
- Deliverables after Prompt 19: `docs/staging-supabase-rls-validation-preparation.md`, `docs/supabase-rls-test-manifest.md`, `docs/rls-draft-to-executable-conversion-plan.md`, `docs/staging-supabase-environment-contract.md`, `docs/supabase-rls-fixture-contract.md`, `docs/staging-supabase-validation-runbook.md`, `docs/supabase-validation-evidence-checklist.md`, `docs/prompt-19-validation-results.md`, `database/test-sql/README.md`, `scripts/validation/supabase-rls-preparation-diagnostics.mjs`, and implementation prompt tracking.
- Implementation status after Prompt 19: validation prepared / Supabase-RLS preparation only. No SQL, Supabase, migration, staging, production, or runtime execution is enabled.
- Implements: SQL/RLS file manifest for `001`-`020`, draft-to-executable conversion rules, local Supabase preflight plan, staging environment contract, synthetic fixture contract, validation evidence checklist, beta blocker updates, and static preparation diagnostics.
- Must not implement: local/staging/remote Supabase execution, SQL execution, migration deployment, production/staging data creation, deployment, providers, tools, workers, render/export, media processing, storage transfer, signed URL creation, credit mutation, Stripe, external telemetry, dependency mutation, or production/beta unlock.
- Main files/tables/services: docs and diagnostics only; SQL/RLS files remain manual or draft validation artifacts. Referenced table concepts come from the manifest and canonical schema docs.
- What remains blocked: local Supabase/RLS execution, staging Supabase/RLS execution, remote production Supabase, migration application evidence, storage policy execution evidence, runtime execution domains, deployment, billing, external telemetry, and beta approval.
- Acceptance criteria: preparation docs, manifest, conversion plan, environment contract, fixture contract, runbook, evidence checklist, diagnostics, test SQL README, scorecard, blocker inventory, and tracker updates exist; diagnostics pass; no Supabase/SQL execution occurs.
- Next prompt recommendation: Prompt 20 - Local Supabase/RLS Validation Execution if Prompt 19 validation and CI pass; otherwise Prompt 19A - Supabase/RLS Preparation Hardening.
- GitHub deliverable: branch, commit, push, PR with validation evidence and explicit no-Supabase/no-SQL-execution statement.

## 20. Local Supabase/RLS Validation Execution

- Purpose: attempt the first safe local-only Supabase/RLS validation path after Prompt 19 preparation.
- Deliverables after Prompt 20: `docs/local-supabase-rls-validation-execution.md`, `docs/local-supabase-safety-preflight.md`, `docs/local-supabase-rls-evidence.md`, `docs/prompt-20-validation-results.md`, `database/test-sql/local/README.md`, `scripts/validation/local-supabase-safety-preflight.mjs`, `scripts/validation/local-supabase-rls-runner.mjs`, package scripts for local preflight/list/dry-run/run, manifest updates, scorecard updates, blocker inventory updates, and implementation prompt tracking.
- Implementation status after Prompt 20: validation blocked / local Supabase-RLS tooling only. No SQL, Supabase, migration, staging, production, or runtime execution is enabled.
- Implements: local-only safety preflight, local toolchain detection, remote-link/env-name risk detection, guarded RLS list/dry-run runner, strict allowed SQL directory rules, JSON evidence summaries, CI trigger coverage for Prompt 20 PRs, and updated beta readiness evidence.
- Must not implement: staging/remote/production Supabase execution, remote SQL, migration deployment, production/staging data creation, deployment, providers, tools, workers, render/export, media processing, storage transfer, signed URL creation, credit mutation, Stripe, external telemetry, dependency mutation, or production/beta unlock.
- Main files/tables/services: docs and validation scripts only; SQL/RLS files remain manual or draft validation artifacts. No tables are migrated or mutated.
- What remains blocked: local Supabase/RLS execution, staging Supabase/RLS execution, remote production Supabase, migration application evidence, storage policy execution evidence, runtime execution domains, deployment, billing, external telemetry, and beta approval.
- Validation result: local preflight and runner list/dry-run completed without SQL execution. Local validation remains blocked by missing `supabase/config.toml`, wrong-architecture Supabase CLI error `-86`, unavailable Docker daemon, missing `psql`, no verified local DB URL, and no executable local SQL candidates.
- Acceptance criteria: local safety preflight exists and reports blockers; runner exists in list/dry-run mode; SQL manifest and local README are updated; no SQL executes unless target is proven local and isolated; beta readiness is updated honestly; no remote/staging/production Supabase is touched.
- Next prompt recommendation: Prompt 20A - Local Supabase Toolchain Repair. Prompt 21 should wait until local SQL/RLS execution evidence exists or a human-approved staging packet is explicitly scoped.
- GitHub deliverable: branch, commit, push, PR with validation evidence and explicit no-staging/no-remote/no-production-Supabase statement.

## 20A. Local Supabase Toolchain Repair

- Purpose: repair repo-owned local Supabase/RLS validation toolchain blockers after Prompt 20 without running SQL.
- Deliverables after Prompt 20A: `supabase/config.toml`, hardened `scripts/validation/local-supabase-safety-preflight.mjs`, hardened `scripts/validation/local-supabase-rls-runner.mjs`, `docs/local-supabase-toolchain-repair.md`, `docs/prompt-20a-validation-results.md`, generated-evidence ignore rules, workflow trigger update, and tracker updates.
- Implementation status after Prompt 20A: validation blocked / local Supabase toolchain repair only. No SQL, Supabase command, migration, staging, production, or runtime execution is enabled.
- Implements: local-only Supabase config scaffold, CLI architecture detection, Docker daemon detection, `psql` detection, remote-link/env-name risk reporting, explicit `--confirm-local-only` run gate, ignored evidence output path, and updated blocker evidence.
- Must not implement: staging/remote/production Supabase execution, remote SQL, local SQL without proven local target, migration deployment, production/staging data creation, deployment, providers, tools, workers, render/export, media processing, storage transfer, signed URL creation, credit mutation, Stripe, external telemetry, dependency mutation, or production/beta unlock.
- Main files/tables/services: docs and validation scripts only; SQL/RLS files remain manual or draft validation artifacts. No tables are migrated or mutated.
- What remains blocked: local SQL/RLS execution, wrong-architecture Supabase CLI error `-86`, missing `psql`, no verified local DB URL, no executable local SQL candidate, staging Supabase/RLS execution, remote production Supabase, and beta approval.
- Validation result: local preflight, runner list mode, and runner dry-run mode complete without SQL execution. Docker is reachable and config exists, but `canRunLocalSql=false`.
- Acceptance criteria: local config is safe, preflight is hardened, runner run mode fails closed without `--confirm-local-only`, list/dry-run works, no SQL executes, no remote/staging/production Supabase is touched, and next prompt recommendation is clear.
- Next prompt recommendation: Prompt 20C - Local Supabase Environment Manual Setup. Prompt 20B should wait until preflight reports `canRunLocalSql=true`.
- GitHub deliverable: branch, commit, push, PR with validation evidence and explicit no-staging/no-remote/no-production-Supabase statement.

## 20C. Local Supabase Environment Manual Setup

- Purpose: document and verify the manual local environment setup needed before the first executable local RLS smoke test.
- Deliverables after Prompt 20C: `docs/local-supabase-environment-manual-setup.md`, `docs/local-supabase-manual-checklist.md`, `docs/local-supabase-cli-install-options.md`, `docs/local-postgres-psql-setup.md`, `docs/prompt-20c-validation-results.md`, `docs/implementation-prompts/prompt-20c-local-supabase-environment-manual-setup.md`, preflight remediation output, runner dry-run guidance, workflow trigger update, and tracker updates.
- Implementation status after Prompt 20C: setup documented / local Supabase environment manual setup only. No SQL, Supabase start/status/reset, migration, staging, production, or runtime execution is enabled.
- Implements: official-doc-backed manual CLI repair guidance, arm64 CLI selection rules, `psql` setup choices, Docker/local daemon requirements, local DB URL verification rules, no-remote checklist, Prompt 20B readiness gates, and clearer JSON guidance from preflight/list/dry-run.
- Must not implement: staging/remote/production Supabase execution, local or remote SQL, migration deployment, Supabase start/reset, production/staging data creation, deployment, providers, tools, workers, render/export, media processing, storage transfer, signed URL creation, credit mutation, Stripe, external telemetry, dependency mutation, or production/beta unlock.
- Main files/tables/services: docs and validation scripts only; SQL/RLS files remain manual or draft validation artifacts. No tables are migrated or mutated.
- What remains blocked: local SQL/RLS execution, wrong-architecture Supabase CLI error `-86`, missing `psql`, no verified local DB URL, no executable local SQL candidate, staging Supabase/RLS execution, remote production Supabase, and beta approval.
- Validation result: preflight is expected to remain `blocked` with `manualSetupRequired=true`; runner list/dry-run must complete without SQL execution. Docker is reachable and config exists, but `canRunLocalSql=false`.
- Acceptance criteria: manual setup guide/checklist/CLI options/psql setup docs exist; preflight and runner explain blockers clearly; no SQL executes; no local/staging/remote/production Supabase is touched; next prompt recommendation is clear.
- Next prompt recommendation: Prompt 20D - Manual Environment Setup Verification. Prompt 20B should wait until preflight reports `canRunLocalSql=true`.
- GitHub deliverable: branch, commit, push, PR with validation evidence and explicit no-local/no-staging/no-remote/no-production-Supabase-execution statement.

## 20D. Manual Environment Setup Verification

- Purpose: verify whether the Prompt 20C manual setup work is complete enough to allow Prompt 20B without running SQL or Supabase lifecycle commands.
- Deliverables after Prompt 20D: `docs/local-supabase-environment-verification.md`, `docs/prompt-20d-validation-results.md`, `docs/implementation-prompts/prompt-20d-manual-environment-setup-verification.md`, status-free dry-run behavior, `canProceedToPrompt20B` readiness reporting, workflow trigger update, and tracker updates.
- Implementation status after Prompt 20D: validation blocked / local Supabase environment verification only. No SQL, Supabase start/status/reset, migration, staging, production, or runtime execution is enabled.
- Implements: safe local tool probes, redacted local DB URL environment readiness checks, Docker daemon verification, Supabase CLI architecture verification, `psql` verification, local RLS list/dry-run verification, and Prompt 20B readiness separation.
- Must not implement: staging/remote/production Supabase execution, local or remote SQL, migration deployment, Supabase start/status/reset, production/staging data creation, deployment, providers, tools, workers, render/export, media processing, storage transfer, signed URL creation, credit mutation, Stripe, external telemetry, dependency mutation, or production/beta unlock.
- What remains blocked: local SQL/RLS execution, wrong-architecture Supabase CLI error `-86`, missing `psql`, no localhost-only local DB URL, no executable local SQL candidate, staging Supabase/RLS execution, remote production Supabase, and beta approval.
- Validation result: preflight remains `blocked` with `manualSetupRequired=true`, Docker is reachable, dry-run executes no SQL and reports `callsSupabaseStatus=false`, `canProceedToPrompt20B=false`, and `canRunLocalSql=false`.
- Acceptance criteria: manual environment status is recorded honestly, runner dry-run does not call `supabase status`, no SQL executes, no local/staging/remote/production Supabase is touched, and next prompt recommendation is clear.
- Next prompt recommendation: Prompt 20E - Manual Environment Setup Follow-Up. Prompt 20B should wait until preflight reports `canProceedToPrompt20B=true`.
- GitHub deliverable: branch, commit, push, PR with validation evidence and explicit no-SQL/no-Supabase-execution statement.

## 20E. Local Supabase Manual Setup Follow-Up

- Purpose: verify the host local Supabase toolchain after Prompt 20D and record whether manual setup is complete enough for Prompt 20B, without installing tools or running SQL.
- Deliverables after Prompt 20E: `docs/local-supabase-manual-setup-follow-up.md`, `docs/prompt-20e-validation-results.md`, `docs/implementation-prompts/prompt-20e-local-supabase-manual-setup-follow-up.md`, `scripts/validation/local-supabase-host-toolchain-probe.mjs`, package script `supabase:local:toolchain:probe`, and tracker updates.
- Implementation status after Prompt 20E: validation blocked / manual setup follow-up only. No SQL, Supabase start/status/reset, migration, staging, production, tool install/download, or runtime execution is enabled.
- Implements: manual-only host toolchain probe for Supabase CLI, Docker, `psql`, Homebrew prefix, local config, local DB URL env readiness, remote-risk env names, and Prompt 20B readiness.
- Must not implement: tool install/download, `npx`, staging/remote/production Supabase execution, local or remote SQL, migration deployment, Supabase start/status/reset, production/staging data creation, deployment, providers, tools, workers, render/export, media processing, storage transfer, signed URL creation, credit mutation, Stripe, external telemetry, dependency mutation, or production/beta unlock.
- What remains blocked: local SQL/RLS execution, wrong-architecture Supabase CLI error `-86`, missing `psql`, no localhost-only local DB URL, no executable local SQL candidate, staging Supabase/RLS execution, remote production Supabase, and beta approval.
- Validation result: host toolchain probe remains `blocked`, Docker is reachable, Homebrew is `/usr/local`-prefixed with no `/opt/homebrew`, `canProceedToPrompt20B=false`, and `canRunLocalSql=false`.
- Acceptance criteria: host toolchain status is recorded honestly, no host install/download occurs, no SQL executes, no local/staging/remote/production Supabase is touched, and next prompt recommendation is clear.
- Next prompt recommendation: Prompt 20F - Manual Host Tool Repair Verification. Prompt 20B should wait until preflight or host probe reports `canProceedToPrompt20B=true`.
- GitHub deliverable: branch, commit, push, PR with validation evidence and explicit no-SQL/no-install/no-Supabase-execution statement.

## 20F. Manual Host Tool Repair Verification

- Purpose: verify whether manual host repair happened after Prompt 20E without installing tools, downloading tools, running `npx`, SQL, Supabase lifecycle/status commands, or `psql` database connections.
- Deliverables after Prompt 20F: `docs/local-supabase-host-tool-repair-verification.md`, `docs/prompt-20f-validation-results.md`, `docs/implementation-prompts/prompt-20f-manual-host-tool-repair-verification.md`, Prompt 20E CI follow-up record, workflow trigger coverage for the Prompt 20E base branch, source-of-truth tracker updates, and blocked-state script messaging for Prompt 20F1.
- Implementation status after Prompt 20F: validation blocked / manual host tool repair verification only. No SQL, Supabase start/status/reset, migration, staging, production, tool install/download, or runtime execution is enabled.
- Implements: safe non-mutating host probes for Node/npm, Homebrew, Supabase CLI architecture/version attempt, Docker CLI/daemon, `psql`, local DB URL readiness, remote-risk environment names, and Prompt 20B readiness.
- Must not implement: tool install/download, `npx`, staging/remote/production Supabase execution, local or remote SQL, migration deployment, Supabase start/status/reset, production/staging data creation, deployment, providers, tools, workers, render/export, media processing, storage transfer, signed URL creation, credit mutation, Stripe, external telemetry, dependency mutation, or production/beta unlock.
- What remains blocked: local SQL/RLS execution, wrong-architecture Supabase CLI error `-86`, Docker daemon unavailable to this process, missing `psql`, no localhost-only local DB URL, no executable local SQL candidate, staging Supabase/RLS execution, remote production Supabase, and beta approval.
- Validation result: host toolchain probe remains `blocked`, Docker CLI exists but daemon is unavailable to this process, Homebrew is `/usr/local`-prefixed with no `/opt/homebrew`, `canProceedToPrompt20B=false`, and `canRunLocalSql=false`.
- Acceptance criteria: host toolchain status is recorded honestly, no host install/download occurs, no SQL executes, no local/staging/remote/production Supabase target is touched, and next prompt recommendation is clear.
- Next prompt recommendation: Prompt 20F1 - Manual Host Tool Repair Follow-Up. Prompt 20B should wait until preflight or host probe reports `canProceedToPrompt20B=true`.
- GitHub deliverable: branch, commit, push, PR with validation evidence and explicit no-SQL/no-install/no-Supabase-execution statement.

## 20B. Local RLS First Executable Smoke Test

- Purpose: create and run the first minimal local-only auth/workspace/project RLS smoke test after Prompt 20G migration repair, stopping if local migration start fails.
- Deliverables after Prompt 20B: `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql`, `docs/prompt-20b-validation-results.md`, `docs/implementation-prompts/prompt-20b-local-rls-first-executable-smoke-test.md`, local runner dotfile hardening, local evidence updates, manifest updates, scorecard/blocker updates, workflow trigger coverage for the Prompt 20G base branch, and tracker updates.
- Implementation status after Prompt 20B: validation blocked / first local RLS candidate only. No SQL/RLS smoke test, staging, remote, production, provider, worker, tool, render, media, storage, credit, Stripe, telemetry, or beta unlock is enabled.
- Implements: a rollback-scoped synthetic auth/profile/workspace/member/project SQL candidate, local-only start gate verification, and precise migration-chain blocker evidence.
- Must not implement: staging/remote/production Supabase execution, remote SQL, production migration deployment, provider calls, rendering/export, tool execution, worker execution, production job claims, media processing, storage transfer, signed URL creation, credit mutation, Stripe/payment processing, external telemetry, dependency mutation, or production/beta unlock.
- What remains blocked: local SQL/RLS execution, localhost-only DB URL capture, staging Supabase/RLS execution, remote production Supabase, and beta approval.
- Validation result: local tools pass (`supabase` 2.104.0, Docker 29.5.2, `psql` 18.4), preflight reports `remoteRiskDetected=false` and `canStartLocalSupabase=true`, `supabase start` fails at `202605180001_reeditpro_core_workspace_projects.sql` because `public.projects.current_edit_session_id` is missing before `projects_current_edit_session_id_fkey` is added, and SQL execution is not attempted.
- Acceptance criteria: first local SQL candidate exists, local start is attempted only after safety gates pass, migration failure stops SQL execution, no remote/staging/production target is touched, and next prompt recommendation is clear.
- Next prompt recommendation: Prompt 20H - Local Supabase Migration Chain Repair Follow-Up.
- GitHub deliverable: branch, commit, push, PR with validation evidence and explicit no-staging/no-remote/no-production-Supabase statement.

## 20H. Local Supabase Migration Chain Repair Follow-Up

- Purpose: repair the Prompt 20B local migration-chain blocker in `202605180001_reeditpro_core_workspace_projects.sql` and retry local start without running SQL/RLS tests.
- Deliverables after Prompt 20H: `docs/prompt-20h-local-supabase-migration-chain-repair-follow-up.md`, `docs/implementation-prompts/prompt-20h-local-supabase-migration-chain-repair-follow-up.md`, additive compatibility updates to `supabase/migrations/202605180001_reeditpro_core_workspace_projects.sql`, local evidence updates, manifest updates, scorecard/blocker updates, workflow trigger coverage for the Prompt 20B base branch, and tracker updates.
- Implementation status after Prompt 20H: validation blocked / local migration-chain repair only. No SQL/RLS smoke test, staging, remote, production, provider, worker, tool, render, media, storage, credit, Stripe, telemetry, or beta unlock is enabled.
- Implements: nullable compatibility columns and guarded constraints/backfill for `projects.current_edit_session_id`, `workspaces.owner_id`, `projects.owner_id`, and `chat_messages.edit_session_id`, allowing local `supabase start` to pass `202605180001_reeditpro_core_workspace_projects.sql`.
- Must not implement: staging/remote/production Supabase execution, remote SQL, SQL/RLS smoke tests, production migration deployment, provider calls, rendering/export, tool execution, worker execution, production job claims, media processing, storage transfer, signed URL creation, credit mutation, Stripe/payment processing, external telemetry, dependency mutation, or production/beta unlock.
- What remains blocked: local SQL/RLS execution, localhost-only DB URL capture, staging Supabase/RLS execution, remote production Supabase, and beta approval.
- Validation result: local tools pass (`supabase` 2.104.0, Docker 29.5.2, `psql` 18.4), preflight reports `remoteRiskDetected=false` and `canStartLocalSupabase=true`, `supabase start` passes `202605180001_reeditpro_core_workspace_projects.sql` and then fails at `202605180002_reeditpro_media_source_sequence.sql` because `public.media_assets.status` is missing before `idx_media_assets_project_status` is created.
- Acceptance criteria: core workspace/project migration-chain blocker is repaired, local start is attempted only after safety gates pass, new migration failure stops SQL execution, no remote/staging/production target is touched, and next prompt recommendation is clear.
- Next prompt recommendation: Prompt 20I - Local Supabase Migration Chain Repair Follow-Up for `202605180002_reeditpro_media_source_sequence.sql`.
- GitHub deliverable: branch, commit, push, PR with validation evidence and explicit no-staging/no-remote/no-production-Supabase statement.

## 20I. Local Supabase Migration Chain Repair Follow-Up 2

- Purpose: repair the Prompt 20H local migration-chain blocker in `202605180002_reeditpro_media_source_sequence.sql` and retry local start without running SQL/RLS tests.
- Deliverables after Prompt 20I: `docs/prompt-20i-local-supabase-migration-chain-repair-follow-up-2.md`, `docs/implementation-prompts/prompt-20i-local-supabase-migration-chain-repair-follow-up-2.md`, additive compatibility updates to `supabase/migrations/202605180002_reeditpro_media_source_sequence.sql`, local evidence updates, manifest updates, scorecard/blocker updates, workflow trigger coverage for the Prompt 20H base branch, and tracker updates.
- Implementation status after Prompt 20I: validation blocked / local migration-chain repair only. No SQL/RLS smoke test, staging, remote, production, provider, worker, tool, render, media, storage, credit, Stripe, telemetry, or beta unlock is enabled.
- Implements: missing `media_assets.status`, `media_assets.size_bytes`, and `media_assets.metadata_json` compatibility columns, guarded legacy-column backfills, and guarded `idx_media_assets_project_status` creation, allowing local `supabase start` to pass `202605180002_reeditpro_media_source_sequence.sql`.
- Must not implement: staging/remote/production Supabase execution, remote SQL, SQL/RLS smoke tests, production migration deployment, provider calls, rendering/export, tool execution, worker execution, production job claims, media processing, storage transfer, signed URL creation, credit mutation, Stripe/payment processing, external telemetry, dependency mutation, or production/beta unlock.
- What remains blocked: local SQL/RLS execution, localhost-only DB URL capture, staging Supabase/RLS execution, remote production Supabase, and beta approval.
- Validation result: local tools pass (`supabase` 2.104.0, Docker 29.5.2, `psql` 18.4), preflight reports `remoteRiskDetected=false` and `canStartLocalSupabase=true`, `supabase start` passes `202605180002_reeditpro_media_source_sequence.sql` and then fails at `202605180003_reeditpro_intent_plan_versions.sql` because `public.edit_plan_segments.edit_plan_version_id` is missing before `idx_edit_plan_segments_plan_order` is created.
- Acceptance criteria: media/source-sequence migration-chain blocker is repaired, local start is attempted only after safety gates pass, new migration failure stops SQL execution, no remote/staging/production target is touched, and next prompt recommendation is clear.
- Next prompt recommendation: Prompt 20J - Local Supabase Migration Chain Repair Follow-Up 3 for `202605180003_reeditpro_intent_plan_versions.sql`.
- GitHub deliverable: branch, commit, push, PR with validation evidence and explicit no-staging/no-remote/no-production-Supabase statement.

## 20J. Local Supabase Migration Chain Repair Follow-Up 3

- Purpose: repair the Prompt 20I local migration-chain blocker in `202605180003_reeditpro_intent_plan_versions.sql` and retry local start without running SQL/RLS tests.
- Deliverables after Prompt 20J: `docs/prompt-20j-local-supabase-migration-chain-repair-follow-up-3.md`, `docs/implementation-prompts/prompt-20j-local-supabase-migration-chain-repair-follow-up-3.md`, additive compatibility updates to `supabase/migrations/202605180003_reeditpro_intent_plan_versions.sql`, local evidence updates, manifest updates, scorecard/blocker updates, workflow trigger coverage for the Prompt 20I base branch, and tracker updates.
- Implementation status after Prompt 20J: validation blocked / local migration-chain repair only. No SQL/RLS smoke test, staging, remote, production, provider, worker, tool, render, media, storage, credit, Stripe, telemetry, or beta unlock is enabled.
- Implements: missing `edit_plan_segments.edit_plan_version_id`, guarded `edit_plan_segments_edit_plan_version_id_fkey`, and guarded `idx_edit_plan_segments_plan_order` creation, allowing local `supabase start` to pass `202605180003_reeditpro_intent_plan_versions.sql`.
- Must not implement: staging/remote/production Supabase execution, remote SQL, SQL/RLS smoke tests, production migration deployment, provider calls, rendering/export, tool execution, worker execution, production job claims, media processing, storage transfer, signed URL creation, credit mutation, Stripe/payment processing, external telemetry, dependency mutation, or production/beta unlock.
- What remains blocked: local SQL/RLS execution, localhost-only DB URL capture, staging Supabase/RLS execution, remote production Supabase, and beta approval.
- Validation result: local tools pass (`supabase` 2.104.0, Docker 29.5.2, `psql` 18.4), preflight reports `remoteRiskDetected=false` and `canStartLocalSupabase=true`, `supabase start` passes `202605180003_reeditpro_intent_plan_versions.sql` and then fails at `202605180004_reeditpro_credits_approval_snapshots.sql` because `public.credit_reservations.approved_plan_snapshot_id` is missing before `credit_reservations_approved_plan_snapshot_id_fkey` is added.
- Acceptance criteria: intent-plan migration-chain blocker is repaired, local start is attempted only after safety gates pass, new migration failure stops SQL execution, no remote/staging/production target is touched, and next prompt recommendation is clear.
- Next prompt recommendation: Prompt 20K - Local Supabase Migration Chain Repair Follow-Up 4 for `202605180004_reeditpro_credits_approval_snapshots.sql`.
- GitHub deliverable: branch, commit, push, PR with validation evidence and explicit no-staging/no-remote/no-production-Supabase statement.

## 20K. Local Supabase Migration Chain Repair Follow-Up 4

- Purpose: repair the Prompt 20J local migration-chain blocker in `202605180004_reeditpro_credits_approval_snapshots.sql` and retry local start without running SQL/RLS tests.
- Deliverables after Prompt 20K: `docs/prompt-20k-local-supabase-migration-chain-repair-follow-up-4.md`, `docs/implementation-prompts/prompt-20k-local-supabase-migration-chain-repair-follow-up-4.md`, additive compatibility updates to `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql`, local evidence updates, manifest updates, scorecard/blocker updates, workflow trigger coverage for the Prompt 20J base branch, and tracker updates.
- Implementation status after Prompt 20K: validation blocked / local migration-chain repair only. No SQL/RLS smoke test, staging, remote, production, provider, worker, tool, render, media, storage, credit, Stripe, telemetry, or beta unlock is enabled.
- Implements: missing `credit_reservations.approved_plan_snapshot_id`, `credit_ledger_entries.approved_plan_snapshot_id`, and `credit_estimates.edit_plan_version_id` compatibility columns, guarded approved snapshot FKs, and guarded `idx_credit_estimates_project_plan` creation, allowing local `supabase start` to pass `202605180004_reeditpro_credits_approval_snapshots.sql`.
- Must not implement: staging/remote/production Supabase execution, remote SQL, SQL/RLS smoke tests, production migration deployment, provider calls, rendering/export, tool execution, worker execution, production job claims, media processing, storage transfer, signed URL creation, credit mutation, Stripe/payment processing, external telemetry, dependency mutation, or production/beta unlock.
- What remains blocked: local SQL/RLS execution, localhost-only DB URL capture, staging Supabase/RLS execution, remote production Supabase, and beta approval.
- Validation result: local tools pass (`supabase` 2.104.0, Docker 29.5.2, `psql` 18.4), preflight reports `remoteRiskDetected=false` and `canStartLocalSupabase=true`, `supabase start` passes `202605180004_reeditpro_credits_approval_snapshots.sql` and then fails at `202605180005_reeditpro_generation_assets_jobs.sql` because `public.generation_requests.approved_plan_snapshot_id` is missing before `idx_generation_requests_project_snapshot` is created.
- Acceptance criteria: credit/approval migration-chain blocker is repaired, local start is attempted only after safety gates pass, new migration failure stops SQL execution, no remote/staging/production target is touched, and next prompt recommendation is clear.
- Next prompt recommendation: Prompt 20L - Local Supabase Migration Chain Repair Follow-Up 5 for `202605180005_reeditpro_generation_assets_jobs.sql`.
- GitHub deliverable: branch, commit, push, PR with validation evidence and explicit no-staging/no-remote/no-production-Supabase statement.

## 20L. Local Supabase Migration Chain Repair Follow-Up 5

- Purpose: repair the Prompt 20K local migration-chain blocker in `202605180005_reeditpro_generation_assets_jobs.sql` and retry local start without running SQL/RLS tests.
- Deliverables after Prompt 20L: `docs/prompt-20l-local-supabase-migration-chain-repair-follow-up-5.md`, `docs/implementation-prompts/prompt-20l-local-supabase-migration-chain-repair-follow-up-5.md`, additive compatibility updates to `supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql`, local evidence updates, manifest updates, scorecard/blocker updates, workflow trigger coverage for the Prompt 20K base branch, and tracker updates.
- Implementation status after Prompt 20L: validation blocked / local migration-chain repair only. No SQL/RLS smoke test, staging, remote, production, provider, worker, tool, render, media, storage, credit, Stripe, telemetry, or beta unlock is enabled.
- Implements: missing `generation_requests.approved_plan_snapshot_id`, guarded `generation_requests_approved_plan_snapshot_id_fkey`, guarded `idx_generation_requests_project_snapshot`, missing `generated_asset_versions.version`, guarded backfill from `version_number`, and guarded `idx_generated_asset_versions_asset_version`, allowing local `supabase start` to pass `202605180005_reeditpro_generation_assets_jobs.sql`.
- Must not implement: staging/remote/production Supabase execution, remote SQL, SQL/RLS smoke tests, production migration deployment, provider calls, rendering/export, tool execution, worker execution, production job claims, media processing, storage transfer, signed URL creation, credit mutation, Stripe/payment processing, external telemetry, dependency mutation, or production/beta unlock.
- What remains blocked: local SQL/RLS execution, localhost-only DB URL capture, staging Supabase/RLS execution, remote production Supabase, and beta approval.
- Validation result: local tools pass (`supabase` 2.104.0, Docker 29.5.2, `psql` 18.4), preflight reports `remoteRiskDetected=false` and `canStartLocalSupabase=true`, `supabase start` passes `202605180005_reeditpro_generation_assets_jobs.sql` and then fails at `202605180006_reeditpro_qa_exports_audit.sql` because `qa_check_results.check text` is invalid SQL syntax.
- Acceptance criteria: generation/assets/jobs migration-chain blocker is repaired, local start is attempted only after safety gates pass, new migration failure stops SQL execution, no remote/staging/production target is touched, and next prompt recommendation is clear.
- Next prompt recommendation: Prompt 20M - Local Supabase Migration Chain Repair Follow-Up 6 for `202605180006_reeditpro_qa_exports_audit.sql`.
- GitHub deliverable: branch, commit, push, PR with validation evidence and explicit no-staging/no-remote/no-production-Supabase statement.

## 20M. Local Supabase Migration Chain Repair Follow-Up 6

- Purpose: repair the Prompt 20L local migration-chain blocker in `202605180006_reeditpro_qa_exports_audit.sql` and retry local start without running SQL/RLS tests.
- Deliverables after Prompt 20M: `docs/prompt-20m-local-supabase-migration-chain-repair-follow-up-6.md`, `docs/implementation-prompts/prompt-20m-local-supabase-migration-chain-repair-follow-up-6.md`, additive compatibility updates to `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql`, local evidence updates, manifest updates, scorecard/blocker updates, workflow trigger coverage for the Prompt 20L base branch, and tracker updates.
- Implementation status after Prompt 20M: validation blocked / local migration-chain repair only. No SQL/RLS smoke test, staging, remote, production, provider, worker, tool, render, media, storage, credit, Stripe, telemetry, or beta unlock is enabled.
- Implements: `qa_check_results.check_type` instead of invalid `check`, missing `qa_reports.approved_plan_snapshot_id`, guarded `qa_reports_approved_plan_snapshot_id_fkey`, and guarded `idx_qa_reports_project_snapshot`, allowing local `supabase start` to pass `202605180006_reeditpro_qa_exports_audit.sql`.
- Must not implement: staging/remote/production Supabase execution, remote SQL, SQL/RLS smoke tests, production migration deployment, provider calls, rendering/export, tool execution, worker execution, production job claims, media processing, storage transfer, signed URL creation, credit mutation, Stripe/payment processing, external telemetry, dependency mutation, or production/beta unlock.
- What remains blocked: local SQL/RLS execution, localhost-only DB URL capture, staging Supabase/RLS execution, remote production Supabase, and beta approval.
- Validation result: local tools pass (`supabase` 2.104.0, Docker 29.5.2, `psql` 18.4), preflight reports `remoteRiskDetected=false` and `canStartLocalSupabase=true`, `supabase start` passes `202605180006_reeditpro_qa_exports_audit.sql` and then fails at `202605180007_reeditpro_rls_policies.sql` because `public.is_workspace_member(workspace_uuid uuid)` attempts to rename an existing input parameter from `target_workspace_id`.
- Acceptance criteria: QA/export/audit migration-chain blocker is repaired, local start is attempted only after safety gates pass, new migration failure stops SQL execution, no remote/staging/production target is touched, and next prompt recommendation is clear.
- Next prompt recommendation: Prompt 20N - Local Supabase Migration Chain Repair Follow-Up 7 for `202605180007_reeditpro_rls_policies.sql`.
- GitHub deliverable: branch, commit, push, PR with validation evidence and explicit no-staging/no-remote/no-production-Supabase statement.

## 20N. Local Supabase Migration Chain Repair Follow-Up 7

- Purpose: repair the Prompt 20M local migration-chain blocker in `202605180007_reeditpro_rls_policies.sql` and retry local start without running SQL/RLS tests.
- Deliverables after Prompt 20N: `docs/prompt-20n-local-supabase-migration-chain-repair-follow-up-7.md`, `docs/implementation-prompts/prompt-20n-local-supabase-migration-chain-repair-follow-up-7.md`, parameter-name compatibility updates to `supabase/migrations/202605180007_reeditpro_rls_policies.sql`, local evidence updates, manifest updates, scorecard/blocker updates, workflow trigger coverage for the Prompt 20M base branch, and tracker updates.
- Implementation status after Prompt 20N: validation blocked / local migration-chain repair only. No SQL/RLS smoke test, staging, remote, production, provider, worker, tool, render, media, storage, credit, Stripe, telemetry, or beta unlock is enabled.
- Implements: preserved `target_workspace_id` parameter names for `is_workspace_member(uuid)` and `is_workspace_owner_or_admin(uuid)`, avoiding PostgreSQL function input parameter rename conflicts.
- Must not implement: staging/remote/production Supabase execution, remote SQL, SQL/RLS smoke tests, production migration deployment, provider calls, rendering/export, tool execution, worker execution, production job claims, media processing, storage transfer, signed URL creation, credit mutation, Stripe/payment processing, external telemetry, dependency mutation, or production/beta unlock.
- What remains blocked: local SQL/RLS execution, localhost-only DB URL capture, staging Supabase/RLS execution, remote production Supabase, and beta approval.
- Validation result: local tools pass (`supabase` 2.104.0, Docker 29.5.2, `psql` 18.4), preflight reports `remoteRiskDetected=false` and `canStartLocalSupabase=true`, but `supabase start` fails before migration application because localhost port `54322` is already bound by `rapportd`.
- Acceptance criteria: RLS helper parameter-name blocker is repaired statically, local start is attempted only after safety gates pass, port conflict stops validation before migrations, no SQL execution occurs, no remote/staging/production target is touched, and next prompt recommendation is clear.
- Next prompt recommendation: Prompt 20O - Local Supabase Start Port Conflict And Migration Chain Retry, then Prompt 20B if local migration-chain validation passes.
- GitHub deliverable: branch, commit, push, PR with validation evidence and explicit no-staging/no-remote/no-production-Supabase statement.

## 20O. Local Supabase Start Port Conflict Retry

- Purpose: route around the Prompt 20N local DB/Studio port conflict and retry local `supabase start` without running SQL/RLS tests.
- Deliverables after Prompt 20O: `docs/prompt-20o-local-supabase-start-port-conflict-retry.md`, `docs/implementation-prompts/prompt-20o-local-supabase-start-port-conflict-retry.md`, local-only port updates in `supabase/config.toml`, local evidence updates, manifest updates, scorecard/blocker updates, workflow trigger coverage for the Prompt 20N base branch, and tracker updates.
- Implementation status after Prompt 20O: validation blocked / local Supabase start retry only. No SQL/RLS smoke test, staging, remote, production, provider, worker, tool, render, media, storage transfer, credit, Stripe, telemetry, or beta unlock is enabled.
- Implements: local `[db].port` changes from `54322` to `54330` and local `[studio].port` changes from `54323` to `54331`, avoiding `rapportd` without killing a non-Supabase process.
- Must not implement: staging/remote/production Supabase execution, remote SQL, SQL/RLS smoke tests, production migration deployment, provider calls, rendering/export, tool execution, worker execution, production job claims, media processing, storage transfer, signed URL creation, credit mutation, Stripe/payment processing, external telemetry, dependency mutation, non-Supabase process termination, or production/beta unlock.
- What remains blocked: local SQL/RLS execution, localhost-only DB URL capture, staging Supabase/RLS execution, remote production Supabase, and beta approval.
- Validation result: local tools pass (`supabase` 2.104.0, Docker 29.5.2, `psql` 18.4), preflight reports `remoteRiskDetected=false` and `canStartLocalSupabase=true`, `supabase start` now passes `202605180007_reeditpro_rls_policies.sql` and then fails at `202605180008_reeditpro_storage_buckets_policies.sql` with `SQLSTATE 42501` because the migration attempts to comment on `storage.buckets` without table ownership.
- Acceptance criteria: local port conflict is resolved, local start is attempted only after safety gates pass, the new migration failure stops SQL execution, no remote/staging/production target is touched, and next prompt recommendation is clear.
- Next prompt recommendation: Prompt 20P - Local Supabase Migration Chain Repair Follow-Up 8 for `202605180008_reeditpro_storage_buckets_policies.sql`.
- GitHub deliverable: branch, commit, push, PR with validation evidence and explicit no-staging/no-remote/no-production-Supabase statement.

## 20P. Local Supabase Migration Chain Repair Follow-Up 8

- Purpose: repair the Prompt 20O local storage migration-chain ownership blocker in `202605180008_reeditpro_storage_buckets_policies.sql` and retry local start without running SQL/RLS tests.
- Deliverables after Prompt 20P: `docs/prompt-20p-local-supabase-migration-chain-repair-follow-up-8.md`, `docs/implementation-prompts/prompt-20p-local-supabase-migration-chain-repair-follow-up-8.md`, storage comment updates to `supabase/migrations/202605180008_reeditpro_storage_buckets_policies.sql`, local evidence updates, manifest updates, scorecard/blocker updates, workflow trigger coverage for the Prompt 20O base branch, and tracker updates.
- Implementation status after Prompt 20P: validation blocked / local-only storage migration-chain repair. No SQL/RLS smoke test, staging, remote, production, provider, worker, tool, render, media, storage transfer, credit, Stripe, telemetry, deployment, or beta unlock is enabled.
- Implements: removal of documentation-only `COMMENT ON TABLE storage.buckets` and `COMMENT ON POLICY ... ON storage.objects` statements, preserving the same private bucket and project-path policy wording as plain SQL comments.
- Must not implement: staging/remote/production Supabase execution, remote SQL, SQL/RLS smoke tests, production migration deployment, provider calls, rendering/export, tool execution, worker execution, production job claims, media processing, storage transfer, signed URL creation, credit mutation, Stripe/payment processing, external telemetry, dependency mutation, non-Supabase process termination, or production/beta unlock.
- What remains blocked: local SQL/RLS execution, localhost-only DB URL capture, staging Supabase/RLS execution, remote production Supabase, and beta approval.
- Validation result: local tools pass (`supabase` 2.104.0, Docker 29.5.2, `psql` 18.4), preflight reports `remoteRiskDetected=false` and `canStartLocalSupabase=true`, `supabase start` now passes `202605180008_reeditpro_storage_buckets_policies.sql` and then fails at `202605200001_storage_upload_pipeline_readiness.sql` with `SQLSTATE 42501` on `COMMENT ON POLICY ... ON storage.objects`.
- Acceptance criteria: the `storage.buckets` ownership blocker is repaired, local start is attempted only after safety gates pass, the later storage ownership blocker stops SQL execution, no remote/staging/production target is touched, and next prompt recommendation is clear.
- Next prompt recommendation: Prompt 20P2 - Storage Ownership/Privilege Follow-Up for `202605200001_storage_upload_pipeline_readiness.sql`.
- GitHub deliverable: branch, commit, push, PR with validation evidence and explicit no-staging/no-remote/no-production-Supabase statement.

## 20P2. Storage Ownership/Privilege Follow-Up

- Purpose: repair the Prompt 20P later storage ownership blocker in `202605200001_storage_upload_pipeline_readiness.sql` and retry local start without running SQL/RLS tests.
- Deliverables after Prompt 20P2: `docs/prompt-20p2-storage-ownership-privilege-follow-up.md`, `docs/implementation-prompts/prompt-20p2-storage-ownership-privilege-follow-up.md`, storage comment updates to `supabase/migrations/202605200001_storage_upload_pipeline_readiness.sql`, local evidence updates, manifest updates, scorecard/blocker updates, workflow trigger coverage for the Prompt 20P base branch, and tracker updates.
- Implementation status after Prompt 20P2: validation prepared / local-only storage ownership/privilege repair. No SQL/RLS smoke test, staging, remote, production, provider, worker, tool, render, media, storage transfer, credit, Stripe, telemetry, deployment, or beta unlock is enabled.
- Implements: conversion of documentation-only `COMMENT ON POLICY ... ON storage.objects` statements into plain SQL comments while preserving project member read policy intent and project editor upload policy intent.
- Must not implement: staging/remote/production Supabase execution, remote SQL, SQL/RLS smoke tests, production migration deployment, provider calls, rendering/export, tool execution, worker execution, production job claims, media processing, storage transfer, signed URL creation, credit mutation, Stripe/payment processing, external telemetry, dependency mutation, non-Supabase process termination, or production/beta unlock.
- What remains blocked: local SQL/RLS execution, staging Supabase/RLS execution, remote production Supabase, runtime execution domains, deployment, billing, external telemetry, and beta approval.
- Validation result: local tools pass (`supabase` 2.104.0, Docker 29.5.2, `psql` 18.4), preflight reports `remoteRiskDetected=false` and `canStartLocalSupabase=true`, `supabase start` completes, and sanitized localhost DB evidence is host `127.0.0.1`, port `54330`, database `postgres`.
- Acceptance criteria: later storage policy comment ownership blocker is repaired, local `supabase start` passes, localhost DB evidence is captured without secrets, no SQL/RLS test runs, no remote/staging/production target is touched, and next prompt recommendation is clear.
- Next prompt recommendation: Prompt 20B-Retry - Local RLS First Executable Smoke Test Run.
- GitHub deliverable: branch, commit, push, PR with validation evidence and explicit no-staging/no-remote/no-production-Supabase statement.

## 20B-Retry. Local RLS First Executable Smoke Test Run

- Purpose: run the first guarded local-only auth/workspace/project RLS smoke test after the Prompt 20G through Prompt 20P2 local migration-chain repairs.
- Deliverables after Prompt 20B-Retry: fixture-only compatibility update to `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql`, `docs/prompt-20b-retry-local-rls-first-executable-smoke-test-run.md`, `docs/implementation-prompts/prompt-20b-retry-local-rls-first-executable-smoke-test-run.md`, local evidence updates, manifest updates, scorecard/blocker updates, workflow trigger coverage for the Prompt 20P2 base branch, and tracker updates.
- Implementation status after Prompt 20B-Retry: validated limited foundation / first local-only RLS smoke validation. No staging, remote, production, provider, worker, tool, render, media, storage transfer, credit, Stripe, telemetry, deployment, or beta unlock is enabled.
- Implements: local `supabase start`, sanitized localhost DB evidence capture, local DB URL export for the current shell only, preflight confirmation of `remoteRiskDetected=false` and `canRunLocalSql=true`, and exactly one guarded local SQL smoke test run through the RLS runner.
- Must not implement: staging/remote/production Supabase execution, remote SQL, production migration deployment, provider calls, rendering/export, tool execution, worker execution, production job claims, media processing, storage transfer, signed URL creation, credit mutation, Stripe/payment processing, external telemetry, dependency mutation, or production/beta unlock.
- What remains blocked: broader local RLS coverage, staging Supabase/RLS execution, remote production Supabase, runtime execution domains, deployment, billing, external telemetry, and beta approval.
- Validation result: local tools pass (`supabase` 2.104.0, Docker 29.5.2, `psql` 18.4), `supabase start` completes, sanitized localhost DB evidence is host `127.0.0.1`, port `54330`, database `postgres`, preflight reports `localDbUrlAvailable=true` and `canRunLocalSql=true`, and the guarded auth/workspace/project SQL smoke test passes after a fixture-only schema-compatibility update.
- Acceptance criteria: the first local-only SQL candidate runs through the guarded runner, evidence records the first schema mismatch and final pass honestly, no raw `psql` command is run manually, no remote/staging/production target is touched, and the next prompt recommendation is clear.
- Next prompt recommendation: Prompt 21 - Staging Supabase/RLS Validation Runbook and Approval Packet.
- GitHub deliverable: branch, commit, push, PR with validation evidence and explicit no-staging/no-remote/no-production-Supabase statement.

## 21. Staging Supabase/RLS Approval Packet

- Purpose: prepare the human approval packet before any staging Supabase/RLS validation may run.
- Deliverables after Prompt 21: `docs/staging-supabase-rls-approval-packet.md`, `docs/staging-supabase-rls-runbook.md`, `docs/staging-rls-test-selection-matrix.md`, `docs/staging-synthetic-fixture-plan.md`, `docs/staging-supabase-rollback-cleanup-plan.md`, `docs/staging-supabase-risk-register.md`, `docs/prompt-21-validation-results.md`, `docs/implementation-prompts/prompt-21-staging-supabase-rls-approval-packet.md`, `scripts/validation/staging-supabase-approval-packet-diagnostics.mjs`, package script wiring, foundation validation runner wiring, workflow trigger coverage for the Prompt 20B-Retry base branch, and tracker updates.
- Implementation status after Prompt 21: validation prepared / staging Supabase-RLS approval packet only. No staging, remote, production, local SQL, Supabase lifecycle command, migration deployment, provider, worker, tool, render, media, storage transfer, credit, Stripe, telemetry, or beta unlock is enabled.
- Implements: approval packet, staging runbook, test selection matrix, synthetic fixture plan, rollback/cleanup plan, risk register, static diagnostics, and scorecard/blocker tracking.
- Must not implement: staging/remote/production Supabase execution, local or remote SQL execution, production migration deployment, provider calls, rendering/export, tool execution, worker execution, production job claims, media processing, storage transfer, signed URL creation, credit mutation, Stripe/payment processing, external telemetry, dependency mutation, or production/beta unlock.
- What remains blocked: human staging approval, staging Supabase/RLS execution, broader local RLS coverage, remote production Supabase, runtime execution domains, deployment, billing, external telemetry, and beta approval.
- Validation result: pending local validation and GitHub Foundation Validation at initial document creation; results are recorded in `docs/prompt-21-validation-results.md`.
- Acceptance criteria: packet clearly distinguishes local evidence, missing staging evidence, and blocked production readiness; only the Prompt 20B-Retry local SQL file is marked local-passed; diagnostics pass; no SQL or Supabase execution occurs.
- Next prompt recommendation: Prompt 22 - Staging Supabase/RLS Human Approval Packet Review if validation and CI pass; otherwise Prompt 21A - Staging Approval Packet Hardening.
- GitHub deliverable: branch, commit, push, PR with approval packet summary and explicit no-staging/no-remote/no-production-Supabase statement.

## 22. Staging Supabase/RLS Human Approval Review

Prompt 22 - Staging Supabase/RLS Human Approval Review.

- Purpose: review the Prompt 21 staging Supabase/RLS approval packet for human decision readiness without granting approval.
- Deliverables after Prompt 22: `docs/staging-supabase-human-approval-review.md`, `docs/staging-supabase-human-approval-checklist.md`, `docs/staging-supabase-approval-decision-template.md`, `docs/staging-supabase-validation-evidence-template.md`, `docs/staging-supabase-go-no-go-rubric.md`, `docs/prompt-22-validation-results.md`, `docs/implementation-prompts/prompt-22-staging-supabase-rls-human-approval-review.md`, `scripts/validation/staging-supabase-human-approval-review-diagnostics.mjs`, package script wiring, foundation validation runner wiring, workflow trigger coverage for the Prompt 21 base branch, and tracker updates.
- Implementation status after Prompt 22: validation prepared / human approval review packet only. The packet state is `ready_for_human_review`, not approved.
- Implements: human review overview, checklist, future decision template, future evidence template, go/no-go rubric, diagnostics, and explicit separation between Prompt 20B-Retry local evidence, Prompt 21 approval preparation, missing staging evidence, and blocked production readiness.
- Must not implement: human approval grant, staging execution, remote Supabase execution, production Supabase execution, local SQL execution, staging SQL execution, migrations, deployment, providers, workers, tools, render/export, media processing, storage transfer, credit mutation, Stripe, external telemetry, beta unlock, or production readiness.
- What remains blocked: actual human approval, staging Supabase/RLS execution, staging migration validation, production Supabase, broader local domain SQL, runtime execution domains, and beta unlock.
- Acceptance criteria: Prompt 22 docs exist, diagnostics pass, the result is `ready_for_human_review`, no approval is granted, no staging execution is claimed, no secrets or executable staging commands are added, and production readiness remains blocked.
- Next prompt recommendation: Prompt 23 - Staging Supabase/RLS Human Approval Decision Record if validation and CI pass; otherwise Prompt 22A - Staging Approval Packet Hardening.
- GitHub deliverable: branch, commit, push, PR with human review packet summary and explicit no-staging/no-remote/no-production-Supabase statement.

## 23. Staging Supabase/RLS Human Approval Decision Record

Prompt 23 - Staging Supabase/RLS Human Approval Decision Record.

- Purpose: record the current human approval decision state after Prompt 22 without granting approval.
- Deliverables after Prompt 23: `docs/staging-supabase-human-approval-decision-record.md`, `docs/staging-supabase-human-decision-evidence-checklist.md`, `docs/staging-supabase-human-decision-state.md`, `docs/prompt-23-validation-results.md`, `docs/implementation-prompts/prompt-23-staging-supabase-rls-human-approval-decision-record.md`, `scripts/validation/staging-supabase-human-decision-record-diagnostics.mjs`, package script wiring, foundation validation runner wiring, workflow trigger coverage for the Prompt 22 base branch, and tracker updates.
- Implementation status after Prompt 23: validation blocked / pending human approval decision record only. The decision state is `pending_human_approval` because no human approval details were supplied.
- Implements: machine-readable decision state, human decision evidence checklist, diagnostics, and explicit blocker tracking for missing human approval.
- Must not implement: human approval grant, staging execution, remote Supabase execution, production Supabase execution, local SQL execution, staging SQL execution, migrations, deployment, providers, workers, tools, render/export, media processing, storage transfer, credit mutation, Stripe, external telemetry, beta unlock, or production readiness.
- What remains blocked: actual human approval, staging Supabase/RLS execution, staging migration validation, production Supabase, broader local domain SQL, runtime execution domains, and beta unlock.
- Acceptance criteria: Prompt 23 docs exist, diagnostics pass, the decision state is `pending_human_approval`, all approval booleans remain false, no staging execution is claimed, no secrets or executable staging commands are added, and production readiness remains blocked.
- Next prompt recommendation: Prompt 23A - Human Approval Decision Completion. Prompt 24 may only proceed after an actual human approval decision is supplied and recorded by a human owner.
- GitHub deliverable: branch, commit, push, PR with pending decision summary and explicit no-staging/no-remote/no-production-Supabase statement.

## 23S. Supabase Milestone Sync Policy

Prompt 23S - Supabase Milestone Sync Policy.

- Purpose: define how repository milestones, local evidence, approval packet readiness, pending human approval, staging sync, and production sync are reported separately.
- Deliverables after Prompt 23S: `docs/supabase-milestone-sync-policy.md`, `docs/supabase-milestone-ledger-contract.md`, `docs/supabase-milestone-sync-matrix.md`, `docs/supabase-update-gate-contract.md`, `docs/supabase-success-milestone-reporting-standard.md`, `docs/supabase-milestone-backfill-plan.md`, `docs/supabase-status-record-schema-draft.md`, `docs/prompt-23s-validation-results.md`, `docs/implementation-prompts/prompt-23s-supabase-milestone-sync-policy.md`, `scripts/validation/supabase-milestone-sync-diagnostics.mjs`, package script wiring, foundation validation runner wiring, workflow coverage for the Prompt 23 pending base, and tracker updates.
- Implementation status after Prompt 23S: validation infrastructure / Supabase milestone sync policy only. Prompt 23 remains `pending_human_approval`; staging sync is not applied and production sync is blocked.
- Implements: update type vocabulary, future append-only ledger contract, Prompt 0-23 sync matrix, update gates, success reporting standard, future backfill plan, draft status-record schema, and diagnostics.
- Must not implement: Supabase lifecycle commands, SQL execution, migrations, staging sync, production sync, ledger table creation, backfill execution, deployment, providers, workers, tools, render/export, media processing, storage transfer, credit mutation, Stripe, telemetry, human approval grant, beta unlock, or production readiness.
- What remains blocked: human approval completion, staging Supabase/RLS execution, production Supabase, future ledger schema/RLS, append-only write path, broader local/staging RLS coverage, runtime execution domains, and beta unlock.
- Acceptance criteria: Prompt 23S docs exist, diagnostics pass, Prompt 23 is classified as `pending_human_approval`, no staging/prod update is claimed, no secrets or executable Supabase commands are added, and production readiness remains blocked.
- Next prompt recommendation: Prompt 24 - Supabase Project Inventory and Read-Only Audit if validation and CI pass; Prompt 23A remains required before any staging SQL or staging mutation.
- GitHub deliverable: branch, commit, push, PR with sync policy summary and explicit no-Supabase-execution statement.

## 24. Supabase Project Read-Only Audit

Prompt 24 - Supabase Project Read-Only Audit.

- Purpose: prepare a read-only Supabase project inventory and evidence intake package before any staging update, staging RLS validation, production candidate, or beta readiness claim.
- Deliverables after Prompt 24: `docs/supabase-project-read-only-audit.md`, `docs/supabase-project-inventory-checklist.md`, `docs/supabase-redacted-evidence-template.md`, `docs/supabase-project-activity-gap-analysis.md`, `docs/supabase-read-only-audit-runbook.md`, `docs/supabase-read-only-audit-result-template.md`, `docs/supabase-project-drift-risk-register.md`, `docs/prompt-24-validation-results.md`, `docs/implementation-prompts/prompt-24-supabase-project-read-only-audit.md`, `scripts/validation/supabase-project-readonly-audit-diagnostics.mjs`, package script wiring, foundation validation runner wiring, workflow coverage for the Prompt 23S base branch, and tracker updates.
- Implementation status after Prompt 24: validation prepared / Supabase project read-only audit packet only. Default audit state is `evidence_required`.
- Implements: project inventory checklist, redacted evidence template, dashboard activity gap explanation, read-only audit runbook, result template, drift risk register, static diagnostics, and explicit separation between repo/local evidence and missing staging/production evidence.
- Must not implement: Supabase lifecycle commands, SQL execution, migrations, `psql`, `supabase link`, `supabase db push`, dashboard mutation, staging/remote/production Supabase execution, deployment, providers, workers, tools, render/export, media processing, storage transfer, credit mutation, Stripe, telemetry, dependency mutation, human approval grant, staging execution approval, beta unlock, or production readiness.
- What remains blocked: redacted staging/production Supabase evidence, human approval completion, staging Supabase/RLS execution, production Supabase, future ledger schema/RLS, broader local/staging RLS coverage, runtime execution domains, and beta unlock.
- Acceptance criteria: Prompt 24 docs exist, diagnostics pass, audit status remains `evidence_required`, no completed remote/staging/production audit is claimed, no secrets or executable Supabase commands are added, and production readiness remains blocked.
- Next prompt recommendation after Prompt 24A: Prompt 24B - Supabase Redacted Evidence Review if evidence is supplied and validation/CI pass; Prompt 23A remains required before staging SQL or staging mutation.
- GitHub deliverable: branch, commit, push, PR with read-only audit package summary and explicit no-Supabase-execution statement.

## 24A. Supabase Project Read-Only Audit Evidence Intake

Prompt 24A - Supabase Project Read-Only Audit Evidence Intake.

- Purpose: define the tracked evidence paths, redaction rules, checklist, evidence matrix, and evidence request flow for the Prompt 24 read-only Supabase audit package.
- Deliverables after Prompt 24A: `docs/supabase-readonly-audit-evidence-intake.md`, `docs/supabase-readonly-audit-evidence-checklist.md`, `docs/supabase-readonly-audit-redaction-rules.md`, `docs/supabase-readonly-audit-evidence-matrix.md`, `docs/supabase-readonly-audit-evidence-request.md`, `docs/supabase-readonly-audit-evidence/README.md`, `docs/prompt-24a-validation-results.md`, `docs/implementation-prompts/prompt-24a-supabase-project-readonly-audit-evidence-intake.md`, `scripts/validation/supabase-project-readonly-evidence-intake-diagnostics.mjs`, package script wiring, foundation validation runner wiring, workflow coverage for the Prompt 24 base branch, and tracker updates.
- Implementation status after Prompt 24A: evidence required / Supabase read-only audit evidence intake only. No tracked redacted evidence files are present, so redaction status is `not_applicable_no_evidence`.
- Implements: evidence path allowlist, instruction-file versus evidence-file distinction, required evidence categories, redaction blockers, evidence request material, default missing evidence matrix, and static diagnostics.
- Must not implement: Supabase lifecycle commands, SQL execution, migrations, `psql`, `supabase link`, `supabase db push`, dashboard mutation, staging/remote/production Supabase execution, deployment, providers, workers, tools, render/export, media processing, storage transfer, credit mutation, Stripe, telemetry, dependency mutation, human approval grant, staging execution approval, beta unlock, or production readiness.
- What remains blocked: redacted staging/production Supabase evidence, human approval completion, staging Supabase/RLS execution, production Supabase, broader local/staging RLS coverage, runtime execution domains, and beta unlock.
- Acceptance criteria: Prompt 24A docs exist, diagnostics pass, evidence status remains `evidence_required` when no evidence files exist, redaction status is `not_applicable_no_evidence`, no completed audit is claimed, no secrets or executable Supabase commands are added, and production readiness remains blocked.
- Next prompt recommendation: Prompt 24B - Supabase Redacted Evidence Review if validation and CI pass and redacted evidence is supplied; Prompt 23A remains required before staging SQL or staging mutation.
- GitHub deliverable: branch, commit, push, PR with evidence intake summary and explicit no-Supabase-execution statement.

## 24B. Supabase Redacted Evidence Review

Prompt 24B - Supabase Redacted Evidence Review.

- Purpose: review only tracked redacted Supabase evidence files in approved evidence paths, without touching Google Cloud, Secret Manager, Supabase, SQL, migrations, deployment, or runtime systems.
- Deliverables after Prompt 24B: `docs/supabase-redacted-evidence-review.md`, updated `docs/supabase-readonly-audit-evidence-matrix.md`, updated `docs/supabase-read-only-audit-result-template.md`, `docs/prompt-24b-validation-results.md`, `docs/implementation-prompts/prompt-24b-supabase-redacted-evidence-review.md`, `scripts/validation/supabase-redacted-evidence-review-diagnostics.mjs`, package script wiring, foundation validation runner wiring, workflow coverage for the Prompt 25A base branch, and tracker updates.
- Implementation status after Prompt 24B: evidence required / Supabase redacted evidence review only. The only tracked approved-path file is `docs/supabase-readonly-audit-evidence/README.md`, which is instruction-only and not counted as evidence.
- Implements: evidence path review, instruction-file versus evidence-file distinction, evidence category classification, unsafe evidence detection without printing values, default missing evidence matrix, and static diagnostics.
- Must not implement: Google Cloud API calls, Secret Manager API calls, Secret Manager metadata fetches, Secret Manager value fetches, Supabase lifecycle commands, SQL execution, migrations, `psql`, `supabase link`, `supabase db push`, dashboard mutation, staging/remote/production Supabase execution, deployment, providers, workers, tools, render/export, media processing, storage transfer, credit mutation, Stripe, telemetry, dependency mutation, human approval grant, staging execution approval, beta unlock, or production readiness.
- What remains blocked: all redacted Supabase evidence categories, Secret Manager reference metadata evidence, human approval completion, staging project identity verification, staging SQL execution, production Supabase, broader local/staging RLS coverage, runtime execution domains, and beta unlock.
- Acceptance criteria: Prompt 24B docs exist, diagnostics pass, evidence status remains `evidence_required` when no counted evidence files exist, redaction status is `not_applicable_no_evidence`, no completed audit is claimed, no secrets or executable Supabase commands are added, and production readiness remains blocked.
- Next prompt recommendation: Prompt 24C - Supabase Evidence Collection Follow-Up; Prompt 23A remains required before staging SQL or staging mutation.
- GitHub deliverable: branch, commit, push, PR with redacted evidence review summary and explicit no-Google-Cloud-or-Supabase-execution statement.

## 24C. Supabase Evidence Collection Follow-Up

Prompt 24C - Supabase Evidence Collection Follow-Up.

- Purpose: make the missing Supabase evidence request operator-actionable with exact redacted evidence filenames, templates, metadata-only Secret Manager guidance, and screenshot redaction guidance, without collecting evidence or touching any environment.
- Deliverables after Prompt 24C: `docs/supabase-evidence-collection-follow-up.md`, `docs/supabase-evidence-file-template-index.md`, `docs/gcp-secret-manager-reference-metadata-evidence-guide.md`, `docs/supabase-dashboard-screenshot-redaction-guide.md`, ten instruction-only templates under `docs/supabase-readonly-audit-evidence/templates/`, `docs/prompt-24c-validation-results.md`, `docs/implementation-prompts/prompt-24c-supabase-evidence-collection-follow-up.md`, `scripts/validation/supabase-evidence-collection-follow-up-diagnostics.mjs`, package script wiring, foundation validation runner wiring, and tracker updates.
- Implementation status after Prompt 24C: evidence required / Supabase evidence collection follow-up only. Templates are instructions and are not counted as supplied evidence.
- Implements: concrete evidence file names, safe fields, forbidden-field guidance, Secret Manager metadata-only evidence rules, screenshot redaction rules, missing evidence matrix updates, and static diagnostics.
- Must not implement: Google Cloud API calls, Secret Manager API calls, Secret Manager metadata fetches, Secret Manager value fetches, Supabase lifecycle commands, SQL execution, migrations, `psql`, `supabase link`, `supabase db push`, dashboard mutation, staging/remote/production Supabase execution, deployment, providers, workers, tools, render/export, media processing, storage transfer, credit mutation, Stripe, telemetry, dependency mutation, human approval grant, staging execution approval, beta unlock, or production readiness.
- What remains blocked: all redacted Supabase evidence categories, Secret Manager reference metadata evidence, human approval completion, staging project identity verification, staging SQL execution, production Supabase, broader local/staging RLS coverage, runtime execution domains, and beta unlock.
- Acceptance criteria: Prompt 24C docs/templates exist, diagnostics pass, evidence status remains `evidence_required` when no counted evidence files exist, redaction status is `not_applicable_no_evidence`, no completed audit is claimed, no secrets or executable Supabase commands are added, and production readiness remains blocked.
- Next prompt recommendation: Prompt 24D - Supabase Evidence Review With Supplied Files; Prompt 23A remains required before staging SQL or staging mutation.
- GitHub deliverable: branch, commit, push, PR with evidence collection summary and explicit no-Google-Cloud-or-Supabase-execution statement.

## 25. Staging Supabase/RLS Dry-Run Command Packet

Prompt 25 - Staging Supabase/RLS Dry-Run Command Packet.

- Purpose: prepare a future-only staging Supabase/RLS dry-run command packet after Prompt 24A evidence intake, without approving or running staging commands.
- Deliverables after Prompt 25: `docs/staging-supabase-rls-dry-run-command-packet.md`, `docs/staging-supabase-command-safety-checklist.md`, `docs/staging-supabase-command-evidence-template.md`, `docs/staging-supabase-test-command-matrix.md`, `docs/staging-supabase-dry-run-go-no-go-checklist.md`, `docs/staging-supabase-future-command-templates.md`, `docs/prompt-25-validation-results.md`, `docs/implementation-prompts/prompt-25-staging-supabase-rls-dry-run-command-packet.md`, `scripts/validation/staging-supabase-dry-run-command-packet-diagnostics.mjs`, package script wiring, foundation validation runner wiring, workflow coverage for the Prompt 24A base branch, and tracker updates.
- Implementation status after Prompt 25: validation prepared / staging Supabase/RLS dry-run command packet only. Current packet state is `blocked_missing_evidence` and `blocked_missing_approval`.
- Implements: future command templates with required approval warning, safety checklist, evidence template, test command matrix for the local-passed SQL candidate and draft SQL files `006` through `020`, go/no-go checklist, and diagnostics.
- Must not implement: Supabase lifecycle commands, SQL execution, migrations, `psql`, `supabase link`, `supabase db push`, dashboard mutation, staging/remote/production Supabase execution, deployment, providers, workers, tools, render/export, media processing, storage transfer, credit mutation, Stripe, telemetry, dependency mutation, human approval grant, staging execution approval, beta unlock, or production readiness.
- What remains blocked: human approval completion, redacted staging/production Supabase evidence, staging project identity verification, staging SQL execution, production Supabase, broader local/staging RLS coverage, runtime execution domains, and beta unlock.
- Validation result: pending local validation and GitHub Foundation Validation at initial document creation; results are recorded in `docs/prompt-25-validation-results.md`.
- Acceptance criteria: Prompt 25 docs exist, every command-template block contains `DO NOT RUN UNTIL HUMAN APPROVAL RECORD EXISTS.`, diagnostics pass, no real project refs/secrets/connection strings are introduced, no staging/prod update is claimed, and production readiness remains blocked.
- Next prompt recommendation: Prompt 23A - Human Approval Decision Completion and Prompt 24B - Supabase Redacted Evidence Review before Prompt 26 - Approved Staging Supabase/RLS Validation Execution.
- GitHub deliverable: branch, commit, push, PR with dry-run packet summary and explicit no-Supabase-execution statement.

## 25A. GCP Secret Manager Supabase Reference Contract

Prompt 25A - GCP Secret Manager Supabase Reference Contract.

- Purpose: define how future staging and production Supabase values are referenced through GCP Secret Manager without fetching, printing, storing, or validating secret values.
- Deliverables after Prompt 25A: `docs/gcp-secret-manager-supabase-reference-contract.md`, `docs/gcp-secret-manager-supabase-secret-matrix.md`, `docs/gcp-secret-manager-supabase-access-policy.md`, `docs/gcp-secret-manager-supabase-command-placeholder-policy.md`, `docs/prompt-25a-validation-results.md`, `docs/implementation-prompts/prompt-25a-gcp-secret-manager-supabase-reference-contract.md`, `scripts/validation/gcp-secret-manager-supabase-reference-diagnostics.mjs`, package script wiring, foundation validation runner wiring, workflow coverage for the Prompt 25 base branch, and tracker updates.
- Implementation status after Prompt 25A: validation prepared / GCP Secret Manager Supabase reference contract only. Secret references are `reference_required` and `access_not_verified`.
- Implements: Supabase reference naming, staging/production separation, future access/rotation/revocation policy, command placeholder rules, and static diagnostics.
- Must not implement: Google Cloud API calls, Secret Manager API calls, Secret Manager value fetches, Supabase lifecycle commands, SQL execution, migrations, `psql`, `supabase link`, `supabase db push`, dashboard mutation, staging/remote/production Supabase execution, deployment, providers, workers, tools, render/export, media processing, storage transfer, credit mutation, Stripe, telemetry, dependency mutation, human approval grant, staging execution approval, beta unlock, or production readiness.
- What remains blocked: human approval completion, accepted redacted Supabase evidence, verified Secret Manager references, staging project identity verification, staging SQL execution, production Supabase, broader local/staging RLS coverage, runtime execution domains, and beta unlock.
- Acceptance criteria: Prompt 25A docs exist, diagnostics pass, no raw Supabase values or Secret Manager payloads are introduced, Prompt 25 future command packet docs use Secret Manager reference placeholders, and production readiness remains blocked.
- Next prompt recommendation: Prompt 23A - Human Approval Decision Completion and Prompt 24B - Supabase Redacted Evidence Review before Prompt 26 - Approved Staging Supabase/RLS Validation Execution.
- GitHub deliverable: branch, commit, push, PR with reference contract summary and explicit no-GCP-or-Supabase-execution statement.

## 26A. Connected Supabase Read-Only Audit and Advisor Triage

Prompt 26A - Connected Supabase Read-Only Audit and Advisor Triage.

- Purpose: record supplied connected read-only Supabase project metadata and advisor findings, then triage the next hardening work without fetching, mutating, or executing anything.
- Deliverables after Prompt 26A: `docs/connected-supabase-readonly-audit-record.md`, `docs/connected-supabase-advisor-triage.md`, `docs/connected-supabase-rls-no-policy-inventory.md`, `docs/connected-supabase-security-definer-triage.md`, `docs/connected-supabase-function-search-path-triage.md`, `docs/connected-supabase-performance-advisor-triage.md`, `docs/prompt-26a-validation-results.md`, `docs/implementation-prompts/prompt-26a-connected-supabase-readonly-audit-triage.md`, `scripts/validation/connected-supabase-readonly-audit-diagnostics.mjs`, package script wiring, foundation validation runner wiring, workflow coverage for the Prompt 24C base branch, and tracker updates.
- Implementation status after Prompt 26A: validation prepared / connected Supabase read-only audit triage only. Connected Supabase audit status is `partially_reviewed_connected_metadata`.
- Validation status after Prompt 26A: local validation should run `git diff --check`, lint, server typecheck, foundation validation, connected-audit diagnostics, existing Supabase/GCP/staging diagnostics, local toolchain probe/preflight, and RLS list/dry-run only. Full build may remain local Darwin/Rolldown environment-blocked and rely on Linux CI.
- Implements: documentation of the supplied active project metadata for redacted ref `wmyy****ishd`, inactive/default project note, no Edge Functions deployed, generated schema/types summary, log summary, RLS no-policy inventory, SECURITY DEFINER triage, mutable `search_path` triage, and unindexed foreign-key advisor triage.
- Must not implement: Supabase lifecycle/status commands, SQL execution, migrations, advisor remediation, policy/index/function changes, Google Cloud or Secret Manager calls, secret fetching, provider/tool/worker/render/storage/credit/Stripe/telemetry execution, human approval grant, staging approval, production approval, deployment, or beta unlock.
- Main files/concepts: connected read-only project metadata, advisor findings, RLS no-policy tables, SECURITY DEFINER functions, mutable search path functions, unindexed foreign-key findings, and source-of-truth trackers.
- What remains blocked: advisor findings are unresolved; redacted evidence files are still incomplete; Secret Manager metadata evidence remains incomplete; Prompt 23 remains `pending_human_approval`; staging SQL, production readiness, and beta remain blocked.
- Acceptance criteria: Prompt 26A docs exist, diagnostics pass, only redacted project ref `wmyy****ishd` is recorded, connected metadata is not treated as staging validation, advisor findings are triaged but not remediated, and no Supabase/Google Cloud/Secret Manager/SQL/runtime execution capability is enabled.
- Next prompt recommendation: Prompt 26B - Supabase Advisor Hardening Plan. Prompt 23A and Prompt 24D remain required before staging execution.
- GitHub deliverable: branch, commit, push, PR with validation and explicit no-mutation/no-secret/no-execution statement.
