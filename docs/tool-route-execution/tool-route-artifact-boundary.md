# Tool Route Artifact Boundary

Artifact boundary status: `private_artifact_contract_required_before_execution`

Future route outputs must be private by default and tied to approved plan snapshot evidence.

Required future artifact evidence:

- `privateArtifactManifestId`
- `supabaseArtifactRowPlaceholder`
- `privateGcsPathPlaceholder`
- `checksum`
- `provenance`
- `approvedPlanSnapshotId`
- `toolRunId`
- `workerJobId`
- `qaEvidenceRef`
- `cleanupEvidenceRef`
- `rollbackEvidenceRef`

Signed URLs are not source of truth.

Public artifacts are not approved.

Uploads, storage transfer, GCS writes, signed URL creation, and Supabase artifact writes require later owner-approved gates. This audit creates no artifacts and performs no upload.
