# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-CONTROLLED-WORKER-DISPATCH-DRY-RUN-1

Use only after `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-CONTROLLED-WORKER-QUEUE-INTEGRATION-1` is merged with decision `completed_gstreamer_mkvtoolnix_agent_controlled_worker_queue_integration_metadata_only`.

The next packet may plan or implement a confirmation-gated worker-dispatch dry run for the queued local mock metadata. It must preserve the approved snapshot, approval record, no-spend or reserved-credit policy, job, lease, route idempotency, dispatch idempotency, queue idempotency, command-template allowlist, private input manifest, output manifest schema, QA report schema, cleanup policy, retention policy, failure policy, retry policy, non-public artifact policy, audit refs, and runtime evidence references.

The worker-dispatch dry run must fail closed unless it has an explicit confirmation gate. It must not execute GStreamer, execute MKVToolNix, process media, call FFmpeg/FFprobe, use Docker push/deploy, render Remotion, mutate Supabase, run SQL, create signed/public artifacts, unlock broad external beta, unlock paid production, unlock production, or final render/export.

Any actual GStreamer/MKVToolNix tool execution remains a separate guarded worker runtime packet with exact generated/private fixture scope, artifact manifest, QA report, cleanup policy, and non-public artifact policy.
