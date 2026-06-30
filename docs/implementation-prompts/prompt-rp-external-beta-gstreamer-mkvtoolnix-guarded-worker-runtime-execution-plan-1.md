# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-PLAN-1

Implement only after `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-SKELETON-IMPLEMENTATION-1` lands with decision `completed_gstreamer_mkvtoolnix_guarded_worker_skeleton_ready_for_runtime_execution_plan`.

Goal: define the bounded confirmed runtime execution plan for the GStreamer/MKVToolNix external-beta worker lane.

Required constraints:

- Preserve approved snapshot, approval record, credit/no-spend policy, job, lease, idempotency, command-template allowlist, private manifest, output manifest, QA, cleanup, retention, failure, and audit references.
- Require an explicit confirmation gate before any runtime invocation.
- Keep execution limited to approved generated/private fixture scope and declared command templates only.
- Continue to reject raw command strings, raw chat, frontend paths, public URL source-of-truth, signed URL source-of-truth, arbitrary private media, service-role secret payloads, broad service-role handlers, final render/export, and unlock attempts.
- Do not enable broad external beta, paid production, production, public artifacts, signed URLs as source-of-truth, Supabase mutation, SQL, FFmpeg/FFprobe expansion, Docker deployment, Remotion rendering, or arbitrary media processing.

This prompt may plan a confirmed worker runtime path, but it must not silently expand into production or final delivery.
