# TOOL-ROUTE-3 Cleanup And Rollback Plan

Cleanup status: `planned_for_tool_route_4_offline_only`

## Local/Offline Cleanup

- Future TOOL-ROUTE-4 may write local/offline evidence under an approved placeholder output directory only.
- Future cleanup must remove transient local/offline output when validation fails, while preserving committed sanitized summaries.
- Future cleanup evidence must record run id, fixture ids, manifest ids, checksum summary refs, removed placeholder paths, and retained committed evidence docs.

## Failed Dry-Run Rollback

- If fixture validation fails, TOOL-ROUTE-4 must stop and record `blocked_fixture_validation_failed`.
- If manifest validation fails, TOOL-ROUTE-4 must stop and record `blocked_manifest_validation_failed`.
- If no-execution proof fails, TOOL-ROUTE-4 must stop and record `blocked_unsafe_runtime_claim`.
- No retry loop is approved by TOOL-ROUTE-3.

## Out-Of-Scope Cleanup

- No GCS cleanup because upload/storage transfer is blocked.
- No signed URL cleanup because signed URL creation is blocked.
- No public artifact cleanup because public artifacts are blocked.
- No Supabase cleanup because Supabase mutation is blocked.
- No Docker/Cloud Run cleanup because Docker/Cloud Run execution is blocked.

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
