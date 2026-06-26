# RP-INTERNAL-BETA-PRIVATE-ARTIFACT-MANIFEST-LOCAL-RUNTIME-1 Runtime Contract

Local runtime function: `createInternalBetaPrivateArtifactManifestLocalRuntime`

Runtime status values:
- `local_private_artifact_manifest_validated_no_storage_access`
- `blocked_invalid_private_artifact_manifest_input`

Required inputs:
- `workspaceId`
- `projectId`
- `approvedPlanSnapshotId`
- `jobId`
- `creditReservationId`
- `idempotencyKey`
- at least one artifact metadata item with file name, byte count, and SHA-256 checksum

Created local-only metadata on success:
- deterministic `artifact_manifest_<hash>` id
- deterministic private artifact metadata rows
- checksum records copied from supplied SHA-256 values
- QA report link metadata with `qaExecution: false`
- cleanup policy metadata with `cleanupExecuted: false`

Blocked inputs:
- missing approved snapshot/job/credit reservation/idempotency references
- missing or malformed checksums
- path-like file names
- negative or non-integer byte counts
- raw chat, raw prompt, provider prompt, signed/public URL, media bytes, service-role, provider secret, or secret-like metadata

Storage write: `false`

Storage read: `false`

Signed URL creation: `false`

Public artifact creation: `false`

Private media processing: `false`

User media processing: `false`

Internal beta unlock: `false`
