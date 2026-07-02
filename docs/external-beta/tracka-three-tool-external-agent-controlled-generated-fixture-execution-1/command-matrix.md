# Three-Tool Command Matrix

The combined runner delegates to existing confirmation-gated child runners. It does not accept raw caller commands.

GStreamer/MKVToolNix child runner:

- Script: `scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2.mjs`
- Gate: `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_POST_DISPATCH_WORKER_RUNTIME_EXECUTION=true`
- Result: `completed_gstreamer_mkvtoolnix_post_dispatch_worker_runtime_execution_packet_generated_fixture_only`
- Execution: `completed_confirmation_gated_post_dispatch_worker_runtime_execution_packet_generated_fixture_only_no_route_or_worker_dispatch`
- Docker network: `none`

Allowed GStreamer/MKVToolNix templates:

- `gst_fakesrc_fakesink_no_media_healthcheck_v1`
- `gst_controlled_generated_fixture_pipeline_v1`
- `mkvmerge_generated_subtitle_only_package_v1`
- `mkvmerge_identify_generated_subtitle_only_v1`

GPAC/MP4Box child runner:

- Script: `scripts/validation/tracka-gpac-mp4box-generated-fixture-runtime-execution-1.mjs`
- Gate: `REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GENERATED_FIXTURE_RUNTIME_EXECUTION=true`
- Result: `completed_gpac_mp4box_generated_fixture_runtime_execution`
- Execution: `completed_confirmation_gated_local_render_worker_runtime_execution_generated_fixture_only`
- Docker network: `none`

Allowed GPAC/MP4Box templates:

- `mp4box_add_generated_subtitle_only_v1`
- `mp4box_info_generated_subtitle_only_v1`

Disallowed in this packet:

- raw command execution
- arbitrary private media
- user media
- public URL media
- signed URL source-of-truth
- GCS/private artifact access
- FFmpeg/FFprobe execution
- Docker push/deployment
- route execution
- real worker dispatch
- Supabase mutation
- SQL execution
- public artifacts
- final render/export
