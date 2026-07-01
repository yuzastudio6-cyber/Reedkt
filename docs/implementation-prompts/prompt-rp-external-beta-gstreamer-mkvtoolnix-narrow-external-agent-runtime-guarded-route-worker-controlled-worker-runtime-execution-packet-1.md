# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-EXECUTION-PACKET-1

Continue only after `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-DISPATCH-DRY-RUN-1` is merged with decision `completed_gstreamer_mkvtoolnix_narrow_controlled_worker_dispatch_dry_run_metadata_only`.

Implement the next separately guarded runtime execution packet for the narrow local route/worker path. The packet must preserve the #2028 queue integration and this dispatch dry-run as source-of-truth and must require an explicit runtime confirmation gate before any worker claim or tool execution can be considered.

The next packet must name the exact route source, queue item, dispatch dry-run envelope, approved command template, input manifest, output manifest schema, QA schema, cleanup policy, retention policy, failure policy, retry policy, and non-public artifact policy.

Do not broaden scope to arbitrary media or broad external beta. Do not execute GStreamer/MKVToolNix unless the runtime packet itself supplies the explicit confirmation gate, generated/local bounded input, no-public-artifact policy, output manifest, QA report, cleanup proof, and safety scan. Do not run FFmpeg/FFprobe, Docker, Remotion, Supabase, SQL, providers, models, signed/public artifacts, paid production, or final delivery/export unless a later packet explicitly authorizes them.
