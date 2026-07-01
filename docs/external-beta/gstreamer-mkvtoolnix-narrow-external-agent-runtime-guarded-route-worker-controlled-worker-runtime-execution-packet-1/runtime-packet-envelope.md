# Runtime Packet Envelope

The runtime packet envelope accepted only the sanitized source references from the prior narrow dispatch dry-run and the generated-fixture guarded runtime report.

## Accepted References

- Runtime packet ID: `runtime-packet-gstreamer-mkvtoolnix-narrow-controlled-worker-1`
- Runtime execution ID: `runtime-execution-gstreamer-mkvtoolnix-narrow-controlled-worker-1`
- Runtime execution mode: `controlled_generated_fixture_runtime_execution`
- Runtime execution idempotency key: `gstreamer-mkvtoolnix:narrow-route-worker-controlled-worker-runtime-execution-packet-1:route-source-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1:rp-ext-beta-gstreamer-mkvtoolnix-narrow-controlled-worker-route-source-1:mock-job-runtime-queue-item-0001:dispatch-dry-run-gstreamer-mkvtoolnix-narrow-controlled-worker-1:2026-07-01T20-56-05-092Z-9330089b:runtime-execution-gstreamer-mkvtoolnix-narrow-controlled-worker-1`
- Fixture scope: `generated_srt_and_generated_subtitle_only_mkv_fixture`
- Worker runtime mode: `runner_invoked_guarded_runtime_no_route_dispatch`
- Dispatch dry-run ID: `dispatch-dry-run-gstreamer-mkvtoolnix-narrow-controlled-worker-1`
- Queue ID: `queue-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1`
- Dispatch ID: `dispatch-gstreamer-mkvtoolnix-narrow-controlled-worker-1`
- Route source ID: `route-source-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1`
- Job ID: `mock-job-runtime-queue-item-0001`
- Worker lease ID: `lease-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1`
- Guarded runtime run ID: `2026-07-01T20-56-05-092Z-9330089b`
- Docker image tag: `reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8`
- Docker network: `none`

Runtime packet accepted: `true`

Next runtime QA rollup: `pending_next_milestone`

## Disabled Controls

- Route execution: `false`
- Worker dispatch: `false`
- Worker execution: `false`
- Worker process start: `false`
- Worker lease claim: `false`
- Persistent job queue write: `false`
- Private media processing: `false`
- User media processing: `false`
- Supabase mutation: `false`
- SQL execution: `false`
- Signed URL creation: `false`
- Public artifact creation: `false`
- Final render/export: `false`
