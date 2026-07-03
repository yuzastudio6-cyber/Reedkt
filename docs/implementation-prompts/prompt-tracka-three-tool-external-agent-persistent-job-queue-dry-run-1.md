# TRACKA-THREE-TOOL-EXTERNAL-AGENT-PERSISTENT-JOB-QUEUE-DRY-RUN-1

Use only after `TRACKA-THREE-TOOL-EXTERNAL-AGENT-GUARDED-WORKER-DISPATCH-NOOP-INVOKE-1` is merged and validated.

Required confirmation gate:

`REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTENT_JOB_QUEUE_DRY_RUN=true`

The persistent job queue dry-run may validate queue payload shape, idempotency key derivation, lease policy metadata, and artifact manifest placeholders for the three-tool external-agent lane.

It must not write a real persistent queue, claim worker leases, start worker processes, execute GStreamer, MKVToolNix, GPAC/MP4Box, Docker, FFmpeg/FFprobe, Remotion, private/user media, Supabase, SQL, providers, signed/public artifacts, final render/export, external beta expansion, paid production, or production.
