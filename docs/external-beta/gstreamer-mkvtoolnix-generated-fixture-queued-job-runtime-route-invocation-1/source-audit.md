# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GENERATED-FIXTURE-QUEUED-JOB-TO-RUNTIME-ROUTE-INVOCATION-1 Source Audit

Decision: `completed_gstreamer_mkvtoolnix_generated_fixture_queued_job_to_runtime_route_invocation`

Execution: `completed_approved_snapshot_queued_job_payload_to_existing_generated_fixture_runtime_route_delegate`

This packet advances the GStreamer/MKVToolNix external-beta lane from approved-snapshot queue handoff to queued job runtime route invocation.

Source chain:

- #2113 route bridge merge SHA: `67602b088009779d45b0d1f26eabac65c48902fc`
- #2115 route bridge QA rollup merge SHA: `932cba325d9b82ea88bd2e753bb3ff92ad58cb78`
- #2120 approved-snapshot queue handoff merge SHA: `d197af4b7acdaa331782d9329ab41f306288045e`

The new invocation route consumes the local queue payload created by #2120 and delegates to the existing guarded runtime route body. It requires all three confirmation gates before the runtime delegate can run:

- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GENERATED_FIXTURE_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF=true`
- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GENERATED_FIXTURE_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION=true`
- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE=true`

`#577 open_draft_blocked_excluded` remains unrelated Remotion work and is not source-of-truth for this lane.

Product-ready end-to-end local OSS tools: `0`
