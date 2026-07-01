# Runtime Packet Envelope

Envelope ID: `post-dispatch-worker-runtime-execution-packet-2-envelope`

Runtime packet ID: `runtime-packet-gstreamer-mkvtoolnix-post-dispatch-worker-2`

Runtime execution ID: `runtime-execution-gstreamer-mkvtoolnix-post-dispatch-worker-2`

Runtime execution mode: `controlled_generated_fixture_runtime_execution`

Fixture scope: `generated_srt_and_generated_subtitle_only_mkv_fixture`

Worker runtime mode: `runner_invoked_guarded_runtime_no_route_or_worker_dispatch`

Local mock queue item: `mock-job-runtime-queue-item-0001`

Queue status: `queued`

Docker image tag: `reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8`

Docker network: `none`

Allowed command templates:

- `gst_fakesrc_fakesink_no_media_healthcheck_v1`
- `gst_controlled_generated_fixture_pipeline_v1`
- `mkvmerge_generated_subtitle_only_package_v1`
- `mkvmerge_identify_generated_subtitle_only_v1`

Command matrix:

| Template | Exit | Media input | Media output |
| --- | ---: | --- | --- |
| `gst_fakesrc_fakesink_no_media_healthcheck_v1` | `0` | `false` | `false` |
| `gst_controlled_generated_fixture_pipeline_v1` | `0` | `false` | `false` |
| `mkvmerge_generated_subtitle_only_package_v1` | `0` | `generated_srt_fixture_only` | `generated_subtitle_only_mkv_fixture` |
| `mkvmerge_identify_generated_subtitle_only_v1` | `0` | `generated_srt_fixture_only` | `false` |

Route execution: `false`

Real worker dispatch: `false`

Worker process started: `false`

Worker execution: `false`

Worker lease claim: `false`

Persistent job queue write: `false`

Raw caller commands accepted: `false`

Runtime packet accepted: `true`
