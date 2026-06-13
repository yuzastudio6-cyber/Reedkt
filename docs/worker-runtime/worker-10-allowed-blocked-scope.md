# WORKER-10 Allowed And Blocked Scope

nextPrompt: `WORKER-10 - Controlled Job Claim/Lease No-Op Execution`

## Allowed

- Execute only a controlled local no-op over committed worker fixture rows if WORKER-10 approval exists.
- Read `docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json` and committed WORKER-9 through WORKER-2 evidence docs.
- Derive claim/lease no-op evidence from placeholder `workerJobRef` and `idempotencyKeyRef` values.
- Validate false live/runtime approval booleans and blocked-use coverage.
- Write ignored local evidence only under `.local-artifacts/`.
- Commit sanitized summaries only.

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

## Approval Booleans

liveWorkerExecutionApprovedNow: `false`
realJobClaimApprovedNow: `false`
workerJobClaimApprovedNow: `false`
realLeaseMutationApprovedNow: `false`
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
