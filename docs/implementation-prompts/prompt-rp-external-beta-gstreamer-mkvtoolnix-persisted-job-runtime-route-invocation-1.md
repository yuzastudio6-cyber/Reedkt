# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-RUNTIME-ROUTE-INVOCATION-1

Use the job-service handoff from `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-RUNTIME-HANDOFF-1`.

Goal: invoke the generated-fixture runtime route from a persisted or mock job payload, only after the persisted handoff evidence proves approved snapshot, idempotency, job batch/job payload, no-spend policy, and safety gates.

Required boundaries: no private/user media, no arbitrary file path, no public URL, no signed URL source-of-truth, no provider/model calls, no FFmpeg/FFprobe, no final render/export, no paid production unlock, and no broad service-role handler.
