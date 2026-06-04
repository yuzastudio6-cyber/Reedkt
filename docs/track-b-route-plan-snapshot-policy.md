# Track B Route Plan Snapshot Policy

Future Track B route execution must include an approved plan snapshot. Phase 44I only records the required shape.

Required fields:

- `planSnapshotId`
- `toolId`
- `approvedCapabilityId`
- `sourcePhase`
- `routeManifestVersion`
- `inputArtifactScopeId`
- `outputArtifactScopeId`
- `privateGcsPrefix`
- `requesterContext`
- `confirmationPhase`
- `auditReportPath`
- `failureBehavior`

The policy blocks raw chat text as a worker invocation source, arbitrary file paths, arbitrary GCS prefixes, public URLs, signed URLs as source of truth, frontend service-role secret access, and unapproved runtime adapters.

Default execution booleans stay closed: no raw prompt execution, no provider calls unless a later approved provider phase permits them, no public output, no broad media, and no arbitrary media.
