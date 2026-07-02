# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GENERATED-FIXTURE-QUEUED-JOB-TO-RUNTIME-ROUTE-INVOCATION-1

Use the approved-snapshot queue handoff source from `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GENERATED-FIXTURE-TO-APPROVED-SNAPSHOT-JOB-QUEUE-HANDOFF-1`.

Goal: consume the queued generated-fixture runtime route payload and invoke the existing guarded runtime route exactly once under explicit confirmation. The invocation must remain limited to generated SRT/subtitle-only MKV fixture evidence.

Required gates:

- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GENERATED_FIXTURE_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF=true`
- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE=true`

Do not broaden to private/user media, public URLs, signed URL sources, Supabase mutation, SQL execution, persistent queue writes, provider/model calls, FFmpeg/FFprobe, Docker push/deploy, Remotion, final render/export, internal beta unlock, external beta unlock, paid production unlock, or production unlock.
