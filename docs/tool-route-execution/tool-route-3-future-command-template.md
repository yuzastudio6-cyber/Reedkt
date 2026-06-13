# TOOL-ROUTE-3 Future Command Template

These templates are conceptual placeholders for a future TOOL-ROUTE-4 prompt. Do not run them during TOOL-ROUTE-3.

## Future Offline Dry-Run Template

```sh
DO NOT RUN UNTIL TOOL-ROUTE-4 EXECUTION APPROVAL EXISTS.
TOOL_ROUTE_4_RUN_ID=<TOOL_ROUTE_4_RUN_ID> \
FIXTURE_DIR=<FIXTURE_DIR> \
SCOPED_TOOL_CALL_MANIFEST_DIR=<SCOPED_TOOL_CALL_MANIFEST_DIR> \
OFFLINE_OUTPUT_DIR=<OFFLINE_OUTPUT_DIR> \
APPROVED_PLAN_SNAPSHOT_FIXTURE=<APPROVED_PLAN_SNAPSHOT_FIXTURE> \
npm run tool-route:offline-dry-run -- --run-id <TOOL_ROUTE_4_RUN_ID> --fixture-dir <FIXTURE_DIR> --manifest-dir <SCOPED_TOOL_CALL_MANIFEST_DIR> --output-dir <OFFLINE_OUTPUT_DIR> --approved-plan-snapshot <APPROVED_PLAN_SNAPSHOT_FIXTURE>
```

## Future Offline QA Template

```sh
DO NOT RUN UNTIL TOOL-ROUTE-4 EXECUTION APPROVAL EXISTS.
TOOL_ROUTE_4_RUN_ID=<TOOL_ROUTE_4_RUN_ID> \
FIXTURE_DIR=<FIXTURE_DIR> \
SCOPED_TOOL_CALL_MANIFEST_DIR=<SCOPED_TOOL_CALL_MANIFEST_DIR> \
OFFLINE_OUTPUT_DIR=<OFFLINE_OUTPUT_DIR> \
APPROVED_PLAN_SNAPSHOT_FIXTURE=<APPROVED_PLAN_SNAPSHOT_FIXTURE> \
npm run tool-route:offline-dry-run:qa -- --run-id <TOOL_ROUTE_4_RUN_ID> --fixture-dir <FIXTURE_DIR> --manifest-dir <SCOPED_TOOL_CALL_MANIFEST_DIR> --output-dir <OFFLINE_OUTPUT_DIR> --approved-plan-snapshot <APPROVED_PLAN_SNAPSHOT_FIXTURE>
```

## Placeholder Policy

- No real GCS paths.
- No signed URLs.
- No public URLs.
- No secrets.
- No route handler imports.
- No tool runtime imports.
- No worker execution.
- No provider/model calls.
- No Supabase connection.
- No SQL.
- No media/audio processing.

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
