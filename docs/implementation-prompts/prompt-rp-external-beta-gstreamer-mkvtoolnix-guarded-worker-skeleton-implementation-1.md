# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-SKELETON-IMPLEMENTATION-1

Implement only after `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ENQUEUE-IMPLEMENTATION-1` lands with decision `completed_gstreamer_mkvtoolnix_guarded_worker_enqueue_contract_ready_for_worker_skeleton_plan`.

Goal: add a disabled worker skeleton that can consume sanitized queue payload metadata and fail closed before runtime execution.

Required constraints:

- Preserve approved snapshot, approval record, credit/no-spend policy, job, disabled worker lease, route idempotency, command-template allowlist, private manifest, output manifest, QA, cleanup, retention, failure, and audit references.
- Worker skeleton must default disabled and must reject raw command strings, raw chat, frontend paths, public URL source-of-truth, signed URL source-of-truth, arbitrary private media, service-role secret payloads, broad service-role handlers, final render/export, and unlock attempts.
- No GStreamer or MKVToolNix execution is allowed in the skeleton packet.
- No FFmpeg/FFprobe, Docker, Remotion, Supabase, SQL, media processing, signed/public artifact, public beta expansion, paid production, production, or final delivery/export is allowed.

The next runtime packet must separately authorize a bounded confirmed worker execution path before any actual tool invocation.
