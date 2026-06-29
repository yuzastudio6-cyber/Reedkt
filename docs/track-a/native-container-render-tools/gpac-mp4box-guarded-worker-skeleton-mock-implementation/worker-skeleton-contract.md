# Worker Skeleton Contract

The TypeScript contract lives at `src/backend/contracts/gpac-mp4box-guarded-worker-skeleton-mock-contracts.ts`.

Exports include:
- `buildGpacMp4boxGuardedWorkerSkeletonMockInput`
- `validateGpacMp4boxGuardedWorkerSkeletonMockInput`
- `summarizeGpacMp4boxGuardedWorkerSkeletonBoundary`

The skeleton consumes only the mock queue metadata from `TRACKA-GPAC-MP4BOX-GUARDED-WORKER-ENQUEUE-MOCK-IMPLEMENTATION-1`.

It registers skeleton id `worker.gpacMp4box.packageValidation.mock` as `disabled_mock_worker_skeleton_only`.

It never calls the existing worker dispatch service. It only verifies the queued mock item, mock-only payload, worker kind, and hard-false execution flags.
