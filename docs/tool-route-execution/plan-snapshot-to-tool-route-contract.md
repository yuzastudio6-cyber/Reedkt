# Plan Snapshot To Tool Route Contract

Contract status: `planned_for_tool_route_1`

Future tool-route dry-run contracts must start from approved plan snapshots, not raw chat text or raw prompts.

Required future payload fields:

- `approvedPlanSnapshotId`
- `workspaceId`
- `projectId`
- `requestingUserId`
- `capabilityRoutingId`
- `selectedToolMix`
- `toolReadinessEvidenceRefs`
- `scopedToolCallManifestId`
- `routeInvocationId`
- `idempotencyKey`
- `correlationId`
- `workerJobId`
- `workerClaimId`
- `privateArtifactManifestId`
- `inputArtifactScopeRef`
- `outputArtifactScopeRef`
- `qaEvidenceRef`
- `observabilityRef`
- `cleanupEvidenceRef`

Future route invocation payloads must include blocked-use checks for raw prompt execution, public artifacts, signed URLs as source of truth, broad service-role handlers, provider fallback without approval, worker bypass, arbitrary local paths, arbitrary GCS prefixes, and Supabase mutation without a separate owner-approved gate.

Artifact source of truth: `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`.

Signed URLs are not source of truth.

Route execution approved: `false`
