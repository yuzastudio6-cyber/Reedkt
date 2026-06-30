# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-CONFIRMED-WORKER-EXECUTION-DRY-RUN-1R

Retry the GStreamer/MKVToolNix confirmed worker execution dry run only after the execution environment already contains:

`REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_EXECUTION=true`

The retry must also name approved plan snapshot, approval record, credit reservation or no-spend fixture policy, worker lease, idempotency key, private input manifest with checksum, allowed command template, private output manifest, QA report, cleanup policy, retention policy, failure policy, and audit event references.

If the confirmation gate is still absent, record `blocked_missing_confirmation_gate` again and do not dispatch workers, execute routes, run GStreamer, run MKVToolNix, process media, run Docker, mutate Supabase, run SQL, create signed/public artifacts, unlock beta, unlock production, or export final delivery.
