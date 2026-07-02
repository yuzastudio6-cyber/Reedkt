# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-CONTROLLED-GENERATED-FIXTURE-CONFIRMED-EXECUTION-1

Use only after `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-CONTROLLED-GENERATED-FIXTURE-EXECUTION-1` records `blocked_pending_gstreamer_mkvtoolnix_external_agent_controlled_generated_fixture_execution_confirmation`.

Run exactly one confirmed execution only when this gate is explicitly present:

`REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_CONTROLLED_GENERATED_FIXTURE_EXECUTION=true`

Allowed route path:

`/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute`

Allowed execution class: `controlled_generated_fixture_runtime_only`

The confirmed run must write local evidence under `/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-execution-1/<runId>/` with report, runtime envelope, output manifest, QA report, manifest, byte counts, SHA-256 checksums, cleanup status, and safety flags.

The confirmed run must not use arbitrary private media, user media, public URLs, signed URL source-of-truth, GCS/private artifacts, broad service-role handlers, public artifacts, final delivery/export, broad external beta, paid production, production unlock, FFmpeg/FFprobe, Docker push/deploy, Supabase mutation, SQL execution, or provider/model calls.
