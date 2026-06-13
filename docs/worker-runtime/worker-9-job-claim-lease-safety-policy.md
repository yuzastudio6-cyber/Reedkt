# WORKER-9 Job Claim/Lease Safety Policy

policyState: `controlled_noop_only_for_worker_10`

## Policy

WORKER-10 may be approved only to run a controlled local no-op over committed worker fixture rows. The future no-op may derive claim and lease evidence from placeholder `workerJobRef` and `idempotencyKeyRef` values, but it must not contact queues, mutate job rows, update leases, import worker runtime code, or call route/tool/provider/Supabase/storage/media modules.

## Required Checks For WORKER-10

- Validate all seven fixture rows from `docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json`.
- Validate placeholder `approvedPlanSnapshotRef`, `scopedToolCallManifestRef`, `workerJobRef`, `idempotencyKeyRef`, private artifact, checksum, QA, observability, and cleanup refs.
- Validate blocked uses include worker execution, real job claim, lease mutation, queue execution, route execution, tool execution, provider/model runtime, Supabase mutation, storage transfer, signed URLs, public artifacts, and beta/production unlock.
- Validate every live/runtime approval boolean remains `false`.
- Write ignored local evidence only under a future `.local-artifacts/` path.
- Commit sanitized summaries only.

## Explicitly Blocked

- Live worker execution.
- Real job claim.
- Worker lease mutation.
- Queue execution.
- Route execution.
- Tool execution.
- Provider/model runtime.
- Route handler import, tool runtime import, or worker runtime import.
- Supabase mutation, SQL execution, storage transfer, signed URL creation, or public artifact creation.
- Media/audio runtime, audio generation, SFX/music generation, FFmpeg/FFprobe, DeepFilterNet, or Demucs execution.
- Raw prompt execution, final render/export, internal beta, external beta, paid production, or production.
- Controlled claim/lease execution before a future WORKER-10 approval exists.

## Source-Of-Truth Boundaries

Workers consume approved plan snapshots and scoped tool-call manifests. Signed URLs are not source of truth. No raw prompt-to-worker path is approved.
