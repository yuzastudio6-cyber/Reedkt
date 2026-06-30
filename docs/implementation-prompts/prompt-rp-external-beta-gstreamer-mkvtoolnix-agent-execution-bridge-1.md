# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-BRIDGE-1

Implement only after `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-IMPLEMENTATION-1` lands with decision `completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_controlled_generated_fixture`.

Build the bridge that lets an external agent request the bounded GStreamer/MKVToolNix tool path through approved snapshot, approval record, no-spend or reserved-credit policy, job, lease, idempotency, command-template allowlist, private manifest, output manifest, QA report, cleanup policy, retention policy, failure policy, and audit refs.

The bridge must remain disabled or confirmation-gated until all refs are present. It must not accept raw command strings, raw chat, arbitrary file paths, public URL source-of-truth, signed URL source-of-truth, arbitrary private media, FFmpeg/FFprobe expansion, Docker push/deploy, Remotion rendering, Supabase mutation, SQL, public artifacts, final render/export, broad external beta expansion, paid production, or production unlock.
