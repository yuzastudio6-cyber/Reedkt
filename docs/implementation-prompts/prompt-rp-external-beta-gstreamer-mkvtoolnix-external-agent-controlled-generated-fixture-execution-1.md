# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-CONTROLLED-GENERATED-FIXTURE-EXECUTION-1

Use only after `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-CONTROLLED-GENERATED-FIXTURE-HANDOFF-1` is merged with decision `completed_external_agent_controlled_generated_fixture_handoff_ready_for_guarded_execution`.

Execution must require `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_CONTROLLED_GENERATED_FIXTURE_EXECUTION=true`.

The execution packet may run only the existing controlled generated fixture route path `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute` and must write local `/tmp` evidence with report, runtime envelope, output manifest, QA report, manifest, byte counts, SHA-256 checksums, cleanup status, and safety flags. It must not use arbitrary private media, user media, public URLs, signed URL source-of-truth, GCS/private artifacts, broad service-role handlers, public artifacts, final delivery/export, broad external beta, paid production, or production unlock.
