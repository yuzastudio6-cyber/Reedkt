# Worker Observability QA Evidence Contract

Status: `ready_for_worker_2_dry_run_fixture_plan`.

WORKER-1 defines future evidence shape only. It does not start telemetry, run QA, execute workers, or write logs to a remote system.

## Required Future Evidence Fields

- `correlationId`
- `jobId`
- `planSnapshotId`
- `workerType`
- `attemptNumber`
- `runStateTransitions`
- `timingMetrics`
- `costMetrics`
- `qaHooks`
- `observabilityHooks`
- `abuseSafetyHooks`
- `cleanupRollbackHooks`
- `redactionSummary`

## Evidence Rules

- Logs must not include secrets, service-role keys, signed URLs, raw provider responses, raw prompts, private URLs, or real user media payloads.
- QA hooks must preserve blocked state when source evidence is missing.
- Cleanup evidence must exist before retrying after partial artifact or lease failures.
- Observability must report `blocked`, `dry_run_planned`, or future approved states without implying execution in WORKER-1.

```json
{
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
  "productionApproved": false
}
```
