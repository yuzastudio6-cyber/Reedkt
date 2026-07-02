# External-Agent Handoff Contract

Allowed handoff class: `controlled_generated_fixture_runtime_only`

Approved route path for future guarded execution planning:

`/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute`

Required future confirmation gate:

`REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_CONTROLLED_GENERATED_FIXTURE_EXECUTION=true`

External-agent instructions:

1. Use only generated fixture inputs declared by the approved runtime packet.
2. Preserve the exact route path and accepted evidence chain in all reports.
3. Require a fresh run ID and write generated evidence under `/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-execution-1/<runId>/`.
4. Record report, manifest, runtime envelope, QA report, output manifest, file names, byte counts, and SHA-256 checksums.
5. Treat any private media, user media, public URL, signed URL, GCS/private artifact, final export, public artifact, Supabase mutation, SQL, broad service-role handler, FFmpeg/FFprobe, Docker push/deploy, or production unlock request as out of scope.
6. Fail closed if route registration, confirmation gate, fixture manifest, idempotency key, cleanup policy, or artifact manifest policy is missing.

This handoff does not execute the route, worker, GStreamer, MKVToolNix, FFmpeg/FFprobe, Docker, Supabase, SQL, provider, model, media processing, or final export path.
