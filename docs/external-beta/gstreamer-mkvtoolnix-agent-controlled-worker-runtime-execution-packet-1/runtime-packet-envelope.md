# Runtime Packet Envelope

Envelope ID: `agent-controlled-worker-runtime-execution-packet-1-envelope`

Runtime packet ID: `runtime-packet-gstreamer-mkvtoolnix-agent-controlled-worker-1`

Runtime execution ID: `runtime-execution-gstreamer-mkvtoolnix-agent-controlled-worker-1`

Dispatch dry-run ID: `dispatch-dry-run-gstreamer-mkvtoolnix-agent-controlled-worker-1`

Dispatch dry-run idempotency key: `gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run:workspace-agent-controlled-dispatch-1:project-agent-controlled-dispatch-1:approved-snapshot-agent-controlled-dispatch-1:job-agent-controlled-dispatch-1:dispatch-gstreamer-mkvtoolnix-agent-controlled-dispatch-1:queue-gstreamer-mkvtoolnix-agent-controlled-worker-queue-1:dispatch-dry-run-gstreamer-mkvtoolnix-agent-controlled-worker-1`

Queue ID: `queue-gstreamer-mkvtoolnix-agent-controlled-worker-queue-1`

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

Route executed: `false`

Worker dispatched: `false`

Worker executed: `false`

Worker lease claimed: `false`

Persistent queue write: `false`
