# WORKER-3 Allowed And Blocked Scope

WORKER-3 expected state: `worker_runtime_offline_dry_run_approval_packet_allowed_with_warnings`

## Allowed Future Actions

- Review WORKER-2 fixture contracts and contract-test output.
- Prepare a future offline worker dry-run approval packet.
- Define future command templates with placeholders only.
- Decide whether a later WORKER-4 prompt may execute an offline/static worker dry-run harness.
- Keep all live execution and unlock booleans false.

## Blocked Future Actions

- Worker execution.
- Worker job claiming.
- Worker lease mutation.
- Queue enqueue.
- Route execution.
- Tool execution.
- Route handler import.
- Tool runtime import.
- Provider/model calls.
- Supabase mutation.
- SQL execution.
- GCS upload or storage transfer.
- Signed URL creation.
- Public artifact creation.
- Browser capture.
- Map rendering.
- Media/audio processing.
- Audio generation.
- SFX/music generation.
- FFmpeg/FFprobe execution.
- DeepFilterNet execution.
- Demucs execution.
- Docker/Cloud Run execution.
- Dependency mutation.
- Raw prompt execution.
- Final render/export.
- Internal beta, external beta, paid production, or production unlock.

workerExecutionApprovedNow: `false`
workerJobClaimApprovedNow: `false`
workerLeaseMutationApprovedNow: `false`
routeExecutionApprovedNow: `false`
toolExecutionApprovedNow: `false`
providerRuntimeApprovedNow: `false`
mediaRuntimeApprovedNow: `false`
audioRuntimeApprovedNow: `false`
supabaseMutationApprovedNow: `false`
gcsUploadApprovedNow: `false`
publicArtifactsApproved: `false`
signedUrlsApproved: `false`
rawPromptExecutionApproved: `false`
internalBetaApproved: `false`
externalBetaApproved: `false`
productionApproved: `false`

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
