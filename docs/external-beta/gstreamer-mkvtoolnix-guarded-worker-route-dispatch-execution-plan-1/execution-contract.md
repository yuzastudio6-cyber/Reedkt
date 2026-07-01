# Guarded Worker Route Dispatch Execution Contract

Future execution packet name: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-DISPATCH-EXECUTION-PACKET-1`

Future confirmation gate: `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_ROUTE_DISPATCH_EXECUTION=true`

Required input references for the next packet:

- `approved-snapshot-agent-controlled-dispatch-1`
- `approval-record-agent-controlled-dispatch-1`
- `no-spend-fixture-policy-agent-controlled-dispatch-1`
- `job-agent-controlled-dispatch-1`
- `worker-lease-agent-controlled-dispatch-1`
- `route-dispatch-execution-idempotency-key-agent-controlled-dispatch-1`
- `gstreamer-mkvtoolnix:agent-controlled-dispatch-1:approved-snapshot:job:template`
- `gstreamer-mkvtoolnix:guarded-route-dispatch-execution-1:approved-snapshot-agent-controlled-dispatch-1:job-agent-controlled-dispatch-1`
- `private-input-manifest-agent-controlled-dispatch-1`
- `output-manifest-schema-agent-controlled-dispatch-1`
- `qa-report-schema-agent-controlled-dispatch-1`
- `cleanup-policy-agent-controlled-dispatch-1`
- `retry-policy-agent-controlled-dispatch-1`
- `non-public-artifact-policy-agent-controlled-dispatch-1`

Allowed command templates for future validation metadata only:

- `gst_fakesrc_fakesink_no_media_healthcheck_v1`
- `gst_controlled_generated_fixture_pipeline_v1`
- `mkvmerge_generated_subtitle_only_package_v1`
- `mkvmerge_identify_generated_subtitle_only_v1`

The next packet must not pass raw command strings, arbitrary user media, public URLs, signed URLs, GCS/private artifacts, unapproved media sources, or unchecked manifests into a worker path. The next packet must preserve idempotency, approved-snapshot references, no-spend policy, private artifact policy, output manifest schema, QA report schema, cleanup policy, and retry policy.

Required blocker categories for the next packet:

- `blocked_missing_route_dispatch_execution_confirmation_gate`
- `blocked_missing_backend_service_role_context`
- `blocked_missing_approved_plan_snapshot`
- `blocked_missing_approval_record`
- `blocked_missing_credit_or_no_spend_policy`
- `blocked_missing_job_reference`
- `blocked_missing_worker_lease_reference`
- `blocked_missing_route_dispatch_execution_idempotency_key`
- `blocked_unapproved_command_template`
- `blocked_raw_command_string`
- `blocked_missing_private_input_manifest`
- `blocked_manifest_checksum_mismatch`
- `blocked_unapproved_media_source`
- `blocked_public_or_signed_url_source`
- `blocked_unexpected_worker_process_start`
- `blocked_unexpected_worker_lease_claim`
- `blocked_unexpected_persistent_queue_write`
- `blocked_unexpected_tool_execution`
- `blocked_unexpected_media_processing_scope`
- `blocked_output_manifest_missing`
- `blocked_qa_report_missing`
- `blocked_cleanup_policy_missing`
- `blocked_delivery_or_unlock_attempt`
