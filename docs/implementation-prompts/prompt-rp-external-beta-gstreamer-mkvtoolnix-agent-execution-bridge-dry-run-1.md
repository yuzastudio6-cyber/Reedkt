# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-BRIDGE-DRY-RUN-1

Use only after `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-BRIDGE-1` is merged with decision `completed_gstreamer_mkvtoolnix_agent_execution_bridge_ready_for_confirmation_gated_bridge_dry_run`.

Run a confirmation-gated bridge dry run using:

`REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_DRY_RUN=true`

The dry run may validate an external-agent request envelope through the backend-source bridge, but it must not execute a route, dispatch a worker, execute GStreamer, execute MKVToolNix, process private/user media, run FFmpeg/FFprobe, push/deploy Docker, run Remotion, mutate Supabase, run SQL, create signed/public artifacts, create final render/export, unlock broad external beta, unlock paid production, or unlock production.

The dry run must preserve approved snapshot, approval record, no-spend or reserved-credit policy, job, worker lease, idempotency, command-template allowlist, private manifest, output manifest, QA report, cleanup policy, retention policy, failure policy, and audit refs.
