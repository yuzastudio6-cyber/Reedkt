# Worker Artifact Write Boundary

Status: `ready_with_warnings_for_worker_1`.

WORKER-0 does not write artifacts. This document records the boundary required before any future worker artifact write path can be considered.

## Artifact Source Of Truth

`Supabase row + private GCS path + manifest + checksum + approved plan snapshot`

Signed URLs are not source of truth. Public artifact creation remains blocked.

## Existing Surfaces To Review Later

- `server/workers/production/production-worker-artifact-policy.ts`
- `server/workers/production/production-worker-result-writer.ts`
- `server/workers/render/render-artifact-writer.ts`
- `server/workers/media/media-artifact-record-builder.ts`
- `server/workers/audio/audio-execution-artifact-writer.ts`
- `server/workers/captions/caption-execution-artifact-writer.ts`
- `server/workers/color/color-artifact-writer.ts`
- `server/workers/timeline/timeline-execution-artifact-writer.ts`

## Blocked Uses

- storage transfer;
- uploads;
- signed URL creation;
- public artifact creation;
- broad media processing;
- final render/export;
- Supabase mutation;
- production or beta unlock.

```json
{
  "publicArtifactsApproved": false,
  "signedUrlsApproved": false,
  "supabaseMutationApproved": false,
  "workerExecutionApproved": false
}
```
