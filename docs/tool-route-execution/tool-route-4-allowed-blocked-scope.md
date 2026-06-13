# TOOL-ROUTE-4 Allowed And Blocked Scope

TOOL-ROUTE-4 expected state: `future_offline_dry_run_execution_allowed_with_warnings`

## Allowed Future Actions

- Read committed TOOL-ROUTE fixture JSON files.
- Read committed scoped manifest contract docs.
- Read committed validation docs and source evidence lockfile.
- Produce local/offline dry-run evidence only.
- Produce local/offline QA, observability, cleanup, and checksum/provenance summaries.
- Validate false approval booleans remain false.
- Validate placeholders remain placeholders.
- Validate no route handler import and no tool runtime import.

## Blocked Future Actions

- Live route execution.
- Tool execution.
- Route handler import.
- Tool runtime import.
- Worker execution.
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

## Required Source Evidence

- TOOL-ROUTE-3 source evidence lockfile.
- TOOL-ROUTE-2A conflict resolution evidence.
- TOOL-ROUTE-2 offline contract-test evidence.
- TOOL-ROUTE-1A Sound refresh evidence.
- TOOL-ROUTE-1 fixture plan and seven JSON fixtures.
- TOOL-ROUTE-0 audit evidence.
- PR #360 and PR #371 owner-study evidence.

futureOfflineDryRunExecutionApproved: `true`
liveRouteExecutionApprovedNow: `false`
liveToolExecutionApprovedNow: `false`
workerExecutionApprovedNow: `false`
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
