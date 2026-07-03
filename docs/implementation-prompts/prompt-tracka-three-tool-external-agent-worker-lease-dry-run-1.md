# TRACKA-THREE-TOOL-EXTERNAL-AGENT-WORKER-LEASE-DRY-RUN-1

Use only after `TRACKA-THREE-TOOL-EXTERNAL-AGENT-PERSISTENT-JOB-QUEUE-DRY-RUN-1` is merged and validated.

Required confirmation gate:

`REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_LEASE_DRY_RUN=true`

The worker lease dry-run may validate lease envelope shape, lease TTL policy, retry category metadata, idempotency reuse, and cleanup policy metadata for the three-tool external-agent lane.

It must not claim a real lease, write a real persistent queue, start worker processes, execute GStreamer, MKVToolNix, GPAC/MP4Box, Docker, FFmpeg/FFprobe, Remotion, private/user media, Supabase, SQL, providers, signed/public artifacts, final render/export, external beta expansion, paid production, or production.
