# WORKER-2 Worker Runtime Dry-Run Fixture Plan

Decision state: `worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings`

Worker readiness state: `ready_with_warnings_for_worker_3_offline_dry_run_approval_packet`

## Source Evidence

- TOOL-ROUTE-5: `tool_route_offline_dry_run_qa_passed_with_warnings`.
- TOOL-ROUTE-5 handoff: `ready_with_warnings_for_worker_route_fixture_integration_plan`.
- TOOL-ROUTE-4: `tool_route_offline_dry_run_passed_with_warnings`.
- TOOL-ROUTE-3: `approved_with_warnings_for_tool_route_4`.
- Sound/Music owner study: PR #371 merge SHA `f6283e63742d6999910d3887482dc3112da1e570`.

## Plan

WORKER-2 defines offline worker route fixture contracts for the seven committed scoped tool-call manifests. The contracts are committed JSON only and are validated by Node built-ins-only scripts.

The fixture contracts map each scoped tool-call fixture to placeholders for an approved plan snapshot, worker job reference, idempotency key, private artifact manifest, checksum/provenance, QA evidence, observability evidence, and cleanup evidence.

No worker job is claimed, leased, queued, run, or dispatched in WORKER-2.

## Source Inventory

- Worker CLI boundary: `server/cli/run-worker-job.ts`.
- Worker HTTP route boundary: `server/routes/worker-routes.ts`.
- Claim/lease boundary: `server/workers/worker-claim-runner.ts` and `server/services/worker-claim-service.ts`.
- Gate boundary: `server/workers/worker-gates.ts`.
- Runtime handler boundary: `server/workers/worker-runtime.ts`.
- Job loading boundary: `server/workers/worker-job-loader.ts`.
- Production worker boundary: `server/workers/production/`.
- Tool-route evidence boundary: `docs/tool-route-execution/`.

## Approval Booleans

workerExecutionApprovedNow: `false`
workerJobClaimApprovedNow: `false`
workerLeaseMutationApprovedNow: `false`
routeExecutionApprovedNow: `false`
toolExecutionApprovedNow: `false`
providerRuntimeApprovedNow: `false`
mediaRuntimeApprovedNow: `false`
audioRuntimeApprovedNow: `false`
supabaseMutationApprovedNow: `false`
gcsUploadApprovedNow: `false`
publicArtifactsApproved: `false`
signedUrlsApproved: `false`
rawPromptExecutionApproved: `false`
internalBetaApproved: `false`
externalBetaApproved: `false`
productionApproved: `false`

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
Supabase milestone sync: `not_performed`

Production capability enabled: `none; worker runtime dry-run fixture plan and contract tests only`

No provider call, worker execution, worker job claim, worker lease mutation, tool execution, route execution, raw prompt execution, broad provider runtime, media processing, browser capture, map rendering, Docker/Cloud Run execution, Supabase mutation, SQL execution, GCS upload, storage transfer, signed URL creation, public artifact creation, production deployment, internal beta unlock, external beta unlock, paid production unlock, Google Cloud Secret Manager payload exposure, secret commit, raw provider response commit, final render/export, or broad service-role handler was enabled.
