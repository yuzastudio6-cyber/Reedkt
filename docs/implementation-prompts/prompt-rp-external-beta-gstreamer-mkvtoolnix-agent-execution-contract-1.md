# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-CONTRACT-1

Implement a docs/status/diagnostics-only guarded external-agent execution contract for GStreamer and MKVToolNix.

Source-of-truth:

- `RP-EXTERNAL-BETA-TOOL-EXECUTION-READINESS-MATRIX-1`
- `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-ROLLUP-AFTER-GSTREAMER-MKVTOOLNIX-QA-1`
- `TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-GENERATED-PRIVATE-FIXTURE-QA-REVIEW-1`

Required decision:

`completed_gstreamer_mkvtoolnix_guarded_agent_execution_contract_ready_for_disabled_worker_scaffold`

The contract must remain planning-only. It must define approved snapshot input, approval record input, credit reservation or no-spend fixture policy, job ID, worker lease ID, idempotency key, private input manifest, command-template IDs, private artifact manifest, QA report, cleanup policy, audit events, failure categories, and retry policy.

Do not run GStreamer, MKVToolNix, FFmpeg/FFprobe, Docker, Remotion, Supabase, SQL, workers, routes, providers, media processing, signed/public artifacts, package installation, dependency mutation, beta unlock, production unlock, or final export.

Next gate after this contract: disabled worker scaffold and negative tests before any guarded execution attempt.
