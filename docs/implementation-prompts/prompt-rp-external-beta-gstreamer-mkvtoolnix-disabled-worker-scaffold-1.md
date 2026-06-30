# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-DISABLED-WORKER-SCAFFOLD-1

Implement a disabled worker scaffold and negative-test packet for the GStreamer/MKVToolNix guarded external-agent execution contract.

Source-of-truth:

- `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-CONTRACT-1`
- `RP-EXTERNAL-BETA-TOOL-EXECUTION-READINESS-MATRIX-1`
- `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-ROLLUP-AFTER-GSTREAMER-MKVTOOLNIX-QA-1`

Required decision:

`completed_gstreamer_mkvtoolnix_disabled_worker_scaffold_negative_tests_ready_for_guarded_worker_enablement_review`

The disabled scaffold must accept only the contract input shape, reject every missing or unsafe input with a named failure category, and keep tool execution disabled. Negative tests must prove no raw command string, unapproved command template, unmanifested media, public URL, signed URL, missing approved snapshot, missing approval record, missing worker lease, or missing idempotency key can pass.

Do not run GStreamer, MKVToolNix, FFmpeg/FFprobe, Docker, Remotion, Supabase, SQL, workers, routes, providers, media processing, signed/public artifacts, package installation, dependency mutation, beta unlock, production unlock, or final export.
