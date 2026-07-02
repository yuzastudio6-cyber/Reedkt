# Route Worker Bridge

Packet: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXECUTION-READY-ROUTE-WORKER-BRIDGE-1`

Route path: `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute`

Route owner: `backend_service_role_only`

Confirmation gate: `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE=true`

Route bridge mode: `delegates_existing_guarded_runtime_packet`

Runtime execution mode: `controlled_generated_fixture_runtime_execution`

Fixture scope: `generated_srt_and_generated_subtitle_only_mkv_fixture`

Allowed command templates:

- `gst_fakesrc_fakesink_no_media_healthcheck_v1`
- `gst_controlled_generated_fixture_pipeline_v1`
- `mkvmerge_generated_subtitle_only_package_v1`
- `mkvmerge_identify_generated_subtitle_only_v1`

The route requires API auth, idempotency, approved snapshot metadata, approval record metadata, a no-spend or credit policy reference, job and worker lease references, a non-public artifact policy reference, and explicit generated-fixture scope. It rejects raw commands, raw chat, arbitrary file paths, private/user media paths, public URLs, signed URLs, Supabase mutation, SQL, public artifacts, final render/export, and beta/production unlock requests.

Runtime delegate: `scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2.mjs`

Delegate confirmation gate: `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_POST_DISPATCH_WORKER_RUNTIME_EXECUTION=true`

Execution-ready status: `ready_for_guarded_generated_fixture_route_invocation`
