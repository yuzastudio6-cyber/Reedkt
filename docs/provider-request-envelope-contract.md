# Provider Request Envelope Contract

Prompt 15 defines the provider request envelope as a future worker/backend contract. It is validated and previewed only; it is not executed.

## Envelope Fields

Identity and ownership:
- `workspaceId`, `projectId`, `userId`
- `approvedSnapshotId`
- `jobId` and `generationRequestId` when available
- `toolCallIntentId` when applicable
- `providerKey`, `providerModelKey`, `requestType`

Gate references:
- `approvedSnapshotStatus`
- `creditEstimateId`, `creditReservationId`, `creditGateStatus`
- `jobReadinessStatus`, `workerClaimStatus`
- `mediaReadinessStatus`, `storageReadinessStatus`
- `qaBlockerStatus`
- `providerReadinessStatus`, `providerSecretReferenceStatus`

Provider routing:
- `providerType`, `providerRoute`, `modelName`, `modelVersion`
- `qualityLevel`, `tierPolicy`, `fallbackPolicy`, `retryPolicy`, `timeoutPolicy`
- `providerDisabledReason`

Inputs:
- prompt reference or safe approved prompt text
- negative prompt if applicable
- style, timing, and output constraints
- source media IDs, storage object record IDs, approved asset IDs
- no signed URLs as source-of-truth
- no raw secrets, provider keys, service-role keys, or unapproved raw chat as sole instruction

Output policy:
- `expectedOutputType`, `expectedAssetRole`, `storageTargetPolicy`
- transparent background, word-level timing, preview-only, final-export eligibility
- QA, provenance, and user-review requirements

Execution contract:
- `canCallProvider` must be `false` in Prompt 15
- `backendRequiredReasons`
- `forbiddenOperations`
- future allowed operation
- request hash/idempotency key references
- audit event policy

Completion and failure:
- provider attempt status
- provider request ID reference only after a future real call
- sanitized response summary
- failure category, safe failure message, retryable flag
- refund/release and downstream blocker indicators
- user-visible message

Integrity:
- envelope schema version
- envelope hash if later added
- created/updated timestamps
- sanitized audit preview

## Source-Of-Truth Rules

The envelope references approved records by ID. It must not store signed URLs, provider secrets, raw credentials, raw provider payloads, or raw chat as the execution source.
