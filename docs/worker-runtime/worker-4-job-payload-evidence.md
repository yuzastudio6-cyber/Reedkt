# WORKER-4 Job Payload Evidence

decisionState: `worker_runtime_offline_dry_run_passed_with_warnings`

Run id: `worker-4-local-static`

Local ignored evidence directory: `.local-artifacts/worker-runtime/worker-4/worker-4-local-static/`

## Payload Contract Checks

The offline harness derives sanitized job payload rows from `docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json`. Each row keeps these fields placeholder-only:

- approved plan snapshot ref
- scoped tool-call manifest ref
- worker job ref
- idempotency key ref
- private artifact manifest ref
- checksum ref
- QA evidence ref
- observability evidence ref
- cleanup evidence ref

The generated local summary is `.local-artifacts/worker-runtime/worker-4/worker-4-local-static/job-payload-summary.json`.

## Fixture Coverage

- fixtures processed: `7`
- fixtures passed with warnings: `7`
- source decision: `worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings`
- worker approval source: `approved_with_warnings_for_worker_4`
- tool-route QA source: `tool_route_offline_dry_run_qa_passed_with_warnings`

## Boundaries

The payload evidence is a static contract check. It does not enqueue a worker job, claim a row, mutate a lease, invoke a route, import a tool runtime, call a provider, touch Supabase, or write remote storage.

liveWorkerExecutionApprovedNow: `false`
workerJobClaimApprovedNow: `false`
workerLeaseMutationApprovedNow: `false`
queueExecutionApprovedNow: `false`
routeExecutionApprovedNow: `false`
toolExecutionApprovedNow: `false`
providerRuntimeApprovedNow: `false`
mediaRuntimeApprovedNow: `false`
audioRuntimeApprovedNow: `false`
supabaseMutationApprovedNow: `false`
publicArtifactsApproved: `false`
signedUrlsApproved: `false`
rawPromptExecutionApproved: `false`
internalBetaApproved: `false`
externalBetaApproved: `false`
productionApproved: `false`
