# TOOL-ROUTE-6 Allowed And Blocked Scope

TOOL-ROUTE-6 expected state: `worker_route_fixture_integration_plan_allowed_with_warnings`

## Allowed Future Actions

- Plan worker/route fixture integration from committed scoped tool-call fixture JSON.
- Map TOOL-ROUTE-4/5 evidence into worker contract tests.
- Define approved snapshot placeholder requirements.
- Define private artifact manifest placeholders, checksum/provenance placeholders, QA evidence placeholders, observability evidence placeholders, and cleanup evidence placeholders.
- Keep all execution and unlock booleans false unless a later owner-approved execution prompt changes them.

## Blocked Future Actions

- Live route execution.
- Tool execution.
- Route handler import.
- Tool runtime import.
- Worker execution or worker job claiming.
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

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
