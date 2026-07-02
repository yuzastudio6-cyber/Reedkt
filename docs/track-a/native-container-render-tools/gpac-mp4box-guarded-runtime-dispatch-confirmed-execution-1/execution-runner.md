# GPAC/MP4Box Guarded Runtime Dispatch Confirmed Execution Runner

Packet: `TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-CONFIRMED-EXECUTION-1`

Package script:

`npm run tracka:gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1`

Diagnostics:

`npm run --silent tracka:gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1:diagnostics`

## Gate

Required confirmation gate:

`REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH=true`

Confirmation gate observed: `absent`

Current result: `blocked_pending_gpac_mp4box_guarded_runtime_dispatch_confirmation`

Current execution: `blocked_confirmation_absent_no_route_worker_or_tool_execution`

Runner status: `confirmed_execution_runner_added_fail_closed`

## Pinned Dispatch Contract

- Route id: `render.gpacMp4box.serviceRolePackageMock`
- Route path: `/api/render/gpac-mp4box/package/mock`
- Route owner: backend/service-role only
- Worker skeleton id: `worker.gpacMp4box.packageValidation.mock`
- Worker kind: `render_export`
- Approved snapshot fixture: `approvedSnapshot.gpacMp4box.generatedSubtitleOnly.v1`
- Private input manifest: `manifest.gpacMp4box.privateInput.generatedSubtitleOnly.v1`
- Private artifact manifest: `manifest.gpacMp4box.privateArtifact.generatedSubtitleOnly.v1`
- Cleanup policy: `cleanup.gpacMp4box.workerTemp.generatedSubtitleOnly.v1`

Allowed command-template IDs only:

- `mp4box_add_generated_subtitle_only_v1`
- `mp4box_info_generated_subtitle_only_v1`
- `mp4box_package_validation_metadata_v1`

## Future Confirmed-Gate Behavior

If the confirmation gate is absent, the runner writes a sanitized local `/tmp` report and exits fail-closed with `blocked_pending_gpac_mp4box_guarded_runtime_dispatch_confirmation`.

If the confirmation gate is present while the committed source still declares the route as disabled, the runner writes a sanitized local `/tmp` report and exits fail-closed with `blocked_gpac_mp4box_route_handler_not_enabled_for_confirmed_dispatch`.

The runner does not shell out to GPAC, MP4Box, Docker, FFmpeg, FFprobe, GStreamer, MKVToolNix, Remotion, Supabase, SQL, Cloud Run, workers, routes, or provider/model code. It verifies source contracts and records the exact blocker before any route/tool path can run.
