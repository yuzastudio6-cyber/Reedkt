# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ENQUEUE-IMPLEMENTATION-1

Implement only after `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-IMPLEMENTATION-1` lands with decision `completed_gstreamer_mkvtoolnix_guarded_worker_route_implementation_negative_tests_ready_for_worker_enqueue_plan`.

Goal: add the next fail-closed worker enqueue contract for the GStreamer/MKVToolNix route envelope.

Required constraints:

- Preserve backend-service-role ownership.
- Preserve approved snapshot, approval record, credit/no-spend policy, job, disabled worker lease, route idempotency, private manifest, output manifest, QA, cleanup, retention, failure, and audit references.
- Preserve command-template allowlist only.
- Reject raw command strings, raw chat, frontend paths, public URL source-of-truth, signed URL source-of-truth, arbitrary private media, service-role secret payloads, broad service-role handlers, final render/export, and unlock attempts.
- Keep worker execution, route execution, GStreamer execution, MKVToolNix execution, FFmpeg/FFprobe execution, Docker execution, Remotion execution, media processing, Supabase mutation, SQL execution, signed/public artifacts, and dependency mutation disabled unless a later explicit confirmed runtime packet authorizes a bounded operation.

Do not run GStreamer, MKVToolNix, FFmpeg/FFprobe, Docker, Remotion, workers, routes, providers, Supabase, SQL, media processing, signed/public artifacts, public beta expansion, paid production, production, or final delivery/export in this enqueue-contract phase.
