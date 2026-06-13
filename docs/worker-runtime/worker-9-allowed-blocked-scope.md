# WORKER-9 Allowed And Blocked Scope

nextPrompt: `WORKER-9 - Controlled Job Claim/Lease Gate Approval Packet`

## Allowed

- Review WORKER-8 QA evidence and WORKER-7 controlled no-op evidence.
- Prepare a controlled job claim/lease gate approval packet for a future prompt.
- Verify source fixture coverage, approved plan snapshot refs, scoped tool-call manifest refs, worker job refs, idempotency refs, private artifact/checksum/QA/observability/cleanup refs, and false approval booleans.
- Define future command templates with placeholders only.
- Keep Supabase and production status docs-only.

## Blocked

- Live worker execution.
- Real job claim.
- Worker lease mutation.
- Queue execution.
- Route execution.
- Tool execution.
- Provider/model runtime.
- Route handler import, tool runtime import, or worker runtime import.
- Media/audio runtime, audio generation, SFX/music generation, FFmpeg/FFprobe, DeepFilterNet, or Demucs execution.
- Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, or public artifact creation.
- Raw prompt execution, final render/export, internal beta, external beta, paid production, or production.
- Rerunning WORKER-7 controlled no-op execution.

## Approval Booleans

liveWorkerExecutionApprovedNow: `false`
workerJobClaimApprovedNow: `false`
workerLeaseMutationApprovedNow: `false`
queueExecutionApprovedNow: `false`
routeExecutionApprovedNow: `false`
toolExecutionApprovedNow: `false`
providerRuntimeApprovedNow: `false`
mediaRuntimeApprovedNow: `false`
audioRuntimeApprovedNow: `false`
supabaseMutationApprovedNow: `false`
publicArtifactsApproved: `false`
signedUrlsApproved: `false`
rawPromptExecutionApproved: `false`
internalBetaApproved: `false`
externalBetaApproved: `false`
productionApproved: `false`
