# WORKER-2 Fixture Contract Test Report

Decision state: `worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings`

Contract test command: `npm run --silent worker:runtime-dry-run-fixtures:contract-tests`

## Contract Coverage

The offline contract tests validate `docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json` and verify all seven source scoped tool-call fixture files exist.

Required fixture checks:

- approved plan snapshot placeholder present;
- scoped tool-call manifest placeholder present;
- worker job placeholder present;
- idempotency key placeholder present;
- private artifact manifest placeholder present;
- checksum/provenance placeholder present;
- QA, observability, and cleanup evidence placeholders present;
- blocked uses present;
- all execution/unlock booleans false.

## Fixture Rows

- `worker_route_ai_tools_creative_graphics`
- `worker_route_track_a_render_export`
- `worker_route_track_b_media_processing`
- `worker_route_sound_music_audio`
- `worker_route_web_search_capture`
- `worker_route_map_geospatial`
- `worker_route_multi_tool_plan`

## Result

The contract-test target is offline/static and reads committed docs and JSON only. It does not import `server/cli/run-worker-job.ts`, `server/routes/worker-routes.ts`, `server/workers/worker-claim-runner.ts`, `server/workers/worker-runtime.ts`, route handlers, tool runtimes, provider clients, Supabase clients, media/audio packages, browser/map/render code, Docker/Cloud Run paths, or GCS/storage clients.

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
