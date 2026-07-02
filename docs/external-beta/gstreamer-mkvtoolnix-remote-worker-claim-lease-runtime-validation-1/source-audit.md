# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-REMOTE-WORKER-CLAIM-LEASE-RUNTIME-VALIDATION-1 Source Audit

Decision: `completed_gstreamer_mkvtoolnix_remote_worker_claim_lease_runtime_validation`

Execution: `completed_guarded_transaction_rolled_back_remote_worker_claim_lease_validation`

Source chain:

- #2132 records the persisted job runtime handoff QA source.
- #2137 records persisted job payload to runtime route invocation.
- #2139 records persisted route invocation QA evidence.
- #2142 records the local/mock persisted worker claim-lease boundary.
- #2144 records the local/mock worker claim-lease QA evidence.
- #2147 records the remote worker claim lease owner gate.
- #577 remains open/draft/blocked and excluded.

Repository rules checked:

- Workers/tools execute approved snapshots, not raw chat.
- Every work item needs an idempotency key and approved snapshot reference.
- Provider/tool execution is backend/worker only.
- Future backend/database uses the `reeditpro` Supabase project; Yuza Studio Supabase references are not source-of-truth.
- Supabase remote mutation is allowed only when an explicit milestone and confirmation gate names the target, scope, and rollback/cleanup behavior.

This packet adds and runs a confirmation-gated staging validation runner for the bounded worker claim-lease path. The runner does not dispatch a worker and does not execute GStreamer, MKVToolNix, FFmpeg/FFprobe, Docker, Remotion, providers, media processing, signed/public artifacts, final export, or beta/production unlock.
