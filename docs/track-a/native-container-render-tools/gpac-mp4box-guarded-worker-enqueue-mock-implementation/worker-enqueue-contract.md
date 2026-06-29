# Worker Enqueue Contract

The TypeScript contract lives at `src/backend/contracts/gpac-mp4box-guarded-worker-enqueue-mock-contracts.ts`.

Exports include:
- `buildGpacMp4boxGuardedWorkerEnqueueMockInput`
- `validateGpacMp4boxGuardedWorkerEnqueueMockInput`
- `enqueueGpacMp4boxGuardedWorkerMock`
- `summarizeGpacMp4boxGuardedWorkerEnqueueBoundary`

The contract consumes `GpacMp4boxGuardedServiceRoleRouteMockRequest` and validates it before queueing. A valid request creates a mock-only `render_export` queue item with sanitized references only.

The queue payload keeps approved snapshot, approval record, credit reservation, job, worker lease, private manifest, checksum, QA, cleanup, audit, idempotency, and command-template references. It does not include service-role secret payloads, raw commands, frontend file paths, public URLs, signed URLs as source-of-truth, arbitrary private media, or provider/model payloads.

The contract blocks route execution, worker dispatch, worker execution, GPAC/MP4Box execution, media processing, storage transfer, signed URL creation, public artifact creation, Supabase mutation, and SQL execution.
