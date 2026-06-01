# Worker Execution Envelope Contract

## Purpose

The worker execution envelope is the future record-native instruction package for a worker. It is not executable in Prompt 14. Workers must eventually receive this envelope from backend-approved records, not raw chat.

## Required Envelope Fields

Identity and ownership:

- `workspaceId`
- `projectId`
- `jobId`
- `jobBatchId`
- `approvedSnapshotId`
- `workerType`
- `jobType`
- `executionMode`
- `requestedBy`
- `claimedByWorkerId` or `workerClaimId` when available

Gate references:

- `approvedSnapshotStatus`
- `creditEstimateId`
- `creditReservationId`
- `creditGateStatus`
- `mediaReadinessStatus`
- `storageReadinessStatus`
- `timingReadinessStatus`
- `qaBlockerStatus`
- `toolReadinessStatus`
- `workerRuntimeReadinessStatus`

Idempotency and claim:

- `idempotencyKey`
- `workerClaimId`
- `workerLeaseId`
- opaque claim token reference, never raw token material
- `attemptNumber`
- `maxAttempts`
- `retryBudget`
- `claimedAt`
- `leaseExpiresAt`
- `heartbeatDueAt`

Inputs:

- Source record IDs only.
- Storage object record IDs only.
- No signed URLs as source of truth.
- No raw secrets, provider keys, service-role keys, or private credentials.
- No unapproved raw chat as the sole instruction.

Execution contract:

- `allowedOperation`
- `forbiddenOperations`
- `canExecute`, which must remain `false` until a future execution milestone.
- `backendRequiredReasons`
- `runtimeRequiredTools`
- `runtimeBlockedTools`
- `expectedOutputs`
- `outputWritePolicy`
- `auditEventPolicy`

Completion and failure:

- `completionStatus`
- `completionSummary`
- `failureCategory`
- `failureMessageSafe`
- `retryable`
- `refundOrReleaseNeeded`
- `downstreamBlocked`
- `userVisibleMessage`

Integrity:

- `envelopeSchemaVersion`
- future deterministic `envelopeHash`
- `createdAt`
- `updatedAt`
- sanitized audit event name/payload

## Prompt 14 Rules

- Envelope previews are sanitized metadata only.
- `canExecute` is always false.
- Tool readiness is static/read-only and all runtime execution remains disabled.
- Future worker outputs must write through reviewed backend/service-role paths only.
