# Worker Job Payload Schema

Status: `ready_for_worker_2_dry_run_fixture_plan`.

This is a future contract schema only. It is not a route payload implementation, database schema, migration, queue writer, or executable worker config.

## Required Future Payload Fields

| Field | Requirement |
| --- | --- |
| `jobId` | Placeholder job ID for the future dry-run fixture or approved job. |
| `planSnapshotId` | Approved plan snapshot placeholder; raw chat cannot substitute for this. |
| `approvalState` | Must be reviewed before worker dry-run; WORKER-1 records only `ready_for_worker_2_dry_run_fixture_plan`. |
| `workspaceRef` | Workspace placeholder. |
| `projectRef` | Project placeholder. |
| `userRef` | User placeholder. |
| `scopedToolCallManifestRef` | Placeholder for a scoped manifest from the tool-route owner gate. |
| `editIntentRefs` | References to structured edit intent records from the approved snapshot. |
| `artifactScopeRefs` | Private artifact scope placeholders only. |
| `idempotencyKey` | Deterministic key derived from job, snapshot, worker type, and attempt. |
| `attemptNumber` | Starts at `1` for future fixture planning. |
| `maxAttempts` | Placeholder value controlled by retry policy. |
| `timeoutMs` | Placeholder timeout controlled by worker type and dry-run gate. |
| `correlationId` | Stable trace ID for logs, QA, cleanup, and audit evidence. |
| `qaHooks` | Placeholder QA checks; no QA runner is executed by WORKER-1. |
| `observabilityHooks` | Placeholder event/log/cost hooks; no telemetry runtime is started. |
| `cleanupRollbackHooks` | Placeholder cleanup/rollback refs. |
| `blockedUses` | Blocked use list, including raw prompts, signed URLs, public artifacts, broad service-role handlers, and production/beta unlocks. |
| `sourceOfTruthPolicy` | Must equal `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`. |

## Minimal Future Fixture Shape

```json
{
  "jobId": "<WORKER_JOB_ID_PLACEHOLDER>",
  "planSnapshotId": "<APPROVED_PLAN_SNAPSHOT_ID_PLACEHOLDER>",
  "approvalState": "ready_for_worker_2_dry_run_fixture_plan",
  "workspaceRef": "<WORKSPACE_REF_PLACEHOLDER>",
  "projectRef": "<PROJECT_REF_PLACEHOLDER>",
  "userRef": "<USER_REF_PLACEHOLDER>",
  "scopedToolCallManifestRef": "<SCOPED_TOOL_CALL_MANIFEST_REF_PLACEHOLDER>",
  "editIntentRefs": ["<EDIT_INTENT_REF_PLACEHOLDER>"],
  "artifactScopeRefs": ["<PRIVATE_ARTIFACT_SCOPE_REF_PLACEHOLDER>"],
  "idempotencyKey": "<IDEMPOTENCY_KEY_PLACEHOLDER>",
  "attemptNumber": 1,
  "maxAttempts": "<MAX_ATTEMPTS_PLACEHOLDER>",
  "timeoutMs": "<TIMEOUT_MS_PLACEHOLDER>",
  "correlationId": "<CORRELATION_ID_PLACEHOLDER>",
  "qaHooks": ["<QA_HOOK_PLACEHOLDER>"],
  "observabilityHooks": ["<OBSERVABILITY_HOOK_PLACEHOLDER>"],
  "cleanupRollbackHooks": ["<CLEANUP_ROLLBACK_HOOK_PLACEHOLDER>"],
  "blockedUses": [
    "raw_prompt_execution",
    "worker_execution_without_owner_gate",
    "tool_execution_without_tool_route_gate",
    "route_execution_without_tool_route_gate",
    "signed_url_source_of_truth",
    "public_artifact",
    "supabase_mutation_without_approved_prompt",
    "production_beta_unlock"
  ],
  "sourceOfTruthPolicy": "Supabase row + private GCS path + manifest + checksum + approved plan snapshot",
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
