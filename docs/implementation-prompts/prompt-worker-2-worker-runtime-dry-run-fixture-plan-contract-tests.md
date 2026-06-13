# Prompt WORKER-2 - Worker Runtime Dry-Run Fixture Plan And Contract Tests

## Prompt Summary

Create WORKER-2 from `origin/codex/rp-tool-route-5-offline-dry-run-qa-worker-gate-readiness`, branch `codex/rp-worker-2-worker-runtime-dry-run-fixture-plan-contract-tests`, and open draft PR `[worker] WORKER-2 worker runtime dry-run fixture plan and contract tests`.

This is docs, offline JSON contracts, static diagnostics, tracker updates, and PR/CI only. It must not run `worker:run`, claim jobs, mutate leases, execute routes/tools/workers/providers, process media/audio, mutate Supabase, upload to GCS, create signed URLs/public artifacts, or unlock beta/production.

## Implementation Notes

- Base evidence: TOOL-ROUTE-5 `tool_route_offline_dry_run_qa_passed_with_warnings`.
- Worker handoff: `ready_with_warnings_for_worker_route_fixture_integration_plan`.
- Contract fixture source: seven committed scoped tool-call fixture JSON files.
- Worker contract output: `docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json`.
- Contract tests and diagnostics use Node built-ins only.

## Result

Decision state: `worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings`

Worker readiness state: `ready_with_warnings_for_worker_3_offline_dry_run_approval_packet`

Production capability enabled: `none; worker runtime dry-run fixture plan and contract tests only`

## Supabase And Scope

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
Supabase milestone sync: `not_performed`

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

No provider call, worker execution, worker job claim, worker lease mutation, tool execution, route execution, raw prompt execution, broad provider runtime, media processing, browser capture, map rendering, Docker/Cloud Run execution, Supabase mutation, SQL execution, GCS upload, storage transfer, signed URL creation, public artifact creation, production deployment, internal beta unlock, external beta unlock, paid production unlock, Google Cloud Secret Manager payload exposure, secret commit, raw provider response commit, final render/export, or broad service-role handler was enabled.
