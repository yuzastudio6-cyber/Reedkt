# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-DRY-RUN-1

Implement only after `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-PLAN-1` lands with decision `completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_plan_ready_for_confirmed_worker_runtime_dry_run`.

Run the bounded runtime dry run only when this confirmation gate is explicitly present:

`REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_RUNTIME_DRY_RUN=true`

The dry run must use the current guarded chain: backend service-role-only route contract, mock enqueue contract, disabled worker skeleton metadata contract, approved snapshot, approval record, credit/no-spend policy, job, lease, idempotency, command-template allowlist, private manifest, output manifest, QA report, cleanup, retention, failure, and audit refs.

Allowed command-template ids only:

- `gst_fakesrc_fakesink_no_media_healthcheck_v1`
- `gst_controlled_generated_fixture_pipeline_v1`
- `mkvmerge_generated_subtitle_only_package_v1`
- `mkvmerge_identify_generated_subtitle_only_v1`

Record sanitized local/private evidence only: run id, worker envelope summary, command-template ids, exit statuses, bounded stdout/stderr snippets, manifest/report file names, byte counts, SHA-256 checksums, cleanup result, and failure category if blocked.

Do not run arbitrary user media, public URL sources, signed URL sources-of-truth, FFmpeg/FFprobe expansion, Docker deployment, Remotion rendering, Supabase mutation, SQL, public artifacts, final render/export, broad external beta, paid production, or production unlock.
