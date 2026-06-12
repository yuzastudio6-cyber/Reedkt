# Worker Artifact Write Hardening Contract

Status: `ready_for_worker_2_dry_run_fixture_plan`.

WORKER-1 does not upload or write artifacts. It defines the future artifact write contract.

## Required Source Of Truth

`Supabase row + private GCS path + manifest + checksum + approved plan snapshot`

## Future Artifact Write Preconditions

- Approved plan snapshot reference.
- Private GCS path placeholder.
- Supabase row placeholder.
- Manifest placeholder.
- Checksum placeholder.
- Artifact scope refs from the approved snapshot.
- Cleanup and rollback evidence plan.
- No signed URL as source of truth.
- No public artifact.
- No storage transfer without a later owner-approved prompt.

## Blocked In WORKER-1

- GCS upload
- storage transfer
- signed URL creation
- public artifact creation
- Supabase mutation
- SQL
- worker execution
- tool execution
- route execution
- provider runtime

```json
{
  "workerExecutionApprovedNow": false,
  "supabaseMutationApprovedNow": false,
  "publicArtifactsApproved": false,
  "signedUrlsApproved": false,
  "internalBetaApproved": false,
  "externalBetaApproved": false,
  "productionApproved": false
}
```
