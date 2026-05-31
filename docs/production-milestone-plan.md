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
- Implements: local/staging migration run plan, RLS/storage policy test plan, schema health checks, advisor review checklist, backup/rollback plan, and migration readiness report.
- Must not implement: production migration execution, service-role API handlers, provider calls, rendering, Stripe, or worker dispatch.
- Main files/tables/services: `supabase/migration-order.md`, `database-migration-readiness-checklist.md`, `supabase/migrations/`, `database/test-sql/`, runtime tables from `docs/e2e-readiness/RP-E2E-READY-01-runtime-tables.md`.
- Acceptance criteria: migrations are validated locally/staging or explicitly blocked with logs, RLS/storage tests are documented, no credentials are committed.
- GitHub deliverable: branch, commit, push, PR with validation evidence and production-migration status.

## 3. Auth/Profile/Workspace/RLS Production Path

- Purpose: make user, profile, workspace, and membership bootstrap production safe.
- Implements: authenticated backend/service-role bootstrap path, RLS-safe profile/workspace creation, workspace membership checks, audit events, and frontend-safe fallback behavior.
- Must not implement: provider calls, rendering, Stripe, media processing, broad admin routes, or bypasses around RLS.
- Main files/tables/services: `users`, `workspaces`, `workspace_members`, auth bootstrap docs, backend auth middleware, service-role boundary docs.
- Acceptance criteria: normal users cannot directly perform privileged writes, bootstrap is idempotent, RLS tests pass, missing-env frontend remains safe.
- GitHub deliverable: branch, commit, push, PR with tests and clear capability enabled statement.

## 4. Storage/Upload Production Runtime

- Purpose: add private source media upload and storage record runtime without enabling editing execution.
- Implements: upload intents, signed upload/download route design or implementation, canonical storage object records, source order preservation, file validation, and private bucket/RLS verification.
- Must not implement: provider calls, media transforms, transcript analysis, rendering, export, public buckets, or persistent signed URLs.
- Main files/tables/services: `upload_intents`, `storage_object_records`, `signed_url_events`, `media_assets`, `source_clip_sequences`, private Supabase/GCS storage services.
- Acceptance criteria: uploads are private, canonical records store bucket/path only, signed URLs are temporary, source order is preserved, tests cover unauthorized access.
- GitHub deliverable: branch, commit, push, PR with storage validation and no provider/render/tool execution statement.

## 5. Approved Plan Snapshot Service

- Purpose: create the immutable execution contract future workers must use.
- Implements: backend-only snapshot creation, snapshot validation, versioning, immutability enforcement, idempotency, revision invalidation, and approval-state transitions.
- Must not implement: worker execution, provider calls, rendering, Stripe, or credit spending beyond approved mock/test gates unless Prompt 6 has landed.
- Main files/tables/services: `approved_plan_snapshots`, `api_idempotency_keys`, `credit_estimates`, `credit_approvals`, `edit_plans`, snapshot policy docs.
- Acceptance criteria: workers cannot use raw chat as execution input, approved snapshots are immutable except allowed audit/status fields, material changes require a new version.
- GitHub deliverable: branch, commit, push, PR with SQL/API/service tests and explicit production capability scope.

## 6. Credit Ledger And Approval Gate Production Runtime

- Purpose: make credit estimates, reservations, spends, releases, and refunds transactional.
- Implements: backend ledger mutations, reservation enforcement, refund/release logic, idempotent expensive-operation gates, weekly grant rules, and test coverage.
- Must not implement: Stripe checkout/webhooks unless separately scoped, provider calls, rendering, or worker dispatch beyond gated no-op/mock tests.
- Main files/tables/services: `credit_wallets`, `credit_ledger_entries`, `credit_estimates`, `credit_approvals`, `credit_reservations`, refund records, approval gate service.
- Acceptance criteria: no expensive job can start without approved estimate and reservation, duplicate requests are rejected/idempotent, failed work can release/refund correctly.
- GitHub deliverable: branch, commit, push, PR with transactional tests and no Stripe/provider/render execution unless explicitly scoped.

## 7. Backend API Runtime And Route Hardening

