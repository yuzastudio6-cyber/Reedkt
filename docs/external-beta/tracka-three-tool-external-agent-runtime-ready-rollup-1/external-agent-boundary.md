# Three-Tool External-Agent Boundary

Allowed future external-agent path:

- Use only the accepted controlled generated-fixture source evidence.
- Preserve the route confirmation gates and runtime gates recorded by the source packets.
- Preserve generated-fixture-only input and output classes.
- Write any future proof reports under `/tmp` and commit only sanitized summaries/checksums.

Required gates:

- GStreamer/MKVToolNix external-agent path uses `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute`.
- GPAC/MP4Box route bridge uses `REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE=true`.
- GPAC/MP4Box runtime packet uses `REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GENERATED_FIXTURE_RUNTIME_EXECUTION=true`.

Blocked scope:

- Arbitrary private media: `blocked`
- User media: `blocked`
- Public URL media: `blocked`
- Signed URL source-of-truth: `blocked`
- Public artifacts: `blocked`
- Final render/export: `blocked`
- Paid production: `blocked`
- Broad external beta: `blocked`
- Supabase mutation: `blocked`
- SQL execution: `blocked`
- FFmpeg/FFprobe use in this lane: `blocked`

No route execution, worker execution, GStreamer execution, MKVToolNix execution, GPAC/MP4Box execution, FFmpeg/FFprobe execution, Docker execution, Supabase mutation, SQL execution, signed URL creation, public artifact creation, or final render/export occurred in this rollup phase.
