# WORKER-1 Worker Runtime Contract Hardening Plan

Status: `ready_for_worker_2_dry_run_fixture_plan`.

Capability enabled: `none; worker runtime contract hardening and dry-run plan only`.

WORKER-1 creates the contract hardening package for future approved-plan-snapshot-based worker dry-runs. It does not run workers, claim jobs, enqueue jobs, run tools, run routes, call providers/models, process media, run browser capture, run Docker/Cloud Run, mutate Supabase, run SQL, upload artifacts, create signed URLs, create public artifacts, approve internal beta, unlock external beta, or unlock production.

## Source Evidence

- WORKER-0 status: `ready_with_warnings_for_worker_1`.
- PLAN-SNAPSHOT-0 contract status: `ready_for_owner_review`.
- MODEL-DRYRUN-2A status: `provider_dry_run_passed`.
- MODEL-DRYRUN-2A tokens: `2871 / 7200`.
- Full internal beta: `blocked_pending_workstream_gates`.
- Artifact source of truth: `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`.
- Supabase update required: `docs/status only`.
- Supabase update status: `docs_only`.
- Supabase environment touched: `none`.
- SQL executed: `none`.
- Migration deployed: `no`.

## Hardening Goals

- Define a future worker job payload schema that can consume approved plan snapshots and scoped manifests.
- Map PLAN-SNAPSHOT-0 fields into worker payload fields without raw prompt execution.
- Document claim, lease, idempotency, retry, and failure-state requirements.
- Harden service-role, artifact write, tool-route dispatch, QA, observability, and cleanup boundaries.
- Prepare a future WORKER-2 dry-run fixture plan and contract-test path without approving execution now.

## Base Gaps

These requested broad foundation paths are absent on this model-derived WORKER-0 base and must stay recorded as base gaps unless a later base introduces them:

- `PRODUCTION_FOUNDATION_STATUS.md`
- `docs/source-of-truth-map.md`
- `docs/production-milestone-plan.md`
- `docs/execution-gates-contract.md`
- `docs/tool-call-foundation.md`
- `docs/tool-readiness-worker-runtime-foundation.md`
- `docs/worker-claim-execution-contract-hardening.md`
- `docs/provider-gateway-foundation.md`
- `docs/render-preview-export-foundation.md`
- `docs/media-readiness-probe-timing-foundation.md`
- `docs/qa-revision-fallback-foundation.md`
- `docs/observability-audit-abuse-cost-foundation.md`
- `docs/compliance-license-security-review-foundation.md`
- `docs/supabase-milestone-sync-policy.md`
- `docs/supabase-success-milestone-reporting-standard.md`
- `docs/implementation-prompts/README.md`
- `docs/internal-beta/`
- `docs/cross-chat/`
- `docs/runtime-unlock/`
- `.github/workflows/`
- `scripts/validation/run-foundation-validation.mjs`

## Decision Record

```json
{
  "workerReadinessState": "ready_for_worker_2_dry_run_fixture_plan",
  "rawPromptExecutionApproved": false,
  "workerExecutionApprovedNow": false,
  "toolExecutionApprovedNow": false,
  "routeExecutionApprovedNow": false,
  "providerRuntimeApprovedNow": false,
  "supabaseMutationApprovedNow": false,
  "publicArtifactsApproved": false,
  "signedUrlsApproved": false,
  "internalBetaApproved": false,
  "externalBetaApproved": false,
  "productionApproved": false,
  "futureExecutionPromptRequired": true,
  "nextAllowedPrompt": "WORKER-2 - Worker Runtime Dry-Run Fixture Plan / Contract Tests"
}
```

## No-Scope Statement

No provider call, worker execution, tool execution, route execution, raw prompt execution, broad provider runtime, media processing, browser capture, Docker/Cloud Run execution, Supabase mutation, SQL execution, storage transfer, signed URL creation, public artifact creation, production deployment, external beta unlock, paid production unlock, Google Cloud Secret Manager payload exposure, secret commit, raw provider response commit, broad service-role handler, or production/beta unlock was enabled.
