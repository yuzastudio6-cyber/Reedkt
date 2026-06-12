# Plan Snapshot To Worker Input Contract

Status: `ready_with_warnings_for_worker_1`.

PLAN-SNAPSHOT-0 defines the future approved plan snapshot contract. WORKER-0 records how that contract must map into worker input, without approving any worker call.

## Required Future Worker Input

Every future worker dry-run or execution candidate must carry:

- approved plan snapshot reference or explicitly approved synthetic dry-run snapshot reference;
- workspace and project references;
- job ID and job type;
- worker type and worker instance ID;
- idempotency key bound to the job and snapshot;
- dependency status and retry state;
- credit reservation reference for expensive work;
- artifact scope using `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`;
- private artifact manifest refs and checksum refs;
- QA gate refs;
- observability/audit event scope;
- cleanup/rollback owner;
- blocked-use list.

## Required False Defaults

```json
{
  "workerExecutionApproved": false,
  "toolExecutionApproved": false,
  "routeExecutionApproved": false,
  "providerRuntimeApproved": false,
  "supabaseMutationApproved": false,
  "publicArtifactsApproved": false,
  "signedUrlsApproved": false,
  "rawPromptExecutionApproved": false,
  "internalBetaApproved": false,
  "externalBetaApproved": false,
  "productionApproved": false
}
```

## WORKER-1 Handoff

WORKER-1 may draft the exact dry-run contract for worker payloads and runner checks. It must not expand beyond dry-run planning unless a later owner-approved execution prompt exists.
