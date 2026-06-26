# Runtime Contract

`server/services/internal-beta-private-artifact-access-policy-local-runtime.ts` validates local private artifact access policy metadata.

Required input:

- `workspaceId`
- `projectId`
- `userId`
- `approvedPlanSnapshotId`
- `artifactManifestId`
- `artifactId`
- `fileName`
- `sha256`
- `accessMode`
- `idempotencyKey`
- `authorizationContext.workspaceMember`
- `authorizationContext.projectMember`

Created status: `local_private_artifact_access_policy_validated_no_storage_read`

Invalid input blocker: `blocked_invalid_private_artifact_access_policy_input`

The runtime rejects path-like file names, malformed checksums, missing workspace/project membership, raw prompt fields, signed/public URL fields, media-byte fields, rendered-byte fields, service-role fields, provider secret fields, token fields, and secret-like metadata.

Access granted now: `false`

The record is local metadata only. Future real access remains blocked until Supabase RLS/storage validation, private storage bucket policy, service-role private artifact route runtime, and negative no-public/signed-artifact regressions pass.