- Purpose: turn route contracts into a hardened backend runtime.
- Implements: authenticated API runtime, route middleware, service-role handler boundary, request validation, idempotency enforcement, rate-limit hooks, audit events, and disabled-route behavior.
- Must not implement: provider transport, render execution, Stripe, worker dispatch, migrations, or broad admin mutation without dedicated milestones.
- Main files/tables/services: Cloud Run API service or selected backend runtime, `docs/backend-api-route-map.md`, auth middleware, route registry, audit tables/events.
- Acceptance criteria: backend-required routes are either implemented with gates or blocked; frontend cannot access service-role secrets; tests cover unauthorized and duplicate requests.
- GitHub deliverable: branch, commit, push, PR with route matrix, tests, and deployment status.

## 8. Job Orchestration, Worker Claims, Leases, And Idempotency

- Purpose: make jobs claimable and recoverable without duplicate expensive work.
- Implements: job batch creation, dependency checks, worker claims, leases, heartbeats, stale recovery, idempotent dispatch, sanitized job events, and local/global failure status.
- Must not implement: real provider calls, real rendering, real media processing, Stripe, or Cloud deployment unless explicitly included as mock-safe/local-only.
- Main files/tables/services: `jobs`, `job_batches`, `job_dependencies`, `job_events`, `worker_job_claims`, `worker_leases`, `job_claim_attempts`, `api_idempotency_keys`.
- Acceptance criteria: one active worker claim per job, dependencies gate downstream work, local failure does not stop unrelated work, final export remains blocked on unresolved required failures.
- GitHub deliverable: branch, commit, push, PR with concurrency/idempotency tests and no-expensive-execution statement.

## 9. Media Readiness, Probe, Transcript, And Timing Foundation

- Purpose: prepare trusted source media facts for planning and execution.
- Implements: media probe records, duration/codec/resolution validation, transcript job scaffolding, timing base records, readiness gates, and safe failure states.
- Must not implement: generative providers, final render/export, uncontrolled tool execution, source overwrite, or unsupported codec production use.
- Main files/tables/services: `media_assets`, `storage_object_records`, transcript tables, timing tables, worker probe route, FFmpeg/FFprobe readiness.
- Acceptance criteria: media readiness is persisted, failed probes block affected downstream work, timing base is frame-aware, source media remains immutable.
- GitHub deliverable: branch, commit, push, PR with fixture tests or staged smoke evidence and legal/tool status.

## 10. Render/Preview/Export Foundation

- Purpose: create the controlled render path that can later assemble approved assets into previews and exports.
- Implements: render manifest contracts, preview/export job records, artifact records, render readiness checks, private preview/export storage handoff, and QA blockers.
- Must not implement: provider calls, unapproved media transforms, public exports, final render without required assets/QA, or bypasses around credit gates.
- Main files/tables/services: `render_jobs`, `render_job_inputs`, `renders`, `render_events`, `exports`, `export_variants`, Remotion/FFmpeg worker contracts, storage artifact records.
- Acceptance criteria: render jobs require approved snapshot, credit reservation when needed, required assets, timing plan, and QA gates; final export cannot use placeholders.
- GitHub deliverable: branch, commit, push, PR with render-readiness tests and explicit render execution state.

## 11. QA, Revision, And Fallback Execution Foundation

- Purpose: make quality gates, revision paths, and fallback decisions executable and auditable.
- Implements: QA reports, QA issue records, revision requests, fallback decision records, user-review gates, and final render blocking rules.
- Must not implement: provider rescue, render export, or credit-overrun execution without approved fallback and credit policy.
- Main files/tables/services: `qa_reports`, `qa_report_items`, `revision_requests`, `revision_request_items`, job events, approved snapshot versions.
- Acceptance criteria: failed required QA blocks final export, revisions create new plan versions when material, user-review issues cannot be silently bypassed.
- GitHub deliverable: branch, commit, push, PR with QA/revision tests and fallback-scope statement.

## 12. Tool-Call Foundation

- Purpose: define safe backend/worker calls for deterministic tools without installing or executing production tools by default.
- Implements: tool request contracts, allowlists, sandbox policy, input/output artifact rules, approved snapshot gates, logging redaction, and disabled-by-default route behavior.
- Must not implement: package installation, arbitrary shell execution, media processing, browser capture, map/chart capture, or GPU/model execution.
- Main files/tables/services: `open-source-tool-registry.md`, `worker-tool-runtime-architecture.md`, `tool_runtime_checks`, tool request/attempt tables if added.
- Acceptance criteria: no frontend tool execution, all tool calls require approved snapshot/job context, unsafe tools/routes stay blocked.
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
