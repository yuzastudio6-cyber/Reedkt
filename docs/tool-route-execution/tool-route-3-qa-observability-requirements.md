# TOOL-ROUTE-3 QA And Observability Requirements

Requirement status: `ready_with_warnings_for_tool_route_4`

## Required TOOL-ROUTE-4 Evidence

- Fixture validation evidence for all seven scoped tool-call JSON fixtures.
- Manifest validation evidence for placeholder approved plan snapshot refs.
- No-execution proof for route handlers, tool runtimes, workers, providers/models, Supabase, SQL, GCS, signed URLs, public artifacts, media/audio runtime, browser capture, map rendering, Docker/Cloud Run, raw prompt execution, beta, production, and final render/export.
- No route handler import proof.
- No tool runtime import proof.
- No media/audio runtime proof.
- Warning/blocker evidence for draft/open PRs and PR #366 conflict state.
- Cleanup evidence for any local/offline output placeholders.
- Checksum/provenance evidence for local/offline reports.

## Observability Requirements

- `correlationId` placeholder required.
- `routeDryRunId` placeholder required.
- `fixtureId` recorded for every fixture row.
- `manifestId` recorded for every fixture row.
- Redacted event log placeholder required.
- No secret payload, private URL, signed URL, public URL, Supabase connection string, GCS path, or real user data may appear in committed evidence.

## Approval Booleans

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
