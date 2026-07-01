# Worker Runtime Handoff Contract

Decision: `completed_gstreamer_mkvtoolnix_guarded_worker_runtime_handoff_ready_for_post_dispatch_runtime_execution_packet`

Execution: `completed_docs_only_worker_runtime_handoff_no_worker_or_tool_execution`

Accepted source envelope:

| Field | Value |
| --- | --- |
| Worker-dispatch metadata envelope | `completed_guarded_local_mock_worker_dispatch_metadata_envelope` |
| Worker-dispatch metadata status | `accepted_guarded_local_mock_worker_dispatch_metadata_only` |
| Dispatch dry-run status | `dispatched_controlled_worker_dispatch_dry_run_metadata_only` |
| Worker runtime mode from dispatch source | `dry_run_no_worker_claim` |
| Queue ID | `queue-gstreamer-mkvtoolnix-agent-controlled-worker-queue-1` |
| Local mock queue item | `mock-job-runtime-queue-item-0001` |
| Queue status | `queued` |
| Approved snapshot ID | `approved-snapshot-agent-controlled-dispatch-1` |
| Approval record ID | `approval-record-agent-controlled-dispatch-1` |
| Job ID | `job-agent-controlled-dispatch-1` |
| Worker lease ID | `worker-lease-agent-controlled-dispatch-1` |
| Command template ID | `gst_controlled_generated_fixture_pipeline_v1` |
| Private input manifest SHA-256 | `4d25de887e43dec0f54b27f71d8c670d430088d8883fa4cc0b103d15dfdef357` |
| Output manifest schema ID | `output-manifest-schema-agent-controlled-dispatch-1` |
| QA report schema ID | `qa-report-schema-agent-controlled-dispatch-1` |
| Cleanup policy ID | `cleanup-policy-agent-controlled-dispatch-1` |
| Retention policy ID | `retention-policy-agent-controlled-dispatch-1` |
| Failure policy ID | `failure-policy-agent-controlled-dispatch-1` |

Future runtime packet requirements:

- Required next packet: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-PACKET-2`
- Required future confirmation gate: `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_POST_DISPATCH_WORKER_RUNTIME_EXECUTION=true`
- The future packet must name the exact approved snapshot, approval record, job, worker lease, command template, private input manifest checksum, output manifest schema, QA report schema, cleanup policy, retention policy, and failure policy.
- The future packet must explicitly decide whether it is metadata-only, generated-fixture runtime-only, or real worker runtime. No raw command strings may be accepted from callers.
- The future packet must keep public artifacts, signed URLs, Supabase mutation, SQL execution, broad external beta unlock, paid production unlock, production unlock, and final render/export blocked unless separately approved by a later source-of-truth packet.

Runtime handoff status: `ready_for_confirmation_gated_post_dispatch_worker_runtime_execution_packet`
