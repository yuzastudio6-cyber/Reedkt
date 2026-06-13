# Tool Route Observability And QA Boundary

Observability boundary status: `qa_observability_contract_required_before_execution`

Future TOOL-ROUTE-1 fixtures must define evidence hooks before route dry-run execution can be proposed.

Required future evidence fields:

- `correlationId`
- `routeId`
- `toolId`
- `approvedPlanSnapshotId`
- `scopedToolCallManifestId`
- `workerJobId`
- `workerClaimId`
- `idempotencyKey`
- `timingMetrics`
- `costMetrics`
- `redactedLogSummary`
- `qaChecks`
- `abuseSafetyChecks`
- `failureEvidence`
- `cleanupEvidence`

Logs must be redacted and must not contain secrets, raw provider output, raw prompts, signed URLs, private URLs, or public artifact links.

QA evidence must prove selected tool, blocked uses, artifact scope, source-of-truth refs, failure behavior, and cleanup behavior before any future route execution is considered.
