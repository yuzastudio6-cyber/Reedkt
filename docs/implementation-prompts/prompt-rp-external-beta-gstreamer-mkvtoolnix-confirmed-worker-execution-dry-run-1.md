# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-CONFIRMED-WORKER-EXECUTION-DRY-RUN-1

Attempt the GStreamer/MKVToolNix confirmed worker execution dry run only if all of the following are true:

- `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-CONFIRMATION-GATED-WORKER-EXECUTION-PLAN-1` is merged and current.
- The operator explicitly provides `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_EXECUTION=true` in the execution environment.
- Approved plan snapshot, approval record, credit reservation or no-spend fixture policy, worker lease, idempotency key, private input manifest with checksum, allowed command template, private output manifest, QA report, cleanup policy, retention policy, failure policy, and audit event references are named.

The dry run must fail closed with `blocked_missing_confirmation_gate` when the confirmation gate is absent. It must not accept raw command strings, public URL sources, signed URL sources of truth, arbitrary private media, unmanifested files, frontend service-role credentials, provider/model prompt payloads, or service-role secret payloads.

Do not unlock broad external beta, paid production, production, final export, public artifacts, signed URLs, or arbitrary media processing from this dry run.
