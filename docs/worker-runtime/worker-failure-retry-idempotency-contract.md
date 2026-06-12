# Worker Failure Retry Idempotency Contract

Status: `ready_for_worker_2_dry_run_fixture_plan`.

## Failure Categories

| Category | Retry Class | WORKER-1 Rule |
| --- | --- | --- |
| Contract validation failure | Non-retryable until fixed | Missing snapshot, scoped manifest, artifact scope, or false-booleans violation blocks. |
| Claim conflict | Retryable only after lease evidence | Must not duplicate work. |
| Lease stale | Retryable only after stale-lease evidence | Requires audit event and cleanup state. |
| Provider failure | Blocked outside WORKER owner | Provider runtime remains not approved. |
| Tool failure | Blocked outside WORKER owner | Tool execution remains not approved. |
| Route failure | Blocked outside WORKER owner | Route execution remains not approved. |
| Partial artifact write | Non-retryable until cleanup evidence exists | No artifact write is approved now. |
| Checksum mismatch | Non-retryable until source-of-truth review | Manifest/checksum must stay authoritative. |
| Supabase failure | Non-retryable in WORKER-1 | Supabase mutation is not approved. |
| Secret/log redaction failure | Non-retryable security blocker | Must fail closed. |

## Idempotency Policy

The future idempotency key must bind:

- `jobId`
- `planSnapshotId`
- `scopedToolCallManifestRef`
- `artifactScopeRefs`
- worker type
- attempt number
- correlation ID

## Cleanup And Retry Evidence

Every future retry must point to cleanup/rollback evidence and preserve the artifact source-of-truth rule: `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`.

## Required Defaults

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
