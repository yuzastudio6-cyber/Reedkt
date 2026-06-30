# Worker Skeleton Contract

Contract file: `src/backend/contracts/gstreamer-mkvtoolnix-guarded-worker-skeleton-contracts.ts`

Smoke: `npm run smoke:rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-skeleton-implementation-1`

Skeleton id: `worker.gstreamerMkvtoolnix.guarded.disabledSkeleton`

Skeleton mode: `disabled_worker_skeleton_metadata_only`

Queue consumption mode: `metadata_validation_only`

Worker owner: `backend_worker_only`

Worker kind: `render_export`

Required metadata:

- approved snapshot
- approval record
- credit/no-spend policy
- job
- disabled worker lease
- route idempotency key
- command-template allowlist
- private input manifest
- output manifest schema
- QA report schema
- cleanup policy
- retention policy
- failure policy
- audit parent

Rejected inputs:

- raw command strings
- raw chat
- frontend file paths
- public URL source-of-truth
- signed URL source-of-truth
- arbitrary private media
- service-role secret payloads
- broad service-role handlers

Execution boundary:

- Route execution: `false`
- Worker dispatch attempted: `false`
- Worker execution: `false`
- GStreamer execution: `false`
- MKVToolNix execution: `false`
- FFmpeg/FFprobe execution: `false`
- Docker execution: `false`
- Remotion execution: `false`
- Media processing: `false`
- Signed URL creation: `false`
- Public artifact creation: `false`
- Final render/export: `false`

Next required gate: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-PLAN-1`
